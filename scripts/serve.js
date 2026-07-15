const http = require("node:http");
const { readFile, stat } = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "../src/renderer");
const port = Number(process.env.PORT) || 4173;
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

http
  .createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
      const requestedPath = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
      if (!requestedPath.startsWith(`${root}${path.sep}`)) throw new Error("Invalid path");

      const filePath = (await stat(requestedPath)).isDirectory()
        ? path.join(requestedPath, "index.html")
        : requestedPath;
      const body = await readFile(filePath);
      response.writeHead(200, {
        "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      response.end(body);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  })
  .listen(port, () => {
    console.log(`HailWatch running at http://localhost:${port}`);
  });
