(function () {
  "use strict";
  const DATA_KEY = "wong.cms.data";
  const DEFAULT_IMAGE = "../Home/assets/photographer.png";
  if (!window.cmsSiteContent) throw new Error("页面初始内容未加载，请检查本机网站服务。");
  // Generated from the current public pages; server documents take precedence.
  const defaultCmsState = JSON.parse(JSON.stringify(window.cmsSiteContent));
  const localHost = ["127.0.0.1", "localhost", "[::1]"].includes(location.hostname);
  let selectedMode;
  try { selectedMode = sessionStorage.getItem("wong.cms.mode"); } catch (_) {}
  const declaredMode = document.querySelector('meta[name="cms-mode"]')?.content;
  const serverSite = declaredMode === "server";
  let browserPreview = false;
  try { browserPreview = sessionStorage.getItem("wong.cms.browser-preview") === "true"; } catch (_) {}
  const mode = serverSite ? (browserPreview && selectedMode === "local" ? "local" : "server") : declaredMode === "cloud" ? "cloud" : selectedMode || ((window.__CMS_PUBLIC_STATE__ || !localHost) && location.protocol !== "file:" ? "cloud" : "local");

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeDefaults(defaultValue, savedValue) {
    if (Array.isArray(defaultValue)) {
      return Array.isArray(savedValue) ? clone(savedValue) : clone(defaultValue);
    }

    if (defaultValue && typeof defaultValue === "object") {
      const merged = savedValue && typeof savedValue === "object" && !Array.isArray(savedValue) ? clone(savedValue) : {};
      Object.keys(defaultValue).forEach((key) => {
        merged[key] = mergeDefaults(defaultValue[key], merged[key]);
      });
      return merged;
    }

    return savedValue === undefined || savedValue === null ? defaultValue : savedValue;
  }

  function byOrder(a, b) {
    return (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0);
  }

  function slugify(value) {
    return (
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "") || "item"
    );
  }

  function normalizeStatus(value, fallback) {
    const status = String(value || fallback || "").trim();
    if (!status) return fallback;
    const lower = status.toLowerCase();
    if (lower === "new") return "unread";
    if (lower === "unread" || lower === "read" || lower === "replied" || lower === "archived") return lower;
    if (lower === "published") return "Published";
    if (lower === "draft") return "Draft";
    if (lower === "hidden") return "Hidden";
    return status;
  }

  function normalizeMessage(message) {
    const createdAt = message.createdAt || message.submittedAt || new Date().toISOString();
    return {
      id: message.id || `msg-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      name: message.name || "Unknown Sender",
      email: message.email || "",
      projectType: message.projectType || "other",
      message: message.message || "",
      createdAt,
      submittedAt: message.submittedAt || createdAt,
      status: normalizeStatus(message.status, "unread"),
      ipAddress: message.ipAddress || "",
      location: message.location || "",
      userAgent: message.userAgent || "",
      internalNotes: message.internalNotes || ""
    };
  }

  function normalizeState(value) {
    const next = mergeDefaults(defaultCmsState, value || {});
    next.categories = (Array.isArray(next.categories) ? next.categories : []).map(category => mergeDefaults(defaultCmsState.categories.find(item => item.id === category.id) || {}, category));
    next.settings.pageContent ||= {};
    next.projects = Array.isArray(next.projects) ? next.projects : [];
    next.gallery = Array.isArray(next.gallery) ? next.gallery : [];
    next.gallery = next.gallery.map(photo => ({ ...photo, categoryId: photo.categoryId || next.categories.find(c => c.name === photo.category || c.id === photo.category)?.id || slugify(photo.category) }));
    if (!next.settings.cityContent || typeof next.settings.cityContent !== "object" || Array.isArray(next.settings.cityContent)) next.settings.cityContent = {};
    next.settings.cityContent.photos = Array.isArray(next.settings.cityContent.photos) ? next.settings.cityContent.photos : [];
    next.settings.cityContent.filters = Array.isArray(next.settings.cityContent.filters) ? next.settings.cityContent.filters : [];
    next.messages = Array.isArray(next.messages) ? next.messages.map(normalizeMessage) : [];
    next.contact.contactMethods = Array.isArray(next.contact.contactMethods) ? next.contact.contactMethods : [];
    next.contact.page.projectTypes = Array.isArray(next.contact.page.projectTypes) ? next.contact.page.projectTypes : [];
    return next;
  }

  function isVisibleStatus(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized === "published" || normalized === "public";
  }

  function isUnreadStatus(value) {
    const normalized = String(value || "").toLowerCase();
    return normalized === "unread" || normalized === "new";
  }

  function getPublicDataFromState(state) {
    const categories = state.categories
      .filter((category) => isVisibleStatus(category.status) && isVisibleStatus(category.visibility))
      .sort(byOrder);
    const categoryMap = new Map(categories.flatMap(category => [[category.id, category], [slugify(category.name), category]]));
    const gallery = state.gallery
      .filter(photo => {
        const linked = photo.categoryId ? state.categories.find(c=>c.id===photo.categoryId) : state.categories.find(c=>c.name===photo.category || c.id===photo.category || slugify(c.name)===slugify(photo.category));
        return isVisibleStatus(photo.status) && (!linked || categories.some(c=>c.id===linked.id));
      })
      .sort(byOrder)
      .map((photo) => {
        const categoryId = photo.categoryId || slugify(photo.category);
        const category = categoryMap.get(categoryId);
        return {
          ...photo,
          categoryId,
          categoryLabel: category?.name || photo.category || "Photography",
          image: photo.image || DEFAULT_IMAGE,
          altText: photo.altText || photo.title || state.settings.accessibility.defaultImageAltFallback || "Photography image"
        };
      });
    const projects = state.projects
      .filter((project) => isVisibleStatus(project.status) && project.isVisible !== false)
      .sort(byOrder)
      .map((project) => ({
        ...project,
        ...(Array.isArray(project.photoIds)?{photoIds:project.photoIds.filter(id=>gallery.some(photo=>photo.id===id))}:{}),
        coverImage: project.coverImage || DEFAULT_IMAGE,
        coverAlt: project.coverAlt || project.title || "Project cover"
      }));
    const contactMethods = state.contact.contactMethods
      .filter((method) => method.isVisible !== false)
      .sort(byOrder);

    const publicSettings=clone(state.settings);
    delete publicSettings.cityContent;
    if (publicSettings.pageContent) delete publicSettings.pageContent.city;
    if (publicSettings.pageSeo) delete publicSettings.pageSeo.city;
    const publicVisibility=clone(state.componentVisibility);
    delete publicVisibility.city;
    if (Array.isArray(publicSettings.homeCategories)) publicSettings.homeCategories=publicSettings.homeCategories.filter(entry=>!entry.categoryId || categories.some(category=>category.id===entry.categoryId));
    if (Array.isArray(publicSettings.homeSelection)) publicSettings.homeSelection=publicSettings.homeSelection.filter(entry=>gallery.some(photo=>photo.id===entry.photoId));
    if (Array.isArray(publicSettings.homeComparison?.entries)) publicSettings.homeComparison.entries=publicSettings.homeComparison.entries.filter(entry=>entry && gallery.some(photo=>photo.id===entry.photoId));
    return {
      settings: publicSettings,
      componentVisibility: publicVisibility,
      profile: clone(state.profile),
      projects,
      gallery,
      categories,
      contact: {
        ...clone(state.contact),
        contactMethods
      },
      stats: {
        photos: state.gallery.length,
        featured: state.gallery.filter((photo) => photo.featured).length,
        projects: state.projects.length,
        categories: state.categories.length,
        unreadMessages: 0
      }
    };
  }

  function loadState() {
    if (mode !== "local") {
      if (window.__CMS_ADMIN_STATE__) return normalizeState(window.__CMS_ADMIN_STATE__);
      if (window.__CMS_PUBLIC_STATE__) return normalizeState(window.__CMS_PUBLIC_STATE__);
      return normalizeState(defaultCmsState);
    }
    try {
      const raw = localStorage.getItem(DATA_KEY);
      return normalizeState(raw ? JSON.parse(raw) : defaultCmsState);
    } catch (error) {
      console.warn("Could not load local CMS data. Falling back to defaults.", error);
      return normalizeState(defaultCmsState);
    }
  }

  function saveState(data) {
    const normalized = normalizeState(data);
    if (mode !== "local") window.__CMS_ADMIN_STATE__ = clone(normalized);
    else localStorage.setItem(DATA_KEY, JSON.stringify(normalized));
    return clone(normalized);
  }

  // The local server and deployed Worker share the HTTP contract. Browser-only
  // storage remains an explicit legacy preview and never overrides server state.
  const cmsStore = {
    key: DATA_KEY,
    mode,
    normalize: normalizeState,
    defaults: defaultCmsState,
    load: loadState,
    save: saveState,
    reset() {
      localStorage.removeItem(DATA_KEY);
      return normalizeState(defaultCmsState);
    },
    getPage(pageName) {
      const state = loadState();
      return clone(state[pageName] || {});
    },
    updatePage(pageName, payload) {
      const state = loadState();
      state[pageName] = mergeDefaults(state[pageName] || {}, payload || {});
      return saveState(state);
    },
    getPublicData() {
      return getPublicDataFromState(loadState());
    },
    publish(data) {
      return getPublicDataFromState(saveState(data || loadState()));
    },
    addMessage(payload) {
      const state = loadState();
      const now = new Date().toISOString();
      const message = normalizeMessage({
        ...payload,
        id: payload.id || `msg-${Date.now()}`,
        createdAt: payload.createdAt || now,
        submittedAt: payload.submittedAt || payload.createdAt || now,
        status: payload.status || "unread",
        userAgent: payload.userAgent || navigator.userAgent || ""
      });
      state.messages.unshift(message);
      saveState(state);
      return clone(message);
    }
  };

  function ensureMeta(selector, attrs) {
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement("meta");
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      document.head.appendChild(node);
    }
    return node;
  }

  function pageTitleFromName(pageName) {
    if (pageName === "home") return "Home";
    if (pageName === "about") return "About";
    if (pageName === "projects") return "Projects";
    if (pageName === "photography") return "Photography";
    if (pageName === "contact") return "Contact";
    if (pageName === "city") return "City Humanity";
    return "Page";
  }

  const seoDocumentDefaults = window.cmsSeo?.readHtmlMetadata(document.head.outerHTML, { original: true }) || {};
  const seoContexts = {};
  function applySeo(pageName, fallback = {}) {
    if (!window.cmsSeo) throw new Error("页面搜索设置未加载，请检查共享 SEO 脚本。");
    const context = { ...(seoContexts[pageName] || {}), ...fallback };
    if (Object.hasOwn(fallback, "categoryId") && !fallback.categoryId) delete context.categorySeo;
    seoContexts[pageName] = context;
    const route = window.cmsSeo.routePage(location.pathname, location.search);
    const categoryId = Object.hasOwn(context, "categoryId") ? context.categoryId : route?.categoryId;
    const metadata = window.cmsSeo.resolve(cmsStore.getPublicData(), pageName, { baseUrl: location.href, categoryId, projectId: context.projectId || route?.projectId, projectDetail: route?.projectDetail, fallback: { ...seoDocumentDefaults, ...context } });
    document.title = metadata.title;
    const setMeta = (key, value, property = false) => {
      const selector = property ? 'meta[property="' + key + '"]' : 'meta[name="' + key + '"]';
      const nodes = [...document.head.querySelectorAll(selector)];
      if (value === null || value === "") { nodes.forEach(node => node.remove()); return; }
      const node = nodes[0] || ensureMeta(selector, property ? { property: key } : { name: key });
      node.setAttribute("content", value);
      nodes.slice(1).forEach(duplicate => duplicate.remove());
    };
    setMeta("description", metadata.seoEnabled ? metadata.description : null);
    const canonicalNodes = [...document.head.querySelectorAll('link[rel="canonical"]')];
    if (metadata.seoEnabled && metadata.canonicalUrl) {
      const canonical = canonicalNodes[0] || document.head.appendChild(document.createElement("link"));
      canonical.rel = "canonical"; canonical.href = metadata.canonicalUrl;
      canonicalNodes.slice(1).forEach(node => node.remove());
    } else canonicalNodes.forEach(node => node.remove());
    if (!metadata.ogEnabled) document.head.querySelectorAll("meta[property]").forEach(node => { if (/^og:/i.test(node.getAttribute("property"))) node.remove(); });
    else for (const [key, value] of Object.entries({ "og:title":metadata.title, "og:description":metadata.description, "og:image":metadata.image, "og:url":metadata.ogUrl, "og:type":metadata.type })) setMeta(key, value, true);
    return metadata;
  }

  function navigationItems() {
    const settings = cmsStore.getPublicData().settings;
    const nav = Array.isArray(settings.navigation) ? settings.navigation : defaultCmsState.settings.navigation;
    return nav.filter((item) => item.visible !== false).sort(byOrder);
  }

  function isActiveNav(item, pageName) {
    const label = String(item.label || "").toLowerCase();
    const id = String(item.id || "").toLowerCase();
    const url = String(item.url || "").toLowerCase();
    if (pageName === "city" && (id.includes("photography") || url.includes("/photography/"))) return true;
    return label === pageName || id.includes(pageName) || url.includes(`/${pageName}/`) || (pageName === "projects" && url.includes("/project/"));
  }

  function applyChrome(pageName) {
    const data = cmsStore.getPublicData();
    const global = data.settings.globalInfo || {};
    const brand = document.querySelector(".brand");
    const nav = document.querySelector(".main-nav");
    const kicker = document.querySelector(".header-kicker");
    const footer = document.querySelector(".site-footer, .project-footer, .contact-footer");

    if (brand) {
      brand.textContent = global.brandName || "WonG";
      brand.href = "../Home/index.html";
    }

    if (kicker) {
      kicker.textContent = global.headerKicker || data.profile.role || "";
    }

    if (nav) {
      nav.innerHTML = navigationItems()
        .map((item) => {
          const active = isActiveNav(item, pageName);
          return `<a ${active ? 'class="is-active" aria-current="page"' : ""} href="${escapeAttr(window.cmsPages?.safeUrl(item.url || "#") || "#")}">${escapeHtml(item.label || "Link")}</a>`;
        })
        .join("");
    }

    if (footer) {
      const columns = footer.querySelectorAll(".footer-column");
      if (columns[0]) columns[0].querySelector("p").textContent = global.brandName || "WonG";
      const copyright = footer.querySelector(".copyright") || footer.querySelector("p");
      if (copyright) copyright.textContent = global.copyrightText || "(c) 2026 WonG. All rights reserved.";
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }


  function timeoutSeconds() { return Math.max(3, Math.min(60, Number(loadState().settings.integrations?.timeoutSeconds) || 15)); }
  async function request(endpoint, options = {}) {
    if (!String(endpoint).startsWith("/api/")) throw new Error("接口地址必须是本站 /api/ 路径。");
    const { timeoutMs, ...fetchOptions } = options;
    const duration = Number.isFinite(timeoutMs) ? Math.max(3000, Math.min(300000, timeoutMs)) : timeoutSeconds() * 1000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), duration);
    try {
      const response = await fetch(endpoint, { ...fetchOptions, credentials: "same-origin", cache: "no-store", signal: controller.signal });
      if (!response.ok) {
        const messages = { 400:"请检查填写内容。",401:"登录已过期，请重新登录；当前草稿仍保留。",403:"当前请求未获允许。",409:"网站已有更新，本次未覆盖。请先导出草稿，再重新读取网站内容。",413:"内容超出服务容量，请使用图片上传返回的地址。",415:"请选择 JPEG、PNG、WebP 或 GIF 图片。",429:"请求过于频繁，请稍后重试。",507:"免费图片空间不足，请先核对剩余空间。" };
        const error = new Error(messages[response.status] || "网站内容服务暂时不可用，请稍后重试。");
        error.status = response.status; throw error;
      }
      const bytes = await response.arrayBuffer();
      return new Response(bytes.byteLength ? bytes : null, {status:response.status,headers:response.headers});
    } catch (error) {
      if (error.name === "AbortError") throw new Error("请求超时，请稍后重试；当前草稿仍保留。");
      if (error instanceof TypeError) throw new Error("无法连接网站内容服务，请检查服务和网络后重试。");
      throw error;
    } finally { clearTimeout(timer); }
  }
  cmsStore.request = request;

  const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const mediaIdPattern = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  let imageStorageProbe;
  let imageUploadPending = false;
  cmsStore.imageStorage = { cloudOriginals: false, storage: mode === "server" ? "local-server" : mode };
  cmsStore.inspectImageStorage = async ({ refresh = false } = {}) => {
    if (mode !== "cloud") return cmsStore.imageStorage;
    if (localHost || location.protocol !== "https:") {
      return cmsStore.imageStorage = { cloudOriginals: false, storage: "unverified", error: "请在已部署的网站后台上传云端照片；本机预览不会自动发送原图。" };
    }
    if (!imageStorageProbe || refresh) imageStorageProbe = (async () => {
      try {
        const result = await (await request("/api/cms-status")).json();
        if (result.storage !== "cloud-d1-b2" || result.cloudOriginals !== true || !Number.isFinite(result.maxUploadBytes) || result.maxUploadBytes <= 0) throw new Error("unverified");
        return cmsStore.imageStorage = { storage: result.storage, cloudOriginals: true, maxUploadBytes: Math.min(50000000, result.maxUploadBytes) };
      } catch (_) {
        return cmsStore.imageStorage = { cloudOriginals: false, storage: "unverified", error: "暂时无法确认云端图片存储，请刷新后重试；照片尚未上传。" };
      }
    })();
    return imageStorageProbe;
  };
  cmsStore.originalDownloadUrl = source => {
    if (!cmsStore.imageStorage.cloudOriginals || typeof source !== "string") return "";
    try {
      const url = new URL(source, location.href);
      const match = url.pathname.match(new RegExp("^/media/(" + mediaIdPattern + ")\\.(?:jpe?g|png|webp|gif)$", "i"));
      return url.origin === location.origin && !url.username && !url.password && !url.search && !url.hash && match ? "/api/admin/originals/" + match[1] : "";
    } catch (_) { return ""; }
  };
  async function imageDescriptor(blob, name) {
    const bytes = await blob.arrayBuffer();
    const hex = value => Array.from(new Uint8Array(value), byte => byte.toString(16).padStart(2, "0")).join("");
    const sha1 = hex(await crypto.subtle.digest("SHA-1", bytes));
    const sha256 = hex(await crypto.subtle.digest("SHA-256", bytes));
    return { ...(name === undefined ? {} : { name }), contentType: blob.type, bytes: blob.size, sha1, sha256 };
  }
  async function decodeUploadImage(file) {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    let timer;
    try {
      image.src = objectUrl;
      await Promise.race([image.decode(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("图片读取超时，请检查原文件。")), 30000); })]);
      if (!image.naturalWidth || !image.naturalHeight) throw new Error("无法读取照片尺寸。");
      return { image, release: () => URL.revokeObjectURL(objectUrl) };
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      if (error.name === "EncodingError") throw new Error("图片无法解码，请检查文件是否损坏。");
      throw error;
    } finally { clearTimeout(timer); }
  }
  async function uploadDerivative(image, longestSide, quality, limitBytes) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器无法生成网页图片，请更换浏览器后重试。");
    const encode = type => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("网页图片生成超时，请重试。")), 30000);
      canvas.toBlob(blob => { clearTimeout(timer); blob ? resolve(blob) : reject(new Error("无法生成网页图片。")); }, type, quality);
    });
    let scale = Math.min(1, longestSide / Math.max(image.naturalWidth, image.naturalHeight));
    for (let attempt = 0; attempt < 8; attempt++) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let blob = await encode("image/webp");
      if (blob.type !== "image/webp") {
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        blob = await encode("image/jpeg");
      }
      if (["image/webp", "image/jpeg"].includes(blob.type) && blob.size > 0 && blob.size <= limitBytes) return blob;
      scale *= .8;
    }
    throw new Error("这张照片无法生成合适大小的网页图片，请选择较小文件。");
  }
  async function losslessPngDisplay(image) {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("当前浏览器无法生成网页图片，请更换浏览器后重试。");
    context.drawImage(image, 0, 0);
    const blob = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("网页图片生成超时，请重试。")), 30000);
      canvas.toBlob(result => { clearTimeout(timer); result ? resolve(result) : reject(new Error("无法生成 PNG 网页副本。")); }, "image/png");
    });
    if (blob.type !== "image/png" || !blob.size || blob.size > 8000000) throw new Error("PNG 网页副本超过 8 MB 或无法生成，请缩小画面后重试；原文件未改动。");
    return blob;
  }
  async function gifDisplayCopy(file) {
    // GIF89a sections 15-27: bounded sub-blocks, color tables, frames and extensions.
    // https://www.w3.org/Graphics/GIF/spec-gif89a.txt
    // Loop whitelist: https://github.com/google/wuffs/blob/main/std/gif/decode_gif.wuffs
    const source = new Uint8Array(await file.arrayBuffer());
    const invalid = () => { throw new Error("GIF 结构不完整或暂不支持，请重新导出后上传；原文件未改动。"); };
    const requireBytes = (start, count) => { if (start < 0 || count < 0 || start + count > source.length) invalid(); };
    const ascii = (start, count) => String.fromCharCode(...source.subarray(start, start + count));
    const word = start => source[start] | source[start + 1] << 8;
    requireBytes(0, 13);
    if (source.length > 8000000 || !["GIF87a", "GIF89a"].includes(ascii(0, 6))) invalid();
    const screenWidth = word(6), screenHeight = word(8);
    if (!screenWidth || !screenHeight || screenWidth * screenHeight > 40000000) invalid();
    const globalColors = source[10] & 0x80 ? 2 ** ((source[10] & 7) + 1) : 0;
    const headerBytes = 13 + globalColors * 3;
    requireBytes(0, headerBytes);
    if (globalColors && source[11] >= globalColors) invalid();
    const header = source.slice(0, headerBytes);
    header.set(new TextEncoder().encode("GIF89a"));
    const parts = [header];
    let offset = headerBytes, frames = 0, pendingControl = null, seenLoop = false, trailer = false;
    const subBlocks = () => {
      const start = offset;
      let count = 0, firstSize = 0, payloadBytes = 0;
      while (true) {
        requireBytes(offset, 1);
        const size = source[offset++];
        if (!size) return { start, count, firstSize, payloadBytes };
        requireBytes(offset, size);
        if (!count) firstSize = size;
        count++;
        payloadBytes += size;
        offset += size;
      }
    };
    while (offset < source.length) {
      const start = offset;
      if (source[offset] === 0x3b) { trailer = true; offset++; break; }
      if (source[offset] === 0x2c) {
        requireBytes(offset, 10);
        const left = word(offset + 1), top = word(offset + 3), width = word(offset + 5), height = word(offset + 7), packed = source[offset + 9];
        if (!width || !height || left + width > screenWidth || top + height > screenHeight || packed & 0x18 || ++frames > 10000) invalid();
        const localColors = packed & 0x80 ? 2 ** ((packed & 7) + 1) : 0;
        if (!localColors && !globalColors) invalid();
        offset += 10;
        requireBytes(offset, localColors * 3 + 1);
        offset += localColors * 3;
        const minimumCodeSize = source[offset++];
        if (minimumCodeSize < 2 || minimumCodeSize > 8) invalid();
        if (!subBlocks().payloadBytes) invalid();
        if (pendingControl) {
          if (pendingControl[3] & 1 && pendingControl[6] >= (localColors || globalColors)) invalid();
          parts.push(pendingControl);
          pendingControl = null;
        }
        parts.push(source.subarray(start, offset));
        continue;
      }
      requireBytes(offset, 2);
      if (source[offset++] !== 0x21) invalid();
      const label = source[offset++];
      if (label === 0xf9) {
        requireBytes(offset, 6);
        const packed = source[offset + 1];
        if (pendingControl || source[offset] !== 4 || source[offset + 5] !== 0 || packed & 0xe0 || (packed >> 2 & 7) > 3 || packed & 2) invalid();
        pendingControl = source.slice(start, offset + 6);
        if (!(packed & 1)) pendingControl[6] = 0;
        offset += 6;
      } else if (label === 0xff) {
        requireBytes(offset, 12);
        if (source[offset++] !== 11) invalid();
        const identifier = ascii(offset, 11);
        offset += 11;
        const blocks = subBlocks();
        if (["NETSCAPE2.0", "ANIMEXTS1.0"].includes(identifier)) {
          if (seenLoop || blocks.count !== 1 || blocks.firstSize !== 3 || source[blocks.start + 1] !== 1) invalid();
          seenLoop = true;
          parts.push(source.subarray(start, offset));
        }
      } else if (label === 0xfe) {
        subBlocks();
      } else if (label === 0x01) {
        requireBytes(offset, 13);
        if (source[offset++] !== 12) invalid();
        offset += 12;
        subBlocks();
        // Plain text consumes the preceding GCE; do not apply it to a later frame.
        pendingControl = null;
      } else invalid();
    }
    if (!trailer || !frames || pendingControl) invalid();
    const marker = text => {
      const bytes = new TextEncoder().encode(text);
      return new Uint8Array([0x21, 0xfe, bytes.length, ...bytes, 0, 0x3b]);
    };
    let display = new Blob([...parts, marker("web-display")], { type: "image/gif" });
    const bytes = new Uint8Array(await display.arrayBuffer());
    if (bytes.length === source.length && bytes.every((byte, index) => byte === source[index])) display = new Blob([...parts, marker("web-display-copy")], { type: "image/gif" });
    if (display.size > 8000000) throw new Error("GIF 网页副本超过 8 MB，请稍微缩小动画后重试；原文件未改动。");
    return display;
  }
  cmsStore.uploadImageFile = async (file, { onProgress = () => {} } = {}) => {
    if (!file || !imageTypes.includes(file.type) || !Number.isFinite(file.size) || file.size <= 0) throw new Error("请选择有效的 JPEG、PNG、WebP 或 GIF 图片。");
    if (mode === "local") throw new Error("本地预览不会上传到云端。");
    if (imageUploadPending) throw new Error("正在上传另一张图片，请等它完成。");
    imageUploadPending = true;
    let sessionAttempted = false;
    try {
      if (mode === "server") {
        if (file.size > 8000000) throw new Error("本机网站图片不得超过 8 MB。");
        onProgress("正在上传图片…");
        const result = await (await request("/api/admin/upload", { method: "POST", headers: { "Content-Type": file.type }, body: file, timeoutMs: 300000 })).json();
        if (!/^\/media\//.test(result.url || "")) throw new Error("上传未返回有效的图片地址。");
        return result.url;
      }
      const capability = await cmsStore.inspectImageStorage();
      if (!capability.cloudOriginals) throw new Error(capability.error || "云端图片存储尚未就绪。");
      if (!globalThis.crypto?.subtle) throw new Error("当前浏览器不支持安全的图片校验，请更新浏览器后重试。");
      if (file.size > capability.maxUploadBytes) throw new Error("原图不得超过 " + Math.floor(capability.maxUploadBytes / 1000000) + " MB。");
      if (file.type === "image/gif" && file.size > 8000000) throw new Error("GIF 动画不得超过 8 MB，上传时会保留动画并生成网页副本。");
      onProgress("正在生成网页展示图和缩略图…");
      const gifDisplay = file.type === "image/gif" ? await gifDisplayCopy(file) : null;
      const decoded = await decodeUploadImage(gifDisplay || file);
      let display, thumbnail;
      try {
        const preservePng = file.type === "image/png" && file.size <= 8000000 && Math.max(decoded.image.naturalWidth, decoded.image.naturalHeight) <= 2400;
        display = gifDisplay || (preservePng ? await losslessPngDisplay(decoded.image) : await uploadDerivative(decoded.image, 2400, .82, 8000000));
        thumbnail = await uploadDerivative(decoded.image, 400, .75, 1000000);
      } finally { decoded.release(); }
      onProgress("正在校验原图和网页图片…");
      const metadata = {
        original: await imageDescriptor(file, file.name || "photo"),
        display: await imageDescriptor(display),
        thumbnail: await imageDescriptor(thumbnail)
      };
      onProgress("正在检查云端剩余空间…");
      // Save the request ID before the first network write so a lost response is recoverable.
      const recoveryKey = "wong.cms.upload-recovery.v1." + metadata.original.sha256 + "." + metadata.original.bytes;
      let recovery;
      try { recovery = JSON.parse(localStorage.getItem(recoveryKey) || "null"); }
      catch (_) { throw new Error("无法读取上传恢复记录，请保留本站浏览器数据后重试。"); }
      if (recovery && (!new RegExp("^" + mediaIdPattern + "$", "i").test(recovery.id || "") || JSON.stringify(recovery.metadata) !== JSON.stringify(metadata))) throw new Error("此原图还有待确认的上传，请使用原文件与原浏览器恢复，勿重复创建上传。");
      if (!recovery) {
        recovery = { id: crypto.randomUUID(), metadata };
        try { localStorage.setItem(recoveryKey, JSON.stringify(recovery)); }
        catch (_) { throw new Error("无法保存上传恢复记录，请允许本站存储后重试；照片尚未上传。"); }
      }
      sessionAttempted = true;
      const session = await (await request("/api/admin/upload-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...metadata, clientRequestId: recovery.id }) })).json();
      if (session.id !== recovery.id) throw new Error("云端上传编号与恢复记录不一致，请刷新后台后重试。");
      if (typeof session.id !== "string" || !new RegExp("^" + mediaIdPattern + "$", "i").test(session.id)) throw new Error("云端没有返回有效的上传编号。");
      const sessionPath = "/api/admin/upload-sessions/" + session.id;
      const checkedEndpoint = (value, suffix) => {
        if (typeof value !== "string") throw new Error("云端上传地址无效。");
        let url;
        try { url = new URL(value, location.href); } catch (_) { throw new Error("云端上传地址无效。"); }
        if (url.origin !== location.origin || url.pathname !== sessionPath + "/" + suffix || url.search || url.hash || url.username || url.password) throw new Error("云端上传地址无效。");
        return url.pathname;
      };
      const endpoints = Object.fromEntries(["original", "display", "thumbnail"].map(role => [role, checkedEndpoint(session.uploadUrls?.[role], role)]));
      const complete = checkedEndpoint(session.completeUrl, "complete");
      const inspection = await (await request(sessionPath)).json();
      if (inspection.id !== session.id || !Array.isArray(inspection.roles) || inspection.roles.length !== 3 || new Set(inspection.roles.map(part => part.role)).size !== 3 || inspection.roles.some(part => !metadata[part.role] || part.bytes !== metadata[part.role].bytes || !["reserved", "uploaded", "uploading", "uncertain"].includes(part.state))) throw new Error("云端恢复状态无效，请保留上传记录并核对空间。");
      const blobs = { original: file, display, thumbnail };
      const labels = { original: "原图", display: "网页展示图", thumbnail: "缩略图" };
      for (const role of ["original", "display", "thumbnail"]) {
        const part = inspection.roles.find(part => part.role === role);
        if (part.state === "uploaded") continue;
        if (part.state !== "reserved") throw new Error("上传编号 " + session.id + " 的" + labels[role] + "结果待核实，空间已保留，不会重复上传。");
        onProgress("正在上传" + labels[role] + "…");
        const result = await (await request(endpoints[role], { method: "POST", headers: { "Content-Type": blobs[role].type }, body: blobs[role], timeoutMs: 300000 })).json();
        if (result.uploaded !== true || result.role !== role) throw new Error("云端尚未确认" + labels[role] + "上传成功。");
      }
      onProgress("正在确认云端保存结果…");
      const result = await (await request(complete, { method: "POST", timeoutMs: 180000 })).json();
      const publicPattern = new RegExp("^/media/" + session.id + "\\.(?:jpe?g|png|webp|gif)$", "i");
      const thumbnailPattern = new RegExp("^/media/" + session.id + "\\.thumb\\.(?:jpe?g|png|webp|gif)$", "i");
      if (result.id !== session.id || !publicPattern.test(result.url || "") || !thumbnailPattern.test(result.thumbnailUrl || "") || result.originalDownloadUrl !== "/api/admin/originals/" + session.id) throw new Error("云端图片保存结果无效，请先核对空间和作品。");
      try { localStorage.removeItem(recoveryKey); } catch (_) {}
      onProgress("原图和网页图片已保存在云端。");
      return result.url;
    } catch (error) {
      if (error.status === 409) throw new Error("上传结果尚未确认，请先核对云端空间和作品，勿立即重复上传同一张。原文件未改动。");
      if (sessionAttempted && ![400, 401, 403, 413, 415, 429, 507].includes(error.status)) throw new Error(error.message + " 上传编号已保留；重新选择同一张照片可恢复已确认进度，结果待核实的文件不会重复上传。");
      throw error;
    } finally { imageUploadPending = false; }
  };
  cmsStore.submitMessage = async payload => {
    if (loadState().settings.integrations?.contactEnabled === false) throw new Error("留言提交已暂停。");
    if (mode === "local") return cmsStore.addMessage(payload);
    const response = await request("/api/contact", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    const result=await response.json();
    if (result.received !== true) throw new Error("留言未得到服务器接收确认，请重试。");
    return result;
  };
  const cloudPublicPage = mode === "cloud" && !/\/(admin|backendContact|backendMessages|backendProject)(\/|$)/i.test(location.pathname);
  const photoLoadingPage = cloudPublicPage && (/^\/(Home|photography|about)(\/|$)/i.test(location.pathname) || location.pathname === "/");
  let loadingNotice;
  let pageLoading;
  let pageRenderTimer;
  let publicRevealed = false;
  function hasPendingForm() {
    return [...document.querySelectorAll("form")].some(form =>
      form.matches('[aria-busy="true"]') ||
      [...form.querySelectorAll("input,textarea,select")].some(input => {
        if (["submit", "button", "hidden"].includes(input.type)) return false;
        if (["checkbox", "radio"].includes(input.type)) return input.checked !== input.defaultChecked;
        if (input.tagName === "SELECT") {
          if (input.multiple) return [...input.options].some(option => option.selected !== option.defaultSelected);
          const initial = [...input.options].findIndex(option => option.defaultSelected);
          return input.selectedIndex !== (initial >= 0 ? initial : input.options.length ? 0 : -1);
        }
        return input.value !== input.defaultValue;
      }));
  }
  function showLoadingNotice(message, failed = false, partial = false) {
    if (!cloudPublicPage) return;
    if (!loadingNotice) {
      loadingNotice = document.createElement("div");
      loadingNotice.className = "cms-loading-notice";
      const frame = document.createElement("div"); frame.className = "cms-loading-frame";
      const label = document.createElement("span"); label.className = "cms-loading-label"; label.textContent = "WONG ARCHIVE";
      const text = document.createElement("p");
      const retry = document.createElement("button"); retry.type = "button"; retry.textContent = "刷新重试";
      retry.addEventListener("click", () => { if (!hasPendingForm()) location.reload(); });
      const dismiss = document.createElement("button"); dismiss.type = "button"; dismiss.className = "cms-loading-dismiss"; dismiss.textContent = "关闭提示";
      dismiss.addEventListener("click", () => { loadingNotice?.remove(); loadingNotice = null; });
      frame.append(label, text, retry, dismiss); loadingNotice.append(frame); document.body.append(loadingNotice);
    }
    loadingNotice.dataset.state = failed ? (partial ? "partial-error" : "error") : "loading";
    loadingNotice.setAttribute("role", failed ? "alert" : "status");
    loadingNotice.querySelector("p").textContent = message;
    loadingNotice.querySelector("button").hidden = !failed;
    loadingNotice.querySelector(".cms-loading-dismiss").hidden = !partial;
  }
  function markLoading(message) {
    const main = document.querySelector("main");
    if (main) { main.dataset.cmsLoading = "true"; main.setAttribute("inert", ""); main.setAttribute("aria-busy", "true"); }
    showLoadingNotice(message);
  }
  function revealPublicPage() {
    delete document.documentElement.dataset.cmsPending;
    const main = document.querySelector("[data-cms-loading]");
    if (main) { delete main.dataset.cmsLoading; main.removeAttribute("inert"); main.removeAttribute("aria-busy"); }
    loadingNotice?.remove(); loadingNotice = null;
    if (!publicRevealed) { publicRevealed = true; window.dispatchEvent(new CustomEvent("wong:cmsready")); }
  }
  function inViewport(element) {
    if (!element || element.closest("[hidden]")) return false;
    let { left, right, top, bottom } = element.getBoundingClientRect();
    if (right <= left || bottom <= top) return false;
    left = Math.max(0, left); top = Math.max(0, top); right = Math.min(innerWidth, right); bottom = Math.min(innerHeight, bottom);
    for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (style.display === "none") return false;
      const box = parent.getBoundingClientRect();
      if (/(hidden|clip|auto|scroll)/.test(style.overflowX)) { left = Math.max(left, box.left); right = Math.min(right, box.right); }
      if (/(hidden|clip|auto|scroll)/.test(style.overflowY)) { top = Math.max(top, box.top); bottom = Math.min(bottom, box.bottom); }
    }
    return right > left && bottom > top;
  }
  function waitForPhoto(image) {
    image.loading = "eager";
    return new Promise(resolve => {
      let settled = false;
      const finish = success => {
        if (settled) return; settled = true; clearTimeout(timer);
        image.removeEventListener("load", loaded); image.removeEventListener("error", failed); resolve(success);
      };
      const failed = () => finish(false);
      const loaded = async () => {
        if (!image.naturalWidth) return finish(false);
        try { if (image.decode) await image.decode(); finish(image.naturalWidth > 0); } catch (_) { finish(false); }
      };
      const timer = setTimeout(failed, 15000);
      image.addEventListener("load", loaded, { once: true }); image.addEventListener("error", failed, { once: true });
      if (image.complete) void loaded();
    });
  }
  cmsStore.finishLoading = (renderJob) => {
    if (!photoLoadingPage) return Promise.resolve(true);
    if (pageLoading) return pageLoading;
    clearTimeout(pageRenderTimer);
    pageLoading = (async () => {
      try {
        if (document.readyState === "loading") await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
        const showcaseFailed = Boolean(renderJob && inViewport(renderJob.element) && (await renderJob.ready) === false);
        let photoFailed = showcaseFailed;
        await new Promise(resolve => requestAnimationFrame(resolve));
        const images = [...document.querySelectorAll("main img[src]")].filter(inViewport);
        const results = await Promise.all(images.map(waitForPhoto));
        results.forEach((success, index) => {
          if (!success) {
            photoFailed = true;
            const image = images[index]; image.dataset.cmsPhotoError = "true"; image.setAttribute("aria-hidden", "true");
            const recover = async () => {
              try {
                if (image.decode) await image.decode();
                if (!image.naturalWidth) return;
                delete image.dataset.cmsPhotoError; image.removeAttribute("aria-hidden");
                if (!showcaseFailed && !document.querySelector("main img[data-cms-photo-error]") && loadingNotice?.dataset.state === "partial-error") { loadingNotice.remove(); loadingNotice = null; }
              } catch (_) {}
            };
            image.addEventListener("load", recover, { once: true });
            if (image.complete && image.naturalWidth) void recover();
          }
        });
        revealPublicPage();
        if (photoFailed) showLoadingNotice("部分照片暂时无法加载，可刷新重试。", true, true);
        return !photoFailed;
      } catch (_) {
        showLoadingNotice("照片暂时无法加载，请检查网络后重试。", true); return false;
      }
    })();
    return pageLoading;
  };

  cmsStore.ready = (async () => {
    if (mode === "local" || /\/(admin|backendContact|backendMessages|backendProject)(\/|$)/i.test(location.pathname)) return true;
    const loadingMain=document.querySelector("main");
    if(loadingMain){loadingMain.dataset.cmsLoading="true";loadingMain.setAttribute("inert","");}
    if (cloudPublicPage) markLoading("正在载入影像…");
    if (!window.__CMS_PUBLIC_STATE__) {
      try {
        await new Promise((resolve,reject) => {
          const script = document.createElement("script");
          const timer = setTimeout(() => { script.remove(); reject(new Error("timeout")); }, 15000);
          script.src = "/api/public-state.js";
          script.onload = () => { clearTimeout(timer); resolve(); };
          script.onerror = () => { clearTimeout(timer); reject(new Error("load")); };
          document.head.append(script);
        });
        if (!window.__CMS_PUBLIC_STATE__) throw new Error("invalid state");
      } catch (_) {
        if (cloudPublicPage) { showLoadingNotice("内容暂时无法加载，请稍后刷新重试。", true); return false; }
        const banner = document.createElement("p"); banner.setAttribute("role","alert");
        banner.textContent = "内容暂时无法加载，请稍后刷新重试。";
        document.body.prepend(banner); document.querySelector("main")?.setAttribute("hidden", "");
        return false;
      }
    }
    const refresh = mode === "cloud" ? 10 : Math.max(10, Number(loadState().settings.integrations?.refreshSeconds) || 30);
    let checkingVersion = false;
    let reloadPending = false;
    async function checkVersion() {
      if (document.hidden || checkingVersion || reloadPending || hasPendingForm()) return;
      // Preserve a visitor's unfinished form while another editor publishes.
      checkingVersion = true;
      try {
        const response = await request("/api/public-version"); const result = await response.json();
        if (Number.isFinite(result.version) && result.version !== window.__CMS_PUBLIC_VERSION__ && !hasPendingForm()) {
          reloadPending = true;
          if (cloudPublicPage) {
            markLoading("照片已有更新，正在载入…");
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          }
          if (hasPendingForm()) { reloadPending = false; revealPublicPage(); return; }
          location.reload();
        }
      } catch (_) {} finally { checkingVersion = false; }
    }
    if (Number(loadState().settings.integrations?.refreshSeconds) !== 0) setInterval(checkVersion, refresh * 1000);
    window.addEventListener("focus", checkVersion);
    window.addEventListener("pageshow", checkVersion);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) void checkVersion(); });
    return true;
  })();

  window.defaultCmsState = defaultCmsState;
  window.cmsStore = cmsStore;
  cmsStore.ready.then(ready => {
    if (!ready) return;
    if (!photoLoadingPage) revealPublicPage();
    else if (!pageLoading) pageRenderTimer = setTimeout(() => showLoadingNotice("页面暂时无法显示，请刷新重试。", true), 20000);
  });
  window.cmsRender = {
    applySeo,
    applyChrome,
    escapeHtml,
    escapeAttr,
    slugify,
    byOrder,
    defaultImage: DEFAULT_IMAGE,
    isUnreadStatus
  };
})();
