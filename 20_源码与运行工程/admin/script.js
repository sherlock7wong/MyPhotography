/* One editor view per public page, with explicit shared content and a separate inbox. */
(() => {
  "use strict";
  const MOCK_AUTH = {
    username: "sherlockwong",
    password: "mrwong0421"
  };
  const store = window.cmsStore;
  const schema = window.cmsPages;
  const clone = value => JSON.parse(JSON.stringify(value));
  const get = schema.get;
  const esc = value => window.cmsRender.escapeHtml(value);
  const views = { dashboard:"数据统计", ...Object.fromEntries(Object.entries(schema.pages).map(([id,page])=>[id,page.label])), messages:"留言收件箱", settings:"全站共用与接口" };
  const aliases = { profile:"about", gallery:"photography", categories:"photography", city:"photography" };
  const statusOptions = [["Published","显示"],["Draft","草稿"],["Archived","归档"]];
  const bool = (label,path) => ({label,path,type:"checkbox"});
  const item = (label,path,type="text",options={}) => ({label,path,type,...options});
  let state = store.load();
  let saved = clone(state);
  let version = null;
  let active = "dashboard";
  let busy = false;
  let deletingMessage = false;
  let importsPending = 0;
  let importProgress = "";
  let cloudStorageText = "";
  let toastTimer;
  const dirty = new Set();
  const docs = {};
  const selected = {};
  let gallerySearch = "";
  let galleryStatus = "all";
  let galleryCategory = "all";
  let galleryPage = 1;
  const galleryPageSize = 12;
  let galleryReturnProjectId = "";
  let tagDraft = "";
  let comparisonPhotoId = "";
  const analytics = { loading:false, data:null, error:"", loaded:false };
  const $ = selector => document.querySelector(selector);
  const collections = {};
  function put(object,path,value) {
    const keys=path.split(".");
    if (keys.some(key=>["__proto__","constructor","prototype"].includes(key))) throw new Error("字段路径无效。");
    let parent=object;
    for (const key of keys.slice(0,-1)) parent=parent[key] ||= {};
    parent[keys.at(-1)] = value;
  }
  function mark(path) {
    const root=Object.keys(collections).find(key=>path === key || path.startsWith(key+".")) || path;
    if (JSON.stringify(get(state,root)) === JSON.stringify(get(saved,root))) dirty.delete(root); else dirty.add(root);
    updateStatus();
  }
  function notify(text, duration=5000) {
    clearTimeout(toastTimer); $("#toast").textContent=text; $("#toast").hidden=false;
    toastTimer=setTimeout(()=>$("#toast").hidden=true,duration);
  }
  function confirm(text, ok="确认", danger=false) {
    const previous=document.activeElement;
    $("#confirmMessage").textContent=text;
    $("[data-confirm-ok]").textContent=ok;
    $("[data-confirm-ok]").classList.toggle("danger-button",danger);
    $("#confirmModal").hidden=false;
    $("[data-confirm-cancel]").focus();
    return new Promise(resolve=>{
      const finish=value=>{ $("#confirmModal").hidden=true; $("[data-confirm-ok]").classList.remove("danger-button"); $("[data-confirm-ok]").onclick=null; $("[data-confirm-cancel]").onclick=null; document.removeEventListener("keydown",key); previous?.focus(); resolve(value); };
      const key=event=>{ if(event.key === "Escape") finish(false); if(event.key === "Tab") { event.preventDefault(); ($(":focus") === $("[data-confirm-cancel]") ? $("[data-confirm-ok]") : $("[data-confirm-cancel]")).focus(); } };
      $("[data-confirm-ok]").onclick=()=>finish(true); $("[data-confirm-cancel]").onclick=()=>finish(false); document.addEventListener("keydown",key);
    });
  }
  function updateStatus() {
    $("#unsavedNotice").hidden=!(dirty.size||tagDraft.trim());
    const pending=busy || importsPending>0;
    document.querySelectorAll('[data-action="delete-message"]').forEach(node=>node.disabled=pending);
    document.querySelectorAll('[data-action="save-current"],[data-action="reset-current"],input[type="file"],[data-gallery-upload],[data-bind],[data-row-path],[data-comparison-photo],[data-tag-name],[data-tag-new],[data-project-photo-project],[data-project-photo-choice],[data-project-photo-action],[data-project-photo-edit],[data-return-project],[data-gallery-scope],[data-gallery-search],[data-gallery-category],[data-gallery-status]').forEach(n=>{n.disabled=pending;});
    document.querySelectorAll("[data-tag-action]").forEach(node=>{node.disabled=pending||node.dataset.tagBoundary==="true";});
    document.querySelectorAll("[data-project-photo-action]").forEach(node=>{node.disabled=pending||node.dataset.projectPhotoBoundary==="true";});
    document.querySelectorAll("[data-gallery-page]").forEach(node=>node.disabled=pending||node.dataset.galleryBoundary==="true");
    $("[data-action='save-current']").textContent=busy ? deletingMessage ? "正在处理删除…" : "正在保存…" : store.mode === "server" ? "保存本页到网站" : store.mode === "cloud" ? "保存本页到云端" : "保存当前页";
    $("#editorNotice").textContent=store.mode === "server" ? "本机网站共享内容：保存后，前台重新打开或切回页面即可读取更新。不同浏览器使用同一份网站数据。" : store.mode === "local" ? "旧版浏览器预览：内容仅存在当前浏览器，可用于查看和导出旧稿。" : "云端模式：保存成功后本站访客将读取更新；发生版本冲突时会保留当前草稿。";
    if (importsPending) $("#editorNotice").textContent=importProgress || "正在处理图片，请稍候。完成前不能切换页面或保存。";
  }
  async function loadDoc(view) {
    if (!schema.pages[view] || docs[view]) return;
    const response=await fetch(schema.pages[view].url,{cache:"no-store"});
    if (!response.ok) throw new Error("无法读取对应前台页面，请检查本地服务。");
    docs[view]=new DOMParser().parseFromString(await response.text(),"text/html");
  }
  function publicationState(row,kind) {
    const status=String(row.status||"Draft").trim().toLowerCase();
    const allowed=kind==="projects"?row.isVisible!==false:["public","published"].includes(String(row.visibility||"").trim().toLowerCase());
    if(["published","public"].includes(status))return allowed?"Published":"Hidden";
    return status==="draft"?"Draft":status==="archived"?"Archived":"Hidden";
  }
  function field(def, base="") {
    const path=base ? base+(def.path ? "."+def.path : "") : def.path;
    let value=get(state,path);
    if (value === undefined && def.staticField) {value=def.fallbackPath ? get(state,def.fallbackPath) : undefined;value ??= schema.readField(docs[active],def) ?? "";}
    if(value == null && def.fallbackKey) value=get(state,base+"."+def.fallbackKey);
    value ??= def.fallbackValue;
    value ??= def.type === "checkbox" ? (path.startsWith("componentVisibility.") || path.startsWith("settings.effects.")) : "";
    const type=def.type;
    if(type==="tags")return tagEditor(value,path,def.label,def.help);
    if(type==="scopes") {
      const photo=get(state,base)||{};
      const scopes=Array.isArray(value)?value:["overview",photo.categoryId].filter(Boolean);
      const options=scopeOptions().filter(([key])=>key!=="home");
      return '<fieldset class="field wide gallery-scopes"><legend>'+esc(def.label)+'</legend><div>'+options.map(([key,title])=>'<label><input type="checkbox" data-gallery-scope="'+esc(key)+'" data-gallery-index="'+base.split('.').at(-1)+'" '+(scopes.includes(key)?'checked':'')+' />'+esc(title)+'</label>').join('')+'</div><small class="field-help">勾选要展示的页面，可多选。首页和联系页自动读取“摄影总览”中的精选作品。</small></fieldset>';
    }
    const label=esc(def.label);
    const attr=`data-bind="${esc(path)}" data-type="${type}"`;
    let control;
    if(type === "publication") {
      const current=publicationState(get(state,base)||{},base.split(".")[0]);
      control='<select '+attr+'>'+[["Published","显示"],["Draft","草稿"],["Hidden","隐藏"],["Archived","归档"]].map(([key,title])=>'<option value="'+key+'" '+(current.toLowerCase()===key.toLowerCase()?'selected':'')+'>'+title+'</option>').join('')+'</select>';
    }
    else if (type === "checkbox") control=`<input type="checkbox" ${attr} ${value ? "checked" : ""} />`;
    else if (type === "textarea" || type === "lines") control=`<textarea ${attr} rows="4">${esc(type === "lines" && Array.isArray(value) ? value.join("\n") : value)}</textarea>`;
    else if (type === "select" || type === "multi") {
      const options=typeof def.options === "function" ? def.options() : def.options;
      control=`<select ${attr} ${type === "multi" ? "multiple" : ""}>${(options||[]).map(option=>{ const [key,title]=Array.isArray(option) ? option : [option,option]; return `<option value="${esc(key)}" ${(type === "multi" ? Array.isArray(value) && value.includes(key) : String(value) === String(key)) ? "selected" : ""}>${esc(title)}</option>`; }).join("")}</select>`;
    } else if (type === "image") {
      const src=schema.safeUrl(value,true);
      control=`<span class="image-edit"><img src="${esc(src || "../Home/assets/photographer.png")}" alt="${label}预览" /><span class="image-inputs"><input ${attr} type="text" value="${esc(value)}" placeholder="图片地址，或选择文件" /><input type="file" accept="image/*" data-file-bind="${esc(path)}" aria-label="上传${label}" /></span></span>`;
    } else control=`<input ${attr} type="${type === "number" ? "number" : "text"}" value="${esc(value)}" ${def.min !== undefined ? `min="${def.min}"` : ""} ${def.max !== undefined ? `max="${def.max}"` : ""} />`;
    return `<label class="field ${["textarea","lines","image"].includes(type) ? "wide" : ""}"><span>${label}</span>${control}${def.help ? `<small class="field-help">${esc(def.help)}</small>` : ""}</label>`;
  }
  function tagEditor(value,path,label,help) {
    const tags=Array.isArray(value)?value:[];
    const rows=tags.map((tag,index)=>'<li class="skill-tag-row"><span class="skill-tag-number">'+String(index+1).padStart(2,'0')+'</span><input type="text" data-tag-name data-tag-index="'+index+'" value="'+esc(tag)+'" aria-label="第'+(index+1)+'个技能标签" /><span class="skill-tag-actions"><button type="button" data-tag-action="up" data-tag-index="'+index+'" data-tag-boundary="'+(index===0)+'" '+(index===0?'disabled':'')+' aria-label="上移第'+(index+1)+'个标签">↑</button><button type="button" data-tag-action="down" data-tag-index="'+index+'" data-tag-boundary="'+(index===tags.length-1)+'" '+(index===tags.length-1?'disabled':'')+' aria-label="下移第'+(index+1)+'个标签">↓</button><button type="button" data-tag-action="remove" data-tag-index="'+index+'" aria-label="删除第'+(index+1)+'个标签">删除</button></span></li>').join('');
    return '<fieldset class="field wide skill-tag-editor" data-tags-editor="'+esc(path)+'"><legend>'+esc(label)+' <small>（'+tags.length+'）</small></legend><p class="field-help">'+esc(help||'')+'</p><ol class="skill-tag-list">'+(rows||'<li class="empty-editor">还没有标签，在下面输入一个添加。</li>')+'</ol><div class="skill-tag-add"><label><span>新标签</span><input type="text" data-tag-new aria-label="输入新技能标签" placeholder="例如：人像摄影" value="'+esc(tagDraft)+'" /></label><button class="secondary-button" type="button" data-tag-action="add">添加标签</button></div><p class="field-help" data-tag-status role="status">点添加或按回车加入；顺序与前台一致。修改后保存本页才会同步到前台。</p></fieldset>';
  }
  function redrawTags(focusIndex) {
    const editor=$("[data-tags-editor]");if(!editor)return;
    editor.outerHTML=tagEditor(state.profile.tags,"profile.tags","Focus / Skills 标签","对应前台 Skills & Focus 的小标签。直接改文字，点删除移除，用上下箭头调整显示顺序。");
    updateStatus();
    const target=Number.isInteger(focusIndex)?document.querySelector('[data-tag-name][data-tag-index="'+focusIndex+'"]'):$("[data-tag-new]");target?.focus({preventScroll:true});
  }
  function addTag() {
    const value=tagDraft.trim();const status=$("[data-tag-status]");
    if(!value){if(status)status.textContent="先输入一个标签名称。";$("[data-tag-new]")?.focus();return false;}
    if(state.profile.tags.some(tag=>String(tag).trim().toLocaleLowerCase()===value.toLocaleLowerCase())){if(status)status.textContent="已经有这个标签了，可以直接修改现有标签。";$("[data-tag-new]")?.focus();return false;}
    state.profile.tags.push(value);tagDraft="";mark("profile.tags");redrawTags();return true;
  }
  function tagAction(button) {
    if(busy||importsPending)return;
    const name=button.dataset.tagAction;if(name==="add"){addTag();return;}
    const index=Number(button.dataset.tagIndex);const tags=state.profile.tags;if(!Number.isInteger(index)||index<0||index>=tags.length)return;
    let focus=index;
    if(name==="remove"){tags.splice(index,1);focus=Math.min(index,tags.length-1);}
    else if(name==="up"||name==="down"){const next=index+(name==="up"?-1:1);if(next<0||next>=tags.length)return;[tags[index],tags[next]]=[tags[next],tags[index]];focus=next;}
    else return;
    mark("profile.tags");redrawTags(focus<0?undefined:focus);
  }
  function panel(title,fields,note="",options={}) {
    return `<section class="editor-panel ${options.full ? "full-width" : ""}">${options.closed ? `<details><summary>${esc(title)}</summary>` : `<h2>${esc(title)}</h2>`}${note ? `<p class="panel-note">${esc(note)}</p>` : ""}<div class="editor-fields">${fields.map(f=>field(f)).join("")}</div>${options.closed ? "</details>" : ""}</section>`;
  }
  function pageFields() {
    const aboutHelp={path:"这是 About 大标题下方的装饰小字，例如 /about。留空时前台不显示，填写后会出现。它不会改变浏览器网址或页面跳转。",portraitAlt:"用一句话描述肖像里拍了什么，给读屏软件或图片加载失败时使用。图片正常显示时，不会把这段字另外印在照片下面。"};
    return schema.pages[active].groups.map((section,index)=>panel(section.label,section.fields.filter(f=>schema.readField(docs[active],f)!==undefined).map(f=>({...f,path:'settings.pageContent.'+active+'.'+f.key,staticField:true,...(active==='about'&&aboutHelp[f.key]?{help:aboutHelp[f.key]}:{})})),"",{closed:index>0})).join("");
  }
  function seoPreview() {
    const doc=docs[active];
    const meta=window.cmsSeo?.resolve(state,active,{baseUrl:new URL(schema.pages[active].url,location.href).href,fallback:doc?window.cmsSeo.readHtmlMetadata(doc.documentElement.outerHTML,{original:true}):{}});
    if(!meta)return '<p class="panel-note">正在读取页面预览…</p>';
    return '<div class="seo-preview-grid"><article class="seo-preview-card"><small>搜索结果效果示意</small><p class="seo-preview-url">'+esc(meta.canonicalUrl)+'</p><h3 class="seo-preview-title">'+esc(meta.title)+'</h3><p>'+esc(meta.description||'未设置摘要，将由搜索引擎从页面内容选择。')+'</p></article><article class="seo-preview-card">'+(meta.image?'<img class="seo-share-image" src="'+esc(meta.image)+'" alt="分享图片效果示意" />':'')+'<small>链接分享效果示意</small><h3>'+esc(meta.title)+'</h3><p>'+esc(meta.description)+'</p></article></div><p class="field-help">'+(!meta.seoEnabled?'全站的“搜索摘要标签”当前已关闭。 ':'')+(!meta.ogEnabled?'全站的“社交分享标签”当前已关闭。 ':'')+'预览随输入更新，保存后才作用于网站。实际搜索摘要和分享卡片由对应平台生成；127.0.0.1 本机地址无法供外网抓取。</p>';
  }
  function seoFields() {
    const fields=[item("浏览器标签与搜索标题",'settings.pageSeo.'+active+'.title'),item("搜索结果摘要",'settings.pageSeo.'+active+'.description',"textarea"),item("链接分享图片",'settings.pageSeo.'+active+'.ogImage',"image"),item("规范页面地址",'settings.pageSeo.'+active+'.canonicalUrl',"url")];
    return '<section class="editor-panel full-width"><details><summary>本页搜索摘要与分享预览</summary><p class="panel-note">这些内容用于浏览器标签、搜索结果和链接分享卡片，不会修改页面内的主标题、正文或照片。</p><ul class="seo-explanation"><li><strong>标题：</strong>改变浏览器标签文字，也提供搜索结果和分享卡片的标题。</li><li><strong>摘要：</strong>提供搜索结果和分享卡片的简介；搜索引擎可能另选正文。</li><li><strong>分享图片：</strong>提供链接分享卡片的封面，页面内照片不随之改变。</li><li><strong>规范地址：</strong>告诉搜索引擎本页的正式网址，不会把访客自动跳转。留空使用当前页面地址。</li></ul><p class="field-help">标题、摘要和分享图留空时使用页面默认信息。摄影分类可以单独覆盖。</p><div class="editor-fields">'+fields.map(def=>field(def)).join('')+'</div><div data-seo-preview aria-live="polite">'+seoPreview()+'</div></details></section>';
  }
  function visibility() {return panel("本页模块显示",Object.entries(schema.pages[active].components).map(([key,[label]])=>bool(label,`componentVisibility.${active}.${key}`)),"这里控制本页区域；全站页眉、导航和页脚总开关关闭时，本页仍受总开关控制。内容始终保留。",{closed:true});}
  function register(path,config) {collections[path]=config;return path;}
  const categoryOptions=()=>[["","未分类"],...state.categories.map(c=>[c.id,c.name])];
  const scopeOptions=()=>[["overview","摄影总览"],...state.categories.map(c=>[c.id,`${c.name} 分类页`]),["home","旧首页手选标记（保留）"]];
  const collectionDefinitions = {
    projects: {title:"项目卡片",image:"coverImage",name:"title",create:()=>({id:crypto.randomUUID(),title:"新项目",description:"",coverImage:"",coverAlt:"",year:"",theme:"",location:"",categoryIds:[],isVisible:true,isFeatured:false,status:"Draft",sortOrder:state.projects.length+1,photoIds:[],linkUrl:"",linkLabel:"View Collection"}),fields:[item("项目名称","title"),item("主题","theme"),item("项目介绍","description","textarea"),item("封面图片","coverImage","image"),item("图片说明","coverAlt"),item("拍摄地点","location"),item("拍摄年份","year"),item("关联摄影分类","categoryIds","multi",{options:categoryOptions}),item("查看按钮文字","linkLabel"),item("详情搜索标题","seoTitle","text",{help:"留空自动使用项目名称；只影响这个项目详情的浏览器、搜索与分享标题。"}),item("详情搜索摘要","seoDescription","textarea",{help:"留空使用项目介绍，不改变正文。"}),item("详情分享图片","ogImage","image",{help:"留空使用项目封面。"}),item("详情规范网址","canonicalUrl","url",{help:"留空使用本站项目详情地址，不会改变点击后的跳转目标。"}),item("前台状态","status","publication",{help:"统一控制项目是否公开；显示、草稿、隐藏、归档只需选择一项。照片自身的公开状态仍在作品库管理。"}),item("排序（较小在前）","sortOrder","number")]},
    gallery: {title:"摄影作品",image:"image",name:"title",create:()=>({id:crypto.randomUUID(),title:"新作品",image:"",altText:"",description:"",categoryId:state.categories[0]?.id||"",category:state.categories[0]?.name||"",status:"Draft",featured:false,displayScopes:["overview",state.categories[0]?.id].filter(Boolean),sortOrder:state.gallery.length+1,year:"",location:""}),fields:[item("作品图片","image","image"),item("作品名称","title"),item("主要分类","categoryId","select",{options:categoryOptions,help:"用于作品的类别文字及分类公开检查；下面可选择多个展示页面。"}),item("显示状态","status","select",{options:statusOptions}),bool("精选作品","featured"),item("展示页面（可多选）","displayScopes","scopes"),item("图片说明","altText"),item("作品介绍","description","textarea"),item("拍摄年份","year"),item("拍摄日期","date"),item("拍摄地点","location"),item("照片标签（选填）","styleLabel"),item("卡片布局","layout","select",{options:[["normal","标准"],["wide","横幅"],["tall","竖幅"]]}),item("排序（较小在前）","sortOrder","number"),...[["camera","相机"],["lens","镜头"],["aperture","光圈"],["shutter","快门"],["iso","感光度"],["time","拍摄时间"],["film","胶片"]].map(([key,label])=>item(label,key))]},
    categories: {title:"分类管理",image:"coverImage",name:"name",create:()=>({id:crypto.randomUUID(),name:"新分类",slug:"",heroTitle:"",description:"",coverImage:"",coverAlt:"",visibility:"Public",status:"Draft",sortOrder:state.categories.length+1}),fields:[item("分类入口名称","name","text",{help:"显示在摄影总览的分类卡片及分类导航中。"}),item("分类页标题","heroTitle","text",{help:"进入分类后显示的大标题；留空使用分类入口名称。"}),item("分类页介绍","pageIntro","textarea",{fallbackKey:"description",help:"只维护这一段分类介绍；未设置时显示旧介绍，修改后使用这里的新内容。分类入口卡片只显示名称和照片数量。"}),item("分类卡片封面","coverImage","image"),item("分类卡片图片说明","coverAlt"),item("分类页封面","heroImage","image",{help:"各分类首屏统一显示这一张照片；留空使用上方的分类卡片封面。"}),item("分类页封面说明","heroAlt"),item("分类页所在地","location"),item("档案编号","archiveNo"),item("侧栏集合名称","railTitle"),item("封面标注（每行一项）","coverNotes","lines"),item("路径装饰文字","slug"),item("浏览器与搜索标题","seoTitle"),item("搜索摘要","seoDescription","textarea"),item("分享预览图片","ogImage","image"),item("规范页面地址","canonicalUrl","url"),item("前台状态","status","publication",{help:"只用这一项控制分类公开状态。隐藏、草稿或归档时，该分类及归属它的照片不会向访客公开。"}),item("排序（较小在前）","sortOrder","number")]},
    "profile.timeline": {title:"经历时间线",name:"title",create:()=>({id:crypto.randomUUID(),date:"",title:"新经历",place:"",description:"",type:"",active:true}),fields:[item("时间","date"),item("经历标题","title"),item("地点","place"),item("经历介绍","description","textarea"),item("经历类型","type"),bool("前台显示","active")]},
    "contact.contactMethods": {title:"联系卡片",name:"title",image:"coverImage",create:()=>({id:crypto.randomUUID(),title:"新联系卡片",type:"link",value:"",url:"",description:"",actionLabel:"Open",coverImage:"",isVisible:true,sortOrder:state.contact.contactMethods.length+1}),fields:[item("卡片名称","title"),item("联系方式类型","type","select",{options:[["email","邮箱"],["wechat","微信"],["instagram","Instagram"],["qr","二维码"],["link","其他链接"]]}),item("账号或邮箱","value"),item("访问链接","url","url"),item("按钮文字","actionLabel"),item("联系说明","description","textarea"),item("二维码或图片","coverImage","image"),item("图片说明","coverAlt"),bool("前台显示","isVisible"),item("排序（较小在前）","sortOrder","number")]},
    "settings.navigation": {title:"共用导航",name:"label",create:()=>({id:crypto.randomUUID(),label:"新导航",url:"",visible:true,sortOrder:state.settings.navigation.length+1}),fields:[item("导航文字","label"),item("导航链接","url","url"),bool("前台显示","visible"),item("排序（较小在前）","sortOrder","number")]},
  };
  Object.entries(collectionDefinitions).forEach(([path,config])=>register(path,config));
  function rows(path) {
    if(path==="gallery")return galleryRows();
    const config=collections[path];const array=get(state,path)||[];
    selected[path]=Math.min(Math.max(0,selected[path]||0),Math.max(0,array.length-1));
    const current=selected[path];let visible=array.map((row,index)=>({row,index}));
    const selectedRow=array[current];let toolbar="";
    const buttons=visible.map(({row,index})=>{
      const source=config.primitive?row:row[config.image];
      const title=config.primitive?`照片 ${index+1}`:row[config.name]||`条目 ${index+1}`;
      const status=["projects","categories"].includes(path)?({Published:"显示",Draft:"草稿",Hidden:"隐藏",Archived:"归档"})[publicationState(row,path)]:row?.status?statusOptions.find(([key])=>key===row.status)?.[1]||"显示":"";
      return `<button class="entity-item ${current===index?"is-active":""}" type="button" data-row-path="${path}" data-row-index="${index}" ${path==="gallery"?`data-gallery-id="${esc(row.id)}"`:""}>${source?`<img src="${esc(schema.safeUrl(source,true))}" alt="" />`:""}<span>${esc(title)}<small>${status}${path==="gallery"?` · ${esc(Array.isArray(row.displayScopes)?row.displayScopes.map(scope=>scopeOptions().find(([key])=>key===scope)?.[1]||scope).join(" / "):"总览及所属分类")}`:""}</small></span></button>`;
    }).join("");
    return `<section class="editor-panel collection-panel" id="collection-${path.replaceAll('.','-')}"><div class="collection-heading"><h2>${config.title} <small>（${array.length}）</small></h2><button class="secondary-button" type="button" data-action="add-row" data-path="${path}">添加${path==="gallery"||path.endsWith("photos")?"作品":"条目"}</button></div>${toolbar}<div class="entity-list"><div class="entity-rail ${path==="gallery"?"photo-grid":""}">${buttons||'<p class="empty-editor">暂无条目</p>'}</div><div>${selectedRow!==undefined?`<div class="editor-fields">${config.fields.map(f=>field(f,`${path}.${current}`)).join("")}</div><div class="entity-actions"><button class="secondary-button" type="button" data-action="row-up" data-path="${path}">上移</button><button class="secondary-button" type="button" data-action="row-down" data-path="${path}">下移</button><button class="danger-button" type="button" data-action="remove-row" data-path="${path}">移除此条目</button></div>`:'<p class="empty-editor">添加内容后在这里编辑；空列表不会显示原始示例。</p>'}</div></div></section>`;
  }
  function matchingGallery() {
    const query=gallerySearch.trim().toLocaleLowerCase();
    return state.gallery.map((row,index)=>({row,index})).filter(({row})=>
      (galleryStatus==="all"||row.status===galleryStatus) &&
      (galleryCategory==="all"||(galleryCategory==="unclassified"?!row.categoryId:row.categoryId===galleryCategory)) &&
      (!query||[row.title,row.description,row.location,row.category].join(" ").toLocaleLowerCase().includes(query)));
  }
  function revealGallerySelection(clear=false) {
    if(clear){gallerySearch="";galleryStatus="all";galleryCategory="all";}
    const position=matchingGallery().findIndex(({index})=>index===selected.gallery);
    if(position>=0)galleryPage=Math.floor(position/galleryPageSize)+1;
  }
  function galleryEditor(photo,index) {
    const basic=new Set(["image","title","categoryId","status","featured","displayScopes"]);
    const technical=new Set(["camera","lens","aperture","shutter","iso","time","film"]);
    const fields=collections.gallery.fields;
    const draw=defs=>'<div class="editor-fields">'+defs.map(def=>field(def,'gallery.'+index)).join('')+'</div>';
    const project=state.projects.find(row=>row.id===galleryReturnProjectId);
    const originalUrl=store.originalDownloadUrl(photo.image);
    const originalAction=originalUrl?'<a class="secondary-button" href="'+esc(originalUrl)+'" download>下载云端原图</a>':'';
    const back=project?'<button type="button" class="secondary-button" data-return-project="'+esc(project.id)+'">返回项目「'+esc(project.title||'未命名项目')+'」</button>':'';
    return '<div class="gallery-editor"><div class="gallery-editor-heading"><h3>编辑作品</h3><span>'+esc(photo.title||'未命名作品')+'</span>'+back+'</div><p class="field-help">作品资料在这里统一编辑，保存后同步到所有引用它的项目和页面。</p>'+draw(fields.filter(def=>basic.has(def.path)))+'<details class="gallery-extra"><summary>照片说明与排版（选填）</summary>'+draw(fields.filter(def=>!basic.has(def.path)&&!technical.has(def.path)))+'</details><details class="gallery-extra"><summary>拍摄参数（选填）</summary>'+draw(fields.filter(def=>technical.has(def.path)))+'</details><div class="entity-actions">'+originalAction+'<button class="secondary-button" type="button" data-action="row-up" data-path="gallery">上移</button><button class="secondary-button" type="button" data-action="row-down" data-path="gallery">下移</button><button class="danger-button" type="button" data-action="remove-row" data-path="gallery">移除作品</button></div></div>';
  }
  function galleryRows() {
    const found=matchingGallery();const pages=Math.max(1,Math.ceil(found.length/galleryPageSize));
    galleryPage=Math.max(1,Math.min(pages,galleryPage));
    const visible=found.slice((galleryPage-1)*galleryPageSize,galleryPage*galleryPageSize);
    if(!visible.some(({index})=>index===selected.gallery))selected.gallery=visible[0]?.index;
    const current=visible.find(({index})=>index===selected.gallery);
    const cards=visible.map(({row,index})=>'<button class="gallery-tile '+(index===selected.gallery?'is-active':'')+'" type="button" data-row-path="gallery" data-row-index="'+index+'" data-gallery-id="'+esc(row.id)+'" aria-pressed="'+(index===selected.gallery)+'">'+(schema.safeUrl(row.image,true)?'<img src="'+esc(schema.safeUrl(row.image,true))+'" loading="lazy" decoding="async" alt="" width="180" height="120" />':'<span class="gallery-no-image">待上传图片</span>')+'<span><strong>'+esc(row.title||'未命名作品')+'</strong><small>'+esc(statusOptions.find(([key])=>key===row.status)?.[1]||row.status||'显示')+' · '+esc(state.categories.find(c=>c.id===row.categoryId)?.name||'未分类')+(row.featured?' · 精选':'')+'</small></span></button>').join('');
    const pageButton=(number,text,disabled=false,current=false)=>'<button class="secondary-button" type="button" data-gallery-page="'+number+'" '+(disabled?'disabled data-gallery-boundary="true"':'')+(current?' aria-current="page"':'')+'>'+text+'</button>';
    let numbers='';let last=0;
    for(let number=1;number<=pages;number++)if(number===1||number===pages||Math.abs(number-galleryPage)<=1){if(last&&number-last>1)numbers+='<span aria-hidden="true">…</span>';numbers+=pageButton(number,String(number),false,number===galleryPage);last=number;}
    const pagination='<nav class="gallery-admin-pagination" aria-label="摄影作品管理分页">'+pageButton(galleryPage-1,'上一页',galleryPage===1)+numbers+pageButton(galleryPage+1,'下一页',galleryPage===pages)+'<span role="status">共 '+found.length+' 件 · 第 '+galleryPage+' / '+pages+' 页</span></nav>';
    return '<section class="editor-panel collection-panel gallery-library" id="collection-gallery"><div class="collection-heading"><h2>摄影作品 <small>（'+state.gallery.length+'）</small></h2><div class="entity-actions"><a class="secondary-button" href="#categories" data-view-link="categories">管理分类</a><button class="secondary-button" type="button" data-action="add-row" data-path="gallery">添加作品</button><label class="upload-button"><span data-gallery-upload-label>'+(importsPending?'正在导入…':'批量导入图片')+'</span><input type="file" data-gallery-upload accept="image/jpeg,image/png,image/webp,image/gif" multiple /></label></div></div><p class="panel-note">上传图片，填写名称并选择分类即可。新作品默认是草稿，改为“显示”并保存后公开。每页最多 12 件，点击缩略图编辑。</p>'+(store.imageStorage.cloudOriginals?'<p class="panel-note">在这里选图即可直接上传云端：原图私有保存（每张最多 50 MB），自动生成网页展示图和缩略图；GIF 动画最多 8 MB。上传成功后，仍需保存当前页。电脑中的原文件不会改动。</p><p class="panel-note" data-cloud-storage-note>'+esc(cloudStorageText)+'</p>':'')+'<div class="editor-toolbar gallery-library-tools"><label><span>查找作品</span><input aria-label="搜索作品" data-gallery-search value="'+esc(gallerySearch)+'" placeholder="名称、介绍或地点" /></label><label><span>分类</span><select data-gallery-category aria-label="按分类查找作品"><option value="all">全部分类</option><option value="unclassified" '+(galleryCategory==='unclassified'?'selected':'')+'>未分类</option>'+state.categories.map(c=>'<option value="'+esc(c.id)+'" '+(galleryCategory===c.id?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label><label><span>状态</span><select data-gallery-status aria-label="筛选显示状态"><option value="all">全部状态</option>'+statusOptions.map(([key,title])=>'<option value="'+key+'" '+(galleryStatus===key?'selected':'')+'>'+title+'</option>').join('')+'</select></label></div><div class="gallery-library-grid">'+(cards||'<p class="empty-editor">没有匹配的作品，试试其他关键词或分类。</p>')+'</div>'+pagination+(current?galleryEditor(current.row,current.index):'')+'</section>';
  }
  function redrawGallery() {
    const gallery=document.querySelector('#collection-gallery');
    if(gallery){gallery.outerHTML=galleryRows();updateStatus();}
  }
  register("settings.homeComparison.entries",{title:"每张精选的原片配置"});
  function comparisonPhotos() { return window.cmsHomeComparison.featured(store.getPublicData()); }
  function comparisonPanel() {
    const photos=comparisonPhotos();
    let photo=photos.find(row=>row.id===comparisonPhotoId)||photos[0];
    comparisonPhotoId=photo?.id||"";
    let body='<p class="empty-editor">当前没有可显示的首页精选。请先到摄影页发布作品，选择摄影总览并勾选精选。</p>';
    if(photo){
      const config=window.cmsHomeComparison.configuration(state.settings,photo,new URL(schema.pages.home.url,location.href).href);
      const index=config.entryIndex<0?(state.settings.homeComparison?.entries?.length||0):config.entryIndex;
      const root='settings.homeComparison.entries.'+index;
      const defs=[item("这张照片的原片",root+'.beforeImage',"image",{fallbackValue:config.beforeImage,help:"只需上传这张精选照片对应的原片网页图片；成片自动取自摄影作品。清空后仅展示成片。"}),item("原片图片说明",root+'.beforeAlt',"text",{fallbackValue:config.beforeAlt}),item("这张照片的展示标题",root+'.workTitle',"text",{fallbackValue:config.workTitle}),...[["lightNote","光线观察说明"],["toneNote","色调观察说明"],["detailNote","细节观察说明"]].map(([key,label])=>item(label,root+'.'+key,"textarea",{fallbackValue:config[key]}))];
      body='<label class="field"><span>选择首页精选照片</span><select data-comparison-photo aria-label="选择首页精选照片">'+photos.map(row=>'<option value="'+esc(row.id)+'" '+(row.id===photo.id?'selected':'')+'>'+esc(row.title||"未命名作品")+'</option>').join('')+'</select></label><figure class="comparison-source"><img src="'+esc(schema.safeUrl(photo.image,true))+'" alt="当前作品成片" /><figcaption><strong>'+esc(photo.title||"未命名作品")+'</strong><span>成片自动读取摄影作品，无需重复上传</span><small>'+esc(config.inheritedLegacy?'已匹配这张作品的旧原片设置，首次修改时转为独立配置。':config.beforeImage?'已配置原片，可在前台拖动对比。':'尚未配置原片，前台只展示这张成片。')+'</small></figcaption></figure><div class="editor-fields">'+defs.map(def=>field(def)).join('')+'</div>';
    }
    return '<section class="editor-panel full-width"><h2>精选照片的原片与成片</h2><p class="panel-note">每张首页精选分别保存原片和观察说明。前台点击照片、编号或用方向键切换时，自动读取同一作品的配置；精选增减、换图和排序也按作品对应。未配置原片时展示成片。</p><div class="editor-fields">'+field(item("模块标题","settings.homeComparison.title","text",{staticField:true,selector:"[data-comparison-title]"}))+'</div>'+body+'</section>';
  }
  function writeBound(path,value) {
    const match=path.match(/^settings\.homeComparison\.entries\.(\d+)\./);
    if(match){
      const config=state.settings.homeComparison ||= {};
      if(!Array.isArray(config.entries))config.entries=[];
      const index=Number(match[1]);
      if(!config.entries[index]){
        const photo=comparisonPhotos().find(row=>row.id===comparisonPhotoId);
        if(!photo)throw new Error("当前精选照片已变化，请重新打开首页编辑。");
        const resolved=window.cmsHomeComparison.configuration(state.settings,photo,new URL(schema.pages.home.url,location.href).href);
        config.entries[index]={photoId:photo.id,...Object.fromEntries(window.cmsHomeComparison.fields.map(key=>[key,resolved[key]??""]))};
      }
    }
    put(state,path,value);mark(path);
  }
  function currentPhotoProject(){return state.projects[selected.projects||0];}
  function projectPhotoRecord(project,image,title,alt){const photo=collections.gallery.create();Object.assign(photo,{title:title||project.title||'未命名照片',altText:alt||title||project.title||'',image,categoryId:'',category:'',displayScopes:[],featured:false,status:['published','public'].includes(String(project.status).toLowerCase())&&project.isVisible!==false?'Published':'Draft'});state.gallery.push(photo);mark('gallery');return photo;}
  function projectPhotoIds(project){
    if(!Array.isArray(project.photoIds)){
      project.photoIds=[];
      if(project.coverImage){const source=window.projectCollections.photos({...state,projects:[]},{...project,photoIds:undefined})[0];let photo=source&&state.gallery.find(row=>row.id===source.id);if(!photo)photo=projectPhotoRecord(project,project.coverImage,project.title,project.coverAlt);project.photoIds.push(photo.id);}
    }
    return project.photoIds;
  }
  function projectPhotoCount(project){return window.projectCollections.photos(state,project).length;}
  function projectPhotosPanel(){
    const project=currentPhotoProject();if(!project)return '<section class="editor-panel full-width" data-project-photos><h2>项目照片</h2><p class="empty-editor">先添加项目，再管理项目中的照片。</p></section>';
    const legacy=!Array.isArray(project.photoIds);const ids=legacy?[]:project.photoIds;const available=new Set(window.projectCollections.availablePhotos(state).map(photo=>photo.id));
    const options=state.gallery.filter(photo=>!ids.includes(photo.id)).map(photo=>'<option value="'+esc(photo.id)+'">'+esc(photo.title||'未命名作品')+'（'+(available.has(photo.id)?'前台可见':'暂不公开')+'）</option>').join('');
    const list=ids.map((id,index)=>{const gi=state.gallery.findIndex(photo=>photo.id===id),photo=state.gallery[gi];const buttons='<div class="entity-actions"><button type="button" class="secondary-button" data-project-photo-action="up" data-photo-index="'+index+'" '+(index===0?'disabled data-project-photo-boundary="true"':'')+'>上移</button><button type="button" class="secondary-button" data-project-photo-action="down" data-photo-index="'+index+'" '+(index===ids.length-1?'disabled data-project-photo-boundary="true"':'')+'>下移</button><button type="button" class="danger-button" data-project-photo-action="remove" data-photo-index="'+index+'">移出项目</button></div>';
      return '<article class="project-photo-editor" data-project-photo-row="'+esc(id)+'"><div class="project-photo-heading"><strong>照片 '+(index+1)+'</strong><span>'+(!photo?'原摄影记录已移除':available.has(id)?'前台可见':'草稿或分类未公开')+'</span></div>'+(photo?'<div class="project-photo-summary">'+(schema.safeUrl(photo.image,true)?'<img src="'+esc(schema.safeUrl(photo.image,true))+'" alt="" loading="lazy" decoding="async" />':'')+'<div><h3>'+esc(photo.title||'未命名作品')+'</h3><button type="button" class="secondary-button" data-project-photo-edit="'+esc(id)+'">到摄影作品库编辑 →</button></div></div>':'<p class="empty-editor">此引用不会在前台展示，可移出项目。</p>')+buttons+'</article>';
    }).join('');
    const preview=window.projectCollections.detailUrl(project.id,Math.floor((selected.projects||0)/6)+1);
    return '<section class="editor-panel full-width" data-project-photos><div class="collection-heading"><h2>项目照片 <small id="projectPhotoCount">前台可见 '+projectPhotoCount(project)+' 张</small></h2><a class="secondary-button" data-project-detail-link href="'+esc(preview)+'" target="_blank" rel="noopener">查看此项目详情 →</a></div><p class="panel-note">项目列表和详情照片均每页最多 6 项，数量不设上限。点击项目进入自己的详情页；照片分页、总数和胶片页索引自动按这里的关联清单和顺序展示，不会自动混入整个摄影分类。此处只管理项目选片与顺序。照片名称、图片、说明和公开状态统一到摄影作品库编辑，按钮会直接定位到对应照片；保存后所有引用处同步。移出只解除当前项目关联，不删除照片。</p><label class="field"><span>选择要管理的项目</span><select data-project-photo-project aria-label="选择要管理的项目">'+state.projects.map((p,i)=>'<option value="'+i+'" '+(p===project?'selected':'')+'>'+esc(p.title||'未命名项目')+'</option>').join('')+'</select></label>'+(legacy?'<div class="project-photo-legacy"><p>这个旧项目还没有照片清单。前台暂时使用现有封面；可将封面加入后编辑，或选择、上传更多照片。</p><img src="'+esc(schema.safeUrl(project.coverImage,true))+'" alt="现有项目封面" /></div>':'')+'<div class="project-photo-add"><label class="field"><span>从现有摄影作品添加</span><select data-project-photo-choice aria-label="从现有摄影作品添加"><option value="">请选择作品</option>'+options+'</select></label><button type="button" class="secondary-button" data-project-photo-action="add">添加到此项目</button><label class="upload-button">上传项目照片<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple data-project-photo-upload aria-label="上传项目照片" /></label></div><p class="field-help">新上传的照片仅关联此项目，不自动出现在摄影总览或首页。上传到已发布项目的照片会随保存公开；草稿项目的新照片保留草稿状态，点击对应照片的编辑按钮，到作品库设为显示。照片所在分类未公开时也不会显示。</p><div class="entity-actions"><button type="button" class="secondary-button" data-project-photo-action="use-cover">把封面加入照片</button><button type="button" class="secondary-button" data-project-photo-action="empty">清空项目照片清单</button></div><div class="project-photo-list">'+(list||'<p class="empty-editor">'+(legacy?'尚未设置独立清单。':'此项目照片清单为空；前台不会显示其他项目或原始示例。')+'</p>')+'</div></section>';
  }
  async function projectPhotoAction(button){
    if(busy||importsPending)return;const project=currentPhotoProject();if(!project)return;const name=button.dataset.projectPhotoAction;
    if(name==='empty'){if(!(await confirm('清空此项目照片关联？照片仍保留在摄影作品库，保存前可以撤销。','清空关联')))return;project.photoIds=[];}
    else if(name==='add'){const id=document.querySelector('[data-project-photo-choice]')?.value;if(!id)return notify('请先选择摄影作品。');const ids=projectPhotoIds(project);if(!ids.includes(id))ids.push(id);}
    else if(name==='use-cover'){if(!project.coverImage)return notify('请先设置项目封面。');const ids=projectPhotoIds(project);let photo=state.gallery.find(row=>ids.includes(row.id)&&row.image===project.coverImage)||state.gallery.find(row=>row.image===project.coverImage);if(!photo)photo=projectPhotoRecord(project,project.coverImage,project.title,project.coverAlt);if(!ids.includes(photo.id))ids.push(photo.id);}
    else{const ids=projectPhotoIds(project),index=Number(button.dataset.photoIndex);if(!Number.isInteger(index)||index<0||index>=ids.length)return;if(name==='remove')ids.splice(index,1);else{const next=index+(name==='up'?-1:1);if(next<0||next>=ids.length)return;[ids[index],ids[next]]=[ids[next],ids[index]];}}
    mark('projects');render();
  }
  function pageContent() {
    let content="";
    if(active==="home") {
      content+=panel("首页主标题与档案",[item("首页主标题","settings.homeHero.heroHeadline"),item("默认选中照片位置","settings.homeDefaultIndex","number",{min:1,help:"从当前精选列表的第几张开始；超出数量时使用最后一张。"}),item("首页档案编号","settings.homeHero.archiveNo"),item("首页所在地","settings.homeHero.basedIn")],"首页日期自动显示北京时间的当前日期，无需手动填写。");
      content+='<section class="editor-panel"><h2>首页精选照片（自动读取）</h2><p class="panel-note">在摄影页将作品的“展示页面（可多选）”勾选“摄影总览”，再勾选“精选作品”并设置“排序（较小在前）”。首页与摄影总览精选使用同一名单；分类页专属精选不进入首页。保存后读取已发布且分类公开的作品，无精选时显示空态。旧首页手选名单和简介卡数据保留。</p><a class="secondary-button" href="#photography" data-view-link="photography">管理摄影精选 →</a></section>';
    }
    if(active==="home") content+=comparisonPanel();
    if(active==="about") content+=panel("关于页基本资料",[...[["displayName","姓名"],["role","身份"],["location","所在地"],["availability","合作状态"],["email","邮箱"]].map(([key,label])=>item(label,'profile.'+key,"text",key==="location"?{help:"统一用于关于页右侧资料表及顶部档案所在地；在这里改一次，两处一起更新；留空时两处都显示 To be added（待补充）。"}:key==="availability"?{help:"告诉访客你现在接不接拍摄或合作。对应前台照片右侧资料表里标为 Availability 的那一行，例如“接受约拍”或“暂不接合作”。"}:{})),item("肖像图片","profile.avatar","image"),item("个人资料简短介绍（供搜索读取）","profile.shortIntro","textarea",{help:"给搜索引擎读取的一句话个人介绍，不会在页面上另起一段。只有下方“个人简介”为空时，才会用它作为正文。网页搜索结果的简介另在本页下方“搜索摘要与分享预览”设置。"}),item("个人简介","profile.biography","textarea"),item("Focus / Skills 标签","profile.tags","tags",{help:"对应前台 Skills & Focus 的小标签。直接改文字，点删除移除，用上下箭头调整显示顺序。"})]);
    if(active==="contact") content+=panel("联系页介绍与工作状态",[["title","页面标题"],["subtitle","副标题"],["description","联系介绍","textarea"],["year","年份范围"],["location","所在地"],["responseTime","回复时间"],["availability","合作状态"],["currentLocation","当前地点"],["workingDays","工作日"],["formTitle","留言区标题"],["formSubtitle","留言区介绍"],["formNote","表单说明","textarea"]].map(([key,label,type])=>item(label,`contact.page.${key}`,type||"text")));
    if(active==="photography") content+=panel("访客交互设置",[item("默认排序","settings.photographyView.defaultSort","select",{options:[["latest","最新优先"],["oldest","最早优先"],["title","按标题"]]}),item("默认视图","settings.photographyView.defaultView","select",{options:[["grid","网格"],["list","列表"]]}),bool("允许访客收藏","settings.photographyView.favoritesEnabled"),bool("摄影页照片放大查看","settings.effects.lightbox")],"收藏仅保存在访客自己的浏览器；照片放大查看只控制摄影页，项目详情保留自己的查看大图功能。");
    if(active==="contact") {
      const featured=comparisonPhotos();
      content+='<section class="editor-panel contact-film-help"><h2>联系页底部照片条</h2><p class="panel-note">这是联系页下方横向滚动的一排精选照片，用来展示作品。照片自动取自摄影作品库，这里不用重复上传或填写。</p><div class="contact-film-preview">'+featured.slice(0,5).map(photo=>'<img src="'+esc(schema.safeUrl(photo.image,true))+'" alt="'+esc(photo.title||'精选照片')+'" loading="lazy" />').join('')+'</div><p class="field-help">当前共有 '+featured.length+' 张：在摄影作品中勾选“摄影总览”和“精选作品”，保存后这里与前台一起更新。关闭本页“胶片照片条”可隐藏它。</p><a class="secondary-button" href="#gallery" data-view-link="gallery">到作品库管理精选 →</a></section>';
    }
    content+=pageFields();
    const pageCollections={home:[],about:["profile.timeline"],projects:["projects"],photography:["gallery","categories"],contact:["contact.contactMethods"]};
    content+=(pageCollections[active]||[]).map(rows).join("");
    if(active==="projects")content+=projectPhotosPanel();
    if(active==="contact") content+=panel("留言校验与反馈",[bool("接受前台留言","settings.integrations.contactEnabled"),item("最少字符数","settings.contactForm.minLength","number",{min:12,max:5000}),item("最多字符数","settings.contactForm.maxLength","number",{min:12,max:5000}),...[["sendingText","提交中按钮文字"],["nameError","姓名错误提示"],["emailError","邮箱错误提示"],["messageError","留言为空提示"],["lengthError","字数不足提示"],["successTitle","成功提示标题"],["localSuccess","本地保存成功说明"],["cloudSuccess","云端接收成功说明"],["errorText","提交失败说明"],["disabledText","暂停留言说明"]].map(([key,label])=>item(label,`settings.contactForm.${key}`))],"云端接收仍由服务器校验；至少 12 字符，最多 5000 字符。",{closed:true});
    return content+visibility()+seoFields();
  }
  function dashboard() {
    const publicData=store.getPublicData();
    // The same work can appear in several Photography views or on other pages.
    const photographyRows = data => {
      const scopes = new Set(["overview", ...data.categories.map(category => category.id)]);
      return [...new Map(data.gallery
        .filter(row => !Array.isArray(row.displayScopes) || row.displayScopes.some(scope => scopes.has(scope)))
        .map(row => [row.id, row])).values()];
    };
    const photos=photographyRows(state);
    const publicIds=new Set(photographyRows(publicData).map(row=>row.id));
    const unread=state.messages.filter(row=>["new","unread"].includes(row.status)).length;
    const totals=analytics.data?.totals;
    const metric=(label,value,note,kind="")=>'<article class="stat-card '+kind+'"><span>'+label+'</span><strong>'+esc(value===undefined?'—':Number(value).toLocaleString('zh-CN'))+'</strong><small>'+esc(note)+'</small></article>';
    const content=metric("项目数量",state.projects.length,publicData.projects.length+" 项允许前台展示")+metric("照片总数",photos.length,"摄影页作品 · 按作品去重")+metric("摄影分类",state.categories.length,publicData.categories.length+" 个公开分类")+metric("留言总数",state.messages.length,"未读 "+unread+" · 已读或已处理 "+(state.messages.length-unread));
    const visits=metric("今日浏览",totals?.todayPageViews,"前台页面打开次数","stat-card-emphasis")+metric("今日访客",totals?.todayVisitors,"按浏览器去重","stat-card-emphasis")+metric("累计浏览",totals?.pageViews,"自统计启用起")+metric("累计访客",totals?.visitors,"按浏览器去重")+metric("留言阅读次数",totals?.messageReads,"后台实际打开留言详情")+metric("今日留言阅读",totals?.todayMessageReads,"按北京时间统计");
    const categories=state.categories.map(category=>{
      const rows=photos.filter(row=>row.categoryId===category.id);
      return '<tr><th scope="row">'+esc(category.name)+'</th><td>'+rows.length+'</td><td>'+rows.filter(row=>publicIds.has(row.id)).length+'</td><td>'+rows.filter(row=>row.featured===true).length+'</td></tr>';
    }).join('');
    const max=Math.max(1,...(analytics.data?.daily||[]).map(row=>row.pageViews));
    const startedDay=analytics.data?.startedAt?new Date(new Date(analytics.data.startedAt).getTime()+8*3600000).toISOString().slice(0,10):"";
    const days=(analytics.data?.daily||[]).map(row=>{const missing=startedDay&&row.date<startedDay;return '<div class="trend-day '+(missing?'is-untracked':'')+'"><span class="trend-count">'+(missing?'—':row.pageViews)+'</span><span class="trend-track"><i style="height:'+(missing?0:Math.max(0,Number(row.pageViews)||0)/max*100)+'%"></i></span><time datetime="'+esc(row.date)+'">'+esc(row.date.slice(5))+'</time><small>'+(missing?'未统计':row.visitors+' 位')+'</small></div>';}).join('');
    const pages=(analytics.data?.pages||[]).filter(row=>row.page!=="city").map(row=>'<tr><th scope="row">'+esc(schema.pages[row.page]?.label||row.page)+'</th><td>'+row.pageViews+'</td><td>'+row.visitors+'</td></tr>').join('');
    return '<section class="editor-panel full-width dashboard-heading"><div><p class="dashboard-eyebrow">网站内容 / CONTENT</p><h2>内容一览</h2></div><button class="secondary-button" type="button" data-action="refresh-analytics" '+(analytics.loading?'disabled':'')+'>'+(analytics.loading?'正在更新…':'刷新统计')+'</button></section><div class="stat-grid full-width">'+content+'</div><section class="editor-panel full-width"><div class="dashboard-section-title"><h2>访问与留言阅读</h2><span class="field-help">北京时间</span></div><div class="stat-grid stat-grid-visits">'+visits+'</div><p class="panel-note" role="status">'+esc(analytics.loading?'正在读取访问记录…':analytics.error||(analytics.data?.capacityReached?"统计存储已达到容量，历史记录仍可查看，新增访问暂未记录。":!analytics.loaded?'正在准备统计…':'统计始于 '+(analytics.data?.startedAt?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',dateStyle:'medium',timeStyle:'short'}).format(new Date(analytics.data.startedAt)):'当前服务')+'。仅统计前台访问；后台及图片请求不计入。访客数按浏览器识别，同一人的不同设备会分别计数。'))+'</p></section><section class="editor-panel full-width"><h2>最近 14 天浏览趋势</h2>'+(analytics.data?'<div class="visits-trend" role="img" aria-label="最近14天每天的浏览和访客数量">'+days+'</div><details class="trend-data"><summary>查看每日明细</summary><table class="dashboard-table"><thead><tr><th>日期</th><th>浏览</th><th>访客</th></tr></thead><tbody>'+(analytics.data.daily||[]).map(row=>'<tr><th scope="row">'+esc(row.date)+'</th><td>'+(startedDay&&row.date<startedDay?'—':row.pageViews)+'</td><td>'+(startedDay&&row.date<startedDay?'—':row.visitors)+'</td></tr>').join('')+'</tbody></table></details>':'<p class="empty-editor">'+esc(analytics.error||'正在读取访问统计…')+'</p>')+'</section><section class="editor-panel"><h2>每个类别的照片数量</h2><p class="field-help">统计已加入摄影总览或分类页的作品，按作品 ID 去重；首页、项目页等重复展示不累加。未加入摄影页的上传、封面、头像和二维码不计入。</p><div class="table-scroll"><table class="dashboard-table"><thead><tr><th>类别</th><th>全部</th><th>前台可见</th><th>精选</th></tr></thead><tbody>'+categories+'</tbody></table></div></section><section class="editor-panel"><h2>前台页面浏览</h2>'+(analytics.data?'<table class="dashboard-table"><thead><tr><th>页面</th><th>浏览</th><th>访客</th></tr></thead><tbody>'+pages+'</tbody></table>':'<p class="empty-editor">'+esc(analytics.error||'正在读取访问统计…')+'</p>')+'</section>';
  }
  async function refreshAnalytics() {
    if(analytics.loading)return;
    analytics.loading=true;analytics.error="";
    if(active==="dashboard")render();
    try{
      if(store.mode==="local")throw new Error("旧版浏览器预览不记录访问，请通过本机网站服务或云端接口查看真实统计。");
      const result=await (await store.request("/api/admin/analytics")).json();
      if(!result.available||!result.totals||!Array.isArray(result.daily)||!Array.isArray(result.pages))throw new Error(result.error||"访问统计暂不可用，请检查服务和统计存储。");
      analytics.data=result;analytics.loaded=true;
    }catch(error){analytics.data=null;analytics.error="访问统计暂不可用："+error.message;}
    finally{analytics.loading=false;if(active==="dashboard")render();}
  }
  async function recordMessageRead() {
    const message=state.messages[selected.messages||0];if(store.mode==="local"||!message?.id)return;
    try{await store.request("/api/admin/analytics/message-read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId:crypto.randomUUID(),messageId:message.id})});analytics.loaded=false;}
    catch(_){notify("留言内容已打开，阅读统计暂未记录。",5000);}
  }
  function inbox() {
    register("messages",{title:"留言"});selected.messages=Math.min(selected.messages||0,Math.max(0,state.messages.length-1));const message=state.messages[selected.messages];
    return `<section class="editor-panel full-width"><h2>来自联系页的留言</h2><p class="panel-note">联系页提交的留言保存在当前网站的数据来源中。归档保留记录；修改备注或状态后保存当前页。删除会直接保存，无需再次保存本页。</p><div class="entity-list"><div class="entity-rail">${state.messages.map((m,index)=>`<button class="entity-item ${index===selected.messages?"is-active":""}" type="button" data-row-path="messages" data-row-index="${index}"><span>${esc(m.name)}${m.email.endsWith("@example.com")?"（示例）":""}<small>${esc(({unread:"未读",new:"未读",read:"已读",replied:"已回复",archived:"已归档"})[m.status]||"未读")} · ${esc(m.createdAt)}</small></span></button>`).join("")||'<p class="empty-editor">暂无留言</p>'}</div><div>${message?`<h3>${esc(message.name)}</h3><p>${esc(message.email)}${message.projectType&&!/^other$/i.test(message.projectType)?` · ${esc(message.projectType)}`:""}</p><p class="message-body">${esc(message.message)}</p><div class="editor-fields">${field(item("处理状态",`messages.${selected.messages}.status`,"select",{options:[["unread","未读"],["read","已读"],["replied","已回复"],["archived","已归档"]]}))}${field(item("内部备注",`messages.${selected.messages}.internalNotes`,"textarea"))}</div><p class="panel-note">“已回复”是处理记录，后台不会自动发送邮件。</p><p><button class="danger-button" type="button" data-action="delete-message" data-message-id="${esc(message.id)}">删除留言</button></p>`:""}</div></div></section>`;
  }
  async function deleteInboxMessage(id) {
    if(active!=="messages"||busy||importsPending)return;
    if(dirty.size||tagDraft.trim())return notify("请先保存或撤销当前页修改，再删除留言。",8000);
    const target=state.messages.find(message=>String(message.id)===id);if(!target)return notify("此留言已不在当前列表中，请重新读取。");
    const expectedVersion=version;
    const source=store.mode==="cloud"?"云端":store.mode==="server"?"本机网站":"当前浏览器";
    let refresh=false;
    busy=true;deletingMessage=true;updateStatus();
    try{
      if(!(await confirm(`删除“${target.name}”的留言？将从${source}当前数据中删除此留言及内部备注，后台无法撤销。其他留言不受影响。`,"删除留言",true)))return;
      if(store.mode!=="local"){
        const response=await store.request("/api/admin/messages/"+encodeURIComponent(id),{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({version:expectedVersion})});
        const result=await response.json();
        if(result.deleted!==true||result.id!==id||!Number.isSafeInteger(result.version)||result.version!==expectedVersion+1||!result.state||!Array.isArray(result.state.messages)||result.state.messages.some(message=>String(message.id)===id))throw new Error("服务器未返回完整的删除确认。");
        state=store.normalize(result.state);version=result.version;store.save(state);
      }else{
        const latest=store.load();const current=latest.messages.find(message=>String(message.id)===id);
        if(!current||JSON.stringify(current)!==JSON.stringify(target)){const error=new Error("此留言已在另一标签页修改或删除，请重新读取后再操作。");error.status=409;throw error;}
        latest.messages=latest.messages.filter(message=>String(message.id)!==id);state=store.save(latest);
      }
      saved=clone(state);dirty.clear();analytics.loaded=false;render();notify(`已从${source}删除此留言，无需再次保存。`);
    }catch(error){
      refresh=true;
      notify(error.status===409?"留言或网站内容已更新，本次未删除。正在重新读取，请核对后再操作。":error.status===404?"此留言不存在或已经删除，正在重新读取列表。":"删除结果尚未确认："+error.message+" 请重新读取留言列表核对。",10000);
    }finally{
      busy=false;deletingMessage=false;updateStatus();
      if(refresh){if(store.mode==="local"){state=store.load();saved=clone(state);render();}else await refreshRemote();}
      if(active==="messages")document.querySelector('[data-action="delete-message"]')?.focus({preventScroll:true});
    }
  }
  function settings() {
    return panel("共用页眉",[["brandName","页眉品牌文字"],["headerKicker","页眉右侧说明"]].map(([key,label])=>item(label,`settings.globalInfo.${key}`)),"页脚版权、所在地和搜索摘要请到对应页面编辑；分类与项目详情的专属信息在各自管理区设置。旧全站默认资料保留为兼容回退，不再提供重复输入。")+rows("settings.navigation")+
    panel("全站显示",Object.entries({Header:"页眉",Navigation:"主导航",Footer:"页脚","SEO Meta":"搜索摘要标签","Open Graph Meta":"社交分享标签"}).map(([key,label])=>bool(label,`componentVisibility.global.${key}`)),"这是全站总开关；关闭页脚后，各页面的页脚开关即使勾选也不会显示。搜索摘要与社交分享标签只影响网页元信息。")+
    panel("共用动效",Object.entries({pageTransition:"页面转场",filmGrain:"胶片颗粒",customCursor:"细线鼠标尾迹",imageHover:"图片悬停",scrollReveal:"滚动渐显",parallax:"视差"}).map(([key,label])=>bool(label,`settings.effects.${key}`)),"尊重访客系统的减少动态效果偏好。摄影照片放大开关在摄影页的访客交互设置中。")+
    panel("网站维护提示",[bool("启用维护提示","settings.maintenance.enabled"),item("维护提示文字","settings.maintenance.message","textarea")],"启用后前台显示提示，隐藏页面主要内容；不阻止管理员访问。")+
    panel("内容读取与超时设置",[item("请求超时（秒）","settings.integrations.timeoutSeconds","number",{min:3,max:60}),item("公开内容检查间隔（秒，0 或至少 10）","settings.integrations.refreshSeconds","number",{min:0,max:3600})],"当前数据来源："+(store.mode==="server"?"本机网站共享文件。":store.mode==="local"?"当前浏览器的旧稿预览。":"本站云端接口。")+" 此处配置会公开给访客，不填写密钥。")+
    `<section class="editor-panel full-width"><h2>网站内容接口</h2><p class="panel-note">按现有 Worker 接口接入登录、版本校验保存、图片上传、公开读取与留言。本地验证前端调用；部署与真实云端验收另行记录。</p><table class="interface-table"><thead><tr><th>用途</th><th>请求</th><th>规则</th></tr></thead><tbody>${[["管理员登录","POST /api/admin/login","服务器验证，会话 Cookie"],["会话检查与退出","GET /api/admin/session · POST /api/admin/logout","同源请求"],["读取与保存内容","GET / PUT /api/admin/state","携带 version；冲突不覆盖"],["图片存储",store.imageStorage.cloudOriginals?"POST /api/admin/upload-sessions":"POST /api/admin/upload",store.imageStorage.cloudOriginals?"原图私有保存；50 MB 内；网页图片自动生成":"JPEG、PNG、WebP、GIF；8 MB 内"],["访客读取内容","GET /api/public-state.js","不包含留言和内部备注"],["内容版本检查","GET /api/public-version","按设置检查更新"],["前台留言","POST /api/contact","服务器校验，成功后提示接收"], ["记录前台访问","POST /api/analytics/pageview","仅六页可见浏览，不含后台和图片请求"], ["读取统计仪表盘","GET /api/admin/analytics","管理员会话；独立持久化"], ["记录留言阅读","POST /api/admin/analytics/message-read","实际打开详情，独立事件去重"]].map(row=>`<tr>${row.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table></section>`;
  }
  function render() {
    $("#viewTitle").textContent=views[active];$("#breadcrumbView").textContent=views[active];
    $("#viewSubtitle").textContent=schema.pages[active]?.hint||(active==="settings"?"所有页面共用的内容与数据连接。":active==="dashboard"?"查看网站内容、前台访问与留言阅读情况。":"查看和处理来自联系页的留言。");
    document.querySelectorAll('[data-action="save-current"],[data-action="reset-current"]').forEach(node=>node.hidden=active==="dashboard");
    $("#editorNotice").hidden=active==="dashboard";
    $("#previewLink").href=schema.pages[active]?.url||"../Home/index.html";
    $("#viewRoot").innerHTML=`<div class="editor-grid">${active==="dashboard"?dashboard():active==="messages"?inbox():active==="settings"?settings():pageContent()}</div>`;
    document.querySelectorAll("[data-view-link]").forEach(n=>{n.classList.toggle("is-active",(n.dataset.viewLink===active));if(n.dataset.viewLink===active)n.setAttribute("aria-current","page");else n.removeAttribute("aria-current");});updateStatus();
  }
  let refreshingRemote=false;
  async function refreshRemote(renderView=true) {
    if(store.mode==="local"||busy||importsPending||dirty.size||refreshingRemote)return;
    refreshingRemote=true;
    try{
      const response=await store.request("/api/admin/state");const result=await response.json();
      if(!result.state||!Number.isFinite(result.version))throw new Error("网站内容格式不正确。");
      if(busy||importsPending||dirty.size||(Number.isFinite(version)&&result.version<=version))return;
      state=store.normalize(result.state);version=result.version;store.save(state);saved=clone(state);
      if(renderView)render();
    }catch(error){notify(error.message,10000);}finally{refreshingRemote=false;}
  }
  window.addEventListener("focus",()=>{if(!$("#adminShell").hidden){refreshRemote();if(active==="dashboard")refreshAnalytics();}});
  async function navigate(view) {
    const previousView=view;view=aliases[view]||view;if(!views[view])view="dashboard";
    if(importsPending||busy){notify("正在处理内容，请完成后再切换页面。");return;}
    if(view!==active&&(dirty.size||tagDraft.trim())){if(!(await confirm("当前页有未保存修改。保存成功后再切换页面。","保存并切换"))){history.replaceState(null,"",`#${active}`);return;}if(!(await save())){history.replaceState(null,"",`#${active}`);return;}}
    if(store.mode!=="local"&&!dirty.size)await refreshRemote(false);
    await loadDoc(view);active=view;history.replaceState(null,"",`#${active}`);render();
    if(active==="dashboard")refreshAnalytics();
    if(active==="messages")recordMessageRead();
    if(view==="photography"&&["gallery","categories"].includes(previousView))$("#collection-"+previousView)?.scrollIntoView();
  }
  async function editProjectPhoto(id) {
    if(busy||importsPending)return;
    const projectId=currentPhotoProject()?.id;
    await navigate("photography");if(active!=="photography")return;
    const index=state.gallery.findIndex(photo=>photo.id===id);
    if(index<0)return notify("这张作品已被移除，请重新选择。");
    galleryReturnProjectId=projectId||"";selected.gallery=index;revealGallerySelection(true);redrawGallery();
    document.querySelector(".gallery-editor")?.scrollIntoView({block:"start"});
    document.querySelector('.gallery-editor [data-bind$=".title"]')?.focus({preventScroll:true});
  }
  async function returnToProject(id) {
    if(busy||importsPending)return;
    await navigate("projects");if(active!=="projects")return;
    const index=state.projects.findIndex(project=>project.id===id);if(index<0)return notify("原项目已被移除。");
    selected.projects=index;galleryReturnProjectId="";render();document.querySelector("[data-project-photos]")?.scrollIntoView({block:"start"});
  }
  function validate() {
    if(dirty.has("projects"))for(const project of state.projects)if(Object.hasOwn(project,"photoIds")&&(!Array.isArray(project.photoIds)||project.photoIds.some(id=>typeof id!=="string")||new Set(project.photoIds).size!==project.photoIds.length))throw new Error("项目照片清单无效，请检查重复或错误的关联。");
    if(dirty.has("profile.tags")){const tags=state.profile.tags.map(tag=>String(tag).trim());const empty=tags.findIndex(tag=>!tag);if(empty>=0){document.querySelector('[data-tag-name][data-tag-index="'+empty+'"]')?.focus();throw new Error("标签名称不能为空，删除不需要的标签即可。");}if(new Set(tags.map(tag=>tag.toLocaleLowerCase())).size!==tags.length)throw new Error("有重复的技能标签，请修改或删除重复项。");state.profile.tags=tags;mark("profile.tags");}
    for(const input of document.querySelectorAll("[data-bind]")){
      const kind=input.dataset.type;
      if(input.dataset.bind==="settings.homeDefaultIndex"&&!Number.isInteger(Number(input.value))){input.focus();throw new Error("默认选中照片位置请填写正整数。");}
      if(["image","url"].includes(kind)&&input.value.trim()&&!schema.safeUrl(input.value,kind==="image")){input.focus();throw new Error("请使用有效的图片或网页地址，不能使用脚本链接。");}
      if(kind==="number"&&(!Number.isFinite(Number(input.value))||(input.min&&Number(input.value)<Number(input.min))||(input.max&&Number(input.value)>Number(input.max)))){input.focus();throw new Error("请检查数字设置的有效范围。");}
    }
    const interval=Number(state.settings.integrations.refreshSeconds);
    if(interval>0 && interval<10)throw new Error("内容检查间隔请设为 0（关闭）或至少 10 秒。");
    if(Number(state.settings.contactForm.minLength)>Number(state.settings.contactForm.maxLength))throw new Error("最少字符数不能大于最多字符数。");
  }
  async function save() {
    if(busy||importsPending){notify("图片处理完成后才能保存。");return false;}
    if(active==="about"&&tagDraft.trim()&&!addTag())return false;
    if(!dirty.size){notify("本页没有待保存的修改。");return true;}
    try{
      validate();busy=true;updateStatus();
      if(store.mode !== "local"){
        const response=await store.request("/api/admin/state",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({state,version})});
        const result=await response.json();if(!Number.isFinite(result.version))throw new Error("云端返回的数据版本无效，未确认保存。");version=result.version;store.save(state);
      }else{
        const latest=store.load();
        for(const path of dirty){
          if(path==="messages"){
            for(const message of state.messages){const original=saved.messages.find(m=>m.id===message.id);const current=latest.messages.find(m=>m.id===message.id);if(!original||!current)continue;for(const key of["status","internalNotes"])if(message[key]!==original[key]){if(current[key]!==original[key])throw new Error("此留言已在另一标签页修改。请先导出草稿，再重新读取。");current[key]=message[key];}}
          }else{
            if(JSON.stringify(get(latest,path))!==JSON.stringify(get(saved,path)))throw new Error("此项内容已在另一标签页修改。本次未覆盖，请先导出草稿再刷新。");put(latest,path,clone(get(state,path)));
          }
        }
        state=store.save(latest);
      }
      saved=clone(state);dirty.clear();notify(store.mode === "server"?`本页已保存到本机网站（版本 ${version}）。`:store.mode === "cloud"?"本页已保存到云端。":"本页已保存，请刷新前台查看。");return true;
    }catch(error){
      const message=error.name==="QuotaExceededError"?"保存失败：本机浏览器容量不足。草稿仍保留，请导出备份、减少新图片后重试。":error.name==="SecurityError"?"保存失败：浏览器存储不可用。草稿仍保留，请允许本站存储后重试。":error.message;notify(message,10000);return false;
    }finally{busy=false;updateStatus();}
  }
  async function prepareImage(file, onProgress) {
    if(!file.type.startsWith("image/"))throw new Error("请选择图片文件。");
    if(store.mode !== "local"){
      return store.uploadImageFile(file, { onProgress });
    }
    const source=URL.createObjectURL(file);const img=new Image();let timer;
    try{
      img.src=source;await Promise.race([img.decode(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("图片读取超时，请换一张图片。")),15000);})]);
      const small=file.size*4/3+64<=512*1024;const original=["image/gif","image/svg+xml"].includes(file.type);
      if(original&&(!small||Math.max(img.naturalWidth,img.naturalHeight)>1600))throw new Error("本地 GIF 或 SVG 预览需小于 1600 像素且文件小于 384 KB。");
      if(small&&(original||Math.max(img.naturalWidth,img.naturalHeight)<=1600))return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error("图片读取失败。"));reader.onabort=()=>reject(new Error("图片读取已取消。"));reader.readAsDataURL(file);});
      const canvas=document.createElement("canvas");const context=canvas.getContext("2d");if(!context)throw new Error("当前浏览器无法生成图片预览。");let scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
      for(let i=0;i<8;i++){canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));context.drawImage(img,0,0,canvas.width,canvas.height);const result=canvas.toDataURL("image/webp",.82);if(result.length<=512*1024)return result;scale*=.8;}throw new Error("此图片过大，请选择较小的图片。");
    }catch(error){if(error.name === "EncodingError")throw new Error("图片无法解码，请检查文件是否损坏。");throw error;}finally{clearTimeout(timer);URL.revokeObjectURL(source);}
  }
  async function upload(input) {
    const files=[...input.files];if(!files.length||importsPending)return;importsPending++;updateStatus();let count=0;const errors=[];
    try{
      for(const file of files)try{
        const result=await prepareImage(file, message=>{importProgress=`第 ${count+errors.length+1}/${files.length} 张 · ${file.name.slice(0,80)}：${message}`;updateStatus();});
        if(input.hasAttribute("data-project-photo-upload")){const project=currentPhotoProject();if(!project)throw new Error("请先选择项目。");const ids=projectPhotoIds(project);const title=file.name.replace(/\.[^.]+$/,"");const photo=projectPhotoRecord(project,result,title,title);ids.push(photo.id);mark("projects");}
        else if(input.hasAttribute("data-gallery-upload")){const photo=collections.gallery.create();photo.title=file.name.replace(/\.[^.]+$/,"").replace(/[-_]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());photo.altText=photo.title;photo.image=result;state.gallery.push(photo);selected.gallery=state.gallery.length-1;mark("gallery");gallerySearch="";galleryStatus="all";galleryCategory="all";}
        else{writeBound(input.dataset.fileBind,result);}count++;
      }catch(error){errors.push(file.name+"："+error.message);}
    }finally{importsPending--;importProgress="";await refreshStorageUsage();if(input.hasAttribute("data-gallery-upload"))revealGallerySelection(true);render();}
    notify(errors.length?`已处理 ${count}/${files.length} 张。${errors[0]}`:`已导入 ${count} 张${store.mode==="local"?"本地预览":"图片"}。请保存当前页。`,errors.length?10000:5000);
  }
  function exportData(data=state,legacy=false){
    if(!legacy&&data===state&&tagDraft.trim()){data=clone(state);data.profile.tags.push(tagDraft);}
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));const anchor=document.createElement("a");const date=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()).replaceAll("/","-");anchor.href=url;anchor.download=`${legacy?"旧版浏览器内容备份_legacy-browser-backup":"摄影网站内容备份_site-content-backup"}_${date}_${Date.now()}.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify("已导出当前数据（含草稿与留言），请妥善保管。");
  }
  async function action(button){
    const name=button.dataset.action;const path=button.dataset.path;
    if(name==="refresh-analytics"){await refreshRemote(false);return refreshAnalytics();}
    if(name==="export")return exportData();if(name==="export-legacy"){try{const raw=localStorage.getItem(store.key);if(!raw)return notify("此浏览器没有可导出的旧版数据。");return exportData(JSON.parse(raw),true);}catch(_){return notify("旧版浏览器数据无法读取，原稿未改动。");}}if(busy||importsPending)return notify("正在处理内容，请稍候。");if(name==="save-current")return save();
    if(name==="delete-message")return deleteInboxMessage(button.dataset.messageId);
    if(name==="reset-current"){if((dirty.size||tagDraft.trim())&&await confirm("撤销本页所有未保存修改，恢复到最近一次读取或保存的内容。","撤销修改")){state=clone(saved);tagDraft="";dirty.clear();render();}return;}
    if(name==="logout"){
      if((dirty.size||tagDraft.trim())&&!(await confirm("仍有未保存的草稿。退出会丢弃它们，可取消后先导出或保存。","退出并放弃草稿")))return;
      if(store.mode !== "local")await store.request("/api/admin/logout",{method:"POST"});else sessionStorage.removeItem("wong.cms.auth");location.reload();return;
    }
    if(!collections[path])return;const list=get(state,path);const index=selected[path]||0;
    if(name==="add-row"){if(collections[path].max && list.length>=collections[path].max) return notify(`此区域固定为最多 ${collections[path].max} 张，请替换或移除现有条目。`);list.push(collections[path].create());selected[path]=list.length-1;}
    if(name==="remove-row"){if(!(await confirm("从本页移除此条目？保存前可用“撤销本页修改”恢复。","移除条目")))return;list.splice(index,1);selected[path]=Math.max(0,index-1);}
    if(name==="row-up"||name==="row-down"){const next=index+(name==="row-up"?-1:1);if(next<0||next>=list.length)return;[list[index],list[next]]=[list[next],list[index]];selected[path]=next;list.forEach((row,i)=>{if(typeof row==="object")row.sortOrder=i+1;});}
    mark(path);if(path==="gallery")revealGallerySelection(name==="add-row");render();
  }
  document.addEventListener("input",event=>{
    const node=event.target;
    if(node.matches("[data-gallery-search]")){gallerySearch=node.value;galleryPage=1;const focus=node.selectionStart;redrawGallery();$("[data-gallery-search]").focus();$("[data-gallery-search]").setSelectionRange(focus,focus);return;}
    if(node.matches("[data-gallery-scope]")){
      if(busy||importsPending)return;
      const photo=state.gallery[Number(node.dataset.galleryIndex)];if(!photo)return;
      const scopes=new Set(Array.isArray(photo.displayScopes)?photo.displayScopes:["overview",photo.categoryId].filter(Boolean));
      if(node.checked)scopes.add(node.dataset.galleryScope);else scopes.delete(node.dataset.galleryScope);
      photo.displayScopes=[...scopes];mark("gallery");return;
    }
    if(node.matches("[data-tag-new]")){tagDraft=node.value;updateStatus();return;}
    if(node.matches("[data-tag-name]")){state.profile.tags[Number(node.dataset.tagIndex)]=node.value;mark("profile.tags");return;}
    if(!node.matches("[data-bind]"))return;
    const type=node.dataset.type;const value=type==="checkbox"?node.checked:type==="number"?(node.value===""?"":Number(node.value)):type==="lines"?node.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean):type==="multi"?[...node.selectedOptions].map(x=>x.value):node.value;
    if(type==="publication"){
      const root=node.dataset.bind.slice(0,-"status".length);
      writeBound(node.dataset.bind,value==="Hidden"?"Published":value);
      writeBound(root+(root.startsWith("projects.")?"isVisible":"visibility"),root.startsWith("projects.")?value!=="Hidden":value==="Hidden"?"Private":"Public");
      mark(node.dataset.bind);return;
    }
    const previous=get(state,node.dataset.bind);writeBound(node.dataset.bind,value);const match=node.dataset.bind.match(/^gallery\.(\d+)\.categoryId$/);
    if(match){const photo=state.gallery[Number(match[1])];photo.category=state.categories.find(c=>c.id===value)?.name||"";if(Array.isArray(photo.displayScopes))photo.displayScopes=[...new Set(photo.displayScopes.map(scope=>scope===previous?value:scope).filter(Boolean))];}
    if(node.dataset.bind.startsWith("settings.pageSeo.")){const preview=$("[data-seo-preview]");if(preview)preview.innerHTML=seoPreview();}
    mark(node.dataset.bind);if(type==="image"){const img=node.closest(".image-edit")?.querySelector("img");if(img)img.src=schema.safeUrl(value,true)||"../Home/assets/photographer.png";}
  });
  document.addEventListener("change",event=>{
    if(event.target.matches('input[type="file"]'))upload(event.target).catch(error=>notify(error.message));
    if(event.target.matches("[data-project-photo-project]")){selected.projects=Number(event.target.value);render();}
    if(event.target.matches("[data-comparison-photo]")){comparisonPhotoId=event.target.value;render();}
    if(event.target.matches("[data-gallery-status]")){galleryStatus=event.target.value;galleryPage=1;redrawGallery();}
    if(event.target.matches("[data-gallery-category]")){galleryCategory=event.target.value;galleryPage=1;redrawGallery();}
    if(event.target.matches('[data-bind$=".categoryId"]')&&event.target.dataset.bind.startsWith("gallery."))redrawGallery();
  });
  document.addEventListener("keydown",event=>{if(event.target.matches("[data-tag-new]")&&event.key==="Enter"&&!event.isComposing){event.preventDefault();if(!busy&&!importsPending)addTag();}});
  document.addEventListener("click",event=>{
    const editPhoto=event.target.closest("[data-project-photo-edit]");if(editPhoto){editProjectPhoto(editPhoto.dataset.projectPhotoEdit).catch(error=>notify(error.message));return;}
    const backProject=event.target.closest("[data-return-project]");if(backProject){returnToProject(backProject.dataset.returnProject).catch(error=>notify(error.message));return;}
    const galleryPager=event.target.closest("[data-gallery-page]");
    if(galleryPager){if(busy||importsPending)return;galleryPage=Number(galleryPager.dataset.galleryPage);redrawGallery();document.querySelector('.gallery-admin-pagination [aria-current="page"]')?.focus({preventScroll:true});return;}
    const projectPhoto=event.target.closest("[data-project-photo-action]");if(projectPhoto){projectPhotoAction(projectPhoto).catch(error=>notify(error.message));return;}
    const tag=event.target.closest("[data-tag-action]");if(tag){tagAction(tag);return;}
    const nav=event.target.closest("[data-view-link]");if(nav){event.preventDefault();navigate(nav.dataset.viewLink).catch(error=>notify(error.message));return;}
    const row=event.target.closest("[data-row-path]");if(row){const changed=selected[row.dataset.rowPath]!==Number(row.dataset.rowIndex);selected[row.dataset.rowPath]=Number(row.dataset.rowIndex);if(row.dataset.rowPath==="gallery")redrawGallery();else render();if(changed&&row.dataset.rowPath==="messages")recordMessageRead();return;}
    const button=event.target.closest("[data-action]");if(button)action(button).catch(error=>notify(error.message,10000));
  });
  window.addEventListener("beforeunload",event=>{if(dirty.size||tagDraft.trim()||importsPending){event.preventDefault();event.returnValue="";}});
  window.addEventListener("hashchange",()=>navigate(location.hash.slice(1)).catch(error=>notify(error.message)));
  window.addEventListener("storage",event=>{if(event.key!==store.key||store.mode!=="local")return;if(dirty.size)notify("其他标签页保存了内容。当前草稿仍保留，保存时将检查冲突。",10000);else{state=store.load();saved=clone(state);render();}});
  function modeNote(){$("#modeNote").textContent=store.mode==="server"?"内容保存到本机网站服务，前后台和不同浏览器读取同一份数据。服务仅限本机访问。":store.mode==="local"?"查看当前浏览器保留的旧稿，保存只影响此旧版独立预览。":"使用本站云端账户登录；密码由服务器验证。";}
  const serverSite=document.querySelector('meta[name="cms-mode"]')?.content==="server";
  $("#dataMode").querySelector('option[value="server"]').hidden=!serverSite;
  $("#dataMode").querySelector('option[value="cloud"]').hidden=serverSite;
  $("#dataMode").querySelector('option[value="local"]').hidden=serverSite || document.querySelector('meta[name="cms-mode"]')?.content==="cloud";
  $("#dataMode").value=store.mode;modeNote();
  $("#dataMode").addEventListener("change",event=>{sessionStorage.setItem("wong.cms.mode",event.target.value);sessionStorage.setItem("wong.cms.browser-preview",String(event.target.value==="local"));location.reload();});
  async function refreshStorageUsage() {
    const note=$("#cloudStorage");
    if(!note)return;
    note.hidden=!store.imageStorage.cloudOriginals;
    if(note.hidden)return;
    const format=bytes=>bytes>=1000000000?(bytes/1000000000).toFixed(2)+" GB":(bytes/1000000).toFixed(1)+" MB";
    try{
      const result=await (await store.request("/api/admin/storage")).json();
      if(![result.usedBytes,result.reservedBytes,result.limitBytes].every(Number.isFinite)||result.usedBytes<0||result.reservedBytes<0||result.limitBytes<=0)throw new Error("invalid");
      const remaining=Math.max(0,result.limitBytes-result.usedBytes-result.reservedBytes);
      note.textContent="云端图片：已用 "+format(result.usedBytes)+" / "+format(result.limitBytes)+"，可用 "+format(remaining)+(result.reservedBytes>0?"；上传待确认占用 "+format(result.reservedBytes):"")+"。";
      const copies=result.displayCopies;
      if(copies?.enabled&&[copies.usedBytes,copies.reservedBytes,copies.limitBytes,copies.readyFiles,copies.totalFiles].every(Number.isFinite))note.textContent+=" 网页图片副本：已就绪 "+copies.readyFiles+" / "+copies.totalFiles+" 个，占用 "+format(copies.usedBytes+copies.reservedBytes)+" / "+format(copies.limitBytes)+(copies.readyFiles<copies.totalFiles?"；部分副本待确认，原图已保留。":"。");
    }catch(_){note.textContent="暂时无法读取剩余图片空间；下次上传时会再次检查。";}
    cloudStorageText=note.textContent;
    document.querySelectorAll("[data-cloud-storage-note]").forEach(node=>{node.textContent=cloudStorageText;});
  }
  async function openApp(loadRemote=true){
    if(store.mode !== "local"&&loadRemote){const response=await store.request("/api/admin/state");const result=await response.json();if(!result.state||!Number.isFinite(result.version))throw new Error("云端内容格式不正确。");state=store.normalize(result.state);version=result.version;store.save(state);}
    if(store.mode==="cloud")await store.inspectImageStorage({refresh:true});
    await refreshStorageUsage();
    saved=clone(state);dirty.clear();$("#loginScreen").hidden=true;$("#adminShell").hidden=false;$("#storageMode").textContent=store.mode==="server"?"本机网站共享内容":store.mode==="local"?"旧版浏览器预览":"本站云端接口";
    $("#sidebarNav").innerHTML=Object.entries(views).map(([id,label],index)=>`${id==="home"?'<span class="nav-section">前台页面编辑</span>':id==="messages"?'<span class="nav-section">共用管理</span>':""}<a href="#${id}" data-view-link="${id}"><span class="nav-index">${String(index+1).padStart(2,"0")}</span><span>${label}</span></a>`).join("");
    await navigate(location.hash.slice(1)||"dashboard");
  }
  $("#loginForm").addEventListener("submit",async event=>{
    event.preventDefault();const button=$("#loginForm button[type='submit']");button.disabled=true;$("#loginError").hidden=true;
    try{
      const username=$("#loginUsername").value.trim();const password=$("#loginPassword").value;
      if(store.mode !== "local")await store.request("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});
      else{if(username!==MOCK_AUTH.username||password!==MOCK_AUTH.password)throw new Error("用户名或密码不正确。");sessionStorage.setItem("wong.cms.auth","true");}
      await openApp();$("#loginPassword").value="";
    }catch(error){$("#loginError").textContent=error.status===401?"用户名或密码不正确。":error.message;$("#loginError").hidden=false;}finally{button.disabled=false;}
  });
  (async()=>{try{if(store.mode !== "local"){await store.request("/api/admin/session");await openApp();}else if(sessionStorage.getItem("wong.cms.auth")==="true")await openApp(false);}catch(error){if(error.status!==401){$("#loginError").textContent=error.message;$("#loginError").hidden=false;}}})();
})();
