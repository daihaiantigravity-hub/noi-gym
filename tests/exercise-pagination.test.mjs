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
const pushes = [];
const { default: ExercisePagination } = load("components/ExercisePagination.tsx", {
  "react/jsx-runtime": jsxRuntime,
  "next/link": { default: (props) => createElement("a", props) },
  "next/navigation": { useRouter: () => ({ push: (href) => pushes.push(href) }) },
  "@/lib/exercises/pagination": pagination,
});
const props = { page: 1, pageSize: 5, routePath: "/exercises/biceps?view=advanced", total: 145 };

test("compact and desktop windows always include current, first and last pages, without duplicates", () => {
  for (const slots of [5, 7]) {
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
});

test("URLs preserve filters and first page removes only the page parameter; five exercises per page", () => {
  assert.equal(pagination.PUBLIC_EXERCISES_PAGE_SIZE, 5);
  assert.equal(pagination.getPageHref("/exercises/biceps?view=advanced&page=2", 15), "/exercises/biceps?view=advanced&page=15");
  assert.equal(pagination.getPageHref("/exercises/biceps?view=advanced&page=2", 1), "/exercises/biceps?view=advanced");
  assert.equal(pagination.getPageHref("/exercises/biceps", 1), "/exercises/biceps");
});

test("first/middle/last page markup has accessible arrows, selected pages and direct page picker", () => {
  for (const page of [1, 15, 29]) {
    const html = renderToStaticMarkup(createElement(ExercisePagination, { ...props, page }));
    assert.equal((html.match(/<nav /g) ?? []).length, 1);
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 2); // CSS displays one responsive window.
    assert.equal((html.match(/<option /g) ?? []).length, 29);
    assert.match(html, new RegExp(`<option value="${page}" selected=""`));
    assert.equal((html.match(/disabled=""/g) ?? []).length, page === 15 ? 0 : 1);
    assert.ok(html.includes(`aria-label="Trang ${page}"`));
  }
  for (const total of [0, 1, 5]) {
    assert.equal(renderToStaticMarkup(createElement(ExercisePagination, { ...props, total })), "");
  }
});

test("page picker jumps directly, retains filters and ignores selecting the current page", () => {
  // Hooks are stubbed above; inspect the actual React element's event handler.
  const tree = ExercisePagination(props);
  const summary = tree.props.children[0];
  const select = summary.props.children[1].props.children[2];
  select.props.onChange({ target: { value: "15" } });
  assert.equal(pushes.at(-1), "/exercises/biceps?view=advanced&page=15");
  const count = pushes.length;
  select.props.onChange({ target: { value: "1" } });
  assert.equal(pushes.length, count);
});
