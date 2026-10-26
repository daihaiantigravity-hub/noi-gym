import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { z } from "zod";
import * as content from "../lib/exercises/translation-content.mjs";

function load(relativePath, imports = {}, globals = {}) {
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(new URL(relativePath, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  vm.runInNewContext(compiled.outputText, { exports, console, URL, Date, process: { env: {} }, ...globals, require(name) { assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`); return imports[name]; } });
  return exports;
}

const dictionary = load("../lib/i18n/workspace-messages.ts");
test("auth and admin dictionaries have matching keys and placeholders", () => {
  const en = dictionary.getWorkspaceMessages("en"), vi = dictionary.getWorkspaceMessages("vi");
  assert.deepEqual(Object.keys(en).sort(), Object.keys(vi).sort());
  for (const key of Object.keys(en)) {
    assert.deepEqual([...en[key].matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort(), [...vi[key].matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort(), key);
    assert.ok(en[key].trim() && vi[key].trim());
  }
  assert.equal(dictionary.workspaceText("vi", "step", { number: 2 }), "Bước 2");
});

const legal = load("../lib/i18n/legal.ts");
test("legal pages keep equivalent section coverage in both languages", () => {
  for (const kind of ["privacy", "terms"]) {
    const en = legal.getLegalContent("en", kind), vi = legal.getLegalContent("vi", kind);
    assert.equal(en.sections.length, 4); assert.equal(vi.sections.length, 4);
    assert.notEqual(en.title, vi.title); assert.match(en.updated, /2026/); assert.match(vi.updated, /2026/);
  }
});

let configured = true;
let authError = null;
let authUser = { email: "admin@example.com" };
const authCalls = [];
const auth = load("../app/actions/auth.ts", {
  "next/navigation": { redirect: (path) => { throw new Error(`REDIRECT:${path}`); } },
  "next/headers": { headers: async () => new Headers({ host: "localhost:3002" }) },
  "@/lib/admin-auth": { isAdminEmail: (email) => email === "admin@example.com", isAdminUser: (user) => user?.email === "admin@example.com" },
  "@/lib/supabase/server": { isSupabaseConfigured: () => configured, createSupabaseServerClient: async () => ({ auth: {
    signInWithPassword: async () => { authCalls.push("signIn"); return { data: { user: authUser }, error: authError }; },
    signOut: async () => { authCalls.push("signOut"); },
    resetPasswordForEmail: async (...args) => { authCalls.push(["reset", ...args]); return { error: authError }; },
    getUser: async () => { authCalls.push("getUser"); return { data: { user: authUser }, error: authError }; },
    updateUser: async () => { authCalls.push("updateUser"); return { error: authError }; },
  } }) },
});
function form(values) { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; }

test("auth validation returns stable keys without making auth requests", async () => {
  authCalls.length = 0;
  configured = false;
  assert.equal((await auth.signInAction({}, form({}))).error, "authNotConfigured");
  configured = true;
  assert.equal((await auth.signInAction({}, form({}))).error, "authCredentialsRequired");
  assert.equal((await auth.requestPasswordResetAction({}, form({ email: "invalid" }))).error, "authInvalidEmail");
  assert.equal((await auth.updatePasswordAction({}, form({ password: "short" }))).error, "authPasswordTooShort");
  assert.equal((await auth.updatePasswordAction({}, form({ password: "long-enough-password", passwordConfirmation: "different" }))).error, "authPasswordsMismatch");
  assert.equal(authCalls.length, 0);
});

test("quota and non-admin login failures are localized by key and still reject access", async () => {
  const input = form({ email: "user@example.com", password: "password" });
  authError = { status: 402, message: "private provider details" };
  assert.equal((await auth.signInAction({}, input)).error, "authQuotaExceeded");
  authError = { message: "Incorrect password" };
  assert.equal((await auth.signInAction({}, input)).error, "authInvalidCredentials");
  authError = null; authUser = { email: "user@example.com" }; authCalls.length = 0;
  assert.equal((await auth.signInAction({}, input)).error, "authAdminRequired");
  assert.deepEqual(authCalls, ["signIn", "signOut"]);
  authUser = { email: "admin@example.com" };
});

test("password recovery preserves generic responses and never sends email to non-admins", async () => {
  authCalls.length = 0;
  const unknown = await auth.requestPasswordResetAction({}, form({ email: "unknown@example.com" }));
  assert.equal(unknown.success, "authResetSent"); assert.equal(authCalls.length, 0);
  const known = await auth.requestPasswordResetAction({}, form({ email: "ADMIN@example.com" }));
  assert.equal(known.success, unknown.success);
  assert.equal(authCalls[0][2].redirectTo, "http://localhost:3002/auth/callback");
});

test("password changes still require a valid administrator recovery session", async () => {
  authCalls.length = 0; authUser = null;
  const input = form({ password: "long-enough-password", passwordConfirmation: "long-enough-password" });
  assert.equal((await auth.updatePasswordAction({}, input)).error, "authRecoveryInvalid");
  assert.deepEqual(authCalls, ["getUser"]);
  authUser = { email: "admin@example.com" };
  await assert.rejects(() => auth.updatePasswordAction({}, input), /REDIRECT:\/admin\/exercises/);
  assert.equal(authCalls.at(-1), "updateUser");
});

const redirectHelpers = load("../lib/auth/redirect.ts");
let callbackFailure = false;
const callback = load("../app/auth/google/callback/route.ts", {
  "next/server": { NextResponse: { redirect: (target) => {
    const changedCookies = [];
    return { url: String(target), changedCookies, cookies: { set: (name, value, options) => changedCookies.push({ name, value, options }) } };
  } } },
  "@/lib/auth/redirect": redirectHelpers,
  "@/lib/supabase/server": { isSupabaseConfigured: () => true, createSupabaseServerClient: async () => ({ auth: { exchangeCodeForSession: async () => ({ error: callbackFailure ? { message: "Provider failure" } : null }) } }) },
});

function callbackRequest(search = "?code=example") {
  const url = `http://localhost:3002/auth/google/callback${search}`;
  return { url, nextUrl: new URL(url), headers: new Headers({ host: "localhost:3002" }), cookies: { get: (name) => {
    if (name === redirectHelpers.GOOGLE_OAUTH_NEXT_COOKIE) return { value: "/favorites" };
    if (name === "noi-gym-language") return { value: "vi" };
  } } };
}

test("Google callback preserves the destination and never clears the language cookie", async () => {
  const response = await callback.GET(callbackRequest());
  assert.equal(response.url, "http://localhost:3002/favorites");
  assert.equal(response.changedCookies.length, 1);
  assert.equal(response.changedCookies[0].name, redirectHelpers.GOOGLE_OAUTH_NEXT_COOKIE);
  assert.equal(response.changedCookies[0].options.maxAge, 0);
});

test("Google callback failures expose stable reasons without provider details or locale changes", async () => {
  const invalid = await callback.GET(callbackRequest(""));
  assert.equal(new URL(invalid.url).searchParams.get("auth"), "google-callback-invalid");
  callbackFailure = true;
  try {
    const failed = await callback.GET(callbackRequest());
    assert.equal(new URL(failed.url).searchParams.get("auth"), "google-callback-failed");
    assert.equal(failed.url.includes("Provider"), false);
    assert.equal(failed.changedCookies.some((cookie) => cookie.name === "noi-gym-language"), false);
  } finally { callbackFailure = false; }
});

const source = { id: "00000000-0000-4000-a000-000000000001", name: "Barbell Bench Press", description: "", steps: ["Lift the bar."], category: "Barbell", status: "Published" };
const originalVersion = "2026-10-22T09:00:00.000Z";
const row = (overrides = {}) => ({ exercise_id: source.id, locale: "vi", source_locale: "en", source_hash: content.getExerciseContentHash(source), name: "Đẩy tạ đòn", description: "", steps: ["Đẩy thanh tạ lên."], translation_status: "draft", reviewed_at: null, updated_at: originalVersion, ...overrides });
let authorized = true, stored = null, writes = [], writeError = null, contentInvalidations = 0;
const newVersion = "2026-10-22T10:00:00.000Z";
const database = { from(table) {
  return { filters: [], select() { return this; }, eq(key, value) { this.filters.push([key, value]); return this; },
    insert(values) { this.operation = "insert"; this.values = values; return this; },
    update(values) { this.operation = "update"; this.values = values; return this; },
    async maybeSingle() {
      if (table === "exercises") return { data: source, error: null };
      writes.push(this);
      if (writeError) return { data: null, error: writeError };
      if (this.operation === "insert" && stored) return { data: null, error: { code: "23505" } };
      if (this.operation === "update" && (!stored || this.filters.some(([key, value]) => stored[key] !== value))) return { data: null, error: null };
      stored = { ...this.values, updated_at: newVersion };
      return { data: { updated_at: newVersion }, error: null };
    },
  };
} };
const repository = load("../lib/exercises/translations.ts", {
  "server-only": {},
  "next/cache": { unstable_cache: (read) => read },
  "./cache": { invalidateExerciseContent: () => { contentInvalidations += 1; } },
  "./performance": { measureExerciseRead: (_phase, read) => read() },
  "@/lib/admin-auth": { requireAdmin: async () => { if (!authorized) throw new Error("Unauthorized"); return { supabase: database }; } },
  "@/lib/i18n/server": { isLocalizationEnabled: () => true },
  "@/lib/supabase/server": {},
  "./translation-content.mjs": content,
});

test("translation writes require admin access, current source and valid review content", async () => {
  writes = []; authorized = false; contentInvalidations = 0;
  await assert.rejects(() => repository.saveExerciseTranslation(row(), null), (error) => error.code === "translationAccessDenied");
  authorized = true;
  await assert.rejects(() => repository.saveExerciseTranslation(row({ source_hash: "0".repeat(64) }), null), (error) => error.code === "translationSourceChanged");
  await assert.rejects(() => repository.saveExerciseTranslation(row({ translation_status: "reviewed", steps: [] }), null), (error) => error.code === "translationInvalid");
  await assert.rejects(() => repository.saveExerciseTranslation(row({ translation_status: "stale" }), null), (error) => error.code === "translationInvalid");
  assert.equal(writes.length, 0);
  assert.equal(contentInvalidations, 0);
});

test("new drafts use insert and never overwrite a concurrently created translation", async () => {
  stored = null; writes = []; contentInvalidations = 0;
  const result = await repository.saveExerciseTranslation(row(), null);
  assert.equal(result.updatedAt, newVersion); assert.equal(writes[0].operation, "insert");
  await assert.rejects(() => repository.saveExerciseTranslation(row({ name: "Another editor" }), null), (error) => error.code === "translationConflict");
  assert.equal(stored.name, "Đẩy tạ đòn");
  assert.equal(contentInvalidations, 1);
});

test("updates compare the exact revision and preserve the other editor's changes", async () => {
  stored = row(); writes = [];
  await repository.saveExerciseTranslation(row({ name: "Current revision" }), originalVersion);
  assert.ok(writes[0].filters.some(([key, value]) => key === "updated_at" && value === originalVersion));
  await assert.rejects(() => repository.saveExerciseTranslation(row({ name: "Obsolete revision" }), originalVersion), (error) => error.code === "translationConflict");
  assert.equal(stored.name, "Current revision");
});

test("approval assigns its timestamp on the server and writes only translation fields", async () => {
  stored = null;
  await repository.saveExerciseTranslation(row({ translation_status: "reviewed", reviewed_at: "1900-01-01T00:00:00Z", updated_at: "injected", status: "Archived", media: ["injected"] }), null);
  assert.equal(stored.translation_status, "reviewed"); assert.notEqual(stored.reviewed_at, "1900-01-01T00:00:00Z");
  assert.ok(Number.isFinite(Date.parse(stored.reviewed_at)));
  assert.equal(Object.hasOwn(stored, "media"), false); assert.equal(Object.hasOwn(stored, "status"), false);
  writeError = { code: "23514", message: "Source content changed; re-export" };
  try { await assert.rejects(() => repository.saveExerciseTranslation(row(), newVersion), (error) => error.code === "translationSourceChanged"); }
  finally { writeError = null; }
});

const overview = load("../lib/exercises/translation-overview.ts", { "./translation-content.mjs": content });
test("coverage includes new exercises and distinguishes current, stale and original content", () => {
  const sources = [source, { ...source, id: "2", name: "New exercise" }, { ...source, id: "3", name: "Changed exercise" }, { ...source, id: "4", name: "Đẩy tạ", steps: ["Nâng tạ."] }];
  const result = overview.buildTranslationOverview(sources, [row(), row({ exercise_id: "3" })], { locale: "vi" });
  assert.equal(result.stats.total, 4); assert.equal(result.stats.draft, 1); assert.equal(result.stats.stale, 1);
  assert.equal(result.stats.missing, 1); assert.equal(result.stats.original, 1);
});

test("admin search supports original and Vietnamese names with or without accents", () => {
  for (const query of ["Đẩy tạ", "day ta", "BARBELL"]) {
    const result = overview.buildTranslationOverview([source], [row()], { locale: "vi", query });
    assert.equal(result.total, 1, query); assert.equal(result.items[0].id, source.id);
  }
  const english = overview.buildTranslationOverview([source], [row()], { locale: "en" });
  assert.equal(english.stats.original, 1); assert.equal(english.items[0].translatedName, "");
});

test("translation pagination clamps invalid pages and returns only the selected records", () => {
  const sources = Array.from({ length: 51 }, (_, index) => ({ ...source, id: String(index), name: `Exercise ${String(index).padStart(3, "0")}` }));
  const result = overview.buildTranslationOverview(sources, [], { locale: "vi", page: 999 });
  assert.equal(result.page, 3); assert.equal(result.items.length, 1); assert.equal(result.items[0].id, "50");
  assert.equal(overview.buildTranslationOverview(sources, [], { locale: "vi", page: -5 }).page, 1);
});

let actionWrites = [], invalidations = [];
const actions = load("../app/actions/translations.ts", {
  zod: { z },
  "next/cache": { revalidatePath: (...args) => invalidations.push(args) },
  "@/lib/exercises/translations": { TranslationWriteError: repository.TranslationWriteError, saveExerciseTranslation: async (...args) => { actionWrites.push(args); return { updatedAt: newVersion }; } },
});
const payload = () => ({ exerciseId: source.id, locale: "vi", sourceLocale: "en", sourceHash: content.getExerciseContentHash(source), name: "Đẩy tạ", description: "", steps: ["Nâng tạ."], expectedUpdatedAt: null });
test("translation actions reject malformed JSON, extra fields, invalid locale and status before writing", async () => {
  actionWrites = [];
  for (const [json, intent] of [["{", "draft"], [JSON.stringify({ ...payload(), locale: "fr" }), "draft"], [JSON.stringify({ ...payload(), updated_at: "injected" }), "draft"], [JSON.stringify(payload()), "stale"]]) {
    assert.equal((await actions.saveTranslationAction({}, form({ payload: json, intent }))).error, "translationInvalid");
  }
  assert.equal(actionWrites.length, 0);
});

test("successful translation actions invalidate public and admin views without changing exercise ranking data", async () => {
  invalidations = []; actionWrites = [];
  const result = await actions.saveTranslationAction({}, form({ payload: JSON.stringify(payload()), intent: "reviewed" }));
  assert.equal(result.success, "translationSavedReviewed"); assert.equal(result.updatedAt, newVersion);
  assert.equal(actionWrites[0][0].translation_status, "reviewed");
  assert.deepEqual(invalidations.map(([path]) => path), ["/admin/translations", `/admin/translations/${source.id}`, "/exercises/[muscle]", "/exercises/[muscle]/[exerciseId]", "/favorites"]);
});

test("partial drafts omit unfinished trailing steps without shifting instruction order", async () => {
  actionWrites = [];
  const partial = { ...payload(), steps: ["Bước đầu", "", "  "] };
  assert.equal((await actions.saveTranslationAction({}, form({ payload: JSON.stringify(partial), intent: "draft" }))).success, "translationSavedDraft");
  assert.deepEqual(Array.from(actionWrites[0][0].steps), ["Bước đầu"]);
  const nameOnly = { ...payload(), steps: ["", ""] };
  assert.equal((await actions.saveTranslationAction({}, form({ payload: JSON.stringify(nameOnly), intent: "draft" }))).success, "translationSavedDraft");
  assert.equal(actionWrites.at(-1)[0].steps.length, 0);
  const outOfOrder = { ...payload(), steps: ["", "Bước sau"] };
  const before = actionWrites.length;
  assert.equal((await actions.saveTranslationAction({}, form({ payload: JSON.stringify(outOfOrder), intent: "draft" }))).error, "translationInvalid");
  assert.equal((await actions.saveTranslationAction({}, form({ payload: JSON.stringify(partial), intent: "reviewed" }))).error, "translationInvalid");
  assert.equal(actionWrites.length, before);
});
