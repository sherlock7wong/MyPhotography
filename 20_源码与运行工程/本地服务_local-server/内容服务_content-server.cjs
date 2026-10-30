"use strict";
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomBytes, randomUUID, createHash, timingSafeEqual } = require("node:crypto");
const { createStore, failure, isObject, MAX_DOCUMENT_BYTES } = require("./持久化存储_content-store.cjs");
const { publicProjection } = require("./公开投影_public-projection.cjs");
const { createAnalyticsStore, messageReadInput } = require("./访问统计_analytics-store.cjs");
const seo = require("../shared/seo-meta.js");

const DEFAULT_USER = "sherlockwong";
const DEFAULT_PASSWORD = "mrwong0421";
const COOKIE = "wong_local_admin_session";
const SESSION_SECONDS = 8 * 60 * 60;
const IMAGE_LIMIT = 8_000_000;
const imageTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/gif", "gif"]]);
const contentTypes = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".webp":"image/webp", ".gif":"image/gif", ".avif":"image/avif", ".ico":"image/x-icon", ".woff":"font/woff", ".woff2":"font/woff2", ".ttf":"font/ttf", ".otf":"font/otf" };
const publicRoots = new Set(["Home", "about", "Project", "photography", "CityHuman", "Contact", "admin", "shared", "AdminLogin", "backendContact", "backendMessages", "backendProject", "Image"]);
const clone = value => structuredClone(value);
const hash = value => createHash("sha256").update(value).digest("hex");
const within = (root, file) => { const relative = path.relative(root, file); return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative); };
const peerIsLocal = address => address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
function equal(left, right) { const a = Buffer.from(String(left)); const b = Buffer.from(String(right)); return a.length === b.length && timingSafeEqual(a, b); }
function send(response, status, body, type = "application/json; charset=utf-8", extra = {}) {
  response.writeHead(status, { "Content-Type":type, "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff", "Cross-Origin-Resource-Policy":"same-origin", "Vary":"Sec-Fetch-Site, Origin", ...extra });
  response.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
}
function requestPath(request) {
  const raw = String(request.url || "");
  if (!raw.startsWith("/") || raw.startsWith("//")) throw failure(400, "请求地址无效。");
  let pathname;
  try { pathname = decodeURIComponent(raw.split("?")[0]); } catch (_) { throw failure(400, "请求地址编码无效。"); }
  if (/[\\\x00-\x1f\x7f:]/.test(pathname) || pathname.split("/").some(part => part === ".." || part === "." || /[. ]$/.test(part))) throw failure(403, "此路径不允许访问。");
  return { pathname, search: raw.includes("?") ? raw.slice(raw.indexOf("?")) : "" };
}
function checkLocalRequest(request) {
  if (!peerIsLocal(request.socket.remoteAddress)) throw failure(403, "本地内容服务仅允许本机访问。");
  let host;
  try { host = new URL(`http://${request.headers.host || ""}`); } catch (_) { throw failure(403, "本地服务地址无效。"); }
  if (!["127.0.0.1", "localhost", "[::1]"].includes(host.hostname) || Number(host.port || 80) !== request.socket.localPort || host.username || host.password || host.pathname !== "/") throw failure(403, "仅允许本站本地地址访问。");
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    if (request.headers.origin !== host.origin || request.headers["sec-fetch-site"] === "cross-site") throw failure(403, "已拒绝跨站写入，请从本站页面操作。");
  }
  return host.origin;
}
function body(request, maximum) {
  if (Number(request.headers["content-length"] || 0) > maximum) { request.resume(); return Promise.reject(failure(413, "提交内容超过容量限制。")); }
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = []; let finished = false;
    const cleanup = () => { clearTimeout(timer); request.removeListener("data", data); request.removeListener("end", end); request.removeListener("error", error); request.removeListener("aborted", aborted); };
    const fail = cause => { if (finished) return; finished = true; cleanup(); request.resume(); reject(cause); };
    const data = chunk => { size += chunk.length; if (size > maximum) return fail(failure(413, "提交内容超过容量限制。")); chunks.push(chunk); };
    const end = () => { if (finished) return; finished = true; cleanup(); resolve(Buffer.concat(chunks)); };
    const error = () => fail(failure(400, "提交内容读取失败，请重试。"));
    const aborted = () => fail(failure(400, "提交已中断，请重试。"));
    const timer = setTimeout(() => fail(failure(408, "接收内容超时，请重试；已保存数据保持不变。")), 15000);
    request.on("data", data); request.once("end", end); request.once("error", error); request.once("aborted", aborted);
  });
}
async function jsonBody(request, maximum) {
  if (!(request.headers["content-type"] || "").toLowerCase().startsWith("application/json")) { request.resume(); throw failure(415, "请使用 JSON 提交内容。"); }
  const bytes = await body(request, maximum);
  try { return JSON.parse(bytes.toString("utf8")); } catch (_) { throw failure(400, "提交的 JSON 格式不正确。"); }
}
function validImage(bytes, type) {
  if (type === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === "image/gif") return ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"));
  return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}
function injectServerMode(html, rootHome) {
  let text = html.replace(/<meta\b(?=[^>]*\bname\s*=\s*["'](?:cms-mode|cms-storage)["'])[^>]*>\s*/gi, "");
  if (!/<head\b[^>]*>/i.test(text)) throw failure(503, "页面结构无法加载，请检查前台文件。");
  text = text.replace(/<head\b[^>]*>/i, '$&\n    <meta name="cms-mode" content="server">\n    <meta name="cms-storage" content="local-server">');
  if (rootHome) text = text.replace(/<base\b[^>]*>\s*/gi, "").replace(/<head\b[^>]*>/i, '$&\n    <base href="/Home/">');
  return text;
}

function createServer(options = {}) {
  const sourceDir = path.resolve(options.sourceDir || path.join(__dirname, ".."));
  const dataDir = path.resolve(options.dataDir || path.join(sourceDir, ".local-db"));
  const seed = options.seed === undefined ? () => clone(require(path.join(sourceDir, "shared", "site-content.js"))) : options.seed;
  const store = createStore({ dataDir, seed });
  const analytics = createAnalyticsStore({ dataDir, clock:options.analyticsClock });
  const username = options.username ?? process.env.WONG_ADMIN_USER ?? process.env.WONG_ADMIN_USERNAME ?? DEFAULT_USER;
  const password = options.password ?? process.env.WONG_ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
  const sessions = new Map(); const attempts = new Map();
  function authenticated(request) {
    const token = String(request.headers.cookie || "").split(";").map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || "";
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
    const key = hash(token); const expires = sessions.get(key);
    if (!expires || expires <= Date.now()) { sessions.delete(key); return false; }
    return key;
  }
  async function staticFile(request, response, pathname, search) {
    if (!["GET", "HEAD"].includes(request.method)) throw failure(405, "此页面不接受写入请求。");
    if (/^\/cityhuman(?:\/index\.html)?\/?$/i.test(pathname)) return send(response, 302, "", "text/plain; charset=utf-8", { Location:"/photography/index.html?category=city-humanity", "Cache-Control":"no-store" });
    if (/^\/adminlogin(?:\/index\.html)?\/?$/i.test(pathname)) return send(response, 302, "", "text/plain; charset=utf-8", { Location:`/admin/index.html${search}` });
    const rootHome = pathname === "/";
    const segments = (rootHome ? "/Home/index.html" : pathname).split("/").filter(Boolean);
    if (!publicRoots.has(segments[0]) || segments.some(part => part.startsWith(".") || /^(?:tests?|测试(?:_|$)|__tests__|node_modules|docs?|documents?|文档(?:_|$)|40_|90_|99_)/i.test(part))) throw failure(403, "此路径不属于网站公开内容。");
    if (segments[0] === "Image" && segments.slice(1).join("/") !== "contact.png") throw failure(403, "此素材不属于网站公开内容。");
    if (segments[0] === "AdminLogin" && segments[1] !== "assets") throw failure(403, "此路径不属于网站公开内容。");
    const root = path.join(sourceDir, segments[0]);
    let filename = path.resolve(sourceDir, ...segments);
    if (!within(root, filename)) throw failure(403, "此路径不允许访问。");
    let info;
    try { info = await fs.stat(filename); } catch (error) { if (error.code === "ENOENT" || error.code === "ENOTDIR") throw failure(404, "页面或素材不存在。"); throw error; }
    if (info.isDirectory()) {
      if (!pathname.endsWith("/")) return send(response, 302, "", "text/plain; charset=utf-8", { Location:`${pathname}/${search}` });
      filename = path.join(filename, "index.html");
    }
    const extension = path.extname(filename).toLowerCase();
    if (!contentTypes[extension]) throw failure(403, "此文件类型不允许公开访问。");
    const [realSource, realRoot, realFile] = await Promise.all([fs.realpath(sourceDir), fs.realpath(root), fs.realpath(filename)]);
    if (realRoot === realSource || !within(realSource, realRoot) || !within(realRoot, realFile)) throw failure(403, "此路径不允许访问。");
    const bytes = await fs.readFile(realFile);
    const headers = pathname.startsWith("/admin") ? { "X-Frame-Options":"DENY" } : {};
    if (request.method === "HEAD") return send(response, 200, "", contentTypes[extension], headers);
    let output = bytes;
    if (extension === ".html") {
      output = injectServerMode(bytes.toString("utf8"), rootHome);
      const route = seo.routePage(pathname, search);
      if (route) {
        const { state } = await store.read();
        output = seo.injectHtml(output, seo.resolve(publicProjection(state), route.page, { baseUrl:new URL(pathname + search, "http://" + request.headers.host).href, categoryId:route.categoryId, fallback:seo.readHtmlMetadata(output) }));
      }
    }
    return send(response, 200, output, contentTypes[extension], headers);
  }
  const server = http.createServer(async (request, response) => {
    try {
      const origin = checkLocalRequest(request);
      const { pathname, search } = requestPath(request);
      const fetchSite = request.headers["sec-fetch-site"];
      if (pathname.startsWith("/api/") && ((fetchSite && !["same-origin", "none"].includes(fetchSite)) || (request.headers.origin && request.headers.origin !== origin))) throw failure(403, "已拒绝跨站读取网站内容，请从本站页面访问。");
      const method = request.method;
      if (pathname === "/api/analytics/pageview" && method === "POST") return send(response, 200, await analytics.pageview(await jsonBody(request, 2048)));
      if (pathname === "/api/cms-status" && method === "GET") { const { version } = await store.read(); return send(response, 200, { storage:"local-server", version }); }
      if (pathname === "/api/public-version" && method === "GET") { const { version } = await store.read(); return send(response, 200, { version }); }
      if (pathname === "/api/public-state.js" && method === "GET") {
        const { state, version } = await store.read(); const visible = publicProjection(state);
        return send(response, 200, `window.__CMS_PUBLIC_VERSION__ = ${version}; window.__CMS_PUBLIC_STATE__ = ${JSON.stringify(visible).replace(/</g, "\\u003c")};`, "text/javascript; charset=utf-8");
      }
      if (pathname === "/api/admin/login" && method === "POST") {
        const input = await jsonBody(request, 8192);
        const account = String(input?.username || "").trim(); const secret = String(input?.password || "");
        const key = hash(`${request.socket.remoteAddress}|${account.toLowerCase()}`); const now = Date.now(); const previous = attempts.get(key);
        if (previous?.count >= 5 && now - previous.at < 900000) throw failure(429, "登录尝试过多，请稍后重试。");
        if (!account || account.length > 100 || !secret || secret.length > 200 || !equal(account, username) || !equal(secret, password)) {
          const count = previous && now - previous.at < 900000 ? previous.count + 1 : 1;
          if (attempts.size > 1000) attempts.clear(); attempts.set(key, { count, at: previous && now - previous.at < 900000 ? previous.at : now });
          throw failure(401, "用户名或密码不正确。");
        }
        attempts.delete(key); for (const [id, expires] of sessions) if (expires <= now) sessions.delete(id);
        const token = randomBytes(32).toString("base64url"); sessions.set(hash(token), now + SESSION_SECONDS * 1000);
        return send(response, 200, { authenticated:true }, undefined, { "Set-Cookie":`${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}` });
      }
      if (pathname.startsWith("/api/admin/")) {
        const session = authenticated(request);
        if (!session) throw failure(401, "请先登录本地内容管理服务。");
        if (pathname === "/api/admin/session" && method === "GET") return send(response, 200, { authenticated:true });
        if (pathname === "/api/admin/logout" && method === "POST") { sessions.delete(session); return send(response, 200, { authenticated:false }, undefined, { "Set-Cookie":`${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` }); }
        if (pathname === "/api/admin/analytics" && method === "GET") return send(response, 200, await analytics.read());
        if (pathname === "/api/admin/analytics/message-read" && method === "POST") {
          const input = await jsonBody(request, 2048); messageReadInput(input);
          const { state } = await store.read();
          if (!(state.messages || []).some(message => String(message.id) === input.messageId)) throw failure(404, "此留言不存在，未记录阅读次数。");
          return send(response, 200, await analytics.messageRead(input));
        }
        if (pathname === "/api/admin/state" && method === "GET") return send(response, 200, await store.read());
        if (pathname.startsWith("/api/admin/messages/") && method === "DELETE") {
          // requestPath has already decoded the pathname once; preserve literal percent signs in legacy IDs.
          const id = pathname.slice("/api/admin/messages/".length);
          const input = await jsonBody(request, 2048);
          return send(response, 200, await store.deleteMessage(id, input?.version));
        }
        if (pathname === "/api/admin/state" && method === "PUT") {
          const input = await jsonBody(request, MAX_DOCUMENT_BYTES);
          if (!isObject(input?.state) || !Number.isSafeInteger(input.version) || input.version < 0) throw failure(400, "内容与版本格式不正确。");
          return send(response, 200, await store.save(input.state, input.version));
        }
        if (pathname === "/api/admin/upload" && method === "POST") {
          const type = String(request.headers["content-type"] || "").split(";")[0].toLowerCase();
          const extension = imageTypes.get(type); if (!extension) { request.resume(); throw failure(415, "请选择 JPEG、PNG、WebP 或 GIF 图片。"); }
          const bytes = await body(request, IMAGE_LIMIT);
          if (!bytes.length || !validImage(bytes, type)) throw failure(415, "图片内容与类型不符，请重新选择有效图片。");
          const mediaDir = path.join(dataDir, "media"); await fs.mkdir(mediaDir, { recursive:true, mode:0o700 }); const name = `${randomUUID()}.${extension}`;
          await fs.writeFile(path.join(mediaDir, name), bytes, { flag:"wx", mode:0o600 });
          return send(response, 201, { url:`/media/${name}` });
        }
        throw failure(404, "管理接口不存在。");
      }
      if (pathname === "/api/contact" && method === "POST") {
        const input = await jsonBody(request, 20000);
        const name = String(input?.name || "").trim(); const email = String(input?.email || "").trim(); const message = String(input?.message || "").trim(); const projectType = String(input?.projectType || "other").trim();
        if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || message.length < 12 || message.length > 5000 || projectType.length > 100) throw failure(400, "请检查姓名、邮箱与留言字数；留言须为 12 至 5000 字符。");
        const now = new Date().toISOString(); const record = { id:randomUUID(), name, email, message, projectType, status:"unread", createdAt:now, submittedAt:now, userAgent:String(request.headers["user-agent"] || "").slice(0,300), internalNotes:"" };
        await store.addMessage(record); return send(response, 201, { received:true, id:record.id });
      }
      if (pathname.startsWith("/api/")) throw failure(404, "接口不存在。");
      if (pathname.startsWith("/media/")) {
        if (!["GET", "HEAD"].includes(method)) throw failure(405, "图片不接受此请求。");
        const name = pathname.slice(7); if (!/^[0-9a-f-]{36}\.(?:jpg|png|webp|gif)$/.test(name)) throw failure(404, "图片不存在。");
        let bytes; try { bytes = await fs.readFile(path.join(dataDir, "media", name)); } catch (error) { if (error.code === "ENOENT") throw failure(404, "图片不存在。"); throw error; }
        return send(response, 200, method === "HEAD" ? "" : bytes, contentTypes[path.extname(name)], { "Cache-Control":"public, max-age=31536000, immutable" });
      }
      await staticFile(request, response, pathname, search);
    } catch (error) {
      if (response.headersSent || response.destroyed) return;
      const status = Number.isInteger(error.status) ? error.status : 503;
      const statistics = String(request.url || "").startsWith("/api/admin/analytics") || String(request.url || "").startsWith("/api/analytics/");
      send(response, status, { ...(statistics ? { available:false } : {}), error:error.status ? error.message : "本地文件暂时无法读取或保存，请检查目录权限和可用空间；请保留草稿后重试。" });
    }
  });
  server.requestTimeout = 30000; server.headersTimeout = 15000; server.keepAliveTimeout = 5000;
  return server;
}

module.exports = { createServer, publicProjection };
