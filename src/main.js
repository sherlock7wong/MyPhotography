const header = document.querySelector("[data-header]");
const nav = document.querySelector("#site-nav");
const navToggle = document.querySelector(".nav-toggle");
const filterButtons = document.querySelectorAll("[data-filter]");
const homePortfolio = document.querySelector("[data-home-portfolio]");
const collectionGrid = document.querySelector("[data-collection-grid]");
const yearSlot = document.querySelector("[data-year]");
const currentPath = window.location.pathname.replace(/\/index\.html$/, "/");
const pageKey = currentPath.split("/").filter(Boolean)[0] || "home";
const homeCategoryMap = {
  portrait: "portrait",
  city: "cityscape",
  landscape: "landscape"
};
let editableContent = null;
let activeHomeFilter = "all";

function toCssUrl(value) {
  const safeValue = String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `url("${safeValue}")`;
}

function visibleItems(items) {
  return (items || []).filter((item) => item && typeof item.image === "string" && item.image.trim());
}

function getPageItems(content, key) {
  return visibleItems(content.pages?.[key]);
}

function cardLabel(item, fallback) {
  return item.label || fallback;
}

function cardTitle(item, fallback) {
  return item.title || fallback;
}

function setWindowImage(windowCard, item) {
  windowCard.classList.toggle("has-image", Boolean(item.image));
  if (item.image) {
    windowCard.style.setProperty("--window-image", toCssUrl(item.image));
  } else {
    windowCard.style.removeProperty("--window-image");
  }
}

function createHomeCard(item, page, index) {
  const card = document.createElement("a");
  card.className = "work-card";
  card.href = item.image;
  card.dataset.category = page === "cityscape" ? "city" : page;
  card.dataset.fullImage = item.image;
  card.dataset.windowId = item.id || `${page}-${index + 1}`;
  card.setAttribute("aria-label", cardTitle(item, `${page} window ${index + 1}`));
  setWindowImage(card, item);
  return card;
}

function createCollectionCard(item, index) {
  const card = document.createElement("article");
  card.className = "collection-card";
  card.dataset.windowId = item.id || `${pageKey}-${index + 1}`;
  card.dataset.fullImage = item.image;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", cardTitle(item, `${pageKey} window ${index + 1}`));

  const label = document.createElement("span");
  label.textContent = cardLabel(item, `${pageKey} ${String(index + 1).padStart(2, "0")}`);

  const title = document.createElement("strong");
  title.textContent = cardTitle(item, "Untitled");

  card.append(label, title);
  setWindowImage(card, item);
  return card;
}

function homeItemsForFilter(content, filter) {
  if (filter === "all") {
    const groups = ["portrait", "cityscape", "landscape"].map((key) => ({
      key,
      items: getPageItems(content, key).slice(0, 5)
    }));
    const mixedItems = [];
    for (let index = 0; index < 5; index += 1) {
      groups.forEach((group) => {
        const item = group.items[index];
        if (item && mixedItems.length < 15) mixedItems.push({ item, page: group.key });
      });
    }
    return mixedItems;
  }

  const page = homeCategoryMap[filter] || filter;
  return getPageItems(content, page)
    .slice(0, 6)
    .map((item) => ({ item, page }));
}

function renderHomePortfolio(content) {
  if (!homePortfolio) return;

  const items = homeItemsForFilter(content, activeHomeFilter);
  homePortfolio.innerHTML = "";
  items.forEach(({ item, page }, index) => {
    homePortfolio.append(createHomeCard(item, page, index));
  });
}

function renderCollectionGrid(content) {
  if (!collectionGrid || pageKey === "home") return;

  const items = getPageItems(content, pageKey);
  collectionGrid.innerHTML = "";
  items.forEach((item, index) => {
    collectionGrid.append(createCollectionCard(item, index));
  });
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
    const value = site[element.dataset.editKey];
    if (typeof value === "string") element.textContent = value;
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
    if (typeof value === "string" && value.trim()) element.setAttribute("src", value);
  });

  document.querySelectorAll("[data-edit-alt-key]").forEach((element) => {
    const value = site[element.dataset.editAltKey];
    if (typeof value === "string") element.setAttribute("alt", value);
  });

  if (pageMeta) {
    document.querySelectorAll("[data-page-edit-key]").forEach((element) => {
      const value = pageMeta[element.dataset.pageEditKey];
      if (typeof value === "string") element.textContent = value;
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
  lightbox.innerHTML = `
    <button class="lightbox-close" type="button" aria-label="Close image">Close</button>
    <img class="lightbox-image" alt="" />
  `;
  document.body.append(lightbox);
  return lightbox;
}

function openLightbox(image, alt = "") {
  if (!image) return;
  const lightbox = ensureLightbox();
  const lightboxImage = lightbox.querySelector(".lightbox-image");
  lightboxImage.src = image;
  lightboxImage.alt = alt;
  lightbox.hidden = false;
  document.body.classList.add("is-lightbox-open");
}

function closeLightbox() {
  const lightbox = document.querySelector("[data-lightbox]");
  if (!lightbox) return;
  const lightboxImage = lightbox.querySelector(".lightbox-image");
  lightbox.hidden = true;
  lightboxImage.removeAttribute("src");
  document.body.classList.remove("is-lightbox-open");
}

async function loadEditableContent() {
  try {
    const api = window.SherlockContentApi;
    if (!api) return;
    const content = await api.loadContent();
    editableContent = content;
    applySiteContent(content);
    renderHomePortfolio(content);
    renderCollectionGrid(content);
  } catch {
    // Static preview can still work without the local editing backend.
  }
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
  openLightbox(trigger.dataset.fullImage, trigger.getAttribute("aria-label") || "");
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
  openLightbox(trigger.dataset.fullImage, trigger.getAttribute("aria-label") || "");
});

document.addEventListener("click", (event) => {
  const lightbox = event.target.closest?.("[data-lightbox]");
  if (!lightbox) return;
  if (event.target === lightbox || event.target.closest(".lightbox-close")) {
    closeLightbox();
  }
});

loadEditableContent();
