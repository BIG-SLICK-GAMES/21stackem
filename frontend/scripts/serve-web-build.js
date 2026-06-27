const fs = require("fs");
const http = require("http");
const path = require("path");

const port = Number(process.env.PORT || 8082);
const root = path.resolve(__dirname, "../web-build");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function resolveRequestPath(urlPath) {
  const normalized = decodeURIComponent((urlPath || "/").split("?")[0]);
  const relativePath = normalized === "/" ? "/index.html" : normalized;
  const absolutePath = path.join(root, relativePath);

  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
    return absolutePath;
  }

  const htmlPath = path.join(root, `${relativePath.replace(/\/$/, "")}.html`);
  if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    return htmlPath;
  }

  return path.join(root, "index.html");
}

http
  .createServer((req, res) => {
    const filePath = resolveRequestPath(req.url || "/");
    const ext = path.extname(filePath).toLowerCase();

    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Failed to load page.");
        return;
      }

      res.writeHead(200, {
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      res.end(content);
    });
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`Serving web-build on http://0.0.0.0:${port}`);
  });
