import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { saveReport } from './common.mjs';

if (process.argv.includes('--help')) {
  console.log('Read local verified media manifests and prepare a 12-clip pilot inventory. No network, downloads, uploads or database writes. Usage: node scripts/performance/audit-media-inventory.mjs');
} else {
  const root = 'artifacts/media-migration';
  const readJson = async (file) => JSON.parse(await readFile(`${root}/${file}`, 'utf8'));
  const readJsonLines = async (file) => (await readFile(`${root}/${file}`, 'utf8')).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  const videos = new Map();
  const posters = new Map();
  const videoRows = await readJsonLines('musclewiki-r2-manifest.jsonl');
  const posterRows = await readJsonLines('musclewiki-r2-poster-manifest.jsonl');
  const recovered = await readJson('recovered-duplicate-r2-media-2026-10-14.json');
  const checkpoint = await readJson('r2-checkpoint-2026-10-14.json');
  for (const row of videoRows) if (row.status?.startsWith('verified-') && row.path && Number.isSafeInteger(row.size)) videos.set(row.path, row);
  for (const row of posterRows) if (row.status?.startsWith('verified-') && row.storagePath && Number.isSafeInteger(row.optimizedBytes)) posters.set(row.storagePath, row);
  const canonicalVideos = [...videos.values()];
  for (const row of recovered.results) if (row.target && Number.isSafeInteger(row.size)) videos.set(row.target, { path: row.target, size: row.size, sha256: row.sha256, gender: 'legacy', angle: null });
  const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);
  const pilot = [];
  for (const gender of ['male', 'female']) for (const angle of ['front', 'side']) {
    const group = canonicalVideos.filter((row) => row.gender === gender && row.angle === angle).sort((a, b) => a.size - b.size);
    for (const quantile of [0.1, 0.5, 0.9]) {
      const row = group[Math.min(group.length - 1, Math.floor(group.length * quantile))];
      if (row && !pilot.some((selected) => selected.path === row.path)) pilot.push({ path: row.path, gender, angle, size: row.size, sha256: row.sha256, sizeQuantile: quantile, structureVerified: false });
    }
  }
  const knownVideoBytes = sum([...videos.values()], 'size');
  const knownPosterBytes = sum([...posters.values()], 'optimizedBytes');
  const ffmpegPath = 'artifacts/localization/video-tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe';
  const ffmpegExists = await access(ffmpegPath).then(() => true).catch(() => false);
  const ffprobeName = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
  const ffprobeChecks = await Promise.all((process.env.PATH ?? '').split(path.delimiter).filter(Boolean).map((directory) => access(path.join(directory, ffprobeName)).then(() => true).catch(() => false)));
  const verifiedDates = [...videoRows, ...posterRows].map((row) => row.verifiedAt).filter(Boolean).sort();
  const report = {
    schemaVersion: 1, capturedAt: new Date().toISOString(), mode: 'local-manifests-only',
    sourceFiles: ['musclewiki-r2-manifest.jsonl', 'musclewiki-r2-poster-manifest.jsonl', 'recovered-duplicate-r2-media-2026-10-14.json', 'r2-checkpoint-2026-10-14.json'],
    manifests: { earliestVerification: verifiedDates[0], latestVerification: verifiedDates.at(-1), videoObjects: videos.size, videoBytes: knownVideoBytes, posterObjects: posters.size, posterBytes: knownPosterBytes, combinedKnownBytes: knownVideoBytes + knownPosterBytes },
    historicalCheckpoint: { verifiedAt: checkpoint.verifiedAt, objects: checkpoint.objects, bytes: checkpoint.bytes },
    capacity: {
      currentCapacityVerified: false,
      freeTierBudgetAssumptionBytes: 10_000_000_000,
      provisionalHeadroomBytes: 10_000_000_000 - knownVideoBytes - knownPosterBytes,
      note: 'This arithmetic uses the user-requested 10 GB budget and old local manifests, not live Cloudflare usage or billing. It omits unrecorded objects/uploads and is not permission or proof of capacity to upload.',
    },
    tooling: { ffmpegPath, ffmpegExists, ffprobeOnPathFound: ffprobeChecks.some(Boolean), ffmpegVersionPreviouslyChecked: '7.1' },
    pilot: { objects: pilot.length, originalBytes: sum(pilot, 'size'), candidates: pilot, uploaded: false, downloaded: false, remuxed: false },
    nextChecks: [
      'Verify live account/bucket usage and remaining budget before any R2 upload.',
      'Inspect moov/mdat ordering of the 12 candidates using bounded Range reads; only 2 separate historical clips have been inspected so far.',
      'For candidates missing faststart, remux local copies with stream copy and preserve all original object URLs.',
      'Compare duration, codecs, dimensions, playback and seek; record output bytes and content checksums.',
      'Compare first/all video playback with a bounded pilot before expanding; no wholesale media duplication.',
    ],
  };
  await saveReport('media-pilot-feasibility-local.json', report);
  console.log(JSON.stringify({ file: 'artifacts/performance/media-pilot-feasibility-local.json', manifests: report.manifests, capacity: report.capacity, tooling: report.tooling, pilot: { objects: pilot.length, originalBytes: report.pilot.originalBytes } }, null, 2));
}
