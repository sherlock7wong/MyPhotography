"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const { createServer } = require("../../本地服务_local-server/内容服务_content-server.cjs");
const original = structuredClone(require("../../shared/site-content.js"));
const sourceDir = path.resolve(__dirname, "../..");
const root = path.resolve(sourceDir, "..");
const runName = "运行_run_" + new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date()).replace(/\D/g, "") + "_" + String(Date.now() % 1000).padStart(3, "0");
const evidence = path.join(root, "40_测试与验收证据/项目详情分页与边框_project-detail-viewer_2026-10-24", runName);
const temporary = path.join(root, "99_临时文件、缓存和构建中间产物/项目详情分页与边框_project-detail-viewer_2026-10-24");
const S = {
 photo: "[data-project-photo]", pager: "[data-project-photo-pagination]",
 page: value => '[data-project-photo-page="' + value + '"]',
 group: value => '[data-project-photo-group="' + value + '"]',
 dialog: "[data-project-lightbox]", image: "[data-project-lightbox-image]",
 frame: "[data-project-film-frame]", stage: "[data-project-film-stage]",
 title: "[data-project-detail-title]", loading: "[data-project-image-loading]", error: "[data-project-image-error]"
};
const mainId = "detail-main-project";
function fixture() {
 const seed = structuredClone(original);
 const category = seed.categories.find(item => item.status === "Published" && item.visibility === "Public") || seed.categories[0];
 seed.categories = [structuredClone(category), { ...structuredClone(category), id: "detail-private-category", name: "隔离测试私有分类", visibility: "Private" }];
 seed.gallery = Array.from({ length: 16 }, (_, index) => ({
  ...structuredClone(original.gallery[index % original.gallery.length]), id: "detail-photo-" + String(index + 1).padStart(2, "0"),
  title: "隔离测试照片 " + String(index + 1).padStart(2, "0"), altText: "本机隔离测试图像 " + (index + 1),
  categoryId: category.id, category: category.name, status: "Published", sortOrder: index + 1, displayScopes: []
 }));
 seed.gallery[13].title = "用于验证长片名显示和胶片尺寸适配的隔离测试标题 " + "山川与街巷 光线与日常 ".repeat(10);
 seed.gallery[14].status = "Draft";
 seed.gallery[15].categoryId = "detail-private-category";
 seed.gallery[15].category = "隔离测试私有分类";
 seed.gallery[6].image = "/Project/assets/detail-test-slow.png";
 seed.gallery[13].image = "/Project/assets/detail-test-error.png";
 seed.projects = Array.from({ length: 7 }, (_, index) => ({
  ...structuredClone(original.projects[index % original.projects.length]), id: "detail-project-" + index,
  title: "隔离测试项目 " + (index + 1), sortOrder: index + 1, status: "Published", isVisible: true, photoIds: []
 }));
 seed.projects[0].photoIds = seed.gallery.slice(0, 2).map(photo => photo.id);
 Object.assign(seed.projects[6], { id: mainId, title: "城市与日常 · 隔离测试项目", theme: "独立项目测试", description: "这段原项目介绍折叠保留，用于核实资料没有丢失。", location: "隔离测试地点", year: "2026", photoIds: [seed.gallery[0].id, seed.gallery[14].id, ...seed.gallery.slice(1, 8).map(photo => photo.id), seed.gallery[15].id, ...seed.gallery.slice(8, 14).map(photo => photo.id)] });
 return seed;
}
async function run() {
 fs.mkdirSync(evidence, { recursive: true }); fs.mkdirSync(temporary, { recursive: true });
 const dataDir = fs.mkdtempSync(path.join(temporary, "隔离数据_test-data-"));
 const seed = fixture(), expectedIds = seed.gallery.slice(0, 14).map(photo => photo.id);
 const checks = [], failures = [], pageErrors = [], layoutMetrics = [];
 const server = createServer({ sourceDir, dataDir, seed, username: "detail-viewer-test", password: "isolated-detail-viewer-only" });
 await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
 const base = "http://127.0.0.1:" + server.address().port;
 const browser = await chromium.launch({ headless: true, executablePath: process.env.CMS_TEST_BROWSER_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
 let adminContext, publicContext, admin, front, samples, releaseSlow = () => {}, slowGate = Promise.resolve(), errorMode = false;
 const detailUrl = (page = 1, project = mainId, fromPage = 2) => base + "/Project/detail.html?project=" + encodeURIComponent(project) + "&fromPage=" + fromPage + "&photoPage=" + page;
 async function check(name, action) {
  if (process.env.PROJECT_DETAIL_TEST_MATCH && !new RegExp(process.env.PROJECT_DETAIL_TEST_MATCH).test(name)) return;
  try { await action(); checks.push({ name, passed: true }); console.log("PASS " + name); }
  catch (error) {
   failures.push({ name, error: error.stack || String(error) }); checks.push({ name, passed: false });
   if (front && !front.isClosed()) await front.screenshot({ path: path.join(evidence, "失败现场_failure-" + failures.length + ".png"), fullPage: false }).catch(() => {});
  } finally { releaseSlow(); slowGate = Promise.resolve(); errorMode = false; }
 }
 async function state() { const response = await adminContext.request.get(base + "/api/admin/state"); assert.equal(response.status(), 200); return response.json(); }
 async function replaceState(next) {
  const before = await state(); const response = await adminContext.request.put(base + "/api/admin/state", { headers: { Origin: base }, data: { state: structuredClone(next), version: before.version } }); assert.equal(response.status(), 200, await response.text());
 }
 async function waitPage(page, count) {
  await front.waitForFunction(({ page, count }) => Number(document.querySelector("[data-project-photo-pagination]")?.dataset.currentPage) === page && document.querySelectorAll("[data-project-photo]").length === count, { page, count });
 }
 async function open(page = 1, count = 6, project = mainId, fromPage = 2) { await front.goto(detailUrl(page, project, fromPage)); await waitPage(Math.max(1, Math.min(3, Number(page) || 1)), count); }
 async function ids() { return front.locator(S.photo).evaluateAll(nodes => nodes.map(node => node.dataset.projectPhoto)); }
 async function selectPage(page, count) { await front.locator(S.page(page)).click(); await waitPage(page, count); }
 async function openPhoto(index) {
  const page = Math.floor(index / 6) + 1; await front.goto(detailUrl(page)); await waitPage(page, page === 3 ? 2 : 6);
  await front.locator('[data-project-photo][data-photo-index="' + index + '"]').click(); await imageReady(expectedIds[index]);
 }
 async function imageReady(id) {
  await front.waitForFunction(id => {
   const dialog = document.querySelector("[data-project-lightbox]"), frame = document.querySelector("[data-project-film-frame]"), image = document.querySelector("[data-project-lightbox-image]");
   return dialog?.open && dialog.dataset.photoId === id && frame?.getAttribute("aria-busy") !== "true" && !image?.hidden && image?.complete && image.naturalWidth > 0;
  }, id);
 }
 async function currentViewer(id, page) {
  await imageReady(id); assert.equal(await front.locator(S.dialog).isVisible(), true); assert.equal(new URL(front.url()).searchParams.get("photoPage"), String(page)); assert.equal(new URL(front.url()).searchParams.get("fromPage"), "2");
 }
 async function frameMetrics(label) {
  await front.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const measured = await front.evaluate(() => {
   const frame = document.querySelector("[data-project-film-frame]"), stage = document.querySelector("[data-project-film-stage]"), image = document.querySelector("[data-project-lightbox-image]"), dialog = document.querySelector("[data-project-lightbox]");
   const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
   const style = getComputedStyle(frame), imageStyle = getComputedStyle(image), before = getComputedStyle(frame, "::before"), after = getComputedStyle(frame, "::after");
   return { frame: rect(frame), stage: rect(stage), image: rect(image), dialog: rect(dialog), naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, objectFit: imageStyle.objectFit, background: style.backgroundColor, before: before.backgroundImage, after: after.backgroundImage, padding: parseFloat(style.paddingLeft), overflow: document.documentElement.scrollWidth > innerWidth + 1, viewport: { width: innerWidth, height: innerHeight } };
  });
  layoutMetrics.push({ label, ...measured });
  assert.equal(measured.objectFit, "contain"); assert.ok(Math.abs(measured.image.width / measured.image.height - measured.naturalWidth / measured.naturalHeight) < 0.025, label + " aspect ratio");
  assert.ok(measured.frame.width <= measured.stage.width + 2 && measured.frame.height <= measured.stage.height + 2, label + " frame fits stage");
  assert.ok(measured.frame.x >= -1 && measured.frame.right <= measured.viewport.width + 1 && measured.frame.y >= -1 && measured.frame.bottom <= measured.viewport.height + 1, label + " frame fits viewport");
  assert.ok(measured.dialog.y >= -1 && measured.dialog.bottom <= measured.viewport.height + 1, label + " dialog fits viewport");
  assert.equal(measured.background, "rgb(16, 18, 15)"); assert.ok(measured.before.includes("radial-gradient") && measured.after.includes("radial-gradient")); assert.ok(measured.padding >= 15); assert.equal(measured.overflow, false);
  assert.ok(measured.image.width >= 70 && measured.image.height >= 70, label + " photograph remains readable");
  return measured;
 }
 try {
  adminContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" }); publicContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  for (const context of [adminContext, publicContext]) { context.on("page", page => page.on("pageerror", error => pageErrors.push(error.message))); await context.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort()); }
  admin = await adminContext.newPage(); front = await publicContext.newPage(); admin.setDefaultTimeout(12000); front.setDefaultTimeout(12000);
  await admin.goto(base + "/admin/index.html#projects"); await admin.locator("#loginUsername").fill("detail-viewer-test"); await admin.locator("#loginPassword").fill("isolated-detail-viewer-only"); await admin.getByRole("button", { name: "登录", exact: true }).click(); await admin.waitForFunction(() => document.querySelector("#viewTitle")?.textContent === "项目页");
  samples = await admin.evaluate(() => [[1600, 1000, "HORIZONTAL"], [800, 1200, "PORTRAIT"], [900, 900, "SQUARE"]].map(([width, height, title]) => {
   const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; const context = canvas.getContext("2d"); context.fillStyle = "#69725d"; context.fillRect(0, 0, width, height); context.fillStyle = "#e9dec3"; context.fillRect(0, 0, width, 30); context.fillRect(0, height - 30, width, 30); context.fillRect(0, 0, 30, height); context.fillRect(width - 30, 0, 30, height); context.strokeStyle = "#e9dec3"; context.lineWidth = 8; context.beginPath(); context.moveTo(30, 30); context.lineTo(width - 30, height - 30); context.moveTo(width - 30, 30); context.lineTo(30, height - 30); context.stroke(); context.fillStyle = "#10120f"; context.font = Math.floor(width / 12) + "px sans-serif"; context.textAlign = "center"; context.fillText(title, width / 2, height / 2); return canvas.toDataURL("image/png");
  }));
  for (let index = 0; index < 3; index++) seed.gallery[index].image = samples[index];
  await publicContext.route("**/Project/assets/detail-test-slow.png*", async route => { await slowGate; await route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from(samples[0].split(",")[1], "base64") }).catch(() => {}); });
  await publicContext.route("**/Project/assets/detail-test-error.png*", route => route.fulfill(errorMode ? { status: 404, contentType: "text/plain", body: "isolated image failure" } : { status: 200, contentType: "image/png", body: Buffer.from(samples[2].split(",")[1], "base64") }));
  await replaceState(seed); const status = await (await publicContext.request.get(base + "/api/cms-status")).json(); assert.equal(status.storage, "local-server"); assert.notEqual(new URL(base).port, "5173");
  checks.push({ name: "随机端口真实HTTP、隔离数据与独立前后台浏览器，不写实际5173", passed: true });

  await check("14张公开照片按关联顺序分为6+6+2，草稿私有照片不参与计数", async () => {
   await replaceState(seed); await open(); const collected = [];
   for (const [page, count] of [[1, 6], [2, 6], [3, 2]]) {
    if (page > 1) await selectPage(page, count); assert.equal(await front.locator(S.photo).count(), count); collected.push(...await ids());
    assert.equal(await front.locator(S.pager).getAttribute("data-page-count"), "3"); assert.equal(new URL(front.url()).searchParams.get("photoPage"), String(page));
    assert.equal(await front.locator("[data-project-current-photo-page]").textContent(), String(page));
    assert.equal(await front.locator(S.page("prev")).isDisabled(), page === 1); assert.equal(await front.locator(S.page("next")).isDisabled(), page === 3);
   }
   assert.deepEqual(collected, expectedIds); assert.equal(await front.locator("[data-project-total-photo-count]").textContent(), "14"); assert.equal(await front.locator("[data-project-photo-page-count]").textContent(), "3");
   assert.deepEqual(await front.locator("[data-project-photo-group]").evaluateAll(nodes => nodes.map(node => Number(node.dataset.projectPhotoGroup))), [1, 2, 3]);
  });
  await check("照片分页保留project与fromPage，刷新前后退及项目切换正确", async () => {
   await replaceState(seed); await open(); await selectPage(2, 6); await selectPage(3, 2); await front.goBack(); await waitPage(2, 6); assert.deepEqual(await ids(), expectedIds.slice(6, 12));
   await front.reload(); await waitPage(2, 6); await front.goForward(); await waitPage(3, 2);
   assert.equal(new URL(front.url()).searchParams.get("project"), mainId); assert.equal(new URL(front.url()).searchParams.get("fromPage"), "2");
   assert.equal(new URL(await front.locator("[data-project-back]").getAttribute("href"), front.url()).searchParams.get("page"), "2");
   const next = front.locator('[data-project-switch] a').filter({ hasText: "隔离测试项目 1" }).first();
   await Promise.all([front.waitForURL(url => url.searchParams.get("project") === "detail-project-0", { waitUntil: "load" }), next.click()]); await waitPage(1, 2);
   assert.equal(new URL(front.url()).searchParams.get("photoPage"), "1"); assert.equal(new URL(front.url()).searchParams.get("fromPage"), "2");
   assert.deepEqual(await ids(), expectedIds.slice(0, 2));
  });
  await check("异常照片页码夹紧，0/1/6/7/14张照片边界正确", async () => {
   await replaceState(seed);
   for (const [request, page, count] of [[0, 1, 6], [-1, 1, 6], ["abc", 1, 6], [999, 3, 2], ["999999999999999999999999999", 3, 2]]) { await front.goto(detailUrl(request)); await waitPage(page, count); assert.equal(new URL(front.url()).searchParams.get("photoPage"), String(page)); }
   for (const count of [0, 1, 6, 7, 14]) {
    const next = structuredClone(seed); next.projects[6].photoIds = expectedIds.slice(0, count); await replaceState(next); await front.goto(detailUrl(1)); await waitPage(count ? 1 : 0, Math.min(count, 6));
    assert.equal(await front.locator("[data-project-total-photo-count]").textContent(), String(count)); assert.equal(await front.locator(S.pager).getAttribute("data-page-count"), String(Math.ceil(count / 6)));
    if (count === 7) { await selectPage(2, 1); assert.deepEqual(await ids(), [expectedIds[6]]); }
    if (!count) {
     assert.equal(await front.locator("[data-project-photos-empty]").isVisible(), true); assert.equal(await front.locator("[data-project-detail-content]").getAttribute("data-empty-collection"), "true");
     const cover = front.locator("[data-project-detail-cover]"); await cover.evaluate(node => node.decode()); assert.ok((await cover.boundingBox()).height <= 161, "empty collection keeps a compact cover");
     await front.screenshot({ path: path.join(evidence, "空集合_empty-collection.png"), fullPage: false });
    }
   }
   await replaceState(seed);
  });
  await check("大图跨第6至7与13至14张，上一张跨页并关闭后聚焦当前照片", async () => {
   await replaceState(seed); await openPhoto(5); await front.locator("[data-project-lightbox-next]").click(); await currentViewer(expectedIds[6], 2); await waitPage(2, 6);
   await front.keyboard.press("ArrowLeft"); await currentViewer(expectedIds[5], 1); await waitPage(1, 6); await front.keyboard.press("ArrowRight"); await currentViewer(expectedIds[6], 2);
   await front.keyboard.press("Escape"); assert.equal(await front.locator(S.dialog).isVisible(), false); 
   assert.equal(await front.locator('[data-project-photo][data-photo-index="6"]').evaluate(node => node === document.activeElement), true);
   await openPhoto(12); await front.locator("[data-project-lightbox-next]").click(); await currentViewer(expectedIds[13], 3);
   await front.locator("[data-project-lightbox-prev]").click(); await currentViewer(expectedIds[12], 3); await front.locator("[data-project-lightbox-prev]").click(); await currentViewer(expectedIds[11], 2); await waitPage(2, 6);
   await front.locator("[data-project-lightbox-close]").click(); assert.equal(await front.locator('[data-project-photo][data-photo-index="11"]').evaluate(node => node === document.activeElement), true);
  });
  await check("大图跨页前后退恢复具体照片并与底层页同步", async () => {
   await replaceState(seed); await openPhoto(5); await front.locator("[data-project-lightbox-next]").click(); await currentViewer(expectedIds[6], 2);
   await front.goBack(); await waitPage(1, 6); assert.equal(await front.locator(S.dialog).getAttribute("data-photo-id"), expectedIds[5]); await currentViewer(expectedIds[5], 1);
   await front.goForward(); await waitPage(2, 6); await currentViewer(expectedIds[6], 2); await front.keyboard.press("Escape");
   assert.equal(await front.locator('[data-project-photo][data-photo-index="6"]').evaluate(node => node === document.activeElement), true);
  });
  await check("03胶片框横竖方照片不裁切，真实品牌片名与长标题和resize适配", async () => {
   await replaceState(seed); await front.setViewportSize({ width: 1440, height: 1000 });
   for (const [index, shape] of [[0, "横幅_landscape"], [1, "竖幅_portrait"], [2, "方幅_square"]]) {
    await openPhoto(index); await frameMetrics(shape);
    const brand = (await front.locator(".brand").first().textContent()).trim(); assert.ok((await front.locator("[data-project-film-brand]").textContent()).includes(brand)); assert.ok((await front.locator("[data-project-film-title]").textContent()).includes(seed.gallery[index].title));
    await front.screenshot({ path: path.join(evidence, "胶片框_" + shape + ".png"), fullPage: false }); await front.keyboard.press("Escape");
   }
   await openPhoto(13);
   for (const [width, height] of [[1440, 1000], [390, 844], [320, 800], [844, 390]]) { await front.setViewportSize({ width, height }); await imageReady(expectedIds[13]); await front.waitForTimeout(80); await frameMetrics("long-title-" + width + "x" + height); await front.screenshot({ path: path.join(evidence, "长片名_long-title_" + width + "x" + height + ".png"), fullPage: false }); }
   await front.keyboard.press("Escape"); await front.setViewportSize({ width: 1440, height: 1000 });
  });
  await check("首屏真实统计和小胶片索引可用，资料折叠保留且桌面手机布局可读", async () => {
   await replaceState(seed);
   for (const width of [1440, 390, 320]) {
    await front.setViewportSize({ width, height: width === 1440 ? 1000 : 844 }); await open();
    assert.equal(await front.locator("[data-project-total-photo-count]").textContent(), "14"); assert.equal(await front.locator("[data-project-photo-page-count]").textContent(), "3");
    const notes = front.locator("[data-project-notes]"); assert.equal(await notes.evaluate(node => node.open), false); assert.ok((await notes.textContent()).includes(seed.projects[6].description)); assert.ok((await notes.textContent()).includes(seed.projects[6].location));
    const measured = await front.evaluate(() => {
     const hero = document.querySelector(".project-detail-hero").getBoundingClientRect(), collection = document.querySelector(".project-photo-collection").getBoundingClientRect(), title = document.querySelector("[data-project-detail-title]").getBoundingClientRect();
     return { viewport: innerWidth, titleY: title.y, heroHeight: hero.height, afterHeroGap: collection.y - hero.bottom, overflow: document.documentElement.scrollWidth > innerWidth + 1, browseFontSize: parseFloat(getComputedStyle(document.querySelector("[data-project-browse]")).fontSize) };
    });
    layoutMetrics.push({ label: "intro-" + width, ...measured }); assert.equal(measured.overflow, false); assert.ok(measured.titleY < 600); assert.ok(measured.afterHeroGap < 140); assert.ok(measured.browseFontSize >= 10);
    await front.screenshot({ path: path.join(evidence, "首屏_intro_" + width + ".png"), fullPage: false });
    await front.locator(S.group(2)).click(); await waitPage(2, 6); assert.deepEqual(await ids(), expectedIds.slice(6, 12));
    assert.ok(await front.locator("[data-project-photo-groups]").evaluate(nav => { const a = nav.getBoundingClientRect(), b = nav.querySelector('[aria-current="page"]').getBoundingClientRect(); return b.left >= a.left - 1 && b.right <= a.right + 1; }), "current film index group remains horizontally visible");
    await notes.locator("summary").click(); assert.equal(await notes.evaluate(node => node.open), true); assert.equal(await front.locator("[data-project-detail-location]").isVisible(), true); await notes.locator("summary").click();
    await front.locator("[data-project-browse]").click(); assert.ok((await front.locator(".project-photo-collection").boundingBox()).y < 220);
   }
   await front.setViewportSize({ width: 1440, height: 1000 });
  });
  await check("后台新首屏与胶片文案真实保存，独立详情与动态分页同步", async () => {
   await replaceState(seed); await admin.reload();
   const fields = { detailTotalLabel: ["隔离照片总数", "[data-project-total-label]"], detailPagesLabel: ["隔离总页数", "[data-project-pages-label]"], detailBrowseText: ["浏览隔离照片", "[data-project-browse-label]"], detailIndexLabel: ["隔离胶片索引", "[data-project-page-index-label]"], detailNotesTitle: ["隔离项目资料", "[data-project-notes-label]"], detailFilmLabel: ["隔离项目胶片", "[data-project-film-label]"], detailImageLoadingText: ["正在读取隔离照片", S.loading], detailImageErrorText: ["隔离照片加载失败", S.error], pagePrevText: ["隔离上一页", S.page("prev")], pageNextText: ["隔离下一页", S.page("next")] };
   for (const [key, [value]] of Object.entries(fields)) { const field = admin.locator('[data-bind="settings.pageContent.projects.' + key + '"]'); await field.evaluate(node => { for (let parent = node.parentElement; parent; parent = parent.parentElement) if (parent.tagName === "DETAILS") parent.open = true; }); await field.fill(value); }
   await admin.locator('[data-action="save-current"]').click(); await admin.locator("#unsavedNotice").waitFor({ state: "hidden" }); assert.match(await admin.locator("#toast").textContent(), /本页已保存/);
   const saved = (await state()).state;
   for (const [key, [value]] of Object.entries(fields)) assert.equal(saved.settings.pageContent.projects[key], value);
   await open();
   for (const [, [value, selector]] of Object.entries(fields)) assert.equal((await front.locator(selector).textContent()).trim(), value);
   await selectPage(2, 6); assert.equal((await front.locator(S.page("prev")).textContent()).trim(), "隔离上一页"); assert.equal((await front.locator(S.page("next")).textContent()).trim(), "隔离下一页");
   await openPhoto(0); assert.equal((await front.locator("[data-project-film-label]").textContent()).trim(), "隔离项目胶片"); await front.keyboard.press("Escape");
  });
  await check("慢图切换无旧图误导，迟到响应不覆盖新照片，失败提示与恢复正确", async () => {
   const next = structuredClone(seed); next.gallery[6].image += "?case=slow-" + Date.now(); next.gallery[13].image += "?case=error-" + Date.now(); await replaceState(next);
   slowGate = new Promise(resolve => { releaseSlow = resolve; }); await openPhoto(5); await front.locator("[data-project-lightbox-next]").click();
   await front.waitForFunction(id => document.querySelector("[data-project-lightbox]")?.dataset.photoId === id && document.querySelector("[data-project-film-frame]")?.getAttribute("aria-busy") === "true", expectedIds[6]);
   assert.equal(await front.locator(S.loading).isVisible(), true); assert.equal(await front.locator(S.image).isVisible(), false);
   await front.locator("[data-project-lightbox-next]").click(); await currentViewer(expectedIds[7], 2); const image8 = await front.locator(S.image).getAttribute("src"); releaseSlow(); await front.waitForTimeout(120);
   assert.equal(await front.locator(S.dialog).getAttribute("data-photo-id"), expectedIds[7]); assert.equal(await front.locator(S.image).getAttribute("src"), image8); assert.equal(await front.locator(S.error).isVisible(), false); await front.keyboard.press("Escape");
   errorMode = true; await front.goto(detailUrl(3)); await waitPage(3, 2); await front.locator('[data-project-photo][data-photo-index="13"]').click();
   await front.locator(S.error).waitFor({ state: "visible" }); assert.equal(await front.locator(S.image).isVisible(), false); assert.equal(await front.locator(S.loading).isVisible(), false); assert.equal(await front.locator(S.frame).getAttribute("aria-busy"), "false");
   await front.locator("[data-project-lightbox-prev]").click(); await currentViewer(expectedIds[12], 3); assert.equal(await front.locator(S.error).isVisible(), false); await front.keyboard.press("Escape");
  });
  assert.deepEqual(pageErrors, []);
 } finally {
  releaseSlow(); const report = { checks, failures, pageErrors, layoutMetrics, testMatch: process.env.PROJECT_DETAIL_TEST_MATCH || null, realHttp: true, separateBrowserContexts: true, productionWrites: false, currentPreviewWrites: false, fixturePhotos: "Synthetic image aspect samples and cloned local seed metadata; no user data writes.", evidence, dataDir };
  fs.writeFileSync(path.join(evidence, "详情联调结果_project-detail-viewer-results.json"), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
  await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); if (failures.length || pageErrors.length) process.exitCode = 1;
 }
}
run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
