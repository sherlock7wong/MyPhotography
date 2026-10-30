const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
const {createServer}=require("../../本地服务_local-server/内容服务_content-server.cjs");
const seed=structuredClone(require("../../shared/site-content.js"));
const sourceDir=path.resolve(__dirname,"../..");
const root=path.resolve(sourceDir,"..");
const evidence=path.join(root,"40_测试与验收证据/关于页字段与标签_about-fields-tags_2026-10-23");
const checks=[];const errors=[];const pass=name=>checks.push({name,passed:true});
(async()=>{
 const temporary=path.join(root,"99_临时文件、缓存和构建中间产物/关于页字段与标签_about-fields-tags_2026-10-23");fs.mkdirSync(temporary,{recursive:true});fs.mkdirSync(evidence,{recursive:true});
 const dataDir=fs.mkdtempSync(path.join(temporary,"隔离数据_test-data-"));const server=createServer({sourceDir,dataDir,seed,username:"about-test",password:"isolated-only"});await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));const base="http://127.0.0.1:"+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CMS_TEST_BROWSER_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe"});
 try{
  const adminContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});const publicContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});for(const context of [adminContext,publicContext])context.on("page",page=>page.on("pageerror",error=>errors.push(error.message)));
  const admin=await adminContext.newPage();await admin.goto(base+"/admin/index.html#about");await admin.locator("#loginUsername").fill("about-test");await admin.locator("#loginPassword").fill("isolated-only");await admin.getByRole("button",{name:"登录",exact:true}).click();await admin.waitForFunction(()=>document.querySelector("#viewTitle")?.textContent==="关于页");
  const state=async()=>{const response=await adminContext.request.get(base+"/api/admin/state");assert.equal(response.status(),200);return response.json();};
  const tags=()=>admin.locator("[data-tag-name]");const values=()=>tags().evaluateAll(nodes=>nodes.map(node=>node.value));const add=admin.locator("[data-tag-new]");
  assert.deepEqual(await values(),seed.profile.tags);assert.equal(await admin.locator('textarea[data-bind="profile.tags"]').count(),0);
  const aboutText=await admin.locator("#viewRoot").textContent();for(const text of ["Availability","不会改变浏览器网址","图片加载失败","网页搜索结果的简介另"]){assert.ok(aboutText.includes(text));}
  pass("原技能标签完整读取为逐项控件，关于页字段内有准确的白话用途说明");
  await add.fill("自然光人像");await admin.getByRole("button",{name:"添加标签",exact:true}).click();let expected=[...seed.profile.tags,"自然光人像"];assert.deepEqual(await values(),expected);
  await add.fill("自然光人像");await add.press("Enter");assert.deepEqual(await values(),expected);assert.ok((await admin.locator("[data-tag-status]").textContent()).includes("已经有"));
  await add.fill("键盘添加");await add.press("Enter");expected.push("键盘添加");assert.deepEqual(await values(),expected);
  await add.fill("输入法确认");await add.dispatchEvent("keydown",{key:"Enter",isComposing:true});assert.deepEqual(await values(),expected);await add.fill("");
  pass("点击或回车添加，重复项不添加，中文输入法确认不会误提交");
  await tags().nth(0).fill("修改后的第一个标签");expected[0]="修改后的第一个标签";await admin.getByRole("button",{name:"下移第1个标签",exact:true}).click();[expected[0],expected[1]]=[expected[1],expected[0]];assert.deepEqual(await values(),expected);
  await admin.getByRole("button",{name:"删除第2个标签",exact:true}).click();expected.splice(1,1);assert.deepEqual(await values(),expected);assert.equal(await admin.getByRole("button",{name:"上移第1个标签",exact:true}).isDisabled(),true);
  await admin.locator('[data-action="save-current"]').click();await admin.waitForFunction(()=>document.querySelector("#unsavedNotice").hidden);assert.deepEqual((await state()).state.profile.tags,expected);
  const front=await publicContext.newPage();await front.goto(base+"/about/index.html");await front.waitForFunction(count=>document.querySelectorAll(".focus-tag").length===count,expected.length);assert.deepEqual(await front.locator(".focus-tag span").allTextContents(),expected);await front.locator(".focus-tag").first().click();assert.equal(await front.locator(".focus-tag").first().getAttribute("aria-pressed"),"true");
  pass("标签改名、上下移动和删除真实保存，独立前台按相同顺序显示且原标签交互保留");
  const before=(await state()).version;await tags().first().fill("");await admin.locator('[data-action="save-current"]').click();await admin.waitForFunction(()=>document.querySelector("#toast").textContent.includes("标签名称不能为空"));assert.equal((await state()).version,before);
  await admin.locator('[data-action="reset-current"]').click();await admin.locator("[data-confirm-ok]").click();assert.deepEqual(await values(),expected);
  pass("空标签阻止保存且不改变网站版本，撤销恢复已保存的标签和顺序");
  await add.fill("保存时自动加入");await admin.locator('[data-action="save-current"]').click();await admin.waitForFunction(()=>document.querySelector("#unsavedNotice").hidden);expected.push("保存时自动加入");assert.deepEqual((await state()).state.profile.tags,expected);
  await add.fill("暂不保存的草稿");const downloadPromise=admin.waitForEvent("download");await admin.locator('.sidebar [data-action="export"]').click();const downloaded=await downloadPromise;const snapshot=JSON.parse(fs.readFileSync(await downloaded.path(),"utf8"));assert.equal(snapshot.profile.tags.at(-1),"暂不保存的草稿");assert.deepEqual((await state()).state.profile.tags,expected);assert.equal(await add.inputValue(),"暂不保存的草稿");pass("导出备份包含尚未点添加的新标签草稿，且不修改当前页面或已保存数据");await admin.locator('[data-action="reset-current"]').click();await admin.locator("[data-confirm-ok]").click();assert.equal(await add.inputValue(),"");assert.deepEqual(await values(),expected);
  pass("尚未点添加的文字在保存时加入，未提交输入也可撤销，不会悄悄丢稿");
  await admin.locator('[data-bind="profile.availability"]').fill("接受约拍与合作");await admin.locator('[data-bind="profile.shortIntro"]').fill("给搜索资料读取的一句话介绍");await admin.locator('[data-bind="settings.pageContent.about.path"]').fill("/about-test");await admin.locator('[data-bind="settings.pageContent.about.portraitAlt"]').fill("隔离联调：窗边拿相机的肖像");
  await admin.locator('[data-action="save-current"]').click();await admin.waitForFunction(()=>document.querySelector("#unsavedNotice").hidden);await front.reload();
  const availability=front.locator(".info-list > div").filter({has:front.locator("dt",{hasText:"Availability"})});await availability.waitFor({state:"visible"});await front.waitForFunction(()=>[...document.querySelectorAll(".info-list > div")].some(node=>node.querySelector("dt")?.textContent==="Availability"&&node.querySelector("dd")?.textContent==="接受约拍与合作"));assert.ok(await availability.isVisible());assert.equal(await availability.locator("dd").textContent(),"接受约拍与合作");assert.equal(await front.locator(".page-path").textContent(),"/about-test");assert.equal(new URL(front.url()).pathname,"/about/index.html");
  assert.equal(await front.locator(".archive-photo img").getAttribute("alt"),"隔离联调：窗边拿相机的肖像");assert.ok(!(await front.locator(".bio-block").textContent()).includes("给搜索资料读取的一句话介绍"));const ld=await front.locator('script[type="application/ld+json"]').textContent();assert.equal(JSON.parse(ld).description,"给搜索资料读取的一句话介绍");
  pass("合作状态位于Availability行，路径小字不改网址，肖像说明写入alt，短简介供结构化资料读取而不替换现有正文");
  await admin.locator('[data-bind="profile.biography"]').fill("");await admin.locator('[data-action="save-current"]').click();await admin.waitForFunction(()=>document.querySelector("#unsavedNotice").hidden);await front.reload();assert.ok((await front.locator(".bio-block").textContent()).includes("给搜索资料读取的一句话介绍"));
  pass("个人简介为空时，简短介绍才会作为正文备用内容");
  for(const width of [1440,390,320]){await admin.setViewportSize({width,height:950});assert.ok(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await add.evaluate(node=>node.getBoundingClientRect().width>=100));}
  await admin.locator("#toast").evaluate(node=>node.hidden=true);await admin.setViewportSize({width:1440,height:1000});await admin.locator("[data-tags-editor]").screenshot({path:path.join(evidence,"标签编辑_tag-editor-desktop.png")});await admin.setViewportSize({width:390,height:844});await admin.locator("[data-tags-editor]").screenshot({path:path.join(evidence,"标签编辑_tag-editor-mobile.png")});
  pass("标签控件1440/390/320px布局无页面横向溢出");
  while(await tags().count())await admin.getByRole("button",{name:"删除第1个标签",exact:true}).click();await admin.locator('[data-action="save-current"]').click();await admin.waitForFunction(()=>document.querySelector("#unsavedNotice").hidden);assert.deepEqual((await state()).state.profile.tags,[]);await front.reload();assert.equal(await front.locator(".focus-tag").count(),0);
  await add.fill('<img src=x onerror="alert(1)">');await add.press("Enter");await admin.locator('[data-action="save-current"]').click();await admin.waitForFunction(()=>document.querySelector("#unsavedNotice").hidden);await front.reload();assert.equal(await front.locator(".focus-tag img").count(),0);assert.equal(await front.locator(".focus-tag span").textContent(),'<img src=x onerror="alert(1)">');
  pass("删除全部标签可持久化空列表，特殊字符按纯文字显示，不变成HTML或执行代码");
  assert.deepEqual(errors,[]);const report={checks,pageErrors:errors,realHttp:true,separateBrowserContexts:true,productionWrites:false,dataDir};fs.writeFileSync(path.join(evidence,"关于页联调结果_about-fields-tags-results.json"),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
