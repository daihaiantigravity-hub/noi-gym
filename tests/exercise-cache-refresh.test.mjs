import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { refreshExerciseCache } from "../scripts/cache/refresh-exercise-cache.mjs";

const secret = "test-only-refresh-secret-32-characters-long";
function load(relativePath, imports, globals = {}, async = false) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(new URL(relativePath, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  return { exports, execution: vm.runInNewContext(async ? `(async () => { ${source}\n })()` : source, {
    exports, console, URL, Request, Response, process: { env: {} }, ...globals,
    require(name) { assert.ok(Object.hasOwn(imports, name), `Unexpected import ${name}`); return imports[name]; },
  }) };
}

function endpoint(env = { EXERCISE_CACHE_REVALIDATE_SECRET: secret }) {
  const state = { admin: true, authCalls: 0, invalidations: 0, paths: [], failRefresh: false };
  state.route = load("../app/api/admin/exercise-cache/route.ts", {
    "node:crypto": crypto,
    "next/cache": { revalidatePath: (...args) => state.paths.push(args) },
    "@/lib/admin-auth": { requireAdmin: async () => { state.authCalls++; if (!state.admin) throw new Error("private auth details"); } },
    "@/lib/exercises/cache": { invalidateExerciseContent: () => { state.invalidations++; if (state.failRefresh) throw new Error("private provider details"); } },
  }, { process: { env } }).exports;
  return state;
}
const request = (headers = {}) => new Request("https://app.example.test/api/admin/exercise-cache", { method: "POST", headers });
const assertNoStore = (response) => assert.match(response.headers.get("cache-control"), /no-store/);

test("valid bearer refreshes content and relevant routes without session lookup", async () => {
  const state = endpoint();
  const response = await state.route.POST(request({ authorization: `Bearer ${secret}` }));
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ok: true }); assertNoStore(response);
  assert.equal(state.authCalls, 0); assert.equal(state.invalidations, 1);
  assert.ok(state.paths.some(([path, type]) => path === "/exercises/[muscle]" && type === "page"));
  assert.ok(state.paths.some(([path]) => path === "/favorites"));
});

test("invalid supplied authorization never falls back to administrator cookies", async () => {
  for (const authorization of ["", "Bearer wrong", "Basic anything", `Bearer ${secret} extra`]) {
    const state = endpoint();
    const response = await state.route.POST(request({ authorization, origin: "https://app.example.test" }));
    assert.equal(response.status, 401); assertNoStore(response);
    assert.equal(state.authCalls, 0); assert.equal(state.invalidations, 0);
  }
  const weak = endpoint({ EXERCISE_CACHE_REVALIDATE_SECRET: "short" });
  assert.equal((await weak.route.POST(request({ authorization: "Bearer short" }))).status, 401);
});

test("cookie requests require both same-origin POST and verified administrator permission", async () => {
  const state = endpoint();
  for (const headers of [{}, { origin: "https://attacker.example" }, { origin: "https://attacker.example", "x-forwarded-host": "attacker.example" }]) {
    const response = await state.route.POST(request(headers));
    assert.equal(response.status, 403); assertNoStore(response);
  }
  assert.equal(state.authCalls, 0);
  state.admin = false;
  const denied = await state.route.POST(request({ origin: "https://app.example.test" }));
  assert.equal(denied.status, 403); assertNoStore(denied);
  state.admin = true;
  assert.equal((await state.route.POST(request({ origin: "https://app.example.test" }))).status, 200);
  assert.equal(state.authCalls, 2); assert.equal(state.invalidations, 1);
});

test("refresh errors and GET reveal no internal messages and remain uncacheable", async () => {
  const state = endpoint(); state.failRefresh = true;
  const response = await state.route.POST(request({ authorization: `Bearer ${secret}` }));
  assert.equal(response.status, 500); assertNoStore(response);
  assert.equal(JSON.stringify(await response.json()).includes("private"), false);
  const get = state.route.GET(); assert.equal(get.status, 405); assertNoStore(get);
});

test("CLI helper sends its credential only to the configured site endpoint with redirects disabled", async () => {
  for (const site of ["https://app.example.test", "http://localhost:3001/", "http://127.0.0.1:3001", "http://[::1]:3001"]) {
    let calls = 0;
    const result = await refreshExerciseCache({ env: { NEXT_PUBLIC_SITE_URL: site, EXERCISE_CACHE_REVALIDATE_SECRET: secret }, fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url.origin, new URL(site).origin); assert.equal(url.pathname, "/api/admin/exercise-cache");
      assert.equal(options.method, "POST"); assert.equal(options.redirect, "error"); assert.equal(options.cache, "no-store");
      assert.equal(options.headers.Authorization, `Bearer ${secret}`);
      return Response.json({ ok: true });
    } });
    assert.equal(calls, 1); assert.equal(result.status, "refreshed");
  }
});

test("CLI missing or unsafe configuration sends nothing and reports actionable status without secrets", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; throw new Error("must not call"); };
  assert.equal((await refreshExerciseCache({ env: {}, fetchImpl })).status, "manual_required");
  for (const site of ["http://app.example.test", "https://user:password@app.example.test", "https://app.example.test/path", "https://app.example.test?target=elsewhere", "https://app.example.test#fragment", "not a URL"]) {
    assert.equal((await refreshExerciseCache({ env: { NEXT_PUBLIC_SITE_URL: site, EXERCISE_CACHE_REVALIDATE_SECRET: secret }, fetchImpl })).status, "failed");
  }
  assert.equal((await refreshExerciseCache({ env: { NEXT_PUBLIC_SITE_URL: "https://app.example.test", EXERCISE_CACHE_REVALIDATE_SECRET: "short" }, fetchImpl })).status, "failed");
  assert.equal(calls, 0);
});

test("CLI network, redirect and server failures are distinct from a successful refresh and sanitized", async () => {
  const env = { NEXT_PUBLIC_SITE_URL: "https://app.example.test", EXERCISE_CACHE_REVALIDATE_SECRET: secret };
  const cases = [
    async () => { throw new Error(`redirect rejected: ${secret}`); },
    async () => new Response(`private ${secret}`, { status: 403 }),
    async () => Response.json({ ok: false, message: secret }),
    async () => new Response("not JSON"),
  ];
  for (const fetchImpl of cases) {
    const result = await refreshExerciseCache({ env, fetchImpl });
    assert.equal(result.status, "failed"); assert.equal(JSON.stringify(result).includes(secret), false);
  }
});

async function runImport({ apply = true, failAt = 0, throwsAt = 0, refreshStatus = "refreshed", unchanged = false } = {}) {
  const translations = [1, 2].map((number) => ({ exercise_id: `exercise-${number}`, locale: "vi", name: `Translation ${number}`, description: "", steps: ["Lift"], source_locale: "en", source_hash: "a".repeat(64), translation_status: "draft", reviewed_at: null }));
  const state = { attempts: 0, refreshCalls: 0, logs: [], checkpoints: [], process: { argv: ["node", "import-translations.mjs", "--input", "input.json", apply ? "--apply" : "--dry-run"], cwd: () => process.cwd(), exitCode: 0 } };
  const client = { from() {
    return { select() { return this; }, in() { return this; }, eq() { return this; }, insert() { return this; }, update() { return this; },
      then(resolve) { return Promise.resolve({ data: unchanged ? translations : [], error: null }).then(resolve); },
      async maybeSingle() {
        state.attempts++;
        if (throwsAt === state.attempts) throw new Error("network provider detail");
        return failAt === state.attempts ? { data: null, error: { code: "23505" } } : { data: { updated_at: "now" }, error: null };
      },
    };
  } };
  const result = load("../scripts/localization/import-translations.mjs", {
    "node:fs": { readFileSync: () => JSON.stringify({ version: 1, translations }), mkdirSync() {}, writeFileSync: (_path, contents) => state.checkpoints.push(JSON.parse(contents)) },
    "node:path": path, "node:crypto": crypto,
    "../../lib/exercises/translation-content.mjs": { validateExerciseTranslation: () => [] },
    "./common.mjs": { createLocalizationClient: () => client, readExerciseSources: async () => translations.map((item) => ({ id: item.exercise_id })), readOption: (args, key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback },
    "../cache/refresh-exercise-cache.mjs": { refreshExerciseCache: async () => { state.refreshCalls++; return { status: refreshStatus }; } },
  }, { process: state.process, console: { log: (value) => state.logs.push(JSON.parse(value)) } }, true);
  await result.execution;
  state.summary = state.logs.at(-1);
  return state;
}

test("successful translation writes refresh cache and record the result in summary and checkpoint", async () => {
  const state = await runImport();
  assert.equal(state.attempts, 2); assert.equal(state.refreshCalls, 1); assert.equal(state.process.exitCode, 0);
  assert.equal(state.summary.written, 2); assert.equal(state.summary.cacheRefresh.status, "refreshed");
  assert.equal(state.checkpoints.at(-1).cacheRefresh.status, "refreshed"); assert.ok(state.checkpoints.at(-1).completedAt);
});

test("partial translation writes refresh even when a later write rejects or throws", async () => {
  for (const failure of [{ failAt: 2 }, { throwsAt: 2 }]) {
    const state = await runImport(failure);
    assert.equal(state.refreshCalls, 1); assert.equal(state.summary.written, 1); assert.equal(state.process.exitCode, 1);
    assert.equal(state.summary.cacheRefresh.status, "refreshed"); assert.equal(state.checkpoints.at(-1).completedAt, null);
    assert.ok(state.summary.writeError.code);
  }
});

test("refresh failure has a separate exit code while missing config records manual refresh required", async () => {
  const failed = await runImport({ refreshStatus: "failed" });
  assert.equal(failed.summary.written, 2); assert.equal(failed.summary.writeError, null); assert.equal(failed.process.exitCode, 2);
  const manual = await runImport({ refreshStatus: "manual_required" });
  assert.equal(manual.summary.cacheRefresh.status, "manual_required"); assert.equal(manual.checkpoints.at(-1).cacheRefresh.status, "manual_required");
  assert.equal(manual.process.exitCode, 0);
});

test("dry runs and unchanged imports never make cache refresh requests", async () => {
  const dry = await runImport({ apply: false });
  assert.equal(dry.attempts, 0); assert.equal(dry.refreshCalls, 0); assert.equal(dry.checkpoints.length, 0);
  const unchanged = await runImport({ unchanged: true });
  assert.equal(unchanged.attempts, 0); assert.equal(unchanged.refreshCalls, 0);
  assert.equal(unchanged.summary.cacheRefresh.status, "not_required");
});
