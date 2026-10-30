/* Shared page editor schema and safe bindings. Existing paths keep old CMS data compatible. */
(function () {
  "use strict";
  const field = (key, label, selector, options = {}) => ({ key, label, selector, type: "text", ...options });
  const text = (key, label, selector, options) => field(key, label, selector, options);
  const long = (key, label, selector, options) => field(key, label, selector, { type: "textarea", ...options });
  const image = (key, label, selector, options) => field(key, label, selector, { type: "image", attr: "src", ...options });
  const link = (key, label, selector, options) => field(key, label, selector, { type: "url", attr: "href", ...options });
  const group = (label, fields) => ({ label, fields });
  const archive = (inherit = true, currentDate = false) => group("本页档案信息", [
    text("archiveNumberLabel", "编号标签", ".archive-meta > span", { index: 0 }),
    text("archiveNumber", "本页编号", ".archive-meta > strong"),
    text("updatedLabel", "更新日期标签", ".archive-meta > span", { index: 1 }),
    text("updated", "本页更新日期", ".archive-meta > b", { index: 0, fallbackPath: inherit ? "settings.homeHero.updated" : undefined }),
    text("locationLabel", "所在地标签", ".archive-meta > span", { index: 2 }),
    text("location", "本页所在地", ".archive-meta > b", { index: 1, fallbackPath: inherit ? "settings.globalInfo.defaultLocation" : undefined })
  ].filter(item => !currentDate || !["updated", "updatedLabel"].includes(item.key)));
  const footer = () => group("本页页脚", [
    ...[0, 1, 2].flatMap(index => [
      text(`footerLabel${index}`, `第 ${index + 1} 栏标题`, ".footer-column > span", { index }),
      text(`footerText${index}`, `第 ${index + 1} 栏内容`, ".footer-column > p", { index })
    ]),
    text("copyright", "本页版权说明", ".copyright", { fallbackPath: "settings.globalInfo.copyrightText" })
  ]);
  const toolbar = (filters=true) => group(filters?"筛选、排序与详情文案":"排序与详情文案", [
    ...(filters?[text("filterLabel", "筛选提示", "[data-filter-group] > span")]:[]),
    text("sortLabel", "排序标签", 'label[for="photo-sort"]'),
    ...["latest", "oldest", "title"].map((value, i) => text(`sort${value}`, ["最新优先选项", "最早优先选项", "按标题选项"][i], `option[value="${value}"]`)),
    text("empty", "无作品提示", "[data-empty-state]"),
    text("previousPhoto", "上一张按钮", "[data-photo-prev]"),
    text("nextPhoto", "下一张按钮", "[data-photo-next]"),
    text("gridViewLabel", "网格视图说明", '[data-view="grid"]', { attr: "aria-label" }),
    text("listViewLabel", "列表视图说明", '[data-view="list"]', { attr: "aria-label" }),
    text("detailCloseLabel", "关闭详情说明", "[data-detail-close]", { attr: "aria-label" }),
    ...(filters?[text("allFilter", "全部作品筛选文字", '[data-filter="all"]', {default:"All"}),text("featuredFilter", "精选筛选文字", '[data-filter="featured"]')]:[]),
    ...["camera","lens","aperture","shutter","iso","date"].map((key,index)=>text(`detailLabel${key}`, ["相机字段标签","镜头字段标签","光圈字段标签","快门字段标签","感光度字段标签","日期字段标签"][index],`[data-detail-label-${key}]`,{archiveOnly:true}))
  ]);
  const pages = {
    home: { label: "首页", url: "../Home/index.html", hint: "首页照片条读取摄影总览精选；本页编辑首屏和下方原片与成片对照。", groups: [
      group("首屏与引导", [
        long("stamp", "右侧印章文案", ".hero-stamp p"),
        text("scrollText", "精选翻阅按钮文字", ".scroll-callout > span")
      ]),
      group("档案信息标签",[text("archiveNumberLabel","编号标签",".archive-meta > span",{index:0}),text("locationLabel","所在地标签",".archive-meta > span",{index:2})]),
      footer()
    ], components: { "Hero": ["首屏区域", ".archive-hero"], "Archive Meta": ["档案信息", ".archive-meta"], "Hero Stamp": ["印章", ".hero-stamp"], "Photo Strip": ["首页照片条与索引", ".photo-stage,.hero-control,.scroll-callout"], "Collections": ["原片与成片", ".comparison-section"], "Footer": ["页脚", "footer"] } },
    about: { label: "关于页", url: "../about/index.html", hint: "编辑关于页的资料、简介、技能与经历。日期自动显示北京时间当前日，无需手动填写。", groups: [
      group("页标题与肖像", [
        text("title", "页面标题", "#about-title"), text("path", "路径装饰文字", ".page-path"),
        text("portraitAlt", "肖像图片说明", ".archive-photo img", { attr: "alt" })
      ]), { ...archive(true, true), fields:archive(true, true).fields.filter(item=>item.key!=="location") },
      group("资料与章节标题", [
        ...["姓名", "身份", "所在地", "合作状态", "邮箱"].map((name,index) => text(`profileLabel${index}`, `${name}标签`, ".info-list dt", { index })),
        text("bioTitle", "个人简介标题", "#bio-title"), text("skillsTitle", "技能标题", "#skills-title"),
        text("experienceTitle", "经历标题", "#experience-title"), long("experienceIntro", "经历说明", ".section-heading h2 + p"),
        text("timelineScroll", "时间线浏览提示", ".timeline-controls > span")
      ]), footer()
    ], components: { "About Hero": ["资料首屏", ".about-hero"], "Profile Details": ["基本资料", ".info-list"], "Biography": ["个人简介", ".bio-block"], "Skills": ["技能", ".skills-block"], "Experience Timeline": ["经历时间线", ".experience-section"], "JSON-LD SEO Block": ["结构化资料", 'script[type="application/ld+json"]'], "Footer": ["页脚", "footer"] } },
    projects: { label: "项目页", url: "../Project/index.html", hint: "管理项目卡片与每个项目的照片清单。列表每页最多 6 个，点击进入独立项目详情；照片支持选择、上传、编辑和排序。日期自动显示北京时间当天。", groups: [
      group("页标题与展览", [text("title", "页面标题", "#projects-title"), text("path", "路径装饰文字", ".page-path"), long("intro", "页面介绍", ".hero-description"), text("exhibitionTitle", "项目展览标题", "#exhibition-title"),text("projectLocationLabel","项目卡片地点标签",".project-meta > div:nth-child(1) dt"),text("projectYearLabel","项目卡片年份标签",".project-meta > div:nth-child(2) dt")]), group("项目详情与分页文字", [text("detailBackText","返回项目列表文字","[data-project-back-label]",{default:"All projects"}),text("detailTotalLabel","详情照片总数标签","[data-project-total-label]",{default:"Photographs"}),text("detailPagesLabel","详情页码标签","[data-project-pages-label]",{default:"Pages"}),text("detailBrowseText","详情浏览入口文字","[data-project-browse-label]",{default:"Browse photographs"}),text("detailIndexLabel","详情胶片页索引标签","[data-project-page-index-label]",{default:"Page index"}),text("detailNotesTitle","项目介绍折叠标题","[data-project-notes-label]",{default:"Project notes"}),text("detailFilmLabel","大图胶片片名标签","[data-project-film-label]",{default:"Projects"}),text("detailImageLoadingText","大图加载提示","[data-project-image-loading]",{default:"Loading photograph…"}),text("detailImageErrorText","大图加载失败提示","[data-project-image-error]",{default:"This photograph could not be loaded."}),text("detailSwitchLabel","项目切换标签","[data-project-switch-label]",{default:"Projects"}),text("detailCollectionTitle","照片区标题","[data-project-collection-title]",{default:"Project photographs"}),text("detailPhotoUnit","照片数量单位","[data-project-photo-unit]",{default:"images"}),text("detailEmptyText","无照片提示","[data-project-photos-empty]",{default:"No photographs have been added to this project yet."}),text("detailMissingTitle","项目不存在标题","[data-project-missing-title]",{default:"Project unavailable"}),text("detailMissingText","项目不存在说明","[data-project-missing-text]",{default:"This project is unavailable or has not been published."}),text("detailLocationLabel","详情地点标签","[data-project-location-label]",{default:"Location"}),text("detailYearLabel","详情年份标签","[data-project-year-label]",{default:"Year"}),text("detailCloseText","关闭大图文字","[data-project-lightbox-close]",{default:"Close"}),text("detailPrevText","上一张文字","[data-project-lightbox-prev]",{default:"← Prev"}),text("detailNextText","下一张文字","[data-project-lightbox-next]",{default:"Next →"}),text("pagePrevText","项目与照片上一页文字","[data-project-page=\"prev\"],[data-project-photo-page=\"prev\"]",{default:"← Prev"}),text("pageNextText","项目与照片下一页文字","[data-project-page=\"next\"],[data-project-photo-page=\"next\"]",{default:"Next →"}),text("projectUnit","项目数量单位","[data-project-unit]",{default:"projects"})]), archive(true, true), footer()
    ], components: { "Projects Hero": ["页头", ".projects-hero"], "Archive Meta": ["档案信息", ".archive-meta"], "Archive Stamp": ["项目封面切换", ".archive-stamp"], "Project Exhibition": ["项目展览", ".project-exhibition"], "Project Cards": ["项目卡片", "[data-project-list]"], "Footer": ["页脚", "footer"] } },
    photography: { label: "摄影页", url: "../photography/index.html", hint: "摄影总览与分类页使用同一套作品；日期时间按北京时间自动更新，右上角循环展示总览 FEATURED 精选。网格按三行容量分页，列表每页 6 张（窄屏 4 张）。分类封面、介绍与搜索摘要在“分类管理”编辑；作品库支持搜索、按分类查找和每页 12 件分页。", groups: [
      group("摄影总览首屏", [text("title", "总览标题", "[data-page-title]"), text("path", "总览路径文字", "[data-page-path]"), long("intro", "总览介绍", "[data-hero-description]")].map(f => ({ ...f, archiveOnly: true }))),
      archive(true, true),
      group("分类与精选区标题", [text("categoriesTitle", "分类区标题", "#categories-title"), text("featuredTitle", "精选区标题", "#featured-title"), text("galleryTitle", "图库标题", "#gallery-title")]), toolbar(false),
      footer()
    ], components: { "Photography Hero": ["页头与封面", ".photography-hero"], "Toolbar": ["排序与视图工具栏", ".archive-toolbar"], "Categories": ["分类入口", ".category-section"], "Featured": ["精选作品", ".featured-section"], "Gallery Grid": ["作品列表与分页", "[data-gallery-grid],[data-gallery-pagination]"], "Detail Panel": ["作品详情", "[data-detail-panel]"], "Footer": ["页脚", "footer"] } },
    contact: { label: "联系页", url: "../Contact/index.html", hint: "管理联系信息、二维码、留言表单、工作状态及胶片照片。收到的留言在「留言收件箱」处理。", groups: [
      group("页头与联系资料标签", [text("path", "路径装饰文字", ".page-path"), text("railTitle", "侧栏集合名称", ".archive-rail p"), text("railNo", "侧栏编号", ".archive-rail strong"), ...["年份", "所在地", "回复时间", "语言"].map((name,index) => text(`factLabel${index}`, `${name}标签`, ".contact-facts dt", { index })), text("language", "支持语言", ".contact-facts dd", { index:3 })]),
      group("留言表单文字", [
        ...[["name","姓名"],["email","邮箱"],["message","留言"]].map(([id,label]) => text(`${id}Label`, `${label}标签`, `label[for="${id}"]`)),
        ...[["name","姓名"],["email","邮箱"],["message","留言"]].map(([id,label]) => text(`${id}Placeholder`, `${label}输入提示`, `#${id}`, { attr:"placeholder" })),
        text("submitText", "提交按钮文字", ".submit-button", { firstText:true })
      ]),
      group("工作状态标签", [0,1,2,3].flatMap(index => [text(`statusLabel${index}`, `第 ${index+1} 栏标题`, ".status-grid dt", { index }), text(`statusSubLabel${index}`, `第 ${index+1} 栏副标题`, ".status-grid > div > dd:first-of-type", { index })])),
      group("页脚", [text("footerCopyright", "版权说明", ".contact-footer p", { index:0, fallbackPath:"settings.globalInfo.copyrightText" }), text("footerCopy", "页脚说明", ".contact-footer p", { index:1 }), text("footerLocation", "页脚地点", ".contact-footer p", { index:2, firstText:true })])
    ], components: { "Contact Info": ["联系介绍", ".contact-copy"], "Contact Cards": ["联系卡片", ".contact-card-grid"], "Message Form": ["留言表单", ".message-panel"], "Archive Status": ["工作状态", ".status-grid"], "Film Strip": ["胶片照片条", ".film-strip"], "Contact Footer": ["页脚", ".contact-footer"], "Toast": ["操作通知", "[data-toast]"] } }
  };
  const contexts = {};
  const get = (object, path) => path.split(".").reduce((value, key) => value?.[key], object);
  function safeUrl(value, imageOnly = false) {
    const input = String(value || "").trim();
    if (!input) return "";
    if (/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,/i.test(input)) return imageOnly ? input : "";
    try {
      const url = new URL(input, location.href);
      if (["http:", "https:"].includes(url.protocol) || (!imageOnly && ["mailto:", "tel:"].includes(url.protocol))) return input;
    } catch (_) {}
    return "";
  }
  function readField(doc, item) {
    const node = doc.querySelectorAll(item.selector)[item.index || 0];
    if (!node) return item.default;
    if (item.attr) return node.getAttribute(item.attr) || "";
    if (item.firstText || item.tailText) {
      const nodes = [...node.childNodes].filter(n => n.nodeType === 3);
      return String((item.tailText ? nodes.at(-1) : nodes[0])?.textContent || "").trim();
    }
    return [...node.childNodes].map(n => n.nodeName === "BR" ? "\n" : n.textContent).join("").trim().replace(/[ \t]+/g," ").replace(/\n\s+/g,"\n");
  }
  function apply(pageName, options = {}) {
    if (Object.keys(options).length) contexts[pageName]=options; else options=contexts[pageName] || {};
    const definition = pages[pageName];
    const data = window.cmsStore?.getPublicData?.();
    if (!definition || !data) return;
    const values = data.settings.pageContent?.[pageName] || {};
    for (const section of definition.groups) for (const item of section.fields) {
      if (pageName === "contact" && item.key === "submitText" && data.settings.integrations?.contactEnabled === false) continue;
      if (item.archiveOnly && options.collection) continue;
      if (pageName === "photography" && options.collection && ["archiveNumber","updated","location"].includes(item.key)) continue;
      if (!Object.hasOwn(values, item.key)) continue;
      const value = String(values[item.key] ?? "");
      document.querySelectorAll(item.selector).forEach((node, index) => {
        if (item.index !== undefined && item.index !== index) return;
        if (item.attr) {
          node.setAttribute(item.attr, ["href","src"].includes(item.attr) ? safeUrl(value,item.attr === "src") : value);
        } else if (item.firstText || item.tailText) {
          const nodes = [...node.childNodes].filter(n => n.nodeType === 3);
          const target = item.tailText ? nodes.at(-1) : nodes[0];
          if (target) target.textContent = value + " ";
          else node.append(document.createTextNode(value));
        } else {
          node.textContent = value;
          if (value.includes("\n")) node.style.whiteSpace = "pre-line";
        }
      });
    }
    const global = data.componentVisibility.global || {};
    const visible = data.componentVisibility[pageName] || {};
    const components = { ...definition.components, ...Object.fromEntries(Object.entries({ Header:["页眉",".site-header"], Navigation:["导航",".main-nav"], Footer:["页脚","footer"] }).filter(([key]) => global[key] === false)) };
    for (const [key, [, selector]] of Object.entries(components)) {
      const enabled = visible[key] !== false && global[key] !== false;
      document.querySelectorAll(selector).forEach(node => {
        if (!enabled && node.tagName === "SCRIPT") { node.remove(); return; }
        if (!enabled) { node.dataset.cmsHidden = "true"; node.hidden = true; }
        else if (node.dataset.cmsHidden) { delete node.dataset.cmsHidden; node.hidden = false; }
      });
    }
    window.cmsRender?.applySeo(pageName, Object.hasOwn(options, "categoryId") ? { categoryId: options.categoryId } : {});
    if (data.settings.maintenance?.enabled) {
      let notice=document.getElementById("cms-maintenance");
      if (!notice) { notice=document.createElement("p");notice.id="cms-maintenance";notice.setAttribute("role","status");notice.style.cssText="max-width:800px;margin:80px auto;padding:32px;text-align:center";document.querySelector("main")?.before(notice); }
      notice.textContent=data.settings.maintenance.message || "内容正在维护，请稍后再来。";
      document.querySelector("main")?.setAttribute("hidden", "");
    }
    document.querySelectorAll('[data-cms-hidden="true"]').forEach(n => { n.hidden = true; });
  }
  window.cmsPages = { pages, get, safeUrl, readField, apply };
  document.addEventListener("DOMContentLoaded", async () => {
    const page = ({home:"home",about:"about",projects:"projects",photography:"photography",contact:"contact"})[document.querySelector("main")?.id];
    if (page) { await window.cmsStore?.ready; apply(page); }
  });
})();
