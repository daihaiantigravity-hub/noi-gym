import { hash, parseArguments, saveReport } from './common.mjs';
import { createPreviewAccess } from './preview-access.mjs';

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log('Anonymous Chromium navigation smoke test. Usage: node scripts/performance/check-navigation.mjs --origin http://localhost:3010 --label optimized-navigation. Tests chest page 1 to 2, keyboard-focus prefetch, pending feedback, language switch without reloading existing videos. Stores hashes only.');
    return;
  }
  const access = createPreviewAccess(options.origin);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const result = { capturedAt: new Date().toISOString(), origin: options.origin, mode: 'anonymous-mobile-navigation', deploymentAccess: access.enabled ? 'scoped-project-oidc' : 'public', errors: [] };
  let detachPreviewAccess = async () => {};
  try {
    await context.addCookies([{ name: 'noi-gym-language', value: 'en', url: options.origin }]);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    detachPreviewAccess = await access.attachToCdp(cdp, (error) => result.errors.push({ name: error.name, messageHash: hash(error.message) }));
    const requests = [];
    let phase = 'initial';
    page.on('request', (request) => {
      const headers = request.headers();
      requests.push({ phase, type: request.resourceType(), urlHash: hash(request.url()), prefetch: headers['next-router-prefetch'] === '1', isMp4: new URL(request.url()).pathname.endsWith('.mp4') });
    });
    page.on('pageerror', (error) => result.errors.push({ name: error.name, messageHash: hash(error.message) }));
    await page.goto(`${options.origin}/exercises/chest`, { waitUntil: 'domcontentloaded', timeout: options.timeoutMs });
    await page.waitForFunction(() => {
      const videos = [...document.querySelectorAll('article.exercise-library-exercise-card video')];
      return videos.length === 10 && videos.every((video) => !video.paused && video.currentTime > 0 && video.readyState >= 2 && !video.error);
    }, null, { timeout: options.timeoutMs });
    const currentMedia = await page.locator('article.exercise-library-exercise-card video').evaluateAll((videos) => videos.map((video) => video.currentSrc));
    const currentHashes = new Set(currentMedia.map(hash));
    phase = 'focus-prefetch';
    await page.locator('.exercise-library-pagination a[rel="next"]').focus();
    await page.waitForTimeout(1400);
    const focusRequests = requests.filter((request) => request.phase === phase);
    result.prefetch = {
      routeRequests: focusRequests.filter((request) => request.prefetch).length,
      offPageMp4Requests: focusRequests.filter((request) => request.isMp4 && !currentHashes.has(request.urlHash)).length,
      mediaRequests: focusRequests.filter((request) => request.isMp4).length,
    };
    await page.evaluate(() => {
      const firstHref = document.querySelector('article.exercise-library-exercise-card a.exercise-library-exercise-card__detail')?.getAttribute('href');
      const state = window.__navigationSmoke = { startMs: null, pendingMs: null, newCardMs: null };
      const observer = new MutationObserver(() => {
        if (state.startMs === null) return;
        if (document.querySelector('.exercise-library-pagination__content[aria-busy="true"]')) state.pendingMs ??= performance.now() - state.startMs;
        const href = document.querySelector('article.exercise-library-exercise-card a.exercise-library-exercise-card__detail')?.getAttribute('href');
        if (href && href !== firstHref) state.newCardMs ??= performance.now() - state.startMs;
      });
      observer.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-busy'] });
      document.querySelector('.exercise-library-pagination a[rel="next"]').addEventListener('click', () => { state.startMs = performance.now(); }, { once: true });
      window.__stopNavigationSmoke = () => observer.disconnect();
    });
    phase = 'navigate';
    await page.locator('.exercise-library-pagination a[rel="next"]').click();
    await page.waitForURL('**/exercises/chest?page=2', { timeout: options.timeoutMs });
    await page.waitForFunction(() => window.__navigationSmoke?.newCardMs != null, null, { timeout: options.timeoutMs });
    result.navigation = await page.evaluate(() => { window.__stopNavigationSmoke(); return { ...window.__navigationSmoke, cards: document.querySelectorAll('article.exercise-library-exercise-card').length, activePage: document.querySelector('.exercise-library-pagination__page--active')?.textContent }; });
    await page.waitForFunction(() => {
      const videos = [...document.querySelectorAll('article.exercise-library-exercise-card video')];
      return videos.length > 0 && videos.every((video) => !video.paused && video.currentTime > 0 && video.readyState >= 2 && !video.error);
    }, null, { timeout: options.timeoutMs });
    await page.evaluate(() => {
      window.__languageSmoke = {
        videos: [...document.querySelectorAll('article.exercise-library-exercise-card video')],
        sources: [...document.querySelectorAll('article.exercise-library-exercise-card video')].map((video) => video.currentSrc),
        title: document.querySelector('article.exercise-library-exercise-card h2')?.textContent,
        loadStarts: 0,
      };
      document.addEventListener('loadstart', (event) => { if (event.target instanceof HTMLVideoElement) window.__languageSmoke.loadStarts++; }, true);
    });
    phase = 'switch-language';
    await page.locator('.health-language-toggle').click();
    await page.waitForFunction(() => document.querySelector('.health-language-toggle')?.getAttribute('data-language') === 'vi' && document.querySelector('article.exercise-library-exercise-card h2')?.textContent !== window.__languageSmoke.title, null, { timeout: options.timeoutMs });
    await page.waitForTimeout(1000);
    result.languageSwitch = await page.evaluate(() => {
      const videos = [...document.querySelectorAll('article.exercise-library-exercise-card video')];
      const before = window.__languageSmoke;
      return {
        language: document.querySelector('.health-language-toggle')?.getAttribute('data-language'),
        titleChanged: document.querySelector('article.exercise-library-exercise-card h2')?.textContent !== before.title,
        count: videos.length, reusedVideoNodes: videos.filter((video, index) => video === before.videos[index]).length,
        unchangedMedia: videos.length === before.sources.length && videos.every((video, index) => video.currentSrc === before.sources[index]),
        videoLoadStarts: before.loadStarts, playing: videos.filter((video) => !video.paused && video.currentTime > 0 && video.readyState >= 2 && !video.error).length,
        activePage: document.querySelector('.exercise-library-pagination__page--active')?.textContent,
      };
    });
    result.requests = requests;
    result.passed = result.prefetch.routeRequests > 0 && result.prefetch.offPageMp4Requests === 0
      && result.navigation.pendingMs != null && result.navigation.pendingMs <= 150 && result.navigation.activePage === '2'
      && result.languageSwitch.titleChanged && result.languageSwitch.unchangedMedia
      && result.languageSwitch.videoLoadStarts === 0 && result.languageSwitch.reusedVideoNodes === result.languageSwitch.count
      && result.languageSwitch.playing === result.languageSwitch.count && result.errors.length === 0;
  } catch (error) {
    result.errors.push({ name: error.name, messageHash: hash(error.message) });
    result.passed = false;
  } finally { await detachPreviewAccess(); await context.close(); await browser.close(); }
  await saveReport(`${options.label}-navigation.json`, result);
  console.log(JSON.stringify({ ...result, requests: undefined }, null, 2));
  if (!result.passed) process.exitCode = 1;
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
