import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { createElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

function load(path, imports = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, URLSearchParams, require: (name) => {
    assert.ok(Object.hasOwn(imports, name), `Unexpected import ${name}`);
    return imports[name];
  } });
  return exports;
}

const pagination = load("lib/exercises/pagination.ts");
const { default: ExercisePagination } = load("components/ExercisePagination.tsx", {
  "react/jsx-runtime": jsxRuntime,
  "next/link": { default: (props) => createElement("a", props) },
  "@/lib/exercises/pagination": pagination,
});
const props = { page: 1, pageSize: 5, routePath: "/exercises/biceps?view=advanced", total: 145 };

test("compact and desktop windows always include current, first and last pages, without duplicates", () => {
  for (const slots of [5, 7, 9]) {
    for (let total = 1; total <= 100; total++) {
      for (let page = 1; page <= total; page++) {
        const items = pagination.getPaginationItems(page, total, slots);
        const numbers = items.filter((item) => typeof item === "number");
        assert.ok(items.length <= slots);
        assert.ok(numbers.includes(page));
        assert.equal(numbers[0], 1);
        assert.equal(numbers.at(-1), total);
        assert.equal(new Set(numbers).size, numbers.length);
        assert.ok(numbers.every((number, index) => index === 0 || number > numbers[index - 1]));
      }
    }
  }
  assert.equal(JSON.stringify(pagination.getPaginationItems(1, 29, 5)), '[1,2,3,"ellipsis",29]');
  assert.equal(JSON.stringify(pagination.getPaginationItems(15, 29, 5)), '[1,"ellipsis",15,"ellipsis",29]');
  assert.equal(JSON.stringify(pagination.getPaginationItems(29, 29, 5)), '[1,"ellipsis",27,28,29]');
  assert.equal(JSON.stringify(pagination.getPaginationItems(5, 30, 7)), '[1,"ellipsis",4,5,6,"ellipsis",30]');
  assert.equal(JSON.stringify(pagination.getPaginationItems(5, 30, 9)), '[1,2,3,4,5,6,7,"ellipsis",30]');
});

test("URLs preserve filters and first page removes only the page parameter; five exercises per page", () => {
  assert.equal(pagination.PUBLIC_EXERCISES_PAGE_SIZE, 5);
  assert.equal(pagination.getPageHref("/exercises/biceps?view=advanced&page=2", 15), "/exercises/biceps?view=advanced&page=15");
  assert.equal(pagination.getPageHref("/exercises/biceps?view=advanced&page=2", 1), "/exercises/biceps?view=advanced");
  assert.equal(pagination.getPageHref("/exercises/biceps", 1), "/exercises/biceps");
});

test("first/middle/last page markup has accessible arrows and responsive page windows", () => {
  for (const page of [1, 15, 29]) {
    const html = renderToStaticMarkup(createElement(ExercisePagination, { ...props, page }));
    assert.equal((html.match(/<nav /g) ?? []).length, 1);
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 2);
    assert.equal((html.match(/<select/g) ?? []).length, 0);
    assert.equal((html.match(/disabled=""/g) ?? []).length, page === 15 ? 0 : 1);
    assert.ok(html.includes(`aria-label="Trang ${page}"`));
  }
  for (const total of [0, 1, 5]) {
    assert.equal(renderToStaticMarkup(createElement(ExercisePagination, { ...props, total })), "");
  }
});

test("mobile page window exposes the neighboring page buttons", () => {
  const html = renderToStaticMarkup(createElement(ExercisePagination, { ...props, page: 5, total: 150 }));
  assert.match(html, /exercise-library-pagination__numbers--compact/);
  assert.match(html, /aria-label="Trang 4"/);
  assert.match(html, /aria-label="Trang 5"/);
  assert.match(html, /aria-label="Trang 6"/);
});
