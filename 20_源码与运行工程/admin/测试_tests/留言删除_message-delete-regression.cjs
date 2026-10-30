const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { pathToFileURL } = require("node:url");
const { DatabaseSync } = require("node:sqlite");
const { pbkdf2Sync } = require("node:crypto");
const { chromium } = require("playwright");
const { createServer } = require("../../本地服务_local-server/内容服务_content-server.cjs");

const source = path.resolve(__dirname, "../..");
const project = path.dirname(source);
const deployment = path.join(source, "site-deployment");
const runStamp = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(new Date()).replace(" ", "_").replace(/:/g, "");
const evidence = path.join(path.resolve(process.env.CMS_MESSAGE_EVIDENCE || path.join(project, "40_测试与验收证据/留言删除_message-deletion_2026-10-29")), "浏览器验收_browser-acceptance_" + runStamp);
const temporary = path.join(project, "99_临时文件、缓存和构建中间产物/留言删除_message-deletion_2026-10-29");
const credentials = { username: "message-delete-test", password: "isolated-generated-test-only" };
const checks = [];
const pageErrors = [];
const pass = (mode, name) => checks.push({ mode, name, passed: true });
const clone = value => structuredClone(value);
const seed = clone(require("../../shared/site-content.js"));
seed.messages = [];

async function listen(server) {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  return "http://127.0.0.1:" + server.address().port;
}

async function workerServer() {
  const { default: worker } = await import(pathToFileURL(path.join(deployment, "dist/server/index.js")).href);
  const db = new DatabaseSync(":memory:");
  for (const file of ["0000_stormy_wallow.sql", "0001_访问统计_site-analytics.sql"]) db.exec(fs.readFileSync(path.join(deployment, "drizzle", file), "utf8"));
  db.prepare("INSERT INTO cms_state (id,json,version,updated_at) VALUES (1,?,1,?)").run(JSON.stringify(seed), new Date().toISOString());
  function prepare(sql) {
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async first() { return db.prepare(sql).get(...args) || null; },
      async all() { return { success: true, results: db.prepare(sql).all(...args) }; },
      async run() { return this.execute(); },
      execute() {
        if (/^SELECT/i.test(sql.trim())) return { success: true, results: db.prepare(sql).all(...args), meta: { changes: 0 } };
        const result = db.prepare(sql).run(...args);
        return { success: true, results: [], meta: { changes: Number(result.changes) } };
      }
    };
  }
  const client = path.join(deployment, "dist/client");
  const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };
  const salt = "generated-isolated-deletion-salt";
  const env = {
    ADMIN_USER: credentials.username,
    ADMIN_PASSWORD_SALT: salt,
    ADMIN_PASSWORD_HASH: pbkdf2Sync(credentials.password, salt, 100000, 32, "sha256").toString("base64url"),
    DB: { prepare, async batch(statements) { db.exec("BEGIN IMMEDIATE"); try { const result = statements.map(statement => statement.execute()); db.exec("COMMIT"); return result; } catch (error) { db.exec("ROLLBACK"); throw error; } } },
    ASSETS: { async fetch(request) {
      let file = path.resolve(client, "." + decodeURIComponent(new URL(request.url).pathname));
      if (!file.startsWith(client + path.sep)) return new Response("Forbidden", { status: 403 });
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (!fs.existsSync(file)) return new Response("Not found", { status: 404 });
      return new Response(fs.readFileSync(file), { headers: { "Content-Type": mime[path.extname(file)] || "application/octet-stream" } });
    } }
  };
  const server = http.createServer(async (request, response) => {
    try {
      const chunks = []; for await (const chunk of request) chunks.push(chunk);
      const body = Buffer.concat(chunks);
      const result = await worker.fetch(new Request("http://" + request.headers.host + request.url, { method: request.method, headers: request.headers, ...(body.length ? { body } : {}) }), env);
      response.statusCode = result.status;
      for (const [key, value] of result.headers) if (key !== "set-cookie") response.setHeader(key, value);
      if (result.headers.getSetCookie().length) response.setHeader("Set-Cookie", result.headers.getSetCookie());
      response.end(Buffer.from(await result.arrayBuffer()));
    } catch { response.statusCode = 500; response.end("Isolated bridge failed"); }
  });
  return { server, release: () => db.close() };
}

async function verify(browser, mode, fixture) {
  const base = await listen(fixture.server);
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, reducedMotion: "reduce" });
  await context.route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on("pageerror", error => pageErrors.push({ mode, message: error.message }));
  let deleteRequests = 0;
  let abortNext = false;
  let releaseDelete;
  await page.route("**/api/admin/messages/**", async route => {
    if (route.request().method() !== "DELETE") return route.continue();
    deleteRequests++;
    if (abortNext) { abortNext = false; return route.abort("failed"); }
    if (releaseDelete) await releaseDelete.promise;
    await route.continue();
  });
  const post = async (name) => {
    const response = await context.request.post(base + "/api/contact", { headers: { Origin: base }, data: { name, email: "generated-delete@example.com", message: "Generated isolated deletion test, no real visitor data." } });
    assert.equal(response.status(), 201); return (await response.json()).id;
  };
  // Use the browser's authenticated fetch: the Worker cookie is Secure on trusted loopback,
  // whereas Playwright's separate request client applies a different HTTP cookie policy.
  const read = async () => {
    const response = await page.evaluate(async () => { const result = await fetch("/api/admin/state", { credentials: "same-origin", cache: "no-store" }); return { status: result.status, body: await result.json() }; });
    assert.equal(response.status, 200); return response.body;
  };
  try {
    const firstId = await post("生成留言 A");
    const secondId = await post("生成留言 B");
    await page.goto(base + "/admin/index.html#messages", { waitUntil: "domcontentloaded" });
    await page.locator("#loginUsername").fill(credentials.username);
    await page.locator("#loginPassword").fill(credentials.password);
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForFunction(() => document.querySelector("#adminShell")?.hidden === false);
    await page.locator('[data-view-link="messages"]').click();
    await page.locator('[data-action="delete-message"]').waitFor();
    const before = await read();
    assert.equal(before.state.messages.length, 2);
    const otherContent = clone(before.state); delete otherContent.messages;
    const deleteButton = page.locator('[data-action="delete-message"]');
    const confirmDelete = async (screenshot) => { await deleteButton.click(); await page.locator("#confirmModal").waitFor({ state: "visible" }); if (screenshot) await page.screenshot({ path: screenshot }); await page.locator("[data-confirm-ok]").click(); };

    await deleteButton.click();
    await page.locator("#confirmModal").waitFor({ state: "visible" });
    assert.ok((await page.locator("#confirmMessage").textContent()).includes(mode === "cloud" ? "云端当前数据" : "本机网站当前数据"));
    await page.screenshot({ path: path.join(evidence, mode + "_删除确认_delete-confirmation.png") });
    await page.locator("[data-confirm-cancel]").click();
    assert.equal(deleteRequests, 0);
    assert.equal((await read()).version, before.version);
    assert.equal(await deleteButton.evaluate(node => node === document.activeElement), true);
    pass(mode, "取消不发送删除请求，焦点恢复到删除按钮");

    const notes = page.locator('[data-bind^="messages."][data-bind$=".internalNotes"]');
    await notes.fill("尚未保存的生成草稿");
    await deleteButton.click();
    assert.equal(await page.locator("#confirmModal").isVisible(), false);
    assert.equal(await notes.inputValue(), "尚未保存的生成草稿");
    assert.equal(deleteRequests, 0);
    await page.locator('[data-action="reset-current"]').click(); await page.locator("[data-confirm-ok]").click();
    pass(mode, "未保存草稿阻止删除且内容保留");

    const thirdId = await post("并发新留言 C");
    await confirmDelete();
    await page.waitForFunction(() => document.querySelectorAll('[data-row-path="messages"]').length === 3 && !document.querySelector('[data-action="delete-message"]')?.disabled);
    assert.equal((await read()).state.messages.length, 3);
    pass(mode, "旧版本删除409并读取新列表，新留言和目标均保留");

    await page.locator('[data-row-path="messages"]').filter({ hasText: "生成留言 B" }).click();
    let release;
    releaseDelete = { promise: new Promise(resolve => { release = resolve; }) };
    const requestsBefore = deleteRequests;
    await confirmDelete();
    await page.waitForFunction(() => document.querySelector('[data-action="delete-message"]')?.disabled === true);
    assert.equal(await notes.isDisabled(), true);
    release(); releaseDelete = undefined;
    await page.waitForFunction(() => document.querySelectorAll('[data-row-path="messages"]').length === 2 && !document.querySelector('[data-action="delete-message"]')?.disabled);
    assert.equal(deleteRequests, requestsBefore + 1);
    const afterDelete = await read();
    assert.ok(!afterDelete.state.messages.some(message => message.id === secondId));
    assert.ok(afterDelete.state.messages.some(message => message.id === firstId));
    assert.ok(afterDelete.state.messages.some(message => message.id === thirdId));
    pass(mode, "确认后只删选中留言，处理中禁用编辑且仅一个DELETE");

    await page.locator('[data-row-path="messages"]').filter({ hasText: "生成留言 A" }).click();
    await notes.fill("删除后保存另一条留言的备注"); await page.locator('[data-action="save-current"]').click();
    await page.waitForFunction(() => !document.querySelector("#unsavedNotice") || document.querySelector("#unsavedNotice").hidden);
    assert.ok(!(await read()).state.messages.some(message => message.id === secondId));
    pass(mode, "删除后保存其他留言不会复活已删除项");

    abortNext = true;
    await confirmDelete();
    await page.waitForFunction(() => document.querySelector("#toast")?.textContent.includes("删除结果尚未确认") && !document.querySelector('[data-action="delete-message"]')?.disabled);
    assert.equal((await read()).state.messages.length, 2);
    assert.equal(await page.locator('[data-row-path="messages"]').count(), 2);
    pass(mode, "网络失败不假报成功、不先移除列表");

    await page.setViewportSize({ width: 390, height: 844 });
    await deleteButton.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(evidence, mode + "_手机收件箱_mobile-inbox.png") });
    assert.equal(await deleteButton.isVisible(), true);
    const box = await deleteButton.boundingBox(); assert.ok(box && box.x >= 0 && box.x + box.width <= 391);
    for (let remaining = 2; remaining > 0; remaining--) {
      await confirmDelete(remaining === 2 ? path.join(evidence, mode + "_手机删除确认_mobile-delete-confirmation.png") : undefined);
      await page.waitForFunction(expected => document.querySelectorAll('[data-row-path="messages"]').length === expected, remaining - 1);
    }
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelector("#viewRoot")?.textContent.includes("暂无留言"));
    assert.equal(await page.locator('[data-action="delete-message"]').count(), 0);
    const finalState = await read(); assert.deepEqual(finalState.state.messages, []);
    const finalOther = clone(finalState.state); delete finalOther.messages; assert.deepEqual(finalOther, otherContent);
    await page.screenshot({ path: path.join(evidence, mode + "_空收件箱_empty-inbox.png") });
    pass(mode, "手机按钮可用，最后一条删除后刷新仍为空，其他内容未变");
    assert.equal(await page.evaluate(async () => (await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" })).status), 200);
  } finally {
    await context.close();
    await new Promise(resolve => fixture.server.close(resolve));
    fixture.release?.();
  }
}

(async () => {
  fs.mkdirSync(evidence, { recursive: true }); fs.mkdirSync(temporary, { recursive: true });
  const dataDir = fs.mkdtempSync(path.join(temporary, "隔离留言测试_isolated-message-test_"));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CMS_TEST_BROWSER_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  let passed = false;
  let failure;
  try {
    await verify(browser, "server", { server: createServer({ sourceDir: source, dataDir, seed: clone(seed), ...credentials }) });
    await verify(browser, "cloud", await workerServer());
    assert.deepEqual(pageErrors, []); passed = true;
  } catch (error) {
    failure = error.message; throw error;
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(evidence, "留言删除浏览器验收_message-delete-browser-acceptance.json"), JSON.stringify({ passed, checks, pageErrors, failure, usesGeneratedData: true, localDataDir: dataDir, actualCloudflareProduction: false }, null, 2) + "\n", { flag: "wx" });
  }
  console.log(JSON.stringify({ passed, checks: checks.length, pageErrors: pageErrors.length, evidence }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
