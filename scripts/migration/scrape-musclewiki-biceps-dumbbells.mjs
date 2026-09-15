import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const defaultOutputPath = path.join(projectRoot, "scripts", "migration", "data", "musclewiki-biceps-dumbbells.json");
const defaultCheckpointPath = path.join(
  projectRoot,
  "scripts",
  "migration",
  "data",
  "musclewiki-biceps-dumbbells.checkpoint.json",
);
const defaultDebugReportPath = path.join(projectRoot, "scripts", "migration", "debug", "dumbbell-curl-media.json");

const startUrl = "https://musclewiki.com/exercises/biceps/dumbbells";
const defaultProfileDir = path.join(projectRoot, "scripts", "migration", "browser-profile", "musclewiki");
const navigationTimeoutMs = 60_000;
const networkIdleTimeoutMs = 10_000;
const manualVerificationPollMs = 10_000;
const minDelayMs = 800;
const maxDelayMs = 1_400;
const checkpointVersion = 1;
const supportedDetailFields = new Set(["secondaryMuscles", "force", "grip", "mechanic"]);
const sourceMetadata = { primaryMuscle: "Biceps", equipment: "Dumbbells" };

class AccessRestrictedError extends Error {
  constructor(message) {
    super(message);
    this.name = "AccessRestrictedError";
  }
}

function parseArgs(argv) {
  const options = {
    outputPath: defaultOutputPath,
    checkpointPath: defaultCheckpointPath,
    profileDir: defaultProfileDir,
    startUrl,
    fresh: false,
    browserMode: false,
    detailFields: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--fresh") {
      options.fresh = true;
      continue;
    }

    if (argument === "--browser") {
      options.browserMode = true;
      continue;
    }

    if (argument === "--output" || argument === "--checkpoint" || argument === "--start-url" || argument === "--profile-dir" || argument === "--detail-fields") {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a value`);
      index += 1;
      if (argument === "--output") options.outputPath = path.resolve(value);
      if (argument === "--checkpoint") options.checkpointPath = path.resolve(value);
      if (argument === "--start-url") options.startUrl = value;
      if (argument === "--profile-dir") options.profileDir = path.resolve(value);
      if (argument === "--detail-fields") {
        options.detailFields = [...new Set(value.split(",").map((field) => field.trim()).filter(Boolean))];
        const unsupportedFields = options.detailFields.filter((field) => !supportedDetailFields.has(field));
        if (unsupportedFields.length) throw new Error(`Unsupported detail field(s): ${unsupportedFields.join(", ")}`);
      }
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJsonAtomically(filePath, value) {
  ensureParentDirectory(filePath);
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  try {
    fs.renameSync(temporaryPath, filePath);
  } catch (error) {
    if (error?.code !== "EPERM" && error?.code !== "EEXIST") throw error;
    fs.rmSync(filePath, { force: true });
    fs.renameSync(temporaryPath, filePath);
  }
}

function readJsonIfPresent(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function randomDelay() {
  return minDelayMs + Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1));
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => cleanText(value)).filter(Boolean))];
}

function canonicalizeUrl(value, baseUrl) {
  if (!value) return null;

  try {
    const url = new URL(value, baseUrl);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function isExerciseDetailUrl(value, baseUrl) {
  try {
    return /^\/exercise\/[^/]+\/?$/i.test(new URL(value, baseUrl).pathname);
  } catch {
    return false;
  }
}

function normalizeValue(value) {
  return cleanText(value)
    .replace(/^[:\-–—]+\s*/, "")
    .replace(/[|•]+/g, ",")
    .trim();
}

function valueFromCandidates(candidates, lines, labels) {
  const normalizedLabels = labels.map((label) => label.toLowerCase());

  for (const candidate of candidates) {
    const candidateLabel = cleanText(candidate.label).toLowerCase().replace(/:$/, "");
    if (!normalizedLabels.includes(candidateLabel)) continue;
    const value = normalizeValue(candidate.value);
    if (value) return value;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = cleanText(lines[index]);
    if (!line) continue;

    const labelPattern = normalizedLabels
      .sort((left, right) => right.length - left.length)
      .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const sameLine = line.match(new RegExp(`^\\s*(?:${labelPattern})\\s*:?[ \\t]+(.+?)\\s*$`, "i"));
    if (sameLine?.[1]) return normalizeValue(sameLine[1]);

    const labelOnly = line.match(new RegExp(`^\\s*(?:${labelPattern})\\s*:?\\s*$`, "i"));
    if (labelOnly && lines[index + 1]) return normalizeValue(lines[index + 1]);
  }

  return "";
}

function splitListValue(value) {
  if (!value || /^(none|n\/a|not available)$/i.test(value)) return [];
  return uniqueStrings(
    value
      .split(/\s*(?:,|\/|;|\||•|\band\b)\s*/i)
      .map((item) => item.replace(/^[-–—*•]\s*/, ""))
      .filter(Boolean),
  );
}

function pickKnownValue(value, allowedValues) {
  const normalized = cleanText(value).toLowerCase();
  return allowedValues.find((allowedValue) => normalized.includes(allowedValue.toLowerCase())) ?? null;
}

function mediaTypeFromUrl(value, fallback = "image") {
  if (/\.(?:mp4|webm|mov|m3u8)(?:$|[?#])/i.test(value)) return "video";
  if (/\.gif(?:$|[?#])/i.test(value)) return "animated-image";
  return fallback;
}

function isIgnoredMediaUrl(value) {
  return !value ||
    /^(?:data:|blob:|about:|javascript:)/i.test(value) ||
    /(?:logo|qr[-_ ]?code|muscle[-_ ]?map|advert|advertisement|banner|tracking|pixel|ezoic|doubleclick|googlesyndication|adservice)/i.test(value);
}

function normalizeMediaItems(values) {
  const seen = new Set();
  const items = [];
  for (const value of Array.isArray(values) ? values : []) {
    const url = typeof value === "string" ? value : value?.url;
    if (isIgnoredMediaUrl(url) || seen.has(url)) continue;
    seen.add(url);
    items.push({
      type: typeof value === "string" ? mediaTypeFromUrl(url) : value.type || mediaTypeFromUrl(url),
      url,
    });
  }
  return items.map((item, index) => ({ index: index + 1, ...item }));
}

function listingRecordFromCandidate(candidate) {
  const media = normalizeMediaItems([
    ...(Array.isArray(candidate.media) ? candidate.media : []),
    ...(Array.isArray(candidate.images) ? candidate.images.map((url) => ({ type: "image", url })) : []),
  ]);
  return {
    name: candidate.name,
    sourceUrl: candidate.sourceUrl,
    difficulty: pickKnownValue(candidate.difficulty, ["Beginner", "Novice", "Intermediate", "Advanced"]),
    instructions: uniqueStrings(candidate.instructions),
    images: media.filter((item) => item.type !== "video").map((item) => item.url),
    media,
    primaryMuscle: sourceMetadata.primaryMuscle,
    secondaryMuscles: Array.isArray(candidate.secondaryMuscles) ? uniqueStrings(candidate.secondaryMuscles) : [],
    force: pickKnownValue(candidate.force, ["Push", "Pull", "Hold"]),
    grip: pickKnownValue(candidate.grip, ["Mixed", "Neutral", "None", "Overhand", "Underhand"]),
    mechanic: pickKnownValue(candidate.mechanic, ["Compound", "Isolation"]),
  };
}

function mergeCachedRecord(listingRecord, cachedRecord) {
  if (!cachedRecord) return listingRecord;
  return {
    ...listingRecord,
    difficulty: listingRecord.difficulty || cachedRecord.difficulty || null,
    instructions: listingRecord.instructions.length
      ? listingRecord.instructions
      : uniqueStrings(Array.isArray(cachedRecord.instructions) ? cachedRecord.instructions : []),
    images: uniqueStrings([...listingRecord.images, ...(Array.isArray(cachedRecord.images) ? cachedRecord.images : [])]),
    media: normalizeMediaItems([...listingRecord.media, ...(Array.isArray(cachedRecord.media) ? cachedRecord.media : []), ...(Array.isArray(cachedRecord.images) ? cachedRecord.images : [])]),
    secondaryMuscles: listingRecord.secondaryMuscles.length
      ? listingRecord.secondaryMuscles
      : uniqueStrings(Array.isArray(cachedRecord.secondaryMuscles) ? cachedRecord.secondaryMuscles : []),
    force: listingRecord.force || cachedRecord.force || null,
    grip: listingRecord.grip || cachedRecord.grip || null,
    mechanic: listingRecord.mechanic || cachedRecord.mechanic || null,
  };
}

function hasDetailField(record, field) {
  if (field === "secondaryMuscles") return record.secondaryMuscles.length > 0;
  return Boolean(record[field]);
}

function needsDetailPage(record, detailFields) {
  return record.media.length < 2 || detailFields.some((field) => !hasDetailField(record, field));
}

function logMediaDiagnostics(record) {
  console.log(record.name);
  console.log(`media elements found: ${record.media.length}`);
  record.media.forEach((item, index) => {
    console.log(`media ${index + 1}: ${item.type} -> ${item.url}`);
  });
  if (!record.media.length) console.warn(`WARNING: no demonstration media found for ${record.name}`);
}

function normalizeExerciseRecord(candidate, detail, listingRecord) {
  const primaryMuscle = valueFromCandidates(detail.fields, detail.lines, [
    "primary muscle",
    "primary muscles",
    "target muscle",
    "target muscles",
  ]) || listingRecord.primaryMuscle;
  const secondaryValue = valueFromCandidates(detail.fields, detail.lines, [
    "secondary muscle",
    "secondary muscles",
    "synergist",
    "synergists",
  ]);
  const difficulty = pickKnownValue(
    valueFromCandidates(detail.fields, detail.lines, ["difficulty", "level"]),
    ["Beginner", "Novice", "Intermediate", "Advanced"],
  ) || listingRecord.difficulty;
  const force = pickKnownValue(valueFromCandidates(detail.fields, detail.lines, ["force"]), ["Push", "Pull", "Hold"]) || listingRecord.force;
  const grip = pickKnownValue(valueFromCandidates(detail.fields, detail.lines, ["grip", "grips"]), [
    "Mixed",
    "Neutral",
    "None",
    "Overhand",
    "Underhand",
  ]) || listingRecord.grip;
  const mechanic = pickKnownValue(valueFromCandidates(detail.fields, detail.lines, ["mechanic", "mechanics"]), [
    "Compound",
    "Isolation",
  ]) || listingRecord.mechanic;
  const media = normalizeMediaItems([...listingRecord.media, ...(Array.isArray(detail.media) ? detail.media : []), ...(Array.isArray(detail.images) ? detail.images : [])]);

  return {
    ...listingRecord,
    name: detail.name || listingRecord.name,
    difficulty,
    instructions: detail.instructions.length ? uniqueStrings(detail.instructions) : listingRecord.instructions,
    images: media.filter((item) => item.type !== "video").map((item) => item.url),
    media,
    primaryMuscle,
    secondaryMuscles: secondaryValue ? splitListValue(secondaryValue) : listingRecord.secondaryMuscles,
    force,
    grip,
    mechanic,
  };
}

function makeInitialCheckpoint(options) {
  return {
    version: checkpointVersion,
    source: options.startUrl,
    status: "in-progress",
    listingDone: false,
    nextPageUrl: options.startUrl,
    pages: [],
    candidates: [],
    records: [],
    processedDetailUrls: [],
    verification: null,
    error: null,
    updatedAt: new Date().toISOString(),
  };
}

function saveCheckpoint(filePath, checkpoint) {
  checkpoint.updatedAt = new Date().toISOString();
  writeJsonAtomically(filePath, checkpoint);
}

function accessRestrictionReason(status, pageInfo) {
  const body = cleanText(pageInfo.bodyText).toLowerCase();
  const title = cleanText(pageInfo.title).toLowerCase();
  const blockText = [
    "sorry, you have been blocked",
    "attention required",
    "verify you are human",
    "checking your browser",
    "access denied",
    "captcha",
    "security service",
    "ray id",
  ];

  if ([401, 403, 429].includes(status)) return `HTTP ${status}`;
  if (blockText.some((phrase) => body.includes(phrase) || title.includes(phrase))) return "access restriction page";
  return null;
}

async function inspectNavigation(page, url) {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: navigationTimeoutMs,
  });
  await page.waitForLoadState("networkidle", { timeout: networkIdleTimeoutMs }).catch(() => undefined);
  await page.waitForTimeout(250);

  const pageInfo = await page.evaluate(() => ({
    title: document.title,
    bodyText: document.body?.innerText?.slice(0, 20_000) ?? "",
  }));
  const status = response?.status() ?? 0;
  return {
    response,
    status,
    pageInfo,
    restriction: accessRestrictionReason(status, pageInfo),
  };
}

async function gotoAndValidate(page, url, kind) {
  const result = await inspectNavigation(page, url);
  if (result.restriction) {
    throw new AccessRestrictedError(
      `MuscleWiki blocked the ${kind} request (${result.restriction}). The scraper stops without attempting to bypass CAPTCHA, anti-bot, or access restrictions.`,
    );
  }

  if (result.response && !result.response.ok()) throw new Error(`MuscleWiki returned HTTP ${result.status} for ${url}`);
  return result.response;
}

async function waitForManualVerification(context, page, url, kind, requiresExerciseCards) {
  let initialResult;
  try {
    initialResult = await inspectNavigation(page, url);
  } catch (error) {
    initialResult = { restriction: error instanceof Error ? error.message : String(error) };
  }

  let listing = null;
  if (!initialResult.restriction && (!initialResult.response || initialResult.response.ok())) {
    listing = requiresExerciseCards ? await extractListingPage(page) : null;
    if (!requiresExerciseCards || listing.cards.length > 0) return listing;
  }

  console.log("MuscleWiki requires manual browser verification.");
  const probePage = await context.newPage();
  try {
    while (true) {
      await sleep(manualVerificationPollMs);

      let probeResult;
      try {
        probeResult = await inspectNavigation(probePage, url);
      } catch {
        continue;
      }

      if (probeResult.restriction || (probeResult.response && !probeResult.response.ok())) continue;
      const probeListing = requiresExerciseCards ? await extractListingPage(probePage) : null;
      if (requiresExerciseCards && probeListing.cards.length === 0) continue;

      let primaryResult;
      try {
        primaryResult = await inspectNavigation(page, url);
      } catch {
        continue;
      }
      if (primaryResult.restriction || (primaryResult.response && !primaryResult.response.ok())) continue;

      const primaryListing = requiresExerciseCards ? await extractListingPage(page) : null;
      if (requiresExerciseCards && primaryListing.cards.length === 0) continue;
      return primaryListing;
    }
  } finally {
    await probePage.close();
  }
}

async function waitForBrowserAccess(context, page, url, kind, requiresExerciseCards, checkpoint, checkpointPath) {
  checkpoint.status = "awaiting-manual-verification";
  checkpoint.verification = { kind, url };
  saveCheckpoint(checkpointPath, checkpoint);
  try {
    return await waitForManualVerification(context, page, url, kind, requiresExerciseCards);
  } finally {
    checkpoint.status = "in-progress";
    checkpoint.verification = null;
    saveCheckpoint(checkpointPath, checkpoint);
  }
}

async function prepareListingCardMedia(page) {
  const anchors = page.locator("a[href]");
  const count = await anchors.count();
  for (let index = 0; index < count; index += 1) {
    const anchor = anchors.nth(index);
    const href = await anchor.getAttribute("href");
    const sourceUrl = canonicalizeUrl(href, page.url());
    if (!sourceUrl || !isExerciseDetailUrl(sourceUrl, page.url())) continue;

    const card = anchor.locator("xpath=ancestor::*[self::article or self::li or contains(translate(@class, 'CARD', 'card'), 'card')][1]");
    if (await card.count()) {
      await card.first().scrollIntoViewIfNeeded().catch(() => undefined);
    } else {
      await anchor.scrollIntoViewIfNeeded().catch(() => undefined);
    }
    await page.waitForTimeout(300);
    await page.waitForFunction(
      (detailUrl) => {
        const anchorElement = [...document.querySelectorAll("a[href]")].find((element) => {
          try {
            return new URL(element.href, location.href).toString().replace(/\/$/, "") === detailUrl;
          } catch {
            return false;
          }
        });
        if (!anchorElement) return false;
        const cardElement = anchorElement.closest("article, li, [class*='card' i]") || anchorElement;
        return Boolean(cardElement.querySelector("video, img, picture, source"));
      },
      sourceUrl,
      { timeout: 2_000 },
    ).catch(() => undefined);
  }
}

async function prepareDetailMedia(page) {
  const media = page.locator("main video, main img, main picture, main source, video, img, picture, source").first();
  await media.scrollIntoViewIfNeeded().catch(() => undefined);
  await page.waitForTimeout(300);
  await page.waitForFunction(
    () => Boolean(document.querySelector("main video, main img, main picture, main source, video, img, picture, source")),
    { timeout: 3_000 },
  ).catch(() => undefined);
}

async function extractListingPage(page) {
  await prepareListingCardMedia(page);
  return page.evaluate(() => {
    const clean = (value) => String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    const absoluteUrl = (value) => {
      try {
        return new URL(value, location.href).toString();
      } catch {
        return null;
      }
    };
    const isDetail = (value) => {
      try {
        return /^\/exercise\/[^/]+\/?$/i.test(new URL(value, location.href).pathname);
      } catch {
        return false;
      }
    };
    const ignoreMediaUrl = (value) => !value || /^(?:data:|blob:|about:|javascript:)/i.test(value) || /(?:logo|qr[-_ ]?code|muscle[-_ ]?map|advert|advertisement|banner|tracking|pixel|ezoic|doubleclick|googlesyndication|adservice)/i.test(value);
    const firstSrcsetUrl = (element) => {
      if (!element) return "";
      const srcset = element.getAttribute("srcset") || element.getAttribute("data-srcset") || "";
      return srcset.split(",").map((value) => value.trim().split(/\s+/)[0]).find(Boolean) || "";
    };
    const backgroundUrls = (element) => {
      const style = getComputedStyle(element).backgroundImage || "";
      return [...style.matchAll(/url\(["']?(.*?)["']?\)/gi)].map((match) => match[1]).filter(Boolean);
    };
    const reportUrl = (value) => absoluteUrl(value) || value || "";
    const mediaType = (tagName, url) => {
      if (tagName === "video" || /\.(?:mp4|webm|mov|m3u8)(?:$|[?#])/i.test(url)) return "video";
      if (/\.gif(?:$|[?#])/i.test(url)) return "animated-image";
      return "image";
    };
    const inspectMediaElements = (root) => {
      const elements = [...root.querySelectorAll("video, img, picture, source")];
      return elements.map((element) => ({
        tag: element.tagName.toLowerCase(),
        src: reportUrl(element.getAttribute("src")),
        currentSrc: reportUrl(element.currentSrc),
        poster: reportUrl(element.getAttribute("poster")),
        srcset: element.getAttribute("srcset") || "",
        dataSrc: element.getAttribute("data-src") || "",
        dataSrcset: element.getAttribute("data-srcset") || "",
        backgroundImage: getComputedStyle(element).backgroundImage || "",
        sources: element.tagName.toLowerCase() === "video"
          ? [...element.querySelectorAll("source")].map((source) => ({
              src: reportUrl(source.getAttribute("src")),
              currentSrc: reportUrl(source.currentSrc),
              srcset: source.getAttribute("srcset") || "",
              dataSrc: source.getAttribute("data-src") || "",
              dataSrcset: source.getAttribute("data-srcset") || "",
            }))
          : [],
      }));
    };
    const extractMedia = (root) => {
      const items = [];
      const seen = new Set();
      const add = (tagName, value, fallbackType) => {
        const url = absoluteUrl(value);
        if (ignoreMediaUrl(url) || seen.has(url)) return;
        seen.add(url);
        items.push({ type: mediaType(tagName, url) || fallbackType, url });
      };

      for (const element of root.querySelectorAll("video, img, picture, source")) {
        const tagName = element.tagName.toLowerCase();
        if (tagName === "video") {
          const videoUrl = element.currentSrc || element.src || [...element.querySelectorAll("source")]
            .map((source) => source.currentSrc || source.src || source.getAttribute("data-src") || firstSrcsetUrl(source))
            .find(Boolean);
          if (videoUrl) add("video", videoUrl, "video");
          else if (element.getAttribute("poster")) add("img", element.getAttribute("poster"), "image");
          continue;
        }

        if (tagName === "img") {
          add("img", element.currentSrc || element.src || element.getAttribute("data-src") || firstSrcsetUrl(element), "image");
          continue;
        }

        if (tagName === "picture") {
          const image = element.querySelector("img");
          if (image) add("img", image.currentSrc || image.src || image.getAttribute("data-src") || firstSrcsetUrl(image), "image");
          else {
            const source = element.querySelector("source");
            add("source", source?.src || source?.getAttribute("data-src") || firstSrcsetUrl(source), "image");
          }
          continue;
        }

        if (element.parentElement?.tagName.toLowerCase() === "picture") {
          const image = element.parentElement.querySelector("img");
          if (!image || !(image.currentSrc || image.src || image.getAttribute("data-src"))) {
            add("source", element.src || element.getAttribute("data-src") || firstSrcsetUrl(element), "image");
          }
        }
      }

      for (const element of [root, ...root.querySelectorAll("*")]) {
        for (const url of backgroundUrls(element)) add("img", url, "image");
      }
      return items;
    };
    const getLabeledValue = (text, labels) => {
      const lines = text
        .split(/\r?\n/)
        .map((line) => clean(line))
        .filter(Boolean);
      const labelPattern = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      for (let index = 0; index < lines.length; index += 1) {
        const sameLine = lines[index].match(new RegExp(`^\\s*(?:${labelPattern})\\s*:?\\s+(.+?)\\s*$`, "i"));
        if (sameLine?.[1]) return sameLine[1];
        if (new RegExp(`^\\s*(?:${labelPattern})\\s*:?\\s*$`, "i").test(lines[index])) return lines[index + 1] || "";
      }
      return "";
    };
    const getInstructions = (root, cardText) => {
      const semanticRoots = [
        ...root.querySelectorAll("[class*='instruction' i], [id*='instruction' i], [class*='step' i], [id*='step' i]"),
      ];
      const heading = [...root.querySelectorAll("h1, h2, h3, h4, h5, h6, strong, b")].find((element) =>
        /^(instructions?|steps?)$/i.test(clean(element.textContent)),
      );
      if (heading?.parentElement) semanticRoots.push(heading.parentElement);

      for (const semanticRoot of semanticRoots) {
        const items = [...semanticRoot.querySelectorAll("ol li, ul li")].map((item) => clean(item.textContent)).filter(Boolean);
        if (items.length) return [...new Set(items)];
      }

      const labeledInstructions = getLabeledValue(cardText, ["instructions", "instruction", "steps", "step"]);
      if (labeledInstructions) {
        const items = labeledInstructions
          .split(/\s*(?:\d+[.)]|[•])\s*/)
          .map((item) => clean(item))
          .filter(Boolean);
        return items.length ? [...new Set(items)] : [labeledInstructions];
      }
      const numberedItems = [...cardText.matchAll(/(?:^|\s)\d+[.)]\s+(.+?)(?=\s+\d+[.)]\s+|$)/g)]
        .map((match) => clean(match[1]))
        .filter(Boolean);
      if (numberedItems.length) return [...new Set(numberedItems)];
      return [];
    };

    const anchors = [...document.querySelectorAll("a[href]")].filter((anchor) => isDetail(anchor.href));
    const cards = [];
    const seen = new Set();

    for (const anchor of anchors) {
      const sourceUrl = absoluteUrl(anchor.href);
      if (!sourceUrl || seen.has(sourceUrl)) continue;
      seen.add(sourceUrl);

      let card = anchor;
      for (let parent = anchor.parentElement; parent; parent = parent.parentElement) {
        const detailLinks = [...parent.querySelectorAll("a[href]")].filter((item) => isDetail(item.href));
        if (detailLinks.length !== 1) break;
        card = parent;
        if (parent.matches("article, li, [class*='exercise-card' i], [class*='card' i]")) break;
      }
      const heading = card.querySelector("h1, h2, h3, h4, h5, h6, [role='heading']");
      const image = card.querySelector("img[alt]");
      const name = clean(heading?.textContent || anchor.textContent || image?.alt || "");
      if (!name) continue;
      const cardText = clean(card.innerText || "");
      const difficulty = getLabeledValue(cardText, ["difficulty", "level"]) ||
        ["Beginner", "Novice", "Intermediate", "Advanced"].find((value) =>
          cardText.split(/\r?\n/).some((line) => clean(line).toLowerCase() === value.toLowerCase()),
        ) ||
        "";

      cards.push({
        name,
        sourceUrl,
        media: extractMedia(card),
        mediaInspection: name.toLowerCase() === "dumbbell curl" ? inspectMediaElements(card) : null,
        cardText,
        difficulty,
        instructions: getInstructions(card, cardText),
      });
    }

    const possibleNext = [...document.querySelectorAll("a[href], button")]
      .map((element) => {
        const text = clean(element.innerText || element.textContent || "");
        const ariaLabel = clean(element.getAttribute("aria-label") || "");
        const title = clean(element.getAttribute("title") || "");
        const rel = clean(element.getAttribute("rel") || "");
        const className = clean(element.getAttribute("class") || "");
        const disabled =
          element.hasAttribute("disabled") ||
          element.getAttribute("aria-disabled") === "true" ||
          /\bdisabled\b/i.test(className);
        const signal = `${text} ${ariaLabel} ${title} ${rel} ${className}`.toLowerCase();
        let score = 0;
        if (rel.split(/\s+/).includes("next")) score += 100;
        if (/\bnext\b/.test(ariaLabel.toLowerCase())) score += 80;
        if (/\bnext\b/.test(title.toLowerCase())) score += 70;
        if (/^next(?:\s+page)?$/i.test(text)) score += 60;
        if (/\bnext\b/.test(signal)) score += 20;
        if (disabled) score = -1;

        return {
          score,
          href: element instanceof HTMLAnchorElement ? absoluteUrl(element.href) : null,
        };
      })
      .filter((item) => item.score > 0 && item.href);

    possibleNext.sort((left, right) => right.score - left.score);
    const debugCard = cards.find((card) => card.name.toLowerCase() === "dumbbell curl");
    return {
      cards: cards.map((card) => {
        const sanitizedCard = { ...card };
        delete sanitizedCard.mediaInspection;
        return sanitizedCard;
      }),
      nextPageUrl: possibleNext[0]?.href || null,
      debugReport: debugCard?.mediaInspection || null,
    };
  });
}

async function extractDetailPage(page) {
  await prepareDetailMedia(page);
  return page.evaluate(() => {
    const clean = (value) => String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    const absoluteUrl = (value) => {
      try {
        return new URL(value, location.href).toString();
      } catch {
        return null;
      }
    };
    const ignoreMediaUrl = (value) => !value || /^(?:data:|blob:|about:|javascript:)/i.test(value) || /(?:logo|qr[-_ ]?code|muscle[-_ ]?map|advert|advertisement|banner|tracking|pixel|ezoic|doubleclick|googlesyndication|adservice)/i.test(value);
    const firstSrcsetUrl = (element) => {
      if (!element) return "";
      const srcset = element.getAttribute("srcset") || element.getAttribute("data-srcset") || "";
      return srcset.split(",").map((value) => value.trim().split(/\s+/)[0]).find(Boolean) || "";
    };
    const backgroundUrls = (element) => {
      const style = getComputedStyle(element).backgroundImage || "";
      return [...style.matchAll(/url\(["']?(.*?)["']?\)/gi)].map((match) => match[1]).filter(Boolean);
    };
    const reportUrl = (value) => absoluteUrl(value) || value || "";
    const mediaType = (tagName, url) => {
      if (tagName === "video" || /\.(?:mp4|webm|mov|m3u8)(?:$|[?#])/i.test(url)) return "video";
      if (/\.gif(?:$|[?#])/i.test(url)) return "animated-image";
      return "image";
    };
    const inspectMediaElements = (root) => [...root.querySelectorAll("video, img, picture, source")].map((element) => ({
      tag: element.tagName.toLowerCase(),
      src: reportUrl(element.getAttribute("src")),
      currentSrc: reportUrl(element.currentSrc),
      poster: reportUrl(element.getAttribute("poster")),
      srcset: element.getAttribute("srcset") || "",
      dataSrc: element.getAttribute("data-src") || "",
      dataSrcset: element.getAttribute("data-srcset") || "",
      backgroundImage: getComputedStyle(element).backgroundImage || "",
      sources: element.tagName.toLowerCase() === "video"
        ? [...element.querySelectorAll("source")].map((source) => ({
            src: reportUrl(source.getAttribute("src")),
            currentSrc: reportUrl(source.currentSrc),
            srcset: source.getAttribute("srcset") || "",
            dataSrc: source.getAttribute("data-src") || "",
            dataSrcset: source.getAttribute("data-srcset") || "",
          }))
        : [],
    }));
    const extractMedia = (root) => {
      const items = [];
      const seen = new Set();
      const add = (tagName, value, fallbackType) => {
        const url = absoluteUrl(value);
        if (ignoreMediaUrl(url) || seen.has(url)) return;
        seen.add(url);
        items.push({ type: mediaType(tagName, url) || fallbackType, url });
      };
      for (const element of root.querySelectorAll("video, img, picture, source")) {
        const tagName = element.tagName.toLowerCase();
        if (tagName === "video") {
          const videoUrl = element.currentSrc || element.src || [...element.querySelectorAll("source")]
            .map((source) => source.currentSrc || source.src || source.getAttribute("data-src") || firstSrcsetUrl(source))
            .find(Boolean);
          if (videoUrl) add("video", videoUrl, "video");
          else if (element.getAttribute("poster")) add("img", element.getAttribute("poster"), "image");
        } else if (tagName === "img") {
          add("img", element.currentSrc || element.src || element.getAttribute("data-src") || firstSrcsetUrl(element), "image");
        } else if (tagName === "picture") {
          const image = element.querySelector("img");
          const source = element.querySelector("source");
          add("img", image?.currentSrc || image?.src || image?.getAttribute("data-src") || firstSrcsetUrl(image) || source?.src || source?.getAttribute("data-src") || firstSrcsetUrl(source), "image");
        }
      }
      for (const element of [root, ...root.querySelectorAll("*")]) {
        for (const url of backgroundUrls(element)) add("img", url, "image");
      }
      return items;
    };
    const mediaRoot = document.querySelector("main") || document.body;
    const media = extractMedia(mediaRoot);
    const mediaInspection = inspectMediaElements(mediaRoot);

    const fields = [];
    for (const element of document.querySelectorAll("dt")) {
      fields.push({ label: clean(element.textContent), value: clean(element.nextElementSibling?.textContent) });
    }
    for (const element of document.querySelectorAll("tr")) {
      const cells = [...element.querySelectorAll("th, td")].map((cell) => clean(cell.textContent)).filter(Boolean);
      if (cells.length >= 2) fields.push({ label: cells[0], value: cells.slice(1).join(", ") });
    }
    for (const element of document.querySelectorAll("[data-label], [data-field]")) {
      const label = clean(element.getAttribute("data-label") || element.getAttribute("data-field"));
      const value = clean(element.textContent);
      if (label && value) fields.push({ label, value });
    }

    const bodyText = document.body?.innerText || "";
    const lines = bodyText.split(/\r?\n/).map(clean).filter(Boolean);
    const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    const name = clean(
      headings.find((heading) => clean(heading.textContent))?.textContent ||
        document.querySelector("meta[property='og:title']")?.getAttribute("content") ||
        document.title.replace(/\s*[|–—-].*$/, ""),
    );

    const instructions = [];
    const instructionHeading = headings.find((heading) => /^(instructions?|steps?|how to|execution)$/i.test(clean(heading.textContent)));
    const instructionRoots = [];
    if (instructionHeading) {
      let root = instructionHeading.parentElement;
      for (let level = 0; root && level < 4; level += 1, root = root.parentElement) instructionRoots.push(root);
    }
    instructionRoots.push(
      ...document.querySelectorAll("[class*='instruction' i], [id*='instruction' i], [class*='step' i], [id*='step' i]"),
    );

    for (const root of instructionRoots) {
      const items = [...root.querySelectorAll("ol li, ul li")].map((item) => clean(item.textContent)).filter(Boolean);
      if (items.length) {
        instructions.push(...items);
        break;
      }
    }
    if (!instructions.length) {
      instructions.push(
        ...[...document.querySelectorAll("ol > li")].map((item) => clean(item.textContent)).filter(Boolean),
      );
    }

    return {
      name,
      fields,
      lines,
      instructions: [...new Set(instructions)],
      media,
      mediaInspection,
      images: media.filter((item) => item.type !== "video").map((item) => item.url),
    };
  });
}

function mergeCandidate(checkpoint, candidate) {
  const existing = checkpoint.candidates.find((item) => item.sourceUrl === candidate.sourceUrl);
  if (existing) {
    const existingMedia = normalizeMediaItems([
      ...(Array.isArray(existing.media) ? existing.media : []),
      ...(Array.isArray(existing.images) ? existing.images : []),
    ]);
    const incomingMedia = normalizeMediaItems([
      ...(Array.isArray(candidate.media) ? candidate.media : []),
      ...(Array.isArray(candidate.images) ? candidate.images : []),
    ]);
    Object.assign(existing, candidate, {
      media: normalizeMediaItems([...existingMedia, ...incomingMedia]),
      images: uniqueStrings([
        ...existingMedia.filter((item) => item.type !== "video").map((item) => item.url),
        ...incomingMedia.filter((item) => item.type !== "video").map((item) => item.url),
      ]),
      instructions: candidate.instructions?.length ? candidate.instructions : existing.instructions || [],
    });
    return false;
  }
  checkpoint.candidates.push(candidate);
  return true;
}

function checkpointNeedsListingRefresh(checkpoint) {
  return !checkpoint.candidates.length || checkpoint.candidates.some((candidate) =>
    !Object.prototype.hasOwnProperty.call(candidate, "difficulty") ||
    !Array.isArray(candidate.instructions) ||
    !Object.prototype.hasOwnProperty.call(candidate, "media"),
  );
}

function saveDebugReport(report) {
  if (Array.isArray(report)) writeJsonAtomically(defaultDebugReportPath, report);
}

async function scrape(options) {
  if (options.fresh) {
    for (const filePath of [options.outputPath, options.checkpointPath]) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }

  let checkpoint = readJsonIfPresent(options.checkpointPath) || makeInitialCheckpoint(options);
  if (checkpoint.version !== checkpointVersion) {
    throw new Error(`Unsupported checkpoint version in ${options.checkpointPath}`);
  }
  checkpoint.candidates = Array.isArray(checkpoint.candidates) ? checkpoint.candidates : [];
  checkpoint.records = Array.isArray(checkpoint.records) ? checkpoint.records : [];
  checkpoint.pages = Array.isArray(checkpoint.pages) ? checkpoint.pages : [];
  checkpoint.processedDetailUrls = Array.isArray(checkpoint.processedDetailUrls) ? checkpoint.processedDetailUrls : [];
  if (checkpoint.listingDone && checkpointNeedsListingRefresh(checkpoint)) {
    checkpoint.listingDone = false;
    checkpoint.nextPageUrl = options.startUrl;
    checkpoint.pages = [];
  }
  checkpoint.status = "in-progress";
  checkpoint.error = null;
  saveCheckpoint(options.checkpointPath, checkpoint);

  let browser = null;
  let context;
  if (options.browserMode) {
    context = await chromium.launchPersistentContext(options.profileDir, { headless: false });
  } else {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
  }

  const page =
    context.pages().find((candidate) => candidate.url().includes("musclewiki.com")) ||
    context.pages()[0] ||
    (await context.newPage());
  page.setDefaultNavigationTimeout(navigationTimeoutMs);

  try {
    let initialListing = null;
    if (options.browserMode) {
      initialListing = await waitForBrowserAccess(
        context,
        page,
        options.startUrl,
        "listing",
        true,
        checkpoint,
        options.checkpointPath,
      );
    }
    saveDebugReport(initialListing?.debugReport);

    if (!checkpoint.listingDone) {
      const seenListingUrls = new Set(checkpoint.pages.map((item) => item.url));
      let pageUrl = checkpoint.nextPageUrl || options.startUrl;
      let pageNumber = checkpoint.pages.length + 1;

      while (pageUrl) {
        const canonicalPageUrl = canonicalizeUrl(pageUrl, options.startUrl);
        if (!canonicalPageUrl || seenListingUrls.has(canonicalPageUrl)) break;
        seenListingUrls.add(canonicalPageUrl);

        let listing;
        if (initialListing && canonicalPageUrl === canonicalizeUrl(options.startUrl, options.startUrl)) {
          listing = initialListing;
          initialListing = null;
        } else if (options.browserMode) {
          listing = await waitForBrowserAccess(
            context,
            page,
            canonicalPageUrl,
            "listing",
            true,
            checkpoint,
            options.checkpointPath,
          );
        } else {
          await gotoAndValidate(page, canonicalPageUrl, "listing");
          listing = await extractListingPage(page);
        }
        console.log(`Page ${pageNumber}`);
        console.log(`Found ${listing.cards.length} exercises`);
        saveDebugReport(listing.debugReport);

        const newCandidates = listing.cards.map((card) => ({
          ...card,
          sourceUrl: canonicalizeUrl(card.sourceUrl, canonicalPageUrl),
          media: normalizeMediaItems(card.media),
          images: uniqueStrings([
            ...(Array.isArray(card.images) ? card.images : []),
            ...(Array.isArray(card.media) ? card.media.filter((item) => item.type !== "video").map((item) => item.url) : []),
          ]),
        }));
        for (const candidate of newCandidates) {
          if (candidate.sourceUrl) mergeCandidate(checkpoint, candidate);
        }

        const nextPageUrl = canonicalizeUrl(listing.nextPageUrl, canonicalPageUrl);
        checkpoint.pages.push({
          number: pageNumber,
          url: canonicalPageUrl,
          found: listing.cards.length,
          nextPageUrl,
          scrapedAt: new Date().toISOString(),
        });
        checkpoint.nextPageUrl = nextPageUrl;
        saveCheckpoint(options.checkpointPath, checkpoint);

        if (!nextPageUrl) break;
        await sleep(randomDelay());
        pageUrl = nextPageUrl;
        pageNumber += 1;
      }

      checkpoint.listingDone = true;
      checkpoint.nextPageUrl = null;
      saveCheckpoint(options.checkpointPath, checkpoint);
    }

    const processed = new Set(checkpoint.processedDetailUrls);
    const cachedRecordsByUrl = new Map(checkpoint.records.map((record) => [record.sourceUrl, record]));
    const recordsByUrl = new Map();
    const detailQueue = [];

    for (const candidate of checkpoint.candidates) {
      if (!candidate.sourceUrl) continue;
      const cachedRecord = cachedRecordsByUrl.get(candidate.sourceUrl);
      const listingRecord = mergeCachedRecord(listingRecordFromCandidate(candidate), cachedRecord);
      recordsByUrl.set(candidate.sourceUrl, listingRecord);
      logMediaDiagnostics(listingRecord);

      const needsDetail = needsDetailPage(listingRecord, options.detailFields);
      const cachedRecordNeedsMediaRefresh = !cachedRecord || !Object.prototype.hasOwnProperty.call(cachedRecord, "media");
      if (needsDetail && (!processed.has(candidate.sourceUrl) || options.detailFields.length > 0 || cachedRecordNeedsMediaRefresh)) {
        detailQueue.push({ candidate, listingRecord });
      }
    }

    checkpoint.records = checkpoint.candidates
      .map((candidate) => recordsByUrl.get(candidate.sourceUrl))
      .filter(Boolean);
    writeJsonAtomically(options.outputPath, checkpoint.records);
    saveCheckpoint(options.checkpointPath, checkpoint);

    for (let index = 0; index < detailQueue.length; index += 1) {
      const { candidate, listingRecord } = detailQueue[index];
      await sleep(randomDelay());
      console.log(`Detail ${index + 1}/${detailQueue.length}: ${candidate.name}`);
      if (options.browserMode) {
        await waitForBrowserAccess(
          context,
          page,
          candidate.sourceUrl,
          "detail",
          false,
          checkpoint,
          options.checkpointPath,
        );
      } else {
        await gotoAndValidate(page, candidate.sourceUrl, "detail");
      }
      const detail = await extractDetailPage(page);
      const record = normalizeExerciseRecord(candidate, detail, listingRecord);
      recordsByUrl.set(candidate.sourceUrl, record);
      checkpoint.records = checkpoint.candidates
        .map((item) => recordsByUrl.get(item.sourceUrl))
        .filter(Boolean);
      if (!checkpoint.processedDetailUrls.includes(candidate.sourceUrl)) {
        checkpoint.processedDetailUrls.push(candidate.sourceUrl);
      }
      processed.add(candidate.sourceUrl);
      if (candidate.name.toLowerCase() === "dumbbell curl" && detail.mediaInspection?.length) {
        saveDebugReport(detail.mediaInspection);
      }
      logMediaDiagnostics(record);
      writeJsonAtomically(options.outputPath, checkpoint.records);
      saveCheckpoint(options.checkpointPath, checkpoint);
    }

    checkpoint.status = "complete";
    saveCheckpoint(options.checkpointPath, checkpoint);
    writeJsonAtomically(options.outputPath, checkpoint.records);
    console.log(`Total exercises: ${checkpoint.records.length}`);
  } catch (error) {
    checkpoint.status = error instanceof AccessRestrictedError ? "blocked" : "error";
    checkpoint.error = error instanceof Error ? error.message : String(error);
    saveCheckpoint(options.checkpointPath, checkpoint);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    } else {
      await context.close();
    }
  }
}

const options = parseArgs(process.argv.slice(2));
scrape(options).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
