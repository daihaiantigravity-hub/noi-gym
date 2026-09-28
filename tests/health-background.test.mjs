import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Use the existing TypeScript dependency; no extra test runner or DOM package needed.
const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const compiled = new Map();
function loadModule(path, globals = {}, imports = {}) {
  if (!compiled.has(path)) {
    compiled.set(path, ts.transpileModule(source(path), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText);
  }
  const exports = {};
  vm.runInNewContext(compiled.get(path), {
    exports, URLSearchParams, ...globals,
    require: (name) => {
      assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`);
      return imports[name];
    },
  }, { filename: path });
  return exports;
}
const config = loadModule("lib/health-mood.ts");
const at = (hour, minute = 0, second = 0, ms = 0) => new Date(2026, 8, 28, hour, minute, second, ms);

function eventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name) => listeners.delete(name),
    fire: (name) => listeners.get(name)?.(),
  };
}

function environment({ hour = 7, search = "", stored = null, reduced = false, production = false, blockedStorage = false } = {}) {
  let now = at(hour);
  let timerId = 0;
  const timers = new Map();
  const animations = [];
  const properties = new Map();
  const storage = new Map(stored ? [[config.HEALTH_PREVIEW_STORAGE_KEY, stored]] : []);
  const root = { dataset: {}, style: { setProperty: (key, value) => properties.set(key, value) } };
  const document = { ...eventTarget(), documentElement: root, visibilityState: "visible" };
  const media = { ...eventTarget(), matches: reduced };
  const sessionStorage = {
    getItem: (key) => { if (blockedStorage) throw Error("Disabled"); return storage.get(key) ?? null; },
    setItem: (key, value) => { if (blockedStorage) throw Error("Disabled"); storage.set(key, value); },
    removeItem: (key) => { if (blockedStorage) throw Error("Disabled"); storage.delete(key); },
  };
  const window = {
    ...eventTarget(), location: { search }, sessionStorage,
    matchMedia: (query) => { assert.equal(query, "(prefers-reduced-motion: reduce)"); return media; },
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout: (id) => timers.delete(id),
  };
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
  }
  const layers = [0, 1].map(() => ({
    style: {},
    animate(keyframes, options) {
      const animation = {
        keyframes, options, cancelled: false,
        cancel() { this.cancelled = true; },
        finish() { if (!this.cancelled) this.onfinish?.(); },
      };
      animations.push(animation);
      return animation;
    },
  }));
  const globals = { document, window, Date: ClockDate, process: { env: { NODE_ENV: production ? "production" : "development" } } };
  return {
    layers, animations, timers, root, properties, storage, document, window, media,
    setTime: (time) => { now = time; },
    start: () => loadModule("lib/health-background.ts", globals, { "./health-mood": config }).startHealthBackground(layers),
    bootstrap: () => vm.runInNewContext(config.getHealthBackgroundBootstrapScript(!production), {
      ...globals, URLSearchParams, location: window.location, sessionStorage,
    }),
  };
}

test("exactly five palettes, glow positions/radii, opaque target center and one base gradient", () => {
  const expected = [
    ["morning", 5, "#0F3A5A", "#182430", "#705720", 0, 55, 85, 55],
    ["midday", 10, "#14221D", "#14221D", "#846315", 50, 0, 90, 45],
    ["afternoon", 14, "#13221D", "#13221D", "#4E472A", 50, 0, 90, 40],
    ["evening", 17, "#0D264B", "#2B1D0D", "#633D13", 55, 68, 85, 50],
    ["night", 20, "#0B1826", "#101B20", "#17314A", 50, 0, 90, 40],
  ];
  assert.equal(config.HEALTH_MOODS.length, 5);
  for (const [mood, start, top, bottom, color, x, y, radiusX, radiusY] of expected) {
    const theme = config.HEALTH_THEMES[mood];
    assert.equal(JSON.stringify([theme.startHour, theme.top, theme.bottom, ...Object.values(theme.glow)]),
      JSON.stringify([start, top, bottom, color, x, y, radiusX, radiusY]));
    const gradient = config.getHealthBackground(mood);
    assert.ok(gradient.startsWith(`radial-gradient(ellipse ${radiusX}% ${radiusY}% at ${x}% ${y}%, ${color} 0%,`));
    assert.equal(gradient.match(/radial-gradient/g).length, 1);
    assert.equal(gradient.match(/linear-gradient/g).length, 1);
    assert.ok(gradient.endsWith(`${bottom} 100%)`));
  }
  assert.match(config.getHealthBackground("evening"), /#15243A 35%/);
});

test("local time: inclusive starts, exclusive ends, midnight and millisecond boundaries", () => {
  let previous = "night";
  for (const mood of config.HEALTH_MOODS) {
    const boundary = at(config.HEALTH_THEMES[mood].startHour);
    assert.equal(config.getHealthMood(new Date(+boundary - 1)), previous);
    assert.equal(config.getHealthMood(boundary), mood);
    assert.equal(config.getHealthMood(new Date(+boundary + 1)), mood);
    assert.equal(config.getMillisecondsUntilNextHealthMood(new Date(+boundary - 1)), 1);
    previous = mood;
  }
  assert.equal(config.getHealthMood(at(0)), "night");
  assert.equal(config.getHealthMood(at(23, 59, 59, 999)), "night");
  assert.equal(config.getMillisecondsUntilNextHealthMood(at(0)), 5 * 3_600_000);
  assert.equal(config.getMillisecondsUntilNextHealthMood(at(20)), 9 * 3_600_000);
  assert.equal(config.getMillisecondsUntilNextHealthMood(at(23, 59, 59, 999)), 5 * 3_600_000 + 1);
});

test("pre-paint bootstrap and hydrated controller select the same theme at every local hour", () => {
  for (let hour = 0; hour < 24; hour++) {
    const env = environment({ hour });
    env.bootstrap();
    const expected = config.getHealthMood(at(hour));
    assert.equal(env.root.dataset.healthMood, expected);
    assert.equal(env.properties.get("--health-initial-background"), config.getHealthBackground(expected));
    const stop = env.start();
    assert.equal(env.root.dataset.healthMood, expected);
    assert.equal(env.layers[0].style.backgroundImage, env.properties.get("--health-initial-background"));
    assert.equal(env.animations.length, 0, "No initial flash or entrance animation");
    assert.equal([...env.timers.values()][0].delay, config.getMillisecondsUntilNextHealthMood(at(hour)));
    stop();
  }
});

test("development preview supports all themes, persists across routes and can reset to auto", () => {
  for (const mood of config.HEALTH_MOODS) {
    const env = environment({ search: `?healthTheme=${mood}` });
    env.bootstrap();
    assert.equal(env.root.dataset.healthMood, mood);
    const stop = env.start();
    assert.equal(env.root.dataset.healthMood, mood);
    assert.equal(env.timers.size, 0);
    assert.equal(env.storage.get(config.HEALTH_PREVIEW_STORAGE_KEY), mood);
    stop();
    const nextRoute = environment({ stored: mood });
    nextRoute.bootstrap();
    assert.equal(nextRoute.root.dataset.healthMood, mood);
  }
  for (const search of ["?healthTheme=auto", "?healthTheme=invalid", "?healthTheme=__proto__"]) {
    const env = environment({ search, stored: "evening" });
    env.bootstrap();
    const stop = env.start();
    assert.equal(env.root.dataset.healthMood, "morning");
    assert.equal(env.storage.size, 0);
    assert.equal(env.timers.size, 1);
    stop();
  }
});

test("production ignores preview; blocked session storage cannot break initial rendering", () => {
  for (const production of [true, false]) {
    const env = environment({ hour: 12, search: "?healthTheme=night", stored: "evening", production, blockedStorage: true });
    env.bootstrap();
    assert.equal(env.root.dataset.healthMood, production ? "midday" : "night");
    const stop = env.start();
    assert.equal(env.root.dataset.healthMood, production ? "midday" : "night");
    stop();
  }
});

test("boundary crossfade lasts 1s, keeps outgoing layer opaque and does not continuously animate", () => {
  const env = environment({ hour: 9 });
  const stop = env.start();
  env.setTime(at(10));
  [...env.timers.values()][0].callback();
  assert.equal(env.animations.length, 1);
  const fade = env.animations[0];
  assert.equal(fade.options.duration, 1000);
  assert.equal(JSON.stringify(fade.keyframes), '[{"opacity":0},{"opacity":1}]');
  assert.equal(env.layers[0].style.opacity, "1");
  assert.equal(env.layers[1].style.backgroundImage, config.getHealthBackground("midday"));
  fade.finish();
  assert.equal(env.layers[1].style.opacity, "1");
  assert.equal(env.layers[0].style.opacity, "0");
  assert.equal(env.root.dataset.healthMood, "midday");
  env.window.fire("focus");
  assert.equal(env.animations.length, 1);
  stop();
  assert.equal(env.timers.size, 0);
  for (const target of [env.window, env.document, env.media]) assert.equal(target.listeners.size, 0);
});

test("foreground, focus and BFCache resume recalculate local time; rapid updates use the latest theme", () => {
  const env = environment();
  const stop = env.start();
  env.document.visibilityState = "hidden";
  env.document.fire("visibilitychange");
  assert.equal(env.timers.size, 0);
  env.setTime(at(18));
  env.document.visibilityState = "visible";
  env.document.fire("visibilitychange");
  env.setTime(at(21));
  env.window.fire("pageshow");
  env.animations[0].finish();
  env.animations[1].finish();
  assert.equal(env.root.dataset.healthMood, "night");
  env.setTime(at(6));
  env.window.fire("focus");
  env.animations[2].finish();
  assert.equal(env.root.dataset.healthMood, "morning");
  stop();
});

test("reduced motion skips crossfade and can cancel a running fade; old browsers get instant changes", () => {
  for (const mode of ["reduced", "no-animation-api", "change-during-fade"]) {
    const env = environment({ reduced: mode === "reduced" });
    if (mode === "no-animation-api") env.layers.forEach((layer) => { delete layer.animate; });
    const stop = env.start();
    env.setTime(at(18));
    env.window.fire("focus");
    if (mode === "change-during-fade") {
      env.media.matches = true;
      env.media.fire("change");
      assert.equal(env.animations[0].cancelled, true);
    } else assert.equal(env.animations.length, 0);
    assert.equal(env.root.dataset.healthMood, "evening");
    assert.equal(env.layers[0].style.opacity, "1");
    assert.equal(env.layers[1].style.opacity, "0");
    stop();
  }
});

test("viewport background is noninteractive, independent of section height and scroll events", () => {
  const css = source("app/globals.css");
  const shell = css.match(/\.health-background\s*\{([^}]+)\}/)[1];
  for (const declaration of ["position: fixed", "inset: 0", "z-index: -1", "pointer-events: none"]) {
    assert.ok(shell.includes(declaration));
  }
  assert.doesNotMatch(shell, /(?:height|width|transform|animation)\s*:/);
  assert.doesNotMatch(css, /\.health-mood-surface::before|\.exercise-detail-page::before/);
  assert.doesNotMatch(source("lib/health-background.ts"), /addEventListener\(["']scroll|setInterval/);
  assert.match(source("app/layout.tsx"), /viewportFit: "cover"/);
  assert.equal(source("components/HealthBackground.tsx").match(/ref=\{/g).length, 2);
});
