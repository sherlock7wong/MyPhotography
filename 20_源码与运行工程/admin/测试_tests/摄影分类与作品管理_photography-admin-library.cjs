const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
const {createServer,publicProjection}=require("../../本地服务_local-server/内容服务_content-server.cjs");
const seed=structuredClone(require("../../shared/site-content.js"));
const sourceDir=path.resolve(__dirname,"../.."),root=path.resolve(sourceDir,"..");
const topic="摄影分类与作品管理_photography-admin-library_2026-10-24";
const stamp=new Date().toISOString().replace(/[-:.TZ]/g,"");
const evidence=path.join(root,"40_测试与验收证据",topic,"运行_run_"+stamp);
const temporary=path.join(root,"99_临时文件、缓存和构建中间产物",topic);
const cases=new Set((process.env.CMS_LIBRARY_CASES||"").split(",").filter(Boolean));
const checks=[],pageErrors=[];
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64");
const testFile=name=>({name,mimeType:"image/png",buffer:png});
let currentCase="initialization",base,dataDir,browser,server,admin,front;

function prepareSeed(){
 const sources=seed.categories.map(c=>seed.gallery.find(p=>p.categoryId===c.id)||seed.gallery[0]);
 seed.gallery=Array.from({length:1000},(_,i)=>{const c=seed.categories[i%4];return{
  ...structuredClone(sources[i%4]),id:"library-"+String(i+1).padStart(4,"0"),title:"隔离作品 "+String(i+1).padStart(4,"0"),
  description:"仅用于摄影库分页回归的合成记录",categoryId:c.id,category:c.name,
  status:i%13===0?"Draft":i%17===0?"Archived":"Published",displayScopes:i===995?[c.id]:["overview",c.id],
  sortOrder:i+1,featured:[4,980,994,995].includes(i),year:2000+i%20,layout:"normal",location:"隔离测试地点"
 };});
 seed.messages=[{id:"legacy-message-library",name:"隔离旧留言",email:"legacy@example.test",projectType:"Editorial",message:"保留旧版带项目类型留言供兼容回归验证。",status:"unread",internalNotes:"",createdAt:"2026-10-23T12:00:00.000Z"}];
 seed.settings.integrations.refreshSeconds=0;
 seed.settings.photographyView.defaultSort="latest";seed.settings.photographyView.defaultView="grid";
 seed.settings.cityContent.defaultFilter="all";
}
async function ready(page){await page.waitForFunction(()=>window.cmsStore&&!document.querySelector("[data-cms-loading]"));await page.evaluate(async()=>{await cmsStore.ready;});}
async function navigate(view){
 await admin.locator('[data-view-link="'+view+'"]').first().click();
 await admin.waitForFunction(v=>location.hash==="#"+v||v==="gallery"&&location.hash==="#photography",view);
 if(["photography","gallery","categories"].includes(view))await admin.locator("#collection-gallery").waitFor();
}
async function state(){const response=await admin.context().request.get(base+"/api/admin/state");assert.equal(response.status(),200);return response.json();}
async function save(){await admin.locator('[data-action="save-current"]').click();await admin.waitForFunction(()=>document.querySelector("#unsavedNotice").hidden);assert.match(await admin.locator("#toast").textContent(),/本页已保存/);}
async function selectedPhoto(){const tile=admin.locator(".gallery-tile.is-active");return{id:await tile.getAttribute("data-gallery-id"),index:Number(await tile.getAttribute("data-row-index"))};}
async function resetFilters(){await admin.locator("[data-gallery-search]").fill("");await admin.locator("[data-gallery-category]").selectOption("all");await admin.locator("[data-gallery-status]").selectOption("all");}
async function run(name,action){if(cases.size&&!cases.has(name))return;currentCase=name;const start=Date.now();await action();checks.push({name,passed:true,durationMs:Date.now()-start});console.log("PASS "+name);}
async function noOverflow(page,label){const d=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));assert.ok(d.width<=d.viewport+1,label+" "+JSON.stringify(d));}
function report(error){fs.writeFileSync(path.join(evidence,"摄影分类联调结果_photography-admin-library-results.json"),JSON.stringify({checks,failure:error?{case:currentCase,message:error.message,stack:error.stack}:null,pageErrors,realHttp:true,isolatedFixture:true,fixturePhotos:1000,separateBrowserContexts:true,productionWrites:false,base,dataDir},null,2));}

(async()=>{
 fs.mkdirSync(evidence,{recursive:true});fs.mkdirSync(temporary,{recursive:true});
 dataDir=fs.mkdtempSync(path.join(temporary,"隔离数据_test-data-"));prepareSeed();
 assert.equal(seed.gallery.length,1000);assert.equal(seed.settings.cityContent.photos.length,9);
 server=createServer({sourceDir,dataDir,seed,username:"library-regression",password:"isolated-library-only"});
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));assert.notEqual(server.address().port,5173,"Do not target real site");
 base="http://127.0.0.1:"+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:process.env.CMS_TEST_BROWSER_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe"});
 try{
  const a=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
  const p=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
  for(const context of[a,p])context.on("page",page=>page.on("pageerror",error=>pageErrors.push(error.message)));
  admin=await a.newPage();front=await p.newPage();
  await admin.goto(base+"/admin/index.html#photography");
  await admin.locator("#loginUsername").fill("library-regression");await admin.locator("#loginPassword").fill("isolated-library-only");
  await admin.locator('#loginForm button[type="submit"]').click();await admin.locator("#collection-gallery").waitFor();

  await run("library-pagination",async()=>{
   const tiles=()=>admin.locator("#collection-gallery [data-gallery-id]"),images=()=>admin.locator(".gallery-library-grid img").count(),pager=()=>admin.locator(".gallery-admin-pagination");
   assert.equal(await tiles().count(),12);assert.equal(await images(),12);
   assert.equal(await pager().getByRole("button",{name:"上一页",exact:true}).isDisabled(),true);
   await pager().getByRole("button",{name:"84",exact:true}).click();assert.equal(await tiles().count(),4);assert.ok(await images()<=12);
   assert.equal(await pager().getByRole("button",{name:"下一页",exact:true}).isDisabled(),true);
   await pager().getByRole("button",{name:"上一页",exact:true}).click();assert.equal(await tiles().count(),12);
   assert.equal(await pager().locator('[aria-current="page"]').textContent(),"83");
   await admin.locator("[data-gallery-search]").fill("隔离作品 0999");assert.equal(await tiles().count(),1);
   assert.equal(await tiles().first().getAttribute("data-gallery-id"),"library-0999");
   assert.equal(await pager().locator('[aria-current="page"]').textContent(),"1");
   await admin.locator("[data-gallery-search]").fill("无匹配的唯一关键词");assert.equal(await tiles().count(),0);
   assert.match(await admin.locator("#collection-gallery").textContent(),/没有匹配的作品/);assert.equal(await admin.locator(".gallery-editor").count(),0);
   await resetFilters();
   for(const[category,status]of[["portrait","Published"],["landscape","Draft"],["city-humanity","Archived"],["personal","all"]]){
    await admin.locator("[data-gallery-category]").selectOption(category);await admin.locator("[data-gallery-status]").selectOption(status);
    const ids=await tiles().evaluateAll(nodes=>nodes.map(n=>n.dataset.galleryId));
    assert.deepEqual(ids,seed.gallery.filter(r=>r.categoryId===category&&(status==="all"||r.status===status)).slice(0,12).map(r=>r.id));assert.ok(await images()<=12);
   }
   await resetFilters();
   assert.equal(await admin.locator('[data-bind$=".filterLabels"],[data-bind$=".allFilterLabel"],[data-bind$=".style"]').count(),0);
   assert.match(await admin.locator("#collection-categories h2").textContent(),/分类管理/);
  });

  await run("library-edit-upload-save",async()=>{
   await resetFilters();await admin.locator(".gallery-admin-pagination").getByRole("button",{name:"84",exact:true}).click();
   await admin.locator(".gallery-tile").last().click();const old=await selectedPhoto();
   await admin.locator('[data-bind="gallery.'+old.index+'.title"]').fill("已修改最后一条作品");await save();
   let saved=(await state()).state;
   assert.equal(saved.gallery.find(r=>r.id===old.id).title,"已修改最后一条作品");assert.equal(saved.gallery[0].title,seed.gallery[0].title);
   await admin.locator('[data-action="add-row"][data-path="gallery"]').click();const added=await selectedPhoto();
   assert.notEqual(added.id,old.id);assert.equal(await admin.locator('.gallery-admin-pagination [aria-current="page"]').textContent(),"84");
   assert.equal(await admin.locator(".gallery-extra").first().getAttribute("open"),null);
   await admin.locator('[data-bind="gallery.'+added.index+'.title"]').fill("新建作品按ID保存");
   await admin.locator('[data-file-bind="gallery.'+added.index+'.image"]').setInputFiles(testFile("single-added.png"));
   await admin.waitForFunction(i=>document.querySelector('[data-bind="gallery.'+i+'.image"]')?.value.startsWith("/media/"),added.index);
   await admin.locator('[data-bind="gallery.'+added.index+'.categoryId"]').selectOption("landscape");
   await admin.locator('[data-bind="gallery.'+added.index+'.status"]').selectOption("Published");
   const media=await admin.locator('[data-bind="gallery.'+added.index+'.image"]').inputValue();assert.equal((await a.request.get(base+media)).status(),200);
   await save();saved=(await state()).state;assert.equal(saved.gallery.length,1001);
   const photo=saved.gallery.find(r=>r.id===added.id);assert.equal(photo.title,"新建作品按ID保存");assert.equal(photo.image,media);assert.equal(photo.categoryId,"landscape");assert.deepEqual(photo.displayScopes,["overview","landscape"]);
   await admin.locator("[data-gallery-search]").fill("隔离作品 0010");await admin.locator("[data-gallery-status]").selectOption("Archived");
   await admin.locator("[data-gallery-upload]").setInputFiles([testFile("batch-one.png"),testFile("batch-two.png")]);
   await admin.waitForFunction(()=>!document.querySelector('[data-action="save-current"]').disabled&&document.querySelectorAll(".gallery-tile").length>0);
   assert.equal(await admin.locator("[data-gallery-search]").inputValue(),"");assert.equal(await admin.locator("[data-gallery-status]").inputValue(),"all");
   assert.equal(await admin.locator("[data-gallery-category]").inputValue(),"all");assert.ok(await admin.locator(".gallery-library-grid img").count()<=12);
   const last=await selectedPhoto();await save();saved=(await state()).state;assert.equal(saved.gallery.length,1003);
   const imported=saved.gallery.slice(-2);assert.equal(new Set(imported.map(r=>r.id)).size,2);assert.equal(imported.at(-1).id,last.id);assert.ok(imported.every(r=>r.image.startsWith("/media/")&&r.status==="Draft"));
   await front.goto(base+"/photography/index.html?category=landscape");await ready(front);
   assert.equal(await front.evaluate(id=>cmsStore.getPublicData().gallery.find(r=>r.id===id)?.image,added.id),media);
   assert.equal(await front.locator("[data-filter-group],[data-filter]").count(),0);
  });

  await run("categories-sort-pagination-featured",async()=>{
   const data=publicProjection((await state()).state);
   for(const category of data.categories){
    await front.goto(base+"/photography/index.html");await ready(front);assert.equal(await front.locator("[data-filter-group],[data-filter]").count(),0);
    const modern=front.locator('[data-category-shortcut="'+category.id+'"]');
    await(await modern.count()?modern:front.locator('[data-filter-shortcut="'+category.id+'"]')).click();
    await front.waitForFunction(()=>document.querySelector("[data-page-mode]")?.dataset.pageMode!=="archive");
    const title=category.heroTitle||category.name;assert.equal(await front.locator("[data-page-title]").textContent(),title);
    const expected=data.gallery.filter(r=>Array.isArray(r.displayScopes)?r.displayScopes.includes(category.id):r.categoryId===category.id);
    assert.ok(Number(await front.locator("[data-gallery-pagination]").getAttribute("data-page-count"))>1);
    const clicked=await front.locator("[data-gallery-grid] [data-photo-id]").evaluateAll(nodes=>nodes.map(n=>n.dataset.photoId));
    await front.goto(base+"/photography/index.html?category="+encodeURIComponent(category.id));await ready(front);
    assert.equal(await front.locator("[data-page-title]").textContent(),title);
    assert.deepEqual(await front.locator("[data-gallery-grid] [data-photo-id]").evaluateAll(nodes=>nodes.map(n=>n.dataset.photoId)),clicked);
    assert.equal(await front.locator("[data-filter-group],[data-filter]").count(),0);
    for(const sort of["oldest","title","latest"]){
     await front.locator("[data-sort]").selectOption(sort);
     const sorted=expected.slice().sort((x,y)=>sort==="title"?x.title.localeCompare(y.title):sort==="oldest"?Number(x.year)-Number(y.year)||data.gallery.indexOf(x)-data.gallery.indexOf(y):Number(y.year)-Number(x.year)||data.gallery.indexOf(x)-data.gallery.indexOf(y));
     assert.equal(await front.locator("[data-gallery-grid] [data-photo-id]").first().getAttribute("data-photo-id"),sorted[0].id);
    }
    await front.locator('[data-view="list"]').click();assert.ok(await front.locator("[data-gallery-grid] [data-photo-id]").count()<=6);
    await front.locator('[data-gallery-pagination] [data-gallery-page="next"]').click();assert.equal(await front.locator("[data-gallery-pagination]").getAttribute("data-current-page"),"2");
   }
   await front.goto(base+"/photography/index.html");await ready(front);
   await front.locator('[data-featured-id="library-0981"]').click();
   assert.ok(Number(await front.locator("[data-gallery-pagination]").getAttribute("data-current-page"))>1);
   assert.equal(await front.locator('[data-gallery-grid] [data-photo-id="library-0981"]').count(),1);
   assert.equal(await front.locator("[data-detail-title]").textContent(),data.gallery.find(r=>r.id==="library-0981").title);
  });

  await run("legacy-city-entry-and-save",async()=>{
   await navigate("photography");assert.equal(await admin.locator('#sidebarNav [data-view-link="city"]').count(),0);
   const entry=admin.locator('.legacy-city-entry [data-view-link="city"]');assert.equal(await entry.count(),1);
   assert.match(await admin.locator(".legacy-city-entry").textContent(),/9 张独立照片/);
   await entry.click();await admin.waitForFunction(()=>location.hash==="#city");const before=(await state()).state;
   assert.deepEqual(before.settings.cityContent.photos,seed.settings.cityContent.photos);
   await admin.locator('[data-bind="settings.cityContent.photos.0.title"]').fill("旧城市专题独立保存");await save();
   const saved=(await state()).state;assert.equal(saved.settings.cityContent.photos.length,9);
   assert.equal(saved.settings.cityContent.photos[0].image,seed.settings.cityContent.photos[0].image);assert.equal(saved.settings.cityContent.photos[0].title,"旧城市专题独立保存");
   assert.equal(saved.gallery.find(r=>r.id==="library-0001").title,seed.gallery[0].title);
   await front.goto(base+"/CityHuman/index.html");await ready(front);
   await front.locator('[data-photo-id="'+seed.settings.cityContent.photos[0].id+'"]').click();assert.equal(await front.locator("[data-detail-title]").textContent(),"旧城市专题独立保存");
   const images=await front.locator("[data-photo-grid] img").evaluateAll(nodes=>Promise.all(nodes.map(async image=>{await image.decode();return image.naturalWidth>0;})));
   assert.equal(images.length,9);assert.ok(images.every(Boolean));await navigate("photography");
  });

  await run("contact-type-removal-featured-and-inbox",async()=>{
   await navigate("contact");
   assert.equal(await admin.locator('[data-bind="contact.page.projectTypes"],[data-bind$="projectPlaceholder"],[data-bind$="project-typeLabel"]').count(),0);
   assert.match(await admin.locator(".contact-film-help").textContent(),/联系页下方横向滚动的一排精选照片/);
   await front.goto(base+"/Contact/index.html");await ready(front);
   assert.equal(await front.locator('#project-type,[name="project-type"],[name="projectType"]').count(),0);
   const data=publicProjection((await state()).state);
   const expected=data.gallery.filter(r=>(!Array.isArray(r.displayScopes)||r.displayScopes.includes("overview"))&&r.featured===true).sort((x,y)=>Number(x.sortOrder)-Number(y.sortOrder)).map(r=>r.id);
   const ids=await front.locator("[data-film-primary] [data-contact-photo-id]").evaluateAll(nodes=>[...new Set(nodes.map(n=>n.dataset.contactPhotoId))]);
   assert.deepEqual(ids,expected);assert.ok(!ids.includes("library-0996"));
   const requestPromise=front.waitForRequest(r=>r.url()===base+"/api/contact"&&r.method()==="POST");
   const responsePromise=front.waitForResponse(r=>r.url()===base+"/api/contact"&&r.request().method()==="POST");
   await front.locator("#name").fill("隔离新留言");await front.locator("#email").fill("library-contact@example.test");
   await front.locator("#message").fill("这是本轮摄影分类管理测试生成的隔离留言，不写入实际网站数据。");
   await front.locator('.submit-button[type="submit"]').click();const request=await requestPromise,response=await responsePromise;
   assert.equal(response.status(),201);assert.deepEqual(Object.keys(request.postDataJSON()).sort(),["email","message","name"]);
   const saved=(await state()).state;assert.equal(saved.messages.length,2);assert.equal(saved.messages.find(r=>r.id==="legacy-message-library").projectType,"Editorial");assert.equal(saved.messages.find(r=>r.name==="隔离新留言").projectType,"other");
   await admin.reload();await admin.locator('#sidebarNav [data-view-link="messages"]').click();
   await admin.getByRole("button",{name:/隔离旧留言/}).click();assert.match(await admin.locator("#viewRoot").textContent(),/Editorial/);
  });

  await run("responsive-and-independent-readback",async()=>{
   await navigate("photography");
   for(const width of[1440,390,320]){
    await admin.setViewportSize({width,height:950});await admin.bringToFront();await admin.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await noOverflow(admin,"admin photography "+width);assert.ok(await admin.locator(".gallery-library-grid img").count()<=12);
    await admin.locator("#collection-gallery").screenshot({path:path.join(evidence,"摄影作品库_gallery-library_"+width+"px.png")});
    await front.setViewportSize({width,height:950});await front.goto(base+"/photography/index.html?category=city-humanity");await ready(front);await front.bringToFront();
    await noOverflow(front,"public category "+width);assert.equal(await front.locator("[data-filter-group],[data-filter]").count(),0);
    await front.locator('[data-view="list"]').click();assert.ok(await front.locator("[data-gallery-grid] [data-photo-id]").count()<=(width<=680?4:6));
    await front.screenshot({path:path.join(evidence,"城市分类_category_"+width+"px.png"),fullPage:true});
    await front.goto(base+"/Contact/index.html");await ready(front);await noOverflow(front,"contact "+width);assert.equal(await front.locator('#project-type,[name="project-type"]').count(),0);
   }
   const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:"reduce"});context.on("page",page=>page.on("pageerror",error=>pageErrors.push(error.message)));
   const independent=await context.newPage();await independent.goto(base+"/photography/index.html");await ready(independent);
   const saved=(await state()).state;assert.deepEqual(await independent.evaluate(()=>cmsStore.getPublicData().gallery.map(r=>r.id)),publicProjection(saved).gallery.map(r=>r.id));
   if(checks.some(c=>c.name==="legacy-city-entry-and-save")){await independent.goto(base+"/CityHuman/index.html");await ready(independent);assert.equal(await independent.evaluate(()=>cmsStore.getPublicData().city.photos[0].title),"旧城市专题独立保存");}
   await context.close();
  });

  assert.deepEqual(pageErrors,[]);report();console.log(JSON.stringify({passed:checks.length,pageErrors,evidence,base,dataDir},null,2));
 }catch(error){
  checks.push({name:currentCase,passed:false});report(error);
  await admin?.screenshot({path:path.join(evidence,"失败后台_failure-admin.png"),fullPage:true}).catch(()=>{});
  await front?.screenshot({path:path.join(evidence,"失败前台_failure-front.png"),fullPage:true}).catch(()=>{});
  console.error(JSON.stringify({failedCase:currentCase,message:error.message,evidence,pageErrors},null,2));throw error;
 }finally{await browser?.close();server?.closeAllConnections();if(server?.listening)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
