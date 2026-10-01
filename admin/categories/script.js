const STORAGE_KEY = "wong.categories.admin.data";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const COMPONENTS = [
  ["header", "Header"],
  ["photographyHero", "Photography Hero"],
  ["archiveToolbar", "Archive Toolbar"],
  ["filterButtons", "Filter Buttons"],
  ["categoriesSection", "Categories Section"],
  ["categoryCards", "Category Cards"],
  ["featuredSection", "Featured Section"],
  ["galleryGrid", "Gallery Grid"],
  ["detailPanel", "Detail Panel"],
  ["footer", "Footer"]
];

const PAGE_CONTENT = {
  header: {
    brand: "WonG",
    nav: "Home / About / Projects / Photography / Contact",
    active: "Photography",
    kicker: "Photographer / Visual Archive"
  },
  hero: {
    title: "Photography",
    pagePath: "/photography",
    description:
      "A visual archive of moments and places.\nImages from different journeys and seasons, recorded in natural light."
  },
  archiveMeta: {
    archiveNo: "03",
    updated: "May 2025",
    basedIn: "Shenzhen, China"
  },
  toolbarFilters: ["All", "Featured", "Portrait", "Landscape", "City Humanity", "Personal"],
  footer: {
    archive: "Archive",
    archiveText: "WonG",
    captureLife: "Capture Life",
    captureText: "Keep it real.",
    photography: "Photography",
    copyright: "2025 WonG. All rights reserved."
  }
};

const DEFAULT_DATA = {
  pageContent: PAGE_CONTENT,
  components: {
    header: true,
    photographyHero: true,
    archiveToolbar: true,
    filterButtons: true,
    categoriesSection: true,
    categoryCards: true,
    featuredSection: true,
    galleryGrid: true,
    detailPanel: true,
    footer: true
  },
  categories: [
    {
      id: "portrait",
      name: "Portrait",
      slug: "/photography/portrait",
      heroTitle: "",
      description: "TODO: Add category description.",
      coverImage: "../../Home/assets/portrait.png",
      coverAlt: "Portrait collection preview",
      photoCount: 128,
      visibility: "Public",
      status: "Published",
      sortOrder: 1,
      seoTitle: "",
      seoDescription: ""
    },
    {
      id: "landscape",
      name: "Landscape",
      slug: "/photography/landscape",
      heroTitle: "",
      description: "TODO: Add category description.",
      coverImage: "../../Project/assets/project-edges-light.png",
      coverAlt: "Landscape collection preview",
      photoCount: 156,
      visibility: "Public",
      status: "Published",
      sortOrder: 2,
      seoTitle: "",
      seoDescription: ""
    },
    {
      id: "city-humanity",
      name: "City Humanity",
      slug: "/photography/city-humanity",
      heroTitle: "",
      description: "TODO: Add category description.",
      coverImage: "../../Project/assets/project-city-rhythm.png",
      coverAlt: "City humanity collection preview",
      photoCount: 214,
      visibility: "Public",
      status: "Published",
      sortOrder: 3,
      seoTitle: "",
      seoDescription: ""
    },
    {
      id: "personal",
      name: "Personal",
      slug: "/photography/personal",
      heroTitle: "",
      description: "TODO: Add category description.",
      coverImage: "../../Home/assets/personal.png",
      coverAlt: "Personal collection preview",
      photoCount: 92,
      visibility: "Public",
      status: "Published",
      sortOrder: 4,
      seoTitle: "",
      seoDescription: ""
    }
  ]
};

const ui = {
  search: "",
  dragId: ""
};

let data = normalizeData(loadData());
let savedData = clone(data);
let selectedIds = new Set();
let activeCategoryId = data.categories[0] ? data.categories[0].id : "";
let editorBaseline = activeCategoryId ? clone(getCategory(activeCategoryId)) : null;
let toastTimer = null;

const elements = {
  categoryRows: document.getElementById("categoryRows"),
  emptyState: document.getElementById("emptyState"),
  resultCount: document.getElementById("resultCount"),
  searchInput: document.getElementById("searchInput"),
  bulkAction: document.getElementById("bulkAction"),
  unsavedNotice: document.getElementById("unsavedNotice"),
  categoryPanel: document.getElementById("categoryPanel"),
  categoryComponentNotice: document.getElementById("categoryComponentNotice"),
  componentControls: document.getElementById("componentControls"),
  componentPreview: document.getElementById("componentPreview"),
  categoryForm: document.getElementById("categoryForm"),
  editorEmpty: document.getElementById("editorEmpty"),
  categoryName: document.getElementById("categoryName"),
  categorySlug: document.getElementById("categorySlug"),
  heroTitle: document.getElementById("heroTitle"),
  description: document.getElementById("description"),
  coverPreview: document.getElementById("coverPreview"),
  coverPlaceholder: document.getElementById("coverPlaceholder"),
  coverInput: document.getElementById("coverInput"),
  coverAlt: document.getElementById("coverAlt"),
  seoTitle: document.getElementById("seoTitle"),
  seoDescription: document.getElementById("seoDescription"),
  photoCount: document.getElementById("photoCount"),
  status: document.getElementById("status"),
  visibilitySwitch: document.getElementById("visibilitySwitch"),
  visibilityLabel: document.getElementById("visibilityLabel"),
  sortOrder: document.getElementById("sortOrder"),
  viewOnSite: document.getElementById("viewOnSite"),
  livePreview: document.getElementById("livePreview"),
  toast: document.getElementById("toast")
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return clone(DEFAULT_DATA);
    return mergeDefaults(clone(DEFAULT_DATA), JSON.parse(saved));
  } catch (error) {
    return clone(DEFAULT_DATA);
  }
}

function mergeDefaults(defaultValue, savedValue) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(savedValue) ? savedValue : clone(defaultValue);
  }

  if (defaultValue && typeof defaultValue === "object") {
    const merged = {};
    Object.keys(defaultValue).forEach((key) => {
      merged[key] = mergeDefaults(defaultValue[key], savedValue ? savedValue[key] : undefined);
    });
    return merged;
  }

  return savedValue === undefined || savedValue === null ? defaultValue : savedValue;
}

function normalizeData(value) {
  const next = value && typeof value === "object" ? value : clone(DEFAULT_DATA);
  next.pageContent = mergeDefaults(clone(PAGE_CONTENT), next.pageContent || {});
  next.components = next.components && typeof next.components === "object" ? next.components : {};

  COMPONENTS.forEach(([key]) => {
    if (typeof next.components[key] !== "boolean") next.components[key] = true;
  });

  next.categories = Array.isArray(next.categories) && next.categories.length ? next.categories : clone(DEFAULT_DATA.categories);
  const seenIds = new Set();

  next.categories.forEach((category, index) => {
    const fallbackId = slugify(category.name || `category-${index + 1}`);
    let id = category.id || fallbackId;
    let suffix = 1;
    while (seenIds.has(id)) {
      suffix += 1;
      id = `${fallbackId}-${suffix}`;
    }

    seenIds.add(id);
    category.id = id;
    category.name = category.name || "";
    category.slug = category.slug || "";
    category.heroTitle = category.heroTitle || "";
    category.description = category.description || "";
    category.coverImage = category.coverImage || "";
    category.coverAlt = category.coverAlt || "";
    category.photoCount = Math.max(0, Number(category.photoCount) || 0);
    category.visibility = category.visibility === "Hidden" ? "Hidden" : "Public";
    category.status = category.status === "Draft" ? "Draft" : "Published";
    category.sortOrder = Math.max(1, Number(category.sortOrder) || index + 1);
    category.seoTitle = category.seoTitle || "";
    category.seoDescription = category.seoDescription || "";
  });

  syncSortOrder(next.categories);
  return next;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `category-${Date.now()}`;
}

function makeUniqueId(value) {
  const base = slugify(value || "category");
  const ids = new Set(data.categories.map((category) => category.id));
  let candidate = base;
  let index = 1;

  while (ids.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }

  return candidate;
}

function getCategory(id) {
  return data.categories.find((category) => category.id === id);
}

function getOrderedCategories(source = data.categories) {
  return [...source].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder) || a.name.localeCompare(b.name));
}

function getFilteredCategories() {
  const search = ui.search.trim().toLowerCase();
  const ordered = getOrderedCategories();

  if (!search) return ordered;

  return ordered.filter((category) =>
    [category.name, category.description, category.slug].join(" ").toLowerCase().includes(search)
  );
}

function syncSortOrder(source) {
  const ordered = source ? [...source].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder) || a.name.localeCompare(b.name)) : getOrderedCategories();
  ordered.forEach((category, index) => {
    category.sortOrder = index + 1;
  });
}

function imageMarkup(src, alt) {
  if (!src) {
    return `<div class="placeholder-media">No image</div>`;
  }

  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt || "")}" loading="lazy" decoding="async" />`;
}

function archiveLabel(category) {
  const order = Math.max(1, Number(category ? category.sortOrder : 0) || 1);
  return `Archive ${String(order).padStart(2, "0")}`;
}

function categoryTitle(category) {
  return category.heroTitle.trim() || category.name.trim() || "Untitled Category";
}

function categoryDescription(category) {
  return category.description.trim() || "TODO: Add category description.";
}

function updateDirtyState() {
  const dirty = JSON.stringify(data) !== JSON.stringify(savedData);
  elements.unsavedNotice.hidden = !dirty;
  document.body.classList.toggle("has-unsaved", dirty);
}

function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", isError);
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 2400);
}

function renderCategoryRows() {
  const categories = getFilteredCategories();
  elements.emptyState.hidden = categories.length !== 0;

  elements.categoryRows.innerHTML = categories.map(renderCategoryRow).join("");

  const total = data.categories.length;
  elements.resultCount.textContent = categories.length
    ? `Showing 1 to ${categories.length} of ${total} categories`
    : `Showing 0 to 0 of ${total} categories`;
}

function renderCategoryRow(category) {
  const isActive = category.id === activeCategoryId;
  const checked = selectedIds.has(category.id);
  const description = categoryDescription(category);

  return `
    <tr class="${isActive ? "is-active" : ""}" data-row-id="${escapeHtml(category.id)}" draggable="true">
      <td>
        <div class="handle-cell">
          <input type="checkbox" data-select-id="${escapeHtml(category.id)}" ${checked ? "checked" : ""} aria-label="Select ${escapeHtml(category.name || "category")}" />
          <span class="drag-handle" aria-label="Drag handle">::</span>
        </div>
      </td>
      <td><span class="order-box">${escapeHtml(category.sortOrder)}</span></td>
      <td>
        <div class="category-summary">
          <figure class="category-thumb">${imageMarkup(category.coverImage, category.coverAlt)}</figure>
          <span class="category-copy">
            <strong>${escapeHtml(category.name || "Untitled")}</strong>
            <small>${escapeHtml(description)}</small>
          </span>
        </div>
      </td>
      <td><span class="slug-text">${escapeHtml(category.slug || "TODO: Add slug")}</span></td>
      <td>${escapeHtml(category.photoCount)}</td>
      <td><span class="visibility-chip ${category.visibility === "Hidden" ? "is-hidden" : ""}">${escapeHtml(category.visibility)}</span></td>
      <td><span class="status-chip ${category.status === "Draft" ? "is-draft" : ""}">${escapeHtml(category.status)}</span></td>
      <td>
        <div class="action-group">
          <button class="row-icon" type="button" data-action="move-up" data-id="${escapeHtml(category.id)}" aria-label="Move category up">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 14 5-5 5 5" /></svg>
          </button>
          <button class="row-icon" type="button" data-action="move-down" data-id="${escapeHtml(category.id)}" aria-label="Move category down">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
          </button>
          <button class="row-icon" type="button" data-action="edit-category" data-id="${escapeHtml(category.id)}" aria-label="Edit category">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20ZM13.5 6.5l4 4" /></svg>
          </button>
          <button class="row-icon is-danger" type="button" data-action="delete-category" data-id="${escapeHtml(category.id)}" aria-label="Delete category">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 14h10l1-14" /></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderEditor() {
  const category = getCategory(activeCategoryId);
  const hasCategory = Boolean(category);

  elements.categoryForm.hidden = !hasCategory;
  elements.editorEmpty.hidden = hasCategory;

  if (!category) {
    elements.viewOnSite.href = "#";
    renderLivePreview();
    return;
  }

  elements.categoryName.value = category.name;
  elements.categorySlug.value = category.slug;
  elements.heroTitle.value = category.heroTitle;
  elements.description.value = category.description;
  elements.coverAlt.value = category.coverAlt;
  elements.seoTitle.value = category.seoTitle;
  elements.seoDescription.value = category.seoDescription;
  elements.photoCount.value = String(category.photoCount);
  elements.status.value = category.status;
  elements.visibilitySwitch.checked = category.visibility === "Public";
  elements.visibilityLabel.textContent = category.visibility;
  elements.sortOrder.value = String(category.sortOrder);

  elements.coverPreview.parentElement.classList.toggle("has-image", Boolean(category.coverImage));
  elements.coverPreview.src = category.coverImage || "";
  elements.coverPreview.alt = category.coverAlt || "";
  elements.coverPlaceholder.textContent = category.coverImage ? "" : "No image selected";
  elements.viewOnSite.href = category.slug || "#";

  updateCharacterCounters();
  renderLivePreview();
}

function updateCharacterCounters() {
  const category = getCategory(activeCategoryId);
  document.querySelectorAll("[data-count-for]").forEach((counter) => {
    const field = counter.dataset.countFor;
    counter.textContent = String(category ? category[field] || "" : "").length;
  });
}

function renderComponentControls() {
  elements.componentControls.innerHTML = COMPONENTS.map(
    ([key, label]) => `
      <label class="switch-row">
        <span>${escapeHtml(label)}</span>
        <span class="switch">
          <input type="checkbox" data-component="${escapeHtml(key)}" ${data.components[key] ? "checked" : ""} />
          <span aria-hidden="true"></span>
        </span>
      </label>
    `
  ).join("");
}

function renderComponentPreview() {
  const active = COMPONENTS.filter(([key]) => data.components[key]);

  if (!active.length) {
    elements.componentPreview.innerHTML = `<div class="component-card"><strong>No modules visible</strong><span>Turn on a component to restore preview context.</span></div>`;
    return;
  }

  const category = getCategory(activeCategoryId) || data.categories[0];
  const descriptions = {
    header: `${data.pageContent.header.brand} / active ${data.pageContent.header.active}`,
    photographyHero: `${data.pageContent.hero.title} / ${data.pageContent.hero.pagePath}`,
    archiveToolbar: "Sort: Latest / Oldest / Title",
    filterButtons: data.pageContent.toolbarFilters.join(" / "),
    categoriesSection: `${data.categories.length} category records`,
    categoryCards: `${category ? category.name || "Untitled" : "No category"} card preview`,
    featuredSection: "Featured rail controlled from gallery data",
    galleryGrid: "Grid can filter by category slug",
    detailPanel: "Selected photo detail panel",
    footer: `${data.pageContent.footer.archive} / ${data.pageContent.footer.photography}`
  };

  elements.componentPreview.innerHTML = active
    .map(
      ([key, label]) => `
        <div class="component-card">
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(descriptions[key] || "")}</span>
        </div>
      `
    )
    .join("");
}

function applyComponentVisibility() {
  const categorySectionOff = !data.components.categoriesSection;
  elements.categoryPanel.classList.toggle("is-muted", categorySectionOff);
  elements.categoryComponentNotice.hidden = !categorySectionOff;
}

function renderLivePreview() {
  const category = getCategory(activeCategoryId);

  if (!category) {
    elements.livePreview.className = "live-preview is-empty";
    elements.livePreview.innerHTML = "<p>Select a category to preview page modules.</p>";
    return;
  }

  elements.livePreview.className = "live-preview";
  elements.viewOnSite.href = category.slug || "#";

  const image = category.coverImage
    ? `<img src="${escapeHtml(category.coverImage)}" alt="${escapeHtml(category.coverAlt || "")}" />`
    : `<div class="placeholder-media">No image</div>`;

  const header = data.components.header
    ? `
      <div class="live-header">
        <strong>${escapeHtml(data.pageContent.header.brand)}</strong>
        <span>${escapeHtml(data.pageContent.header.kicker)}</span>
      </div>
    `
    : "";

  const hero = data.components.photographyHero
    ? `
      <div class="live-hero">
        <figure class="live-image">${image}</figure>
        <div class="live-copy">
          <h4>${escapeHtml(categoryTitle(category))}</h4>
          <p>${escapeHtml(categoryDescription(category))}</p>
          <div class="live-meta">
            <span>${escapeHtml(archiveLabel(category))}</span>
            <span>/</span>
            <span>${escapeHtml(category.photoCount)} Photos</span>
            <span>/</span>
            <span>${escapeHtml(data.pageContent.archiveMeta.updated)}</span>
          </div>
        </div>
      </div>
    `
    : "";

  const toolbar = data.components.archiveToolbar
    ? `
      <div class="live-toolbar">
        ${data.components.filterButtons ? renderLiveFilters(category) : "<span>Filter Buttons hidden</span>"}
      </div>
    `
    : "";

  const categoryCard = data.components.categoriesSection && data.components.categoryCards
    ? `
      <div class="live-category-strip">
        <figure>${image}</figure>
        <span>
          <strong>${escapeHtml(category.name || "Untitled Category")}</strong>
          <small>${escapeHtml(category.photoCount)} images / shortcut: ${escapeHtml(slugify(category.name || "category"))}</small>
        </span>
      </div>
    `
    : "";

  const extra = `
    <div class="live-extra">
      ${data.components.featuredSection ? "<span>Featured Section</span>" : ""}
      ${data.components.galleryGrid ? "<span>Gallery Grid by category</span>" : ""}
      ${data.components.detailPanel ? "<span>Detail Panel</span>" : ""}
    </div>
  `;

  const footer = data.components.footer
    ? `
      <div class="live-footer">
        <span>${escapeHtml(data.pageContent.footer.archive)}</span>
        <span>${escapeHtml(data.pageContent.footer.photography)}</span>
        <span>${escapeHtml(data.pageContent.footer.copyright)}</span>
      </div>
    `
    : "";

  elements.livePreview.innerHTML = `${header}${hero}${toolbar}${categoryCard}${extra}${footer}`;
}

function renderLiveFilters(category) {
  return data.pageContent.toolbarFilters
    .map((label) => {
      const active = label.toLowerCase() === String(category.name).toLowerCase();
      return `<span class="${active ? "is-active" : ""}">${escapeHtml(label)}</span>`;
    })
    .join("");
}

function renderAll() {
  renderComponentControls();
  renderComponentPreview();
  applyComponentVisibility();
  renderCategoryRows();
  renderEditor();
  updateDirtyState();
}

function setActiveCategory(id) {
  const category = getCategory(id);
  if (!category) return;

  if (id !== activeCategoryId) {
    activeCategoryId = id;
    editorBaseline = clone(category);
  }

  renderCategoryRows();
  renderEditor();
}

function markChanged() {
  renderCategoryRows();
  renderComponentPreview();
  applyComponentVisibility();
  renderLivePreview();
  updateDirtyState();
}

function updateActiveField(target) {
  const category = getCategory(activeCategoryId);
  if (!category || !target.dataset.field) return;

  const field = target.dataset.field;
  let value = target.value;

  if (field === "visibility") {
    value = target.checked ? "Public" : "Hidden";
  }

  if (field === "photoCount") {
    value = Math.max(0, Number(value) || 0);
  }

  if (field === "sortOrder") {
    value = Math.max(1, Number(value) || 1);
  }

  category[field] = value;

  if (field === "sortOrder") {
    data.categories = getOrderedCategories();
    syncSortOrder(data.categories);
    elements.sortOrder.value = String(category.sortOrder);
  }

  if (field === "visibility") {
    elements.visibilityLabel.textContent = category.visibility;
  }

  updateCharacterCounters();
  markChanged();
}

function addCategory() {
  const sortOrder = data.categories.reduce((max, category) => Math.max(max, Number(category.sortOrder) || 0), 0) + 1;
  const category = {
    id: makeUniqueId("new-category"),
    name: "",
    slug: "",
    heroTitle: "",
    description: "",
    coverImage: "",
    coverAlt: "",
    photoCount: 0,
    visibility: "Hidden",
    status: "Draft",
    sortOrder,
    seoTitle: "",
    seoDescription: ""
  };

  data.categories.push(category);
  syncSortOrder();
  activeCategoryId = category.id;
  editorBaseline = clone(category);
  markChanged();
  renderEditor();
  elements.categoryName.focus();
}

function deleteCategory(id) {
  const category = getCategory(id);
  if (!category) return;

  const shouldDelete = window.confirm(`Delete "${category.name || "Untitled Category"}" from mock categories?`);
  if (!shouldDelete) return;

  data.categories = data.categories.filter((item) => item.id !== id);
  selectedIds.delete(id);
  syncSortOrder();

  if (activeCategoryId === id) {
    activeCategoryId = data.categories[0] ? data.categories[0].id : "";
    editorBaseline = activeCategoryId ? clone(getCategory(activeCategoryId)) : null;
  }

  renderAll();
}

function moveCategory(id, direction) {
  const ordered = getOrderedCategories();
  const index = ordered.findIndex((category) => category.id === id);
  const nextIndex = index + direction;

  if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;

  const [current] = ordered.splice(index, 1);
  ordered.splice(nextIndex, 0, current);
  data.categories = ordered;
  syncSortOrder(data.categories);
  markChanged();
  renderEditor();
}

function reorderByDrop(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return;

  const ordered = getOrderedCategories();
  const sourceIndex = ordered.findIndex((category) => category.id === sourceId);
  const targetIndex = ordered.findIndex((category) => category.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0) return;

  const [source] = ordered.splice(sourceIndex, 1);
  ordered.splice(targetIndex, 0, source);
  data.categories = ordered;
  syncSortOrder(data.categories);
  ui.dragId = "";
  markChanged();
  renderEditor();
}

function applyBulkAction() {
  const action = elements.bulkAction.value;
  const selected = data.categories.filter((category) => selectedIds.has(category.id));

  if (!action) {
    showToast("Choose a bulk action first.", true);
    return;
  }

  if (!selected.length) {
    showToast("Select at least one category first.", true);
    return;
  }

  if (action === "publish") {
    selected.forEach((category) => {
      category.status = "Published";
      category.visibility = "Public";
    });
  }

  if (action === "hide") {
    selected.forEach((category) => {
      category.visibility = "Hidden";
    });
  }

  if (action === "delete") {
    const shouldDelete = window.confirm(`Delete ${selected.length} selected categories from mock data?`);
    if (!shouldDelete) return;

    const selectedSet = new Set(selected.map((category) => category.id));
    data.categories = data.categories.filter((category) => !selectedSet.has(category.id));
    selectedIds = new Set();
    syncSortOrder();

    if (!getCategory(activeCategoryId)) {
      activeCategoryId = data.categories[0] ? data.categories[0].id : "";
      editorBaseline = activeCategoryId ? clone(getCategory(activeCategoryId)) : null;
    }
  }

  elements.bulkAction.value = "";
  renderAll();
}

function cancelEdit() {
  if (!editorBaseline || !activeCategoryId) return;

  const index = data.categories.findIndex((category) => category.id === activeCategoryId);
  if (index < 0) return;

  data.categories[index] = clone(editorBaseline);
  syncSortOrder();
  renderAll();
}

function validateBeforeSave() {
  const invalid = data.categories.find((category) => !category.name.trim() || !category.slug.trim());

  if (!invalid) return true;

  setActiveCategory(invalid.id);
  showToast("Category Name and Slug are required before saving.", true);

  if (!invalid.name.trim()) {
    elements.categoryName.focus();
  } else {
    elements.categorySlug.focus();
  }

  return false;
}

function saveData() {
  if (!validateBeforeSave()) return;

  syncSortOrder();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  savedData = clone(data);
  editorBaseline = activeCategoryId ? clone(getCategory(activeCategoryId)) : null;
  renderAll();
  showToast("Category updated successfully.");
}

function resetData() {
  const shouldReset = window.confirm("Reset Categories admin data and clear localStorage?");
  if (!shouldReset) return;

  localStorage.removeItem(STORAGE_KEY);
  data = normalizeData(clone(DEFAULT_DATA));
  savedData = clone(data);
  selectedIds = new Set();
  activeCategoryId = data.categories[0] ? data.categories[0].id : "";
  editorBaseline = activeCategoryId ? clone(getCategory(activeCategoryId)) : null;
  ui.search = "";
  ui.dragId = "";
  elements.searchInput.value = "";
  renderAll();
  showToast("Default mock data restored.");
}

function isSupportedImage(file) {
  return ALLOWED_IMAGE_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
}

function replaceCoverImage(file) {
  const category = getCategory(activeCategoryId);
  if (!category || !file) return;

  if (!isSupportedImage(file)) {
    showToast("Choose a JPG, PNG, or WEBP image.", true);
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    category.coverImage = reader.result;
    if (!category.coverAlt) category.coverAlt = category.name || "Category cover image";
    elements.coverInput.value = "";
    markChanged();
    renderEditor();
  });
  reader.addEventListener("error", () => {
    showToast("Could not read this image file.", true);
  });
  reader.readAsDataURL(file);
}

document.addEventListener("input", (event) => {
  const target = event.target;

  if (target === elements.searchInput) {
    ui.search = target.value;
    renderCategoryRows();
    return;
  }

  if (target.dataset.field) {
    updateActiveField(target);
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;

  if (target.dataset.component) {
    data.components[target.dataset.component] = target.checked;
    markChanged();
    return;
  }

  if (target === elements.coverInput) {
    replaceCoverImage(target.files[0]);
    return;
  }

  if (target.dataset.field) {
    updateActiveField(target);
  }
});

document.addEventListener("click", (event) => {
  const selectBox = event.target.closest("[data-select-id]");
  if (selectBox) {
    const id = selectBox.dataset.selectId;
    if (selectBox.checked) {
      selectedIds.add(id);
    } else {
      selectedIds.delete(id);
    }
    renderCategoryRows();
    return;
  }

  const button = event.target.closest("[data-action]");
  if (button) {
    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "add-category") {
      addCategory();
      return;
    }

    if (action === "apply-bulk") {
      applyBulkAction();
      return;
    }

    if (action === "save-data") {
      saveData();
      return;
    }

    if (action === "reset-data") {
      resetData();
      return;
    }

    if (action === "cancel-edit") {
      cancelEdit();
      return;
    }

    if (action === "close-editor") {
      activeCategoryId = "";
      renderCategoryRows();
      renderEditor();
      return;
    }

    if (action === "edit-category") {
      setActiveCategory(id);
      return;
    }

    if (action === "delete-category") {
      deleteCategory(id);
      return;
    }

    if (action === "move-up") {
      moveCategory(id, -1);
      return;
    }

    if (action === "move-down") {
      moveCategory(id, 1);
      return;
    }
  }

  const row = event.target.closest("[data-row-id]");
  if (row) {
    setActiveCategory(row.dataset.rowId);
  }
});

document.addEventListener("dragstart", (event) => {
  const row = event.target.closest("[data-row-id]");
  if (!row) return;

  ui.dragId = row.dataset.rowId;
  row.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", ui.dragId);
});

document.addEventListener("dragover", (event) => {
  if (!event.target.closest("[data-row-id]")) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
});

document.addEventListener("drop", (event) => {
  const row = event.target.closest("[data-row-id]");
  if (!row) return;

  event.preventDefault();
  const sourceId = event.dataTransfer.getData("text/plain") || ui.dragId;
  reorderByDrop(sourceId, row.dataset.rowId);
});

document.addEventListener("dragend", () => {
  ui.dragId = "";
  document.querySelectorAll(".is-dragging").forEach((row) => row.classList.remove("is-dragging"));
});

window.addEventListener("beforeunload", (event) => {
  if (JSON.stringify(data) === JSON.stringify(savedData)) return;
  event.preventDefault();
  event.returnValue = "";
});

renderAll();
