/* 从前台源文件重建初始化内容；site-content.js 是浏览器与 Node 的固定导入名。 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const vm = require("node:vm");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const ROOT = path.resolve(__dirname, "..");
const TEMPLATE = path.join(__dirname, "内容结构模板_content-state-template.json");
const OUTPUT = path.join(ROOT, "shared/site-content.js");
const PAGES = { home:"Home", about:"about", projects:"Project", photography:"photography", contact:"Contact" };
const clone = value => JSON.parse(JSON.stringify(value));
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");
const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const slug = value => String(value || "").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-+|-+$/g,"");
function relativeUrl(value, directory) {
  const text = String(value || "").trim();
  if (!text || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(text)) return text;
  const url = new URL(text, "https://content.invalid/" + directory + "/index.html");
  return ".." + url.pathname + url.search + url.hash;
}
/* 只解析指定字面量或函数文本；不执行前台脚本、网络、存储及事件初始化。 */
function balanced(source, start) {
  const open = source[start], close = ({"[":"]","{":"}"})[open];
  let depth=0, quote="", escaped=false, lineComment=false, blockComment=false;
  for (let i=start;i<source.length;i++) {
    const char=source[i],next=source[i+1];
    if (lineComment) { if(char==="\n")lineComment=false;continue; }
    if (blockComment) { if(char==="*"&&next==="/"){blockComment=false;i++;}continue; }
    if (quote) { if(escaped){escaped=false;continue;}if(char==="\\"){escaped=true;continue;}if(char===quote)quote="";continue; }
    if (char==="/"&&next==="/"){lineComment=true;i++;continue;}
    if (char==="/"&&next==="*"){blockComment=true;i++;continue;}
    if (["\"","'","`"].includes(char)){quote=char;continue;}
    if(char===open)depth++;
    if(char===close){depth--;if(depth===0)return source.slice(start,i+1);}
  }
  throw new Error("源文件括号不完整，未生成内容。");
}
function arrayLiteral(source, name) {
  const match=new RegExp("\\bconst\\s+"+name+"\\s*=\\s*\\[").exec(source);
  if(!match)throw new Error("找不到原数组："+name);
  const start=source.indexOf("[",match.index);
  const value=vm.runInNewContext("("+balanced(source,start)+")",Object.create(null),{timeout:1000});
  if(!Array.isArray(value))throw new Error("原数组格式错误："+name);
  return clone(value);
}
function functionText(source,name) {
  const match=new RegExp("function\\s+"+name+"\\s*\\(").exec(source);
  if(!match)throw new Error("找不到原展示函数："+name);
  const start=source.indexOf("{",match.index);
  return source.slice(match.index,start)+balanced(source,start);
}
function playwright() {
  try { return require("playwright"); }
  catch (_) { return require(path.join(os.homedir(),".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright")); }
}
async function extractDocuments(html, schemaSource, shellSource) {
  const executablePath=process.env.CHROME_PATH || path.join(process.env.ProgramFiles || "C:/Program Files","Google/Chrome/Application/chrome.exe");
  const browser=await playwright().chromium.launch({headless:true,executablePath});
  try {
    const context=await browser.newContext();
    await context.route("**/*",route=>route.abort());
    const page=await context.newPage();
    await page.addScriptTag({content:schemaSource});
    return await page.evaluate(({html,shellSource})=>{
      const clean=node=>String(node?.textContent || "").replace(/\s+/g," ").trim();
      const raw=node=>[...(node?.childNodes || [])].map(child=>child.nodeName==="BR"?"\n":child.textContent).join("").trim().replace(/[ \t]+/g," ").replace(/\n\s+/g,"\n");
      const first=node=>[...(node?.childNodes || [])].filter(child=>child.nodeType===3).map(child=>child.textContent).join("").trim();
      const docs=Object.fromEntries(Object.entries(html).map(([name,source])=>[name,new DOMParser().parseFromString(source,"text/html")]));
      const result={static:{},seo:{},shells:{}};
      for(const [name,doc]of Object.entries(docs)){
        result.static[name]={};
        for(const section of window.cmsPages.pages[name].groups)for(const field of section.fields){const value=window.cmsPages.readField(doc,field);if(value!==undefined)result.static[name][field.key]=value;}
        result.seo[name]={title:doc.title,description:doc.querySelector('meta[name="description"]')?.content||"",ogImage:doc.querySelector('meta[property="og:image"]')?.content||"",canonicalUrl:doc.querySelector('link[rel="canonical"]')?.getAttribute("href")||""};
      }
      const home=docs.home,about=docs.about,projects=docs.projects,photography=docs.photography,contact=docs.contact;
      const info=[...about.querySelectorAll(".info-list dd")].map(clean);
      result.profile={displayName:info[0]||"",role:info[1]||"",location:info[2]||"",availability:info[3]||"",email:info[4]||"",avatar:about.querySelector(".archive-photo img")?.getAttribute("src")||"",shortIntro:result.seo.about.description,biography:[...about.querySelectorAll(".bio-block p")].map(clean).join("\n\n"),tags:[...about.querySelectorAll(".tag-list li")].map(clean),timeline:[...about.querySelectorAll("[data-timeline-card]")].map((card,index)=>({id:"timeline-"+clean(card.querySelector(".timeline-date")).toLowerCase().replace(/[^a-z\d]+/g,"-").replace(/^-|-$/g,""),date:clean(card.querySelector(".timeline-date")),title:clean(card.querySelector("h3")),place:clean(card.querySelector(".timeline-place")),description:clean(card.querySelector("p:not([class])")),type:clean(card.querySelector("span")),active:true,sortOrder:index+1}))};
      result.home={heroHeadline:clean(home.querySelector("#home-title")),heroIntro:clean(home.querySelector(".intro-copy")),heroButtonText:first(home.querySelector(".intro-actions a")),heroButtonLink:home.querySelector(".intro-actions a")?.getAttribute("href")||"",archiveNo:clean(home.querySelector(".archive-meta strong")),updated:clean(home.querySelectorAll(".archive-meta b")[0]),basedIn:clean(home.querySelectorAll(".archive-meta b")[1]),heroImage:home.querySelector('[data-photo-card][data-index="3"] img')?.getAttribute("src")||""};
      result.homeSelection=[...home.querySelectorAll("[data-photo-card]")].filter(card=>Number(card.dataset.index)>0&&Number(card.dataset.index)<6).map(card=>({image:card.querySelector("img")?.getAttribute("src")||"",altText:card.querySelector("img")?.getAttribute("alt")||"",caption:raw(card.querySelector(".film-meta")),index:Number(card.dataset.index)}));
      result.homeDefaultIndex=Number(home.querySelector("[data-photo-card].is-active")?.dataset.index)||1;
      result.homeCategories=[...home.querySelectorAll("[data-collection-card]")].map(card=>({title:clean(card.querySelector("h3")),description:clean(card.querySelector("p")),coverImage:card.querySelector("img")?.getAttribute("src")||"",coverAlt:card.querySelector("img")?.getAttribute("alt")||"",sourceUrl:card.querySelector("a")?.getAttribute("href")||""}));
      result.categories=[...photography.querySelectorAll(".category-card")].map((card,index)=>({id:card.dataset.filterShortcut,name:clean(card.querySelector("strong")),coverImage:card.querySelector("img")?.getAttribute("src")||"",coverAlt:card.querySelector("img")?.getAttribute("alt")||"",photoCount:Number(clean(card.querySelector("small")).match(/\d+/)?.[0])||0,sortOrder:index+1}));
      result.projects=[...projects.querySelectorAll("[data-project-card]")].map((card,index)=>({id:card.id,title:clean(card.querySelector("h3")),theme:clean(card.querySelector(".project-tag")),location:clean(card.querySelectorAll(".project-meta dd")[0]),year:clean(card.querySelectorAll(".project-meta dd")[1]),description:clean(card.querySelector(".project-summary")),coverImage:card.querySelector("img")?.getAttribute("src")||"",coverAlt:card.querySelector("img")?.getAttribute("alt")||"",linkLabel:first(card.querySelector(".view-link")),sourceLinkUrl:card.querySelector(".view-link")?.getAttribute("href")||"",sortOrder:index+1,status:"Published",isVisible:true}));
      result.projectsDefaultId=projects.querySelector("[data-project-card].is-active")?.id||result.projects[0]?.id||"";
      const facts=[...contact.querySelectorAll(".contact-facts dd")].map(clean),status=[...contact.querySelectorAll(".status-grid > div")].map(node=>clean(node.querySelectorAll("dd")[1]));
      result.contact={page:{slug:"contact",title:clean(contact.querySelector("#contact-title")),subtitle:clean(contact.querySelector(".contact-subtitle")),description:clean(contact.querySelector(".contact-description")),year:facts[0]||"",location:facts[1]||"",responseTime:facts[2]||"",availability:status[0]||"",currentLocation:status[1]||"",workingDays:status[2]||"",formTitle:clean(contact.querySelector("#message-title")),formSubtitle:clean(contact.querySelector(".form-heading h2 + p")),formNote:clean(contact.querySelector(".form-note")),projectTypes:[...contact.querySelectorAll("#project-type option")].filter(option=>option.value).map(clean)},contactMethods:[...contact.querySelectorAll(".contact-card")].map((card,index)=>{const title=clean(card.querySelector("h2")),url=card.querySelector("a")?.getAttribute("href")||"";return{id:"contact-"+title.toLowerCase().replace(/[^a-z\d]+/g,"-"),title,slug:title.toLowerCase(),type:/^mailto:/i.test(url)?"email":card.querySelector(".wechat-qr")?"wechat":/instagram/i.test(title)?"instagram":"link",value:clean(card.querySelector(".contact-handle")),url,actionLabel:first(card.querySelector(".outline-button")),description:clean(card.querySelector(".card-copy")),coverImage:card.querySelector(".wechat-qr")?.getAttribute("src")||"",coverAlt:card.querySelector(".wechat-qr")?.getAttribute("alt")||"",sortOrder:index+1,isVisible:true,isFeatured:true};}),filmStrip:[...contact.querySelectorAll(".film-strip figure img")].map(image=>image.getAttribute("src")),maxLength:Number(contact.querySelector("#message")?.getAttribute("maxlength"))||1000};
      result.global={brandName:clean(home.querySelector(".brand")),headerKicker:clean(home.querySelector(".header-kicker")),siteName:clean(home.querySelector("#home-title")),copyrightText:clean(home.querySelector(".copyright")),defaultLocation:result.home.basedIn};
      result.navigation=[...home.querySelectorAll(".main-nav a")].map((link,index)=>({id:"nav-"+new URL(link.getAttribute("href"),"https://content.invalid/Home/index.html").pathname.split("/").filter(Boolean)[0].toLowerCase(),label:clean(link),url:link.getAttribute("href"),visible:true,sortOrder:index+1}));
      for(const mode of ["portrait","landscape","personal"]){
        const doc=new DOMParser().parseFromString(html.photography,"text/html"),query=selector=>doc.querySelector(selector),is=key=>()=>mode===key;
        const names=["document","cmsHydrated","cmsRender","renderCategoryShell","isPortraitMode","isLandscapeMode","isPersonalMode","isCategoryMode","isCollectionMode","page","pageTitle","pagePath","heroDescription","archiveNo","archiveUpdated","archiveLocation","stampTitle","stampNo"];
        const args=[doc,{pageTitle:doc.title,updated:clean(query("[data-archive-updated]")),location:clean(query("[data-archive-location]"))},{defaultImage:""},()=>{},is("portrait"),is("landscape"),is("personal"),()=>false,()=>true,query("[data-page-mode]"),query("[data-page-title]"),query("[data-page-path]"),query("[data-hero-description]"),query("[data-archive-no]"),query("[data-archive-updated]"),query("[data-archive-location]"),query("[data-stamp-title]"),query("[data-stamp-no]")];
        new Function(...names,shellSource+";renderPageShell();")(...args);
        result.shells[mode]={heroTitle:clean(query("[data-page-title]")),slug:clean(query("[data-page-path]")),pageIntro:raw(query("[data-hero-description]")),archiveNo:clean(query("[data-archive-no]")),updated:clean(query("[data-archive-updated]")),location:clean(query("[data-archive-location]")),stampTitle:raw(query("[data-stamp-title]")),railTitle:clean(query(".portrait-rail p")),heroImage:query(".portrait-cover img")?.getAttribute("src")||"",heroAlt:query(".portrait-cover img")?.getAttribute("alt")||"",coverNotes:[...doc.querySelectorAll(".portrait-cover figcaption span")].map(span=>{const label=clean(span.querySelector("b")),value=first(span);return(label?label+": ":"")+value;}),seoTitle:doc.title};
      }
      return result;
    },{html,shellSource});
  } finally { await browser.close(); }
}
async function buildSeed() {
  const template=JSON.parse(fs.readFileSync(TEMPLATE,"utf8"));
  const html=Object.fromEntries(Object.entries(PAGES).map(([name,directory])=>[name,read(directory+"/index.html")]));
  const photography=fs.readFileSync(path.join(__dirname,"摄影原页数据源_photography-source-snapshot.js"),"utf8"),schemaSource=read("shared/cms-pages.js");
  const arrays={overview:arrayLiteral(photography,"photos"),portrait:arrayLiteral(photography,"portraitPhotos"),landscape:arrayLiteral(photography,"landscapePhotos"),personal:arrayLiteral(photography,"personalPhotos")};
  const filters={overview:arrayLiteral(photography,"archiveFilters"),portrait:arrayLiteral(photography,"portraitFilters"),landscape:arrayLiteral(photography,"landscapeFilters"),personal:arrayLiteral(photography,"personalFilters")};
  const extracted=await extractDocuments(html,schemaSource,functionText(photography,"renderPageShell"));
  const stateStart=photography.indexOf("const state = {");
  const overviewId=balanced(photography,photography.indexOf("{",stateStart)).match(/activeId:\s*"([^"\n]+)"/)?.[1];
  const defaultIds={overview:overviewId?"overview-"+overviewId:""};
  for(const [scope,entry]of Object.entries({portrait:"enterPortraitMode",landscape:"enterLandscapeMode",personal:"enterPersonalMode"})){const id=functionText(photography,entry).match(/state\.activeId\s*=\s*"([^"\n]+)"/)?.[1];if(id)defaultIds[scope]=scope+"-"+id;}
  const seed=clone(template);seed.messages=[];seed.profile={...seed.profile,...extracted.profile};seed.profile.avatar=relativeUrl(seed.profile.avatar,"about");
  seed.settings.pageContent=extracted.static;
  for(const [name,definition]of Object.entries(PAGES)){
    const docFields=windowlessFields(schemaSource,name);
    for(const field of docFields){if(["src","href"].includes(field.attr)&&Object.hasOwn(seed.settings.pageContent[name],field.key))seed.settings.pageContent[name][field.key]=relativeUrl(seed.settings.pageContent[name][field.key],definition);}
  }
  seed.settings.pageSeo=Object.fromEntries(Object.entries(extracted.seo).map(([name,seo])=>[name,{...seo,ogImage:relativeUrl(seo.ogImage,PAGES[name]),canonicalUrl:relativeUrl(seo.canonicalUrl,PAGES[name])}]));
  seed.settings.homeHero={...seed.settings.homeHero,...extracted.home,heroImage:relativeUrl(extracted.home.heroImage,"Home"),heroButtonLink:relativeUrl(extracted.home.heroButtonLink,"Home")};
  seed.settings.homeDefaultIndex=extracted.homeDefaultIndex;seed.settings.projectsDefaultId=extracted.projectsDefaultId;
  seed.settings.photographyView.defaultPhotoIds=clone(defaultIds);
  seed.settings.globalInfo={...seed.settings.globalInfo,...extracted.global};
  seed.settings.navigation=extracted.navigation.map(item=>({...item,url:relativeUrl(item.url,"Home")}));
  seed.settings.seo={...seed.settings.seo,siteTitle:extracted.seo.home.title,seoTitle:extracted.seo.home.title,siteDescription:extracted.seo.home.description,seoDescription:extracted.seo.home.description,ogImage:relativeUrl(extracted.seo.home.ogImage,"Home"),canonicalUrl:relativeUrl(extracted.seo.home.canonicalUrl,"Home")};
  seed.categories=extracted.categories.map(category=>{
    const home=extracted.homeCategories.find(item=>slug(item.title)===category.id)||{};
    const shell=extracted.shells[category.id]||{};
    return{...clone(template.categories.find(item=>item.id===category.id)||{}),...category,description:home.description||"",slug:"/photography/"+category.id,heroTitle:category.name,...shell,coverImage:relativeUrl(category.coverImage,"photography"),heroImage:relativeUrl(shell.heroImage||category.coverImage,"photography"),visibility:"Public",status:"Published",filterLabels:(filters[category.id]||[]).filter(item=>item.value!=="all").map(item=>item.label),filterOptions:filters[category.id]||[],allFilterLabel:filters[category.id]?.find(item=>item.value==="all")?.label||filters.overview.find(item=>item.value==="all")?.label||""};
  });
  seed.gallery=Object.entries(arrays).flatMap(([scope,photos])=>photos.map((photo,index)=>({...photo,id:scope+"-"+photo.id,sourceId:photo.id,displayScopes:scope==="overview" && photo.category && !Object.hasOwn(arrays,photo.category)?[scope,photo.category]:[scope],categoryId:photo.category,category:photo.categoryLabel,altText:photo.alt||"",image:relativeUrl(photo.image,"photography"),...(photo.detailImage?{detailImage:relativeUrl(photo.detailImage,"photography")} : {}),sortOrder:index+1,status:"Published"})));
  seed.settings.homeSelection=extracted.homeSelection.map((entry,index)=>{
    const image=relativeUrl(entry.image,"Home");let photo=seed.gallery.find(item=>item.displayScopes.includes("overview")&&item.image===image)||seed.gallery.find(item=>item.image===image);
    if(!photo){photo={id:"home-visible-"+entry.index,sourceId:"visible-"+entry.index,displayScopes:["home"],title:entry.altText,image,altText:entry.altText,categoryId:"",category:"",description:"",featured:false,status:"Published",sortOrder:index+1};seed.gallery.push(photo);}
    return{photoId:photo.id,caption:entry.caption,altText:entry.altText,sourceIndex:entry.index};
  });
  seed.settings.homeCategories=extracted.homeCategories.map(entry=>({...entry,categoryId:seed.categories.find(category=>category.name===entry.title)?.id||slug(entry.title),coverImage:relativeUrl(entry.coverImage,"Home"),url:"",sourceUrl:relativeUrl(entry.sourceUrl,"Home")}));
  seed.projects=extracted.projects.map(project=>({...clone(template.projects.find(item=>item.id===project.id)||{}),...project,categoryIds:seed.categories.filter(category=>category.name===project.theme).map(category=>category.id),coverImage:relativeUrl(project.coverImage,"Project"),linkUrl:""}));
  const {maxLength,...contact}=extracted.contact;seed.contact=contact;seed.contact.contactMethods=contact.contactMethods.map(method=>({...method,url:relativeUrl(method.url,"Contact"),coverImage:relativeUrl(method.coverImage,"Contact")}));seed.contact.filmStrip=contact.filmStrip.map(image=>relativeUrl(image,"Contact"));seed.settings.contactForm.maxLength=maxLength;
  seed.settings.globalInfo.contactEmail=seed.contact.contactMethods.find(method=>method.type==="email")?.value||"";
  seed.settings.globalInfo.socialHandle=seed.contact.contactMethods.find(method=>method.type==="instagram")?.value||"";
  seed.settings.cityContent={filters:[],photos:[]};
  if(seed.componentVisibility)delete seed.componentVisibility.city;
  seed.settings.photographySourceScopes=Object.fromEntries(Object.entries(arrays).map(([scope,photos])=>[scope,photos.map(photo=>scope+"-"+photo.id)]));
  for(const category of seed.categories)if(!Object.hasOwn(arrays,category.id))seed.settings.photographySourceScopes[category.id]=seed.gallery.filter(photo=>photo.displayScopes.includes(category.id)).map(photo=>photo.id);
  const inputs=[...Object.values(PAGES).map(directory=>directory+"/index.html"),"内容同步_content-sync/摄影原页数据源_photography-source-snapshot.js","shared/city-content.js","shared/cms-pages.js",path.relative(ROOT,TEMPLATE).replaceAll("\\","/")];
  seed.seedMetadata={formatVersion:1,sourceKind:"original-html-and-photography-literals",sources:inputs.map(filename=>({path:filename,sha256:hash(read(filename))})),scopeCounts:Object.fromEntries(Object.entries(arrays).map(([scope,photos])=>[scope,photos.length]))};
  verify(seed);
  return seed;
}
function windowlessFields(schemaSource,page) {
  const context={window:{},document:{addEventListener(){}}};vm.runInNewContext(schemaSource,context,{timeout:1000});
  return context.window.cmsPages.pages[page].groups.flatMap(group=>group.fields);
}
function verify(seed) {
  assert.equal(seed.messages.length,0);assert.equal(seed.profile.timeline.length,6);assert.equal(seed.profile.tags.length,9);assert.equal(seed.profile.biography.split(/\n\n/).length,3);assert.equal(seed.profile.avatar,"../about/Image/about-portrait-crop.png");
  assert.deepEqual(seed.seedMetadata.scopeCounts,{overview:11,portrait:8,landscape:10,personal:10});
  for(const [scope,count]of Object.entries(seed.seedMetadata.scopeCounts))assert.equal(seed.gallery.filter(photo=>photo.displayScopes.includes(scope)).length,count);
  assert.equal(new Set(seed.gallery.map(photo=>photo.id)).size,seed.gallery.length);assert.equal(seed.settings.homeSelection.length,5);assert.equal(seed.settings.homeCategories.length,4);assert.equal(seed.projects.length,4);assert.equal(seed.contact.filmStrip.length,5);assert.equal(seed.contact.contactMethods.length,3);assert.equal(seed.settings.cityContent.photos.length,0);assert.equal(Object.keys(seed.settings.pageContent).length,Object.keys(PAGES).length);
  const images=[seed.profile.avatar,seed.settings.homeHero.heroImage,...seed.gallery.flatMap(photo=>[photo.image,photo.detailImage]),...seed.projects.map(project=>project.coverImage),...seed.categories.flatMap(category=>[category.coverImage,category.heroImage]),...seed.contact.filmStrip,...seed.contact.contactMethods.map(method=>method.coverImage),...seed.settings.cityContent.photos.flatMap(photo=>[photo.image,photo.detailImage])].filter(Boolean);
  for(const image of images){assert(image.startsWith("../"),"非通用素材路径："+image);assert(fs.existsSync(path.resolve(ROOT,"Home",decodeURIComponent(image))),"素材不存在："+image);}
}
function serialize(seed){return"/* Generated from current original page sources; rebuild with 内容同步_content-sync/生成初始内容_generate-site-content.cjs. */\n(function (root, factory) {\n  if (typeof module === \"object\" && module.exports) module.exports = factory();\n  else root.cmsSiteContent = factory();\n})(typeof window !== \"undefined\" ? window : globalThis, function () {\n  \"use strict\";\n  return "+JSON.stringify(seed,null,2)+";\n});\n";}
async function main(){const seed=await buildSeed(),output=serialize(seed);if(process.argv.includes("--check")){assert.equal(fs.readFileSync(OUTPUT,"utf8"),output,"种子与原始输入不一致，请重新生成。");process.stdout.write("初始化内容与来源一致。\n");}else{fs.writeFileSync(OUTPUT,output,"utf8");process.stdout.write("已生成 shared/site-content.js；作用域11/8/10/10，About 3段/9标签/6经历，首页5张；旧城市页仅保留兼容跳转，初始化城市照片0张。\n");}}
module.exports={buildSeed,serialize,arrayLiteral,relativeUrl};
if(require.main===module)main().catch(error=>{process.stderr.write(error.stack+"\n");process.exitCode=1;});
