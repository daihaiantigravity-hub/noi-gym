import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("admin curation expires public ranking immediately instead of serving stale ordering", () => {
  const calls = [];
  const exports = {};
  const source = fs.readFileSync(new URL("../lib/exercises/cache.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  vm.runInNewContext(compiled.outputText, {
    exports,
    process: { env: {} },
    require(name) {
      assert.equal(name, "next/cache");
      return { revalidateTag: (...args) => calls.push(args) };
    },
  });

  exports.invalidateAdminExerciseRanking();
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [["public-exercise-priority", { expire: 0 }]]);
});
