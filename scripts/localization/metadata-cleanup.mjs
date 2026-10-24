import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { createLocalizationClient, readExerciseSources, readOption } from "./common.mjs";
import { readReviewedContent } from "./reviewed-content.mjs";
import { extractNumberedCardSteps } from "../migration/dom-instructions.mjs";
import { getExerciseContentHash, getSourceLocale, validateExerciseTranslation } from "../../lib/exercises/translation-content.mjs";

const hash = value => createHash("sha256").update(value).digest("hex");
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const writeNew = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
};
const content = row => ({ name: row.name, description: row.description, steps: row.steps });
const key = row => `${row.exercise_id}:${row.locale}`;

export function validateMetadataRepair(row) {
  assert.equal(row.before_translation.exercise_id, row.exercise_id);
  assert.equal(row.before_translation.source_locale, "en");
  assert.match(row.before.steps[0], /^(Beginner|Novice)$/);
  assert.match(row.before_translation.steps[0], /^(Người mới bắt đầu|Mới bắt đầu|Cơ bản)\.$/);
  assert.equal(row.before_translation.translation_status, "reviewed");
  assert.equal(row.before_translation.locale, "vi");
  assert.equal(row.before_translation.source_hash, getExerciseContentHash(row.before));
  assert.deepEqual(row.after, { ...row.before, steps: row.before.steps.slice(1) });
  assert.deepEqual(row.after_translation.steps, row.before_translation.steps.slice(1));
  for (const field of ["exercise_id", "locale", "source_locale", "name", "description", "translation_status", "created_at"])
    assert.deepEqual(row.after_translation[field], row.before_translation[field]);
  assert.equal(row.before_hash, getExerciseContentHash(row.before));
  assert.equal(row.after_hash, getExerciseContentHash(row.after));
  assert.equal(row.after_translation.source_hash, row.after_hash);
  assert.ok(Number.isFinite(Date.parse(row.after_translation.reviewed_at)));
  assert.deepEqual(validateExerciseTranslation(row.after_translation, { ...row.after, id: row.exercise_id }), []);
  const bytes = fs.readFileSync(row.evidence.file);
  assert.equal(hash(bytes), row.evidence.sha256);
  const card = row.evidence.pointer.split("/").slice(1).reduce((value, part) => value[part.replace(/~1/g, "/").replace(/~0/g, "~")], JSON.parse(bytes));
  assert.equal(card.cardText, row.evidence.cardText);
  assert.equal(card.url ?? card.sourceUrl, row.evidence.sourceUrl);
  assert.equal(parseInt(hash(row.evidence.sourceUrl).slice(0, 12), 16) + 1, row.source_id);
  assert.deepEqual(extractNumberedCardSteps(card.cardText), row.after.steps);
}

export function renderMetadataCleanupSql(manifest) {
  assert.equal(manifest.kind, "difficulty-metadata-cleanup");
  assert.equal(manifest.reviewStatus, "reviewed");
  assert.equal(manifest.restorations.length, 8);
  assert.equal(new Set(manifest.restorations.map(row => row.exercise_id)).size, 8);
  manifest.restorations.forEach(validateMetadataRepair);
  const payload = JSON.stringify(manifest.restorations.map(row => ({
    exercise_id: row.exercise_id, source_id: row.source_id, expected_updated_at: row.expected_updated_at,
    before_hash: row.before_hash, after_hash: row.after_hash, steps: row.after.steps,
    before_translation: row.before_translation, after_translation: row.after_translation,
  })), null, 2);
  assert.ok(!payload.includes("$metadata_payload$"));
  return `-- Noi Gym / exhgtcaczbgdqfozwrvg: remove difficulty metadata from 8 EN/VI instruction lists.
-- Full expected translation revisions are checked before any write. Run the entire file.
-- Temporary scratch tables disappear at commit. Public RLS and validation triggers stay enabled.
begin;
set local lock_timeout = '5s';
lock table public.exercises in share row exclusive mode;
lock table public.exercise_translations in share row exclusive mode;
create temp table _metadata_patch on commit drop as
select * from jsonb_to_recordset($metadata_payload$
${payload}
$metadata_payload$::jsonb) as patch(exercise_id uuid, source_id bigint, expected_updated_at timestamptz,
  before_hash text, after_hash text, steps jsonb, before_translation jsonb, after_translation jsonb);
create temp table _metadata_sources_before on commit drop as
select exercise.* from public.exercises exercise join _metadata_patch patch on patch.exercise_id = exercise.id;
do $preflight$
begin
  if (select count(*) from _metadata_patch) <> 8
    or (select count(distinct exercise_id) from _metadata_patch) <> 8
    or (select count(*) from _metadata_sources_before) <> 8
    or (select count(*) from public.exercise_translations current join _metadata_patch patch on patch.exercise_id = current.exercise_id) <> 8 then
    raise exception 'Unexpected metadata cleanup scope';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger where tgrelid = 'public.exercises'::regclass
    and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Expected enabled exercise timestamp trigger';
  end if;
  if exists (
    select 1 from public.exercises exercise join _metadata_patch patch on patch.exercise_id = exercise.id
    join public.exercise_translations current on current.exercise_id = exercise.id
    where exercise.source <> 'musclewiki' or exercise.source_id is distinct from patch.source_id
      or exercise.updated_at is distinct from patch.expected_updated_at
      or not (
        (public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) = patch.before_hash
          and to_jsonb(current) = to_jsonb(jsonb_populate_record(null::public.exercise_translations, patch.before_translation)))
        or (public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) = patch.after_hash
          and (to_jsonb(current) - 'updated_at') = (to_jsonb(jsonb_populate_record(null::public.exercise_translations, patch.after_translation)) - 'updated_at'))
      )
  ) then raise exception 'Source or approved translation revision changed; refresh instead of overwriting'; end if;
end;
$preflight$;
alter table public.exercises disable trigger exercises_updated_at;
update public.exercises exercise set steps = patch.steps from _metadata_patch patch
where exercise.id = patch.exercise_id
  and public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) = patch.before_hash;
alter table public.exercises enable trigger exercises_updated_at;
-- The source trigger first marks these translations stale. Restore reviewed status only
-- with the newly reviewed hash and the exact retained instruction list.
update public.exercise_translations current
set steps = planned.steps, source_hash = planned.source_hash, translation_status = planned.translation_status,
  reviewed_at = planned.reviewed_at
from _metadata_patch patch,
lateral jsonb_populate_record(null::public.exercise_translations, patch.after_translation) planned
where current.exercise_id = patch.exercise_id and current.locale = planned.locale
  and (to_jsonb(current) - 'updated_at') is distinct from (to_jsonb(planned) - 'updated_at');
do $postflight$
begin
  if exists (select 1 from public.exercises exercise
    join _metadata_patch patch on patch.exercise_id = exercise.id
    join _metadata_sources_before original on original.id = exercise.id
    where public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) <> patch.after_hash
      or (to_jsonb(exercise) - 'steps') is distinct from (to_jsonb(original) - 'steps')) then
    raise exception 'Unexpected source field or ranking timestamp change';
  end if;
  if (select count(*) from public.exercise_translations current
    join _metadata_patch patch on patch.exercise_id = current.exercise_id
    where (to_jsonb(current) - 'updated_at') = (to_jsonb(jsonb_populate_record(null::public.exercise_translations, patch.after_translation)) - 'updated_at')) <> 8 then
    raise exception 'Incomplete translation revision';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger where tgrelid = 'public.exercises'::regclass
    and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger not restored';
  end if;
end;
$postflight$;
commit;
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
`;
}

async function readTranslations(client) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("exercise_translations").select("*").order("exercise_id").order("locale").range(offset, offset + 499);
    if (error) throw new Error(`Translation read failed (${error.code})`);
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
async function snapshot(client) {
  const count = async table => {
    const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
    if (error) throw new Error(`Unable to count ${table} (${error.code})`);
    return count;
  };
  const [sources, translations, personal, featured] = await Promise.all([
    readExerciseSources(client), readTranslations(client), count("user_favorite_exercises"), count("admin_featured_exercises"),
  ]);
  return { capturedAt: new Date().toISOString(), sourceHash: hash(JSON.stringify(sources)), sources, translations,
    counts: { user_favorite_exercises: personal, admin_featured_exercises: featured } };
}

async function main() {
  const args = process.argv.slice(2);
  const manifestPath = readOption(args, "--manifest", "scripts/localization/data/source-restorations-003.json");
  const beforePath = readOption(args, "--before", "artifacts/localization/stage-10-before.json");
  const sqlPath = readOption(args, "--sql", "supabase/repairs/20261023_remove_difficulty_instruction_metadata.sql");
  const output = readOption(args, "--reviewed-output", "scripts/localization/data/reviewed-revisions-001.json");
  assert.ok(args.includes("--prepare") !== args.includes("--verify"), "Choose --prepare or --verify; neither mode writes to the database");
  const client = createLocalizationClient();
  const actual = await snapshot(client);
  if (args.includes("--prepare")) {
    const queue = read(readOption(args, "--queue", "artifacts/localization/metadata-step-cleanup-queue.json"));
    assert.equal(queue.items.length, 8);
    assert.equal(actual.sourceHash, queue.sourceHash, "Inventory changed since queue preparation");
    const approved = readReviewedContent().rows;
    const restorations = queue.items.map(item => {
      assert.deepEqual(actual.sources.find(row => row.id === item.exercise_id), item.before);
      const current = actual.translations.filter(row => row.exercise_id === item.exercise_id);
      assert.deepEqual(current, [item.currentTranslation], "Translation revision changed since review");
      const previous = approved.find(row => key(row) === key(item.currentTranslation));
      assert.ok(previous, "Missing local approval history");
      for (const field of ["name", "description", "steps", "source_hash", "translation_status"])
        assert.deepEqual(previous[field], item.currentTranslation[field]);
      const before = content(item.before), after = { ...before, steps: item.proposedSteps };
      const afterTranslation = { ...current[0], steps: current[0].steps.slice(1), source_hash: getExerciseContentHash(after), reviewed_at: actual.capturedAt };
      const row = { exercise_id: item.exercise_id, source_id: item.before.source_id,
        expected_updated_at: item.before.updated_at, before_hash: getExerciseContentHash(before), after_hash: getExerciseContentHash(after),
        before, after, before_translation: current[0], after_translation: afterTranslation, previous_approval: previous,
        evidence: { ...item.evidence, sha256: hash(fs.readFileSync(item.evidence.file)) } };
      validateMetadataRepair(row);
      return row;
    });
    const manifest = { version: 1, kind: "difficulty-metadata-cleanup", reviewStatus: "reviewed", databaseStatus: "prepared-not-applied",
      reviewedAt: actual.capturedAt, sourceHashBefore: actual.sourceHash,
      reviewMethod: "Exact captured DOM numbered instructions; remove only the unnumbered difficulty label in both locales. Preserve all retained words and existing approval history.", restorations };
    const sql = renderMetadataCleanupSql(manifest);
    for (const file of [beforePath, manifestPath, sqlPath]) assert.ok(!fs.existsSync(file), `Refusing to overwrite ${file}`);
    writeNew(beforePath, actual); writeNew(manifestPath, manifest); writeNew(sqlPath, sql);
    console.log(JSON.stringify({ mode: "prepared-only", sources: 8, revisedTranslations: 8, addedTranslations: 0, databaseWrites: 0, sqlPath }));
    return;
  }
  const before = read(beforePath), manifest = read(manifestPath);
  const changes = new Map(manifest.restorations.map(row => [row.exercise_id, row]));
  assert.equal(changes.size, 8);
  manifest.restorations.forEach(validateMetadataRepair);
  const expectedSources = before.sources.map(row => changes.has(row.id) ? { ...row, steps: changes.get(row.id).after.steps } : row);
  assert.deepEqual(actual.sources, expectedSources, "Unexpected source/media/category/timestamp change");
  assert.deepEqual(actual.counts, before.counts, "Favorites changed during cleanup");
  assert.equal(actual.translations.length, before.translations.length);
  const stored = new Map(actual.translations.map(row => [key(row), row]));
  for (const old of before.translations) {
    const found = stored.get(key(old)), repair = changes.get(old.exercise_id);
    if (!repair) { assert.deepEqual(found, old); continue; }
    const { updated_at: actualUpdated, ...fields } = found;
    const { updated_at: previousUpdated, ...expected } = repair.after_translation;
    assert.ok(Date.parse(actualUpdated) >= Date.parse(previousUpdated));
    // Timestamp offsets differ between SQL/PostgREST; compare instants explicitly.
    assert.equal(Date.parse(fields.reviewed_at), Date.parse(expected.reviewed_at));
    fields.reviewed_at = expected.reviewed_at;
    assert.deepEqual(fields, expected);
    assert.deepEqual(validateExerciseTranslation(found, actual.sources.find(row => row.id === old.exercise_id)), []);
  }
  const anonymous = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } });
  const publicRows = await readTranslations(anonymous);
  assert.equal(publicRows.length, actual.translations.length);
  const sources = new Map(actual.sources.map(row => [row.id, row]));
  for (const row of publicRows) {
    assert.equal(row.translation_status, "reviewed");
    assert.equal(row.source_hash, getExerciseContentHash(sources.get(row.exercise_id)));
  }
  const translations = manifest.restorations.map(row => {
    const translated = Object.fromEntries(Object.entries(row.after_translation).filter(([field]) => !["created_at", "updated_at"].includes(field)));
    return { ...translated, source: row.after };
  });
  const revision = { version: 1, reviewMethod: manifest.reviewMethod, databaseVerifiedAt: actual.capturedAt, repairManifest: manifestPath,
    revisions: manifest.restorations.map(row => ({ exercise_id: row.exercise_id, locale: "vi", before_hash: row.before_hash,
      after_hash: row.after_hash, previous: row.previous_approval })), translations };
  if (fs.existsSync(output)) assert.deepEqual(read(output).translations, translations);
  else writeNew(output, revision);
  const viIds = new Set([...actual.translations.filter(row => row.locale === "vi").map(row => row.exercise_id), ...actual.sources.filter(row => getSourceLocale(row) === "vi").map(row => row.id)]);
  const report = { verifiedAt: actual.capturedAt, revisedSources: changes.size, revisedTranslations: translations.length, addedTranslations: 0,
    reviewed: actual.translations.length, vietnameseContent: viIds.size, remainingVietnamese: actual.sources.length - viIds.size,
    translatedSteps: actual.translations.reduce((sum, row) => sum + row.steps.length, 0), sourceSteps: actual.sources.reduce((sum, row) => sum + row.steps.length, 0),
    sourceHashBefore: before.sourceHash, sourceHashAfter: actual.sourceHash, anonymousReviewed: publicRows.length, counts: actual.counts };
  fs.writeFileSync(manifestPath, JSON.stringify({ ...manifest, databaseStatus: "applied-and-verified", databaseVerifiedAt: actual.capturedAt }, null, 2) + "\n");
  fs.writeFileSync("artifacts/localization/stage-10-after.json", JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync("artifacts/localization/stage-10-current-snapshot.json", JSON.stringify(actual, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
