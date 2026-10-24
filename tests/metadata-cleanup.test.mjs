import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { renderMetadataCleanupSql, validateMetadataRepair } from "../scripts/localization/metadata-cleanup.mjs";
import { readReviewedContent, resolveReviewedContent } from "../scripts/localization/reviewed-content.mjs";

const manifest = JSON.parse(fs.readFileSync("scripts/localization/data/source-restorations-003.json", "utf8"));
const sql = fs.readFileSync("supabase/repairs/20261023_remove_difficulty_instruction_metadata.sql", "utf8");

test("difficulty cleanup removes only the unnumbered label proven by the original DOM", () => {
  assert.equal(manifest.restorations.length, 8);
  for (const repair of manifest.restorations) {
    validateMetadataRepair(repair);
    const wrong = structuredClone(repair);
    wrong.after.steps[0] += " Changed.";
    assert.throws(() => validateMetadataRepair(wrong));
  }
});

test("metadata transaction guards exact approved revisions and preserves source fields and public RLS", () => {
  assert.equal(sql, renderMetadataCleanupSql(manifest));
  assert.match(sql, /to_jsonb\(current\) = to_jsonb\(jsonb_populate_record\(null::public.exercise_translations, patch.before_translation\)\)/);
  assert.match(sql, /exercise.updated_at is distinct from patch.expected_updated_at/);
  assert.match(sql, /\(to_jsonb\(exercise\) - 'steps'\) is distinct from \(to_jsonb\(original\) - 'steps'\)/);
  assert.match(sql, /alter table public.exercises enable trigger exercises_updated_at/);
  assert.doesNotMatch(sql, /disable row level security|disable trigger all|delete from|truncate|drop table public/i);
  const duplicate = structuredClone(manifest);
  duplicate.restorations[1] = duplicate.restorations[0];
  assert.throws(() => renderMetadataCleanupSql(duplicate));
});

test("revision resolution requires the exact prior approval, stable identity and live verification", () => {
  const first = manifest.restorations[0];
  const row = { ...first.previous_approval, source_hash: first.after_hash, source: first.after, steps: first.after_translation.steps };
  const revision = { databaseVerifiedAt: "2026-10-23T05:00:00Z", translations: [row], revisions: [{
    exercise_id: row.exercise_id, locale: row.locale, previous: first.previous_approval, before_hash: first.before_hash, after_hash: first.after_hash,
  }] };
  const batches = [{ translations: [first.previous_approval] }];
  assert.deepEqual(resolveReviewedContent(batches, [revision]), [row]);
  const changed = structuredClone(revision);
  changed.revisions[0].previous.steps[1] += " Changed.";
  assert.throws(() => resolveReviewedContent(batches, [changed]), /Previous approval changed/);
  assert.throws(() => resolveReviewedContent(batches, [{ ...revision, databaseVerifiedAt: null }]), /live database verification/);
  assert.throws(() => resolveReviewedContent(batches, [{ ...revision, translations: [{ ...row, exercise_id: "another-source" }] }]), /Missing revision evidence/);
  assert.throws(() => resolveReviewedContent([...batches, ...batches], []), /Duplicate original approval/);
});

test("historical approvals remain intact when resolving the current reviewed inventory", () => {
  const { batches, revisions, rows } = readReviewedContent();
  assert.equal(rows.length, batches.reduce((sum, batch) => sum + batch.translations.length, 0));
  for (const repair of manifest.restorations) {
    const historical = batches.flatMap(batch => batch.translations).find(row => row.exercise_id === repair.exercise_id);
    assert.deepEqual(historical, repair.previous_approval);
    const current = rows.find(row => row.exercise_id === repair.exercise_id);
    assert.equal(current.source_hash, revisions.length ? repair.after_hash : repair.before_hash);
  }
});
