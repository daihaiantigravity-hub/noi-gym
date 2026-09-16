import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const defaults = {
  input: path.join(projectRoot, "scripts", "migration", "data", "musclewiki-biceps-dumbbells.json"),
  checkpoint: path.join(projectRoot, "scripts", "migration", "data", "musclewiki-biceps-dumbbells.checkpoint.json"),
  output: path.join(projectRoot, "scripts", "migration", "data", "musclewiki-exercises-collected.json"),
  primaryMuscle: "Biceps",
  equipment: "Dumbbells",
};

function parseArgs(argv) {
  const options = { ...defaults };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const next = argv[index + 1];
    if (["--input", "--checkpoint", "--output", "--primary-muscle", "--equipment"].includes(argument)) {
      if (!next) throw new Error(`${argument} cần một giá trị`);
      const key = {
        "--input": "input",
        "--checkpoint": "checkpoint",
        "--output": "output",
        "--primary-muscle": "primaryMuscle",
        "--equipment": "equipment",
      }[argument];
      options[key] = next;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  for (const key of ["input", "checkpoint", "output"]) {
    options[key] = path.isAbsolute(options[key]) ? options[key] : path.resolve(projectRoot, options[key]);
  }
  return options;
}

const clean = (value) => String(value ?? "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();

function stableSourceId(sourceUrl) {
  const digest = crypto.createHash("sha256").update(sourceUrl).digest("hex").slice(0, 12);
  return Number.parseInt(digest, 16) + 1;
}

function extractSteps(cardText, fallback = []) {
  const text = clean(cardText);
  const steps = [...text.matchAll(/(?:^|\s)\d+[.)]?\s+(.+?)(?=\s+\d+[.)]?\s+|$)/g)]
    .map((match) => clean(match[1]).replace(/\s+Remove Ads(?:\s+Remove Ads)*$/i, ""))
    .filter(Boolean);
  const values = steps.length ? steps : fallback;
  return [...new Set(values.map(clean).filter((value) => value && !/^\/?(?:Exercises|Biceps|Dumbbell Curl)$/i.test(value)))];
}

function convertMedia(media) {
  return (Array.isArray(media) ? media : [])
    .filter((item) => item?.type === "video" && item.url)
    .map((item) => ({
      gender: "male",
      angle: /-side(?:[_./?]|$)/i.test(item.url) ? "side" : "front",
      url: item.url,
    }));
}

const options = parseArgs(process.argv.slice(2));
const migrationRecords = JSON.parse(fs.readFileSync(options.input, "utf8"));
const checkpoint = fs.existsSync(options.checkpoint)
  ? JSON.parse(fs.readFileSync(options.checkpoint, "utf8"))
  : { candidates: [] };
const checkpointByUrl = new Map((checkpoint.candidates ?? []).map((candidate) => [candidate.sourceUrl, candidate]));
const seenIds = new Map();

const results = migrationRecords.map((record) => {
  const sourceUrl = record.sourceUrl;
  const sourceId = stableSourceId(sourceUrl);
  const duplicate = seenIds.get(sourceId);
  if (duplicate && duplicate !== sourceUrl) throw new Error(`sourceId collision: ${duplicate} and ${sourceUrl}`);
  seenIds.set(sourceId, sourceUrl);

  const candidate = checkpointByUrl.get(sourceUrl);
  const steps = extractSteps(candidate?.cardText || record.cardText, record.instructions);
  return {
    id: sourceId,
    name: record.name,
    primary_muscles: record.primaryMuscle ? [record.primaryMuscle] : [options.primaryMuscle],
    category: record.equipment || options.equipment,
    force: record.force || "",
    grips: record.grip || "",
    mechanic: record.mechanic || "",
    difficulty: record.difficulty || "",
    steps,
    videos: convertMedia(record.media),
    source_url: sourceUrl,
  };
});

const payload = {
  total: results.length,
  limit: results.length,
  offset: 0,
  count: results.length,
  results,
};

fs.writeFileSync(options.output, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputPath: options.output, records: results.length, withSteps: results.filter((record) => record.steps.length > 0).length, withVideos: results.filter((record) => record.videos.length > 0).length }, null, 2));
