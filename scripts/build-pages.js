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
  "projects",
  "src",
  "uploads",
  "vendor",
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
fs.writeFileSync(
  path.join(outDir, "_headers"),
  [
    "/*",
    "  X-Content-Type-Options: nosniff",
    "",
    "/",
    "  Cache-Control: no-store",
    "",
    "/*.html",
    "  Cache-Control: no-store",
    "",
    "/vendor/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "/uploads/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    "/src/*",
    "  Cache-Control: public, max-age=3600",
    "",
    "/admin/*",
    "  Cache-Control: public, max-age=3600",
    ""
  ].join("\n"),
  "utf8"
);
