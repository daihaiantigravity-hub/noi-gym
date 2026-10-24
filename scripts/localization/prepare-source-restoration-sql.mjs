import fs from "node:fs";
import path from "node:path";
import { getExerciseContentHash, validateExerciseTranslation } from "../../lib/exercises/translation-content.mjs";
import { createLocalizationClient, readExerciseSources, readOption } from "./common.mjs";

// Read-only preflight. This creates a reviewable SQL file and never executes SQL.
const args = process.argv.slice(2);
const repairPath = readOption(args, "--repairs", "scripts/localization/data/source-restorations-001.json");
const preparedPath = readOption(args, "--translations", "scripts/localization/data/prepared-translations-035.json");
const output = readOption(args, "--output", "supabase/repairs/20261023_restore_numeric_exercise_steps.sql");
const repair = JSON.parse(fs.readFileSync(repairPath, "utf8"));
const prepared = JSON.parse(fs.readFileSync(preparedPath, "utf8"));
if (repair.reviewStatus !== "reviewed" || !Array.isArray(repair.restorations) || repair.restorations.length < 1 || repair.restorations.length > 50
  || !Array.isArray(prepared.translations) || !prepared.translations.length || prepared.translations.length > repair.restorations.length) throw new Error("Unexpected repair scope");
if (new Set(repair.restorations.map(row => row.exercise_id)).size !== repair.restorations.length
  || new Set(prepared.translations.map(row => row.exercise_id)).size !== prepared.translations.length) throw new Error("Duplicate repair or translation identity");
const client = createLocalizationClient();
const current = new Map((await readExerciseSources(client)).map((row) => [row.id, row]));
for (const row of repair.restorations) {
  const source = current.get(row.exercise_id);
  if (!source || source.source !== "musclewiki" || source.source_id !== row.source_id || source.updated_at !== row.expected_updated_at || getExerciseContentHash(source) !== row.before_hash) throw new Error(`Source changed; refresh repair before preparing SQL: ${row.exercise_id}`);
  if (getExerciseContentHash(row.before) !== row.before_hash || getExerciseContentHash(row.after) !== row.after_hash || row.before_hash === row.after_hash
    || row.before.name !== row.after.name || row.before.description !== row.after.description) throw new Error(`Only verified instruction changes are supported: ${row.exercise_id}`);
}
const repaired = new Map(repair.restorations.map((row) => [row.exercise_id, row]));
for (const row of prepared.translations) {
  const source = repaired.get(row.exercise_id);
  if (!source || source.translation_decision !== "ready" || row.locale !== "vi" || row.translation_status !== "reviewed" || validateExerciseTranslation(row, { id: row.exercise_id, ...source.after }).length) throw new Error(`Invalid prepared translation: ${row.exercise_id}`);
}
if (repair.restorations.some(row => row.translation_decision === "ready" && !prepared.translations.some(text => text.exercise_id === row.exercise_id))) throw new Error("Missing translation for a ready source");
const { data: existing, error } = await client.from("exercise_translations").select("exercise_id").in("exercise_id", [...repaired.keys()]);
if (error) throw new Error(`Unable to inspect translations: ${error.code}`);
if (existing.length) throw new Error("A translation was created during review; refresh the repair before generating SQL");

const sourceRows = repair.restorations.map((row) => ({
  exercise_id: row.exercise_id, source_id: row.source_id, before_hash: row.before_hash, after_hash: row.after_hash,
  expected_updated_at: row.expected_updated_at, steps: row.after.steps,
}));
const translationRows = prepared.translations.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "source")));
const reviewedCounts = await Promise.all([null, "vi", "en"].map(async (locale) => {
  let query = client.from("exercise_translations").select("*", { count: "exact", head: true }).eq("translation_status", "reviewed");
  if (locale) query = query.eq("locale", locale);
  const { count, error } = await query;
  if (error || count === null) throw new Error(`Unable to count reviewed translations (${error?.code ?? "unknown"})`);
  return count;
}));
const sourceCount = sourceRows.length, translationCount = translationRows.length;
const expectedCounts = [reviewedCounts[0] + translationCount, reviewedCounts[1] + translationCount, reviewedCounts[2]];
const sources = JSON.stringify(sourceRows, null, 2), translations = JSON.stringify(translationRows, null, 2);
if (sources.includes("$noi_gym_sources$") || translations.includes("$noi_gym_translations$")) throw new Error("SQL payload delimiter collision");
const sql = `-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Apply ${sourceCount} reviewed instruction corrections and insert ${translationCount} reviewed VI translations.
-- Run the WHOLE file in a new SQL Editor query. Re-running it is safe.
-- Only exercise.steps changes; media, names, categories and timestamps are preserved.
-- The timestamp trigger alone is suspended inside this transaction; RLS and
-- translation validation/staleness triggers remain enabled. Errors roll back all changes.

begin;
set local lock_timeout = '5s';
lock table public.exercises in share row exclusive mode;
lock table public.exercise_translations in share row exclusive mode;

create temp table _noi_gym_restore_sources on commit drop as
select * from jsonb_to_recordset($noi_gym_sources$
${sources}
$noi_gym_sources$::jsonb) as payload(
  exercise_id uuid, source_id bigint, before_hash text, after_hash text,
  expected_updated_at timestamptz, steps jsonb
);

create temp table _noi_gym_restore_translations on commit drop as
select * from jsonb_to_recordset($noi_gym_translations$
${translations}
$noi_gym_translations$::jsonb) as payload(
  exercise_id uuid, locale text, source_locale text, source_hash text,
  name text, description text, steps jsonb, translation_status text, reviewed_at timestamptz
);

create temp table _noi_gym_restore_before on commit drop as
select exercise.* from public.exercises as exercise
join _noi_gym_restore_sources as patch on patch.exercise_id = exercise.id;

do $verify_before$
begin
  if (select count(*) from _noi_gym_restore_sources) <> ${sourceCount}
    or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> ${sourceCount}
    or (select count(*) from _noi_gym_restore_translations) <> ${translationCount}
    or (select count(*) from _noi_gym_restore_before) <> ${sourceCount} then
    raise exception 'Unexpected repair scope or wrong Supabase project';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Expected enabled exercise timestamp trigger';
  end if;
  if exists (
    select 1 from public.exercises as exercise
    join _noi_gym_restore_sources as patch on patch.exercise_id = exercise.id
    where exercise.source <> 'musclewiki' or exercise.source_id is distinct from patch.source_id
      or exercise.updated_at is distinct from patch.expected_updated_at
      or public.exercise_content_hash(exercise.name, exercise.description, exercise.steps)
        not in (patch.before_hash, patch.after_hash)
  ) then
    raise exception 'Source revision changed. Do not overwrite; refresh the prepared repair';
  end if;
  -- Existing rows are accepted only when they exactly match this completed repair.
  if exists (
    select 1 from public.exercise_translations as current
    join _noi_gym_restore_sources as source on source.exercise_id = current.exercise_id
    left join _noi_gym_restore_translations as planned
      on planned.exercise_id = current.exercise_id and planned.locale = current.locale
    where planned.exercise_id is null
      or current.source_hash is distinct from planned.source_hash
      or current.source_locale is distinct from planned.source_locale
      or current.name is distinct from planned.name
      or current.description is distinct from planned.description
      or current.steps is distinct from planned.steps
      or current.translation_status is distinct from planned.translation_status
      or current.reviewed_at is distinct from planned.reviewed_at
  ) then
    raise exception 'Translation changed during review. Refresh instead of overwriting';
  end if;
end;
$verify_before$;

alter table public.exercises disable trigger exercises_updated_at;
update public.exercises as exercise
set steps = patch.steps
from _noi_gym_restore_sources as patch
where exercise.id = patch.exercise_id
  and public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) = patch.before_hash;
alter table public.exercises enable trigger exercises_updated_at;

insert into public.exercise_translations (
  exercise_id, locale, source_locale, source_hash, name, description,
  steps, translation_status, reviewed_at
)
select exercise_id, locale, source_locale, source_hash, name, description,
  steps, translation_status, reviewed_at
from _noi_gym_restore_translations
on conflict (exercise_id, locale) do nothing;

do $verify_after$
begin
  if exists (
    select 1 from public.exercises as exercise
    join _noi_gym_restore_sources as patch on patch.exercise_id = exercise.id
    join _noi_gym_restore_before as original on original.id = exercise.id
    where public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) <> patch.after_hash
      or (to_jsonb(exercise) - 'steps') is distinct from (to_jsonb(original) - 'steps')
  ) then
    raise exception 'Unexpected exercise field or timestamp change; repair rolled back';
  end if;
  if (select count(*) from public.exercise_translations as current
    join _noi_gym_restore_translations as planned
      on planned.exercise_id = current.exercise_id and planned.locale = current.locale
    where current.source_hash = planned.source_hash and current.name = planned.name
      and current.description = planned.description and current.steps = planned.steps
      and current.source_locale = planned.source_locale
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> ${translationCount} then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this patch: reviewed_total ${expectedCounts[0]}, VI ${expectedCounts[1]}, EN ${expectedCounts[2]}.
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
`;
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, sql, { flag: "wx" });
console.log(JSON.stringify({ output, mode: "prepared-only", sourceRepairs: sourceRows.length, vietnameseTranslations: translationRows.length, databaseWrites: 0 }));
