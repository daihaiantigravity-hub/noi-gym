import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../components/LazyExerciseVideo.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
});
const exports = {};
const messages = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../lib/i18n/messages.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: messages });
vm.runInNewContext(outputText, {
  exports,
  require(name) {
    if (name === "react") return React;
    if (name === "react/jsx-runtime") return jsxRuntime;
    if (name === "./LanguageProvider") return { useAppLanguage: () => ({ language: "en" }) };
    if (name === "@/lib/i18n/messages") return messages;
    throw new Error(`Unexpected import ${name}`);
  },
});

test("every current-page video can load from server markup without waiting for poster or hydration", () => {
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null,
    ...Array.from({ length: 10 }, (_, index) => React.createElement(exports.default, {
      key: index,
      src: `https://media.example/video-${index}.mp4`,
      poster: `https://media.example/slow-poster-${index}.webp`,
      label: `Exercise video ${index + 1}`,
      className: "exercise-library-showcase__video",
    })),
  ));
  const videos = html.match(/<video\b[^>]*>/g) ?? [];
  assert.equal(videos.length, 10);
  for (const [index, video] of videos.entries()) {
    assert.ok(video.includes(`src="https://media.example/video-${index}.mp4"`));
    for (const attribute of ['autoPlay=""', 'loop=""', 'muted=""', 'playsInline=""', 'preload="auto"']) {
      assert.ok(video.includes(attribute), `Missing ${attribute}: ${video}`);
    }
  }
  assert.equal((html.match(/class="lazy-exercise-video__poster"/g) ?? []).length, 10);
});

test("missing posters do not prevent loading video", () => {
  const html = renderToStaticMarkup(React.createElement(exports.default, {
    src: "https://media.example/no-poster.mp4", label: "Exercise video", className: "video",
  }));
  assert.match(html, /src="https:\/\/media\.example\/no-poster\.mp4"/);
  assert.doesNotMatch(html, /<img/);
});
