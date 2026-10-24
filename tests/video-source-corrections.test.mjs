import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { getExerciseContentHash, validateExerciseTranslation } from "../lib/exercises/translation-content.mjs";
import { getExerciseSourceIssues } from "../lib/exercises/source-quality.mjs";

const read = name => JSON.parse(fs.readFileSync(new URL(`../scripts/localization/data/${name}`, import.meta.url), "utf8"));
const manifest = read("source-restorations-002.json");
const decisions = read("source-review-decisions-002.json");
const prepared = read("prepared-translations-036.json");
const byName = new Map(manifest.restorations.map(row => [row.before.name, row]));

test("editorial source corrections retain identity and have all four source-video observations", () => {
  assert.equal(manifest.kind, "video-reviewed-instruction-correction");
  assert.equal(manifest.reviewStatus, "reviewed");
  assert.equal(manifest.restorations.length, 12);
  assert.equal(new Set(manifest.restorations.map(row => row.exercise_id)).size, 12);
  for (const row of manifest.restorations) {
    const decision = decisions.decisions.find(item => item.exercise_id === row.exercise_id);
    assert.equal(decision.sourceName, row.before.name);
    assert.equal(row.before.name, row.after.name);
    assert.equal(row.before.description, row.after.description);
    assert.deepEqual(row.after.steps, decision.steps);
    assert.equal(row.before_hash, getExerciseContentHash(row.before));
    assert.equal(row.after_hash, getExerciseContentHash(row.after));
    assert.notEqual(row.before_hash, row.after_hash);
    assert.ok(Number.isFinite(Date.parse(row.expected_updated_at)));
    assert.deepEqual(getExerciseSourceIssues(row.after), []);
    assert.equal(Number.parseInt(createHash("sha256").update(row.evidence.source_url).digest("hex").slice(0, 12), 16) + 1, row.source_id);
    assert.equal(row.evidence.observation, decision.changeReason);
    assert.deepEqual(row.evidence.videos.map(clip => `${clip.gender}:${clip.angle}`).sort(), ["female:front", "female:side", "male:front", "male:side"]);
    for (const clip of row.evidence.videos) {
      assert.equal(new URL(clip.url).pathname.slice(1), clip.storage_path);
      assert.ok(clip.storage_path.endsWith(`/${row.source_id}-${clip.angle}.mp4`));
      assert.equal(clip.storage_path.includes("/female/"), clip.gender === "female");
      assert.match(clip.video_sha256, /^[a-f0-9]{64}$/);
      assert.match(clip.sample_image_sha256, /^[a-f0-9]{64}$/);
      assert.ok(clip.duration > 0);
    }
    assert.equal(row.evidence.contact_sheets.length, 2);
    for (const sheet of row.evidence.contact_sheets) assert.match(sheet.sha256, /^[a-f0-9]{64}$/);
  }
});

test("source corrections resolve the recorded load/support conflicts without erasing the Waiter's Bow brace", () => {
  for (const exercise of ["Kettlebell Farmers Carry", "Kettlebell Farmers March"]) {
    assert.match(byName.get(exercise).before.steps[0], /two kettlebells in each hand/);
    assert.match(byName.get(exercise).after.steps[0], /one kettlebell in each hand/);
  }
  const brace = byName.get("Dumbbell Waiters Bow").after.steps[0];
  assert.match(brace, /barbell/);
  assert.match(brace, /thighs against it/);
  assert.match(brace, /one dumbbell in each hand/);
  const pendlay = byName.get("Barbell Supinated Pendlay Row").after.steps.join(" ");
  assert.match(pendlay, /supinated \(underhand\) grip/);
  assert.match(pendlay, /same underhand grip/);
  assert.doesNotMatch(pendlay, /pronated|rotate your wrists/);
  const cable = byName.get("Cable Standing Incline Chest Fly");
  assert.deepEqual(cable.before.steps, []);
  assert.equal(cable.after.steps.length, 3);
  assert.match(cable.after.steps[0], /pulleys below shoulder height/);
  assert.match(cable.after.steps[1], /upward and inward/);
  assert.doesNotMatch(cable.after.steps.join(" "), /bench|\d/);
  const incline = byName.get("Dumbbell Single Arm Incline Chest Press").after.steps.join(" ");
  assert.match(incline, /incline bench/);
  assert.match(incline, /one dumbbell/);
  assert.doesNotMatch(incline, /unrack|barbell|\d/);
  assert.match(byName.get("Smith Machine Split Squat").after.steps[1], /back knee should also be bent/);
  assert.match(byName.get("Dumbbell Single Arm Step Up").after.steps[2], /dumbbell at your side/);
  assert.match(byName.get("Dumbbell Sumo Squat").after.steps[0], /one dumbbell with both hands/);
});

test("prepared Vietnamese content matches the corrected blocks, numbers and named body sides", () => {
  assert.equal(prepared.translations.length, 12);
  assert.equal(prepared.translations.reduce((sum, row) => sum + row.steps.length, 0), 37);
  const numbers = steps => steps.flatMap(step => step.match(/\d+(?:[.,]\d+)?/g) ?? []);
  for (const row of prepared.translations) {
    const repair = manifest.restorations.find(item => item.exercise_id === row.exercise_id);
    assert.deepEqual(row.source, repair.after);
    assert.equal(row.source_hash, repair.after_hash);
    assert.equal(row.locale, "vi");
    assert.equal(row.translation_status, "reviewed");
    assert.deepEqual(validateExerciseTranslation(row, { id: row.exercise_id, ...repair.after }), []);
    assert.deepEqual(numbers(row.steps), numbers(repair.after.steps));
    for (let index = 0; index < row.steps.length; index++) {
      if (/\bleft\b/i.test(repair.after.steps[index])) assert.match(row.steps[index], /trái/i);
      if (/\bright\b/i.test(repair.after.steps[index])) assert.match(row.steps[index], /phải/i);
    }
  }
});

test("the second SQL transaction contains exactly the 12 reviewed corrections and 12 translations", () => {
  const sql = fs.readFileSync(new URL("../supabase/repairs/20261023_correct_featured_exercise_instructions.sql", import.meta.url), "utf8");
  const payload = tag => JSON.parse(sql.split(`$${tag}$`)[1]);
  assert.deepEqual(payload("noi_gym_sources"), manifest.restorations.map(row => ({ exercise_id: row.exercise_id, source_id: row.source_id, before_hash: row.before_hash, after_hash: row.after_hash, expected_updated_at: row.expected_updated_at, steps: row.after.steps })));
  assert.deepEqual(payload("noi_gym_translations"), prepared.translations.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "source"))));
  assert.match(sql, /count\(distinct exercise_id\) from _noi_gym_restore_sources\) <> 12/);
  assert.match(sql, /current\.reviewed_at = planned\.reviewed_at\) <> 12/);
  assert.match(sql, /\(to_jsonb\(exercise\) - 'steps'\) is distinct from \(to_jsonb\(original\) - 'steps'\)/);
  assert.match(sql, /on conflict \(exercise_id, locale\) do nothing/);
  assert.match(sql, /alter table public\.exercises enable trigger exercises_updated_at;[\s\S]*commit;/);
  assert.doesNotMatch(sql, /disable row level security|disable trigger all/i);
});

test("SQL preparation refuses empty or duplicate repair scopes before producing a script", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "noi-gym-repair-preflight-"));
  const preparedPath = path.join(directory, "prepared.json");
  fs.writeFileSync(preparedPath, JSON.stringify(prepared));
  for (const rows of [[], Array.from({ length: 12 }, () => manifest.restorations[0])]) {
    const inputPath = path.join(directory, `repair-${rows.length}.json`);
    const outputPath = path.join(directory, `repair-${rows.length}.sql`);
    fs.writeFileSync(inputPath, JSON.stringify({ ...manifest, restorations: rows }));
    const result = spawnSync(process.execPath, ["scripts/localization/prepare-source-restoration-sql.mjs", "--repairs", inputPath, "--translations", preparedPath, "--output", outputPath], { encoding: "utf8", cwd: new URL("../", import.meta.url) });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, rows.length ? /Duplicate repair or translation identity/ : /Unexpected repair scope/);
    assert.equal(fs.existsSync(outputPath), false);
  }
});

test("support/load corrections have 32 identified source clips and 25 complete Vietnamese steps", () => {
  const repairs = read("source-restorations-004.json").restorations;
  const choices = read("source-review-decisions-003.json").decisions;
  const translations = read("prepared-translations-037.json").translations;
  assert.equal(repairs.length, 8);
  assert.equal(translations.length, 8);
  assert.equal(translations.reduce((sum, row) => sum + row.steps.length, 0), 25);
  for (const repair of repairs) {
    const choice = choices.find(row => row.exercise_id === repair.exercise_id);
    assert.equal(choice.sourceName, repair.before.name);
    assert.equal(repair.after.name, repair.before.name);
    assert.equal(repair.after.description, repair.before.description);
    assert.deepEqual(repair.after.steps, choice.steps);
    assert.equal(repair.before_hash, getExerciseContentHash(repair.before));
    assert.equal(repair.after_hash, getExerciseContentHash(repair.after));
    assert.notEqual(repair.before_hash, repair.after_hash);
    assert.equal(Number.parseInt(createHash("sha256").update(repair.evidence.source_url).digest("hex").slice(0, 12), 16) + 1, repair.source_id);
    assert.equal(repair.evidence.observation, choice.changeReason);
    assert.deepEqual(repair.evidence.videos.map(clip => `${clip.gender}:${clip.angle}`).sort(), ["female:front", "female:side", "male:front", "male:side"]);
    for (const clip of repair.evidence.videos) {
      assert.equal(clip.sample_window_seconds, clip.duration);
      assert.equal(new URL(clip.url).pathname.slice(1), clip.storage_path);
      assert.ok(clip.storage_path.endsWith(`/${repair.source_id}-${clip.angle}.mp4`));
      assert.match(clip.video_sha256, /^[a-f0-9]{64}$/);
      assert.match(clip.sample_image_sha256, /^[a-f0-9]{64}$/);
    }
    const translated = translations.find(row => row.exercise_id === repair.exercise_id);
    assert.deepEqual(translated.source, repair.after);
    assert.deepEqual(validateExerciseTranslation(translated, { id: repair.exercise_id, ...repair.after }), []);
    assert.equal(translated.source_hash, repair.after_hash);
    assert.deepEqual(getExerciseSourceIssues(repair.after), []);
  }
});

test("support/load SQL contains exactly the reviewed scope and excludes the contradictory cues", () => {
  const repairs = read("source-restorations-004.json").restorations;
  const names = new Map(repairs.map(row => [row.before.name, row.after.steps.join(" ")]));
  assert.doesNotMatch(names.get("Long Lever Forearm Plank"), /hand plank/);
  assert.doesNotMatch(names.get("Kettlebell Seated Calf Raise Double"), /barbell/);
  assert.match(names.get("Kettlebell Quad Stomp"), /one kettlebell in each hand/);
  assert.doesNotMatch(names.get("Slow Tempo Mountain Climber"), /quickly/i);
  assert.doesNotMatch(names.get("Dumbbell Front Rack Step Up"), /barbell|overhand/);
  assert.match(names.get("TRX Glute Bridge"), /feet suspended off the ground/);
  assert.doesNotMatch(names.get("Stability Ball Glute Bridge"), /on the bar\b/);
  assert.match(names.get("Band Overhead Press"), /by bending your elbows/);
  const sql = fs.readFileSync("supabase/repairs/20261023_correct_exercise_support_and_load.sql", "utf8");
  assert.deepEqual(JSON.parse(sql.split("$noi_gym_sources$")[1]), repairs.map(row => ({ exercise_id: row.exercise_id, source_id: row.source_id, before_hash: row.before_hash, after_hash: row.after_hash, expected_updated_at: row.expected_updated_at, steps: row.after.steps })));
  assert.deepEqual(JSON.parse(sql.split("$noi_gym_translations$")[1]), read("prepared-translations-037.json").translations.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "source"))));
  assert.match(sql, /count\(distinct exercise_id\) from _noi_gym_restore_sources\) <> 8/);
  assert.match(sql, /current\.reviewed_at = planned\.reviewed_at\) <> 8/);
  assert.doesNotMatch(sql, /disable row level security|disable trigger all/i);
});

test("lower-body corrections cover all 56 available clips and distinguish four female-only sources", () => {
  const repairs = read("source-restorations-005.json").restorations;
  const choices = read("source-review-decisions-004.json").decisions;
  const translations = read("prepared-translations-038.json").translations;
  assert.equal(repairs.length, 16);
  assert.equal(new Set(repairs.map(row => row.exercise_id)).size, 16);
  assert.equal(translations.length, 16);
  assert.equal(translations.reduce((sum, row) => sum + row.steps.length, 0), 51);
  assert.equal(repairs.reduce((sum, row) => sum + row.evidence.videos.length, 0), 56);
  const numbers = steps => steps.flatMap(step => step.match(/\d+(?:[.,]\d+)?/g) ?? []);
  const files = new Map();
  let femaleOnly = 0;
  for (const repair of repairs) {
    const choice = choices.find(row => row.exercise_id === repair.exercise_id);
    assert.equal(choice.sourceName, repair.before.name);
    assert.equal(repair.after.name, repair.before.name);
    assert.equal(repair.after.description, repair.before.description);
    assert.deepEqual(repair.after.steps, choice.steps);
    assert.equal(repair.before_hash, getExerciseContentHash(repair.before));
    assert.equal(repair.after_hash, getExerciseContentHash(repair.after));
    assert.notEqual(repair.before_hash, repair.after_hash);
    assert.equal(Number.parseInt(createHash("sha256").update(repair.evidence.source_url).digest("hex").slice(0, 12), 16) + 1, repair.source_id);
    const genders = [...new Set(repair.evidence.videos.map(clip => clip.gender))];
    assert.deepEqual(repair.evidence.available_genders, genders);
    assert.deepEqual(repair.evidence.videos.map(clip => `${clip.gender}:${clip.angle}`).sort(), genders.flatMap(gender => [`${gender}:front`, `${gender}:side`]).sort());
    if (genders.length === 1) {
      femaleOnly++;
      assert.deepEqual(genders, ["female"]);
      const evidence = repair.evidence.identity_source;
      assert.ok(evidence);
      if (!files.has(evidence.file)) files.set(evidence.file, fs.readFileSync(evidence.file));
      const bytes = files.get(evidence.file);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), evidence.sha256);
      const original = evidence.pointer.split("/").slice(1).reduce((value, part) => value[part], JSON.parse(bytes));
      assert.equal(original.id, repair.source_id);
      assert.equal(original.name, repair.before.name);
      assert.equal(original.source_url, repair.evidence.source_url);
      assert.deepEqual(original.steps, repair.before.steps);
      assert.equal(repair.evidence.contact_sheets.length, 1);
    } else {
      assert.deepEqual(genders.sort(), ["female", "male"]);
      assert.equal(repair.evidence.contact_sheets.length, 2);
    }
    for (const clip of repair.evidence.videos) {
      assert.equal(clip.sample_window_seconds, clip.duration);
      assert.equal(new URL(clip.url).pathname.slice(1), clip.storage_path);
      assert.ok(clip.storage_path.endsWith(`/${repair.source_id}-${clip.angle}.mp4`));
      assert.equal(clip.storage_path.includes("/female/"), clip.gender === "female");
      assert.match(clip.video_sha256, /^[a-f0-9]{64}$/);
      assert.match(clip.sample_image_sha256, /^[a-f0-9]{64}$/);
    }
    const translated = translations.find(row => row.exercise_id === repair.exercise_id);
    assert.deepEqual(translated.source, repair.after);
    assert.deepEqual(validateExerciseTranslation(translated, { id: repair.exercise_id, ...repair.after }), []);
    assert.deepEqual(numbers(translated.steps), numbers(repair.after.steps));
    assert.deepEqual(numbers(repair.before.steps), numbers(repair.after.steps));
    for (let index = 0; index < repair.after.steps.length; index++) {
      if (/\bleft\b/i.test(repair.after.steps[index])) assert.match(translated.steps[index], /trái/i);
      if (/\bright\b/i.test(repair.after.steps[index])) assert.match(translated.steps[index], /phải/i);
    }
  }
  assert.equal(femaleOnly, 4);
});

test("lower-body SQL preserves the reviewed scope, front/rear leg roles and distinct split-squat loads", () => {
  const repairs = read("source-restorations-005.json").restorations;
  const names = new Map(repairs.map(row => [row.before.name, row]));
  for (const name of ["Plate Reverse Lunge", "Dumbbell Reverse Lunge", "Dumbbell Goblet Reverse Lunge", "Bodyweight Reverse Lunge", "Kettlebell Alternating Reverse Lunge"]) {
    const steps = names.get(name).after.steps.join(" ");
    assert.match(steps, /left leg, lowering your body until your right thigh/);
    assert.doesNotMatch(steps, /left leg, lowering your body until your left thigh/);
    if (name !== "Kettlebell Alternating Reverse Lunge") assert.match(steps, /right leg and lowering your body until your left thigh/);
  }
  for (const name of ["Barbell Split Squat", "Trap Bar Split Squat", "Dumbbell Split Squat", "Dumbbell Goblet Split Squat"]) {
    assert.match(names.get(name).after.steps.join(" "), /back knee should also be bent/);
    assert.doesNotMatch(names.get(name).after.steps.join(" "), /back leg should be straight/);
  }
  assert.match(names.get("Dumbbell Split Squat").after.steps[0], /one dumbbell in each hand at your sides/);
  assert.match(names.get("Dumbbell Goblet Split Squat").after.steps[0], /a dumbbell in a goblet position/);
  assert.notEqual(names.get("Dumbbell Split Squat").exercise_id, names.get("Dumbbell Goblet Split Squat").exercise_id);
  assert.doesNotMatch(names.get("Dumbbell Step Up").after.steps.join(" "), /barbell/);
  assert.doesNotMatch(names.get("Dumbbell Deficit Reverse Lunge").after.steps.join(" "), /keeping bar stable/);
  const sql = fs.readFileSync("supabase/repairs/20261023_correct_lower_body_exercise_instructions.sql", "utf8");
  assert.deepEqual(JSON.parse(sql.split("$noi_gym_sources$")[1]), repairs.map(row => ({ exercise_id: row.exercise_id, source_id: row.source_id, before_hash: row.before_hash, after_hash: row.after_hash, expected_updated_at: row.expected_updated_at, steps: row.after.steps })));
  assert.deepEqual(JSON.parse(sql.split("$noi_gym_translations$")[1]), read("prepared-translations-038.json").translations.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "source"))));
  assert.match(sql, /count\(distinct exercise_id\) from _noi_gym_restore_sources\) <> 16/);
  assert.match(sql, /current\.reviewed_at = planned\.reviewed_at\) <> 16/);
  assert.match(sql, /exercise.updated_at is distinct from patch.expected_updated_at/);
  assert.match(sql, /on conflict \(exercise_id, locale\) do nothing/);
  assert.doesNotMatch(sql, /disable row level security|disable trigger all/i);
});

test("TRX corrections retain 39 complete steps and evidence for 44 clips plus offset phases", () => {
  const repairs = read("source-restorations-006.json").restorations;
  const choices = read("source-review-decisions-005.json").decisions;
  const translations = read("prepared-translations-039.json").translations;
  assert.equal(repairs.length, 11);
  assert.equal(new Set(repairs.map(row => row.exercise_id)).size, 11);
  assert.equal(translations.length, 11);
  assert.equal(translations.reduce((sum, row) => sum + row.steps.length, 0), 39);
  assert.equal(repairs.reduce((sum, row) => sum + row.evidence.videos.length, 0), 44);
  assert.equal(repairs.reduce((sum, row) => sum + row.evidence.supplemental_samples.length, 0), 8);
  const numbers = steps => steps.flatMap(step => step.match(/\d+(?:[.,]\d+)?/g) ?? []);
  for (const repair of repairs) {
    const choice = choices.find(row => row.exercise_id === repair.exercise_id);
    assert.equal(choice.sourceName, repair.before.name);
    assert.equal(repair.after.name, repair.before.name);
    assert.equal(repair.after.description, repair.before.description);
    assert.deepEqual(repair.after.steps, choice.steps);
    assert.equal(repair.before_hash, getExerciseContentHash(repair.before));
    assert.equal(repair.after_hash, getExerciseContentHash(repair.after));
    assert.notEqual(repair.before_hash, repair.after_hash);
    assert.equal(Number.parseInt(createHash("sha256").update(repair.evidence.source_url).digest("hex").slice(0, 12), 16) + 1, repair.source_id);
    assert.equal(repair.evidence.observation, choice.changeReason);
    assert.deepEqual(repair.evidence.videos.map(clip => `${clip.gender}:${clip.angle}`).sort(), ["female:front", "female:side", "male:front", "male:side"]);
    for (const clip of repair.evidence.videos) {
      assert.equal(clip.sample_window_seconds, clip.duration);
      assert.equal(new URL(clip.url).pathname.slice(1), clip.storage_path);
      assert.ok(clip.storage_path.endsWith(`/${repair.source_id}-${clip.angle}.mp4`));
      assert.equal(clip.storage_path.includes("/female/"), clip.gender === "female");
      assert.match(clip.video_sha256, /^[a-f0-9]{64}$/);
      assert.match(clip.sample_image_sha256, /^[a-f0-9]{64}$/);
    }
    for (const sample of repair.evidence.supplemental_samples) {
      assert.equal(sample.exercise_id, repair.exercise_id);
      assert.equal(sample.sample_count, 6);
      assert.ok(sample.start_offset_seconds > 0);
      assert.ok(Math.abs(sample.start_offset_seconds + sample.sample_window_seconds - sample.duration) < 0.000001);
      assert.ok(repair.evidence.videos.some(clip => clip.storage_path === sample.storage_path && clip.gender === sample.gender && clip.angle === sample.angle && clip.duration === sample.duration));
      assert.match(sample.sha256, /^[a-f0-9]{64}$/);
    }
    const translated = translations.find(row => row.exercise_id === repair.exercise_id);
    assert.deepEqual(translated.source, repair.after);
    assert.deepEqual(validateExerciseTranslation(translated, { id: repair.exercise_id, ...repair.after }), []);
    assert.deepEqual(getExerciseSourceIssues(repair.after), []);
    assert.deepEqual(numbers(repair.before.steps), numbers(repair.after.steps));
    assert.deepEqual(numbers(translated.steps), numbers(repair.after.steps));
    for (let index = 0; index < repair.after.steps.length; index++) {
      if (/\bleft\b/i.test(repair.after.steps[index])) assert.match(translated.steps[index], /trái/i);
      if (/\bright\b/i.test(repair.after.steps[index])) assert.match(translated.steps[index], /phải/i);
    }
  }
});

test("TRX transaction preserves reviewed scope and separates anchor direction and supported body positions", () => {
  const repairs = read("source-restorations-006.json").restorations;
  const names = new Map(repairs.map(row => [row.before.name, row.after.steps.join(" ")]));
  for (const name of ["TRX Pushup", "TRX Pec Fly"]) assert.match(names.get(name), /facing away from the (?:TRX )?anchor point/);
  for (const name of ["TRX Lateral Lunge", "TRX Jumping Squat", "TRX Kneeling Ab Rollout", "TRX Rear Delt Fly", "TRX Curtsy Lunge", "TRX Reverse Curl", "TRX Rear Delt Row"]) {
    assert.match(names.get(name), /facing the (?:TRX )?anchor point/);
    assert.doesNotMatch(names.get(name), /facing away/);
  }
  assert.match(names.get("TRX Kneeling Ab Rollout"), /knees on the floor/);
  assert.doesNotMatch(names.get("TRX Kneeling Ab Rollout"), /onto your toes|mid-calf|lower your body down to the ground/);
  assert.match(names.get("TRX Forearm Plank"), /upper body supported on your forearms/);
  assert.doesNotMatch(names.get("TRX Forearm Plank"), /hold the handles|kick both feet/);
  assert.match(names.get("TRX Hamstring Curl"), /Lie on your back/);
  assert.match(names.get("TRX Hamstring Curl"), /slowly extend your knees/);
  assert.doesNotMatch(names.get("TRX Hamstring Curl"), /push-up position/);
  assert.match(names.get("TRX Reverse Curl"), /overhand grip/);
  assert.match(names.get("TRX Reverse Curl"), /upper arms in front of you/);
  assert.match(names.get("TRX Jumping Squat"), /maintaining your grip/);
  assert.doesNotMatch(names.get("TRX Jumping Squat"), /arms for momentum/);
  const sql = fs.readFileSync("supabase/repairs/20261023_correct_trx_exercise_instructions.sql", "utf8");
  assert.deepEqual(JSON.parse(sql.split("$noi_gym_sources$")[1]), repairs.map(row => ({ exercise_id: row.exercise_id, source_id: row.source_id, before_hash: row.before_hash, after_hash: row.after_hash, expected_updated_at: row.expected_updated_at, steps: row.after.steps })));
  assert.deepEqual(JSON.parse(sql.split("$noi_gym_translations$")[1]), read("prepared-translations-039.json").translations.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "source"))));
  assert.match(sql, /count\(distinct exercise_id\) from _noi_gym_restore_sources\) <> 11/);
  assert.match(sql, /current\.reviewed_at = planned\.reviewed_at\) <> 11/);
  assert.match(sql, /exercise.updated_at is distinct from patch.expected_updated_at/);
  assert.match(sql, /on conflict \(exercise_id, locale\) do nothing/);
  assert.doesNotMatch(sql, /disable row level security|disable trigger all/i);
});

test("band, machine, cable and cardio corrections retain source identity and every available gender/angle", () => {
  const repairs = read("source-restorations-007.json").restorations;
  const decisions = read("source-review-decisions-006.json").decisions;
  const translations = read("prepared-translations-040.json").translations;
  const numbers = steps => steps.flatMap(step => step.match(/\d+(?:[.,]\d+)?/g) ?? []);
  assert.equal(repairs.length, 18);
  assert.equal(new Set(repairs.map(row => row.exercise_id)).size, 18);
  assert.equal(translations.length, 18);
  assert.equal(translations.reduce((sum, row) => sum + row.steps.length, 0), 48);
  assert.equal(repairs.reduce((sum, row) => sum + row.evidence.videos.length, 0), 66);
  assert.equal(repairs.reduce((sum, row) => sum + row.evidence.supplemental_samples.length, 0), 6);
  const femaleOnly = repairs.filter(row => row.evidence.available_genders.length === 1);
  assert.deepEqual(femaleOnly.map(row => row.before.name).sort(), ["Cable Bar Reverse Grip Pushdown", "Machine Chest Press", "Neutral Chest Press"]);
  for (const repair of repairs) {
    const decision = decisions.find(row => row.exercise_id === repair.exercise_id);
    assert.equal(decision.sourceName, repair.before.name);
    assert.deepEqual(repair.after.steps, decision.steps);
    assert.equal(repair.after.name, repair.before.name);
    assert.equal(repair.after.description, repair.before.description);
    assert.equal(repair.after.steps.length, repair.before.steps.length);
    assert.equal(repair.before_hash, getExerciseContentHash(repair.before));
    assert.equal(repair.after_hash, getExerciseContentHash(repair.after));
    assert.notEqual(repair.before_hash, repair.after_hash);
    assert.equal(Number.parseInt(createHash("sha256").update(repair.evidence.source_url).digest("hex").slice(0, 12), 16) + 1, repair.source_id);
    const expected = repair.evidence.available_genders.flatMap(gender => ["front", "side"].map(angle => `${gender}:${angle}`)).sort();
    assert.deepEqual(repair.evidence.videos.map(clip => `${clip.gender}:${clip.angle}`).sort(), expected);
    assert.equal(repair.evidence.contact_sheets.length, repair.evidence.available_genders.length);
    if (repair.evidence.identity_source) {
      const identity = repair.evidence.identity_source;
      const bytes = fs.readFileSync(identity.file);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), identity.sha256);
      const original = identity.pointer.split("/").slice(1).reduce((value, part) => value[part], JSON.parse(bytes));
      assert.equal(original.id, repair.source_id);
      assert.equal(original.name, repair.before.name);
      assert.equal(original.source_url, repair.evidence.source_url);
      assert.deepEqual(original.steps, repair.before.steps);
      assert.deepEqual(repair.evidence.available_genders, ["female"]);
    }
    for (const clip of repair.evidence.videos) {
      assert.equal(clip.sample_window_seconds, clip.duration);
      assert.equal(new URL(clip.url).pathname.slice(1), clip.storage_path);
      assert.ok(clip.storage_path.endsWith(`/${repair.source_id}-${clip.angle}.mp4`));
      assert.equal(clip.storage_path.includes("/female/"), clip.gender === "female");
      assert.match(clip.video_sha256, /^[a-f0-9]{64}$/);
      assert.match(clip.sample_image_sha256, /^[a-f0-9]{64}$/);
    }
    for (const sample of repair.evidence.supplemental_samples) {
      assert.equal(sample.exercise_id, repair.exercise_id);
      assert.equal(sample.sample_count, 6);
      assert.ok(sample.start_offset_seconds > 0);
      assert.ok(Math.abs(sample.start_offset_seconds + sample.sample_window_seconds - sample.duration) < 0.000001);
      assert.ok(repair.evidence.videos.some(clip => clip.storage_path === sample.storage_path && clip.gender === sample.gender && clip.angle === sample.angle));
      assert.match(sample.sha256, /^[a-f0-9]{64}$/);
    }
    const translation = translations.find(row => row.exercise_id === repair.exercise_id);
    assert.deepEqual(translation.source, repair.after);
    assert.deepEqual(validateExerciseTranslation(translation, { id: repair.exercise_id, ...repair.after }), []);
    assert.deepEqual(getExerciseSourceIssues(repair.after), []);
    assert.deepEqual(numbers(repair.before.steps), numbers(repair.after.steps));
    assert.deepEqual(numbers(translation.steps), numbers(repair.after.steps));
  }
});

test("equipment corrections preserve distinct grips, band positions, adduction and Ski Erg movement in guarded SQL", () => {
  const repairs = read("source-restorations-007.json").restorations;
  const names = new Map(repairs.map(row => [row.before.name, row.after.steps.join(" ")]));
  assert.match(names.get("Cable Bar Reverse Grip Pushdown"), /underhand grip, palms facing up/);
  assert.match(names.get("Neutral Chest Press"), /neutral grip, palms facing each other/);
  assert.match(names.get("Machine Chest Press"), /overhand grip/);
  for (const name of ["Neutral Chest Press", "Machine Chest Press"]) {
    assert.match(names.get(name), /elbows are extended without hyperextending/);
    assert.doesNotMatch(names.get(name), /are not extended/);
  }
  assert.match(names.get("Band Goblet Squat"), /both hands together in front of your chest/);
  assert.match(names.get("Band Squat"), /each hand at your sides/);
  assert.doesNotMatch(names.get("Band Internally Rotated Chest Fly"), /step on|rotating your forearms|raise your arms out/);
  assert.match(names.get("Band Internally Rotated Chest Fly"), /palms facing down/);
  assert.match(names.get("Band Hip Adduction"), /banded leg inward/);
  assert.match(names.get("Cable Standing Hip Adduction"), /attached leg inward across the front of your supporting leg/);
  assert.match(names.get("Machine Plate Loaded Kneeling Hamstring Curl"), /one knee on the machine's support pad/);
  assert.doesNotMatch(names.get("Machine Plate Loaded Kneeling Hamstring Curl"), /[Ll]ay down|with your legs/);
  assert.match(names.get("Mini Band Bent Over Row"), /Pull the band toward your waist/);
  assert.match(names.get("Mini Band Bent Arm Lateral Raise"), /Lower both elbows slowly together/);
  assert.doesNotMatch(names.get("Mini Band Bent Arm Lateral Raise"), /alternate/);
  assert.match(names.get("Cardio Ski Erg"), /Pull both handles down toward your thighs/);
  assert.doesNotMatch(names.get("Cardio Ski Erg"), /burpee|[Ll]eap|single-leg/);
  const sql = fs.readFileSync("supabase/repairs/20261023_correct_band_machine_cable_cardio_instructions.sql", "utf8");
  assert.deepEqual(JSON.parse(sql.split("$noi_gym_sources$")[1]), repairs.map(row => ({ exercise_id: row.exercise_id, source_id: row.source_id, before_hash: row.before_hash, after_hash: row.after_hash, expected_updated_at: row.expected_updated_at, steps: row.after.steps })));
  assert.deepEqual(JSON.parse(sql.split("$noi_gym_translations$")[1]), read("prepared-translations-040.json").translations.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "source"))));
  assert.match(sql, /count\(distinct exercise_id\) from _noi_gym_restore_sources\) <> 18/);
  assert.match(sql, /current\.reviewed_at = planned\.reviewed_at\) <> 18/);
  assert.match(sql, /exercise.updated_at is distinct from patch.expected_updated_at/);
  assert.match(sql, /on conflict \(exercise_id, locale\) do nothing/);
  assert.doesNotMatch(sql, /disable row level security|disable trigger all/i);
});

test("kettlebell, plate, BOSU and ball evidence keeps all available media and bounded temporal samples", () => {
  const repairs = read("source-restorations-008.json").restorations;
  const decisions = read("source-review-decisions-007.json").decisions;
  const translations = read("prepared-translations-041.json").translations;
  const numbers = steps => steps.flatMap(step => step.match(/\d+(?:[.,]\d+)?/g) ?? []);
  assert.equal(repairs.length, 22);
  assert.equal(new Set(repairs.map(row => row.exercise_id)).size, 22);
  assert.equal(translations.length, 22);
  assert.equal(translations.reduce((sum, row) => sum + row.steps.length, 0), 71);
  assert.equal(repairs.reduce((sum, row) => sum + row.evidence.videos.length, 0), 86);
  const samples = repairs.flatMap(row => row.evidence.supplemental_samples);
  assert.equal(samples.length, 8);
  assert.equal(samples.reduce((sum, sample) => sum + sample.sample_count, 0), 72);
  const femaleOnly = repairs.filter(row => row.evidence.available_genders.length === 1);
  assert.deepEqual(femaleOnly.map(row => row.before.name), ["Kettlebell Guillotine Bench Press"]);
  for (const repair of repairs) {
    const decision = decisions.find(row => row.exercise_id === repair.exercise_id);
    assert.equal(decision.sourceName, repair.before.name);
    assert.deepEqual(repair.after.steps, decision.steps);
    assert.equal(repair.after.name, repair.before.name);
    assert.equal(repair.after.description, repair.before.description);
    assert.equal(repair.after.steps.length, repair.before.steps.length);
    assert.equal(repair.before_hash, getExerciseContentHash(repair.before));
    assert.equal(repair.after_hash, getExerciseContentHash(repair.after));
    assert.notEqual(repair.before_hash, repair.after_hash);
    assert.equal(Number.parseInt(createHash("sha256").update(repair.evidence.source_url).digest("hex").slice(0, 12), 16) + 1, repair.source_id);
    const expected = repair.evidence.available_genders.flatMap(gender => ["front", "side"].map(angle => `${gender}:${angle}`)).sort();
    assert.deepEqual(repair.evidence.videos.map(clip => `${clip.gender}:${clip.angle}`).sort(), expected);
    if (repair.evidence.identity_source) {
      const identity = repair.evidence.identity_source;
      const bytes = fs.readFileSync(identity.file);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), identity.sha256);
      const original = identity.pointer.split("/").slice(1).reduce((value, part) => value[part], JSON.parse(bytes));
      assert.equal(original.id, repair.source_id);
      assert.equal(original.name, repair.before.name);
      assert.deepEqual(original.steps, repair.before.steps);
      assert.equal(original.source_url, repair.evidence.source_url);
    }
    for (const clip of repair.evidence.videos) {
      assert.equal(clip.sample_window_seconds, clip.duration);
      assert.equal(new URL(clip.url).pathname.slice(1), clip.storage_path);
      assert.ok(clip.storage_path.endsWith(`/${repair.source_id}-${clip.angle}.mp4`));
      assert.equal(clip.storage_path.includes("/female/"), clip.gender === "female");
      assert.match(clip.video_sha256, /^[a-f0-9]{64}$/);
      assert.match(clip.sample_image_sha256, /^[a-f0-9]{64}$/);
    }
    for (const sample of repair.evidence.supplemental_samples) {
      assert.equal(sample.exercise_id, repair.exercise_id);
      assert.ok([6, 12].includes(sample.sample_count));
      assert.ok(sample.start_offset_seconds >= 0 && sample.sample_window_seconds > 0);
      assert.ok(sample.start_offset_seconds + sample.sample_window_seconds <= sample.duration + 0.000001);
      assert.ok(repair.evidence.videos.some(clip => clip.storage_path === sample.storage_path && clip.gender === sample.gender && clip.angle === sample.angle && clip.duration === sample.duration));
      if (sample.sample_count === 12) {
        assert.equal(repair.before.name, "Kettlebell Hang Clean And Jerk");
        assert.equal(sample.start_offset_seconds, 0);
        assert.equal(sample.sample_window_seconds, 5);
      }
      assert.match(sample.sha256, /^[a-f0-9]{64}$/);
    }
    const translation = translations.find(row => row.exercise_id === repair.exercise_id);
    assert.deepEqual(translation.source, repair.after);
    assert.deepEqual(validateExerciseTranslation(translation, { id: repair.exercise_id, ...repair.after }), []);
    assert.deepEqual(getExerciseSourceIssues(repair.after), []);
    assert.deepEqual(numbers(translation.steps), numbers(repair.after.steps));
    for (let index = 0; index < repair.after.steps.length; index++) {
      if (/\bleft\b/i.test(repair.after.steps[index])) assert.match(translation.steps[index], /trái/i);
      if (/\bright\b/i.test(repair.after.steps[index])) assert.match(translation.steps[index], /phải/i);
    }
  }
});

test("verified load and support variants stay distinct in the kettlebell/plate/BOSU transaction", () => {
  const repairs = read("source-restorations-008.json").restorations;
  const names = new Map(repairs.map(row => [row.before.name, row.after.steps.join(" ")]));
  assert.match(names.get("Kettlebell Upright Row Single"), /one kettlebell with both hands/);
  assert.match(names.get("Kettlebell Upright Row"), /a kettlebell in each hand/);
  for (const name of ["Kettlebell Upright Row Single", "Kettlebell Upright Row"]) {
    assert.match(names.get(name), /torso upright/);
    assert.doesNotMatch(names.get(name), /bringing the kettlebell to the floor/);
  }
  assert.match(names.get("Kettlebell Alternating Single Arm Thruster"), /press one kettlebell overhead while keeping the other at your shoulder/);
  assert.match(names.get("Kettlebell Thruster"), /lower into a squat/);
  assert.match(names.get("Kettlebell Thruster"), /press both kettlebells overhead/);
  assert.match(names.get("Kettlebell Hang Clean And Jerk"), /Dip your knees, then extend your legs/);
  assert.match(names.get("Kettlebell Guillotine Bench Press"), /flat bench/);
  assert.match(names.get("Kettlebell Incline Guillotine Bench Press"), /incline bench/);
  for (const name of ["Kettlebell Waiters Bow", "Kettlebell Staggered Waiters Bow"]) {
    assert.match(names.get(name), /fixed bar/);
    assert.match(names.get(name), /kettlebell in each hand/);
  }
  assert.match(names.get("Plate Staggered Waiters Bow"), /plate against your chest with both hands/);
  for (const name of ["Bosu Ball Hip Thrust", "Bosu Ball Single Leg Hip Thrust"]) assert.match(names.get(name), /upper back on the dome/);
  assert.match(names.get("Bosu Ball Situp"), /holding the BOSU by its rim with both hands/);
  assert.match(names.get("Weighted Knee Push Ups"), /plate resting flat across your upper back/);
  assert.match(names.get("Plate Deficit Pushup"), /one hand on each with a gap between them/);
  assert.match(names.get("Plate Lateral Raise"), /one plate in each hand/);
  assert.doesNotMatch(names.get("Plate Hip Abduction"), /between legs/);
  assert.match(names.get("Plate Russian Twist"), /hold a plate in both hands/);
  assert.doesNotMatch(names.get("Plate Russian Twist"), /feet flat/);
  assert.match(names.get("Medicine Ball Partner Side Toss"), /both facing forward/);
  assert.match(names.get("Medicine Ball Press Jack"), /Jump your feet apart/);
  const sql = fs.readFileSync("supabase/repairs/20261023_correct_kettlebell_plate_bosu_ball_instructions.sql", "utf8");
  assert.deepEqual(JSON.parse(sql.split("$noi_gym_sources$")[1]), repairs.map(row => ({ exercise_id: row.exercise_id, source_id: row.source_id, before_hash: row.before_hash, after_hash: row.after_hash, expected_updated_at: row.expected_updated_at, steps: row.after.steps })));
  assert.deepEqual(JSON.parse(sql.split("$noi_gym_translations$")[1]), read("prepared-translations-041.json").translations.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "source"))));
  assert.match(sql, /count\(distinct exercise_id\) from _noi_gym_restore_sources\) <> 22/);
  assert.match(sql, /current\.reviewed_at = planned\.reviewed_at\) <> 22/);
  assert.match(sql, /exercise.updated_at is distinct from patch.expected_updated_at/);
  assert.match(sql, /on conflict \(exercise_id, locale\) do nothing/);
  assert.doesNotMatch(sql, /disable row level security|disable trigger all/i);
});

test("dumbbell and barbell evidence verifies equipment, female-only identity and the explicit Arnold expansion", () => {
  const repairs = read("source-restorations-009.json").restorations;
  const decisions = read("source-review-decisions-008.json").decisions;
  const translations = read("prepared-translations-042.json").translations;
  const numbers = steps => steps.flatMap(step => step.match(/\d+(?:[.,]\d+)?/g) ?? []);
  assert.equal(repairs.length, 22);
  assert.equal(new Set(repairs.map(row => row.exercise_id)).size, 22);
  assert.equal(translations.length, 22);
  assert.equal(translations.reduce((sum, row) => sum + row.steps.length, 0), 73);
  assert.equal(repairs.reduce((sum, row) => sum + row.evidence.videos.length, 0), 86);
  const samples = repairs.flatMap(row => row.evidence.supplemental_samples);
  assert.equal(samples.length, 5);
  assert.equal(samples.reduce((sum, sample) => sum + sample.sample_count, 0), 54);
  assert.equal(repairs.flatMap(row => row.evidence.detail_frames).length, 4);
  const femaleOnly = repairs.filter(row => row.evidence.available_genders.length === 1);
  assert.deepEqual(femaleOnly.map(row => row.before.name), ["Dumbbell Figure Four Heels Elevated Hip Thrust"]);
  for (const repair of repairs) {
    const decision = decisions.find(row => row.exercise_id === repair.exercise_id);
    assert.equal(decision.sourceName, repair.before.name);
    assert.deepEqual(repair.after.steps, decision.steps);
    assert.equal(repair.after.name, repair.before.name);
    assert.equal(repair.after.description, repair.before.description);
    if (repair.exercise_id === "e23ca1e8-aac5-4347-a55f-5fb4ec6398dc") {
      assert.equal(repair.before.steps.length, 1);
      assert.equal(repair.after.steps.length, 3);
      assert.deepEqual(repair.step_count_change, decision.stepCountChange);
      assert.ok(repair.step_count_change.reason);
    } else assert.equal(repair.after.steps.length, repair.before.steps.length);
    assert.equal(repair.before_hash, getExerciseContentHash(repair.before));
    assert.equal(repair.after_hash, getExerciseContentHash(repair.after));
    assert.notEqual(repair.before_hash, repair.after_hash);
    assert.equal(Number.parseInt(createHash("sha256").update(repair.evidence.source_url).digest("hex").slice(0, 12), 16) + 1, repair.source_id);
    const expected = repair.evidence.available_genders.flatMap(gender => ["front", "side"].map(angle => `${gender}:${angle}`)).sort();
    assert.deepEqual(repair.evidence.videos.map(clip => `${clip.gender}:${clip.angle}`).sort(), expected);
    if (repair.evidence.identity_source) {
      const identity = repair.evidence.identity_source;
      const bytes = fs.readFileSync(identity.file);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), identity.sha256);
      const original = identity.pointer.split("/").slice(1).reduce((value, part) => value[part], JSON.parse(bytes));
      assert.equal(original.id, repair.source_id);
      assert.equal(original.name, repair.before.name);
      assert.deepEqual(original.steps, repair.before.steps);
      assert.equal(original.source_url, repair.evidence.source_url);
    }
    for (const clip of repair.evidence.videos) {
      assert.equal(clip.sample_window_seconds, clip.duration);
      assert.equal(new URL(clip.url).pathname.slice(1), clip.storage_path);
      assert.ok(clip.storage_path.endsWith(`/${repair.source_id}-${clip.angle}.mp4`));
      assert.equal(clip.storage_path.includes("/female/"), clip.gender === "female");
      assert.match(clip.video_sha256, /^[a-f0-9]{64}$/);
      assert.match(clip.sample_image_sha256, /^[a-f0-9]{64}$/);
    }
    for (const sample of repair.evidence.supplemental_samples) {
      assert.equal(sample.exercise_id, repair.exercise_id);
      assert.ok([6, 12].includes(sample.sample_count));
      assert.ok(sample.start_offset_seconds >= 0 && sample.sample_window_seconds > 0);
      assert.ok(sample.start_offset_seconds + sample.sample_window_seconds <= sample.duration + 0.000001);
      assert.ok(repair.evidence.videos.some(clip => clip.storage_path === sample.storage_path && clip.gender === sample.gender && clip.angle === sample.angle && clip.duration === sample.duration));
      if (sample.sample_count === 12) {
        assert.ok(["Barbell Calf Jump", "Dumbbell Alternating Arnold Press"].includes(repair.before.name));
        assert.equal(sample.start_offset_seconds, 0);
        assert.equal(sample.sample_window_seconds, 5);
      }
      assert.match(sample.sha256, /^[a-f0-9]{64}$/);
    }
    for (const detail of repair.evidence.detail_frames) {
      assert.equal(detail.exercise_id, repair.exercise_id);
      assert.ok(detail.at_seconds >= 0 && detail.at_seconds < detail.duration);
      assert.ok(repair.evidence.videos.some(clip => clip.storage_path === detail.storage_path && clip.gender === detail.gender && clip.angle === detail.angle && clip.duration === detail.duration));
      assert.match(detail.sha256, /^[a-f0-9]{64}$/);
    }
    const translation = translations.find(row => row.exercise_id === repair.exercise_id);
    assert.deepEqual(translation.source, repair.after);
    assert.deepEqual(validateExerciseTranslation(translation, { id: repair.exercise_id, ...repair.after }), []);
    assert.deepEqual(getExerciseSourceIssues(repair.after), []);
    assert.deepEqual(numbers(translation.steps), numbers(repair.after.steps));
    for (let index = 0; index < repair.after.steps.length; index++) {
      if (/\bleft\b/i.test(repair.after.steps[index])) assert.match(translation.steps[index], /trái/i);
      if (/\bright\b/i.test(repair.after.steps[index])) assert.match(translation.steps[index], /phải/i);
    }
  }
});

test("dumbbell/barbell transaction retains distinct grips, supports, crossed steps and demonstrated gender variants", () => {
  const repairs = read("source-restorations-009.json").restorations;
  const names = new Map(repairs.map(row => [row.before.name, row.after.steps.join(" ")]));
  for (const name of ["Dumbbell Goblet Curtsy Deficit Lunge", "Dumbbell Curtsy Deficit Lunge", "Barbell Curtsy Deficit Lunge", "Dumbbell Front Rack Curtsy Deficit Lunge"]) assert.match(names.get(name), /back and across behind/);
  assert.match(names.get("Dumbbell Goblet Curtsy Deficit Lunge"), /one dumbbell at your chest with both hands/);
  assert.match(names.get("Dumbbell Curtsy Deficit Lunge"), /dumbbell in each hand at your sides/);
  assert.match(names.get("Barbell Curtsy Deficit Lunge"), /barbell across your upper back/);
  assert.match(names.get("Dumbbell Front Rack Curtsy Deficit Lunge"), /dumbbell at each shoulder/);
  assert.match(names.get("Dumbbell Upright Row"), /2 dumbbells, one in each hand/);
  assert.match(names.get("Dumbbell Stability Ball Wall Squat"), /two dumbbells total, one in each hand/);
  assert.match(names.get("Dumbbell Laying Curl"), /Lie on your back/);
  assert.match(names.get("Ez Bar Spider Curl"), /chest against an incline bench.*EZ bar/);
  assert.match(names.get("Dumbbell Weighted Pull Ups"), /dumbbell to a weighted belt/);
  assert.doesNotMatch(names.get("Dumbbell Weighted Pull Ups"), /between your feet/);
  assert.match(names.get("Dumbbell Figure Four Heels Elevated Hip Thrust"), /upper back on a bench/);
  assert.match(names.get("Dumbbell Figure Four Heels Elevated Hip Thrust"), /dumbbell across your hips/);
  assert.match(names.get("Dumbbell Reverse Grip Bench Press"), /palms facing toward your head/);
  assert.doesNotMatch(names.get("Dumbbell Reverse Grip Bench Press"), /unrack|Raise the bar/);
  assert.match(names.get("Dumbbell Thruster"), /lower into a squat/);
  assert.match(names.get("Dumbbell Thruster"), /press both dumbbells overhead/);
  assert.match(names.get("Dumbbell Alternating Arnold Press"), /rotate that palm to face forward/);
  assert.match(names.get("Dumbbell Alternating Arnold Press"), /keeping the other dumbbell at your shoulder/);
  assert.match(names.get("Dumbbell Alternating Arnold Press"), /rotating your palm back toward your body/);
  assert.match(names.get("Dumbbell Staggered Waiters Bow"), /fixed bar/);
  assert.match(names.get("Dumbbell Staggered Waiters Bow"), /dumbbell in each hand/);
  assert.match(names.get("Barbell Block Conventional Deadlift"), /raised supports again/);
  assert.match(names.get("Dumbbell Shoulder External Rotation"), /inside of your raised knee/);
  assert.match(names.get("Dumbbell Shoulder External Rotation"), /about 90 degrees/);
  assert.match(names.get("Barbell Calf Jump"), /male demonstration keeps the forefeet on the floor/);
  assert.match(names.get("Barbell Calf Jump"), /female demonstration adds a small hop/);
  assert.doesNotMatch(names.get("Barbell Calf Jump"), /raise stay flat|hold for a second|don't leave the floor/);
  assert.match(names.get("Pushup to Renegade Row"), /on your knees as shown in the female/);
  assert.match(names.get("Pushup to Renegade Row"), /lower your chest between the dumbbells, then press back up/);
  assert.doesNotMatch(names.get("Dumbbell Neutral Seated Overhead Press"), /easier on the shoulder joints/);
  assert.doesNotMatch(names.get("Dumbbell Heels Up Goblet Squat"), /kneeling|Rotate at the spine/);
  const sql = fs.readFileSync("supabase/repairs/20261023_correct_dumbbell_barbell_instructions.sql", "utf8");
  assert.deepEqual(JSON.parse(sql.split("$noi_gym_sources$")[1]), repairs.map(row => ({ exercise_id: row.exercise_id, source_id: row.source_id, before_hash: row.before_hash, after_hash: row.after_hash, expected_updated_at: row.expected_updated_at, steps: row.after.steps })));
  assert.deepEqual(JSON.parse(sql.split("$noi_gym_translations$")[1]), read("prepared-translations-042.json").translations.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "source"))));
  assert.match(sql, /count\(distinct exercise_id\) from _noi_gym_restore_sources\) <> 22/);
  assert.match(sql, /current\.reviewed_at = planned\.reviewed_at\) <> 22/);
  assert.match(sql, /exercise.updated_at is distinct from patch.expected_updated_at/);
  assert.match(sql, /on conflict \(exercise_id, locale\) do nothing/);
  assert.doesNotMatch(sql, /disable row level security|disable trigger all/i);
});


test("bodyweight and uncategorized evidence retains all supports, bounded samples and the held nerve guide", () => {
  const held = read("source-review-decisions-009.json").deferred;
  assert.deepEqual(held.map(row => row.exercise_id), ["474b9866-556c-46e1-bdaf-2f2a3fd81b62"]);
  const repairs = read("source-restorations-010.json").restorations;
  const decisions = read("source-review-decisions-009.json").decisions;
  const translations = read("prepared-translations-043.json").translations;
  assert.ok(repairs.every(row => !held.some(item => item.exercise_id === row.exercise_id)));
  assert.ok(translations.every(row => !held.some(item => item.exercise_id === row.exercise_id)));
  const numbers = steps => steps.flatMap(step => step.match(/\d+(?:[.,]\d+)?/g) ?? []);
  assert.equal(repairs.length, 27);
  assert.equal(new Set(repairs.map(row => row.exercise_id )).size, 27);
  assert.equal(translations.length, 27);
  assert.equal(translations.reduce((sum, row) => sum + row.steps.length, 0), 88);
  assert.equal(repairs.reduce((sum, row) => sum + row.evidence.videos.length, 0), 106);
  const samples = repairs.flatMap(row => row.evidence.supplemental_samples);
  assert.equal(samples.length, 8);
  assert.equal(samples.reduce((sum, sample) => sum + sample.sample_count, 0), 72);
  assert.equal(repairs.flatMap(row => row.evidence.detail_frames).length, 6);
  const femaleOnly = repairs.filter(row => row.evidence.available_genders.length === 1);
  assert.deepEqual(femaleOnly.map(row => row.before.name), ["Bodyweight Feet Elevated Figure Four Glute Bridge"]);
  for (const repair of repairs) {
    const decision = decisions.find(row => row.exercise_id === repair.exercise_id);
    assert.equal(decision.sourceName, repair.before.name);
    assert.deepEqual(repair.after.steps, decision.steps);
    assert.equal(repair.after.name, repair.before.name);
    assert.equal(repair.after.description, repair.before.description);
    assert.equal(repair.after.steps.length, repair.before.steps.length);
    assert.equal(repair.before_hash, getExerciseContentHash(repair.before));
    assert.equal(repair.after_hash, getExerciseContentHash(repair.after));
    assert.notEqual(repair.before_hash, repair.after_hash);
    assert.equal(Number.parseInt(createHash("sha256").update(repair.evidence.source_url).digest("hex").slice(0, 12), 16) + 1, repair.source_id);
    const expected = repair.evidence.available_genders.flatMap(gender => ["front", "side"].map(angle => `${gender}:${angle}`)).sort();
    assert.deepEqual(repair.evidence.videos.map(clip => `${clip.gender}:${clip.angle}`).sort(), expected);
    if (repair.evidence.identity_source) {
      const identity = repair.evidence.identity_source;
      const bytes = fs.readFileSync(identity.file);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), identity.sha256);
      const original = identity.pointer.split("/").slice(1).reduce((value, part) => value[part], JSON.parse(bytes));
      assert.equal(original.id, repair.source_id);
      assert.equal(original.name, repair.before.name);
      assert.deepEqual(original.steps, repair.before.steps);
      assert.equal(original.source_url, repair.evidence.source_url);
    }
    for (const clip of repair.evidence.videos) {
      assert.equal(clip.sample_window_seconds, clip.duration);
      assert.equal(new URL(clip.url).pathname.slice(1), clip.storage_path);
      assert.ok(clip.storage_path.endsWith(`/${repair.source_id}-${clip.angle}.mp4`));
      assert.equal(clip.storage_path.includes("/female/"), clip.gender === "female");
      assert.match(clip.video_sha256, /^[a-f0-9]{64}$/);
      assert.match(clip.sample_image_sha256, /^[a-f0-9]{64}$/);
    }
    for (const sample of repair.evidence.supplemental_samples) {
      assert.equal(sample.exercise_id, repair.exercise_id);
      assert.ok([6, 12].includes(sample.sample_count));
      assert.ok(sample.start_offset_seconds >= 0 && sample.sample_window_seconds > 0);
      assert.ok(sample.start_offset_seconds + sample.sample_window_seconds <= sample.duration + 0.000001);
      assert.ok(repair.evidence.videos.some(clip => clip.storage_path === sample.storage_path && clip.gender === sample.gender && clip.angle === sample.angle && clip.duration === sample.duration));
      if (sample.sample_count === 12) {
        assert.ok(["Machine Horizontal Leg Press Calf Jump", "Infinity Loop Standing Hip Mobility"].includes(repair.before.name));
        assert.equal(sample.start_offset_seconds, 0);
        assert.equal(sample.sample_window_seconds, Math.min(repair.before.name === "Infinity Loop Standing Hip Mobility" ? 10 : 5, sample.duration));
      }
      assert.match(sample.sha256, /^[a-f0-9]{64}$/);
    }
    for (const detail of repair.evidence.detail_frames) {
      assert.equal(detail.exercise_id, repair.exercise_id);
      assert.ok(detail.at_seconds >= 0 && detail.at_seconds < detail.duration);
      assert.ok(repair.evidence.videos.some(clip => clip.storage_path === detail.storage_path && clip.gender === detail.gender && clip.angle === detail.angle && clip.duration === detail.duration));
      assert.match(detail.sha256, /^[a-f0-9]{64}$/);
    }
    const translation = translations.find(row => row.exercise_id === repair.exercise_id);
    assert.deepEqual(translation.source, repair.after);
    assert.deepEqual(validateExerciseTranslation(translation, { id: repair.exercise_id, ...repair.after }), []);
    assert.deepEqual(getExerciseSourceIssues(repair.after), []);
    assert.deepEqual(numbers(translation.steps), numbers(repair.after.steps));
    for (let index = 0; index < repair.after.steps.length; index++) {
      if (/\bleft\b/i.test(repair.after.steps[index])) assert.match(translation.steps[index], /trái/i);
      if (/\bright\b/i.test(repair.after.steps[index])) assert.match(translation.steps[index], /phải/i);
    }
  }
});

test("stage 17 SQL is scoped to the 27 accepted rows and leaves the held exercise untouched", () => {
  const repairs = read("source-restorations-010.json").restorations;
  const translations = read("prepared-translations-043.json").translations;
  const held = read("source-review-decisions-009.json").deferred.map(row => row.exercise_id);
  const sql = fs.readFileSync(new URL("../supabase/repairs/20261023_correct_bodyweight_uncategorized_instructions.sql", import.meta.url), "utf8");
  const payload = tag => JSON.parse(sql.split(`$${tag}$`)[1]);
  assert.deepEqual(payload("noi_gym_sources"), repairs.map(row => ({ exercise_id: row.exercise_id, source_id: row.source_id, before_hash: row.before_hash, after_hash: row.after_hash, expected_updated_at: row.expected_updated_at, steps: row.after.steps })));
  assert.deepEqual(payload("noi_gym_translations"), translations.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "source"))));
  assert.ok(held.every(id => !repairs.some(row => row.exercise_id === id) && !translations.some(row => row.exercise_id === id)));
  assert.match(sql, /count\(distinct exercise_id\) from _noi_gym_restore_sources\) <> 27/);
  assert.match(sql, /current\.reviewed_at = planned\.reviewed_at\) <> 27/);
  assert.match(sql, /exercise\.updated_at is distinct from patch\.expected_updated_at/);
  assert.match(sql, /public\.exercise_content_hash\(exercise\.name, exercise\.description, exercise\.steps\)/);
  assert.match(sql, /\(to_jsonb\(exercise\) - 'steps'\) is distinct from \(to_jsonb\(original\) - 'steps'\)/);
  assert.match(sql, /alter table public\.exercises disable trigger exercises_updated_at/);
  assert.match(sql, /alter table public\.exercises enable trigger exercises_updated_at/);
  assert.doesNotMatch(sql, /disable row level security|disable trigger all/i);
});

