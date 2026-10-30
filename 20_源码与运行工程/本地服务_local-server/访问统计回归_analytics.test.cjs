"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { randomUUID, createHash } = require("node:crypto");
const { spawn } = require("node:child_process");
const { createServer } = require("./内容服务_content-server.cjs");
const { createAnalyticsStore, beijingDay } = require("./访问统计_analytics-store.cjs");
async function fixture(t) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "wong-analytics-test-"));
  let clock = new Date("2026-10-22T15:59:59.900Z"); let server; let origin;
  const seed = { messages:[{ id:"fixture-message", message:"private message" }], gallery:[], projects:[], settings:{}, componentVisibility:{} };
  async function start() {
    server = createServer({ dataDir, sourceDir:path.join(__dirname, ".."), seed, username:"fixture-owner", password:"fixture-password", analyticsClock:() => clock });
    await new Promise((resolve,reject) => { server.once("error",reject); server.listen(0,"127.0.0.1",resolve); });
    origin = "http://127.0.0.1:" + server.address().port;
  }
  async function stop() { if (server?.listening) await new Promise((resolve,reject) => server.close(error => error ? reject(error) : resolve())); }
  async function call(route, { method="GET", value, cookie, headers={} } = {}) {
    const h = { ...headers }; if (cookie) h.Cookie=cookie;
    if (method !== "GET" && !Object.hasOwn(h,"Origin")) h.Origin=origin;
    if (value !== undefined) h["Content-Type"]="application/json";
    return fetch(origin+route, { method, headers:h, body:value === undefined ? undefined : JSON.stringify(value) });
  }
  async function login() { const r=await call("/api/admin/login",{ method:"POST",value:{username:"fixture-owner",password:"fixture-password"} }); assert.equal(r.status,200); return r.headers.get("set-cookie").split(";")[0]; }
  await start();
  t.after(async () => { await stop(); const r=path.relative(os.tmpdir(),dataDir); if(r.startsWith("..")||path.isAbsolute(r)||!path.basename(dataDir).startsWith("wong-analytics-test-"))throw new Error("Unsafe cleanup"); await fs.rm(dataDir,{recursive:true,force:true}); });
  return { call, login, start, stop, dataDir, setClock:value => { clock=new Date(value); } };
}
const view = (visitorId=randomUUID(), page="home") => ({ eventId:randomUUID(), visitorId, page });
test("real HTTP statistics require admin auth, deduplicate events and retain data across restart without touching CMS", async t => {
  const f=await fixture(t); assert.equal((await f.call("/api/admin/analytics")).status,401);
  const cookie=await f.login(); await f.call("/api/admin/state",{cookie});
  const cms=await fs.readFile(path.join(f.dataDir,"wong-cms.json"));
  const first=view();
  const responses=await Promise.all(Array.from({length:10},()=>f.call("/api/analytics/pageview",{method:"POST",value:first,headers:{"User-Agent":"PRIVATE_AGENT","X-Forwarded-For":"198.51.100.42"}})));
  for(const r of responses)assert.equal(r.status,200);
  const outcomes=await Promise.all(responses.map(r=>r.json())); assert.equal(outcomes.filter(r=>!r.duplicate).length,1);
  await f.call("/api/analytics/pageview",{method:"POST",value:view(first.visitorId,"about")});
  await f.call("/api/analytics/pageview",{method:"POST",value:view(undefined,"photography")});
  let statistics=await(await f.call("/api/admin/analytics",{cookie})).json();
  assert.deepEqual(statistics.totals,{pageViews:3,visitors:2,todayPageViews:3,todayVisitors:2,messageReads:0,todayMessageReads:0});
  assert.equal(statistics.daily.length,14);assert.equal(statistics.daily.at(-1).date,"2026-10-22");assert.equal(statistics.pages.length,5);
  assert.equal(statistics.pages.find(p=>p.page==="about").visitors,1);
  assert.doesNotMatch(JSON.stringify(statistics),new RegExp(first.visitorId));
  const storage=await fs.readFile(path.join(f.dataDir,"wong-analytics.json"),"utf8"); assert.doesNotMatch(storage,/PRIVATE_AGENT|198\.51\.100\.42/);assert.equal(storage.includes(first.visitorId),false);assert.equal(storage.includes(first.eventId),false);
  assert.deepEqual(await fs.readFile(path.join(f.dataDir,"wong-cms.json")),cms);
  await f.stop();await f.start();const newCookie=await f.login();statistics=await(await f.call("/api/admin/analytics",{cookie:newCookie})).json();assert.equal(statistics.totals.pageViews,3);assert.equal(statistics.totals.visitors,2);assert.deepEqual(await fs.readFile(path.join(f.dataDir,"wong-cms.json")),cms);
});
test("Beijing midnight, actual message reads, duplicate conflicts and counts remain separate",async t=>{
  const f=await fixture(t);const cookie=await f.login();const visitor=randomUUID();await f.call("/api/admin/state",{cookie});const cms=await fs.readFile(path.join(f.dataDir,"wong-cms.json"));
  const event=view(visitor);await f.call("/api/analytics/pageview",{method:"POST",value:event});
  f.setClock("2026-10-22T16:00:00.100Z");await f.call("/api/analytics/pageview",{method:"POST",value:view(visitor,"contact")});
  const read={eventId:randomUUID(),messageId:"fixture-message"};
  assert.equal((await f.call("/api/admin/analytics/message-read",{method:"POST",value:read})).status,401);
  assert.deepEqual(await(await f.call("/api/admin/analytics/message-read",{method:"POST",cookie,value:read})).json(),{accepted:true,duplicate:false});
  assert.deepEqual(await(await f.call("/api/admin/analytics/message-read",{method:"POST",cookie,value:read})).json(),{accepted:true,duplicate:true});
  assert.equal((await f.call("/api/admin/analytics/message-read",{method:"POST",cookie,value:{eventId:randomUUID(),messageId:"missing"}})).status,404);
  assert.equal((await f.call("/api/analytics/pageview",{method:"POST",value:{...event,page:"about"}})).status,409);
  const stats=await(await f.call("/api/admin/analytics",{cookie})).json();assert.equal(stats.totals.pageViews,2);assert.equal(stats.totals.visitors,1);assert.equal(stats.totals.todayPageViews,1);assert.equal(stats.totals.todayVisitors,1);assert.equal(stats.totals.messageReads,1);assert.equal(stats.daily.at(-2).pageViews,1);assert.equal(stats.daily.at(-1).date,"2026-10-23");assert.equal(stats.daily.at(-1).messageReads,1);assert.deepEqual(await fs.readFile(path.join(f.dataDir,"wong-cms.json")),cms);
});
test("invalid, cross-site, malformed and oversized inputs never fabricate or reset data",async t=>{
  const f=await fixture(t);const cookie=await f.login();await f.call("/api/analytics/pageview",{method:"POST",value:view()});const name=path.join(f.dataDir,"wong-analytics.json");const original=await fs.readFile(name);
  for(const value of [null,{},view(undefined,"dashboard"),{...view(),visitorId:"not-a-uuid"}])assert.equal((await f.call("/api/analytics/pageview",{method:"POST",value})).status,400);
  assert.equal((await f.call("/api/analytics/pageview",{method:"POST",value:{...view(),unused:"x".repeat(3000)}})).status,413);
  assert.equal((await f.call("/api/analytics/pageview",{method:"POST",value:view(),headers:{Origin:"https://external.test"}})).status,403);
  assert.deepEqual(await fs.readFile(name),original);
  const broken=Buffer.from('{"schema":1,"events":oops}');await fs.writeFile(name,broken);
  const result=await f.call("/api/admin/analytics",{cookie});assert.equal(result.status,503);const response=await result.json();assert.equal(response.available,false);assert.match(response.error,/原文件已保留/);
  assert.equal((await f.call("/api/analytics/pageview",{method:"POST",value:view()})).status,503);assert.deepEqual(await fs.readFile(name),broken);
});
test("two real Node processes can record concurrent events without losses",async t=>{
  const f=await fixture(t);const analytics=createAnalyticsStore({dataDir:f.dataDir});await analytics.read();const visitor=randomUUID();
  const program='const {createAnalyticsStore}=require(process.argv[1]);const {randomUUID}=require("node:crypto");const store=createAnalyticsStore({dataDir:process.argv[2]});Promise.all(Array.from({length:12},()=>store.pageview({eventId:randomUUID(),visitorId:process.argv[3],page:"projects"}))).then(()=>process.stdout.write("ok"),e=>{process.stderr.write(e.stack);process.exitCode=1;});';
  const run=()=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,["-e",program,path.join(__dirname,"访问统计_analytics-store.cjs"),f.dataDir,visitor],{stdio:["ignore","pipe","pipe"]});let stdout="",stderr="";child.stdout.on("data",v=>stdout+=v);child.stderr.on("data",v=>stderr+=v);child.on("error",reject);child.on("exit",code=>code===0?resolve(stdout):reject(new Error(stderr)));});
  assert.deepEqual(await Promise.all([run(),run()]),["ok","ok"]);const stats=await analytics.read();assert.equal(stats.totals.pageViews,24);assert.equal(stats.totals.visitors,1);assert.equal(stats.pages.find(p=>p.page==="projects").pageViews,24);
});
test("Beijing day helper handles the UTC boundary",()=>{assert.equal(beijingDay("2026-10-22T15:59:59.999Z"),"2026-10-22");assert.equal(beijingDay("2026-10-22T16:00:00.000Z"),"2026-10-23");});

test("local statistics stop at their capacity while retaining history and accepting identical retries",async t=>{
  const f=await fixture(t);const cookie=await f.login();const first=view();const hash=value=>createHash("sha256").update(value).digest("hex");const visitor=hash(first.visitorId);const at="2026-10-22T15:59:59.900Z";
  const events=Array.from({length:50000},(_,index)=>({kind:"pageview",id:hash(index===0?first.eventId:"fixture-cap-"+index),visitor,page:"home",day:"2026-10-22",at}));const bytes=Buffer.from(JSON.stringify({schema:1,startedAt:at,updatedAt:at,events})+"\n");const filename=path.join(f.dataDir,"wong-analytics.json");await fs.writeFile(filename,bytes);
  assert.equal((await f.call("/api/analytics/pageview",{method:"POST",value:view()})).status,503);assert.deepEqual(await(await f.call("/api/analytics/pageview",{method:"POST",value:first})).json(),{accepted:true,duplicate:true});assert.deepEqual(await fs.readFile(filename),bytes);
  const stats=await(await f.call("/api/admin/analytics",{cookie})).json();assert.equal(stats.available,true);assert.equal(stats.capacityReached,true);assert.equal(stats.totals.pageViews,50000);assert.equal(stats.totals.visitors,1);
});

test("legacy city analytics remain readable and unchanged while only five current pages accept new events",async t=>{
  const f=await fixture(t),cookie=await f.login();await f.call("/api/admin/state",{cookie});const cms=await fs.readFile(path.join(f.dataDir,"wong-cms.json"));
  assert.equal((await f.call("/api/analytics/pageview",{method:"POST",value:view()})).status,200);const filename=path.join(f.dataDir,"wong-analytics.json"),document=JSON.parse(await fs.readFile(filename,"utf8")),at=document.updatedAt;
  const hash=value=>createHash("sha256").update(value).digest("hex");document.events.push({kind:"pageview",id:hash(randomUUID()),visitor:hash(randomUUID()),page:"city",day:beijingDay(at),at});const before=Buffer.from(JSON.stringify(document)+"\n");await fs.writeFile(filename,before);
  const response=await f.call("/api/admin/analytics",{cookie});assert.equal(response.status,200);const stats=await response.json();assert.equal(stats.available,true);assert.equal(stats.pages.length,5);assert.equal(stats.pages.some(row=>row.page==="city"),false);assert.equal(stats.totals.pageViews,1);assert.equal(stats.totals.visitors,1);assert.equal(stats.daily.at(-1).pageViews,1);assert.deepEqual(await fs.readFile(filename),before);
  assert.equal((await f.call("/api/analytics/pageview",{method:"POST",value:view(undefined,"city")})).status,400);assert.deepEqual(await fs.readFile(filename),before);
  for(const page of ["home","about","projects","photography","contact"])assert.equal((await f.call("/api/analytics/pageview",{method:"POST",value:view(undefined,page)})).status,200);
  const saved=JSON.parse(await fs.readFile(filename,"utf8"));assert.equal(saved.events.length,7);assert.deepEqual(saved.events.find(event=>event.page==="city"),document.events[1]);assert.deepEqual(await fs.readFile(path.join(f.dataDir,"wong-cms.json")),cms);
});
