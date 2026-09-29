import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "data/female");
const capturePath = path.join(directory, "scope-capture.json");
const muscleCapture = JSON.parse(fs.readFileSync(path.join(directory, "browser-capture.json"), "utf8"));
const equipment = ["barbell", "dumbbells", "bodyweight", "machine", "medicine-ball", "kettlebells", "stretches", "cables", "band", "plate", "trx", "yoga", "bosu-ball", "cardio", "smith-machine", "recovery", "pilates"];
const joints = ["shoulders", "elbow", "wrist", "hips", "knees", "ankles"];
const femaleUrl = (pathname) => `https://musclewiki.com${pathname}?model=f`;
const roots = [
  ...joints.map((slug) => ({ id: `joint:${slug}`, kind: "joint", name: slug, url: femaleUrl(`/exercises/${slug}/recovery`), status: "pending", expected: null, pages: 0, next: femaleUrl(`/exercises/${slug}/recovery`) })),
  ...muscleCapture.roots.flatMap((muscle) => equipment.map((item) => {
    const slug = new URL(muscle.url).pathname.split("/")[2];
    const url = femaleUrl(`/exercises/${slug}/${item}`);
    return { id: `equipment:${slug}:${item}`, kind: "equipment", name: `${muscle.name} / ${item}`, url, status: "pending", expected: null, pages: 0, next: url };
  })),
];
if (!fs.existsSync(capturePath)) fs.writeFileSync(capturePath, `${JSON.stringify({ capturedAt: null, roots, pages: [], records: [] }, null, 2)}\n`);
const read = () => JSON.parse(fs.readFileSync(capturePath, "utf8"));
const escapeHtml = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const port = Number(process.argv[2] || 34874);

http.createServer(async (request, response) => {
  if (request.method === "GET") {
    if (request.url === "/form") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end('<!doctype html><title>Female scope save</title><form method="post" action="/capture"><label for="payload">Capture batch</label><textarea id="payload" name="payload"></textarea><button type="submit">Save checkpoint</button></form>');
      return;
    }
    const capture = read();
    const state = escapeHtml(JSON.stringify({ roots: capture.roots, pages: capture.pages.length, records: capture.records.length }));
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><title>Female scope checkpoint</title><form method="post" action="/capture"><label for="payload">Capture batch</label><textarea id="payload" name="payload"></textarea><button type="submit">Save checkpoint</button></form><pre id="scope-data">${state}</pre>`);
    return;
  }
  if (request.method !== "POST" || request.url !== "/capture") { response.writeHead(404); response.end(); return; }
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 2 * 1024 * 1024) throw new Error("Batch too large");
      chunks.push(chunk);
    }
    const incoming = JSON.parse(new URLSearchParams(Buffer.concat(chunks).toString("utf8")).get("payload"));
    const capture = read();
    const byRoot = new Map(capture.roots.map((root) => [root.id, root]));
    const pages = new Map(capture.pages.map((page) => [`${page.rootId}|${page.sourcePage}`, page]));
    const records = new Map(capture.records.map((record) => [record.sourceUrl, record]));
    for (const root of incoming.roots || []) {
      if (!byRoot.has(root.id) || root.url !== byRoot.get(root.id).url) throw new Error("Unexpected scope root");
      byRoot.set(root.id, root);
    }
    for (const page of incoming.pages || []) {
      const root = byRoot.get(page.rootId);
      const source = new URL(page.sourcePage);
      const base = new URL(root?.url || "https://invalid.example/");
      if (!root || source.origin !== "https://musclewiki.com" || source.searchParams.get("model") !== "f" || !source.pathname.startsWith(`${base.pathname}/`) && source.pathname !== base.pathname) throw new Error("Unexpected scope page");
      for (const record of page.records) {
        const exercise = new URL(record.sourceUrl);
        if (exercise.origin !== "https://musclewiki.com" || !/^\/exercise\/[a-z0-9-]+$/i.test(exercise.pathname) || exercise.searchParams.get("model") !== "f") throw new Error("Unexpected exercise URL");
        const prior = records.get(record.sourceUrl);
        if (prior) {
          prior.listedInScopes = [...new Set([...(prior.listedInScopes || []), page.rootId])];
          for (const media of record.media) if (!prior.media.some((item) => item.url === media.url)) prior.media.push(media);
        } else records.set(record.sourceUrl, { ...record, listedInScopes: [page.rootId] });
      }
      pages.set(`${page.rootId}|${page.sourcePage}`, { rootId: page.rootId, sourcePage: page.sourcePage, summary: page.summary, nextPageUrl: page.nextPageUrl, recordUrls: page.records.map((record) => record.sourceUrl) });
    }
    capture.capturedAt = new Date().toISOString();
    capture.roots = [...byRoot.values()];
    capture.pages = [...pages.values()];
    capture.records = [...records.values()];
    fs.writeFileSync(`${capturePath}.tmp`, `${JSON.stringify(capture, null, 2)}\n`);
    fs.renameSync(`${capturePath}.tmp`, capturePath);
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><title>Checkpoint saved</title><h1>Saved ${capture.pages.length} pages, ${capture.records.length} records</h1>`);
    console.log(`Saved ${capture.pages.length} pages, ${capture.records.length} records`);
  } catch (error) {
    response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    response.end(error.message);
  }
}).listen(port, "127.0.0.1", () => console.log(`Female scope receiver: http://127.0.0.1:${port}`));
