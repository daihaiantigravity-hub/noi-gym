import { CARD_SELECTOR, hash, integer, parseArguments, pause, round, saveReport } from './common.mjs';

const HELP = `Read-only anonymous Chromium benchmark (Node 20+, installed Playwright Chromium).
Usage: node scripts/performance/measure-browser.mjs --origin http://localhost:3001 --label after --runs 1 --routes /exercises/chest --languages en,vi --profiles mobile,mobile-4mbps
Options shared with measure-http.mjs: --origin --label --runs --routes --languages --timeout-ms --delay-ms
  --profiles     desktop,mobile,mobile-4mbps; default mobile
  --observe-ms   Observe after first visible card; default 15000 (1000..60000)
  --help         Show help without opening a browser
Default runs: 1. Each sample gets a fresh anonymous browser context. No scrolling.
Output: artifacts/performance/<label>-browser.json after each sample.
DOM arrival and visible double-requestAnimationFrame paint opportunity are separate; the latter is
an upper-bound paint opportunity, not an exact compositor timestamp. firstPoster uses decoded,
visible poster + paint opportunity. Video events are tracked per final page video; allVideosStartedMs
requires every final video to emit playing. allVideosPlayingMs additionally requires simultaneous
non-paused, ready video states. Missing times stay null, never zero. Network paths are hashed.
This opens public pages only; no saved login sessions, app mutations or server cache purges.
`;

function instrumentPage() {
  const state = window.__exerciseBenchmark = {
    firstCardDomMs: null, firstCardPaintOpportunityMs: null, firstPosterLoadedMs: null,
    firstPosterPaintOpportunityMs: null, firstVideoPlayingMs: null, allVideosPlayingMs: null,
    longTasks: [], layoutShifts: [], lcp: [], lastVideoCount: 0,
  };
  const videoEvents = new WeakMap();
  const paintedPosters = new WeakSet();
  const pendingPosters = new WeakSet();
  const videos = () => [...document.querySelectorAll('article.exercise-library-exercise-card video')];
  const visible = (element) => {
    if (!element?.isConnected) return false;
    const rectangle = element.getBoundingClientRect();
    if (rectangle.width <= 0 || rectangle.height <= 0 || rectangle.bottom <= 0 || rectangle.right <= 0 || rectangle.top >= innerHeight || rectangle.left >= innerWidth) return false;
    for (let node = element; node instanceof Element; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    }
    return true;
  };
  const afterPaintOpportunity = (callback) => requestAnimationFrame(() => requestAnimationFrame(callback));
  const sample = () => {
    const current = videos();
    if (current.length !== state.lastVideoCount) { state.lastVideoCount = current.length; state.allVideosPlayingMs = null; }
    if (current.length && current.every((video) => videoEvents.get(video)?.playingMs != null && !video.paused && video.readyState >= 2)) state.allVideosPlayingMs ??= performance.now();
    return current.map((video) => ({
      src: video.currentSrc || video.src, readyState: video.readyState, paused: video.paused,
      currentTime: video.currentTime, errorCode: video.error?.code ?? null,
      width: video.videoWidth, height: video.videoHeight, ...videoEvents.get(video),
    }));
  };
  window.__sampleExerciseVideos = sample;
  const observers = [];
  for (const [type, property, transform] of [
    ['longtask', 'longTasks', (entry) => ({ startMs: entry.startTime, durationMs: entry.duration })],
    ['layout-shift', 'layoutShifts', (entry) => ({ startMs: entry.startTime, value: entry.value, recentInput: entry.hadRecentInput })],
    ['largest-contentful-paint', 'lcp', (entry) => ({ startMs: entry.startTime, size: entry.size, tag: entry.element?.tagName ?? null })],
  ]) {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
    const observer = new PerformanceObserver((list) => state[property].push(...list.getEntries().map(transform)));
    observer.observe({ type, buffered: true });
    observers.push(observer);
  }
  let cardFramePending = false;
  const inspect = () => {
    const card = document.querySelector('article.exercise-library-exercise-card:not(.exercise-library-loading__card)');
    if (card?.querySelector('h2')?.textContent?.trim()) {
      state.firstCardDomMs ??= performance.now();
      if (state.firstCardPaintOpportunityMs === null && !cardFramePending) {
        cardFramePending = true;
        afterPaintOpportunity(() => {
          if (visible(card)) state.firstCardPaintOpportunityMs ??= performance.now();
          cardFramePending = false;
        });
      }
    }
    for (const poster of document.querySelectorAll('img.lazy-exercise-video__poster')) {
      if (!poster.complete || !poster.naturalWidth || paintedPosters.has(poster) || pendingPosters.has(poster)) continue;
      pendingPosters.add(poster);
      state.firstPosterLoadedMs ??= performance.now();
      poster.decode().then(() => afterPaintOpportunity(() => {
        if (visible(poster)) {
          paintedPosters.add(poster);
          state.firstPosterPaintOpportunityMs ??= performance.now();
        }
        pendingPosters.delete(poster);
      })).catch(() => pendingPosters.delete(poster));
    }
  };
  const mutationObserver = new MutationObserver(inspect);
  mutationObserver.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
  document.addEventListener('load', inspect, true);
  document.addEventListener('loadeddata', (event) => {
    if (!(event.target instanceof HTMLVideoElement)) return;
    const entry = videoEvents.get(event.target) ?? {};
    entry.loadedDataMs ??= performance.now();
    videoEvents.set(event.target, entry);
  }, true);
  document.addEventListener('playing', (event) => {
    if (!(event.target instanceof HTMLVideoElement)) return;
    const entry = videoEvents.get(event.target) ?? {};
    entry.playingMs ??= performance.now();
    videoEvents.set(event.target, entry);
    state.firstVideoPlayingMs ??= entry.playingMs;
    sample();
  }, true);
  const timer = setInterval(() => { inspect(); sample(); }, 100);
  window.__stopExerciseBenchmark = () => { clearInterval(timer); mutationObserver.disconnect(); observers.forEach((observer) => observer.disconnect()); };
}

function maximumClsWindow(entries) {
  let maximum = 0, value = 0, start = 0, last = 0;
  for (const entry of entries.filter((entry) => !entry.recentInput)) {
    if (entry.startMs - last > 1000 || entry.startMs - start > 5000) { start = entry.startMs; value = 0; }
    value += entry.value;
    last = entry.startMs;
    maximum = Math.max(maximum, value);
  }
  return maximum;
}

async function measure(browser, options, profile, route, language, run) {
  const mobile = profile !== 'desktop';
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const result = { profile, path: route, language, run, status: null, metrics: null, errors: [], network: [] };
  try {
    await context.addCookies([{ name: 'noi-gym-language', value: language, url: options.origin }]);
    await context.addInitScript(instrumentPage);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    if (profile === 'mobile-4mbps') {
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 500000, uploadThroughput: 125000 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }
    const requests = new Map();
    cdp.on('Network.requestWillBeSent', (event) => {
      const headers = Object.fromEntries(Object.entries(event.request.headers).map(([key, value]) => [key.toLowerCase(), value]));
      let origin = null;
      try { origin = new URL(event.request.url).origin; } catch { /* Non-HTTP resource. */ }
      requests.set(event.requestId, {
        type: event.type, origin, urlHash: hash(event.request.url), start: event.timestamp,
        prefetch: headers['next-router-prefetch'] === '1' || headers.purpose === 'prefetch' || String(headers['sec-purpose'] ?? '').includes('prefetch'),
        rsc: headers.rsc === '1', bytes: 0, finished: false,
      });
    });
    cdp.on('Network.responseReceived', (event) => {
      const request = requests.get(event.requestId);
      if (request) Object.assign(request, { status: event.response.status, mimeType: event.response.mimeType, fromDiskCache: event.response.fromDiskCache ?? false });
    });
    cdp.on('Network.dataReceived', (event) => { const request = requests.get(event.requestId); if (request) request.bytes += event.encodedDataLength; });
    cdp.on('Network.loadingFinished', (event) => {
      const request = requests.get(event.requestId);
      if (request) Object.assign(request, { bytes: event.encodedDataLength, finished: true, durationMs: round((event.timestamp - request.start) * 1000) });
    });
    cdp.on('Network.loadingFailed', (event) => {
      const request = requests.get(event.requestId);
      if (request) Object.assign(request, { failed: true, canceled: event.canceled ?? false, finished: true });
    });
    page.on('pageerror', (error) => result.errors.push({ name: error.name, messageHash: hash(error.message) }));
    const response = await page.goto(`${options.origin}${route}`, { waitUntil: 'domcontentloaded', timeout: options.timeoutMs });
    result.status = response?.status() ?? null;
    await page.locator(CARD_SELECTOR).first().waitFor({ state: 'visible', timeout: options.timeoutMs });
    await page.waitForTimeout(options.observeMs);
    const snapshot = await page.evaluate(() => {
      const videos = window.__sampleExerciseVideos();
      window.__stopExerciseBenchmark();
      const cards = [...document.querySelectorAll('article.exercise-library-exercise-card:not(.exercise-library-loading__card)')].map((card) => ({
        id: new URL(card.querySelector('a.exercise-library-exercise-card__detail').href).pathname.split('/').at(-1),
        title: card.querySelector('h2')?.textContent?.trim() ?? '',
        steps: [...card.querySelectorAll('ol p')].map((step) => step.textContent?.trim()),
      }));
      return {
        ...window.__exerciseBenchmark, capturedAtMs: performance.now(), cards, videos,
        htmlLanguage: document.documentElement.lang,
        navigation: performance.getEntriesByType('navigation').map((entry) => ({ responseStartMs: entry.responseStart, responseEndMs: entry.responseEnd, domContentLoadedMs: entry.domContentLoadedEventEnd, loadMs: entry.loadEventEnd })),
      };
    });
    const { cards, videos, ...metrics } = snapshot;
    const allStarted = videos.length > 0 && videos.every((video) => video.playingMs != null);
    result.metrics = {
      ...metrics, cls: maximumClsWindow(metrics.layoutShifts),
      allVideosStartedMs: allStarted ? Math.max(...videos.map((video) => video.playingMs)) : null,
      totalVideos: videos.length, startedVideos: videos.filter((video) => video.playingMs != null).length,
      playingVideosAtCapture: videos.filter((video) => !video.paused && video.currentTime > 0).length,
      cardCount: cards.length, orderedIds: cards.map((card) => card.id), orderHash: hash(cards.map((card) => card.id)),
      contentHash: hash(cards), mediaUrlHash: hash([...new Set(videos.map((video) => video.src).filter(Boolean))].sort()),
      videos: videos.map(({ src, ...video }) => ({ ...video, urlHash: hash(src) })),
    };
    result.network = [...requests.values()].map((request) => Object.fromEntries(Object.entries(request).filter(([key]) => key !== 'start')));
    result.networkSummary = result.network.reduce((groups, request) => {
      const group = groups[request.type] ??= { requests: 0, bytes: 0, prefetch: 0, unfinished: 0, failed: 0, canceled: 0 };
      group.requests++; group.bytes += request.bytes; group.prefetch += Number(request.prefetch);
      group.unfinished += Number(!request.finished); group.failed += Number(Boolean(request.failed));
      group.canceled += Number(Boolean(request.canceled));
      return groups;
    }, {});
  } catch (error) {
    result.errors.push({ name: error.name, messageHash: hash(error.message) });
  } finally { await context.close(); }
  return result;
}

async function main() {
  const options = parseArguments(process.argv.slice(2), ['profiles', 'observe-ms']);
  if (options.help) { console.log(HELP); return; }
  if (!process.argv.includes('--runs')) options.runs = 1;
  options.profiles = (options.profiles ?? 'mobile').split(',');
  if (options.profiles.some((profile) => !['desktop', 'mobile', 'mobile-4mbps'].includes(profile))) throw new Error('--profiles supports desktop,mobile,mobile-4mbps.');
  options.observeMs = integer(options['observe-ms'] ?? '15000', '--observe-ms', 1000, 60000);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const report = {
    schemaVersion: 1, startedAt: new Date().toISOString(), mode: 'anonymous-fresh-context-browser', options,
    notes: ['Paint opportunity is not an exact compositor paint timestamp.', 'No scrolling; all final page videos are observed.', 'CDP encoded byte totals include partial Range requests; they are not R2 billable bytes.', 'No server cache reset; each browser context is fresh.', 'No screenshots, HTML, full URLs, credentials or authenticated sessions saved.'], results: [],
  };
  try {
    for (const profile of options.profiles) for (const route of options.routes) for (const language of options.languages) for (let run = 1; run <= options.runs; run++) {
      const result = await measure(browser, options, profile, route, language, run);
      report.results.push(result);
      report.updatedAt = new Date().toISOString();
      await saveReport(`${options.label}-browser.json`, report);
      console.log(JSON.stringify({ profile, path: route, language, run, status: result.status, firstCardPaintOpportunityMs: result.metrics?.firstCardPaintOpportunityMs, firstVideoPlayingMs: result.metrics?.firstVideoPlayingMs, allVideosStartedMs: result.metrics?.allVideosStartedMs, playing: result.metrics?.playingVideosAtCapture, total: result.metrics?.totalVideos, cls: result.metrics?.cls, errors: result.errors }));
      await pause(options.delayMs);
    }
  } finally { await browser.close(); }
  if (report.results.some((result) => result.status !== 200 || !result.metrics || result.errors.length)) process.exitCode = 1;
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
