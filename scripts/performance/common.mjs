import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_ROUTES = ['/exercises/chest', '/exercises/rear-shoulders/barbell', '/exercises/chest?page=2'];
export const CARD_SELECTOR = 'article.exercise-library-exercise-card:not(.exercise-library-loading__card)';
export const CARD_OPEN = /<article\b(?![^>]*\bexercise-library-loading__card\b)[^>]*\bclass="[^"]*\bexercise-library-exercise-card(?:\s|\")[^>]*>/;

export function parseArguments(args, extra = []) {
  const allowed = new Set(['origin', 'label', 'runs', 'routes', 'languages', 'timeout-ms', 'delay-ms', 'help', ...extra]);
  const parsed = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index].replace(/^--/, '');
    if (!args[index].startsWith('--') || !allowed.has(key)) throw new Error(`Unknown argument: ${args[index]}`);
    if (key === 'help') { parsed.help = true; continue; }
    const value = args[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    parsed[key] = value;
  }
  if (parsed.help) return parsed;
  const origin = new URL(parsed.origin ?? 'http://localhost:3001');
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') {
    throw new Error('--origin must be an HTTP(S) origin without credentials, path or query.');
  }
  const label = parsed.label ?? 'local';
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(label)) throw new Error('--label accepts letters, digits, underscore and hyphen only.');
  const routes = parsed.routes ? parsed.routes.split(',') : DEFAULT_ROUTES;
  for (const route of routes) {
    const url = new URL(route, origin);
    if (!route.startsWith('/') || route.startsWith('//') || url.origin !== origin.origin || url.hash) throw new Error('--routes must contain same-origin paths.');
    if ([...url.searchParams.keys()].some((key) => !['page', 'gender'].includes(key))) throw new Error('Only public page/gender query parameters are supported.');
  }
  const languages = (parsed.languages ?? 'en,vi').split(',');
  if (!languages.length || languages.some((value) => !['en', 'vi'].includes(value))) throw new Error('--languages supports en,vi.');
  return {
    ...parsed, origin: origin.origin, label, routes, languages,
    runs: integer(parsed.runs ?? '5', '--runs', 1, 100),
    timeoutMs: integer(parsed['timeout-ms'] ?? '45000', '--timeout-ms', 1000, 120000),
    delayMs: integer(parsed['delay-ms'] ?? '150', '--delay-ms', 0, 60000),
  };
}

export function integer(value, name, minimum, maximum) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < minimum || result > maximum) throw new Error(`${name} must be an integer from ${minimum} to ${maximum}.`);
  return result;
}

export function hash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function decodeHtml(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|#x27);/gi, (match, entity) => {
    if (entity.startsWith('#')) return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
    return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[entity.toLowerCase()] ?? match;
  });
}

export function textContent(value = '') {
  return decodeHtml(value.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

export function htmlFingerprint(html) {
  const cards = [...html.matchAll(new RegExp(`${CARD_OPEN.source}[\\s\\S]*?<\\/article>`, 'g'))].map(([markup]) => {
    const detailLink = [...markup.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag).find((tag) => tag.includes('exercise-library-exercise-card__detail'));
    const href = decodeHtml(detailLink?.match(/\bhref="([^"]+)"/)?.[1] ?? '');
    const detail = href ? new URL(href, 'http://benchmark.invalid') : null;
    const stepList = markup.match(/<ol\b[^>]*>[\s\S]*?<\/ol>/)?.[0] ?? '';
    return {
      id: detail?.pathname.split('/').at(-1) ?? null,
      title: textContent(markup.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1]),
      steps: [...stepList.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(([, step]) => textContent(step)),
    };
  });
  const payloads = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)].map(([, value]) => {
    try { return JSON.parse(value); } catch { return ''; }
  }).join('');
  const videos = new Set([...html.matchAll(/<video\b[^>]*\bsrc="([^"]+)"/g)].map(([, value]) => decodeHtml(value)));
  for (const [, value] of payloads.matchAll(/"videoUrl"\s*:\s*("(?:[^"\\]|\\.)*")/g)) {
    try { const url = JSON.parse(value); if (url) videos.add(url); } catch { /* Ignore non-JSON RSC framing. */ }
  }
  const posters = new Set([...html.matchAll(/<(?:img|video)\b[^>]*>/g)].flatMap(([tag]) => {
    const value = tag.startsWith('<video') ? tag.match(/\bposter="([^"]+)"/)?.[1] : tag.includes('lazy-exercise-video__poster') ? tag.match(/\bsrc="([^"]+)"/)?.[1] : null;
    return value ? [decodeHtml(value)] : [];
  }));
  return {
    cards: cards.length,
    videos: (html.match(/<video\s/g) ?? []).length,
    mediaUrlCount: videos.size,
    posterUrlCount: posters.size,
    htmlLanguage: html.match(/<html\b[^>]*\blang="([^"]+)"/)?.[1] ?? null,
    title: textContent(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]),
    orderedIds: cards.map((card) => card.id),
    orderHash: hash(cards.map((card) => card.id)),
    contentHash: hash(cards),
    mediaUrlHash: hash([...videos].sort()),
    posterUrlHash: hash([...posters].sort()),
  };
}

// Nearest rank. A small diagnostic sample is explicitly not a stable p95 estimate.
export function distribution(values) {
  const sorted = values.filter((value) => typeof value === 'number' && Number.isFinite(value)).sort((a, b) => a - b);
  const at = (quantile) => sorted.length ? sorted[Math.max(0, Math.ceil(sorted.length * quantile) - 1)] : null;
  return { count: sorted.length, min: sorted[0] ?? null, p50: at(0.5), p95: at(0.95), max: sorted.at(-1) ?? null };
}

export function round(value) { return value == null ? null : Math.round(value * 10) / 10; }
export function pause(milliseconds) { return new Promise((resolve) => setTimeout(resolve, milliseconds)); }

export async function saveReport(filename, report) {
  const directory = path.resolve('artifacts/performance');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), `${JSON.stringify(report, null, 2)}\n`);
}
