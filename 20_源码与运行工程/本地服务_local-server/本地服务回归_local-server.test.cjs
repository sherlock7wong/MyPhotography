"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const { runInNewContext } = require("node:vm");
const { createHash, randomUUID } = require("node:crypto");
const { spawn } = require("node:child_process");
const { createStore } = require("./持久化存储_content-store.cjs");
const { createServer } = require("./内容服务_content-server.cjs");
const { publicProjection } = require("./公开投影_public-projection.cjs");

function seed() {
  return { profile:{displayName:"Fixture photographer"}, projects:[{id:"shown-project",status:"Published"},{id:"draft-project",status:"Draft",title:"PRIVATE_PROJECT"}], categories:[{id:"shown",name:"Shown",status:"Published",visibility:"Public"},{id:"hidden",name:"Hidden",status:"Published",visibility:"Hidden",description:"PRIVATE_CATEGORY"}], gallery:[{id:"shown-photo",categoryId:"shown",status:"Published"},{id:"draft-photo",categoryId:"shown",status:"Draft",title:"PRIVATE_GALLERY_DRAFT"},{id:"hidden-photo",categoryId:"hidden",status:"Published",title:"PRIVATE_GALLERY_HIDDEN"}], contact:{contactMethods:[{id:"shown-contact",isVisible:true},{id:"hidden-contact",isVisible:false,title:"PRIVATE_CONTACT"}]}, messages:[{id:"fixture-message",message:"PRIVATE_INBOX",internalNotes:"PRIVATE_NOTES"}], settings:{pageContent:{about:{title:"Fixture about"}},homeCategories:[{categoryId:"shown",title:"Public card"},{categoryId:"hidden",title:"PRIVATE_HOME_CARD"}],homeSelection:[{photoId:"shown-photo"},{photoId:"draft-photo",caption:"PRIVATE_HOME_SELECTION"}],cityContent:{filters:[{value:"all",label:"All"}],photos:[{id:"shown-city",status:"Published"},{id:"legacy-city"},{id:"draft-city",status:"Draft",title:"PRIVATE_CITY"}]},integrations:{contactEnabled:true},contactForm:{minLength:12,maxLength:5000}}, componentVisibility:{} };
}
async function fixture(t) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "wong-local-cms-"));
  const sourceDir = path.join(temp, "source"); const dataDir = path.join(sourceDir, ".local-db");
  await fs.mkdir(path.join(sourceDir, "Home", "assets"), {recursive:true});
  await fs.mkdir(path.join(sourceDir, "admin", "测试_tests"), {recursive:true});
  await fs.mkdir(path.join(sourceDir, "shared"), {recursive:true});
  const html = '<!doctype html><html><head><meta name="cms-mode" content="local"></head><body><main id="homePage">Fixture</main></body></html>';
  await fs.writeFile(path.join(sourceDir, "Home", "index.html"), html);
  await fs.writeFile(path.join(sourceDir, "Home", "styles.css"), "body{}");
  await fs.writeFile(path.join(sourceDir, "admin", "index.html"), html);
  await fs.writeFile(path.join(sourceDir, "admin", "测试_tests", "private.js"), "PRIVATE_TEST_FILE");
  await fs.writeFile(path.join(sourceDir, "shared", "public.js"), "window.fixture=true;");
  let server, origin;
  async function start(initial = seed()) {
    server = createServer({sourceDir,dataDir,seed:initial,username:"fixture-owner",password:"fixture-secret"});
    await new Promise((resolve,reject) => {server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
    origin = `http://127.0.0.1:${server.address().port}`;
  }
  async function stop() { if (server?.listening) await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve())); }
  await start();
  t.after(async()=>{await stop();const relative=path.relative(os.tmpdir(),temp);if(relative.startsWith("..")||path.isAbsolute(relative)||!path.basename(temp).startsWith("wong-local-cms-"))throw new Error("Unsafe fixture cleanup path");await fs.rm(temp,{recursive:true,force:true});});
  async function call(route, {method="GET",value,cookie,bytes,type="application/json",headers={}}={}) {
    const requestHeaders = {...headers};if(cookie)requestHeaders.Cookie=cookie;if(method!=="GET"&&method!=="HEAD"&&!Object.hasOwn(requestHeaders,"Origin"))requestHeaders.Origin=origin;
    if(value!==undefined||bytes!==undefined)requestHeaders["Content-Type"]=type;
    return fetch(origin+route,{method,headers:requestHeaders,body:value===undefined?bytes:JSON.stringify(value),redirect:"manual"});
  }
  async function login() {const response=await call("/api/admin/login",{method:"POST",value:{username:"fixture-owner",password:"fixture-secret"}});assert.equal(response.status,200);const cookie=response.headers.get("set-cookie");assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);return cookie.split(";")[0];}
  async function publicState() {const response=await call("/api/public-state.js");assert.equal(response.status,200);const script=await response.text();const sandbox={window:{}};runInNewContext(script,sandbox);return {script,state:JSON.parse(JSON.stringify(sandbox.window.__CMS_PUBLIC_STATE__)),version:sandbox.window.__CMS_PUBLIC_VERSION__};}
  async function raw(route,headers={}) { const address=new URL(origin);return new Promise((resolve,reject)=>{const request=http.request({host:address.hostname,port:address.port,path:route,headers},response=>{const chunks=[];response.on("data",chunk=>chunks.push(chunk));response.on("end",()=>resolve({status:response.statusCode,text:Buffer.concat(chunks).toString()}));});request.on("error",reject);request.end();}); }
  return {call,login,publicState,raw,sourceDir,dataDir,html,start,stop};
}

test("HTTP HTML markers preserve source, and private/traversal paths never expose files", async t => {
  const f=await fixture(t);const root=await f.call("/");assert.equal(root.status,200);const rootHtml=await root.text();assert.match(rootHtml,/<meta name="cms-mode" content="server">/);assert.match(rootHtml,/<meta name="cms-storage" content="local-server">/);assert.match(rootHtml,/<base href="\/Home\/">/);
  assert.equal(await fs.readFile(path.join(f.sourceDir,"Home","index.html"),"utf8"),f.html);assert.equal(JSON.parse(await fs.readFile(path.join(f.dataDir,"wong-cms.json"),"utf8")).version,0);await assert.rejects(fs.stat(path.join(f.dataDir,"wong-analytics.json")),{code:"ENOENT"});
  assert.equal((await f.call("/Home/styles.css")).status,200);assert.equal((await f.call("/shared/public.js")).status,200);assert.equal((await f.call("/AdminLogin/index.html")).headers.get("location"),"/admin/index.html");assert.equal((await f.call("/Home")).headers.get("location"),"/Home/");
  for(const route of ["/.local-db/wong-cms.json","/20_源码与运行工程/site-deployment/worker/index.js","/.git/config","/start-server.js","/admin/测试_tests/private.js","/Home/%2e%2e/.local-db/wong-cms.json","/Home/..%2f..%2f.git/config","/Home/%5c..%5csecret.js"]){const response=await f.raw(encodeURI(route).replaceAll("%25","%"));assert.equal(response.status,403,route);assert.doesNotMatch(response.text,/PRIVATE_TEST_FILE/);}
  assert.equal((await f.raw("/api/cms-status",{Host:"external.example:80"})).status,403);
});

test("independent HTTP contexts see persisted saves, conflicts and restart recovery without browser storage", async t => {
  const f=await fixture(t);assert.equal((await f.call("/api/admin/state")).status,401);const cookie=await f.login();assert.equal((await f.call("/api/admin/session",{cookie})).status,200);
  assert.deepEqual(await(await f.call("/api/cms-status")).json(),{storage:"local-server",version:0});const current=await(await f.call("/api/admin/state",{cookie})).json();const initialBytes=await fs.readFile(path.join(f.dataDir,"wong-cms.json"));current.state.profile.displayName="Persisted photographer";current.state.settings.pageContent.about.title="Persisted about title";
  assert.deepEqual(await(await f.call("/api/admin/state",{method:"PUT",cookie,value:current})).json(),{version:1});assert.equal((await f.call("/api/admin/state",{method:"PUT",cookie,value:current})).status,409);
  const visible=await f.publicState();assert.equal(visible.state.profile.displayName,"Persisted photographer");assert.equal(visible.state.settings.pageContent.about.title,"Persisted about title");assert.equal(visible.version,1);assert.doesNotMatch(visible.script,/PRIVATE_/);assert.deepEqual(visible.state.messages,[]);assert.equal(Object.hasOwn(visible.state.settings,"cityContent"),false);
  const files=await fs.readdir(path.join(f.dataDir,"recovery"));const backup=files.find(name=>name.endsWith(".json")&&!name.endsWith(".meta.json"));assert.ok(backup);assert.deepEqual(await fs.readFile(path.join(f.dataDir,"recovery",backup)),initialBytes);const metadata=JSON.parse(await fs.readFile(path.join(f.dataDir,"recovery",`${backup}.meta.json`),"utf8"));assert.equal(metadata.sha256,createHash("sha256").update(initialBytes).digest("hex"));
  await f.stop();await f.start({profile:{displayName:"MUST NOT RESEED"}});const restarted=await f.publicState();assert.equal(restarted.state.profile.displayName,"Persisted photographer");assert.equal(restarted.version,1);assert.equal((await f.call("/api/admin/session",{cookie})).status,401);const newCookie=await f.login();const admin=await(await f.call("/api/admin/state",{cookie:newCookie})).json();assert.equal(admin.state.gallery.length,3);assert.equal(admin.state.messages[0].internalNotes,"PRIVATE_NOTES");
  const concurrent=await Promise.all([f.call("/api/admin/state",{method:"PUT",cookie:newCookie,value:admin}),f.call("/api/admin/state",{method:"PUT",cookie:newCookie,value:admin})]);assert.deepEqual(concurrent.map(response=>response.status).sort(),[200,409]);
});

test("contact receipt persists privately, actual image upload works and cross-site writes fail", async t => {
  const f=await fixture(t);const cookie=await f.login();
  assert.equal((await f.call("/api/admin/login",{method:"POST",value:{username:"fixture-owner",password:"fixture-secret"},headers:{Origin:"https://external.example"}})).status,403);assert.equal((await f.call("/api/contact",{method:"POST",value:{},headers:{Origin:"null"}})).status,403);
  const received=await f.call("/api/contact",{method:"POST",value:{name:"Private visitor",email:"private-visitor@example.test",projectType:"portrait",message:"PRIVATE_VISITOR_MESSAGE at least twelve characters"}});assert.equal(received.status,201);assert.equal((await received.json()).received,true);const admin=await(await f.call("/api/admin/state",{cookie})).json();assert.equal(admin.state.messages[0].email,"private-visitor@example.test");assert.equal(admin.state.messages[0].status,"unread");assert.doesNotMatch((await f.publicState()).script,/PRIVATE_|private-visitor@example/);
  const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==","base64");const uploaded=await f.call("/api/admin/upload",{method:"POST",cookie,bytes:png,type:"image/png"});assert.equal(uploaded.status,201);const {url}=await uploaded.json();assert.match(url,/^\/media\/[0-9a-f-]{36}\.png$/);const media=await f.call(url);assert.equal(media.status,200);assert.equal(media.headers.get("content-type"),"image/png");assert.deepEqual(Buffer.from(await media.arrayBuffer()),png);
  assert.equal((await f.call("/api/admin/upload",{method:"POST",cookie,bytes:Buffer.from("not an image"),type:"image/png"})).status,415);assert.equal((await f.call("/api/admin/upload",{method:"POST",cookie,bytes:Buffer.from("<svg/>"),type:"image/svg+xml"})).status,415);assert.equal((await f.call("/api/admin/upload",{method:"POST",cookie,bytes:Buffer.alloc(8000001),type:"image/png"})).status,413);
  assert.equal((await f.call("/api/admin/logout",{method:"POST",cookie})).status,200);assert.equal((await f.call("/api/admin/state",{cookie})).status,401);
});

test("corrupt saved JSON is reported and never replaced by defaults or a new save", async t => {
  const f=await fixture(t);const cookie=await f.login();const initial=await(await f.call("/api/admin/state",{cookie})).json();const filename=path.join(f.dataDir,"wong-cms.json");const broken=Buffer.from('{"state":broken');await fs.writeFile(filename,broken);
  const response=await f.call("/api/public-state.js");assert.equal(response.status,503);assert.match((await response.json()).error,/原文件已保留/);assert.equal((await f.call("/api/admin/state",{method:"PUT",cookie,value:initial})).status,503);assert.deepEqual(await fs.readFile(filename),broken);
});

test("message deletion requires same-origin authentication and valid identity/version without writes on failure", async t => {
  const f = await fixture(t);
  const route = "/api/admin/messages/fixture-message";
  assert.equal((await f.call(route, { method:"DELETE", value:{version:0} })).status, 401);
  const cookie = await f.login();
  const before = await (await f.call("/api/admin/state", {cookie})).json();
  const bytes = await fs.readFile(path.join(f.dataDir, "wong-cms.json"));
  assert.equal((await f.call(route, {method:"DELETE", cookie, value:{version:0}, headers:{Origin:"https://external.example"}})).status, 403);
  for (const value of [{}, {version:-1}, {version:0.5}, {version:"0"}, {version:Number.MAX_SAFE_INTEGER + 1}]) assert.equal((await f.call(route, {method:"DELETE", cookie, value})).status, 400);
  for (const id of ["", "a".repeat(161), encodeURIComponent("bad/id"), "%"]) assert.equal((await f.call("/api/admin/messages/" + id, {method:"DELETE", cookie, value:{version:0}})).status, 400);
  assert.equal((await f.call("/api/admin/messages/missing", {method:"DELETE", cookie, value:{version:0}})).status, 404);
  assert.equal((await f.call(route, {method:"DELETE", cookie, value:{version:1}})).status, 409);
  assert.deepEqual(await (await f.call("/api/admin/state", {cookie})).json(), before);
  assert.deepEqual(await fs.readFile(path.join(f.dataDir, "wong-cms.json")), bytes);
  await assert.rejects(fs.stat(path.join(f.dataDir, "recovery")), {code:"ENOENT"});
});

test("message deletion persists only the selected removal, retains recovery, and rejects resurrection from an old snapshot", async t => {
  const f = await fixture(t); const cookie = await f.login();
  assert.equal((await f.call("/api/contact", {method:"POST", value:{name:"Another fixture visitor", email:"another@example.test", message:"A different generated message must remain."}})).status, 201);
  const before = await (await f.call("/api/admin/state", {cookie})).json();
  const previousBytes = await fs.readFile(path.join(f.dataDir, "wong-cms.json"));
  const response = await f.call("/api/admin/messages/fixture-message", {method:"DELETE", cookie, value:{version:before.version}});
  assert.equal(response.status, 200); const result = await response.json();
  const expected = structuredClone(before.state); expected.messages = expected.messages.filter(message => message.id !== "fixture-message");
  assert.deepEqual(result, {deleted:true, id:"fixture-message", state:expected, version:before.version + 1});
  assert.deepEqual(await (await f.call("/api/admin/state", {cookie})).json(), {state:expected, version:result.version});
  assert.equal((await f.call("/api/admin/state", {method:"PUT", cookie, value:before})).status, 409);
  assert.equal((await f.call("/api/admin/messages/fixture-message", {method:"DELETE", cookie, value:{version:result.version}})).status, 404);
  const backups = await fs.readdir(path.join(f.dataDir, "recovery"));
  const backup = backups.find(name => name.endsWith(".json") && !name.endsWith(".meta.json") && name.includes(`_v${before.version}_`));
  assert.ok(backup); assert.deepEqual(await fs.readFile(path.join(f.dataDir, "recovery", backup)), previousBytes);
  await f.stop(); await f.start(); const reopenedCookie = await f.login();
  assert.deepEqual(await (await f.call("/api/admin/state", {cookie:reopenedCookie})).json(), {state:expected, version:result.version});
});

test("concurrent incoming contact and message deletion never lose the new message", async t => {
  const f = await fixture(t); const cookie = await f.login();
  const before = await (await f.call("/api/admin/state", {cookie})).json();
  const [deletion, incoming] = await Promise.all([
    f.call("/api/admin/messages/fixture-message", {method:"DELETE", cookie, value:{version:before.version}}),
    f.call("/api/contact", {method:"POST", value:{name:"Concurrent fixture", email:"concurrent@example.test", message:"A concurrent generated message must never be discarded."}})
  ]);
  assert.equal(incoming.status, 201); const received = await incoming.json();
  assert.ok([200, 409].includes(deletion.status));
  let current = await (await f.call("/api/admin/state", {cookie})).json();
  assert.ok(current.state.messages.some(message => message.id === received.id));
  if (deletion.status === 409) {
    assert.ok(current.state.messages.some(message => message.id === "fixture-message"));
    const retry = await f.call("/api/admin/messages/fixture-message", {method:"DELETE", cookie, value:{version:current.version}});
    assert.equal(retry.status, 200); current = await (await f.call("/api/admin/state", {cookie})).json();
  }
  assert.equal(current.version, before.version + 2);
  assert.deepEqual(current.state.messages.map(message => message.id), [received.id]);
  const expected = structuredClone(before.state); expected.messages = current.state.messages;
  assert.deepEqual(current.state, expected);
});

test("message deletion decodes encoded legacy IDs once and matches numeric IDs as strings", async t => {
  const f = await fixture(t); const cookie = await f.login();
  let current = await (await f.call("/api/admin/state", {cookie})).json();
  current.state.messages = [{id:"legacy % value", message:"Legacy encoded fixture"}, {id:42, message:"Numeric fixture"}];
  assert.equal((await f.call("/api/admin/state", {method:"PUT", cookie, value:current})).status, 200);
  const encoded = await f.call("/api/admin/messages/" + encodeURIComponent("legacy % value"), {method:"DELETE", cookie, value:{version:1}});
  assert.equal(encoded.status, 200); assert.deepEqual((await encoded.json()).state.messages, [{id:42, message:"Numeric fixture"}]);
  const numeric = await f.call("/api/admin/messages/42", {method:"DELETE", cookie, value:{version:2}});
  assert.equal(numeric.status, 200); assert.deepEqual((await numeric.json()).state.messages, []);
});

test("public projection leaves the complete input unchanged", () => {
  const state=seed();state.projects[0].status=" Published ";state.gallery[0].status=" Published ";state.categories[0].status=" Published ";state.categories[0].visibility=" Public ";state.settings.cityContent.photos[0].status=" Public ";const before=structuredClone(state);const visible=publicProjection(state);assert.deepEqual(state,before);assert.equal(Object.hasOwn(visible.settings,"cityContent"),false);assert.equal(state.settings.cityContent.photos.length,3);assert.deepEqual(visible.gallery.map(photo=>photo.id),["shown-photo"]);assert.deepEqual(visible.settings.homeSelection,[{photoId:"shown-photo"}]);
});


async function concurrentProcesses(dataDir, mode) {
  const program = `
    const { createStore } = require(process.argv[1]);
    const store = createStore({dataDir:process.argv[2],seed:JSON.parse(process.argv[5])});
    let current;
    const timer=setTimeout(()=>{process.exitCode=1;process.disconnect();},10000);timer.unref();
    function finish(message){clearTimeout(timer);process.send(message,()=>process.disconnect());}
    process.on('message',async message=>{if(message!=='go')return;try{
      let result;
      if(process.argv[3]==='save'){current.state.profile.displayName=process.argv[4];result=await store.save(current.state,current.version);}
      else result=await store.addMessage({id:process.argv[4],name:process.argv[4],message:'A real child-process message.',status:'unread'});
      finish({type:'result',status:200,version:result.version});
    }catch(error){finish({type:'result',status:error.status||500,error:error.message});}});
    store.read().then(document=>{current=document;process.send({type:'ready',version:document.version});}).catch(error=>finish({type:'result',status:error.status||500,error:error.message}));
  `;
  const workers=["child-first","child-second"].map(name=>{
    const child=spawn(process.execPath,["-e",program,path.join(__dirname,"持久化存储_content-store.cjs"),dataDir,mode,name,JSON.stringify(seed())],{stdio:["ignore","ignore","pipe","ipc"]});
    let diagnostic="";child.stderr.on("data",chunk=>{diagnostic+=chunk;});
    let readyResolve,readyReject,resultResolve,resultReject;
    const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
    const result=new Promise((resolve,reject)=>{resultResolve=resolve;resultReject=reject;});
    let received=false;
    child.on("error",error=>{readyReject(error);resultReject(error);});
    child.on("message",message=>{if(message.type==="ready")readyResolve(message);if(message.type==="result"){received=true;resultResolve(message);readyReject(new Error(message.error||"Child exited before read barrier"));}});
    const exited=new Promise((resolve,reject)=>child.on("exit",code=>{if(!received){const error=new Error(`Child stopped before completion: ${code} ${diagnostic}`);readyReject(error);resultReject(error);}resolve(code);}));
    return {child,ready,result,exited};
  });
  const versions=await Promise.all(workers.map(worker=>worker.ready));
  assert.equal(versions[0].version,versions[1].version,"Both independent Node processes must reach the same-version barrier");
  workers.forEach(worker=>worker.child.send("go"));
  const results=await Promise.all(workers.map(worker=>worker.result));
  await Promise.all(workers.map(worker=>worker.exited));
  return results;
}

test("independent Node processes serialize same-version writes and retain both incoming messages", async t => {
  const f=await fixture(t);
  const writes=await concurrentProcesses(f.dataDir,"save");
  assert.deepEqual(writes.map(result=>result.status).sort(),[200,409]);
  const store=createStore({dataDir:f.dataDir,seed:seed()});const afterSave=await store.read();assert.equal(afterSave.version,1);assert.ok(["child-first","child-second"].includes(afterSave.state.profile.displayName));
  const messages=await concurrentProcesses(f.dataDir,"message");
  assert.deepEqual(messages.map(result=>result.status),[200,200]);
  const afterMessages=await store.read();assert.equal(afterMessages.version,3);assert.equal(afterMessages.state.messages.filter(message=>["child-first","child-second"].includes(message.id)).length,2);assert.equal(afterMessages.state.messages.length,3);
  await assert.rejects(fs.stat(path.join(f.dataDir,"wong-cms.write-lock")),{code:"ENOENT"});
});

test("malformed and abandoned process locks preserve data and support rename-based recovery", async t => {
  const f=await fixture(t);assert.equal((await f.call("/api/cms-status")).status,200);const filename=path.join(f.dataDir,"wong-cms.json");const original=await fs.readFile(filename);const lock=path.join(f.dataDir,"wong-cms.write-lock");
  await fs.mkdir(lock);await fs.writeFile(path.join(lock,"owner.json"),"broken owner JSON");const earlier=new Date(Date.now()-2000);await fs.utimes(lock,earlier,earlier);
  const malformed=await f.call("/api/cms-status");assert.equal(malformed.status,503);assert.match((await malformed.json()).error,/写锁不完整/);assert.deepEqual(await fs.readFile(filename),original);assert.equal(await fs.readFile(path.join(lock,"owner.json"),"utf8"),"broken owner JSON");
  await fs.rename(lock,path.join(f.dataDir,"保留故障锁_preserved-bad-lock"));assert.equal((await f.call("/api/cms-status")).status,200);
  const exited=spawn(process.execPath,["-e",""],{stdio:"ignore"});const deadPid=exited.pid;await new Promise((resolve,reject)=>{exited.on("error",reject);exited.on("exit",resolve);});
  await fs.mkdir(lock);await fs.writeFile(path.join(lock,"owner.json"),JSON.stringify({pid:deadPid,token:randomUUID(),acquiredAt:new Date().toISOString()}));
  const abandoned=await f.call("/api/cms-status");assert.equal(abandoned.status,503);assert.match((await abandoned.json()).error,/遗留的内容写锁/);assert.deepEqual(await fs.readFile(filename),original);assert.equal(JSON.parse(await fs.readFile(path.join(lock,"owner.json"),"utf8")).pid,deadPid);
  await fs.rename(lock,path.join(f.dataDir,"保留遗留锁_preserved-abandoned-lock"));assert.equal((await f.call("/api/cms-status")).status,200);assert.deepEqual(await fs.readFile(filename),original);
});


test("cross-site API reads are denied while same-origin browsers and headerless local tools remain usable", async t => {
  const f=await fixture(t);await f.call("/api/cms-status");const filename=path.join(f.dataDir,"wong-cms.json");const before=await fs.readFile(filename);
  for(const headers of [{"Sec-Fetch-Site":"cross-site"},{"Sec-Fetch-Site":"same-site"},{Origin:"https://external.example"}]) {
    const denied=await f.call("/api/public-state.js",{headers});assert.equal(denied.status,403);assert.equal(denied.headers.get("cross-origin-resource-policy"),"same-origin");assert.doesNotMatch(await denied.text(),/Fixture photographer/);
  }
  const sameOrigin=await f.call("/api/public-state.js",{headers:{"Sec-Fetch-Site":"same-origin"}});assert.equal(sameOrigin.status,200);assert.equal(sameOrigin.headers.get("cross-origin-resource-policy"),"same-origin");assert.equal((await f.raw("/api/public-state.js")).status,200);assert.deepEqual(await fs.readFile(filename),before);
});

test("invalid model records are rejected before writing, corrupt valid-JSON models are preserved, and legacy documents still work", async t => {
  const f=await fixture(t);const cookie=await f.login();const initial=await(await f.call("/api/admin/state",{cookie})).json();const filename=path.join(f.dataDir,"wong-cms.json");const original=await fs.readFile(filename);
  const invalid=[{projects:[{photoIds:"bad"}]},{projects:[{photoIds:[7]}]},{projects:[{photoIds:["same","same"]}]},{gallery:[null]},{gallery:[17]},{gallery:"wrong"},{gallery:{}},{profile:[]},{settings:null},{contact:"wrong"},{projects:[false]},{messages:[null]},{categories:[[]]},{settings:{cityContent:{photos:[null]}}},{settings:{pageContent:{about:null}}},{profile:{timeline:[null]}},{settings:{navigation:["not a record"]}}];
  for(const state of invalid){const response=await f.call("/api/admin/state",{method:"PUT",cookie,value:{state,version:initial.version}});assert.equal(response.status,400,JSON.stringify(state));assert.match((await response.json()).error,/结构无效/);assert.deepEqual(await fs.readFile(filename),original);}
  assert.equal((await f.call("/api/public-state.js")).status,200);assert.deepEqual(await(await f.call("/api/admin/state",{cookie})).json(),initial);
  const broken=JSON.parse(original.toString("utf8"));broken.state.gallery=[null];const brokenBytes=Buffer.from(JSON.stringify(broken));await fs.writeFile(filename,brokenBytes);
  const failedRead=await f.call("/api/public-state.js");assert.equal(failedRead.status,503);assert.match((await failedRead.json()).error,/原文件已保留/);assert.equal((await f.call("/api/admin/state",{method:"PUT",cookie,value:initial})).status,503);assert.deepEqual(await fs.readFile(filename),brokenBytes);
  await fs.writeFile(filename,original);
  const legacy={profile:{displayName:"Legitimate legacy document"},gallery:[],settings:{customLegacyMetadata:17}};
  assert.deepEqual(await(await f.call("/api/admin/state",{method:"PUT",cookie,value:{state:legacy,version:0}})).json(),{version:1});assert.equal((await f.publicState()).state.profile.displayName,"Legitimate legacy document");assert.deepEqual((await(await f.call("/api/admin/state",{cookie})).json()).state,legacy);
  assert.equal((await f.call("/api/contact",{method:"POST",value:{name:"After recovery",email:"recovered@example.test",message:"The recovered document can still receive this message."}})).status,201);assert.equal((await(await f.call("/api/admin/state",{cookie})).json()).version,2);
});


test("public HTML contains saved SEO metadata without executing JavaScript and admin/body retain original content",async t=>{
  const f=await fixture(t);const cookie=await f.login();
  const html='<!doctype html><html><head><title>Original source title</title><meta name="description" content="Original source description"></head><body><h1>Visible body unchanged</h1><script>window.bodyMarker="keep";</script></body></html>';
  const routes={home:"Home",about:"about",projects:"Project",photography:"photography",contact:"Contact"};
  for(const folder of Object.values(routes)){await fs.mkdir(path.join(f.sourceDir,folder),{recursive:true});await fs.writeFile(path.join(f.sourceDir,folder,"index.html"),html);}
  const current=await(await f.call("/api/admin/state",{cookie})).json();current.state.settings.pageSeo=Object.fromEntries(Object.keys(routes).map(page=>[page,{title:"Saved SEO "+page+" <&>",description:"Search description "+page,ogImage:"../Home/assets/example.png"}]));
  assert.equal((await f.call("/api/admin/state",{method:"PUT",cookie,value:current})).status,200);
  for(const [page,folder]of Object.entries(routes)){
    const response=await f.call("/"+folder+"/index.html?ignored=secret");const output=await response.text();assert.equal(response.status,200);assert.match(output,new RegExp("<title>Saved SEO "+page+" &lt;&amp;&gt;</title>"));assert.match(output,new RegExp('name="description" content="Search description '+page+'"'));assert.match(output,/<meta property="og:image" content="http:\/\/127\.0\.0\.1:/);assert.equal(output.slice(output.indexOf("<body>")),html.slice(html.indexOf("<body>")));assert.equal(response.headers.get("cache-control"),"no-store");assert.doesNotMatch(output,/ignored=secret/);
  }
  const admin=await(await f.call("/admin/index.html")).text();assert.doesNotMatch(admin,/Saved SEO|og:title/);
  const clear=await(await f.call("/api/admin/state",{cookie})).json();clear.state.settings.pageSeo.home={title:"",description:"",ogImage:""};await f.call("/api/admin/state",{method:"PUT",cookie,value:clear});const fallback=await(await f.call("/Home/index.html")).text();assert.match(fallback,/<title>Original source title<\/title>/);assert.match(fallback,/content="Original source description"/);await assert.rejects(fs.stat(path.join(f.dataDir,"wong-analytics.json")),{code:"ENOENT"});
});
test("public comparison entries exclude unpublished and hidden gallery links without altering admin records",async t=>{
  const f=await fixture(t);const cookie=await f.login();const current=await(await f.call("/api/admin/state",{cookie})).json();current.state.settings.homeComparison={beforeImage:"legacy-pair.png",entries:[{photoId:"shown-photo",beforeImage:"public-before.png"},{photoId:"draft-photo",beforeImage:"PRIVATE_DRAFT_BEFORE.png"},{photoId:"hidden-photo",beforeImage:"PRIVATE_HIDDEN_BEFORE.png"},{photoId:"missing-photo",beforeImage:"PRIVATE_MISSING_BEFORE.png"}]};
  assert.equal((await f.call("/api/admin/state",{method:"PUT",cookie,value:current})).status,200);const output=await f.publicState();assert.doesNotMatch(output.script,/PRIVATE_.*BEFORE/);assert.deepEqual(output.state.settings.homeComparison.entries,[{photoId:"shown-photo",beforeImage:"public-before.png"}]);assert.equal(output.state.settings.homeComparison.beforeImage,"legacy-pair.png");const admin=await(await f.call("/api/admin/state",{cookie})).json();assert.equal(admin.state.settings.homeComparison.entries.length,4);
  admin.state.settings.homeComparison.entries=[null];assert.equal((await f.call("/api/admin/state",{method:"PUT",cookie,value:admin})).status,400);
});


test("project photo references retain admin order but never expose draft or hidden-category links",async t=>{
 const f=await fixture(t),cookie=await f.login();const current=await(await f.call('/api/admin/state',{cookie})).json();current.state.projects[0].photoIds=['hidden-photo','shown-photo','draft-photo'];
 assert.equal((await f.call('/api/admin/state',{method:'PUT',cookie,value:current})).status,200);const publicData=await f.publicState();assert.deepEqual(publicData.state.projects[0].photoIds,['shown-photo']);assert.doesNotMatch(publicData.script,/draft-photo|hidden-photo/);assert.deepEqual((await(await f.call('/api/admin/state',{cookie})).json()).state.projects[0].photoIds,['hidden-photo','shown-photo','draft-photo']);
});

test("legacy CityHuman redirects keep original assets and saved content while public data retains the current city category",async t=>{
  const f=await fixture(t),cookie=await f.login();const current=await(await f.call("/api/admin/state",{cookie})).json();
  current.state.settings.pageContent.city={headline:"RETIRED_CITY_HEADLINE"};current.state.settings.pageSeo={city:{title:"RETIRED_CITY_SEO"}};current.state.componentVisibility.city={archive:true};
  current.state.categories.push({id:"city-humanity",name:"City Humanity",status:"Published",visibility:"Public"});current.state.gallery.push({id:"current-city-photo",categoryId:"city-humanity",status:"Published",displayScopes:["overview","city-humanity"]});
  assert.equal((await f.call("/api/admin/state",{method:"PUT",cookie,value:current})).status,200);
  await fs.mkdir(path.join(f.sourceDir,"CityHuman","assets"),{recursive:true});const asset=Buffer.from("retained-city-asset");await fs.writeFile(path.join(f.sourceDir,"CityHuman","assets","original.png"),asset);
  const filename=path.join(f.dataDir,"wong-cms.json"),before=await fs.readFile(filename);
  for(const route of ["/CityHuman","/CityHuman/","/CityHuman/index.html","/cityhuman/index.html?old=1"]){for(const method of ["GET","HEAD"]){const response=await f.call(route,{method});assert.equal(response.status,302,route);assert.equal(response.headers.get("location"),"/photography/index.html?category=city-humanity");assert.equal(response.headers.get("cache-control"),"no-store");}}
  const response=await f.call("/CityHuman/assets/original.png");assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),asset);
  const visible=await f.publicState();assert.equal(Object.hasOwn(visible.state.settings,"cityContent"),false);assert.equal(Object.hasOwn(visible.state.settings.pageContent,"city"),false);assert.equal(Object.hasOwn(visible.state.settings.pageSeo,"city"),false);assert.equal(Object.hasOwn(visible.state.componentVisibility,"city"),false);assert.doesNotMatch(visible.script,/RETIRED_CITY/);assert.ok(visible.state.gallery.some(photo=>photo.id==="current-city-photo"));assert.ok(visible.state.categories.some(category=>category.id==="city-humanity"));
  const admin=await(await f.call("/api/admin/state",{cookie})).json();assert.deepEqual(admin.state.settings.cityContent,current.state.settings.cityContent);assert.deepEqual(admin.state.settings.pageContent.city,current.state.settings.pageContent.city);assert.deepEqual(await fs.readFile(filename),before);await assert.rejects(fs.stat(path.join(f.dataDir,"wong-analytics.json")),{code:"ENOENT"});
});
