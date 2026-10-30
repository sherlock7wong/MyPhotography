"use strict";
const fs = require("node:fs");
const path = require("node:path");
const archivedSource = path.join(__dirname, "20_源码与运行工程");
const sourceRoot = fs.existsSync(path.join(archivedSource, "shared", "site-content.js")) ? archivedSource : path.resolve(__dirname, "..");
const { createServer } = require(path.join(sourceRoot, "本地服务_local-server", "内容服务_content-server.cjs"));

if (require.main === module) {
  const host = "127.0.0.1";
  const port = Number(process.env.PORT || 5173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT 必须是 1 至 65535 的有效端口。");
  const server = createServer();
  server.listen(port, host, () => {
    console.log(`本地摄影网站：http://${host}:${port}/Home/index.html`);
    console.log("内容保存在本机文件；此服务仅绑定本机，不代表线上认证或发布。按 Ctrl+C 停止。");
  });
}

module.exports = { createServer };
