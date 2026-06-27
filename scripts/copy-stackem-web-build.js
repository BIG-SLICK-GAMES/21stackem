const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const source = path.join(repoRoot, "apps", "games", "21-stackem", "web-build");
const target = path.join(repoRoot, "web-build");

if (!fs.existsSync(source)) {
  throw new Error(`Stack'em web build not found at ${source}`);
}

fs.rmSync(target, { force: true, recursive: true });
fs.cpSync(source, target, { recursive: true });
console.log(`Copied Stack'em web build to ${target}`);
