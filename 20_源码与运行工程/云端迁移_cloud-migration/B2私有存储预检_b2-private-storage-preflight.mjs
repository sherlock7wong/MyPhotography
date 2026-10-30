import { createHash, randomUUID } from "node:crypto";
import { lstat, open, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { deflateSync } from "node:zlib";

const authorizeUrl = "https://api.backblazeb2.com/b2api/v4/b2_authorize_account";
const sampleLimitBytes = 65_536;
const jsonLimitBytes = 262_144;
const messages = {
  ARGUMENTS: "参数格式：--credentials 本地私有JSON绝对路径 --report 新报告绝对路径 [--exercise --caps 本地费用核验JSON绝对路径]",
  LOCAL_PATH: "只接受带盘符的本地绝对路径或本机POSIX绝对路径；不接受UNC、网址或设备路径。",
  LOCAL_JSON: "私有JSON必须是小于16KB的普通文件，且内容及字段格式有效。",
  CREDENTIALS: "连接配置须包含有效的applicationKeyId、applicationKey及bucketName，不接受明文命令行密钥。",
  CAPS: "样本写入需要24小时内人工审阅、同桶、零美元存储及下载上限的截图核验记录；不是API自动验收。",
  ENDPOINT: "服务端返回了不符合官方Backblaze HTTPS域名及Native路径约束的端点，已停止。",
  TIMEOUT: "请求或读取响应超时；未自动重试，上传尝试可能已在云端留下样本。",
  NETWORK: "网络请求失败或发生重定向；未自动重试，未输出远端异常内容。",
  HTTP: "Backblaze请求返回非预期HTTP状态；未输出远端响应体。",
  RESPONSE: "Backblaze响应的结构、长度或对象校验不符合预期，已停止。",
  PERMISSIONS: "应用密钥缺少所需权限、桶范围不符或文件名前缀不允许本次样本。",
  BUCKET: "未查到唯一指定桶，或该桶不是allPrivate；未写入样本。",
  SAMPLE: "生成样本的名称或总容量不符合保护约束。",
  PRIVACY: "新样本未通过匿名认证拒绝检查，已停止后续写入。",
  HASH: "认证回读的长度、SHA-1或SHA-256与生成样本不一致。",
  REPORT_EXISTS: "报告路径已存在；为避免覆盖和无报告的云操作，本次未发起请求。",
  REPORT: "无法新建或保存报告；未输出本地路径或原始异常。",
  UNEXPECTED: "预检遇到未预期错误；未输出可能含秘密的异常内容。"
};

class PreflightError extends Error {
  constructor(code) { super(messages[code] || messages.UNEXPECTED); this.code = code; }
}
function fail(code) { throw new PreflightError(code); }
function digest(algorithm, bytes) { return createHash(algorithm).update(bytes).digest("hex"); }
function object(value) { return value && typeof value === "object" && !Array.isArray(value); }
function token(value) { return typeof value === "string" && value.length >= 8 && value.length <= 4096 && !/[\x00-\x20\x7f]/.test(value); }
function identifier(value) { return typeof value === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(value); }
function bucketName(value) { return typeof value === "string" && /^[A-Za-z0-9-]{6,63}$/.test(value); }
function redact(value, secrets) {
  let serialized = JSON.stringify(value);
  for (const secret of [...secrets].filter(value => typeof value === "string" && value).sort((a, b) => b.length - a.length)) {
    serialized = serialized.split(secret).join("[REDACTED]");
  }
  return JSON.parse(serialized);
}
function validateCredentials(value) {
  if (!object(value) || Object.keys(value).some(key => !["applicationKeyId", "applicationKey", "bucketName"].includes(key)) ||
      !token(value.applicationKeyId) || !/^[A-Za-z0-9]+$/.test(value.applicationKeyId) ||
      !token(value.applicationKey) || !bucketName(value.bucketName)) fail("CREDENTIALS");
  return value;
}

export function validateCapsRecord(value, targetBucketName, now = new Date()) {
  const reviewedAt = object(value) ? Date.parse(value.reviewedAt) : NaN;
  const age = now.getTime() - reviewedAt;
  if (!object(value) || value.schemaVersion !== 1 || value.source !== "user-screenshot" ||
      value.manualReviewed !== true || value.newTestOnly !== true || value.bucketName !== targetBucketName ||
      value.storageDailyUsdCap !== 0 || value.downloadDailyUsdCap !== 0 ||
      value.storageDisplayedLimit !== "10 GB" || value.downloadDisplayedLimit !== "1 GB" ||
      value.classBCallsPerDay !== 2500 || value.classCCallsPerDay !== 2500 ||
      !["unknown", "not-attached", "attached"].includes(value.paymentMethodStatus) ||
      !Number.isFinite(age) || age < -300_000 || age > 86_400_000) fail("CAPS");
  return { source: value.source, reviewedAt: new Date(reviewedAt).toISOString(),
    paymentMethodStatus: value.paymentMethodStatus, capsNotVerifiedByApi: true,
    storageDailyUsdCap: 0, storageDisplayedLimit: "10 GB", downloadDailyUsdCap: 0,
    downloadDisplayedLimit: "1 GB", classBCallsPerDay: 2500, classCCallsPerDay: 2500 };
}

export function validateEndpoint(raw, kind) {
  let url;
  try { url = new URL(raw); } catch { fail("ENDPOINT"); }
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) fail("ENDPOINT");
  if (kind === "api" || kind === "download") {
    const validHost = kind === "api" ? /^api\d*\.backblazeb2\.com$/ : /^f\d+\.backblazeb2\.com$/;
    if (!validHost.test(url.hostname) || url.pathname !== "/" || url.search) fail("ENDPOINT");
  } else if (kind === "upload") {
    if (!/^pod-[a-z0-9-]+\.(?:backblaze|backblazeb2)\.com$/.test(url.hostname) ||
        !/^\/b2api\/v[1-4]\/b2_upload_file(?:\/[^?#]*)?$/.test(url.pathname)) fail("ENDPOINT");
  } else { fail("ENDPOINT"); }
  return url;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type, bytes) {
  const name = Buffer.from(type, "ascii"), header = Buffer.alloc(4), checksum = Buffer.alloc(4);
  header.writeUInt32BE(bytes.length); checksum.writeUInt32BE(crc32(Buffer.concat([name, bytes])));
  return Buffer.concat([header, name, bytes, checksum]);
}
function generatedPng(width, height, variant) {
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const pixels = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = y * (1 + width * 3) + 1 + x * 3;
    const color = (Math.floor(x / 8) + Math.floor(y / 8) + variant) % 3;
    pixels.set([[244, 242, 235], [116, 123, 86], [66, 75, 56]][color], offset);
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk("IHDR", header),
    pngChunk("tEXt", Buffer.from("Description\0Generated non-private storage probe; not a user photograph.")),
    pngChunk("IDAT", deflateSync(pixels)), pngChunk("IEND", Buffer.alloc(0))]);
}

export function createGeneratedSamples(runId = randomUUID()) {
  if (!/^[a-f0-9-]{36}$/.test(runId)) fail("SAMPLE");
  const samples = [
    { role: "original-probe", fileName: `preflight/originals/${runId}/generated.png`, body: generatedPng(128, 96, 0) },
    { role: "display-probe", fileName: `preflight/display/${runId}/generated.png`, body: generatedPng(64, 48, 1) }
  ].map(sample => ({ ...sample, contentType: "image/png", sha1: digest("sha1", sample.body), sha256: digest("sha256", sample.body) }));
  if (samples.reduce((sum, sample) => sum + sample.body.length, 0) >= sampleLimitBytes) fail("SAMPLE");
  return samples;
}

async function readBoundedBody(response, limit) {
  const advertised = response.headers.get("content-length");
  if (advertised !== null && (!/^\d+$/.test(advertised) || Number(advertised) > limit)) {
    if (response.body) void response.body.cancel().catch(() => {});
    fail("RESPONSE");
  }
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader(), chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { void reader.cancel().catch(() => {}); fail("RESPONSE"); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, size);
}

// This function performs no local writes. Inject fetchImpl for mock-only checks.
// Caps are an operator screenshot review; billing is not verified through an API.
export async function runB2Preflight({ credentials, exercise = false, capsRecord, fetchImpl = globalThis.fetch, timeoutMs = 10_000, now = new Date() }) {
  const secrets = new Set([credentials?.applicationKeyId, credentials?.applicationKey]);
  const report = { schemaVersion: 1, generatedAt: now.toISOString(), mode: exercise ? "exercise" : "inspect",
    status: "failed", scope: exercise ? "generated-png-native-roundtrip-only" : "private-bucket-metadata-only",
    realPhotosReadOrUploaded: false, mainlandAccessVerified: false, fullPhotoCapacityVerified: false,
    largeJpegUploadVerified: false, classDCallsPerformed: false, automaticRetries: 0, objectsDeleted: 0,
    capsReview: null, checks: {}, requests: [], samples: [] };
  try {
    validateCredentials(credentials);
    if (typeof fetchImpl !== "function" || !Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) fail("ARGUMENTS");
    if (exercise) report.capsReview = validateCapsRecord(capsRecord, credentials.bucketName, now);
    async function request(operation, url, init, responseKind = "json", limit = jsonLimitBytes) {
      const controller = new AbortController();
      let timer;
      const timedOut = new Promise((resolve, reject) => { timer = setTimeout(() => { controller.abort(); reject(new PreflightError("TIMEOUT")); }, timeoutMs); });
      try {
        return await Promise.race([timedOut, (async () => {
          let response;
          try { response = await fetchImpl(url.href, { ...init, redirect: "error", signal: controller.signal, cache: "no-store" }); }
          catch { if (controller.signal.aborted) fail("TIMEOUT"); fail("NETWORK"); }
          report.requests.push({ operation, status: response.status });
          if (responseKind === "anonymous") {
            if (response.status !== 401 && response.status !== 403) {
              if (response.body) void response.body.cancel().catch(() => {});
              return { status: response.status, code: null };
            }
            const bytes = await readBoundedBody(response, 4096);
            let denialCode = null;
            try { const value = JSON.parse(bytes.toString("utf8")); if (["unauthorized", "access_denied"].includes(value?.code)) denialCode = value.code; } catch { /* Unknown denials do not prove privacy. */ }
            return { status: response.status, code: denialCode };
          }
          if (response.status !== 200) { if (response.body) void response.body.cancel().catch(() => {}); fail("HTTP"); }
          const bytes = await readBoundedBody(response, limit);
          if (responseKind === "bytes") return { bytes, sha1: response.headers.get("x-bz-content-sha1") };
          try { return JSON.parse(bytes.toString("utf8")); } catch { fail("RESPONSE"); }
        })()]);
      } finally { clearTimeout(timer); controller.abort(); }
    }
    const basic = Buffer.from(`${credentials.applicationKeyId}:${credentials.applicationKey}`).toString("base64");
    secrets.add(basic);
    const authorization = await request("authorize-account", new URL(authorizeUrl), { method: "GET", headers: { Authorization: `Basic ${basic}` } });
    secrets.add(authorization?.authorizationToken);
    const storage = authorization?.apiInfo?.storageApi, allowed = storage?.allowed;
    if (!object(authorization) || !identifier(authorization.accountId) || !token(authorization.authorizationToken) ||
        !object(storage) || !object(allowed) || !Array.isArray(allowed.capabilities) ||
        !allowed.capabilities.every(item => typeof item === "string") ||
        !(allowed.buckets === null || (Array.isArray(allowed.buckets) && allowed.buckets.every(item => object(item) && identifier(item.id)))) ||
        !(allowed.namePrefix == null || typeof allowed.namePrefix === "string")) fail("RESPONSE");
    const api = validateEndpoint(storage.apiUrl, "api"), download = validateEndpoint(storage.downloadUrl, "download");
    const capabilities = new Set(allowed.capabilities);
    report.checks.permissions = { listBuckets: capabilities.has("listBuckets"), readFiles: capabilities.has("readFiles"), writeFiles: capabilities.has("writeFiles") };
    if (!capabilities.has("listBuckets") || !capabilities.has("readFiles") || (exercise && !capabilities.has("writeFiles"))) fail("PERMISSIONS");
    const listed = await request("read-specified-bucket", new URL("/b2api/v4/b2_list_buckets", api), { method: "POST",
      headers: { Authorization: authorization.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: authorization.accountId, bucketName: credentials.bucketName }) });
    if (!Array.isArray(listed?.buckets) || listed.buckets.length !== 1) fail("BUCKET");
    const bucket = listed.buckets[0];
    if (!object(bucket) || bucket.bucketName !== credentials.bucketName || bucket.bucketType !== "allPrivate" ||
        !identifier(bucket.bucketId) || bucket.accountId !== authorization.accountId) fail("BUCKET");
    if (Array.isArray(allowed.buckets) && !allowed.buckets.some(item => item.id === bucket.bucketId)) fail("PERMISSIONS");
    report.bucket = { bucketName: credentials.bucketName, bucketId: bucket.bucketId, bucketType: "allPrivate" };
    report.checks.specifiedPrivateBucket = true;
    report.checks.keyScope = allowed.buckets === null ? "all-buckets-key" : "bucket-restricted-key";
    if (exercise && (!Array.isArray(allowed.buckets) || allowed.buckets.length !== 1)) fail("PERMISSIONS");
    report.checks.readOtherBucketContents = false;
    if (!exercise) { report.status = "passed"; return redact(report, secrets); }
    const samples = createGeneratedSamples();
    if (!samples.every(sample => sample.fileName.startsWith(allowed.namePrefix || ""))) fail("PERMISSIONS");
    report.checks.namePrefixPermitsBothSampleRoles = true;
    report.totalGeneratedBytes = samples.reduce((sum, sample) => sum + sample.body.length, 0);
    report.sampleHardLimitBytes = sampleLimitBytes;
    report.samples = samples.map(({ role, fileName, body, sha1, sha256 }) => ({ role, fileName, bytes: body.length, sha1, sha256, uploadAttempted: false }));
    const uploadEndpoint = new URL("/b2api/v4/b2_get_upload_url", api); uploadEndpoint.searchParams.set("bucketId", bucket.bucketId);
    const upload = await request("get-upload-url", uploadEndpoint, { method: "GET", headers: { Authorization: authorization.authorizationToken } });
    secrets.add(upload?.authorizationToken);
    if (upload?.bucketId !== bucket.bucketId || !token(upload?.authorizationToken)) fail("RESPONSE");
    const uploadUrl = validateEndpoint(upload.uploadUrl, "upload");
    for (let index = 0; index < samples.length; index++) {
      const sample = samples[index], evidence = report.samples[index];
      evidence.uploadAttempted = true;
      const stored = await request("upload-generated-sample", uploadUrl, { method: "POST", headers: {
        Authorization: upload.authorizationToken, "X-Bz-File-Name": encodeURIComponent(sample.fileName),
        "Content-Type": sample.contentType, "Content-Length": String(sample.body.length), "X-Bz-Content-Sha1": sample.sha1,
        "X-Bz-Info-b2-cache-control": encodeURIComponent("private, no-store") }, body: sample.body });
      if (!identifier(stored?.fileId) || stored.bucketId !== bucket.bucketId || stored.fileName !== sample.fileName ||
          Number(stored.contentLength) !== sample.body.length || stored.contentSha1 !== sample.sha1) fail("RESPONSE");
      evidence.fileId = stored.fileId; evidence.uploadVerified = true;
      const readUrl = new URL("/b2api/v4/b2_download_file_by_id", download); readUrl.searchParams.set("fileId", stored.fileId);
      const read = await request("authenticated-sample-download", readUrl, { method: "GET", headers: { Authorization: authorization.authorizationToken } }, "bytes", sample.body.length);
      if (read.bytes.length !== sample.body.length || read.sha1 !== sample.sha1 || digest("sha256", read.bytes) !== sample.sha256) fail("HASH");
      evidence.authenticatedBytesAndHashesMatch = true;
      const anonymousUrl = new URL(`/file/${credentials.bucketName}/${sample.fileName.split("/").map(encodeURIComponent).join("/")}`, download);
      const anonymous = await request("anonymous-sample-download", anonymousUrl, { method: "GET" }, "anonymous");
      evidence.anonymousStatus = anonymous.status;
      evidence.anonymousRejected = (anonymous.status === 401 || anonymous.status === 403) && anonymous.code !== null;
      if (!evidence.anonymousRejected) fail("PRIVACY");
    }
    report.status = "passed";
    report.note = "仅验证新生成的小PNG样本；样本保留在私有桶，未删除；不代表真实照片、50MB上传或网站代理集成已验收。";
  } catch (error) {
    const code = error instanceof PreflightError ? error.code : "UNEXPECTED";
    report.error = { code, message: messages[code] || messages.UNEXPECTED };
    report.note = "未自动重试或删除对象；若发生上传尝试，请按本报告对象名核查云端状态。";
  }
  return redact(report, secrets);
}

function localAbsolute(file) {
  if (typeof file !== "string" || !path.isAbsolute(file) || /^[\\/]{2}/.test(file) || /^[a-z][a-z0-9+.-]*:\/\//i.test(file) ||
      (process.platform === "win32" && !/^[A-Za-z]:[\\/]/.test(file))) fail("LOCAL_PATH");
  return file;
}
async function loadLocalJson(file) {
  localAbsolute(file);
  try {
    const info = await lstat(file);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 16_384 || path.extname(file).toLowerCase() !== ".json") fail("LOCAL_JSON");
    return JSON.parse((await readFile(file, "utf8")).replace(/^\uFEFF/, ""));
  } catch { fail("LOCAL_JSON"); }
}
function argumentsFor(args) {
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (flag in options || !["--credentials", "--report", "--exercise", "--caps"].includes(flag)) fail("ARGUMENTS");
    if (flag === "--exercise") { options[flag] = true; continue; }
    if (!args[index + 1] || args[index + 1].startsWith("--")) fail("ARGUMENTS");
    options[flag] = args[++index];
  }
  if (!options["--credentials"] || !options["--report"] || Boolean(options["--caps"]) !== Boolean(options["--exercise"])) fail("ARGUMENTS");
  return options;
}

export async function runCli(args = process.argv.slice(2), { fetchImpl = globalThis.fetch, stdout = process.stdout, stderr = process.stderr, openReport = open } = {}) {
  let reportFile;
  try {
    if (args.length === 1 && args[0] === "--help") { stdout.write(messages.ARGUMENTS + "\n默认inspect只读取指定私有桶元数据；exercise只写入内置生成样本，不读取真实照片、不删除对象。\n"); return 0; }
    const options = argumentsFor(args), credentials = validateCredentials(await loadLocalJson(options["--credentials"]));
    const capsRecord = options["--caps"] ? await loadLocalJson(options["--caps"]) : undefined;
    if (options["--exercise"]) validateCapsRecord(capsRecord, credentials.bucketName);
    localAbsolute(options["--report"]);
    try { reportFile = await openReport(options["--report"], "wx", 0o600); }
    catch (error) { fail(error.code === "EEXIST" ? "REPORT_EXISTS" : "REPORT"); }
    const report = await runB2Preflight({ credentials, exercise: Boolean(options["--exercise"]), capsRecord, fetchImpl });
    report.reportSaved = true;
    try { await reportFile.writeFile(JSON.stringify(report, null, 2) + "\n", "utf8"); }
    catch {
      report.reportSaved = false;
      report.cloudChecksStatus = report.status;
      report.status = "failed";
      report.reportSaveError = { code: "REPORT", message: messages.REPORT };
    }
    stdout.write(JSON.stringify(report, null, 2) + "\n");
    return report.status === "passed" && report.reportSaved ? 0 : 1;
  } catch (error) {
    const code = error instanceof PreflightError ? error.code : "UNEXPECTED";
    stderr.write(JSON.stringify({ status: "failed", error: { code, message: messages[code] || messages.UNEXPECTED } }) + "\n");
    return 1;
  } finally { if (reportFile) await reportFile.close().catch(() => {}); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await runCli();
}
