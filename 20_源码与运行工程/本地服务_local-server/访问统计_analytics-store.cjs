"use strict";
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash, randomUUID } = require("node:crypto");
const { failure, isObject } = require("./持久化存储_content-store.cjs");

const PAGES = ["home", "about", "projects", "photography", "contact"];
// Historical city records stay valid on disk; new events and displayed totals use active pages.
const HISTORY_PAGES = [...PAGES, "city"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH = /^[0-9a-f]{64}$/;
const LIMIT = 50000;
const MAX_BYTES = 20 * 1024 * 1024;
const queues = new Map();
const hash = value => createHash("sha256").update(value).digest("hex");
const beijingDay = now => new Date(new Date(now).getTime() + 8 * 3600000).toISOString().slice(0, 10);
function pageviewInput(value) {
  if (!isObject(value) || !UUID.test(value.eventId) || !UUID.test(value.visitorId) || !PAGES.includes(value.page)) throw failure(400, "访问统计参数无效。");
  return { id: hash(value.eventId.toLowerCase()), visitor: hash(value.visitorId.toLowerCase()), page: value.page };
}
function messageReadInput(value) {
  if (!isObject(value) || !UUID.test(value.eventId) || typeof value.messageId !== "string" || !value.messageId.trim() || value.messageId.length > 160 || /[\x00-\x1f\x7f]/.test(value.messageId)) throw failure(400, "留言阅读统计参数无效。");
  return { id: hash(value.eventId.toLowerCase()), message: hash(value.messageId) };
}
function validate(document) {
  const bad = () => { throw failure(503, "访问统计文件无效，原文件已保留；不会用零值覆盖历史记录。"); };
  const timestamp = value => typeof value === "string" && Number.isFinite(Date.parse(value));
  if (!isObject(document) || document.schema !== 1 || !timestamp(document.startedAt) || !timestamp(document.updatedAt) || !Array.isArray(document.events) || document.events.length > LIMIT) bad();
  const ids = new Set();
  for (const event of document.events) {
    if (!isObject(event) || !HASH.test(event.id) || ids.has(event.id) || !/^\d{4}-\d{2}-\d{2}$/.test(event.day) || !timestamp(event.at) || event.day !== beijingDay(event.at)) bad();
    ids.add(event.id);
    if (event.kind === "pageview" ? !HASH.test(event.visitor) || !HISTORY_PAGES.includes(event.page) : event.kind !== "message-read" || !HASH.test(event.message)) bad();
  }
  return document;
}
function projection(document, now) {
  const today = beijingDay(now);
  const days = Array.from({ length:14 }, (_, index) => beijingDay(new Date(new Date(now).getTime() - (13 - index) * 86400000)));
  const pageEvents = document.events.filter(event => event.kind === "pageview" && PAGES.includes(event.page));
  const readEvents = document.events.filter(event => event.kind === "message-read");
  const unique = records => new Set(records.map(event => event.visitor)).size;
  return {
    available:true, startedAt:document.startedAt, updatedAt:document.updatedAt,
    capacityReached:document.events.length >= LIMIT,
    totals:{ pageViews:pageEvents.length, visitors:unique(pageEvents), todayPageViews:pageEvents.filter(event => event.day === today).length, todayVisitors:unique(pageEvents.filter(event => event.day === today)), messageReads:readEvents.length, todayMessageReads:readEvents.filter(event => event.day === today).length },
    daily:days.map(date => { const events = pageEvents.filter(event => event.day === date); return { date, pageViews:events.length, visitors:unique(events), messageReads:readEvents.filter(event => event.day === date).length }; }),
    pages:PAGES.map(page => { const events = pageEvents.filter(event => event.page === page); return { page, pageViews:events.length, visitors:unique(events) }; })
  };
}
function createAnalyticsStore({ dataDir, clock = () => new Date() }) {
  const filename = path.join(path.resolve(dataDir), "wong-analytics.json");
  const lockDirectory = path.join(path.dirname(filename), "wong-analytics.write-lock");
  const ownerFile = path.join(lockDirectory, "owner.json");
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  async function lock(task) {
    await fs.mkdir(path.dirname(filename), { recursive:true, mode:0o700 });
    const token = randomUUID(); const deadline = Date.now() + 5000;
    while (true) {
      try {
        await fs.mkdir(lockDirectory, { mode:0o700 });
        const handle = await fs.open(ownerFile, "wx", 0o600);
        try { await handle.writeFile(JSON.stringify({ pid:process.pid, token, acquiredAt:new Date().toISOString() }) + "\n"); await handle.sync(); } finally { await handle.close(); }
        break;
      } catch (cause) {
        if (cause.code !== "EEXIST") throw failure(503, "访问统计写锁无法建立；原统计数据已保留。");
        let owner; let info;
        try { info = await fs.stat(lockDirectory); owner = JSON.parse(await fs.readFile(ownerFile, "utf8")); }
        catch (error) {
          if (error.code === "ENOENT") { try { info = await fs.stat(lockDirectory); } catch (missing) { if (missing.code === "ENOENT") continue; throw missing; } }
          if (info && Date.now() - info.mtimeMs < 1000 && Date.now() < deadline) { await wait(20); continue; }
          throw failure(503, "访问统计写锁不完整，数据与锁已保留。请先停止使用此数据目录的服务，将 wong-analytics.write-lock 改名保留后重启。");
        }
        if (!info.isDirectory() || !Number.isSafeInteger(owner?.pid) || owner.pid <= 0 || !UUID.test(owner.token)) throw failure(503, "访问统计写锁无效，数据与锁已保留；请先停止服务后检查。");
        let alive = true;
        try { process.kill(owner.pid, 0); } catch (error) { if (error.code === "ESRCH") alive = false; }
        if (!alive) throw failure(503, "访问统计发现遗留写锁，数据未覆盖。请先停止所有相关服务，将 wong-analytics.write-lock 改名保留后重启。");
        if (Date.now() >= deadline) throw failure(503, "访问统计正由另一进程保存，请稍后重试。");
        await wait(20);
      }
    }
    try { return await task(); }
    finally {
      let owner;
      try { owner = JSON.parse(await fs.readFile(ownerFile, "utf8")); } catch (_) { throw failure(503, "访问统计写锁发生变化，已保留文件；请检查数据目录。"); }
      if (owner.pid !== process.pid || owner.token !== token) throw failure(503, "访问统计写锁所属进程变化，已保留文件。");
      await fs.unlink(ownerFile); await fs.rmdir(lockDirectory);
    }
  }
  function serial(task) {
    const result = (queues.get(filename) || Promise.resolve()).then(() => lock(task));
    const settled = result.catch(() => {}); queues.set(filename, settled);
    settled.finally(() => { if (queues.get(filename) === settled) queues.delete(filename); });
    return result;
  }
  async function existing() {
    let bytes;
    try { const info = await fs.stat(filename); if (info.size > MAX_BYTES) throw failure(503, "访问统计文件超过容量，原文件已保留。"); bytes = await fs.readFile(filename); } catch (cause) { if (cause.code === "ENOENT") return null; throw cause; }
    if (bytes.length > MAX_BYTES) throw failure(503, "访问统计文件超过容量，原文件已保留。");
    let document;
    try { document = JSON.parse(bytes.toString("utf8")); } catch (_) { throw failure(503, "访问统计文件不是有效 JSON，原文件已保留；不会用零值覆盖历史记录。"); }
    return { document:validate(document), bytes };
  }
  async function write(document, previous) {
    validate(document);
    const bytes = Buffer.from(JSON.stringify(document) + "\n");
    if (bytes.length > MAX_BYTES) throw failure(503, "访问统计容量已满；历史记录保留，请先备份处理。");
    const current = await existing();
    if (previous ? !current || !current.bytes.equals(previous.bytes) : current) throw failure(409, "访问统计文件已有更新，本次未覆盖。");
    const temporary = path.join(path.dirname(filename), "访问统计写入_analytics-write_" + randomUUID() + ".tmp");
    const handle = await fs.open(temporary, "wx", 0o600);
    try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
    const latest = await existing();
    if (previous ? !latest || !latest.bytes.equals(previous.bytes) : latest) throw failure(409, "访问统计文件在保存期间变化，原件与暂存均保留。");
    await fs.rename(temporary, filename);
  }
  async function load() {
    const previous = await existing();
    if (previous) return previous;
    const now = new Date(clock()).toISOString(); const document = { schema:1, startedAt:now, updatedAt:now, events:[] };
    await write(document, null);
    return { document, bytes:await fs.readFile(filename) };
  }
  function read() { return serial(async () => projection((await load()).document, clock())); }
  function add(kind, input) {
    return serial(async () => {
      const previous = await load();
      const duplicate = previous.document.events.find(event => event.id === input.id);
      if (duplicate) {
        if (duplicate.kind !== kind || (kind === "pageview" ? duplicate.page !== input.page || duplicate.visitor !== input.visitor : duplicate.message !== input.message)) throw failure(409, "统计事件编号已经用于其他内容。");
        return { accepted:true, duplicate:true };
      }
      if (previous.document.events.length >= LIMIT) throw failure(503, "访问统计容量已满；历史记录保留，新增统计已暂停。");
      const at = new Date(clock()).toISOString(); const document = structuredClone(previous.document);
      document.events.push({ kind, ...input, day:beijingDay(at), at }); document.updatedAt = at;
      await write(document, previous);
      return { accepted:true, duplicate:false };
    });
  }
  return { read, pageview:value => add("pageview", pageviewInput(value)), messageRead:value => add("message-read", messageReadInput(value)), filename };
}
module.exports = { createAnalyticsStore, beijingDay, pageviewInput, messageReadInput, PAGES, LIMIT };
