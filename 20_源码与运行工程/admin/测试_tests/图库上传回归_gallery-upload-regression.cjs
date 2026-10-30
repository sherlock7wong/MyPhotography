const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { chromium } = require("playwright");

const base = process.env.CMS_TEST_URL || "http://127.0.0.1:5173";
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname)) {
  throw new Error("Run these tests only against a local CMS preview.");
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CMS_TEST_BROWSER_PATH || undefined
  });
  const pageErrors = [];
  const checks = [];
  try {
    const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
    const match = source.match(/const MOCK_AUTH = (\{[\s\S]*?\});/);
    assert.ok(match, "Existing local mock account config is required.");
    const account = vm.runInNewContext("(" + match[1] + ")", {}, { timeout: 1000 });

    async function openGallery() {
      const context = await browser.newContext({ viewport: { width: 1074, height: 892 } });
      await context.route("**/*", route => {
        return new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort();
      });
      const page = await context.newPage();
      page.on("pageerror", error => pageErrors.push(error.message));
      await page.goto(base + "/admin/index.html");
      await page.locator("#loginUsername").fill(account.username);
      await page.locator("#loginPassword").fill(account.password);
      await page.locator('#loginForm button[type="submit"]').click();
      await page.locator('#sidebarNav [data-view-link="photography"]').click();
      await page.locator('[data-gallery-upload]').waitFor({ state: 'attached' });
      return { context, page };
    }

    async function chooseImages(page, files) {
      const chooserPromise = page.waitForEvent("filechooser");
      await page.getByText("批量导入图片", { exact: true }).click();
      const chooser = await chooserPromise;
      await chooser.setFiles(files);
    }

    async function waitForImport(page) {
      await page.waitForFunction(() => !document.querySelector('[data-action="save-current"]').disabled);
    }

    async function save(page) {
      await page.getByRole("button", { name: "保存当前页", exact: true }).click();
      assert.equal(await page.locator("#unsavedNotice").isVisible(), false);
      assert.match(await page.locator("#toast").textContent(), /本页已保存/);
    }

    const main = await openGallery();
    const fixtures = await main.page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1440;
      const context = canvas.getContext("2d");
      const image = context.createImageData(canvas.width, canvas.height);
      let seed = 47;
      for (let i = 0; i < image.data.length; i += 4) {
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
        image.data[i] = seed & 255;
        image.data[i + 1] = (seed >>> 8) & 255;
        image.data[i + 2] = (seed >>> 16) & 255;
        image.data[i + 3] = 255;
      }
      context.putImageData(image, 0, 0);
      const large = canvas.toDataURL("image/jpeg", 0.94).split(",")[1];
      canvas.width = 32;
      canvas.height = 32;
      context.fillStyle = "#648657";
      context.fillRect(8, 8, 16, 16);
      return { large, small: canvas.toDataURL("image/png").split(",")[1] };
    });
    const largeFile = name => ({ name, mimeType: "image/jpeg", buffer: Buffer.from(fixtures.large, "base64") });
    const smallFile = name => ({ name, mimeType: "image/png", buffer: Buffer.from(fixtures.small, "base64") });
    const initialGallery = await main.page.evaluate(() => window.cmsStore.load().gallery);
    const initialCount = initialGallery.length;

    for (const file of [smallFile("repeat.png"), smallFile("repeat.png"), largeFile("large-one.jpg"), largeFile("large-two.jpg")]) {
      await chooseImages(main.page, [file]);
      await waitForImport(main.page);
      await save(main.page);
    }
    await main.page.locator("[data-gallery-status]").selectOption("Published");
    await chooseImages(main.page, [largeFile("large-three.jpg"), largeFile("large-four.jpg")]);
    await waitForImport(main.page);
    assert.equal(await main.page.locator("[data-gallery-status]").inputValue(), "all");
    assert.equal(await main.page.locator(".photo-grid [data-gallery-id]").count(), initialCount + 6);
    await save(main.page);
    const imported = await main.page.evaluate(count => {
      const photos = window.cmsStore.load().gallery;
      return photos.slice(count).map(photo => ({ id: photo.id, length: photo.image.length }));
    }, initialCount);
    assert.equal(new Set(imported.map(photo => photo.id)).size, 6);
    assert.ok(imported.every(photo => photo.length <= 512 * 1024));
    assert.deepEqual(await main.page.evaluate(count => window.cmsStore.load().gallery.slice(0, count), initialCount), initialGallery);
    checks.push({ name: "repeat file, repeated large imports, batch, filters, original records", passed: true, previewLengths: imported.map(photo => photo.length) });

    const selectedId = await main.page.locator(".entity-item.is-active[data-gallery-id]").getAttribute("data-gallery-id");
    await main.page.locator('input[data-file-bind^="gallery."]').setInputFiles(smallFile("replacement.png"));
    await waitForImport(main.page);
    await save(main.page);
    assert.equal(await main.page.evaluate(({ id, expected }) => window.cmsStore.load().gallery.find(photo => photo.id === id).image === expected,
      { id: selectedId, expected: "data:image/png;base64," + fixtures.small }), true);
    await main.page.reload();
    await main.page.locator("[data-gallery-upload]").waitFor({ state: "attached" });
    assert.equal(await main.page.locator(".photo-grid [data-gallery-id]").count(), initialCount + 6);
    await main.page.waitForFunction(() => [...document.querySelectorAll(".photo-grid img")].every(image => image.complete && image.naturalWidth > 0));
    checks.push({ name: "replacement, PNG transparency payload, saved reload and image decoding", passed: true });
    if (process.env.CMS_TEST_SCREENSHOT) {
      fs.mkdirSync(path.dirname(process.env.CMS_TEST_SCREENSHOT), { recursive: true });
      await main.page.screenshot({ path: process.env.CMS_TEST_SCREENSHOT });
    }
    await main.context.close();

    const pending = await openGallery();
    await pending.page.evaluate(() => {
      const originalDecode = Image.prototype.decode;
      window.releaseTestDecode = null;
      const gate = new Promise(resolve => { window.releaseTestDecode = resolve; });
      Image.prototype.decode = async function () {
        await originalDecode.call(this);
        await gate;
      };
    });
    await chooseImages(pending.page, [largeFile("pending.jpg")]);
    assert.equal(await pending.page.getByRole("button", { name: "保存当前页", exact: true }).isDisabled(), true);
    assert.equal(await pending.page.getByRole("button", { name: "撤销本页修改", exact: true }).isDisabled(), true);
    await pending.page.locator('#sidebarNav [data-view-link="projects"]').click();
    await pending.page.evaluate(() => window.releaseTestDecode());
    await waitForImport(pending.page);
    assert.equal(await pending.page.locator("#viewTitle").textContent(), "摄影页");
    await save(pending.page);
    await pending.page.locator('#sidebarNav [data-view-link="projects"]').click();
    await pending.page.waitForFunction(() => document.querySelector("#viewTitle").textContent === "项目页");
    await pending.page.locator('input[data-bind^="projects."][data-bind$=".title"]').fill("Gallery regression project");
    await save(pending.page);
    assert.equal(await pending.page.evaluate(() => window.cmsStore.load().projects.some(project => project.title === "Gallery regression project")), true);
    assert.equal(await pending.page.evaluate(() => window.cmsStore.load().gallery.some(photo => photo.title === "Pending")), true);
    checks.push({ name: "save/reset gated during import; navigation blocked during import; subsequent Projects edit and save succeed", passed: true });
    await pending.context.close();

    const invalid = await openGallery();
    const invalidCount = await invalid.page.locator(".photo-grid [data-gallery-id]").count();
    const smallSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="green"/></svg>';
    const oversizedSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="100"><rect width="2000" height="100" fill="green"/></svg>';
    await chooseImages(invalid.page, [
      smallFile("valid.png"),
      { name: "broken.png", mimeType: "image/png", buffer: Buffer.from("not an image") },
      { name: "oversized.svg", mimeType: "image/svg+xml", buffer: Buffer.from(oversizedSvg) },
      { name: "valid.svg", mimeType: "image/svg+xml", buffer: Buffer.from(smallSvg) }
    ]);
    await waitForImport(invalid.page);
    assert.equal(await invalid.page.locator(".photo-grid [data-gallery-id]").count(), invalidCount + 2);
    assert.match(await invalid.page.locator("#toast").textContent(), /已处理 2\/4 张/);
    await chooseImages(invalid.page, [smallFile("after-error.png")]);
    await waitForImport(invalid.page);
    await save(invalid.page);
    assert.equal(await invalid.page.evaluate(() => window.cmsStore.load().gallery.length), invalidCount + 3);
    assert.equal(await invalid.page.evaluate(() => window.cmsStore.load().gallery.some(photo => photo.title === "Oversized")), false);
    assert.equal(await invalid.page.evaluate(() => window.cmsStore.load().gallery.find(photo => photo.title === "Valid" && photo.image.startsWith("data:image/svg+xml")).image.startsWith("data:image/svg+xml")), true);
    checks.push({ name: "partial batch failure, oversized SVG rejection, valid SVG format and next upload recovery", passed: true });
    await invalid.context.close();

    const quota = await openGallery();
    await quota.page.evaluate(data => {
      const state = window.cmsStore.load();
      state.gallery.push({ ...state.gallery[0], id: "legacy-large", title: "Legacy large", image: "data:image/jpeg;base64," + data });
      window.cmsStore.save(state);
      localStorage.setItem("__gallery_test_padding", "x".repeat(1500 * 1024));
    }, fixtures.large);
    await quota.page.reload();
    await quota.page.locator("[data-gallery-upload]").waitFor({ state: "attached" });
    await quota.page.evaluate(() => { window.beforeQuotaSave = localStorage.getItem("wong.cms.data"); });
    await chooseImages(quota.page, [largeFile("quota-new.jpg")]);
    await waitForImport(quota.page);
    await quota.page.getByRole("button", { name: "保存当前页", exact: true }).click();
    assert.match(await quota.page.locator("#toast").textContent(), /^保存失败：本机浏览器容量不足/);
    assert.equal(await quota.page.locator("#unsavedNotice").isVisible(), true);
    assert.equal(await quota.page.evaluate(() => localStorage.getItem("wong.cms.data") === window.beforeQuotaSave), true);
    await quota.page.evaluate(() => localStorage.removeItem("__gallery_test_padding"));
    await save(quota.page);
    assert.equal(await quota.page.evaluate(() => {
      const previous = JSON.parse(window.beforeQuotaSave).gallery.find(photo => photo.id === "legacy-large");
      const current = window.cmsStore.load().gallery.find(photo => photo.id === "legacy-large");
      return previous.image === current.image;
    }), true);
    checks.push({ name: "real quota error keeps stored data and draft; retry succeeds; legacy original retained", passed: true });

    await quota.page.locator('input[data-bind^="gallery."][data-bind$=".title"]').fill("Storage retry title");
    await quota.page.evaluate(() => {
      window.beforeDeniedSave = localStorage.getItem("wong.cms.data");
      window.originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "wong.cms.data") throw new DOMException("Storage is blocked for this test.", "SecurityError");
        return window.originalSetItem.call(this, key, value);
      };
    });
    await quota.page.getByRole("button", { name: "保存当前页", exact: true }).click();
    assert.match(await quota.page.locator("#toast").textContent(), /^保存失败：浏览器存储不可用/);
    assert.equal(await quota.page.locator("#unsavedNotice").isVisible(), true);
    assert.equal(await quota.page.evaluate(() => localStorage.getItem("wong.cms.data") === window.beforeDeniedSave), true);
    await quota.page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
    await save(quota.page);
    checks.push({ name: "blocked storage error preserves draft and supports retry", passed: true });
    await quota.context.close();

    assert.deepEqual(pageErrors, []);
    console.log(JSON.stringify({ checks, fixtureBytes: Buffer.from(fixtures.large, "base64").length, pageErrors }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
