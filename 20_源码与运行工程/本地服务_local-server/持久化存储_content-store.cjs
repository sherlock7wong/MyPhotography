"use strict";
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash, randomUUID } = require("node:crypto");

const MAX_DOCUMENT_BYTES = 32 * 1024 * 1024;
const queues = new Map();
const clone = value => structuredClone(value);
function failure(status, message) { return Object.assign(new Error(message), { status }); }
function isObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }

function validateState(state, status = 400) {
  const invalid = label => { throw failure(status, status === 503 ? `本地内容文件的 ${label} 结构无效；原文件已保留，服务不会用默认内容覆盖它。` : `${label} 结构无效，本次未保存。`); };
  if (!isObject(state)) invalid("state");
  function present(object, key, kind, label) {
    if (!Object.hasOwn(object, key)) return false;
    const value = object[key];
    if (kind === "object" ? !isObject(value) : !Array.isArray(value)) invalid(label);
    if (kind === "records" && value.some(item => !isObject(item))) invalid(label);
    if (kind === "values" && value.some(item => item === null || !["string", "number", "boolean"].includes(typeof item))) invalid(label);
    return true;
  }
  for (const key of ["dashboard", "profile", "contact", "settings", "componentVisibility"]) present(state, key, "object", key);
  for (const key of ["projects", "gallery", "categories", "messages"]) present(state, key, "records", key);
  if (state.profile) { present(state.profile, "timeline", "records", "profile.timeline"); present(state.profile, "tags", "values", "profile.tags"); }
  if (state.contact) {
    present(state.contact, "page", "object", "contact.page"); present(state.contact, "contactMethods", "records", "contact.contactMethods"); present(state.contact, "filmStrip", "values", "contact.filmStrip");
    if (state.contact.page) present(state.contact.page, "projectTypes", "values", "contact.page.projectTypes");
  }
  const settings = state.settings;
  if (settings) {
    for (const key of ["seo", "pageSeo", "pageContent", "homeHero", "homeComparison", "globalInfo", "maintenance", "effects", "accessibility", "cityContent", "integrations", "contactForm", "photographyView", "galleryOrder"]) present(settings, key, "object", `settings.${key}`);
    if (settings.homeComparison) present(settings.homeComparison, "entries", "records", "settings.homeComparison.entries");
    for (const key of ["navigation", "homeSelection", "homeCategories"]) present(settings, key, "records", `settings.${key}`);
    if (settings.cityContent) {
      present(settings.cityContent, "photos", "records", "settings.cityContent.photos"); present(settings.cityContent, "filters", "records", "settings.cityContent.filters");
      for (const photo of settings.cityContent.photos || []) present(photo, "tags", "values", "settings.cityContent.photos.tags");
    }
    for (const field of ["pageSeo", "pageContent"]) if (settings[field]) for (const key of ["home", "about", "projects", "photography", "city", "contact"]) present(settings[field], key, "object", `settings.${field}.${key}`);
  }
  if (state.componentVisibility) for (const key of ["global", "home", "about", "projects", "photography", "city", "contact"]) present(state.componentVisibility, key, "object", `componentVisibility.${key}`);
  for (const photo of state.gallery || []) present(photo, "displayScopes", "values", "gallery.displayScopes");
  for (const project of state.projects || []) { present(project, "categoryIds", "values", "projects.categoryIds"); if(present(project,"photoIds","values","projects.photoIds") && (project.photoIds.some(id=>typeof id!=="string") || new Set(project.photoIds).size!==project.photoIds.length)) invalid("projects.photoIds"); }
  for (const category of state.categories || []) for (const key of ["coverNotes", "filterLabels"]) present(category, key, "values", `categories.${key}`);
  return state;
}

function createStore({ dataDir, seed }) {
  const filename = path.join(path.resolve(dataDir), "wong-cms.json");
  const lockDirectory = path.join(path.dirname(filename), "wong-cms.write-lock");
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  async function withProcessLock(task) {
    await ensureDirectory();
    const token = randomUUID();
    const ownerFile = path.join(lockDirectory, "owner.json");
    const deadline = Date.now() + 5000;
    while (true) {
      try {
        await fs.mkdir(lockDirectory, { mode: 0o700 });
        const handle = await fs.open(ownerFile, "wx", 0o600);
        try { await handle.writeFile(JSON.stringify({ pid: process.pid, token, acquiredAt: new Date().toISOString() }) + "\n"); await handle.sync(); }
        finally { await handle.close(); }
        break;
      } catch (error) {
        if (error.code !== "EEXIST") throw failure(503, "无法建立本地内容写锁；数据未写入，请保留草稿并检查数据目录。");
        let owner;
        let info;
        try { info = await fs.stat(lockDirectory); owner = JSON.parse(await fs.readFile(ownerFile, "utf8")); }
        catch (cause) {
          if (cause.code === "ENOENT") { try { info = await fs.stat(lockDirectory); } catch (missing) { if (missing.code === "ENOENT") continue; throw missing; } }
          if (info && Date.now() - info.mtimeMs < 1000 && Date.now() < deadline) { await wait(20); continue; }
          throw failure(503, "本地内容写锁不完整，原数据与锁均已保留。请先停止使用此数据目录的服务，将 wong-cms.write-lock 改名保留后重启。");
        }
        if (!info.isDirectory() || !Number.isSafeInteger(owner?.pid) || owner.pid <= 0 || typeof owner.token !== "string" || !/^[0-9a-f-]{36}$/.test(owner.token)) throw failure(503, "本地内容写锁格式无效，原数据与锁均已保留。请先停止服务，将 wong-cms.write-lock 改名保留后重启。");
        let alive = true;
        try { process.kill(owner.pid, 0); } catch (cause) { if (cause.code === "ESRCH") alive = false; }
        if (!alive) throw failure(503, "发现上次服务遗留的内容写锁，未覆盖数据。请先停止使用此数据目录的服务，将 wong-cms.write-lock 改名保留后重启。");
        if (Date.now() >= deadline) throw failure(503, "另一进程正在保存本站内容，请稍后重试；本次没有覆盖数据。");
        await wait(20);
      }
    }
    try { return await task(); }
    finally {
      let owner;
      try { owner = JSON.parse(await fs.readFile(ownerFile, "utf8")); } catch (_) { throw failure(503, "写锁在操作期间发生变化，已保留锁与数据；请保留草稿并核对网站版本。"); }
      if (owner.token !== token || owner.pid !== process.pid) throw failure(503, "写锁所属进程发生变化，已保留锁与数据；请保留草稿并核对网站版本。");
      await fs.unlink(ownerFile);
      await fs.rmdir(lockDirectory);
    }
  }
  function serial(task) {
    const result = (queues.get(filename) || Promise.resolve()).then(() => withProcessLock(task));
    const settled = result.catch(() => {});
    queues.set(filename, settled);
    settled.finally(() => { if (queues.get(filename) === settled) queues.delete(filename); });
    return result;
  }
  async function ensureDirectory() { await fs.mkdir(path.dirname(filename), { recursive: true, mode: 0o700 }); }
  async function readExisting() {
    let bytes;
    try { const info = await fs.stat(filename); if (info.size > MAX_DOCUMENT_BYTES) throw failure(503, "本地内容文件超过容量限制；原文件已保留，请先备份后检查。"); bytes = await fs.readFile(filename); } catch (error) { if (error.code === "ENOENT") return null; throw error; }
    if (bytes.length > MAX_DOCUMENT_BYTES) throw failure(503, "本地内容文件超过容量限制；原文件已保留，请先备份后检查。");
    let document;
    try { document = JSON.parse(bytes.toString("utf8")); } catch (_) { throw failure(503, "本地内容文件不是有效 JSON；原文件已保留，服务不会用默认内容覆盖它。"); }
    if (!isObject(document) || !isObject(document.state) || !Number.isSafeInteger(document.version) || document.version < 0) throw failure(503, "本地内容文件结构无效；原文件已保留，请使用恢复副本核对。");
    validateState(document.state, 503);
    return { document, bytes };
  }
  async function writeAtomic(document, previous) {
    validateState(document.state);
    const bytes = Buffer.from(JSON.stringify(document, null, 2) + "\n");
    if (bytes.length > MAX_DOCUMENT_BYTES) throw failure(413, "内容超过本地 32 MB 容量，请减少内嵌图片或使用图片上传。");
    await ensureDirectory();
    const current = await readExisting();
    if (previous ? !current || !current.bytes.equals(previous.bytes) : current) throw failure(409, "内容文件已有更新，本次没有覆盖；请保留草稿后重新读取。");
    if (previous) {
      const backupDir = path.join(path.dirname(filename), "recovery");
      await fs.mkdir(backupDir, { recursive: true, mode: 0o700 });
      const createdAt = new Date().toISOString();
      const backupName = `内容数据备份_cms-data-backup_${createdAt.replace(/[:.]/g, "-")}_v${previous.document.version}_${randomUUID()}.json`;
      const backupPath = path.join(backupDir, backupName);
      await fs.writeFile(backupPath, previous.bytes, { flag: "wx", mode: 0o600 });
      await fs.writeFile(`${backupPath}.meta.json`, JSON.stringify({ originalPath: filename, createdAt, sha256: createHash("sha256").update(previous.bytes).digest("hex") }, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    }
    const temporary = path.join(path.dirname(filename), `内容写入暂存_cms-write_${randomUUID()}.tmp`);
    const handle = await fs.open(temporary, "wx", 0o600);
    try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
    const latest = await readExisting();
    if (previous ? !latest || !latest.bytes.equals(previous.bytes) : latest) throw failure(409, "内容文件在保存期间发生变化，本次没有覆盖；草稿和恢复副本均保留。");
    await fs.rename(temporary, filename);
  }
  async function load() {
    const existing = await readExisting();
    if (existing) return existing;
    let initial;
    try { initial = typeof seed === "function" ? await seed() : seed; } catch (_) { throw failure(503, "本地初始内容尚未准备好，请完成种子文件后重启服务。"); }
    if (!isObject(initial)) throw failure(503, "本地初始内容无效；未创建或覆盖数据文件。");
    validateState(initial, 503);
    const document = { schema: 1, version: 0, updatedAt: new Date().toISOString(), state: clone(initial) };
    await writeAtomic(document, null);
    return { document, bytes: await fs.readFile(filename) };
  }
  function read() { return serial(async () => { const { document } = await load(); return { state: clone(document.state), version: document.version }; }); }
  function save(state, version) {
    validateState(state);
    return serial(async () => {
      const previous = await load();
      if (previous.document.version !== version) throw failure(409, "本地服务已有更新，本次没有覆盖；请导出草稿后重新读取。");
      const document = { schema: 1, version: version + 1, updatedAt: new Date().toISOString(), state: clone(state) };
      await writeAtomic(document, previous);
      return { version: document.version };
    });
  }
  function addMessage(record) {
    return serial(async () => {
      const previous = await load();
      const state = clone(previous.document.state);
      if (state.settings?.integrations?.contactEnabled === false) throw failure(503, "留言提交已暂停，请使用页面上的其他联系方式。");
      const min = Math.max(12, Math.min(5000, Number(state.settings?.contactForm?.minLength) || 12));
      const max = Math.max(min, Math.min(5000, Number(state.settings?.contactForm?.maxLength) || 5000));
      if (record.message.length < min || record.message.length > max) throw failure(400, `留言须为 ${min} 至 ${max} 字符。`);
      state.messages = Array.isArray(state.messages) ? state.messages : [];
      state.messages.unshift(clone(record));
      const document = { schema: 1, version: previous.document.version + 1, updatedAt: new Date().toISOString(), state };
      await writeAtomic(document, previous);
      return { version: document.version };
    });
  }
  function deleteMessage(id, version) {
    if (typeof id !== "string" || !id.trim() || id.length > 160 || /[\/\\\x00-\x1f\x7f]/.test(id) || !Number.isSafeInteger(version) || version < 0) throw failure(400, "留言编号与版本格式不正确。");
    return serial(async () => {
      const previous = await load();
      if (previous.document.version !== version) throw failure(409, "留言列表已有更新，本次未删除；请重新读取后再操作。");
      const state = clone(previous.document.state);
      const messages = Array.isArray(state.messages) ? state.messages : [];
      if (!messages.some(message => String(message.id) === id)) throw failure(404, "此留言不存在，本次未删除其他数据。");
      state.messages = messages.filter(message => String(message.id) !== id);
      const document = { schema: 1, version: version + 1, updatedAt: new Date().toISOString(), state };
      await writeAtomic(document, previous);
      return { deleted: true, id, state: clone(state), version: document.version };
    });
  }
  return { read, save, addMessage, deleteMessage, filename };
}

module.exports = { createStore, failure, isObject, MAX_DOCUMENT_BYTES, validateState };
