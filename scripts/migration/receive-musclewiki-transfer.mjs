import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const port = Number.parseInt(process.argv[2] || "34873", 10);
const outputPath = path.resolve(projectRoot, process.argv[3] || "scripts/migration/data/musclewiki-barbell-transfer.json");

const html = `<!doctype html>
<html><body>
  <form method="post" action="/upload">
    <textarea name="payload" id="payload" rows="20" cols="120"></textarea>
    <button type="submit">Import</button>
  </form>
</body></html>`;

const server = http.createServer((request, response) => {
  if (request.method === "GET") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(html);
    return;
  }

  if (request.method !== "POST" || request.url !== "/upload") {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const chunks = [];
  let size = 0;
  request.on("data", (chunk) => {
    size += chunk.length;
    if (size > 8 * 1024 * 1024) {
      response.writeHead(413);
      response.end("Payload too large");
      request.destroy();
      return;
    }
    chunks.push(chunk);
  });
  request.on("end", () => {
    try {
      const body = Buffer.concat(chunks).toString("utf8");
      const payload = new URLSearchParams(body).get("payload") || "";
      JSON.parse(payload);
      fs.writeFileSync(outputPath, `${payload}\n`, "utf8");
      response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      response.end(`received ${payload.length}`);
      console.log(JSON.stringify({ outputPath, bytes: Buffer.byteLength(payload) }));
    } catch (error) {
      response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      response.end(String(error));
    }
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`MuscleWiki transfer server listening on http://127.0.0.1:${port}`);
});
