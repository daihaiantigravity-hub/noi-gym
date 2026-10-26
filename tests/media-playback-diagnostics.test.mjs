import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const { outputText } = ts.transpileModule(readFileSync(new URL("../components/MediaPlaybackDiagnostics.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
});
const exports = {};
const imports = {
  react: React,
  "react/jsx-runtime": jsxRuntime,
  "./LanguageProvider": { useAppLanguage: () => assert.fail("Disabled diagnostics must not mount the panel") },
  "./MediaPlaybackDiagnostics.module.css": { default: {} },
};
vm.runInNewContext(outputText, {
  exports,
  require(name) { assert.ok(Object.hasOwn(imports, name)); return imports[name]; },
});
const { buildMediaDiagnosticsReport } = exports;
const sample = (changes = {}) => ({ time: 2, ready: 4, paused: false, error: 0, poster: false, totalFrames: 60, droppedFrames: 1, ...changes });
const measurement = (changes = {}) => ({
  elapsed: 8000, backgrounded: false, videosChanged: false, blurDisabled: false,
  frames: 400, gaps50: 3, gaps100: 1, maxGap: 140,
  start: [sample()], end: [sample({ time: 4, totalFrames: 290, droppedFrames: 4 })],
  userAgent: "Test browser", viewport: "360x780 dpr=3", network: "4g saveData=false",
  ...changes,
});

test("diagnostics render nothing on the server without accessing browser APIs", () => {
  assert.equal(renderToStaticMarkup(React.createElement(exports.default)), "");
});

test("report distinguishes progress, paused playback, poster overlays and media errors", () => {
  const report = buildMediaDiagnosticsReport(measurement({
    start: [sample({ time: 9 }), sample({ paused: true, poster: true, ready: 1, error: 2 })],
    end: [sample({ time: 1, totalFrames: 300, droppedFrames: 5 }), sample({ paused: true, poster: true, ready: 1, error: 2 })],
  }));
  assert.match(report, /Start n=2 ready=1 paused=1 errors=1 posters=1/);
  assert.match(report, /gaps>50ms=3 >100ms=1 max=140\.0ms/);
  assert.match(report, /v1 t=9\.0>1\.0 progress=yes.*frames=240 drop=4/);
  assert.match(report, /v2 .*progress=unconfirmed.*paused=1>1 err=2>2 poster=1>1 frames=0 drop=0/);
});

test("unsupported or reset playback counters remain unknown instead of reporting zero drops", () => {
  const report = buildMediaDiagnosticsReport(measurement({
    start: [sample({ totalFrames: null, droppedFrames: null }), sample()],
    end: [sample({ totalFrames: null, droppedFrames: null }), sample({ totalFrames: 1, droppedFrames: 0 })],
  }));
  assert.equal((report.match(/frames=NA drop=NA/g) ?? []).length, 2);
});

test("background tabs and replaced video elements invalidate the measurement explicitly", () => {
  assert.match(buildMediaDiagnosticsReport(measurement({ backgrounded: true })), /INVALID: tab hidden/);
  assert.match(buildMediaDiagnosticsReport(measurement({ videosChanged: true, blurDisabled: true })), /INVALID: videos changed.*blur=off/);
});

test("reports stay within the copy budget and serialize no extra account or media fields", () => {
  const privateFields = { email: "private@example.test", cookie: "secret-cookie", src: "https://private.example.test/video.mp4?token=secret" };
  const report = buildMediaDiagnosticsReport(measurement({
    ...privateFields,
    start: Array.from({ length: 40 }, () => ({ ...sample(), ...privateFields })),
    end: Array.from({ length: 40 }, () => ({ ...sample(), ...privateFields })),
    userAgent: "Browser\nInjected line".repeat(200),
  }));
  assert.ok(report.length <= 2000);
  for (const value of Object.values(privateFields)) assert.equal(report.includes(value), false);
  assert.equal(report.includes("Browser\nInjected"), false);
});
