import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const pendingKey = "noi-gym:pending-favorite:v1";
const compiled = ts.transpileModule(readFileSync(new URL("../lib/exercises/use-saved-exercise.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const settle = () => new Promise((resolve) => setImmediate(resolve));

function harness({ storageDisabled = false } = {}) {
  const exports = {};
  const requests = [];
  const timers = new Map();
  const storage = new Map();
  let current;
  let readSnapshot;
  let timerId = 0;
  const window = {
    location: { pathname: "/exercises/chest", search: "?gender=male", hash: "", href: "" },
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    sessionStorage: {
      getItem(key) { if (storageDisabled) throw new Error("Storage disabled"); return storage.get(key) ?? null; },
      setItem(key, value) { if (storageDisabled) throw new Error("Storage disabled"); storage.set(key, value); },
      removeItem(key) { if (storageDisabled) throw new Error("Storage disabled"); storage.delete(key); },
    },
  };
  const react = {
    useCallback: (callback) => callback,
    useEffect(callback) { if (!current.mounted) current.effects.push(callback); },
    useState(initial) {
      const owner = current;
      const index = owner.cursor++;
      if (!(index in owner.state)) owner.state[index] = initial;
      return [owner.state[index], (value) => { owner.state[index] = value; }];
    },
    useSyncExternalStore(_subscribe, getSnapshot) { readSnapshot = getSnapshot; return getSnapshot(); },
  };
  vm.runInNewContext(compiled, {
    exports, window, Date, Error, Set, Map,
    require(name) { assert.equal(name, "react"); return react; },
    fetch(url, options = {}) {
      return new Promise((resolve, reject) => requests.push({ url, method: options.method ?? "GET", options, resolve, reject, replied: false }));
    },
  });
  return {
    storage, requests, window,
    reset: exports.resetSavedExercises,
    mount(exerciseId = "exercise") {
      const instance = { state: [], effects: [], cursor: 0, mounted: false };
      const render = () => {
        current = instance;
        instance.cursor = 0;
        return exports.useSavedExercise(exerciseId);
      };
      render();
      instance.mounted = true;
      instance.effects.forEach((effect) => effect());
      return { render, toggle: () => render().toggleSaved() };
    },
    runTimers() {
      const queued = [...timers.values()];
      timers.clear();
      queued.forEach((callback) => callback());
    },
    next(method = "GET") {
      const request = requests.find((item) => !item.replied && item.method === method);
      assert.ok(request, `Expected pending ${method}`);
      return request;
    },
    reply(request, body, status = 200) {
      request.replied = true;
      request.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });
    },
    snapshot() {
      const value = readSnapshot();
      return { ...value, exerciseIds: [...value.exerciseIds] };
    },
    async load(userId, exerciseIds = []) {
      this.mount();
      this.runTimers();
      this.reply(requests.findLast((request) => request.method === "GET" && !request.replied), { authenticated: true, userId, exerciseIds });
      await settle();
    },
  };
}

test("cards deduplicate the favorite read within a session", async () => {
  const app = harness();
  const cards = Array.from({ length: 10 }, () => app.mount("saved"));
  app.runTimers();
  assert.equal(app.requests.length, 1);
  app.reply(app.next(), { authenticated: true, userId: "A", exerciseIds: ["saved"] });
  await settle();
  assert.ok(cards.every((card) => card.render().isSaved && card.render().isAuthenticated));
  assert.equal(app.requests[0].options.cache, "no-store");
});

test("different save clicks waiting for one initial read both execute", async () => {
  const app = harness();
  const first = app.mount("first").toggle();
  const second = app.mount("second").toggle();
  assert.equal(app.requests.length, 1);
  app.reply(app.next(), { authenticated: true, userId: "A", exerciseIds: [] });
  await settle();
  const writes = app.requests.filter((request) => request.method === "PUT");
  assert.equal(writes.length, 2);
  assert.deepEqual(app.snapshot().exerciseIds, ["first", "second"]);
  for (const write of writes) app.reply(write, { exerciseIds: [JSON.parse(write.options.body).exerciseId] });
  await Promise.all([first, second]);
  assert.deepEqual(app.snapshot().exerciseIds, ["first", "second"]);
});

for (const oldOutcome of ["success", "failure"]) {
  test(`a ${oldOutcome} response from the previous session cannot replace B's favorites`, async () => {
    const app = harness();
    app.mount(); app.runTimers();
    const old = app.next();
    app.reset();
    await app.load("B", ["B-only"]);
    app.reply(old, oldOutcome === "success"
      ? { authenticated: true, userId: "A", exerciseIds: ["A-only"] }
      : { error: "Previous request failed" }, oldOutcome === "success" ? 200 : 500);
    await settle();
    assert.equal(app.snapshot().userId, "B");
    assert.deepEqual(app.snapshot().exerciseIds, ["B-only"]);
    assert.equal(app.snapshot().error, null);
  });
}

test("old request cleanup cannot remove the new session's pending read", async () => {
  const app = harness();
  app.mount(); app.runTimers();
  const old = app.next();
  app.reset(); app.mount(); app.runTimers();
  const next = app.requests.at(-1);
  app.reply(old, { authenticated: true, userId: "A", exerciseIds: ["A-only"] });
  await settle();
  app.mount(); app.runTimers();
  assert.equal(app.requests.length, 2);
  app.reply(next, { authenticated: true, userId: "B", exerciseIds: ["B-only"] });
  await settle();
  assert.equal(app.snapshot().userId, "B");
});

test("a reset while response JSON is pending also discards the old body", async () => {
  const app = harness();
  app.mount(); app.runTimers();
  const old = app.next();
  old.replied = true;
  let finishBody;
  old.resolve({ ok: true, status: 200, json: () => new Promise((resolve) => { finishBody = resolve; }) });
  await settle();
  app.reset(); await app.load("B", ["B-only"]);
  finishBody({ authenticated: true, userId: "A", exerciseIds: ["A-only"] });
  await settle();
  assert.equal(app.snapshot().userId, "B");
  assert.deepEqual(app.snapshot().exerciseIds, ["B-only"]);
});

for (const method of ["PUT", "DELETE"]) {
  for (const status of [200, 500, 401]) {
    test(`late ${method} ${status} cannot modify or roll back another session`, async () => {
      const app = harness();
      await app.load("A", method === "DELETE" ? ["target"] : []);
      const card = app.mount("target");
      const mutation = card.toggle();
      const old = app.next(method);
      app.reset();
      await app.load("B", method === "PUT" ? ["B-only"] : ["B-only", "target"]);
      const expected = app.snapshot();
      app.reply(old, status === 200 ? { exerciseIds: ["target"] } : { error: "Old failure" }, status);
      await mutation;
      assert.deepEqual(app.snapshot(), expected);
      assert.equal(card.render().error, null);
    });
  }
}

test("duplicate clicks share one mutation and old cleanup cannot release B's mutation", async () => {
  const app = harness();
  await app.load("A");
  const first = app.mount("target").toggle();
  const old = app.next("PUT");
  await app.mount("target").toggle();
  assert.equal(app.requests.filter((request) => request.method === "PUT").length, 1);
  app.reset(); await app.load("B");
  const next = app.mount("target").toggle();
  const current = app.requests.at(-1);
  app.reply(old, { exerciseIds: ["target"] }); await first;
  await app.mount("target").toggle();
  assert.equal(app.requests.filter((request) => request.method === "DELETE").length, 0);
  assert.equal(app.requests.filter((request) => request.method === "PUT").length, 2);
  app.reply(current, { exerciseIds: ["target"] }); await next;
  assert.deepEqual(app.snapshot().exerciseIds, ["target"]);
});

test("401 clears private data and the next save click starts Google sign-in", async () => {
  const app = harness();
  await app.load("A", ["private"]);
  const card = app.mount("target");
  const mutation = card.toggle();
  app.reply(app.next("PUT"), { error: "Expired" }, 401);
  await mutation;
  assert.equal(app.snapshot().authenticated, false);
  assert.equal(app.snapshot().userId, null);
  assert.deepEqual(app.snapshot().exerciseIds, []);
  await card.toggle();
  assert.match(app.window.location.href, /^\/auth\/google\?next=/);
  assert.equal(JSON.parse(app.storage.get(pendingKey)).exerciseId, "target");
  assert.equal(app.requests.filter((request) => request.method === "PUT").length, 1);
});

test("a save click before the initial 401 finishes still starts sign-in once", async () => {
  const app = harness();
  const card = app.mount("target");
  const pending = card.toggle();
  app.reply(app.next(), {}, 401);
  await pending;
  assert.match(app.window.location.href, /^\/auth\/google\?next=/);
  assert.equal(app.snapshot().authenticated, false);
});

test("a 401 invalidates other optimistic mutations still in flight", async () => {
  const app = harness();
  await app.load("A", ["private"]);
  const first = app.mount("first").toggle();
  const firstPut = app.next("PUT");
  const second = app.mount("second").toggle();
  const secondPut = app.requests.at(-1);
  app.reply(firstPut, {}, 401); await first;
  const anonymous = app.snapshot();
  app.reply(secondPut, { exerciseIds: ["second"] }); await second;
  assert.deepEqual(app.snapshot(), anonymous);
  assert.equal(app.snapshot().authenticated, false);
  assert.deepEqual(app.snapshot().exerciseIds, []);
});

test("a mutation body decoded after reset cannot add old aliases to B", async () => {
  const app = harness();
  await app.load("A");
  const mutation = app.mount("target").toggle();
  const old = app.next("PUT");
  old.replied = true;
  let finishBody;
  old.resolve({ ok: true, status: 200, json: () => new Promise((resolve) => { finishBody = resolve; }) });
  await settle();
  app.reset(); await app.load("B", ["B-only"]);
  finishBody({ exerciseIds: ["target", "source-99"] }); await mutation;
  assert.equal(app.snapshot().userId, "B");
  assert.deepEqual(app.snapshot().exerciseIds, ["B-only"]);
});

test("a reset cancels a save intent waiting for an old load", async () => {
  const app = harness();
  const pending = app.mount("target").toggle();
  const old = app.next();
  app.reset(); await app.load("B", ["B-only"]);
  app.reply(old, { authenticated: true, userId: "A", exerciseIds: [] });
  await pending;
  assert.equal(app.requests.filter((request) => request.method === "PUT").length, 0);
  assert.deepEqual(app.snapshot().exerciseIds, ["B-only"]);
});

test("a failed read is retried and failed optimistic save preserves other successful saves", async () => {
  const app = harness();
  const firstCard = app.mount("first"); app.runTimers();
  app.reply(app.next(), { error: "Temporary failure" }, 500); await settle();
  assert.equal(app.snapshot().status, "error");
  const first = firstCard.toggle();
  app.reply(app.next(), { authenticated: true, userId: "A", exerciseIds: [] }); await settle();
  const firstPut = app.next("PUT");
  const second = app.mount("second").toggle();
  const secondPut = app.requests.at(-1);
  app.reply(secondPut, { exerciseIds: ["second", "source-2"] }); await second;
  app.reply(firstPut, { error: "Save failed" }, 500); await first;
  assert.deepEqual(app.snapshot().exerciseIds, ["second", "source-2"]);
  assert.equal(firstCard.render().error, "Save failed");
});

for (const status of [200, 500, 401]) {
  test(`pending OAuth completion ${status} is discarded after logout and cannot replay for B`, async () => {
    const app = harness();
    app.storage.set(pendingKey, JSON.stringify({ exerciseId: "intent-A", next: "/exercises/chest", createdAt: Date.now() }));
    await app.load("A");
    const old = app.next("PUT");
    app.reset();
    assert.equal(app.storage.has(pendingKey), false);
    await app.load("B", ["B-only"]);
    app.reply(old, status === 200 ? { exerciseIds: ["intent-A"] } : { error: "Old failure" }, status);
    await settle();
    assert.deepEqual(app.snapshot().exerciseIds, ["B-only"]);
    assert.equal(app.snapshot().userId, "B");
    assert.equal(app.snapshot().error, null);
    assert.equal(app.requests.filter((request) => request.method === "PUT").length, 1);
  });
}

test("a successful pending OAuth save completes once for the current user", async () => {
  const app = harness();
  app.storage.set(pendingKey, JSON.stringify({ exerciseId: "intent", next: "/exercises/chest", createdAt: Date.now() }));
  await app.load("A");
  app.mount(); app.runTimers();
  assert.equal(app.requests.filter((request) => request.method === "PUT").length, 1);
  app.reply(app.next("PUT"), { exerciseIds: ["intent", "source-42"] }); await settle();
  assert.deepEqual(app.snapshot().exerciseIds, ["intent", "source-42"]);
  assert.equal(app.storage.has(pendingKey), false);
});

test("401 during OAuth completion clears identity and consumes the old intent", async () => {
  const app = harness();
  app.storage.set(pendingKey, JSON.stringify({ exerciseId: "intent", next: "/exercises/chest", createdAt: Date.now() }));
  await app.load("A", ["private"]);
  app.reply(app.next("PUT"), {}, 401); await settle();
  assert.equal(app.snapshot().authenticated, false);
  assert.deepEqual(app.snapshot().exerciseIds, []);
  assert.equal(app.storage.has(pendingKey), false);
});

test("a manual retry consumes a failed OAuth intent so reload cannot undo a later removal", async () => {
  const app = harness();
  app.storage.set(pendingKey, JSON.stringify({ exerciseId: "source-42", next: "/exercises/chest", createdAt: Date.now() }));
  await app.load("A");
  app.reply(app.next("PUT"), { error: "Temporary failure" }, 500); await settle();
  assert.equal(app.storage.has(pendingKey), true);
  const card = app.mount("exercise-uuid");
  const save = card.toggle();
  app.reply(app.next("PUT"), { exerciseIds: ["exercise-uuid", "source-42"] }); await save;
  assert.equal(app.storage.has(pendingKey), false);
  const remove = card.toggle();
  app.reply(app.next("DELETE"), { exerciseIds: ["exercise-uuid", "source-42"] }); await remove;
  assert.deepEqual(app.snapshot().exerciseIds, []);
  const afterReload = harness();
  for (const [key, value] of app.storage) afterReload.storage.set(key, value);
  await afterReload.load("A");
  assert.equal(afterReload.requests.filter((request) => request.method === "PUT").length, 0);
});

test("invalid pending intents are discarded without a write", async () => {
  for (const raw of ["invalid JSON", JSON.stringify({ exerciseId: "old", next: "/", createdAt: Date.now() - 16 * 60_000 }), JSON.stringify({ exerciseId: "future", next: "/", createdAt: Date.now() + 60_000 })]) {
    const app = harness();
    app.storage.set(pendingKey, raw);
    await app.load("A");
    assert.equal(app.storage.has(pendingKey), false);
    assert.equal(app.requests.filter((request) => request.method === "PUT").length, 0);
  }
});

test("disabled sessionStorage does not prevent logout cleanup or Google sign-in", async () => {
  const app = harness({ storageDisabled: true });
  await app.load("A", ["private"]);
  assert.doesNotThrow(() => app.reset());
  const pending = app.mount("target").toggle();
  app.reply(app.next(), {}, 401); await pending;
  assert.match(app.window.location.href, /^\/auth\/google\?next=/);
  assert.deepEqual(app.snapshot().exerciseIds, []);
});
