/* Shared public-page SEO resolver. Used unchanged by browsers, the local server, and Worker. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.cmsSeo = factory();
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";
  const paths = { home: "/Home/index.html", about: "/about/index.html", projects: "/Project/index.html", photography: "/photography/index.html", contact: "/Contact/index.html" };
  const names = { home: "Home", about: "About", projects: "Projects", photography: "Photography", contact: "Contact" };
  const text = value => typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
  const first = (...values) => values.map(text).find(Boolean) || "";
  const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
  function httpUrl(value, base) {
    const input = text(value);
    if (!input || /[\u0000-\u0020\u007f]/.test(input) || input.includes("\\")) return "";
    try {
      const url = base ? new URL(input, base) : new URL(input);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) return "";
      url.hash = "";
      return url.href;
    } catch (_) { return ""; }
  }
  function routePage(pathname, search = "") {
    const path = text(pathname).toLowerCase();
    let page;
    if (["/", "/index.html", "/home", "/home/", "/home/index.html"].includes(path)) page = "home";
    else for (const [key, full] of Object.entries(paths)) {
      const folder = full.slice(0, full.lastIndexOf("/")).toLowerCase();
      if ([folder, folder + "/", full.toLowerCase()].includes(path)) { page = key; break; }
    }
    if (["/project/detail.html","/project/detail"].includes(path)) page="projects";
    if (!page) return null;
    const result = { page };
    if(page==="projects"&&["/project/detail.html","/project/detail"].includes(path)){result.projectDetail=true;const projectId=text(new URLSearchParams(search).get("project"));if(projectId.length<=200&&!/[\u0000-\u001f\u007f]/.test(projectId))result.projectId=projectId;}
    const category = page === "photography" ? text(new URLSearchParams(search).get("category")) : "";
    if (category && category.length <= 200 && !/[\u0000-\u001f\u007f]/.test(category)) result.categoryId = category;
    return result;
  }
  const slug = value => text(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "");
  function publicCategory(value) {
    const category = object(value);
    const status = text(category.status).toLowerCase();
    return category.isVisible !== false && text(category.visibility).toLowerCase() !== "private" && (!status || ["published", "public", "active"].includes(status));
  }
  function resolve(data, page, options = {}) {
    const settings = object(data?.settings);
    const global = object(settings.globalInfo);
    const site = object(settings.seo);
    const pageSeo = object(settings.pageSeo?.[page]);
    const fallback = object(options.fallback);
    const categoryFallback = object(fallback.categorySeo);
    const base = httpUrl(options.baseUrl);
    const requestUrl = base ? new URL(base) : null;
    const assetBase = requestUrl && paths[page] ? new URL(paths[page], requestUrl.origin).href : base;
    const isProjectDetail=page==='projects'&&(options.projectDetail||requestUrl&&['/project/detail.html','/project/detail'].includes(requestUrl.pathname.toLowerCase()));
    if(isProjectDetail){
      const requested=text(options.projectId||requestUrl?.searchParams.get('project'));
      const project=(Array.isArray(data?.projects)?data.projects:[]).find(row=>row&&text(row.id)===requested&&row.isVisible!==false&&['published','public'].includes(text(row.status).toLowerCase()));
      const labels=object(settings.pageContent?.projects);const brand=first(global.brandName,'WonG');
      const title=project?first(project.seoTitle,first(project.title,'Untitled Project')+' - '+brand+' - Projects'):first(labels.detailMissingTitle,'Project unavailable')+' - '+brand;
      const description=project?first(project.seoDescription,project.description,fallback.description,site.seoDescription):first(labels.detailMissingText,'This project is unavailable or has not been published.');
      const siteCanonical=httpUrl(site.canonicalUrl,assetBase||undefined);const origin=siteCanonical?new URL(siteCanonical).origin:requestUrl?.origin;
      const canonical=origin?new URL(project?'/Project/detail.html':paths.projects,origin):null;if(canonical&&project)canonical.searchParams.set('project',text(project.id));
      const canonicalUrl=project&&httpUrl(project.canonicalUrl,assetBase||undefined)||canonical?.href||'';
      const image=project?[project.ogImage,project.coverImage,site.ogImage].map(value=>httpUrl(value,assetBase||undefined)).find(Boolean)||'':'';
      return {title,description,image,canonicalUrl,ogUrl:canonicalUrl,type:'website',seoEnabled:data?.componentVisibility?.global?.['SEO Meta']!==false,ogEnabled:data?.componentVisibility?.global?.['Open Graph Meta']!==false};
    }
    const requestedCategory = text(options.categoryId);
    const categories = Array.isArray(data?.categories) ? data.categories : [];
    const category = page === "photography" && requestedCategory ? categories.find(value => publicCategory(value) && [text(value.id), text(value.slug), slug(value.name)].includes(requestedCategory)) : null;
    const categorySeo = category ? { title: category.seoTitle, description: category.seoDescription, ogImage: category.ogImage, canonicalUrl: category.canonicalUrl } : {};
    const isCollection = Boolean(category || Object.keys(categoryFallback).length);
    const collection = isCollection ? categoryFallback : {};
    const categoryTitle = category ? `${first(category.heroTitle, category.name)} - ${first(global.brandName, "WonG")} - Photography` : "";
    const title = first(categorySeo.title, collection.title, categoryTitle, pageSeo.title, fallback.title, page === "home" ? first(site.seoTitle, site.siteTitle) : "", `${first(global.brandName, "WonG")} - ${names[page] || "Page"}`);
    const description = first(categorySeo.description, collection.description, category?.pageIntro, category?.description, pageSeo.description, fallback.description, site.seoDescription, site.siteDescription);
    const publicUrl = requestUrl && paths[page] ? new URL(paths[page], requestUrl.origin) : null;
    if (publicUrl && category) publicUrl.searchParams.set("category", text(category.id));
    // A shared site canonical is a base address for defaults, never a reason to merge every page into the homepage.
    const siteCanonical = httpUrl(site.canonicalUrl, assetBase || undefined);
    const canonicalBase = siteCanonical ? new URL(siteCanonical).origin : publicUrl?.origin;
    const defaultCanonical = canonicalBase && paths[page] ? new URL(paths[page], canonicalBase) : null;
    if (defaultCanonical && category) defaultCanonical.searchParams.set("category", text(category.id));
    const explicitCanonical = [categorySeo.canonicalUrl, collection.canonicalUrl, pageSeo.canonicalUrl, fallback.canonicalUrl].map(value => httpUrl(value, assetBase || undefined)).find(Boolean);
    const canonicalUrl = explicitCanonical || defaultCanonical?.href || "";
    const image = [categorySeo.ogImage, collection.ogImage, collection.image, category?.heroImage, category?.coverImage, pageSeo.ogImage, fallback.ogImage, fallback.image, site.ogImage, "../Home/assets/photographer.png"].map(value => httpUrl(value, assetBase || undefined)).find(Boolean) || "";
    return { title, description, image, canonicalUrl, ogUrl: canonicalUrl || publicUrl?.href || "", type: first(collection.type, fallback.type, "website"), seoEnabled: settings && data?.componentVisibility?.global?.["SEO Meta"] !== false, ogEnabled: data?.componentVisibility?.global?.["Open Graph Meta"] !== false };
  }
  const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  function decode(value) {
    return String(value || "").replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|lt|gt|quot|apos|nbsp));/gi, (whole, decimal, hex, named) => {
      if (named) return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }[named.toLowerCase()];
      const code = Number.parseInt(decimal || hex, decimal ? 10 : 16);
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "\ufffd";
    });
  }
  function attributes(tag) {
    const result = Object.create(null);
    const source = tag.replace(/^<\/?[A-Za-z][\w:-]*/, "").replace(/\/?\s*>$/, "");
    const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let match;
    while ((match = pattern.exec(source))) {
      const name = match[1].toLowerCase();
      if (!Object.hasOwn(result, name)) result[name] = decode(match[2] ?? match[3] ?? match[4] ?? "");
    }
    return result;
  }
  // A tiny tokenizer keeps tag-looking text in comments/scripts/styles away from metadata edits.
  function headTokens(html) {
    const token = /<!--[\s\S]*?-->|<![^>]*>|<\/?([A-Za-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*?>/g;
    const nodes = [];
    let opened = false;
    let match;
    while ((match = token.exec(html))) {
      if (!match[1]) continue;
      const name = match[1].toLowerCase();
      const closing = /^<\//.test(match[0]);
      if (!opened) {
        if (!closing && name === "body") return null;
        if (!closing && name === "head") opened = true;
        else if (!closing && ["script", "style", "template", "noscript", "title"].includes(name)) {
          const end = new RegExp("<\\/" + name + "\\s*>", "gi"); end.lastIndex = token.lastIndex;
          const close = end.exec(html); if (!close) return null; token.lastIndex = end.lastIndex;
        }
        continue;
      }
      if (closing && name === "head") return { nodes, end: match.index };
      if (!closing && name === "body") return null;
      if (closing) continue;
      const node = { name, start: match.index, end: token.lastIndex, attrs: attributes(match[0]) };
      if (["script", "style", "template", "noscript", "title"].includes(name)) {
        const end = new RegExp("<\\/" + name + "\\s*>", "gi"); end.lastIndex = token.lastIndex;
        const close = end.exec(html); if (!close) return null;
        node.inner = html.slice(token.lastIndex, close.index); node.end = end.lastIndex; token.lastIndex = end.lastIndex;
      }
      nodes.push(node);
    }
    return null;
  }
  function metadataKey(node) {
    if (node.name === "title") return "title";
    if (node.name === "link" && text(node.attrs.rel).toLowerCase().split(/\s+/).includes("canonical")) return "canonicalUrl";
    if (node.name !== "meta") return "";
    if (text(node.attrs.name).toLowerCase() === "description") return "description";
    return ({ "og:title": "ogTitle", "og:description": "ogDescription", "og:image": "ogImage", "og:url": "ogUrl", "og:type": "type" })[text(node.attrs.property).toLowerCase()] || "";
  }
  function originalDefaults(head) {
    for (const node of head?.nodes || []) {
      if (node.name !== "meta" || text(node.attrs.name).toLowerCase() !== "wong:seo-defaults" || node.attrs.content?.length > 65536) continue;
      try {
        const parsed = object(JSON.parse(node.attrs.content));
        const result = {};
        for (const key of ["title", "description", "ogImage", "canonicalUrl", "ogUrl", "type"]) if (typeof parsed[key] === "string" && parsed[key].length <= 16384) result[key] = parsed[key];
        if (Object.keys(result).length) return result;
      } catch (_) {}
    }
    return null;
  }
  function readHtmlMetadata(html, options = {}) {
    const head = headTokens(String(html));
    if (options.original) { const original = originalDefaults(head); if (original) return original; }
    const result = {};
    for (const node of head?.nodes || []) {
      const key = metadataKey(node);
      if (key && !Object.hasOwn(result, key)) result[key] = node.name === "title" ? decode(node.inner) : node.name === "link" ? node.attrs.href || "" : node.attrs.content || "";
    }
    return result;
  }
  function injectHtml(html, metadata) {
    const source = String(html);
    const head = headTokens(source);
    if (!head) throw new Error("SEO metadata needs a complete HTML head.");
    const data = object(metadata);
    const tags = { title: `<title>${escape(data.title)}</title>`, description: data.seoEnabled === false ? "" : `<meta name="description" content="${escape(data.description)}">`, canonicalUrl: data.seoEnabled === false || !httpUrl(data.canonicalUrl) ? "" : `<link rel="canonical" href="${escape(data.canonicalUrl)}">` };
    const graph = { ogTitle: ["og:title", data.title], ogDescription: ["og:description", data.description], ogImage: ["og:image", httpUrl(data.image)], ogUrl: ["og:url", httpUrl(data.ogUrl)], type: ["og:type", first(data.type, "website")] };
    for (const [key, [property, value]] of Object.entries(graph)) tags[key] = data.ogEnabled === false || !text(value) ? "" : `<meta property="${property}" content="${escape(value)}">`;
    const sourceDefaults = originalDefaults(head) || readHtmlMetadata(source);
    const defaults = Object.fromEntries(["title", "description", "ogImage", "canonicalUrl", "ogUrl", "type"].filter(key => Object.hasOwn(sourceDefaults, key)).map(key => [key, sourceDefaults[key]]));
    tags.originalDefaults = `<meta name="wong:seo-defaults" content="${escape(JSON.stringify(defaults))}">`;
    const seen = new Set();
    const edits = [];
    for (const node of head.nodes) {
      const key = node.name === "meta" && text(node.attrs.name).toLowerCase() === "wong:seo-defaults" ? "originalDefaults" : metadataKey(node);
      if (key) { edits.push({ start: node.start, end: node.end, value: seen.has(key) ? "" : tags[key] }); seen.add(key); }
      else if (data.ogEnabled === false && node.name === "meta" && /^og:/i.test(node.attrs.property || "")) edits.push({ start: node.start, end: node.end, value: "" });
    }
    const missing = Object.entries(tags).filter(([key, value]) => !seen.has(key) && value).map(([, value]) => value).join("\n    ");
    if (missing) edits.push({ start: head.end, end: head.end, value: "    " + missing + "\n" });
    let result = source;
    for (const edit of edits.sort((a, b) => b.start - a.start)) result = result.slice(0, edit.start) + edit.value + result.slice(edit.end);
    return result;
  }
  return { resolve, injectHtml, routePage, readHtmlMetadata };
});
