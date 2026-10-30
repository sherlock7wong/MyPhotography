"use strict";
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const projectRoot=path.resolve(__dirname,'../../..');
const {createServer}=require(path.join(projectRoot,'start-server.js'));
const seed=require(path.join(projectRoot,'20_源码与运行工程/shared/site-content.js'));
const evidence=path.join(projectRoot,'40_测试与验收证据/后台数据对齐_admin-data-alignment_2026-10-21');
const temporary=path.join(projectRoot,'99_临时文件、缓存和构建中间产物/后台数据对齐_admin-data-alignment_2026-10-21');
const checks=[];const errors=[];
const pass=name=>{checks.push({name,passed:true});console.log("PASS "+name);};
async function fill(page,key,value){const field=page.locator('[data-bind="'+key+'"]');await field.evaluate(n=>{if(n.closest('details'))n.closest('details').open=true;});await field.fill(value);}
async function save(page){await page.locator('[data-action="save-current"]').click();await page.locator('#unsavedNotice').waitFor({state:'hidden'});assert.match(await page.locator('#toast').textContent(),/本页已保存到本机网站/);}
async function navigate(page,id){await page.locator('#sidebarNav [data-view-link="'+id+'"]').click();await page.waitForFunction(view=>location.hash==='#'+view&&document.querySelector('#viewRoot [data-bind]'),id);}
async function run(){
fs.mkdirSync(evidence,{recursive:true});fs.mkdirSync(temporary,{recursive:true});
const dataDir=fs.mkdtempSync(path.join(temporary,'真实接口联调_real-api-'));
const service=createServer({dataDir,seed:structuredClone(seed),username:'local-regression',password:'regression-only-password'});
await new Promise(resolve=>service.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+service.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.CMS_TEST_BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
const editor=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const visitor=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
for(const context of [editor,visitor]){context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());}
// Existing browser storage and an old per-tab mode must not become the shared website's data.
await editor.addInitScript(()=>{if(location.protocol==='http:'){sessionStorage.setItem('wong.cms.mode','local');localStorage.setItem('wong.cms.data',JSON.stringify({profile:{displayName:'旧浏览器稿件_保留'}}));}});
await visitor.addInitScript(()=>{if(location.protocol==='http:')localStorage.setItem('wong.cms.data',JSON.stringify({profile:{displayName:'另一浏览器的旧稿'}}));});
const admin=await editor.newPage();const front=await visitor.newPage();
await admin.goto(base+'/admin/index.html#about');assert.equal(await admin.locator('#dataMode').inputValue(),'server');
await admin.locator('#loginUsername').fill('local-regression');await admin.locator('#loginPassword').fill('regression-only-password');await admin.getByRole('button',{name:'登录',exact:true}).click();await admin.locator('#adminShell').waitFor({state:'visible'});
const counts={};
for(const [id,dir]of Object.entries({home:'Home',about:'about',projects:'Project',photography:'photography',city:'CityHuman',contact:'Contact'})){
 await navigate(admin,id);await front.goto(base+'/'+dir+'/index.html');
 const editorFields=await admin.evaluate(id=>cmsPages.pages[id].groups.flatMap(group=>group.fields).flatMap(field=>{const input=document.querySelector('[data-bind="settings.pageContent.'+id+'.'+field.key+'"]');return input?[{key:field.key,value:input.value}]:[];}),id);
 const differences=await front.evaluate(({id,expected})=>expected.flatMap(({key,value})=>{const definition=cmsPages.pages[id].groups.flatMap(group=>group.fields).find(field=>field.key===key);const actual=cmsPages.readField(document,definition);return actual===value?[]:[{key,value,actual}];}),{id,expected:editorFields});
 assert.deepEqual(differences,[],id+' editor values must equal the rendered public page');counts[id]=editorFields.length;
}
assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),218);pass('All 218 initial editor field values match their actual rendered front pages across six routes');
await navigate(admin,'about');await front.goto(base+'/about/index.html');
assert.equal(await front.locator('.archive-photo img').getAttribute('src'),seed.profile.avatar);
assert.equal(await front.locator('.bio-block p').count(),3);assert.equal(await front.locator('.skills-block li').count(),9);assert.equal(await front.locator('[data-timeline-card]').count(),6);
assert.equal(await front.locator('.archive-meta b').first().textContent(),'May 2025');
assert.equal(await admin.locator('[data-bind="profile.biography"]').inputValue(),seed.profile.biography);
assert.equal(await admin.locator('[data-bind="profile.tags"]').inputValue(),seed.profile.tags.join('\n'));
assert.equal(await admin.locator('[data-bind="profile.avatar"]').inputValue(),await front.locator('.archive-photo img').getAttribute('src'));
assert.ok(await admin.locator('#legacyDataNotice').isVisible());
pass('Current About source remains complete: original portrait, 3 biography paragraphs, 9 skills, 6 timeline records and own update date; editor reads the same model');
await fill(admin,'profile.displayName','共享网站姓名_验证');await fill(admin,'profile.location','共享网站地点_验证');
await fill(admin,'profile.biography','第一段来自网站共享内容。\n\n第二段在独立浏览器同步。\n\n第三段保留完整。');
await fill(admin,'profile.avatar','../Home/assets/portrait.png');await fill(admin,'settings.pageContent.about.title','关于页面共享标题');
await fill(admin,'settings.pageContent.about.updated','2026-10-21');await fill(admin,'settings.pageContent.about.portraitAlt','当前网站肖像说明');
await save(admin);await front.reload();
assert.equal(await front.locator('#about-title').textContent(),'关于页面共享标题');assert.equal(await front.locator('.info-list dd').first().textContent(),'共享网站姓名_验证');
assert.equal(await front.locator('.info-list dd').nth(2).textContent(),'共享网站地点_验证');assert.equal(await front.locator('.archive-photo img').getAttribute('src'),'../Home/assets/portrait.png');
assert.equal(await front.locator('.archive-photo img').getAttribute('alt'),'当前网站肖像说明');assert.equal(await front.locator('.archive-meta b').first().textContent(),'2026-10-21');assert.equal(await front.locator('.bio-block p').count(),3);
assert.equal(await visitor.cookies().then(c=>c.length),0);assert.equal(await front.evaluate(()=>JSON.parse(localStorage.getItem('wong.cms.data')).profile.displayName),'另一浏览器的旧稿');
assert.equal(await admin.evaluate(()=>JSON.parse(localStorage.getItem('wong.cms.data')).profile.displayName),'旧浏览器稿件_保留');
pass('Actual editor save reaches a separate BrowserContext through HTTP, without shared cookies or localStorage; legacy browser data is preserved');
await admin.locator('[data-file-bind="profile.avatar"]').setInputFiles(path.join(projectRoot,'20_源码与运行工程/Home/assets/portrait.png'));
await admin.waitForFunction(()=>document.querySelector('[data-bind="profile.avatar"]').value.startsWith('/media/'));
await save(admin);await front.reload();assert.match(await front.locator('.archive-photo img').getAttribute('src'),/^\/media\//);await front.locator('.archive-photo img').evaluate(image=>image.decode());
pass('Real editor file upload is saved as server media and decoded by the separate public browser');
await admin.reload();await admin.locator('#adminShell').waitFor({state:'visible'});assert.equal(await admin.locator('[data-bind="profile.displayName"]').inputValue(),'共享网站姓名_验证');
pass('Reloaded editor reads the persisted website data instead of stale HTML or browser defaults');
await navigate(admin,'projects');await fill(admin,'projects.0.theme','项目主题独立编辑_验证');await save(admin);await front.goto(base+'/Project/index.html');assert.equal(await front.locator('.project-tag').first().textContent(),'项目主题独立编辑_验证');
pass('Project theme changes are visible even when the card has an associated category');
await navigate(admin,'photography');
for(const [scope,count] of [['overview',11],['portrait',8],['landscape',10],['personal',10]]){await front.goto(base+'/photography/index.html'+(scope==='overview'?'':'?category='+scope));assert.equal(await front.locator('[data-gallery-grid] [data-photo-id]').count(),count,scope+' original gallery scope');}
const rowIndex=seed.gallery.findIndex(photo=>photo.displayScopes.includes('portrait'));
await admin.locator('[data-gallery-id="'+seed.gallery[rowIndex].id+'"]').click();await fill(admin,'gallery.'+rowIndex+'.title','人像分类专属作品_验证');await save(admin);
await front.goto(base+'/photography/index.html?category=portrait');assert.match(await front.locator('[data-gallery-grid]').textContent(),/人像分类专属作品_验证/);await front.goto(base+'/photography/index.html');assert.doesNotMatch(await front.locator('[data-gallery-grid]').textContent(),/人像分类专属作品_验证/);
pass('Original photography sets stay separate (11/8/10/10), and the editor identifies which front page each saved work belongs to');
const currentReply=await editor.request.get(base+'/api/admin/state');const current=await currentReply.json();
current.state.categories.push({id:'scope-check',name:'Scope Check',status:'Published',visibility:'Public',sortOrder:99});
current.state.gallery.push({id:'overview-only-scope-check',title:'只在总览显示的作品',image:'../Home/assets/personal.png',categoryId:'scope-check',category:'Scope Check',displayScopes:['overview'],status:'Published',sortOrder:999});
const scopeWrite=await editor.request.put(base+'/api/admin/state',{headers:{Origin:base},data:current});assert.equal(scopeWrite.status(),200);
await front.goto(base+'/photography/index.html?category=scope-check');assert.equal(await front.locator('[data-gallery-grid] [data-photo-id]').count(),0);
pass('An explicitly overview-only work stays out of its associated category, including an otherwise empty custom category');
await navigate(admin,'home');await fill(admin,'settings.homeHero.heroHeadline','首页共享保存_验证');await save(admin);await front.goto(base+'/Home/index.html');assert.equal(await front.locator('#home-title').textContent(),'首页共享保存_验证');
await navigate(admin,'city');await fill(admin,'settings.pageContent.city.title','城市页共享保存_验证');await save(admin);await front.goto(base+'/CityHuman/index.html');assert.equal(await front.locator('#city-title').textContent(),'城市页共享保存_验证');
await navigate(admin,'contact');await fill(admin,'contact.page.title','联系页共享保存_验证');await save(admin);await front.goto(base+'/Contact/index.html');assert.equal(await front.locator('#contact-title').textContent(),'联系页共享保存_验证');
pass('Home, City Humanity and Contact edits also reach the independent public browser through the same persisted API');
await front.goto(base+'/Contact/index.html');await front.locator('#name').fill('独立浏览器访客');await front.locator('#email').fill('shared-cms@example.test');await front.locator('#message').fill('这条留言通过真实本机接口保存在同一个网站收件箱中。');const contactReply=front.waitForResponse(r=>r.url()===base+'/api/contact'&&r.request().method()==='POST');await front.locator('.submit-button').click();const received=await contactReply;assert.equal(received.status(),201);assert.equal((await received.json()).received,true);await front.locator('[data-toast]').waitFor({state:'visible'});
await navigate(admin,'messages');assert.match(await admin.locator('.entity-rail').textContent(),/独立浏览器访客/);
const publicScript=await visitor.request.get(base+'/api/public-state.js');assert.doesNotMatch(await publicScript.text(),/shared-cms@example.test/);
pass('A real public contact submission reaches the authenticated inbox across browser contexts, and public data excludes its private details');
await admin.goto(base+'/admin/index.html#about');await admin.locator('#adminShell').waitFor({state:'visible'});await admin.screenshot({path:path.join(evidence,'共享后台关于页_shared-admin-about.png'),fullPage:false});
await front.goto(base+'/about/index.html');await front.screenshot({path:path.join(evidence,'独立浏览器关于页_shared-public-about.png'),fullPage:false});
for(const width of [1440,390]){await admin.setViewportSize({width,height:900});await front.setViewportSize({width,height:900});assert.ok(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await front.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
pass('Shared backend and public About page fit desktop and 390px mobile screens');
assert.deepEqual(errors,[]);await editor.close();await visitor.close();
}finally{await browser.close();await new Promise(resolve=>service.close(resolve));}
const service2=createServer({dataDir,seed:structuredClone(seed),username:'local-regression',password:'regression-only-password'});
await new Promise(resolve=>service2.listen(0,'127.0.0.1',resolve));
try{const response=await fetch('http://127.0.0.1:'+service2.address().port+'/api/public-state.js');assert.match(await response.text(),/共享网站姓名_验证/);pass('Website content survives a real server restart');}finally{await new Promise(resolve=>service2.close(resolve));}
const result={checks,pageErrors:errors,realHttp:true,separateBrowserContexts:true,productionRequests:false};fs.writeFileSync(path.join(evidence,'共享数据联调结果_shared-data-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}
run().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
