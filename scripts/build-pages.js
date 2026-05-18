const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist");

const entries = [
  "admin",
  "assets",
  "cityscape",
  "contact",
  "data",
  "landscape",
  "life",
  "portrait",
  "src",
  "uploads",
  "index.html"
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

function copyEntry(source, target) {
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const child of fs.readdirSync(source)) {
      copyEntry(path.join(source, child), path.join(target, child));
    }
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

for (const entry of entries) {
  const source = path.join(root, entry);
  if (!fs.existsSync(source)) continue;

  const target = path.join(outDir, entry);
  copyEntry(source, target);
}

fs.writeFileSync(path.join(outDir, ".nojekyll"), "", "utf8");
