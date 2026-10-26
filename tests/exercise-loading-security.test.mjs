import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(path, imports, env = {}) {
  const exports = {};
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  vm.runInNewContext(compiled.outputText, { exports, process: { env }, require(name) {
    assert.ok(Object.hasOwn(imports, name), `Unexpected import ${name}`);
    return imports[name];
  } });
  return exports;
}

test("favorite changes retain cached content and request only background priority refresh", () => {
  const invalidations = [];
  const cache = load("../lib/exercises/cache.ts", { "next/cache": { revalidateTag: (...args) => invalidations.push(args) } });
  cache.invalidateExerciseRanking();
  assert.deepEqual(invalidations, [[cache.PUBLIC_EXERCISES_PRIORITY_CACHE_TAG, "max"], [cache.PUBLIC_EXERCISES_CACHE_TAG, "max"]]);
  assert.ok(invalidations.every(([tag]) => tag !== cache.PUBLIC_EXERCISES_CONTENT_CACHE_TAG));
});

test("editing or withdrawing content expires content, translations, candidates and priority immediately", () => {
  const invalidations = [];
  const cache = load("../lib/exercises/cache.ts", { "next/cache": { revalidateTag: (...args) => invalidations.push(args) } });
  cache.invalidateExerciseContent();
  assert.deepEqual(new Set(invalidations.map(([tag]) => tag)), new Set([
    cache.PUBLIC_EXERCISES_CONTENT_CACHE_TAG, cache.PUBLIC_EXERCISES_CACHE_TAG, cache.PUBLIC_EXERCISES_PRIORITY_CACHE_TAG,
  ]));
  assert.ok(invalidations.every(([, policy]) => policy.expire === 0));
});

function proxyHarness(configured = true) {
  const calls = [];
  let clientOptions;
  let renewCookies = false;
  const env = configured ? { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-test-key" } : {};
  const imports = {
    "@supabase/ssr": { createServerClient(_url, _key, options) {
      clientOptions = options;
      const read = async (method) => {
        calls.push(method);
        if (renewCookies) options.cookies.setAll([{ name: "session", value: "refreshed", options: { httpOnly: true, sameSite: "lax" } }]);
        // A session returned here is intentionally unverified and must never
        // be treated as identity for favorites or administrative routes.
        return { data: { session: { user: { id: "unverified-cookie-user" } } }, error: null };
      };
      return { auth: { getSession: () => read("getSession"), getUser: () => read("getUser") } };
    } },
    "next/server": { NextResponse: { next({ request }) {
      const sentCookies = [];
      return { request, sentCookies, cookies: { set: (...args) => sentCookies.push(args) } };
    } } },
    "@/lib/exercises/performance": { measureExerciseRead: (_phase, read) => read() },
  };
  const { proxy } = load("../proxy.ts", imports, env);
  return {
    calls,
    renew() { renewCookies = true; },
    async request(pathname) {
      const cookies = new Map([["session", "existing"]]);
      const request = { nextUrl: { pathname }, cookies: {
        getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
        set: (name, value) => cookies.set(name, value),
      } };
      const response = await proxy(request);
      return { response, cookies, options: clientOptions };
    },
  };
}

test("public exercise navigation refreshes the session without remote identity lookup", async () => {
  const app = proxyHarness();
  await app.request("/exercises/chest/barbell");
  assert.deepEqual(app.calls, ["getSession"]);
});

test("auth, favorites and admin paths still perform verified identity lookup", async () => {
  const app = proxyHarness();
  for (const pathname of ["/", "/favorites", "/admin/exercises", "/auth/callback", "/api/auth/session", "/api/favorite-exercises", "/api/admin/favorite-exercises", "/exercises-admin"]) {
    await app.request(pathname);
  }
  assert.equal(app.calls.length, 8);
  assert.ok(app.calls.every((method) => method === "getUser"));
});

test("session renewal forwards updated cookies to both request and response", async () => {
  const app = proxyHarness();
  app.renew();
  const result = await app.request("/exercises/chest");
  assert.equal(result.cookies.get("session"), "refreshed");
  assert.deepEqual(JSON.parse(JSON.stringify(result.response.sentCookies)), [["session", "refreshed", { httpOnly: true, sameSite: "lax" }]]);
  assert.equal(result.options.cookies.getAll()[0].value, "refreshed");
});

test("missing Supabase configuration allows public navigation without constructing auth client", async () => {
  const app = proxyHarness(false);
  const result = await app.request("/exercises/chest");
  assert.equal(app.calls.length, 0);
  assert.equal(result.options, undefined);
});
