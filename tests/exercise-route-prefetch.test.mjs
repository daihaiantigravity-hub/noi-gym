import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../components/use-exercise-route-prefetch.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});

function harness() {
  const refs = [];
  const timers = new Map();
  const calls = [];
  let now = 0;
  let refIndex = 0;
  let nextTimer = 0;
  let cleanup;
  let language = "en";
  const exports = {};
  const router = { prefetch(href, options) { calls.push({ href, ...options }); } };
  const imports = {
    react: {
      useRef(initial) { return refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }); },
      useCallback(callback) { return callback; },
      useEffect(callback) { cleanup = callback(); },
    },
    "next/navigation": { useRouter: () => router },
    "next/dist/client/components/router-reducer/router-reducer-types": { PrefetchKind: { AUTO: "auto" } },
    "./LanguageProvider": { useAppLanguage: () => ({ language }) },
  };
  vm.runInNewContext(outputText, {
    exports, Date: { now: () => now },
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    require(name) { assert.ok(Object.hasOwn(imports, name)); return imports[name]; },
  });
  function render() { refIndex = 0; return exports.useExerciseRoutePrefetch(); }
  return {
    calls,
    actions: render(),
    advance(ms) {
      now += ms;
      for (const [id, timer] of timers) {
        if (timer.at <= now) { timers.delete(id); timer.callback(); }
      }
    },
    setLanguage(next) { cleanup?.(); language = next; return render(); },
    unmount() { cleanup?.(); },
  };
}

test("only sustained intent prefetches; crossing muscles coalesces into one route", () => {
  const view = harness();
  assert.equal(view.calls.length, 0);
  view.actions.prefetchRoute("/exercises/chest");
  view.advance(100);
  view.actions.prefetchRoute("/exercises/biceps");
  view.advance(100);
  assert.equal(view.calls.length, 0);
  view.advance(60);
  assert.deepEqual(view.calls.map(({ href }) => href), ["/exercises/biceps"]);
});

test("touch intent starts immediately and leaving or unmounting cancels pending requests", () => {
  const view = harness();
  view.actions.prefetchRoute("/exercises/chest");
  view.actions.prefetchRoute("/exercises/chest?gender=female&page=2", true);
  assert.deepEqual(view.calls.map(({ href }) => href), ["/exercises/chest?gender=female&page=2"]);
  view.actions.prefetchRoute("/exercises/biceps");
  view.actions.cancelPrefetch();
  view.advance(1000);
  view.actions.prefetchRoute("/exercises/quads");
  view.unmount();
  view.advance(1000);
  assert.equal(view.calls.length, 1);
});

test("stale routes can be prefetched again without a permanent visited Set", () => {
  const view = harness();
  view.actions.prefetchRoute("/exercises/chest", true);
  view.actions.prefetchRoute("/exercises/chest", true);
  assert.equal(view.calls.length, 1);
  view.calls[0].onInvalidate();
  view.actions.prefetchRoute("/exercises/chest", true);
  assert.equal(view.calls.length, 2);
  view.advance(30_000);
  view.actions.prefetchRoute("/exercises/chest", true);
  assert.equal(view.calls.length, 3);
});

test("rapid navigation intent cannot start more than three requests per ten seconds", () => {
  const view = harness();
  for (let page = 1; page <= 8; page++) view.actions.prefetchRoute(`/exercises/chest?page=${page}`, true);
  assert.equal(view.calls.length, 3);
  view.advance(10_000);
  view.actions.prefetchRoute("/exercises/chest?page=8", true);
  assert.equal(view.calls.length, 4);
});

test("switching language cancels pending old-language intent and permits fresh data for the same URL", () => {
  const view = harness();
  view.actions.prefetchRoute("/exercises/chest", true);
  view.actions.prefetchRoute("/exercises/biceps");
  const vietnamese = view.setLanguage("vi");
  vietnamese.prefetchRoute("/exercises/chest", true);
  view.advance(1000);
  assert.deepEqual(view.calls.map(({ href }) => href), ["/exercises/chest", "/exercises/chest"]);
});
