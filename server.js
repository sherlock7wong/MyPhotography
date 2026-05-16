const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "content.json");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const PORT = Number(process.env.PORT || 8080);
const USERNAME = process.env.ADMIN_USER || "admin";
const PASSWORD = process.env.ADMIN_PASSWORD || "";
const sessions = new Set();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": typeof body === "object" && !Buffer.isBuffer(body) ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
    ...headers
  });
  res.end(payload);
}

function json(res, status, body, headers = {}) {
  send(res, status, body, { "Content-Type": "application/json; charset=utf-8", ...headers });
}

function getCookie(req, name) {
  const cookies = req.headers.cookie || "";
  return cookies
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function isAuthed(req) {
  const sid = getCookie(req, "sid");
  return Boolean(sid && sessions.has(sid));
}

async function readRequestJson(req, limit = 14 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      throw new Error("请求内容过大。");
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

async function ensureDataFile() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ home: [], pages: {} }, null, 2), "utf8");
  }
}

async function serveStatic(req, res, pathname) {
  let filePath = decodeURIComponent(pathname);
  if (filePath === "/") filePath = "/index.html";
  if (filePath.endsWith("/")) filePath += "index.html";
  if (
    filePath === "/server.js" ||
    filePath === "/package.json" ||
    filePath.startsWith("/data/") ||
    filePath.startsWith("/.git/") ||
    filePath.startsWith("/node_modules/")
  ) {
    send(res, 404, "未找到。");
    return;
  }

  const resolved = path.normalize(path.join(ROOT, filePath));
  if (!resolved.startsWith(ROOT)) {
    send(res, 403, "禁止访问。");
    return;
  }

  try {
    const data = await fs.readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  } catch {
    send(res, 404, "未找到。");
  }
}

async function handleApi(req, res, pathname) {
  if (req.method === "POST" && pathname === "/api/login") {
    const body = await readRequestJson(req, 1024 * 1024);
    if (!PASSWORD) {
      json(res, 503, { ok: false, error: "Set ADMIN_PASSWORD before using the local admin backend." });
      return;
    }
    if (body.username === USERNAME && body.password === PASSWORD) {
      const sid = crypto.randomBytes(32).toString("hex");
      sessions.add(sid);
      json(res, 200, { ok: true }, {
        "Set-Cookie": `sid=${sid}; HttpOnly; SameSite=Lax; Path=/`
      });
      return;
    }
    json(res, 401, { ok: false, error: "用户名或密码错误。" });
    return;
  }

  if (req.method === "POST" && pathname === "/api/logout") {
    const sid = getCookie(req, "sid");
    if (sid) sessions.delete(sid);
    json(res, 200, { ok: true }, {
      "Set-Cookie": "sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/session") {
    json(res, 200, { authenticated: isAuthed(req) });
    return;
  }

  if (req.method === "GET" && pathname === "/api/content") {
    const content = await fs.readFile(DATA_FILE, "utf8");
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(content);
    return;
  }

  if (req.method === "PUT" && pathname === "/api/content") {
    if (!isAuthed(req)) {
      json(res, 401, { error: "未登录或登录已失效。" });
      return;
    }
    const body = await readRequestJson(req);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      json(res, 400, { error: "内容格式无效。" });
      return;
    }
    const next = JSON.stringify(body, null, 2);
    const tmp = `${DATA_FILE}.tmp`;
    await fs.writeFile(tmp, next, "utf8");
    await fs.rename(tmp, DATA_FILE);
    json(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && pathname === "/api/upload") {
    if (!isAuthed(req)) {
      json(res, 401, { error: "未登录或登录已失效。" });
      return;
    }
    const body = await readRequestJson(req);
    const match = String(body.data || "").match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      json(res, 400, { error: "只支持 PNG、JPG、WEBP 和 GIF 图片。" });
      return;
    }
    const mime = match[1];
    const ext = mime === "image/jpeg" ? ".jpg" : `.${mime.split("/")[1]}`;
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 10 * 1024 * 1024) {
      json(res, 400, { error: "图片大小不能超过 10MB。" });
      return;
    }
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
    json(res, 200, { url: `/uploads/${filename}` });
    return;
  }

  json(res, 404, { error: "接口不存在。" });
}

async function main() {
  await ensureDataFile();
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url.pathname);
        return;
      }
      await serveStatic(req, res, url.pathname);
    } catch (error) {
      json(res, 500, { error: error.message || "服务器错误。" });
    }
  });

  server.listen(PORT, () => {
    console.log(`SherlockWonG site running at http://localhost:${PORT}/`);
    console.log(`Admin panel: http://localhost:${PORT}/admin/`);
  });
}

main();
