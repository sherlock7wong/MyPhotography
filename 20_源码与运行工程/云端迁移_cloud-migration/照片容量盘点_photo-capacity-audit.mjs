import { lstat, readdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const jpegExtensions = new Set([".jpg", ".jpeg", ".jpe"]);
const decimalGB = 1_000_000_000;
const displayBytesPerPhoto = 900_000;

function isFullyQualified(value) {
  if (!value || !path.isAbsolute(value)) return false;
  if (process.platform !== "win32") return true;
  const normalized = path.normalize(value);
  return normalized[1] === ":" || normalized.startsWith("\\\\");
}

export async function collectPhotoStats(source) {
  if (!isFullyQualified(source)) throw new Error("请提供下载完成后的原图文件夹完整绝对路径（Windows须含盘符或UNC共享名）。");
  const root = await realpath(source);
  if (!(await lstat(root)).isDirectory()) throw new Error("原图路径必须是文件夹。");
  const files = [];
  const skippedLinks = [];
  const errors = [];
  const stack = [root];
  let ignoredFiles = 0;
  while (stack.length) {
    const directory = stack.pop();
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      errors.push({ path: path.relative(root, directory), code: error.code || "READ_ERROR" });
      continue;
    }
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      try {
        const info = await lstat(absolute);
        if (info.isSymbolicLink()) { skippedLinks.push(relative); continue; }
        if (info.isDirectory()) { stack.push(absolute); continue; }
        if (!info.isFile() || !jpegExtensions.has(path.extname(entry.name).toLowerCase())) { ignoredFiles++; continue; }
        files.push({ path: relative, bytes: info.size, modifiedAt: info.mtime.toISOString() });
      } catch (error) {
        errors.push({ path: relative, code: error.code || "STAT_ERROR" });
      }
    }
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  const originalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const largest = files.reduce((best, file) => !best || file.bytes > best.bytes ? file : best, null);
  return {
    generatedAt: new Date().toISOString(),
    source: root,
    complete: errors.length === 0,
    format: "jpeg-metadata-only-v1",
    photoCount: files.length,
    originalBytes,
    largestFile: largest,
    filesAboveCurrent8MBUpload: files.filter(file => file.bytes > 8_000_000).length,
    filesAbove50MB: files.filter(file => file.bytes > 50_000_000).length,
    estimatedDerivativeBytes: files.length * displayBytesPerPhoto,
    estimatedCombinedBytes: originalBytes + files.length * displayBytesPerPhoto,
    estimateAssumption: "每张展示图加缩略图合计900,000字节；未测真实导出图，不含已有云端用量和额外备份。",
    ignoredFiles,
    skippedLinks,
    errors,
    files
  };
}

export function assessCapacity(stats, capacityGB = 10, reserveGB = 1) {
  if (!Number.isFinite(capacityGB) || capacityGB <= 0 || !Number.isFinite(reserveGB) || reserveGB < 0 || reserveGB >= capacityGB) {
    throw new Error("容量必须为正数，预留量必须大于等于0且小于总容量（十进制GB）。");
  }
  const usableBytes = Math.floor((capacityGB - reserveGB) * decimalGB);
  return {
    capacityGB, reserveGB, usableBytes,
    estimatedFits: stats.complete && stats.photoCount > 0 && stats.estimatedCombinedBytes <= usableBytes,
    emptyCloudAccountAssumed: true,
    note: "仅为空间测算；不代表账号免费资格、超额保护、大陆访问、原图权限或实际上传已经验收。"
  };
}

function parseArguments(args) {
  const options = {};
  const allowed = new Set(["--source", "--output", "--capacity-gb", "--reserve-gb"]);
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    if (!allowed.has(key) || args[index + 1] === undefined || args[index + 1].startsWith("--") || key in options) {
      throw new Error("参数格式：--source 绝对目录 [--output 独立报告路径] [--capacity-gb 10] [--reserve-gb 1]");
    }
    options[key] = args[index + 1];
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const stats = await collectPhotoStats(options["--source"]);
  const assessment = assessCapacity(stats, Number(options["--capacity-gb"] ?? 10), Number(options["--reserve-gb"] ?? 1));
  if (options["--output"]) {
    const destination = options["--output"];
    if (!isFullyQualified(destination)) throw new Error("报告路径必须是完整绝对路径（Windows须含盘符或UNC共享名）。");
    const parent = await realpath(path.dirname(destination));
    const output = path.join(parent, path.basename(destination));
    const relative = path.relative(stats.source, output);
    if (!relative || (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative))) {
      throw new Error("报告必须位于原图文件夹以外，避免修改原图目录。");
    }
    await writeFile(output, JSON.stringify({ ...stats, assessment }, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
  }
  process.stdout.write(JSON.stringify({
    complete: stats.complete,
    photoCount: stats.photoCount,
    originalBytes: stats.originalBytes,
    largestFileBytes: stats.largestFile?.bytes ?? 0,
    estimatedCombinedBytes: stats.estimatedCombinedBytes,
    filesAboveCurrent8MBUpload: stats.filesAboveCurrent8MBUpload,
    filesAbove50MB: stats.filesAbove50MB,
    skippedLinkCount: stats.skippedLinks.length,
    errorCount: stats.errors.length,
    assessment
  }, null, 2) + "\n");
  if (!stats.complete) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
