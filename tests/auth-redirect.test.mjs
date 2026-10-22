import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../lib/auth/redirect.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const exports = {};
vm.runInNewContext(outputText, { exports, URL, require: () => assert.fail("Unexpected import") });

test("OAuth next accepts internal paths and rejects external or backslash paths", () => {
  assert.equal(exports.getSafeNextPath("/favorites"), "/favorites");
  assert.equal(exports.getSafeNextPath("/exercises/chest?page=2"), "/exercises/chest?page=2");
  assert.equal(exports.getSafeNextPath("https://example.com"), "/");
  assert.equal(exports.getSafeNextPath("//example.com/path"), "/");
  assert.equal(exports.getSafeNextPath("/\\example.com"), "/");
  assert.equal(exports.getSafeNextPath(null, "/fallback"), "/fallback");
});

test("request origin honors forwarded deployment headers", () => {
  const request = new Request("http://internal:3000/auth/google", {
    headers: { "x-forwarded-host": "noi-gym.vercel.app", "x-forwarded-proto": "https" },
  });
  assert.equal(exports.getRequestOrigin(request), "https://noi-gym.vercel.app");
});
