import { readFile } from 'node:fs/promises';
import { round, saveReport } from './common.mjs';

const HELP = `Compare two measure-http.mjs reports without network access.
Usage: node scripts/performance/compare-http.mjs --before artifacts/performance/baseline-local-http.json --after artifacts/performance/optimized-local-http.json --label local-comparison
Reports nearest-rank p50/p95 and exact content/order/media/poster hashes per route/language.
Fails for changed/missing content, response/card failures or mismatched case coverage.
Performance changes are reported; they are not themselves a pass/fail threshold.
Output: artifacts/performance/<label>.json
`;

async function main() {
  const args = {};
  for (let index = 2; index < process.argv.length; index++) {
    const key = process.argv[index];
    if (key === '--help') { console.log(HELP); return; }
    if (!['--before', '--after', '--label'].includes(key)) throw new Error(`Unknown argument: ${key}`);
    args[key.slice(2)] = process.argv[++index];
  }
  if (!args.before || !args.after) throw new Error('--before and --after are required.');
  const label = args.label ?? 'http-comparison';
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(label)) throw new Error('--label accepts letters, digits, underscore and hyphen only.');
  const before = JSON.parse(await readFile(args.before, 'utf8'));
  const after = JSON.parse(await readFile(args.after, 'utf8'));
  if (before.schemaVersion !== 1 || after.schemaVersion !== 1) throw new Error('Unsupported measurement report schema.');
  const byKey = (report) => new Map(report.summaries.map((summary) => [`${summary.path}|${summary.language}`, summary]));
  const oldGroups = byKey(before), newGroups = byKey(after);
  const cases = [...new Set([...oldGroups.keys(), ...newGroups.keys()])].map((key) => {
    const oldGroup = oldGroups.get(key), newGroup = newGroups.get(key);
    if (!oldGroup || !newGroup) return { key, comparable: false, reason: 'Case missing in one report.' };
    const same = (name) => oldGroup.fingerprints[name]?.length === 1 && newGroup.fingerprints[name]?.length === 1 && oldGroup.fingerprints[name][0] === newGroup.fingerprints[name][0];
    const compareMetrics = (scope) => Object.fromEntries(['headersMs', 'firstByteMs', 'firstCardStartMs', 'firstCompleteCardMs', 'completeMs', 'bytes'].map((metric) => {
      const oldMetric = oldGroup[scope][metric], newMetric = newGroup[scope][metric];
      return [metric, {
        before: oldMetric, after: newMetric,
        p50ReductionPercent: oldMetric.p50 > 0 && newMetric.p50 != null ? round((1 - newMetric.p50 / oldMetric.p50) * 100) : null,
        p95ReductionPercent: oldMetric.p95 > 0 && newMetric.p95 != null ? round((1 - newMetric.p95 / oldMetric.p95) * 100) : null,
      }];
    }));
    return {
      key, comparable: true, requests: { before: oldGroup.requests, after: newGroup.requests },
      validResponses: oldGroup.failures === 0 && newGroup.failures === 0 && oldGroup.missingCards === 0 && newGroup.missingCards === 0,
      sameOrder: same('orderHash'), sameContent: same('contentHash'), sameMedia: same('mediaUrlHash'), samePosters: same('posterUrlHash'),
      all: compareMetrics('all'), repeats: compareMetrics('repeats'),
    };
  });
  const report = {
    schemaVersion: 1, createdAt: new Date().toISOString(), before: args.before, after: args.after,
    notes: ['Local production-build times do not measure Vercel production latency.', 'Server cache state is not inferred from run number or HTTP response cache headers.', 'First-run timing is included in all; repeats excludes run 1. At least 20 samples are required for reported scenario percentiles.'],
    contentEquivalent: cases.length > 0 && cases.every((item) => item.comparable && item.validResponses && item.sameOrder && item.sameContent && item.sameMedia && item.samePosters),
    cases,
  };
  await saveReport(`${label}.json`, report);
  console.log(JSON.stringify({ file: `artifacts/performance/${label}.json`, contentEquivalent: report.contentEquivalent, cases: cases.map((item) => ({ key: item.key, comparable: item.comparable, validResponses: item.validResponses, sameOrder: item.sameOrder, sameContent: item.sameContent, sameMedia: item.sameMedia, samePosters: item.samePosters, firstCompleteCard: item.all?.firstCompleteCardMs })) }, null, 2));
  if (!report.contentEquivalent) process.exitCode = 1;
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
