const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {chromium}=require('playwright');
const base=process.env.CMS_TEST_URL||'http://127.0.0.1:5173';
if(!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname))throw new Error('Only run against a local preview.');
const evidence=process.env.CMS_TEST_EVIDENCE||'40_测试与验收证据/后台逐页编辑_admin-page-edit_2026-10-21';
const names={home:'首页',about:'关于页',projects:'项目页',photography:'摄影页',city:'城市人文页',contact:'联系页',messages:'留言收件箱',settings:'全站共用与接口'};
const routes={home:'Home',about:'about',projects:'Project',photography:'photography',city:'CityHuman',contact:'Contact'};
const checks=[];
const pageErrors=[];
const source=fs.readFileSync(path.join(__dirname,'..','script.js'),'utf8');
const account=vm.runInNewContext('('+source.match(/const MOCK_AUTH = (\{[\s\S]*?\});/)[1]+')');
const pass=name=>checks.push({name,passed:true});
async function navigate(page,id){await page.locator(`#sidebarNav [data-view-link="${id}"]`).click();await page.waitForFunction(name=>document.querySelector('#viewTitle').textContent===name,names[id]);}
async function edit(page,key,value){const node=page.locator(`[data-bind="${key}"]`);await node.evaluate(n=>{const details=n.closest('details');if(details)details.open=true;});const tag=await node.evaluate(n=>n.tagName);if(tag==='SELECT')await node.selectOption(value);else if(await node.getAttribute('type')==='checkbox')await node.setChecked(value);else await node.fill(value);}
async function save(page){await page.locator('[data-action="save-current"]').click();await page.locator('#unsavedNotice').waitFor({state:'hidden'});assert.match(await page.locator('#toast').textContent(),/本页已保存/);}
async function login(page){await page.goto(base+'/admin/index.html');await page.locator('#loginUsername').fill(account.username);await page.locator('#loginPassword').fill(account.password);await page.getByRole('button',{name:'登录',exact:true}).click();await page.locator('#adminShell').waitFor({state:'visible'});}
async function run(){
const browser=await chromium.launch({headless:true,executablePath:process.env.CMS_TEST_BROWSER_PATH||undefined});
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  context.on('page',p=>p.on('pageerror',e=>pageErrors.push(e.message)));
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
  const admin=await context.newPage();await login(admin);const seed=await admin.evaluate(()=>cmsStore.load());
  for(const [id,title]of Object.entries(names)){await navigate(admin,id);assert.equal(await admin.locator('#viewTitle').textContent(),title);assert.equal(await admin.locator('html').getAttribute('lang'),'zh-CN');}
  pass('Chinese navigation and all six dedicated page editors, inbox and settings open');
  await navigate(admin,'home');await edit(admin,'settings.homeHero.heroHeadline','首页联调标题');await edit(admin,'settings.pageContent.home.introCopy','首页独立简介');await edit(admin,'settings.homeSelection.0.caption','首页独立选片标注');await save(admin);
  const front=await context.newPage();await front.goto(base+'/Home/index.html');assert.equal(await front.locator('#home-title').textContent(),'首页联调标题');assert.equal(await front.locator('.intro-copy').textContent(),'首页独立简介');assert.equal((await front.locator('[data-photo-card]').first().locator('.film-meta').count()),0);
  assert.equal(await front.locator('[data-photo-card][data-index="1"] .film-meta').textContent(),'首页独立选片标注');
  await navigate(admin,'about');await edit(admin,'profile.displayName','关于页专属姓名');await edit(admin,'profile.biography','第一段简介\n\n第二段简介');await save(admin);await front.goto(base+'/about/index.html');assert.equal(await front.locator('.info-list dd').first().textContent(),'关于页专属姓名');assert.equal(await front.locator('.bio-block p').count(),2);await front.goto(base+'/Home/index.html');assert.equal(await front.locator('.intro-kicker').textContent(),seed.profile.displayName);assert.equal(await front.locator('.intro-copy').textContent(),'首页独立简介');pass('Home text, film selection and About profile save independently');
  await navigate(admin,'projects');await edit(admin,'projects.0.description','项目卡片独立介绍');await edit(admin,'projects.0.linkUrl','../CityHuman/index.html');await edit(admin,'projects.0.linkLabel','查看人文作品');await save(admin);await front.goto(base+'/Project/index.html');assert.equal(await front.locator('.project-summary').first().textContent(),'项目卡片独立介绍');assert.equal(await front.locator('.view-link').first().getAttribute('href'),'../CityHuman/index.html');assert.match(await front.locator('.view-link').first().textContent(),/查看人文作品/);pass('Project descriptions and destination links affect the public project card');
  await navigate(admin,'photography');await edit(admin,'gallery.0.title','联调摄影作品');await edit(admin,'gallery.0.categoryId','portrait');await edit(admin,'gallery.0.camera','联调相机');await edit(admin,'gallery.0.style','studio');await edit(admin,'gallery.0.styleLabel','Studio');await edit(admin,'categories.0.heroTitle','人像分类联调');await edit(admin,'categories.0.pageIntro','分类页独立介绍');await edit(admin,'categories.0.heroImage','../Home/assets/personal.png');await edit(admin,'categories.0.seoTitle','分类搜索标题');await edit(admin,'categories.0.filterLabels','Studio\n自然光');await save(admin);
  await front.goto(base+'/photography/index.html?category=portrait');assert.equal(await front.locator('[data-page-title]').textContent(),'人像分类联调');assert.equal(await front.locator('[data-hero-description]').textContent(),'分类页独立介绍');assert.equal(await front.title(),'分类搜索标题');assert.equal(await front.locator('.portrait-cover img').getAttribute('src'),'../Home/assets/personal.png');assert.ok(await front.locator('[data-filter="studio"]').isVisible());await front.locator('[data-filter="studio"]').click();await front.waitForTimeout(60);assert.equal(await front.locator('[data-page-title]').textContent(),'人像分类联调');assert.match(await front.locator('[data-detail-camera]').textContent(),/联调相机/);pass('Photography metadata, category title, cover, SEO and style filters persist through interactions');
  await navigate(admin,'city');await edit(admin,'settings.cityContent.photos.0.title','城市人文联调作品');await edit(admin,'settings.cityContent.photos.0.light','街巷自然光');await save(admin);await front.goto(base+'/CityHuman/index.html');await front.locator('[data-photo-id="old-lane"]').click();assert.equal(await front.locator('[data-detail-title]').textContent(),'城市人文联调作品');assert.match(await front.locator('[data-detail-specs]').textContent(),/街巷自然光/);pass('City Humanity works and full detail metadata are editable from its dedicated editor');
  await navigate(admin,'contact');await edit(admin,'contact.page.title','联系页联调');await edit(admin,'settings.pageContent.contact.language','中文');await edit(admin,'settings.contactForm.localSuccess','本机收件箱已收到联调留言');await save(admin);await front.goto(base+'/Contact/index.html');assert.equal(await front.locator('#contact-title').textContent(),'联系页联调');assert.equal(await front.locator('.contact-facts dd').nth(3).textContent(),'中文');await front.locator('#name').fill('联调访客');await front.locator('#email').fill('cms-test@example.com');await front.locator('#message').fill('这是一条用于验证前后台连接的留言内容。');await front.locator('.submit-button').click();await front.waitForFunction(()=>document.querySelector('[data-toast-message]').textContent.includes('本机收件箱'));await navigate(admin,'messages');assert.match(await admin.locator('.entity-rail').textContent(),/联调访客/);assert.equal(await front.evaluate(()=>Object.hasOwn(cmsStore.getPublicData(),'messages')),false);pass('Contact edits and local submission reach the inbox without exposing private messages in public data');
  const privacy=await front.evaluate(seed=>{const data=structuredClone(seed);data.categories.push({id:"hidden-category",name:"Private",status:"Draft",visibility:"Private"});data.gallery[0].categoryId="hidden-category";data.gallery[0].category=data.categories[0].name;data.settings.cityContent.photos.push({id:"city-draft",status:"Draft",title:"private-city-draft",description:"private-city-body"});cmsStore.save(data);const projected=cmsStore.getPublicData();return{rawPhoto:cmsStore.load().gallery.some(p=>p.id===data.gallery[0].id),publicPhoto:projected.gallery.some(p=>p.id===data.gallery[0].id),cityDraft:JSON.stringify(projected).includes("private-city-body")};},seed);
  assert.deepEqual(privacy,{rawPhoto:true,publicPhoto:false,cityDraft:false});pass('Public projection hides drafts and prioritizes category IDs while retaining original admin data');
  await front.evaluate(seed=>cmsStore.save(seed),seed);
  await front.close();
  const bindingPage=await context.newPage();const fieldCounts={};
  for(const[id,dir]of Object.entries(routes)){
    await bindingPage.goto(base+'/'+dir+'/index.html');
    const expected=await bindingPage.evaluate(({seed,id})=>{
      const data=structuredClone(seed);const fields=cmsPages.pages[id].groups.flatMap(g=>g.fields);const values={};const list=[];
      for(const f of fields){if(cmsPages.readField(document,f)===undefined)continue;const value=f.type==='image'?'../Home/assets/personal.png':f.type==='url'?'../Home/index.html?binding='+f.key:'中文校验_'+f.key;values[f.key]=value;list.push({key:f.key,value});}
      data.settings.pageContent[id]=values;cmsStore.save(data);return list;
    },{seed,id});
    await bindingPage.reload();
    const mismatches=await bindingPage.evaluate(({id,expected})=>expected.flatMap(({key,value})=>{const field=cmsPages.pages[id].groups.flatMap(g=>g.fields).find(f=>f.key===key);const actual=cmsPages.readField(document,field);return actual===value?[]:[{key,value,actual}];}),{id,expected});
    assert.deepEqual(mismatches,[],id+' static field mapping');fieldCounts[id]=expected.length;
  }
  pass('Every declared static page binding writes the expected public text, image, link or label: '+JSON.stringify(fieldCounts));
  await bindingPage.evaluate(seed=>cmsStore.save(seed),seed);
  for(const[id,dir]of Object.entries(routes)){
    await bindingPage.goto(base+'/'+dir+'/index.html');const selector=await bindingPage.evaluate(id=>{const data=cmsStore.load();const[key,[,selector]]=Object.entries(cmsPages.pages[id].components)[0];for(const key of Object.keys(cmsPages.pages[id].components))data.componentVisibility[id][key]=false;cmsStore.save(data);return selector;},id);await bindingPage.reload();assert.equal(await bindingPage.locator(selector).first().evaluate(n=>getComputedStyle(n).display),'none',id+' module visually hidden');
    const visibleModules=await bindingPage.evaluate(id=>Object.entries(cmsPages.pages[id].components).flatMap(([key,[,selector]])=>[...document.querySelectorAll(selector)].some(n=>n.getClientRects().length && getComputedStyle(n).display!=='none')?[key]:[]),id);assert.deepEqual(visibleModules,[],id+' all disabled modules must be visually hidden');
    await bindingPage.evaluate(seed=>cmsStore.save(seed),seed);
  }
  pass('Page-specific component switches hide the intended public region');
  await bindingPage.evaluate(seed=>{const empty=structuredClone(seed);empty.gallery=[];empty.categories=[];empty.projects=[];empty.profile.tags=[];empty.profile.timeline=[];empty.contact.contactMethods=[];empty.contact.filmStrip=[];empty.settings.cityContent.photos=[];empty.settings.cityContent.filters=[];cmsStore.save(empty);},seed);
  const emptyChecks={home:'[data-collection-card]',about:'[data-timeline-card]',projects:'[data-project-card]',photography:'[data-photo-id]',city:'[data-photo-id]',contact:'.contact-card,.film-strip figure'};
  for(const[id,selector]of Object.entries(emptyChecks)){await bindingPage.goto(base+'/'+routes[id]+'/index.html');assert.equal(await bindingPage.locator(selector).count(),0,id+' empty collection');}
  pass('Empty projects, categories, galleries, timeline and contact collections do not resurrect old HTML examples');
  await bindingPage.evaluate(seed=>cmsStore.save(seed),seed);
  for(const width of [1440,390]){await bindingPage.setViewportSize({width,height:900});for(const[id,dir]of Object.entries(routes)){await bindingPage.goto(base+'/'+dir+'/index.html');assert.ok(await bindingPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),id+' overflow '+width);}await admin.setViewportSize({width,height:900});for(const id of Object.keys(names)){await navigate(admin,id);assert.ok(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'admin '+id+' overflow '+width);}}
  pass('All public pages and admin modules fit desktop and 390px mobile viewports');
  await context.close();
  assert.deepEqual(pageErrors,[]);
  fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(path.join(evidence,'逐页联调结果_page-edit-results.json'),JSON.stringify({checks,fieldCounts,pageErrors},null,2));console.log(JSON.stringify({checks,fieldCounts,pageErrors},null,2));
}finally{await browser.close();}}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
