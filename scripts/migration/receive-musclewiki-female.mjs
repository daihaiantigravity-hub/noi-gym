import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "data/female");
const capturePath = path.join(directory, "browser-capture.json");
const detailsPath = path.join(directory, "detail-capture.json");
const unresolvedPath = path.join(directory, "unresolved-metadata.json");
const port = Number(process.argv[2] || 34874);
const read = () => JSON.parse(fs.readFileSync(capturePath, "utf8"));
http.createServer(async (request, response) => {
  if (request.method === "GET") {
    if (request.url === "/state") {
      const capture = read();
      response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      response.end(JSON.stringify({ roots: capture.roots, pages: capture.pages.length, records: capture.records.length }));
    } else {
      const capture = read();
      const state = JSON.stringify({ roots: capture.roots, pages: capture.pages.length, records: capture.records.length }).replace(/&/g, "&amp;").replace(/</g, "&lt;");
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      const unresolved = JSON.parse(fs.readFileSync(unresolvedPath, "utf8"));
      const details = fs.existsSync(detailsPath) ? JSON.parse(fs.readFileSync(detailsPath, "utf8")) : [];
      const sourceData = JSON.stringify({ unresolved, completed: details.map((item) => item.sourceUrl) }).replace(/&/g, "&amp;").replace(/</g, "&lt;");
      response.end(`<!doctype html><title>Female dataset checkpoint</title><form method="post" action="/capture"><label for="payload">Capture batch</label><textarea id="payload" name="payload"></textarea><button type="submit">Save checkpoint</button></form><details open><summary>Saved checkpoint</summary><pre id="checkpoint-data" style="white-space:pre-wrap">${state}</pre></details><details open><summary>Detail queue</summary><pre id="detail-queue" style="white-space:pre-wrap">${sourceData}</pre></details>`);
    }
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
    if (incoming.details) {
      const current = fs.existsSync(detailsPath) ? JSON.parse(fs.readFileSync(detailsPath, "utf8")) : [];
      const byUrl = new Map(current.map((item) => [item.sourceUrl, item]));
      for (const detail of incoming.details) {
        const source = new URL(detail.sourceUrl);
        if (source.origin !== "https://musclewiki.com" || !/^\/exercise\/[a-z0-9-]+$/i.test(source.pathname) || source.searchParams.get("model") !== "f") throw new Error("Unexpected detail page");
        byUrl.set(detail.sourceUrl, detail);
      }
      fs.writeFileSync(`${detailsPath}.tmp`, `${JSON.stringify([...byUrl.values()], null, 2)}\n`);
      fs.renameSync(`${detailsPath}.tmp`, detailsPath);
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(`<!doctype html><title>Detail checkpoint saved</title><h1>Saved ${byUrl.size} detail pages</h1>`);
      return;
    }
    const capture = read();
    const pages = new Map(capture.pages.map((page) => [page.sourcePage, page]));
    const records = new Map(capture.records.map((record) => [record.sourceUrl, record]));
    for (const page of incoming.pages || []) {
      const source = new URL(page.sourcePage);
      if (source.origin !== "https://musclewiki.com" || source.searchParams.get("model") !== "f") throw new Error("Unexpected source page");
      const group = source.pathname.split("/")[2];
      for (const record of page.records) {
        const prior = records.get(record.sourceUrl);
        if (prior) {
          prior.listedIn = [...new Set([...(prior.listedIn || []), group])];
          for (const item of record.media) if (!prior.media.some((media) => media.url === item.url)) prior.media.push(item);
        } else records.set(record.sourceUrl, { ...record, listedIn: [group] });
      }
      pages.set(page.sourcePage, { sourcePage: page.sourcePage, summary: page.summary, nextPageUrl: page.nextPageUrl, recordUrls: page.records.map((record) => record.sourceUrl) });
    }
    capture.capturedAt = new Date().toISOString();
    capture.pages = [...pages.values()];
    capture.records = [...records.values()];
    if (incoming.roots) capture.roots = incoming.roots;
    fs.writeFileSync(`${capturePath}.tmp`, `${JSON.stringify(capture, null, 2)}\n`);
    fs.renameSync(`${capturePath}.tmp`, capturePath);
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><title>Checkpoint saved</title><h1>Saved ${capture.pages.length} pages, ${capture.records.length} records</h1>`);
    console.log(`Saved ${capture.pages.length} pages, ${capture.records.length} records`);
  } catch (error) {
    response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    response.end(error.message);
  }
}).listen(port, "127.0.0.1", () => console.log(`Female checkpoint receiver: http://127.0.0.1:${port}`));
