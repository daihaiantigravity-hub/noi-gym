import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Original batches stay immutable. A verified revision must identify the exact
// previously approved row; filenames alone never authorize an overwrite.
export function resolveReviewedContent(batches, revisions) {
  const current = new Map();
  for (const batch of batches) for (const row of batch.translations) {
    const key = `${row.exercise_id}:${row.locale}`;
    assert.ok(!current.has(key), `Duplicate original approval: ${key}`);
    current.set(key, row);
  }
  for (const revision of revisions) {
    assert.ok(Number.isFinite(Date.parse(revision.databaseVerifiedAt)), "Revision needs live database verification");
    assert.equal(revision.translations.length, revision.revisions.length);
    const seen = new Set();
    for (const row of revision.translations) {
      const key = `${row.exercise_id}:${row.locale}`;
      assert.ok(!seen.has(key), `Duplicate revision: ${key}`);
      seen.add(key);
      const evidence = revision.revisions.find(item => item.exercise_id === row.exercise_id && item.locale === row.locale);
      assert.ok(evidence, `Missing revision evidence: ${key}`);
      assert.deepEqual(current.get(key), evidence.previous, `Previous approval changed: ${key}`);
      assert.equal(row.source_hash, evidence.after_hash, `Revision source mismatch: ${key}`);
      assert.equal(evidence.previous.source_hash, evidence.before_hash);
      assert.equal(row.translation_status, "reviewed");
      current.set(key, row);
    }
  }
  return [...current.values()];
}

export function readReviewedContent(directory = "scripts/localization/data") {
  const names = fs.readdirSync(directory).sort();
  const read = pattern => names.filter(name => pattern.test(name)).map(name => JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")));
  const batches = read(/^reviewed-translations-\d+\.json$/);
  const revisions = read(/^reviewed-revisions-\d+\.json$/);
  for (const revision of revisions) {
    const repair = JSON.parse(fs.readFileSync(revision.repairManifest, "utf8"));
    assert.equal(repair.reviewStatus, "reviewed");
    assert.equal(repair.databaseStatus, "applied-and-verified");
    for (const row of revision.translations) {
      const evidence = repair.restorations.find(item => item.exercise_id === row.exercise_id);
      assert.ok(evidence, "Revision outside verified repair scope");
      assert.equal(row.source_hash, evidence.after_hash);
      assert.deepEqual(row.source, evidence.after);
      assert.deepEqual(row.steps, evidence.after_translation.steps);
    }
  }
  return { batches, revisions, rows: resolveReviewedContent(batches, revisions) };
}
