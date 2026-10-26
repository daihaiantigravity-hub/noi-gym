import { pathToFileURL } from 'node:url';
import { CARD_SELECTOR, distribution, hash, integer, parseArguments, round, saveReport } from './common.mjs';
import { createPreviewAccess } from './preview-access.mjs';

export function maximumClsWindow(entries) {
  let maximum = 0, value = 0, start = 0, last = 0;
  for (const entry of entries.filter((entry) => !entry.recentInput)) {
    if (entry.startMs - last > 1000 || entry.startMs - start > 5000) { start = entry.startMs; value = 0; }
    value += entry.value;
    last = entry.startMs;
    maximum = Math.max(maximum, value);
  }
  return maximum;
}

export function assessSnapshot(snapshot, expectedLanguage) {
  const failures = [];
  if (!snapshot.cards.length) failures.push('missing-cards');
  if (snapshot.cards.some((card) => !card.hasTitle)) failures.push('missing-card-titles');
  if (snapshot.language !== expectedLanguage) failures.push('wrong-language');
  if (snapshot.horizontalOverflowPx > 1) failures.push('horizontal-overflow');
  if (snapshot.cls > 0.1) failures.push('layout-shift');
  if (!snapshot.videos.length) failures.push('missing-videos');
  if (snapshot.videos.some((video) => video.errorCode != null)) failures.push('media-error');
  if (snapshot.videos.some((video) => video.paused || video.ended || video.readyState < 2 || video.currentTime <= 0)) failures.push('incomplete-autoplay');
  return failures;
}

function installInstrumentation() {
  const state = window.__mobileAcceptance = { longTasks: [], layoutShifts: [] };
  for (const [type, property, transform] of [
    ['longtask', 'longTasks', (entry) => ({ startMs: entry.startTime, durationMs: entry.duration })],
    ['layout-shift', 'layoutShifts', (entry) => ({ startMs: entry.startTime, value: entry.value, recentInput: entry.hadRecentInput })],
  ]) {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
    const observer = new PerformanceObserver((list) => state[property].push(...list.getEntries().map(transform)));
    observer.observe({ type, buffered: true });
  }
}

async function snapshot(page) {
  const value = await page.evaluate(() => ({
    path: `${location.pathname}${location.search}`,
    language: document.querySelector('.health-language-toggle')?.getAttribute('data-language'),
    horizontalOverflowPx: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth,
    scrollY, pageHeight: document.documentElement.scrollHeight, viewportHeight: innerHeight,
    activePage: document.querySelector('.exercise-library-pagination__page--active')?.textContent?.trim() ?? null,
    cards: [...document.querySelectorAll('article.exercise-library-exercise-card:not(.exercise-library-loading__card)')].map((card) => ({
      href: card.querySelector('a.exercise-library-exercise-card__detail')?.getAttribute('href') ?? null,
      title: card.querySelector('h2')?.textContent?.trim() ?? '',
    })),
    videos: [...document.querySelectorAll('article.exercise-library-exercise-card video')].map((video) => ({
      src: video.currentSrc || video.src, readyState: video.readyState, paused: video.paused,
      currentTime: video.currentTime, ended: video.ended, loop: video.loop, errorCode: video.error?.code ?? null,
    })),
    ...window.__mobileAcceptance,
  }));
  value.cards = value.cards.map((card) => ({ idHash: hash(card.href), titleHash: hash(card.title), hasTitle: Boolean(card.title) }));
  value.videos = value.videos.map(({ src, ...video }) => ({ ...video, urlHash: hash(src) }));
  value.orderHash = hash(value.cards.map((card) => card.idHash));
  value.cls = maximumClsWindow(value.layoutShifts);
  return value;
}

async function waitForVideos(page, timeoutMs) {
  try {
    await page.waitForFunction(() => {
      const videos = [...document.querySelectorAll('article.exercise-library-exercise-card video')];
      return videos.length > 0 && videos.every((video) => !video.paused && !video.ended && video.currentTime > 0 && video.readyState >= 2 && !video.error);
    }, null, { timeout: timeoutMs });
    return true;
  } catch (error) { if (error.name === 'TimeoutError') return false; throw error; }
}

async function scrollPage(page, scrollMs) {
  const value = await page.evaluate(async (duration) => {
    scrollTo(0, 0);
    const maxY = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const gaps = [];
    const begin = performance.now();
    let previous = null, maxOverflow = 0;
    await new Promise((resolve) => {
      const frame = (now) => {
        if (previous != null) gaps.push(now - previous);
        previous = now;
        const progress = Math.min(1, (now - begin) / duration);
        scrollTo(0, Math.round(maxY * (progress <= 0.5 ? progress * 2 : (1 - progress) * 2)));
        maxOverflow = Math.max(maxOverflow, document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (progress < 1) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
    const end = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 120));
    return {
      durationMs: end - begin, traversedHeightPx: maxY, maxHorizontalOverflowPx: maxOverflow,
      gaps, longTasks: window.__mobileAcceptance.longTasks.filter((entry) => entry.startMs < end && entry.startMs + entry.durationMs > begin),
    };
  }, scrollMs);
  const { gaps, ...metrics } = value;
  return { ...metrics, rafGapMs: distribution(gaps.map(round)), rafGapsOver50Ms: gaps.filter((gap) => gap > 50).length };
}

async function navigation(page, options, language) {
  const result = { failures: [] };
  await page.locator('.exercise-library-pagination a[rel="next"]').scrollIntoViewIfNeeded();
  result.before = await snapshot(page);
  const firstHref = await page.locator(`${CARD_SELECTOR} a.exercise-library-exercise-card__detail`).first().getAttribute('href');
  const target = new URL(await page.locator('.exercise-library-pagination a[rel="next"]').getAttribute('href'), options.origin);
  await page.locator('.exercise-library-pagination a[rel="next"]').click();
  await page.waitForURL((url) => url.pathname === target.pathname && url.search === target.search, { timeout: options.timeoutMs });
  await page.waitForFunction((previousHref) => {
    const href = document.querySelector('article.exercise-library-exercise-card a.exercise-library-exercise-card__detail')?.getAttribute('href');
    return href && href !== previousHref;
  }, firstHref, { timeout: options.timeoutMs });
  await page.locator(CARD_SELECTOR).first().waitFor({ state: 'visible', timeout: options.timeoutMs });
  result.page2AutoplayCompleted = await waitForVideos(page, options.observeMs);
  result.page2 = await snapshot(page);
  result.failures.push(...assessSnapshot(result.page2, language).map((failure) => `page2:${failure}`));
  if (result.page2.activePage !== '2' || result.page2.orderHash === result.before.orderHash) result.failures.push('page2:wrong-content');
  await page.goBack({ waitUntil: 'domcontentloaded', timeout: options.timeoutMs });
  await page.waitForURL((url) => `${url.pathname}${url.search}` === result.before.path, { timeout: options.timeoutMs });
  await page.waitForFunction((expectedHref) => document.querySelector('article.exercise-library-exercise-card a.exercise-library-exercise-card__detail')?.getAttribute('href') === expectedHref,
    firstHref, { timeout: options.timeoutMs });
  result.backAutoplayCompleted = await waitForVideos(page, options.observeMs);
  result.back = await snapshot(page);
  result.failures.push(...assessSnapshot(result.back, language).map((failure) => `back:${failure}`));
  if (result.back.orderHash !== result.before.orderHash || result.back.activePage !== result.before.activePage) result.failures.push('back:wrong-content');
  result.scrollRestoreDeltaPx = Math.abs(result.back.scrollY - result.before.scrollY);
  return result;
}

async function main() {
  const options = parseArguments(process.argv.slice(2), ['viewports', 'observe-ms', 'scroll-ms']);
  if (options.help) {
    console.log('Read-only Chromium mobile acceptance. --origin --label --routes --languages --viewports 390x844,360x800 --observe-ms 20000 --scroll-ms 4000. Default routes: chest male, chest female, rear shoulders/barbell. One sample per viewport/route/language; chest EN includes page 2 and browser Back. Context reused within each viewport to reduce repeat media downloads. Programmatic scroll and host requestAnimationFrame/long-task metrics are diagnostics, not physical phone or touch-scroll measurements. No app writes, saved sessions or cache reset.');
    return;
  }
  if (process.argv.includes('--runs') && options.runs !== 1) throw new Error('Mobile acceptance supports exactly one sample per case; use --runs 1.');
  options.runs = 1;
  if (!process.argv.includes('--routes')) options.routes = ['/exercises/chest', '/exercises/chest?gender=female', '/exercises/rear-shoulders/barbell'];
  options.viewports = (options.viewports ?? '390x844,360x800').split(',').map((value) => {
    if (!/^\d+x\d+$/.test(value)) throw new Error('--viewports requires WIDTHxHEIGHT.');
    const [width, height] = value.split('x');
    return { width: integer(width, 'viewport width', 320, 800), height: integer(height, 'viewport height', 400, 1400) };
  });
  options.observeMs = integer(options['observe-ms'] ?? '20000', '--observe-ms', 1000, 60000);
  options.scrollMs = integer(options['scroll-ms'] ?? '4000', '--scroll-ms', 1000, 10000);
  const access = createPreviewAccess(options.origin);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const report = {
    schemaVersion: 1, startedAt: new Date().toISOString(), origin: options.origin,
    mode: 'anonymous-chromium-mobile-programmatic-scroll', options, results: [],
    notes: ['Not a physical phone, Safari or touch-gesture measurement.', 'No network or CPU throttle. Host scheduling and video decode affect frame gaps.', 'One sample per case; no percentile population or field-performance claim.', 'Context cache retained within each viewport; no server-cache reset.', 'All rendered videos must play before and after scroll; no artificial video count assumed for narrower categories.', 'Scroll restoration delta is reported, not used alone as a failure. No login or data writes.'],
  };
  try {
    for (const viewport of options.viewports) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      await context.addInitScript(installInstrumentation);
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      let current = null;
      const detach = await access.attachToCdp(cdp, (error) => current?.errors.push({ name: error.name, messageHash: hash(error.message) }));
      page.on('pageerror', (error) => current?.errors.push({ name: error.name, messageHash: hash(error.message) }));
      try {
        for (const route of options.routes) for (const language of options.languages) {
          current = { viewport, route, language, status: null, failures: [], errors: [] };
          try {
            await context.addCookies([{ name: 'noi-gym-language', value: language, url: options.origin }]);
            const response = await page.goto(`${options.origin}${route}`, { waitUntil: 'domcontentloaded', timeout: options.timeoutMs });
            current.status = response?.status() ?? null;
            await page.locator(CARD_SELECTOR).first().waitFor({ state: 'visible', timeout: options.timeoutMs });
            current.autoplayCompleted = await waitForVideos(page, options.observeMs);
            current.beforeScroll = await snapshot(page);
            current.failures.push(...assessSnapshot(current.beforeScroll, language).map((failure) => `before:${failure}`));
            current.scroll = await scrollPage(page, options.scrollMs);
            current.afterScroll = await snapshot(page);
            current.failures.push(...assessSnapshot(current.afterScroll, language).map((failure) => `after:${failure}`));
            if (current.scroll.maxHorizontalOverflowPx > 1) current.failures.push('scroll:horizontal-overflow');
            if (route === '/exercises/chest' && language === 'en') {
              current.navigation = await navigation(page, options, language);
              current.failures.push(...current.navigation.failures);
            }
          } catch (error) { current.errors.push({ name: error.name, messageHash: hash(error.message) }); }
          if (current.status !== 200) current.failures.push('http-error');
          if (current.errors.length) current.failures.push('page-error');
          current.passed = current.failures.length === 0;
          report.results.push(current);
          report.updatedAt = new Date().toISOString();
          await saveReport(`${options.label}-mobile-navigation.json`, report);
          console.log(JSON.stringify({ viewport, route, language, passed: current.passed, failures: current.failures, videos: current.afterScroll?.videos.length, cls: current.afterScroll?.cls, overflow: current.afterScroll?.horizontalOverflowPx, scrollLongTasks: current.scroll?.longTasks.length, scrollRafGapMs: current.scroll?.rafGapMs, backScrollDelta: current.navigation?.scrollRestoreDeltaPx }));
        }
      } finally { await detach(); await context.close(); }
    }
  } finally { await browser.close(); }
  if (!report.results.length || report.results.some((result) => !result.passed)) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(JSON.stringify({ name: error.name, messageHash: hash(error.message) })); process.exitCode = 1; });
}
