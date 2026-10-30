const html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>云端连通验证</title><link rel="stylesheet" href="/style.css"></head><body><main><p>非隐私测试内容 · CLOUD PREFLIGHT</p><h1>云端连通验证</h1><p>此页面用于验证域名、HTTPS、资源加载和数据库读回，不包含真实照片或网站资料。</p><img src="/sample.svg" width="320" height="180" alt="自动生成的测试图形"><nav><a href="/api/health">检查 HTTPS 接口</a><a href="/api/persistence">检查数据库读回</a></nav><p>这是验证站，正式网站尚未迁移。</p></main></body></html>';
const css = 'body{margin:0;padding:40px 20px;background:#f4f2eb;color:#33372f;font:16px/1.7 system-ui,sans-serif}main{max-width:680px;margin:auto}h1{font-size:32px}img{max-width:100%;height:auto;border:1px solid #92947a}nav{display:flex;gap:20px;flex-wrap:wrap;margin:24px 0}a{color:#465036}';
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="#e5e0ce"/><circle cx="160" cy="90" r="52" fill="#747b56"/><path d="M0 150 L100 80 L210 180 Z" fill="#424b38"/></svg>';
const baseHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
};
function respond(request, body, contentType, status = 200, extraHeaders = {}) {
  return new Response(request.method === "HEAD" ? null : body, {
    status, headers: { ...baseHeaders, "Content-Type": contentType, ...extraHeaders }
  });
}
function json(request, value, status = 200, extraHeaders = {}) {
  return respond(request, JSON.stringify(value), "application/json; charset=utf-8", status, extraHeaders);
}
export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json(request, { ok: false, error: "method-not-allowed" }, 405, { Allow: "GET, HEAD" });
    }
    const pathname = new URL(request.url).pathname;
    if (pathname === "/") return respond(request, html, "text/html; charset=utf-8");
    if (pathname === "/style.css") return respond(request, css, "text/css; charset=utf-8");
    if (pathname === "/sample.svg") return respond(request, svg, "image/svg+xml");
    if (pathname === "/api/health") return json(request, { ok: true, mode: "nonprivate-preflight" });
    if (pathname === "/api/persistence") {
      if (!env.DB) return json(request, { ok: false, error: "database-unbound" }, 503);
      try {
        const row = await env.DB.prepare("SELECT marker, created_at FROM cloud_preflight_marker WHERE id = 1").first();
        if (!row || typeof row.marker !== "string" || typeof row.created_at !== "string") {
          return json(request, { ok: false, error: "database-not-initialized" }, 503);
        }
        return json(request, { ok: true, marker: row.marker, createdAt: row.created_at });
      } catch {
        console.error(JSON.stringify({ event: "preflight-database-read-failed" }));
        return json(request, { ok: false, error: "database-check-failed" }, 503);
      }
    }
    return json(request, { ok: false, error: "not-found" }, 404);
  }
};
