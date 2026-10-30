"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");
const sourceRoot = path.resolve(__dirname, "../..");
const modulePath = path.join(sourceRoot, "shared", "seo-meta.js");
const seo = require(modulePath);
const baseUrl = "http://127.0.0.1:5173/Home/index.html";
const state = () => ({ settings: { globalInfo: { brandName: "测试档案" }, seo: { seoTitle: "全站默认", seoDescription: "全站介绍", ogImage: "../Home/assets/photographer.png" }, pageSeo: {} }, categories: [], componentVisibility: { global: {} } });

test("only public page routes and category queries are recognised", () => {
  for (const [url, page] of [["/", "home"], ["/index.html", "home"], ["/Home", "home"], ["/Home/", "home"], ["/about/index.html", "about"], ["/Project/index.html", "projects"], ["/photography/", "photography"], ["/Contact/index.html", "contact"]]) assert.equal(seo.routePage(url).page, page);
  for (const url of ["/CityHuman", "/CityHuman/", "/CityHuman/index.html", "/admin/index.html", "/shared/cms-data.js", "/private/index.html", "/Home/index.html/evil", "https://other.example/Home/", "/Home\\index.html"]) assert.equal(seo.routePage(url), null);
  assert.deepEqual(seo.routePage("/photography/index.html", "?category=portrait&token=secret"), { page: "photography", categoryId: "portrait" });
  assert.deepEqual(seo.routePage("/Home/index.html", "?category=portrait"), { page: "home" });
});

test("blank page values fall back instead of emptying titles; metadata never changes page copy", () => {
  const data = state();
  data.settings.pageSeo.home = { title: "  ", description: "\n", ogImage: "" };
  const result = seo.resolve(data, "home", { baseUrl, fallback: { title: "原页面标题", description: "原页面简介", ogImage: "assets/photographer.png" } });
  assert.equal(result.title, "原页面标题");
  assert.equal(result.description, "原页面简介");
  assert.equal(result.image, "http://127.0.0.1:5173/Home/assets/photographer.png");
  data.settings.pageSeo.home = { title: "保存的标题", description: "保存的简介" };
  assert.equal(seo.resolve(data, "home", { baseUrl, fallback: { title: "原页面标题" } }).title, "保存的标题");
  assert.equal(seo.resolve(data, "home", { baseUrl }).type, "website");
});

test("per-category metadata wins and remains consistent without JavaScript", () => {
  const data = state();
  data.settings.pageSeo.photography = { title: "摄影总览", description: "总览介绍", canonicalUrl: "" };
  data.categories = [{ id: "portrait", name: "人像", heroTitle: "人物与光", pageIntro: "分类正文", seoTitle: "人像搜索标题", seoDescription: "人像搜索简介", heroImage: "../Project/assets/portrait.png", status: "Published", visibility: "Public" }];
  const options = { baseUrl: "https://photos.example/photography/index.html?category=portrait&private=ignored", categoryId: "portrait" };
  const first = seo.resolve(data, "photography", options);
  assert.equal(first.title, "人像搜索标题"); assert.equal(first.description, "人像搜索简介");
  assert.equal(first.canonicalUrl, "https://photos.example/photography/index.html?category=portrait");
  assert.equal(first.ogUrl, first.canonicalUrl); assert.equal(first.image, "https://photos.example/Project/assets/portrait.png");
  delete data.categories[0].seoTitle; delete data.categories[0].seoDescription;
  assert.equal(seo.resolve(data, "photography", options).title, "人物与光 - 测试档案 - Photography");
  assert.equal(seo.resolve(data, "photography", options).description, "分类正文");
  data.categories[0].visibility = "Private";
  const hidden = seo.resolve(data, "photography", options);
  assert.equal(hidden.title, "摄影总览"); assert.equal(hidden.canonicalUrl, "https://photos.example/photography/index.html");
});

test("canonical and image URLs reject unsafe protocols, credentials, controls, and arbitrary query parameters", () => {
  const data = state();
  data.settings.pageSeo.home = { canonicalUrl: "javascript:alert(1)", ogImage: "data:image/png;base64,xxx" };
  let result = seo.resolve(data, "home", { baseUrl: "http://127.0.0.1:5173/?draft=secret#private", fallback: { ogImage: "assets/photo.png" } });
  assert.equal(result.canonicalUrl, baseUrl); assert.equal(result.image, "http://127.0.0.1:5173/Home/assets/photo.png");
  data.settings.pageSeo.home = { canonicalUrl: "https://public.example/home#ignored", ogImage: "https://name:password@public.example/leak.png" };
  result = seo.resolve(data, "home", { baseUrl });
  assert.equal(result.canonicalUrl, "https://public.example/home"); assert.ok(!result.image.includes("password"));
  data.settings.pageSeo.home.canonicalUrl = "https://public.example/\nheader";
  assert.equal(seo.resolve(data, "home", { baseUrl }).canonicalUrl, baseUrl);
  assert.equal(seo.resolve(data, "home", { baseUrl: "javascript:alert(1)" }).canonicalUrl, "");
  assert.equal(seo.resolve(data, "home", { baseUrl: "https://name:password@public.example/" }).image, "");
});

test("directory and root aliases resolve assets against the actual public page directory", () => {
  const data = state(); delete data.settings.seo.ogImage;
  assert.equal(seo.resolve(data, "home", { baseUrl: "https://photos.example/", fallback: { ogImage: "assets/card.png" } }).image, "https://photos.example/Home/assets/card.png");
  assert.equal(seo.resolve(data, "about", { baseUrl: "https://photos.example/about", fallback: { ogImage: "Image/portrait.png" } }).image, "https://photos.example/about/Image/portrait.png");
  data.settings.seo.canonicalUrl = "https://photos.example/";
  assert.equal(seo.resolve(data, "about", { baseUrl }).canonicalUrl, "https://photos.example/about/index.html");
});

test("head injection escapes content, deduplicates tags, and preserves scripts, comments, and body byte-for-byte", () => {
  const script = '<script>const sample = "<meta name=description content=keep><title>keep</title>";</script>';
  const body = '<body><h1>前台正文不变</h1><script>const x="<title>body title</title>";</script></body></html>';
  const html = '<!doctype html><!-- <head><title>not real</title></head> --><html><head><title>Old &amp; Title</title><meta name="description" content="old > description"><meta name=description content=duplicate><link rel=canonical href="https://old.example/"><meta property="og:image" content="https://old.example/first.png"><meta property="og:image" content="https://old.example/duplicate.png">' + script + '</head>' + body;
  const data = state(); data.settings.pageSeo.home = { title: '<img src=x onerror="evil()"> & 新标题', description: '"><script>evil()</script>', ogImage: "https://photos.example/card.png?x=1&y=2" };
  const metadata = seo.resolve(data, "home", { baseUrl });
  const changed = seo.injectHtml(html, metadata);
  assert.ok(changed.endsWith(body)); assert.ok(changed.includes(script)); assert.ok(changed.includes('<!-- <head><title>not real</title></head> -->'));
  assert.ok(changed.includes('&lt;img src=x onerror=&quot;evil()&quot;&gt; &amp; 新标题'));
  assert.ok(!changed.includes('<script>evil()</script>')); assert.ok(!changed.includes('content=duplicate'));
  assert.ok(!changed.includes('https://old.example/duplicate.png'));
  const parsed = seo.readHtmlMetadata(changed);
  assert.equal(parsed.title, metadata.title); assert.equal(parsed.description, metadata.description); assert.equal(parsed.ogImage, metadata.image); assert.equal(parsed.canonicalUrl, metadata.canonicalUrl); assert.equal(parsed.type, "website");
  assert.equal(seo.injectHtml(changed, metadata), changed);
});

test("SEO and Open Graph switches apply independently while the browser title remains usable", () => {
  const html = '<html><head><title>old</title><meta name=description content=old><link rel=canonical href="https://old.example/"><meta property="og:locale" content="en_GB"></head><body>body</body></html>';
  const data = state(); data.componentVisibility.global["SEO Meta"] = false;
  let changed = seo.injectHtml(html, seo.resolve(data, "home", { baseUrl }));
  let parsed = seo.readHtmlMetadata(changed); assert.equal(parsed.description, undefined); assert.equal(parsed.canonicalUrl, undefined); assert.equal(parsed.ogTitle, "全站默认");
  data.componentVisibility.global["SEO Meta"] = true; data.componentVisibility.global["Open Graph Meta"] = false;
  changed = seo.injectHtml(html, seo.resolve(data, "home", { baseUrl })); parsed = seo.readHtmlMetadata(changed);
  assert.equal(parsed.description, "全站介绍"); assert.equal(parsed.ogTitle, undefined); assert.ok(!changed.includes('property="og:locale"')); assert.ok(parsed.title);
});

test("all five current public HTML pages receive their saved metadata before scripts execute", () => {
  const data = state(); const routes = { Home: "home", about: "about", Project: "projects", photography: "photography", Contact: "contact" };
  for (const [folder, page] of Object.entries(routes)) {
    const html = fs.readFileSync(path.join(sourceRoot, folder, "index.html"), "utf8");
    const original = seo.readHtmlMetadata(html);
    data.settings.pageSeo[page] = { title: `已保存 ${page}`, description: `已保存的${page}简介`, ogImage: "/media/card.png" };
    const changed = seo.injectHtml(html, seo.resolve(data, page, { baseUrl: `https://photos.example/${folder}/index.html`, fallback: original }));
    const parsed = seo.readHtmlMetadata(changed);
    assert.equal(parsed.title, `已保存 ${page}`); assert.equal(parsed.description, `已保存的${page}简介`); assert.equal(parsed.ogImage, "https://photos.example/media/card.png");
    assert.equal(changed.slice(changed.indexOf("<body")), html.slice(html.indexOf("<body")));
  }
});

test("browser UMD and generated Worker ESM have the same API and results", async () => {
  const source = fs.readFileSync(modulePath, "utf8"); const sandbox = { URL, URLSearchParams };
  vm.runInNewContext(source, sandbox, { filename: "seo-meta.js" });
  const workerPath = path.join(sourceRoot, "site-deployment", "worker", "seo-meta.js");
  const generated = '/* Generated by scripts/build-client.mjs from shared/seo-meta.js. */\nconst module = { exports: {} };\n(function (module) {\n' + source + '\n})(module);\nexport const { resolve, injectHtml, routePage, readHtmlMetadata } = module.exports;\nexport default module.exports;\n';
  assert.equal(fs.readFileSync(workerPath, "utf8"), generated);
  const worker = await import(pathToFileURL(workerPath).href);
  const data = state(); data.settings.pageSeo.home = { title: "一致的标题", description: "一致的简介" };
  const expected = seo.resolve(data, "home", { baseUrl });
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.cmsSeo.resolve(data, "home", { baseUrl }))), expected);
  assert.deepEqual(worker.default.resolve(data, "home", { baseUrl }), expected);
  assert.equal(worker.injectHtml('<head></head><body>same</body>', expected), seo.injectHtml('<head></head><body>same</body>', expected));
});

test("original HTML defaults survive server injection so clearing a saved field does not restore its stale value", () => {
  const html = '<html><head><title>原始默认标题</title><meta name="description" content="原始默认简介"><meta property="og:image" content="assets/default.png"></head><body>不变</body></html>';
  const data = state(); data.settings.pageSeo.home = { title: "此前保存的自定义标题", description: "此前保存的自定义简介", ogImage: "/media/custom.png" };
  const served = seo.injectHtml(html, seo.resolve(data, "home", { baseUrl, fallback: seo.readHtmlMetadata(html) }));
  assert.equal(seo.readHtmlMetadata(served).title, "此前保存的自定义标题");
  const defaults = seo.readHtmlMetadata(served, { original: true });
  assert.equal(defaults.title, "原始默认标题"); assert.equal(defaults.description, "原始默认简介"); assert.equal(defaults.ogImage, "assets/default.png");
  data.settings.pageSeo.home = { title: "", description: "", ogImage: "" };
  const preview = seo.resolve(data, "home", { baseUrl, fallback: defaults });
  assert.equal(preview.title, "原始默认标题"); assert.equal(preview.description, "原始默认简介"); assert.equal(preview.image, "http://127.0.0.1:5173/Home/assets/default.png");
  const again = seo.injectHtml(served, preview);
  assert.equal(seo.readHtmlMetadata(again).title, "原始默认标题"); assert.equal(seo.readHtmlMetadata(again, { original: true }).title, "原始默认标题");
  assert.equal(seo.injectHtml(again, preview), again);
});
