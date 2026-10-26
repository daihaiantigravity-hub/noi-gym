import { performance } from 'node:perf_hooks';
import { CARD_OPEN, distribution, htmlFingerprint, parseArguments, pause, round, saveReport } from './common.mjs';

const HELP = `Read-only, anonymous streamed-HTML benchmark (Node 20+).
Usage: node scripts/performance/measure-http.mjs --origin http://localhost:3001 --label after --runs 20
Options:
  --origin       HTTP(S) origin; default http://localhost:3001
  --label        Safe filename label; default local
  --runs         Sequential requests per route/language; default 5 (1..100)
  --routes       Comma-separated public paths; default chest, rear-shoulders/barbell, chest?page=2
  --languages    en,vi (default); en or vi
  --timeout-ms   Per-request deadline; default 45000
  --delay-ms     Delay between requests; default 150
  --help         Show help without making requests

Output: artifacts/performance/<label>-http.json, updated after each request.
firstCardStartMs = first real article opening received, firstCompleteCardMs = whole first article received.
These are stream-arrival times, NOT browser paint. No HTML, credentials or session cookies are saved.
Each group reports all samples and repeats excluding run 1; run 1 is NOT assumed cold.
Use >=20 runs for reported percentiles. This script never clears server caches.
`;

function summarize(results) {
  const groups = new Map();
  for (const result of results) {
    const key = `${result.path}|${result.language}`;
    const group = groups.get(key) ?? [];
    group.push(result);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => {
    const successful = group.filter((sample) => sample.status === 200 && !sample.error);
    const metrics = (samples) => Object.fromEntries(['headersMs', 'firstByteMs', 'firstCardStartMs', 'firstCompleteCardMs', 'completeMs', 'bytes'].map((name) => [name, distribution(samples.map((sample) => sample[name]))]));
    return {
      path: group[0].path, language: group[0].language, requests: group.length,
      failures: group.length - successful.length,
      missingCards: successful.filter((sample) => sample.cards === 0).length,
      firstRun: group[0], all: metrics(successful), repeats: metrics(successful.filter((sample) => sample.run > 1)),
      fingerprints: Object.fromEntries(['orderHash', 'contentHash', 'mediaUrlHash', 'posterUrlHash'].map((name) => [name, [...new Set(successful.map((sample) => sample[name]))]])),
    };
  });
}

async function measure(options, route, language, run) {
  const start = performance.now();
  const sample = { path: route, language, run, status: null, headersMs: null, firstByteMs: null, firstCardStartMs: null, firstCompleteCardMs: null, completeMs: null, bytes: 0 };
  try {
    const response = await fetch(`${options.origin}${route}`, {
      headers: { Cookie: `noi-gym-language=${language}`, 'User-Agent': 'noi-gym-readonly-http-benchmark/1.0', Accept: 'text/html' },
      signal: AbortSignal.timeout(options.timeoutMs),
      redirect: 'manual',
    });
    sample.status = response.status;
    sample.headersMs = round(performance.now() - start);
    sample.cache = response.headers.get('x-vercel-cache');
    sample.cacheControl = response.headers.get('cache-control');
    let html = '';
    let firstCardIndex = -1;
    const decoder = new TextDecoder();
    if (response.body) for await (const chunk of response.body) {
      sample.firstByteMs ??= round(performance.now() - start);
      sample.bytes += chunk.byteLength;
      if (sample.bytes > 15 * 1024 * 1024) throw new Error('HTML exceeded the 15 MiB benchmark limit.');
      html += decoder.decode(chunk, { stream: true });
      if (sample.firstCardStartMs === null) {
        firstCardIndex = html.search(CARD_OPEN);
        if (firstCardIndex >= 0) sample.firstCardStartMs = round(performance.now() - start);
      }
      if (firstCardIndex >= 0 && sample.firstCompleteCardMs === null && html.indexOf('</article>', firstCardIndex) >= 0) sample.firstCompleteCardMs = round(performance.now() - start);
    }
    html += decoder.decode();
    sample.completeMs = round(performance.now() - start);
    Object.assign(sample, htmlFingerprint(html));
  } catch (error) {
    // Record only error class: networking error messages may contain request URLs.
    sample.error = error.name;
    sample.completeMs = round(performance.now() - start);
  }
  return sample;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) { console.log(HELP); return; }
  const report = {
    schemaVersion: 1, startedAt: new Date().toISOString(), mode: 'anonymous-sequential-http',
    options, notes: ['HTTP stream arrival is not browser paint.', 'Run 1 and x-vercel-cache do not prove internal cache state.', 'No cookies other than language; no authenticated measurements.', 'Percentiles use nearest rank; fewer than 20 samples are diagnostic only.'],
    results: [], summaries: [],
  };
  for (const route of options.routes) for (const language of options.languages) for (let run = 1; run <= options.runs; run++) {
    const sample = await measure(options, route, language, run);
    report.results.push(sample);
    report.summaries = summarize(report.results);
    report.updatedAt = new Date().toISOString();
    await saveReport(`${options.label}-http.json`, report);
    console.log(JSON.stringify({ path: route, language, run, status: sample.status, firstCompleteCardMs: sample.firstCompleteCardMs, completeMs: sample.completeMs, cards: sample.cards, error: sample.error }));
    await pause(options.delayMs);
  }
  console.log(JSON.stringify({ file: `artifacts/performance/${options.label}-http.json`, summaries: report.summaries.map(({ path, language, failures, all, repeats }) => ({ path, language, failures, all: all.firstCompleteCardMs, repeats: repeats.firstCompleteCardMs })) }));
  if (report.results.some((sample) => sample.error || sample.status !== 200)) process.exitCode = 1;
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
