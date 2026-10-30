import basePreflight from "./云端连通预检_cloud-connectivity-preflight.mjs";

const maxSampleBytes = 65_536;
const originalAuthContext = "wong-original-probe-v1";
const homeAddition = '<section><h2>云端私有存储样本验证</h2><p>下图为程序生成的PNG展示样本，不是真实摄影照片。原图角色样本只用于验证权限；正式网站和真实原图尚未迁移。</p><img src="/storage-display.png" width="256" height="192" alt="从云端私有桶读回的生成PNG展示样本"><p><a href="/api/storage-original-sample">检查原图样本保护（未授权应返回401）</a></p><p>本次云端下载使用短期授权，过期后样本可能暂时无法读取。</p></section>';

const failureStages = Object.freeze(["configuration", "upstream-fetch", "upstream-status", "declared-length", "body-length", "hash-mismatch", "timeout", "runtime"]);
class SampleFailure extends Error {
  constructor(stage, upstreamStatus) {
    super("storage-sample-unavailable");
    this.stage = failureStages.includes(stage) ? stage : "runtime";
    this.upstreamStatus = Number.isInteger(upstreamStatus) && upstreamStatus >= 100 && upstreamStatus <= 599 ? upstreamStatus : undefined;
  }
}
function unavailable(stage = "runtime", upstreamStatus) { throw new SampleFailure(stage, upstreamStatus); }
function reply(request, body, status, contentType, extra = {}) {
  return new Response(request.method === "HEAD" ? null : body, { status, headers: {
    "Content-Type": contentType, "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow",
    "Referrer-Policy": "no-referrer", ...extra } });
}
function json(request, error, status, extra = {}) {
  return reply(request, JSON.stringify({ ok: false, error }), status, "application/json; charset=utf-8", extra);
}
function base64url32(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value)) return null;
  try {
    const decoded = atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=");
    if (decoded.length !== 32) return null;
    return Uint8Array.from(decoded, char => char.charCodeAt(0));
  } catch { return null; }
}
async function isAuthorizedOriginal(request, env, cryptoImpl) {
  const header = request.headers.get("Authorization");
  if (typeof header !== "string" || !/^Bearer [A-Za-z0-9_-]{43}$/.test(header)) return false;
  const keyBytes = base64url32(env.PREFLIGHT_AUTH_KEY), signature = base64url32(header.slice(7));
  if (!keyBytes || !signature) return false;
  try {
    const key = await cryptoImpl.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    return await cryptoImpl.subtle.verify("HMAC", key, signature, new TextEncoder().encode(originalAuthContext));
  } catch { return false; }
}
function sampleConfiguration(env, role) {
  if (typeof env.B2_DOWNLOAD_BASE !== "string" || !/^https:\/\/f\d+\.backblazeb2\.com\/?$/.test(env.B2_DOWNLOAD_BASE) ||
      typeof env.B2_BUCKET_NAME !== "string" || !/^[A-Za-z0-9][A-Za-z0-9-]{4,61}[A-Za-z0-9]$/.test(env.B2_BUCKET_NAME)) unavailable("configuration");
  const prefix = role === "original" ? "B2_ORIGINAL" : "B2_DISPLAY";
  const name = env[`${prefix}_FILE_NAME`], hash = env[`${prefix}_SHA256`], rawBytes = env[`${prefix}_BYTES`];
  const folder = role === "original" ? "originals" : "display";
  const pattern = new RegExp(`^preflight/${folder}/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}/generated\\.png$`);
  if (typeof name !== "string" || !pattern.test(name) || typeof hash !== "string" || !/^[a-f0-9]{64}$/i.test(hash) ||
      !((typeof rawBytes === "string" && /^[1-9]\d{0,4}$/.test(rawBytes)) || (typeof rawBytes === "number" && Number.isInteger(rawBytes)))) unavailable("configuration");
  const bytes = Number(rawBytes), token = env[`${prefix}_DOWNLOAD_TOKEN`];
  if (bytes <= 0 || bytes > maxSampleBytes || typeof token !== "string" || !/^[\x21-\x7e]{8,4096}$/.test(token)) unavailable("configuration");
  const base = new URL(env.B2_DOWNLOAD_BASE);
  const url = new URL(`/file/${env.B2_BUCKET_NAME}/${name.split("/").map(encodeURIComponent).join("/")}`, base);
  return { url, token, bytes, sha256: hash.toLowerCase() };
}
async function cancelBody(response) {
  if (response.body) await response.body.cancel();
}
async function readSmallBody(response, expectedBytes) {
  const declared = response.headers.get("Content-Length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) !== expectedBytes)) {
    await cancelBody(response).catch(() => {}); unavailable("declared-length");
  }
  if (!response.body) unavailable("body-length");
  const reader = response.body.getReader(), result = new Uint8Array(expectedBytes);
  let offset = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (offset + chunk.value.byteLength > expectedBytes || offset + chunk.value.byteLength > maxSampleBytes) {
        await reader.cancel().catch(() => {}); unavailable("body-length");
      }
      result.set(chunk.value, offset); offset += chunk.value.byteLength;
    }
  } finally { reader.releaseLock(); }
  if (offset !== expectedBytes) unavailable("body-length");
  return result;
}
async function fetchVerifiedSample(configuration, { fetchImpl, cryptoImpl, timeoutMs }) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new SampleFailure("timeout")); }, timeoutMs);
  });
  try {
    return await Promise.race([timeout, (async () => {
      let upstream;
      try {
        upstream = await fetchImpl(configuration.url.href, { method: "GET", redirect: "manual", signal: controller.signal,
          headers: { Authorization: configuration.token, "Accept-Encoding": "identity" } });
      } catch { unavailable(controller.signal.aborted ? "timeout" : "upstream-fetch"); }
      if (upstream.status !== 200) { await cancelBody(upstream).catch(() => {}); unavailable("upstream-status", upstream.status); }
      const bytes = await readSmallBody(upstream, configuration.bytes);
      const digest = new Uint8Array(await cryptoImpl.subtle.digest("SHA-256", bytes));
      const hex = Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("");
      if (hex !== configuration.sha256) unavailable("hash-mismatch");
      return bytes;
    })()]);
  } finally { clearTimeout(timer); controller.abort(); }
}

// Immutable options may be injected for mocks; all env, auth and response data stay inside each request.
// This proxy can only download two generated PNG objects. It has no B2 account, upload or delete API.
export function createSampleProxy({ fetchImpl = globalThis.fetch, cryptoImpl = globalThis.crypto, timeoutMs = 8_000 } = {}) {
  return {
    async fetch(request, env = {}, ctx) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return json(request, "method-not-allowed", 405, { Allow: "GET, HEAD" });
      }
      const url = new URL(request.url);
      const isOriginal = url.pathname === "/api/storage-original-sample";
      const isDisplay = url.pathname === "/storage-display.png";
      try {
        if (isOriginal || isDisplay) {
          if (isOriginal && !await isAuthorizedOriginal(request, env, cryptoImpl)) {
            return json(request, "authentication-required", 401, { "Cache-Control": "private, no-store", "WWW-Authenticate": 'Bearer realm="cloud-preflight"' });
          }
          if (url.search || typeof fetchImpl !== "function" || !Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) unavailable("configuration");
          const configuration = sampleConfiguration(env, isOriginal ? "original" : "display");
          const bytes = await fetchVerifiedSample(configuration, { fetchImpl, cryptoImpl, timeoutMs });
          const headers = { "Content-Length": String(bytes.byteLength), "Cache-Control": isOriginal ? "private, no-store" : "no-store" };
          if (isOriginal) { headers["Content-Disposition"] = 'attachment; filename="generated-original-probe.png"'; headers.Vary = "Authorization"; }
          return reply(request, bytes, 200, "image/png", headers);
        }
        const base = await basePreflight.fetch(request, env, ctx);
        if (url.pathname !== "/" || request.method === "HEAD" || !base.ok) return base;
        // The imported base returns a fixed, small local HTML template, never an upstream document.
        const html = await base.text();
        if (!html.includes("</main>")) unavailable();
        const headers = new Headers(base.headers); headers.delete("Content-Length");
        return new Response(html.replace("</main>", homeAddition + "</main>"), { status: base.status, headers });
      } catch (error) {
        const stage = error instanceof SampleFailure && failureStages.includes(error.stage) ? error.stage : "runtime";
        const headers = { "X-Preflight-Failure": stage, ...(isOriginal ? { "Cache-Control": "private, no-store" } : {}) };
        if (stage === "upstream-status" && Number.isInteger(error.upstreamStatus)) headers["X-Preflight-Upstream-Status"] = String(error.upstreamStatus);
        return json(request, "storage-sample-unavailable", 503, headers);
      }
    }
  };
}

export default createSampleProxy();
