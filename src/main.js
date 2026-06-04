const header = document.querySelector("[data-header]");
const nav = document.querySelector("#site-nav");
const navToggle = document.querySelector(".nav-toggle");
const filterButtons = document.querySelectorAll("[data-filter]");
const heroActionButtons = document.querySelectorAll(".hero-actions .button");
const heroVisual = document.querySelector(".hero-visual");
const heroVisualImage = document.querySelector(".hero-visual img");
const exhibitionRegister = document.querySelector(".exhibition-register");
const homePortfolio = document.querySelector("[data-home-portfolio]");
const collectionGrid = document.querySelector("[data-collection-grid]");
const projectBoard = document.querySelector("[data-project-board]");
const categoryFeatureImage = document.querySelector("[data-category-feature-img]");
const yearSlot = document.querySelector("[data-year]");
const currentPath = window.location.pathname.replace(/\/index\.html$/, "/");
const pageKey = currentPath.split("/").filter(Boolean)[0] || "home";
const homeCategoryMap = {
  portrait: "portrait",
  city: "cityscape",
  life: "life",
  landscape: "landscape"
};
let editableContent = null;
let activeHomeFilter = "all";
const imageRatioCache = new Map();
let heroVisualAlignmentFrame = null;

function toCssUrl(value) {
  const safeValue = String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `url("${safeValue}")`;
}

function resolveImageUrl(value) {
  return window.SherlockContentApi?.resolveImageUrl(value) || value;
}

function colorKeyFor(fieldKey) {
  return `${fieldKey}Color`;
}

function normalizeColor(value) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "";
}

function applyTextColor(element, color) {
  const value = normalizeColor(color);
  if (value) {
    element.style.color = value;
    return;
  }
  element.style.removeProperty("color");
}

function visibleItems(items) {
  return (items || []).filter((item) => item && typeof item.image === "string" && item.image.trim());
}

function shuffledItems(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function hasContentPayload(content) {
  return Boolean(
    content &&
      typeof content === "object" &&
      !Array.isArray(content) &&
      Object.keys(content).length
  );
}

function usesRemoteContentSource() {
  const config = window.SHERLOCK_SUPABASE || {};
  return Boolean(config.url && config.key);
}

function emptyEditableContent() {
  return {
    site: {},
    pageMeta: {},
    pages: {
      portrait: [],
      landscape: [],
      life: [],
      cityscape: [],
      projects: []
    }
  };
}

function getPageItems(content, key) {
  return visibleItems(content.pages?.[key]);
}

function getProjectItems(content) {
  return (content.pages?.projects || []).filter((item) =>
    Boolean(
      item &&
        (String(item.image || "").trim() ||
          String(item.label || "").trim() ||
          String(item.title || "").trim() ||
          String(item.text || item.description || "").trim() ||
          String(item.href || "").trim())
    )
  );
}

function cardLabel(item, fallback) {
  return item.label || fallback;
}

function cardTitle(item, fallback) {
  return item.title || fallback;
}

function setWindowImage(windowCard, item) {
  windowCard.classList.toggle("has-image", Boolean(item.image));
  windowCard.classList.toggle("has-inline-image", Boolean(item.image));
  windowCard.classList.remove("has-measured-ratio");
  windowCard.style.removeProperty("--image-ratio");
  windowCard.style.removeProperty("--window-image");
  delete windowCard.dataset.ratioSource;

  if (item.image) {
    const imageUrl = resolveImageUrl(item.image);
    setWindowPhoto(windowCard, imageUrl, cardTitle(item, "Portfolio photograph"));
    measureWindowImage(windowCard, imageUrl);
  } else {
    windowCard.querySelector(".window-photo")?.remove();
  }
}

function setWindowPhoto(windowCard, imageUrl, alt) {
  let photo = windowCard.querySelector(".window-photo");
  if (!photo) {
    photo = document.createElement("img");
    photo.className = "window-photo";
    photo.loading = "lazy";
    photo.decoding = "async";
    windowCard.prepend(photo);
  }

  photo.removeAttribute("width");
  photo.removeAttribute("height");
  photo.src = imageUrl;
  photo.alt = alt;
}

function applyWindowImageRatio(windowCard, imageSrc, width, height) {
  if (windowCard.dataset.ratioSource !== imageSrc || !width || !height) return;

  const rawRatio = width / height;
  if (!Number.isFinite(rawRatio) || rawRatio <= 0) return;

  windowCard.style.setProperty("--image-ratio", `${width} / ${height}`);
  windowCard.classList.add("has-measured-ratio");
  imageRatioCache.set(imageSrc, { width, height });

  const photo = windowCard.querySelector(".window-photo");
  if (photo) {
    photo.width = width;
    photo.height = height;
  }
}

function measureWindowImage(windowCard, imageSrc) {
  windowCard.dataset.ratioSource = imageSrc;

  const cachedRatio = imageRatioCache.get(imageSrc);
  if (cachedRatio) {
    applyWindowImageRatio(windowCard, imageSrc, cachedRatio.width, cachedRatio.height);
    return;
  }

  const image = new Image();
  image.decoding = "async";

  image.onload = () => {
    applyWindowImageRatio(windowCard, imageSrc, image.naturalWidth, image.naturalHeight);
  };

  image.onerror = () => {
    measureImageHeader(imageSrc).then((size) => {
      if (size) applyWindowImageRatio(windowCard, imageSrc, size.width, size.height);
    });
  };

  window.setTimeout(() => {
    if (windowCard.classList.contains("has-measured-ratio")) return;
    measureImageHeader(imageSrc).then((size) => {
      if (size) applyWindowImageRatio(windowCard, imageSrc, size.width, size.height);
    });
  }, 1800);

  image.src = imageSrc;
}

async function measureImageHeader(imageSrc) {
  const cachedRatio = imageRatioCache.get(imageSrc);
  if (cachedRatio) return cachedRatio;

  try {
    const response = await fetch(imageSrc, { headers: { Range: "bytes=0-262143" } });
    if (!response.ok && response.status !== 206) return null;

    const bytes = new Uint8Array(await response.arrayBuffer());
    const size = readImageSize(bytes);
    if (size) imageRatioCache.set(imageSrc, size);
    return size;
  } catch {
    return null;
  }
}

function readImageSize(bytes) {
  return readPngSize(bytes) || readJpegSize(bytes) || readWebpSize(bytes);
}

function readPngSize(bytes) {
  if (
    bytes.length < 24 ||
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    width: view.getUint32(16),
    height: view.getUint32(20)
  };
}

function readJpegSize(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) return null;

    const length = (bytes[offset] << 8) + bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) return null;

    if (frameMarkers.has(marker)) {
      return {
        height: (bytes[offset + 3] << 8) + bytes[offset + 4],
        width: (bytes[offset + 5] << 8) + bytes[offset + 6]
      };
    }

    offset += length;
  }

  return null;
}

function readWebpSize(bytes) {
  if (
    bytes.length < 30 ||
    bytes[0] !== 0x52 ||
    bytes[1] !== 0x49 ||
    bytes[2] !== 0x46 ||
    bytes[3] !== 0x46 ||
    bytes[8] !== 0x57 ||
    bytes[9] !== 0x45 ||
    bytes[10] !== 0x42 ||
    bytes[11] !== 0x50
  ) {
    return null;
  }

  const type = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (type === "VP8X" && bytes.length >= 30) {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
    };
  }

  if (type === "VP8 " && bytes.length >= 30) {
    return {
      width: bytes[26] + ((bytes[27] & 0x3f) << 8),
      height: bytes[28] + ((bytes[29] & 0x3f) << 8)
    };
  }

  if (type === "VP8L" && bytes.length >= 25) {
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1
    };
  }

  return null;
}

function createHomeCard(item, page, index) {
  const card = document.createElement("a");
  const imageUrl = resolveImageUrl(item.image);
  card.className = "work-card";
  card.href = imageUrl;
  card.dataset.category = page === "cityscape" ? "city" : page;
  card.dataset.fullImage = imageUrl;
  card.dataset.windowId = item.id || `${page}-${index + 1}`;
  card.setAttribute("aria-label", cardTitle(item, `${page} window ${index + 1}`));
  setWindowImage(card, item);
  return card;
}

function createCollectionCard(item, index) {
  const card = document.createElement("article");
  const imageUrl = resolveImageUrl(item.image);
  card.className = "collection-card";
  card.dataset.windowId = item.id || `${pageKey}-${index + 1}`;
  card.dataset.fullImage = imageUrl;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", cardTitle(item, `${pageKey} window ${index + 1}`));

  const label = document.createElement("span");
  label.textContent = cardLabel(item, `${pageKey} ${String(index + 1).padStart(2, "0")}`);
  applyTextColor(label, item.labelColor);

  const title = document.createElement("strong");
  title.textContent = cardTitle(item, "Untitled");
  applyTextColor(title, item.titleColor);

  card.append(label, title);
  setWindowImage(card, item);
  return card;
}

function createProjectTile(item, index) {
  const tile = document.createElement("a");
  const layout = String(item.layout || "").trim().toLowerCase();
  const imageUrl = item.image ? resolveImageUrl(item.image) : "";
  const titleText = cardTitle(item, `Project ${String(index + 1).padStart(2, "0")}`);
  const description = item.text || item.description || "";

  tile.className = "project-tile";
  if (layout === "wide") tile.classList.add("is-wide");
  if (layout === "tall") tile.classList.add("is-tall");
  if (imageUrl) {
    tile.classList.add("has-image");
  }
  tile.href = item.href || imageUrl || "#";
  tile.setAttribute("aria-label", titleText);

  if (imageUrl) {
    const photo = document.createElement("img");
    photo.className = "project-tile-photo";
    photo.src = imageUrl;
    photo.alt = titleText;
    photo.loading = "lazy";
    photo.decoding = "async";
    tile.append(photo);
  }

  const label = document.createElement("span");
  label.textContent = cardLabel(item, `PRJ-${String(index + 1).padStart(2, "0")}`);
  applyTextColor(label, item.labelColor);

  const title = document.createElement("strong");
  title.textContent = titleText;
  applyTextColor(title, item.titleColor);

  const text = document.createElement("em");
  text.textContent = description;
  applyTextColor(text, item.textColor || item.descriptionColor);

  tile.append(label, title, text);
  return tile;
}

function homeItemsForFilter(content, filter) {
  if (filter === "all") {
    return shuffledItems(
      ["portrait", "cityscape", "life", "landscape"].flatMap((page) =>
        getPageItems(content, page).map((item) => ({ item, page }))
      )
    ).slice(0, 15);
  }

  const page = homeCategoryMap[filter] || filter;
  return shuffledItems(getPageItems(content, page))
    .slice(0, 6)
    .map((item) => ({ item, page }));
}

function renderHomePortfolio(content) {
  if (!homePortfolio) return;

  const items = homeItemsForFilter(content, activeHomeFilter);
  const hasAnyItems = ["portrait", "cityscape", "life", "landscape"].some((key) => getPageItems(content, key).length);
  const section = homePortfolio.closest(".work-section");
  if (section) section.hidden = !hasAnyItems;
  homePortfolio.innerHTML = "";
  if (!hasAnyItems) return;
  items.forEach(({ item, page }, index) => {
    homePortfolio.append(createHomeCard(item, page, index));
  });
}

function renderCollectionGrid(content) {
  if (!collectionGrid || pageKey === "home") return;

  const items = getPageItems(content, pageKey);
  const section = collectionGrid.closest(".collection-section");
  if (section) section.hidden = !items.length;
  section?.classList.add("is-balanced");
  collectionGrid.dataset.balancedGrid = "";
  collectionGrid.innerHTML = "";
  if (!items.length) return;
  items.forEach((item, index) => {
    collectionGrid.append(createCollectionCard(item, index));
  });
  lockBalancedCollectionGrid();
}

function renderProjectBoard(content) {
  if (!projectBoard) return;

  const items = getProjectItems(content);
  if (!items.length) return;

  projectBoard.innerHTML = "";
  items.forEach((item, index) => {
    projectBoard.append(createProjectTile(item, index));
  });
}

function lockBalancedCollectionGrid() {
  if (!collectionGrid || pageKey === "home") return;

  collectionGrid.style.setProperty("display", "grid", "important");
  collectionGrid.style.setProperty("grid-template-columns", balancedCollectionColumns(), "important");
  collectionGrid.style.setProperty("grid-auto-flow", "row", "important");

  collectionGrid.querySelectorAll(".collection-card").forEach((card) => {
    card.style.setProperty("grid-column", "auto / auto", "important");
    card.style.setProperty("grid-row", "auto / auto", "important");
    card.style.setProperty("width", "100%", "important");
    card.style.setProperty("min-width", "0", "important");
    card.style.setProperty("min-height", "0", "important");
    card.style.setProperty("aspect-ratio", "4 / 3", "important");
  });
}

function balancedCollectionColumns() {
  if (window.matchMedia("(max-width: 620px)").matches) return "1fr";
  if (window.matchMedia("(max-width: 980px)").matches) return "repeat(2, minmax(0, 1fr))";
  return "repeat(3, minmax(0, 1fr))";
}

function setCategoryFeatureImage(content) {
  if (!categoryFeatureImage || pageKey === "home") return;

  const pageMeta = (content.pageMeta || {})[pageKey];
  const independentImage = pageMeta?.heroImage;
  const usesIndependentHeroField = categoryFeatureImage.dataset.pageSrcKey === "heroImage";
  if (typeof independentImage === "string" && independentImage.trim()) {
    categoryFeatureImage.src = resolveImageUrl(independentImage);
    categoryFeatureImage.alt =
      typeof pageMeta.heroImageAlt === "string" ? pageMeta.heroImageAlt : `${pageKey} featured photograph`;
    categoryFeatureImage.classList.add("is-content-image");
    return;
  }
  if (usesIndependentHeroField) return;

  const featuredItem = getPageItems(content, pageKey)[0];
  if (!featuredItem?.image) return;

  const imageUrl = resolveImageUrl(featuredItem.image);
  categoryFeatureImage.src = imageUrl;
  categoryFeatureImage.alt = cardTitle(featuredItem, `${pageKey} featured photograph`);
  categoryFeatureImage.classList.add("is-content-image");
}

function applyStaticWindowFilter(filter) {
  document.querySelectorAll(".work-card").forEach((card) => {
    const shouldShow = filter === "all" || card.dataset.category === filter;
    card.hidden = !shouldShow;
  });
}

function setActiveFilter(button) {
  filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
}

function applyHomeFilter(filter, button) {
  activeHomeFilter = filter;
  if (button) setActiveFilter(button);
  if (editableContent) {
    renderHomePortfolio(editableContent);
    return;
  }
  applyStaticWindowFilter(filter);
}

function applySiteContent(content) {
  const site = content.site || {};
  const pageMeta = (content.pageMeta || {})[pageKey];

  document.querySelectorAll("[data-edit-key]").forEach((element) => {
    const key = element.dataset.editKey;
    const value = site[key];
    if (typeof value === "string") element.textContent = value;
    applyTextColor(element, site[colorKeyFor(key)]);
  });

  document.querySelectorAll("[data-edit-href-key]").forEach((element) => {
    const value = site[element.dataset.editHrefKey];
    if (typeof value === "string" && value.trim()) element.setAttribute("href", value);
  });

  document.querySelectorAll("[data-edit-mail-key]").forEach((element) => {
    const value = site[element.dataset.editMailKey];
    if (typeof value === "string" && value.trim()) element.setAttribute("href", `mailto:${value}`);
  });

  document.querySelectorAll("[data-edit-src-key]").forEach((element) => {
    const value = site[element.dataset.editSrcKey];
    if (typeof value === "string" && value.trim()) element.setAttribute("src", resolveImageUrl(value));
  });

  document.querySelectorAll("[data-edit-alt-key]").forEach((element) => {
    const value = site[element.dataset.editAltKey];
    if (typeof value === "string") element.setAttribute("alt", value);
  });

  if (pageMeta) {
    document.querySelectorAll("[data-page-edit-key]").forEach((element) => {
      const key = element.dataset.pageEditKey;
      const value = pageMeta[key];
      if (typeof value === "string") element.textContent = value;
      applyTextColor(element, pageMeta[colorKeyFor(key)]);
    });

    document.querySelectorAll("[data-page-src-key]").forEach((element) => {
      const value = pageMeta[element.dataset.pageSrcKey];
      if (typeof value === "string" && value.trim()) element.setAttribute("src", resolveImageUrl(value));
    });

    document.querySelectorAll("[data-page-alt-key]").forEach((element) => {
      const value = pageMeta[element.dataset.pageAltKey];
      if (typeof value === "string") element.setAttribute("alt", value);
    });

    document.querySelectorAll("[data-page-href-key]").forEach((element) => {
      const value = pageMeta[element.dataset.pageHrefKey];
      if (typeof value === "string" && value.trim()) element.setAttribute("href", value);
    });

    document.querySelectorAll("[data-page-mail-key]").forEach((element) => {
      const value = pageMeta[element.dataset.pageMailKey];
      if (typeof value === "string" && value.trim()) element.setAttribute("href", `mailto:${value}`);
    });

    document.querySelectorAll("[data-page-tags]").forEach((tags) => tags.remove());
  }
}

function ensureLightbox() {
  let lightbox = document.querySelector("[data-lightbox]");
  if (lightbox) return lightbox;

  lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.dataset.lightbox = "";
  lightbox.hidden = true;
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <button class="lightbox-close" type="button" aria-label="Close image">Close</button>
    <img class="lightbox-image" alt="" />
  `;
  document.body.append(lightbox);
  return lightbox;
}

function lightboxImageSizeFromTrigger(trigger) {
  const photo = trigger.querySelector?.(".window-photo");
  if (!photo) return null;

  const width = photo.naturalWidth || Number(photo.getAttribute("width"));
  const height = photo.naturalHeight || Number(photo.getAttribute("height"));
  return width && height ? { width, height } : null;
}

function openLightbox(image, alt = "", size = null) {
  if (!image) return;
  const lightbox = ensureLightbox();
  const lightboxImage = lightbox.querySelector(".lightbox-image");
  if (size?.width && size?.height) {
    lightboxImage.width = size.width;
    lightboxImage.height = size.height;
  } else {
    lightboxImage.removeAttribute("width");
    lightboxImage.removeAttribute("height");
  }
  lightboxImage.src = image;
  lightboxImage.alt = alt;
  lightbox.hidden = false;
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-lightbox-open");

  requestAnimationFrame(() => {
    lightbox.scrollTop = 0;
    lightbox.querySelector(".lightbox-close")?.focus({ preventScroll: true });
  });
}

function closeLightbox() {
  const lightbox = document.querySelector("[data-lightbox]");
  if (!lightbox) return;
  const lightboxImage = lightbox.querySelector(".lightbox-image");
  lightbox.hidden = true;
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.removeAttribute("src");
  document.body.classList.remove("is-lightbox-open");
}

async function loadEditableContent() {
  try {
    const api = window.SherlockContentApi;
    if (!api) return;
    const content = await api.loadContent();
    if (hasContentPayload(content)) {
      renderEditableContent(content);
      return;
    }
    if (usesRemoteContentSource()) renderEditableContent(emptyEditableContent());
  } catch {
    if (usesRemoteContentSource()) renderEditableContent(emptyEditableContent());
    // Static preview can still work without the local editing backend.
  }
}

function renderEditableContent(content) {
  editableContent = content;
  applySiteContent(content);
  setCategoryFeatureImage(content);
  renderHomePortfolio(content);
  renderCollectionGrid(content);
  renderProjectBoard(content);
  scheduleHeroVisualAlignment();
}

function alignHeroVisualToRegister() {
  if (!heroVisual || !exhibitionRegister) return;

  if (window.matchMedia("(max-width: 1100px)").matches) {
    heroVisual.style.removeProperty("--hero-visual-target-height");
    return;
  }

  const visualRect = heroVisual.getBoundingClientRect();
  const registerRect = exhibitionRegister.getBoundingClientRect();
  const targetHeight = Math.round(registerRect.bottom - visualRect.top);

  if (targetHeight > 320) {
    heroVisual.style.setProperty("--hero-visual-target-height", `${targetHeight}px`);
  } else {
    heroVisual.style.removeProperty("--hero-visual-target-height");
  }
}

function scheduleHeroVisualAlignment() {
  if (!heroVisual || !exhibitionRegister) return;
  if (heroVisualAlignmentFrame) cancelAnimationFrame(heroVisualAlignmentFrame);
  heroVisualAlignmentFrame = requestAnimationFrame(() => {
    heroVisualAlignmentFrame = null;
    alignHeroVisualToRegister();
  });
}

if (yearSlot) {
  yearSlot.textContent = new Date().getFullYear();
}

document.querySelectorAll(".site-nav a").forEach((link) => {
  const linkPath = new URL(link.href, window.location.origin).pathname;
  if (linkPath === currentPath) {
    link.setAttribute("aria-current", "page");
  }
});

if (header) {
  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

if (nav && navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

if (heroActionButtons.length) {
  const setSelectedHeroAction = (selectedButton) => {
    heroActionButtons.forEach((button) => {
      button.classList.toggle("is-selected", button === selectedButton);
    });
  };

  heroActionButtons.forEach((button) => {
    button.addEventListener("pointerenter", () => setSelectedHeroAction(button));
    button.addEventListener("focus", () => setSelectedHeroAction(button));
    button.addEventListener("pointerleave", () => {
      if (document.activeElement !== button) button.classList.remove("is-selected");
    });
    button.addEventListener("blur", () => button.classList.remove("is-selected"));
  });
}

window.addEventListener("load", scheduleHeroVisualAlignment);
window.addEventListener("resize", scheduleHeroVisualAlignment);
window.addEventListener("resize", lockBalancedCollectionGrid);
heroVisualImage?.addEventListener("load", scheduleHeroVisualAlignment);
document.fonts?.ready?.then(scheduleHeroVisualAlignment).catch(() => {});

filterButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    if (
      button instanceof HTMLAnchorElement &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      event.button === 0
    ) {
      event.preventDefault();
    }

    const filter = button.dataset.filter;
    applyHomeFilter(filter, button);
  });
});

document.addEventListener("click", (event) => {
  const trigger = event.target.closest?.("[data-full-image]");
  if (!trigger) return;

  event.preventDefault();
  openLightbox(trigger.dataset.fullImage, trigger.getAttribute("aria-label") || "", lightboxImageSizeFromTrigger(trigger));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
    return;
  }

  if (event.key !== "Enter" && event.key !== " ") return;
  const trigger = event.target.closest?.("[data-full-image]");
  if (!trigger || trigger instanceof HTMLAnchorElement) return;

  event.preventDefault();
  openLightbox(trigger.dataset.fullImage, trigger.getAttribute("aria-label") || "", lightboxImageSizeFromTrigger(trigger));
});

document.addEventListener("click", (event) => {
  const lightbox = event.target.closest?.("[data-lightbox]");
  if (!lightbox) return;
  if (event.target === lightbox || event.target.closest(".lightbox-close")) {
    closeLightbox();
  }
});

loadEditableContent();
