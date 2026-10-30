"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { createServer } = require("../../本地服务_local-server/内容服务_content-server.cjs");
const originalSeed = structuredClone(require("../../shared/site-content.js"));
const sourceDir = path.resolve(__dirname, "../..");
const root = path.resolve(sourceDir, "..");
const runName = "运行_run_" + new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date()).replace(/\D/g, "") + "_" + String(Date.now() % 1000).padStart(3, "0");
const evidence = path.join(root, "40_测试与验收证据/项目详情分页与边框_project-detail-viewer_2026-10-24", runName);
const temporary = path.join(root, "99_临时文件、缓存和构建中间产物/项目详情分页与边框_project-detail-viewer_2026-10-24");
const S = {
 card: "[data-project-card]", pagination: "[data-project-pagination]",
 page: value => '[data-project-page="' + value + '"]',
 photo: "[data-project-photo]", title: "[data-project-detail-title]",
 back: "[data-project-back]", empty: "[data-project-photos-empty]", missing: "[data-project-missing]",
 switch: "[data-project-switch]", lightbox: "[data-project-lightbox]"
};
function fixture() {
 const seed = structuredClone(originalSeed);
 const category = seed.categories.find(item => item.status === "Published" && item.visibility === "Public") || seed.categories[0];
 seed.categories = [structuredClone(category), { ...structuredClone(category), id: "test-private-category", name: "Private fixture category", visibility: "Private" }];
 seed.gallery = Array.from({ length: 11 }, (_, index) => ({
  ...structuredClone(originalSeed.gallery[index % originalSeed.gallery.length]), id: "test-photo-" + index,
  title: "Photo fixture " + index, categoryId: category.id, category: category.name, sortOrder: index + 1, status: "Published"
 }));
 seed.gallery[8].title = '<img src=x onerror="window.projectXss=true">';
 seed.gallery[9].status = "Draft";
 seed.gallery[10].categoryId = "test-private-category";
 seed.gallery[10].category = "Private fixture category";
 seed.projects = Array.from({ length: 13 }, (_, index) => ({
  ...structuredClone(originalSeed.projects[index % originalSeed.projects.length]), id: "test-project-" + index,
  title: "Project fixture " + String(index + 1).padStart(2, "0"), slug: "test-project-" + index,
  description: "Independent project description " + index, coverImage: seed.gallery[index % 9].image,
  coverAlt: "Cover fixture " + index, categoryIds: [category.id], photoIds: [seed.gallery[index % 9].id],
  isVisible: true, status: "Published", sortOrder: index + 1
 }));
 delete seed.projects[0].photoIds;
 seed.projects[1].photoIds = [];
 seed.projects[2].photoIds = ["test-photo-2", "test-photo-0", "test-photo-9", "test-photo-10", "test-missing-photo"];
 seed.projects[6].photoIds = seed.gallery.slice(0, 9).map(item => item.id);
 seed.projects[8].title = '<img src=x onerror="window.projectXss=true">';
 seed.projects.push({ ...structuredClone(seed.projects[0]), id: "test-hidden-project", title: "Hidden project fixture", sortOrder: 0, isVisible: false });
 seed.projects.push({ ...structuredClone(seed.projects[0]), id: "test-draft-project", title: "Draft project fixture", sortOrder: -1, status: "Draft" });
 return seed;
}
async function run() {
 fs.mkdirSync(temporary, { recursive: true });
 fs.mkdirSync(evidence, { recursive: true });
 const dataDir = fs.mkdtempSync(path.join(temporary, "隔离数据_test-data-"));
 const seed = fixture();
 const checks = [], pageErrors = [], failures = [];
 const server = createServer({ sourceDir, dataDir, seed, username: "project-test", password: "isolated-project-test-only" });
 await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
 const base = "http://127.0.0.1:" + server.address().port;
 const browser = await chromium.launch({ headless: true, executablePath: process.env.CMS_TEST_BROWSER_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
 let admin, front, adminContext, publicContext;
 const pass = name => checks.push({ name, passed: true });
 const detailUrl = (id, fromPage = 1) => base + "/Project/detail.html?project=" + encodeURIComponent(id) + "&fromPage=" + fromPage;
 async function check(name, action) {
  if (process.env.PROJECT_TEST_MATCH && !new RegExp(process.env.PROJECT_TEST_MATCH).test(name)) return;
  try { await action(); pass(name); console.log("PASS " + name); }
  catch (error) {
   failures.push({ name, error: error.stack || String(error) }); checks.push({ name, passed: false });
   if (front && !front.isClosed()) await front.screenshot({ path: path.join(evidence, "失败现场_failure-" + failures.length + ".png"), fullPage: true }).catch(() => {});
  }
 }
 async function state() {
  const response = await adminContext.request.get(base + "/api/admin/state"); assert.equal(response.status(), 200); return response.json();
 }
 async function replaceState(next) {
  const previous = await state();
  const response = await adminContext.request.put(base + "/api/admin/state", { headers: { Origin: base }, data: { state: structuredClone(next), version: previous.version } });
  assert.equal(response.status(), 200, await response.text());
 }
 async function openList(pageNumber = 1, count = 6) {
  await front.goto(base + "/Project/index.html?page=" + pageNumber);
  await front.waitForFunction(({ selector, count }) => window.cmsStore && document.querySelector("[data-project-pagination]")?.hasAttribute("data-current-page") && document.querySelectorAll(selector).length === count, { selector: S.card, count });
 }
 async function openDetail(id, count, fromPage = 1) {
  await front.goto(detailUrl(id, fromPage));
  await front.waitForFunction(({ selector, count }) => window.cmsStore && document.querySelectorAll(selector).length === count, { selector: S.photo, count: Math.min(count, 6) });
  await front.locator(S.title + ":visible," + S.missing + ":visible").first().waitFor();
 }
 async function eachDetailPhotoPage(action) {
  const pager = front.locator("[data-project-photo-pagination]");
  const pageCount = Number(await pager.getAttribute("data-page-count")) || 0;
  if (!pageCount) { await action(0); return; }
  const originalPage = Number(await pager.getAttribute("data-current-page")) || 1;
  async function selectPage(value) {
   if (Number(await pager.getAttribute("data-current-page")) === value) return;
   await front.locator('[data-project-photo-page="' + value + '"]').click();
   await front.waitForFunction(value => Number(document.querySelector("[data-project-photo-pagination]")?.dataset.currentPage) === value, value);
  }
  try { for (let page = 1; page <= pageCount; page++) { await selectPage(page); await action(page); } }
  finally { await selectPage(originalPage); }
 }
 async function photoIds() {
  const ids = [];
  await eachDetailPhotoPage(async () => ids.push(...await front.locator(S.photo).evaluateAll(nodes => nodes.map(node => node.dataset.projectPhoto))));
  return ids;
 }
 async function loadDetailPhotos() {
  await eachDetailPhotoPage(async () => {
   for (const image of await front.locator(S.photo + " img").all()) {
    await image.scrollIntoViewIfNeeded(); await image.evaluate(node => node.decode());
    assert.ok(await image.evaluate(node => node.complete && node.naturalWidth > 0), "project photo is decoded");
   }
  });
 }
 async function assertMobileFilter() {
  await front.waitForFunction(selector => {
   const nav = document.querySelector(selector), current = nav?.querySelector('[aria-current="page"]'); if (!nav || !current) return false;
   const a = nav.getBoundingClientRect(), b = current.getBoundingClientRect(); return b.left >= a.left - 1 && b.right <= a.right + 1;
  }, S.switch);
  const layout = await front.locator(S.switch).evaluate(nav => ({ height: nav.getBoundingClientRect().height, scrollable: nav.scrollWidth > nav.clientWidth }));
  assert.ok(layout.scrollable, "mobile project filter scrolls horizontally"); assert.ok(layout.height < 110, "mobile project filter is one compact row");
  assert.ok((await front.locator(S.title).boundingBox()).y < 600, "project title appears within first phone screen");
 }
 async function saveAdmin(allowUnchanged = false) {
  await admin.locator('[data-action="save-current"]').click();
  await admin.locator("#unsavedNotice").waitFor({ state: "hidden" });
  assert.match(await admin.locator("#toast").textContent(), allowUnchanged ? /本页已保存|本页没有待保存的修改/ : /本页已保存/);
 }
 try {
  adminContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  publicContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  for (const context of [adminContext, publicContext]) {
   context.on("page", page => page.on("pageerror", error => pageErrors.push(error.message)));
   await context.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  }
  admin = await adminContext.newPage(); front = await publicContext.newPage();
  admin.setDefaultTimeout(10000); front.setDefaultTimeout(10000);
  await admin.goto(base + "/admin/index.html#projects");
  await admin.locator("#loginUsername").fill("project-test"); await admin.locator("#loginPassword").fill("isolated-project-test-only");
  await admin.getByRole("button", { name: "登录", exact: true }).click();
  await admin.waitForFunction(() => document.querySelector("#viewTitle")?.textContent === "项目页");
  const status = await publicContext.request.get(base + "/api/cms-status");
  assert.equal((await status.json()).storage, "local-server"); assert.notEqual(new URL(base).port, "5173");
  pass("随机端口隔离HTTP服务与独立前后台BrowserContexts，真实5173数据未写入");
  await check("13个公开项目按sortOrder每页6个，隐藏及草稿不参与分页", async () => {
   await openList(1, 6);
   assert.deepEqual(await front.locator(S.card + " h3").allTextContents(), seed.projects.slice(0, 6).map(item => item.title));
   assert.ok(await front.locator(S.pagination).isVisible());
   await front.locator(S.page(2)).click(); await front.waitForFunction(() => new URL(location.href).searchParams.get("page") === "2");
   assert.deepEqual(await front.locator(S.card + " h3").allTextContents(), seed.projects.slice(6, 12).map(item => item.title));
   await front.locator(S.page(3)).click(); await front.waitForFunction(() => document.querySelectorAll("[data-project-card]").length === 1);
   assert.deepEqual(await front.locator(S.card + " h3").allTextContents(), [seed.projects[12].title]);
  });
  await check("分页保留URL，刷新及浏览器前进后退恢复对应项目", async () => {
   await openList(1, 6); await front.locator(S.page(2)).click();
   await front.waitForFunction(() => new URL(location.href).searchParams.get("page") === "2"); await front.reload();
   await front.waitForFunction(() => document.querySelector("[data-project-card] h3")?.textContent === "Project fixture 07");
   assert.equal(new URL(front.url()).searchParams.get("page"), "2");
   await front.goBack(); await front.waitForFunction(() => new URL(location.href).searchParams.get("page") !== "2");
   assert.equal(await front.locator(S.card + " h3").first().textContent(), seed.projects[0].title);
   await front.goForward(); await front.waitForFunction(() => new URL(location.href).searchParams.get("page") === "2");
   assert.equal(await front.locator(S.card + " h3").first().textContent(), seed.projects[6].title);
  });
  await check("页码异常与超界规范化，0/1/6/7/13项目边界正确", async () => {
   for (const huge of [999, "9999999999999999999999999"]) { await openList(huge, 1); assert.equal(new URL(front.url()).searchParams.get("page"), "3"); }
   for (const invalid of [0, -1, "abc"]) {
    await openList(invalid, 6); assert.equal(await front.locator(S.card + " h3").first().textContent(), seed.projects[0].title);
   }
   for (const count of [0, 1, 6, 7, 13]) {
    const next = structuredClone(seed); next.projects = next.projects.slice(0, count); await replaceState(next);
    await openList(1, Math.min(6, count)); assert.equal(await front.locator(S.card).count(), Math.min(6, count));
    assert.equal(await front.locator(S.pagination).getAttribute("data-page-count"), String(count ? Math.ceil(count / 6) : 0)); assert.equal(await front.locator(S.page("next")).isDisabled(), count <= 6);
    if (count === 7) { await front.locator(S.page(2)).click(); await front.waitForFunction(() => document.querySelectorAll("[data-project-card]").length === 1); }
   }
   await replaceState(seed);
  });
  await check("从第二页卡片进入项目详情，全部关联照片按顺序显示且返回原列表页", async () => {
   await replaceState(seed); await openList(2, 6);
   const link = front.locator(S.card).first().locator("a.view-link");
   const destination = new URL(await link.getAttribute("href"), front.url());
   assert.equal(destination.pathname, "/Project/detail.html"); assert.equal(destination.searchParams.get("project"), "test-project-6");
   assert.equal(destination.searchParams.get("fromPage"), "2"); await link.click();
   await front.waitForFunction(selector => document.querySelectorAll(selector).length === 6, S.photo);
   assert.deepEqual(await photoIds(), seed.projects[6].photoIds); await loadDetailPhotos();
   const back = new URL(await front.locator(S.back).getAttribute("href"), front.url()); assert.equal(back.searchParams.get("page"), "2");
   await Promise.all([front.waitForURL(url => url.pathname === "/Project/index.html", { waitUntil: "load" }), front.locator(S.back).click()]); await front.waitForFunction(() => document.querySelector("[data-project-card] h3")?.textContent === "Project fixture 07"); assert.equal(new URL(front.url()).searchParams.get("page"), "2");
  });
  await check("详情只读取明确关联；旧项目保留封面，显式空列表不冒出同分类作品", async () => {
   for (const [fromPage, expected] of [[0, "1"], [-1, "1"], ["abc", "1"], [999, "3"]]) { await openDetail("test-project-2", 2, fromPage); assert.equal(new URL(await front.locator(S.back).getAttribute("href"), front.url()).searchParams.get("page"), expected); }
   await openDetail("test-project-2", 2); assert.deepEqual(await photoIds(), ["test-photo-2", "test-photo-0"]);
   await openDetail("test-project-0", 1);
   assert.equal(await front.locator(S.photo).first().locator("img").getAttribute("src"), seed.projects[0].coverImage);
   await openDetail("test-project-1", 0); assert.ok(await front.locator(S.empty).isVisible()); assert.equal(await front.locator(S.photo).count(), 0);
  });
  await check("详情项目切换保留返回页，灯箱按项目照片顺序切换且关闭恢复焦点", async () => {
   await openDetail("test-project-6", 9, 2);
   await front.locator(S.photo).first().click(); assert.ok(await front.locator(S.lightbox).isVisible());
   assert.equal(await front.locator("[data-project-lightbox-title]").textContent(), seed.gallery[0].title);
   await front.locator("[data-project-lightbox-next]").click();
   assert.equal(await front.locator("[data-project-lightbox-title]").textContent(), seed.gallery[1].title);
   await front.keyboard.press("ArrowLeft"); assert.equal(await front.locator("[data-project-lightbox-title]").textContent(), seed.gallery[0].title);
   await front.keyboard.press("Escape"); assert.equal(await front.locator(S.lightbox).isVisible(), false);
   assert.equal(await front.locator(S.photo).first().evaluate(node => node === document.activeElement), true);
   const switchLink = front.locator(S.switch + ' a').filter({ hasText: "Project fixture 03" }).first();
   assert.equal(new URL(await switchLink.getAttribute("href"), front.url()).searchParams.get("fromPage"), "2"); await switchLink.click();
   await front.waitForFunction(selector => document.querySelectorAll(selector).length === 2, S.photo);
   assert.equal(new URL(front.url()).searchParams.get("project"), "test-project-2");
   await front.setViewportSize({ width: 390, height: 844 }); await openDetail("test-project-12", 1, 2); await assertMobileFilter();
   const mobileTarget = front.locator(S.switch + " a").filter({ hasText: "Project fixture 07" });
   await Promise.all([front.waitForURL(url => url.searchParams.get("project") === "test-project-6", { waitUntil: "load" }), mobileTarget.click()]);
   await front.waitForFunction(selector => document.querySelectorAll(selector).length === 6, S.photo); await assertMobileFilter();
   assert.ok(await front.evaluate(() => scrollY < 2), "filter auto reveal does not scroll entire document");
   await front.setViewportSize({ width: 1440, height: 1000 });
  });
  await check("隐藏项目、不存在ID、HTML特殊文字及私有照片安全处理", async () => {
   for (const id of ["test-hidden-project", "test-draft-project", "missing-id", '<img src=x onerror="window.projectXss=true">']) {
    await openDetail(id, 0); assert.ok(await front.locator(S.missing).isVisible()); assert.equal(await front.locator(S.photo).count(), 0);
    assert.equal(await front.evaluate(() => window.projectXss === true), false);
   }
   await openDetail("test-project-8", 1); assert.equal(await front.locator(S.title).textContent(), seed.projects[8].title);
   assert.equal(await front.locator(S.title + " img").count(), 0); assert.equal(await front.evaluate(() => window.projectXss === true), false);
   const publicBody = await (await publicContext.request.get(base + "/api/public-state.js")).text();
   for (const privateText of ["Hidden project fixture", "Draft project fixture", "Photo fixture 9", "Photo fixture 10", "test-photo-9", "test-photo-10", "test-missing-photo"]) assert.ok(!publicBody.includes(privateText), privateText + " is not public");
  });
  await check("列表与详情在桌面、390和320px无横向溢出，减少动态时轮播停播", async () => {
   await replaceState(seed);
   for (const width of [1440, 390, 320]) {
    await front.setViewportSize({ width, height: 950 }); await openList(2, 6);
    assert.ok(await front.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "list width " + width);
    const toggle = front.locator("[data-showcase-toggle]"); if (await toggle.count()) assert.equal(await toggle.isDisabled(), true);
    await openDetail("test-project-6", 9, 2); if (width <= 390) await assertMobileFilter(); await loadDetailPhotos(); assert.ok(await front.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "detail width " + width);
   }
   await front.screenshot({ path: path.join(evidence, "项目详情_mobile-detail.png"), fullPage: true });
   await front.setViewportSize({ width: 1440, height: 1000 }); await openList(2, 6);
   await front.screenshot({ path: path.join(evidence, "项目分页_desktop-pagination.png"), fullPage: true });
  });
  await check("封面轮播仅使用当前页项目，自动播放、暂停与跨页状态正确", async () => {
   await replaceState(seed); await front.emulateMedia({ reducedMotion: "no-preference" }); await front.setViewportSize({ width: 1440, height: 1000 });
   try {
    await openList(2, 6); await front.evaluate(() => { window.wongMotion.setPreferences({ reduce: false }); scrollTo(0, 0); }); await front.mouse.move(8, 8);
    await front.waitForFunction(() => Number(document.querySelector(".archive-stamp")?.dataset.coverIndex) >= 6 && document.querySelector("[data-cover-showcase]")?.getAttribute("aria-busy") !== "true");
    assert.match(await front.locator("[data-showcase-count]").textContent(), /\d{2} \/ 06/);
    const initial = await front.locator(".archive-stamp").getAttribute("data-cover-index");
    await front.waitForFunction(initial => document.querySelector(".archive-stamp")?.dataset.coverIndex !== initial, initial, { timeout: 7500 });
    const current = Number(await front.locator(".archive-stamp").getAttribute("data-cover-index")); assert.ok(current >= 6 && current <= 11);
    assert.equal(new URL(front.url()).searchParams.get("page"), "2");
    await front.locator("[data-showcase-toggle]").click(); await front.mouse.move(8, 8); const paused = await front.locator(".archive-stamp").getAttribute("data-cover-index");
    assert.equal(await front.locator("[data-showcase-toggle]").getAttribute("aria-pressed"), "true"); await front.waitForTimeout(4600);
    assert.equal(await front.locator(".archive-stamp").getAttribute("data-cover-index"), paused);
    await front.locator(S.page(3)).click(); await front.waitForFunction(() => document.querySelector(".archive-stamp")?.dataset.coverIndex === "12");
    assert.equal((await front.locator("[data-showcase-count]").textContent()).trim(), "01 / 01"); assert.equal(await front.locator("[data-showcase-toggle]").isDisabled(), true);
    await front.locator(S.page(2)).click(); assert.equal(await front.locator("[data-showcase-toggle]").getAttribute("aria-pressed"), "true");
   } finally { await front.emulateMedia({ reducedMotion: "reduce" }); }
  });
  await check("后台从摄影记录添加照片、编辑并保存，独立前台按关联同步且隐藏草稿照片", async () => {
   await replaceState(seed); await admin.reload(); await admin.locator("[data-project-photos]").waitFor();
   await admin.locator("[data-project-photo-project]").selectOption("1");
   assert.equal(await admin.locator("[data-project-photo-row]").count(), 0);
   for (const id of ["test-photo-3", "test-photo-0"]) {
    await admin.locator("[data-project-photo-choice]").selectOption(id); await admin.locator('[data-project-photo-action="add"]').click();
   }
   assert.deepEqual(await admin.locator("[data-project-photo-row]").evaluateAll(rows => rows.map(row => row.dataset.projectPhotoRow)), ["test-photo-3", "test-photo-0"]);
   await admin.locator('[data-bind="gallery.3.title"]').fill("项目内编辑的摄影记录");
   await admin.locator('[data-bind="gallery.3.description"]').fill("项目内编辑的照片说明");
   await saveAdmin();
   const saved = (await state()).state;
   assert.deepEqual(saved.projects[1].photoIds, ["test-photo-3", "test-photo-0"]); assert.equal(saved.gallery.length, seed.gallery.length);
   assert.equal(saved.gallery[3].title, "项目内编辑的摄影记录"); assert.equal(saved.gallery[3].description, "项目内编辑的照片说明");
   const preview = new URL(await admin.locator("[data-project-detail-link]").getAttribute("href"), admin.url());
   assert.equal(preview.searchParams.get("project"), "test-project-1");
   await openDetail("test-project-1", 2); assert.deepEqual(await photoIds(), ["test-photo-3", "test-photo-0"]);
   await admin.locator('[data-bind="gallery.3.status"]').selectOption("Draft"); await saveAdmin();
   await openDetail("test-project-1", 1); assert.deepEqual(await photoIds(), ["test-photo-0"]);
   await admin.locator('[data-bind="gallery.3.status"]').selectOption("Published"); await saveAdmin();
   await openDetail("test-project-1", 2); assert.deepEqual(await photoIds(), ["test-photo-3", "test-photo-0"]);
  });
  await check("后台照片排序、移出、清空与使用封面只改变当前项目关联", async () => {
   const next = structuredClone(seed); next.projects[1].photoIds = ["test-photo-3", "test-photo-0"];
   await replaceState(next); await admin.reload(); await admin.locator("[data-project-photo-project]").selectOption("1");
   await admin.locator('[data-project-photo-action="up"][data-photo-index="1"]').click(); await saveAdmin();
   assert.deepEqual((await state()).state.projects[1].photoIds, ["test-photo-0", "test-photo-3"]);
   await openDetail("test-project-1", 2); assert.deepEqual(await photoIds(), ["test-photo-0", "test-photo-3"]);
   await admin.locator('[data-project-photo-action="remove"][data-photo-index="0"]').click(); await saveAdmin();
   const afterRemove = (await state()).state;
   assert.deepEqual(afterRemove.projects[1].photoIds, ["test-photo-3"]); assert.equal(afterRemove.gallery.length, seed.gallery.length);
   assert.deepEqual(afterRemove.projects[2].photoIds, seed.projects[2].photoIds);
   await admin.locator('[data-project-photo-action="empty"]').click(); await admin.locator("[data-confirm-ok]").click(); await saveAdmin();
   assert.deepEqual((await state()).state.projects[1].photoIds, []); await openDetail("test-project-1", 0); assert.ok(await front.locator(S.empty).isVisible());
   await admin.locator('[data-project-photo-action="use-cover"]').click(); await saveAdmin();
   const afterCover = (await state()).state;
   assert.equal(afterCover.projects[1].photoIds.length, 1); assert.equal(afterCover.gallery.length, seed.gallery.length);
   await openDetail("test-project-1", 1); assert.equal(await front.locator(S.photo).locator("img").getAttribute("src"), seed.projects[1].coverImage);
   const beforeCoverRepeat = (await state()).version;
   await admin.locator('[data-project-photo-action="use-cover"]').click(); await saveAdmin(true);
   assert.equal((await state()).state.projects[1].photoIds.length, 1); assert.equal((await state()).version, beforeCoverRepeat);
  });
  await check("后台批量上传真实图片并关联；照片只出现在当前项目且保存后跨浏览器读取", async () => {
   await replaceState(seed); await admin.reload(); await admin.locator("[data-project-photo-project]").selectOption("1");
   const sample = await front.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 24; canvas.height = 18;
    const context = canvas.getContext("2d"); context.fillStyle = "#6c745d"; context.fillRect(0, 0, 24, 18); return canvas.toDataURL("image/png").split(",")[1];
   });
   const file = name => ({ name, mimeType: "image/png", buffer: Buffer.from(sample, "base64") });
   await admin.locator("[data-project-photo-upload]").setInputFiles([file("project-photo-one.png"), file("project-photo-two.png")]);
   await admin.waitForFunction(() => document.querySelectorAll("[data-project-photo-row]").length === 2 && !document.querySelector('[data-action="save-current"]').disabled);
   await saveAdmin(); const saved = (await state()).state; const newIds = saved.projects[1].photoIds;
   assert.equal(newIds.length, 2); assert.equal(new Set(newIds).size, 2); assert.equal(saved.gallery.length, seed.gallery.length + 2);
   const uploaded = newIds.map(id => saved.gallery.find(photo => photo.id === id));
   for (const photo of uploaded) { assert.equal(photo.status, "Published"); assert.deepEqual(photo.displayScopes, []); assert.ok(photo.image.startsWith("/api/") || photo.image.startsWith("/media/")); }
   assert.deepEqual(saved.projects[2].photoIds, seed.projects[2].photoIds);
   await openDetail("test-project-1", 2); assert.deepEqual(await photoIds(), newIds);
   await front.waitForFunction(selector => [...document.querySelectorAll(selector + " img")].every(image => image.complete && image.naturalWidth > 0), S.photo);
   for (const suffix of ["", "?category=" + encodeURIComponent(seed.categories[0].id)]) {
    await front.goto(base + "/photography/index.html" + suffix);
    await front.waitForFunction(() => document.querySelector("[data-gallery-pagination]")?.hasAttribute("data-current-page"));
    for (const id of newIds) assert.equal(await front.locator('[data-photo-id="' + id + '"]').count(), 0, "project upload does not appear in photography " + suffix);
   }
   await admin.reload(); await admin.locator("[data-project-photo-project]").selectOption("1"); assert.equal(await admin.locator("[data-project-photo-row]").count(), 2);
   await openDetail("test-project-2", 2); assert.deepEqual(await photoIds(), ["test-photo-2", "test-photo-0"]);
   for (const width of [1440, 390, 320]) { await admin.setViewportSize({ width, height: 950 }); assert.ok(await admin.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "admin width " + width); }
   await admin.setViewportSize({ width: 1440, height: 1000 }); await admin.locator("[data-project-photos]").screenshot({ path: path.join(evidence, "项目照片后台_admin-project-photos.png") });
  });
  await check("真实保存API拒绝非数组、非字符串与重复照片引用且保留原版本", async () => {
   await replaceState(seed); const before = await state();
   for (const invalid of ["test-photo-0", [3], ["test-photo-0", "test-photo-0"]]) {
    const next = structuredClone(before.state); next.projects[1].photoIds = invalid;
    const response = await adminContext.request.put(base + "/api/admin/state", { headers: { Origin: base }, data: { state: next, version: before.version } });
    assert.equal(response.status(), 400); assert.equal((await state()).version, before.version);
   }
   assert.deepEqual((await state()).state.projects[1].photoIds, []);
  });
  assert.deepEqual(pageErrors, []);
 } finally {
  const report = { checks, failures, pageErrors, testMatch: process.env.PROJECT_TEST_MATCH || null, realHttp: true, separateBrowserContexts: true, productionWrites: false, currentPreviewWrites: false, evidence, dataDir };
  fs.writeFileSync(path.join(evidence, "项目联调结果_project-collections-results.json"), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
  await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  if (failures.length || pageErrors.length) process.exitCode = 1;
 }
}
run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
