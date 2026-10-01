const STORAGE_KEY = "wong.gallery.admin.data";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const CATEGORIES = ["Portrait", "Landscape", "City Humanity", "Personal"];
const STATUSES = ["Published", "Draft", "Hidden"];

const COMPONENTS = [
  ["header", "Header"],
  ["photographyHero", "Photography Hero"],
  ["portraitRail", "Portrait Rail"],
  ["heroCopy", "Hero Copy"],
  ["archiveMeta", "Archive Meta"],
  ["archiveStamp", "Archive Stamp"],
  ["portraitCover", "Portrait Cover"],
  ["personalCover", "Personal Cover"],
  ["archiveToolbar", "Archive Toolbar"],
  ["categories", "Categories"],
  ["featured", "Featured"],
  ["galleryGrid", "Gallery Grid"],
  ["detailPanel", "Detail Panel"],
  ["footer", "Footer"]
];

const DEFAULT_DATA = {
  pageContent: {
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
    portraitRail: {
      label: "Portrait Collection",
      number: "04"
    },
    archiveMeta: {
      archiveNo: "03",
      updated: "May 2025",
      basedIn: "Shenzhen, China"
    },
    archiveStamp: {
      title: "WonG Archive\nPhotography Collection",
      number: "03"
    },
    portraitCover: {
      image: "../../Project/assets/project-seen-silence.png",
      alt: "Portrait collection cover in soft natural window light",
      year: "2024",
      light: "Natural Light",
      location: "Shenzhen, China"
    },
    personalCover: [
      {
        image: "../../Home/assets/personal.png",
        alt: "Quiet personal light by a window",
        place: "Shenzhen",
        date: "Apr 2024"
      },
      {
        image: "../../Home/assets/landscape.png",
        alt: "A quiet trip view through a window",
        place: "On the way",
        date: "Oct 2023"
      },
      {
        image: "../../Home/assets/photographer.png",
        alt: "Camera and cup on a personal desk",
        place: "Home",
        date: "Feb 2024"
      }
    ],
    toolbar: {
      filter: "All / Featured / Portrait / Landscape / City Humanity / Personal",
      sort: "Latest / Oldest / Title",
      view: "Grid / List"
    },
    footer: {
      archive: "Archive",
      archiveText: "WonG",
      captureLife: "Capture Life",
      captureText: "Keep it real.",
      photography: "Photography",
      photographyText: "Stories in light.",
      copyright: "2025 WonG. All rights reserved."
    }
  },
  categories: [
    {
      name: "Portrait",
      image: "../../Home/assets/portrait.png",
      alt: "Portrait collection preview",
      imageCount: 128,
      order: 1,
      visible: true
    },
    {
      name: "Landscape",
      image: "../../Project/assets/project-edges-light.png",
      alt: "Landscape collection preview",
      imageCount: 156,
      order: 2,
      visible: true
    },
    {
      name: "City Humanity",
      image: "../../Project/assets/project-city-rhythm.png",
      alt: "City humanity collection preview",
      imageCount: 214,
      order: 3,
      visible: true
    },
    {
      name: "Personal",
      image: "../../Home/assets/personal.png",
      alt: "Personal collection preview",
      imageCount: 92,
      order: 4,
      visible: true
    }
  ],
  components: {
    header: true,
    photographyHero: true,
    portraitRail: true,
    heroCopy: true,
    archiveMeta: true,
    archiveStamp: true,
    portraitCover: true,
    personalCover: true,
    archiveToolbar: true,
    categories: true,
    featured: true,
    galleryGrid: true,
    detailPanel: true,
    footer: true
  },
  photos: [
    {
      id: "mountain-fog",
      title: "Mountain Fog",
      description: "Low clouds moved through the valley and softened the ridge line.",
      category: "Landscape",
      image: "../../Project/assets/project-highlands.png",
      altText: "Mountain valley covered with soft fog",
      featured: false,
      status: "Published",
      sortOrder: 12,
      year: "2024",
      location: "Yunnan, China",
      date: "Oct 12, 2024",
      camera: "FUJIFILM GFX 50R",
      lens: "63mm f/2.8",
      aperture: "f/8",
      shutter: "1/125s",
      iso: "100"
    },
    {
      id: "rainy-street",
      title: "Rainy Street",
      description: "A rainy afternoon in the city. People walk across the wet street, umbrellas and reflections.",
      category: "City Humanity",
      image: "../../CityHuman/assets/rain-walk.png",
      altText: "People walking on a rainy street in the city",
      featured: true,
      status: "Published",
      sortOrder: 13,
      year: "2024",
      location: "Shanghai, China",
      date: "Mar 02, 2024",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/4",
      shutter: "1/250s",
      iso: "400"
    },
    {
      id: "window-light",
      title: "Window Light",
      description: "A portrait held by window light. The room was quiet, and the face stayed close to shadow.",
      category: "Portrait",
      image: "../../Home/assets/portrait.png",
      altText: "A quiet portrait beside a window in soft light",
      featured: false,
      status: "Published",
      sortOrder: 14,
      year: "2024",
      location: "Shenzhen, China",
      date: "May 12, 2024",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/2",
      shutter: "1/500s",
      iso: "200"
    },
    {
      id: "coastline",
      title: "Coastline",
      description: "Fog cleared in the afternoon. The light was soft and the air was clean.",
      category: "Landscape",
      image: "../../Project/assets/project-edges-light.png",
      altText: "A misty coastline with waves and cliffs",
      featured: false,
      status: "Published",
      sortOrder: 15,
      year: "2024",
      location: "Northern California, USA",
      date: "Apr 18, 2024",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/5.6",
      shutter: "1/500s",
      iso: "200"
    },
    {
      id: "quiet-moment",
      title: "Quiet Moment",
      description: "A small still life by the window before the day began.",
      category: "Personal",
      image: "../../Home/assets/personal.png",
      altText: "A quiet table scene with warm morning light",
      featured: true,
      status: "Published",
      sortOrder: 16,
      year: "2024",
      location: "Shenzhen, China",
      date: "Jan 21, 2024",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/2.8",
      shutter: "1/125s",
      iso: "640"
    },
    {
      id: "old-alley",
      title: "Old Alley",
      description: "A slow walk through the old block while light settled between the buildings.",
      category: "City Humanity",
      image: "../../CityHuman/assets/old-street.png",
      altText: "People walking through an old city alley",
      featured: false,
      status: "Published",
      sortOrder: 17,
      year: "2024",
      location: "Shanghai, China",
      date: "Mar 28, 2024",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/4",
      shutter: "1/500s",
      iso: "320"
    },
    {
      id: "on-the-train",
      title: "On the Train",
      description: "A quiet trip view framed by the train window.",
      category: "Personal",
      image: "../../CityHuman/assets/bus-window.png",
      altText: "A view through a vehicle window",
      featured: false,
      status: "Draft",
      sortOrder: 18,
      year: "2023",
      location: "On the way",
      date: "Oct 06, 2023",
      camera: "SONY A7C",
      lens: "35mm f/1.8",
      aperture: "f/8",
      shutter: "1/400s",
      iso: "160"
    },
    {
      id: "morning-market",
      title: "Morning Market",
      description: "A market morning built from small timing, hands, fruit, and passing light.",
      category: "City Humanity",
      image: "../../CityHuman/assets/market.png",
      altText: "People buying fruit in a morning market",
      featured: false,
      status: "Published",
      sortOrder: 19,
      year: "2024",
      location: "Shenzhen, China",
      date: "Jun 15, 2024",
      camera: "FUJIFILM X100V",
      lens: "23mm f/2",
      aperture: "f/2.8",
      shutter: "1/160s",
      iso: "500"
    }
  ]
};

const ui = {
  category: "All Categories",
  featured: "All Featured",
  status: "All Status",
  search: "",
  view: "grid",
  page: 1,
  rowsPerPage: 24
};

let data = normalizeData(loadData());
let savedData = clone(data);
let selectedIds = new Set();
let activePhotoId = data.photos[0] ? data.photos[0].id : "";
let editorBaseline = activePhotoId ? clone(getPhoto(activePhotoId)) : null;
let uploadJobs = [];
let toastTimer = null;

const elements = {
  categoryFilter: document.getElementById("categoryFilter"),
  featuredFilter: document.getElementById("featuredFilter"),
  statusFilter: document.getElementById("statusFilter"),
  searchInput: document.getElementById("searchInput"),
  rowsPerPage: document.getElementById("rowsPerPage"),
  selectVisible: document.getElementById("selectVisible"),
  selectedCount: document.getElementById("selectedCount"),
  batchBar: document.getElementById("batchBar"),
  batchCategory: document.getElementById("batchCategory"),
  uploadInput: document.getElementById("uploadInput"),
  uploadQueue: document.getElementById("uploadQueue"),
  uploadItems: document.getElementById("uploadItems"),
  uploadSummaryText: document.getElementById("uploadSummaryText"),
  uploadSummaryBar: document.getElementById("uploadSummaryBar"),
  uploadSummaryPercent: document.getElementById("uploadSummaryPercent"),
  photoGrid: document.getElementById("photoGrid"),
  paginationInfo: document.getElementById("paginationInfo"),
  paginationPages: document.getElementById("paginationPages"),
  editContent: document.getElementById("editContent"),
  componentControl: document.getElementById("componentControl"),
  pageContentEditor: document.getElementById("pageContentEditor"),
  categoryList: document.getElementById("categoryList"),
  featuredList: document.getElementById("featuredList"),
  unsavedNotice: document.getElementById("unsavedNotice"),
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
  COMPONENTS.forEach(([key]) => {
    if (typeof value.components[key] !== "boolean") value.components[key] = true;
  });

  value.photos = Array.isArray(value.photos) ? value.photos : [];
  const seenPhotoIds = new Set();
  value.photos.forEach((photo, index) => {
    const baseId = photo.id || slugify(photo.title || `photo-${index + 1}`);
    let nextId = baseId;
    let suffix = 1;
    while (seenPhotoIds.has(nextId)) {
      suffix += 1;
      nextId = `${baseId}-${suffix}`;
    }
    seenPhotoIds.add(nextId);
    photo.id = nextId;
    photo.title = photo.title || "Untitled Photo";
    photo.description = photo.description || "";
    photo.category = CATEGORIES.includes(photo.category) ? photo.category : "Personal";
    photo.image = photo.image || "";
    photo.altText = photo.altText || photo.title;
    photo.featured = Boolean(photo.featured);
    photo.status = STATUSES.includes(photo.status) ? photo.status : "Draft";
    photo.sortOrder = Number(photo.sortOrder) || index + 1;
    photo.year = photo.year || "";
    photo.location = photo.location || "";
    photo.date = photo.date || "";
    photo.camera = photo.camera || "";
    photo.lens = photo.lens || "";
    photo.aperture = photo.aperture || "";
    photo.shutter = photo.shutter || "";
    photo.iso = photo.iso || "";
  });

  value.categories = Array.isArray(value.categories) ? value.categories : clone(DEFAULT_DATA.categories);
  value.categories.forEach((category, index) => {
    category.name = category.name || CATEGORIES[index] || "Category";
    category.image = category.image || "";
    category.alt = category.alt || `${category.name} collection preview`;
    category.imageCount = Number(category.imageCount) || 0;
    category.order = Number(category.order) || index + 1;
    category.visible = category.visible !== false;
  });

  return value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getByPath(path) {
  return path.split(".").reduce((target, part) => {
    if (target === undefined || target === null) return undefined;
    return target[part];
  }, data);
}

function setByPath(path, value) {
  const parts = path.split(".");
  let target = data;

  parts.slice(0, -1).forEach((part) => {
    target = target[part];
  });

  target[parts[parts.length - 1]] = value;
}

function getPhoto(id) {
  return data.photos.find((photo) => photo.id === id);
}

function getOrderedPhotos(source = data.photos) {
  return [...source].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder) || a.title.localeCompare(b.title));
}

function getFilteredPhotos() {
  const search = ui.search.trim().toLowerCase();

  return getOrderedPhotos().filter((photo) => {
    if (ui.category !== "All Categories" && photo.category !== ui.category) return false;
    if (ui.featured === "Featured" && !photo.featured) return false;
    if (ui.featured === "Not Featured" && photo.featured) return false;
    if (ui.status !== "All Status" && photo.status !== ui.status) return false;
    if (!search) return true;

    return [photo.title, photo.description, photo.altText]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });
}

function getPagedPhotos() {
  const filtered = getFilteredPhotos();
  const pageCount = Math.max(1, Math.ceil(filtered.length / ui.rowsPerPage));
  ui.page = Math.min(Math.max(1, ui.page), pageCount);
  const start = (ui.page - 1) * ui.rowsPerPage;
  return filtered.slice(start, start + ui.rowsPerPage);
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

function saveAll() {
  const invalidPhoto = data.photos.find((photo) => !photo.title.trim());
  if (invalidPhoto) {
    activePhotoId = invalidPhoto.id;
    editorBaseline = clone(invalidPhoto);
    renderEditPanel();
    showToast("Title is required before saving.", true);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  savedData = clone(data);
  editorBaseline = activePhotoId ? clone(getPhoto(activePhotoId)) : null;
  updateDirtyState();
  showToast("Photo information saved successfully.");
}

function resetData() {
  const shouldReset = window.confirm("Reset Gallery admin data and clear localStorage?");
  if (!shouldReset) return;

  uploadJobs.forEach((job) => window.clearInterval(job.timer));
  uploadJobs = [];
  localStorage.removeItem(STORAGE_KEY);
  data = normalizeData(clone(DEFAULT_DATA));
  savedData = clone(data);
  selectedIds = new Set();
  activePhotoId = data.photos[0] ? data.photos[0].id : "";
  editorBaseline = activePhotoId ? clone(getPhoto(activePhotoId)) : null;
  ui.category = "All Categories";
  ui.featured = "All Featured";
  ui.status = "All Status";
  ui.search = "";
  ui.view = "grid";
  ui.page = 1;
  ui.rowsPerPage = 24;
  syncControls();
  renderAll();
  showToast("Default mock data restored.");
}

function syncControls() {
  elements.categoryFilter.value = ui.category;
  elements.featuredFilter.value = ui.featured;
  elements.statusFilter.value = ui.status;
  elements.searchInput.value = ui.search;
  elements.rowsPerPage.value = String(ui.rowsPerPage);
  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === ui.view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function categoryClass(category) {
  if (category === "City Humanity") return "is-city";
  if (category === "Personal") return "is-personal";
  if (category === "Portrait") return "is-portrait";
  return "";
}

function statusClass(status) {
  if (status === "Draft") return "is-draft";
  if (status === "Hidden") return "is-hidden";
  return "";
}

function renderPhotoGrid() {
  const photos = getPagedPhotos();
  elements.photoGrid.classList.toggle("is-list", ui.view === "list");

  if (!photos.length) {
    elements.photoGrid.innerHTML = `<p class="empty-state">No photos match the current search or filters.</p>`;
    renderPagination();
    renderBatchBar();
    return;
  }

  elements.photoGrid.innerHTML = photos.map(renderPhotoCard).join("");
  renderPagination();
  renderBatchBar();
}

function renderPhotoCard(photo) {
  const selected = selectedIds.has(photo.id);
  const active = photo.id === activePhotoId;
  const star = photo.featured ? "&#9733;" : "&#9734;";

  return `
    <article class="photo-card ${selected ? "is-selected" : ""} ${active ? "is-active" : ""}" data-card-id="${escapeHtml(photo.id)}">
      <div class="photo-card-shell">
        <div class="photo-tools">
          <label class="photo-select" aria-label="Select ${escapeHtml(photo.title)}">
            <input type="checkbox" data-select-id="${escapeHtml(photo.id)}" ${selected ? "checked" : ""} />
          </label>
          <button class="tool-icon" type="button" data-action="move-up" data-id="${escapeHtml(photo.id)}" aria-label="Move photo up">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 14 5-5 5 5" /></svg>
          </button>
          <button class="tool-icon" type="button" data-action="move-down" data-id="${escapeHtml(photo.id)}" aria-label="Move photo down">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
          </button>
          <span class="drag-handle" aria-label="Sort handle">::</span>
          <button class="tool-icon" type="button" data-action="delete-photo" data-id="${escapeHtml(photo.id)}" aria-label="Delete photo">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 14h10l1-14" /></svg>
          </button>
        </div>
        <div class="photo-main">
          <figure class="photo-media">
            ${imageMarkup(photo.image, photo.altText)}
            <button class="star-button ${photo.featured ? "is-featured" : ""}" type="button" data-action="toggle-featured" data-id="${escapeHtml(photo.id)}" aria-label="Toggle featured">
              ${star}
            </button>
          </figure>
          <div class="photo-body">
            <div class="photo-title-row">
              <h3>${escapeHtml(photo.title)}</h3>
              <span class="tag ${categoryClass(photo.category)}">${escapeHtml(photo.category)}</span>
            </div>
            <div class="photo-meta-row">
              <span class="photo-id"># ${String(photo.sortOrder).padStart(4, "0")}</span>
              <span class="status-chip ${statusClass(photo.status)}">${escapeHtml(photo.status)}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function imageMarkup(src, alt) {
  if (!src) return `<div class="upload-placeholder">No image</div>`;
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt || "")}" loading="lazy" decoding="async" />`;
}

function renderPagination() {
  const filtered = getFilteredPhotos();
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / ui.rowsPerPage));
  ui.page = Math.min(Math.max(1, ui.page), pageCount);
  const start = total ? (ui.page - 1) * ui.rowsPerPage + 1 : 0;
  const end = Math.min(ui.page * ui.rowsPerPage, total);

  elements.paginationInfo.textContent = `Showing ${start} to ${end} of ${total} photos`;
  elements.paginationPages.innerHTML = makePageButtons(pageCount);
}

function makePageButtons(pageCount) {
  if (pageCount <= 1) {
    return `<button class="is-active" type="button" data-page="1">1</button>`;
  }

  const pages = new Set([1, pageCount, ui.page, ui.page - 1, ui.page + 1]);
  const validPages = [...pages].filter((page) => page >= 1 && page <= pageCount).sort((a, b) => a - b);
  const parts = [];

  validPages.forEach((page, index) => {
    if (index > 0 && page - validPages[index - 1] > 1) {
      parts.push(`<span>...</span>`);
    }

    parts.push(`<button class="${page === ui.page ? "is-active" : ""}" type="button" data-page="${page}">${page}</button>`);
  });

  return parts.join("");
}

function renderBatchBar() {
  const selectedCount = selectedIds.size;
  const visibleIds = getPagedPhotos().map((photo) => photo.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  elements.selectedCount.textContent = `${selectedCount} selected`;
  elements.selectVisible.checked = allVisibleSelected;
  elements.batchBar.querySelectorAll("button, select").forEach((control) => {
    if (control.id === "batchCategory") {
      control.disabled = selectedCount === 0;
      return;
    }
    if (control.dataset.action) control.disabled = selectedCount === 0;
  });
}

function renderEditPanel() {
  const photo = getPhoto(activePhotoId);

  if (!photo) {
    elements.editContent.innerHTML = `<p class="edit-empty">No photo selected.</p>`;
    return;
  }

  elements.editContent.innerHTML = `
    <div class="edit-stack">
      <figure class="edit-preview">${imageMarkup(photo.image, photo.altText)}</figure>
      <label class="replace-button">
        <input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" data-replace-image="${escapeHtml(photo.id)}" />
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>
        Replace Image
      </label>
      <div class="edit-form-grid">
        ${photoInput("Title", "title", photo.title, { required: true, wide: true })}
        ${photoTextarea("Description", "description", photo.description, { max: 500 })}
        ${photoSelect("Category", "category", photo.category, CATEGORIES)}
        ${photoCheckbox("Featured", "featured", photo.featured)}
        ${photoInput("Sort Order", "sortOrder", photo.sortOrder, { type: "number", required: true })}
        ${photoInput("Alt Text", "altText", photo.altText, { wide: true })}
        ${photoSelect("Status", "status", photo.status, STATUSES, { wide: true })}
        ${photoInput("Year", "year", photo.year)}
        ${photoInput("Location", "location", photo.location, { wide: true })}
        ${photoInput("Date", "date", photo.date)}
        ${photoInput("Camera", "camera", photo.camera)}
        ${photoInput("Lens", "lens", photo.lens)}
        ${photoInput("Aperture", "aperture", photo.aperture)}
        ${photoInput("Shutter", "shutter", photo.shutter)}
        ${photoInput("ISO", "iso", photo.iso)}
      </div>
      <div class="edit-actions">
        <button class="edit-save" type="button" data-action="save-all">Save Changes</button>
        <button class="edit-cancel" type="button" data-action="cancel-edit">Cancel</button>
      </div>
    </div>
  `;

  updateCharacterCounters();
}

function photoInput(label, field, value, options = {}) {
  const type = options.type || "text";
  const wide = options.wide ? "is-wide" : "";
  const required = options.required ? " *" : "";

  return `
    <label class="field ${wide}">
      <span>${escapeHtml(label)}${required}</span>
      <input type="${type}" data-photo-field="${field}" value="${escapeHtml(value)}" ${options.required ? "required" : ""} />
    </label>
  `;
}

function photoTextarea(label, field, value, options = {}) {
  return `
    <label class="field is-wide">
      <span>${escapeHtml(label)}</span>
      <textarea data-photo-field="${field}" maxlength="${options.max || 500}">${escapeHtml(value)}</textarea>
      <span class="field-footer"><span data-count-for="${field}">${String(value || "").length}</span> / ${options.max || 500}</span>
    </label>
  `;
}

function photoSelect(label, field, value, options, fieldOptions = {}) {
  return `
    <label class="field ${fieldOptions.wide ? "is-wide" : ""}">
      <span>${escapeHtml(label)} *</span>
      <select data-photo-field="${field}">
        ${options.map((option) => `<option value="${escapeHtml(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function photoCheckbox(label, field, checked) {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <span class="featured-inline">
        <span class="switch">
          <input type="checkbox" data-photo-field="${field}" data-type="checkbox" ${checked ? "checked" : ""} />
          <span aria-hidden="true"></span>
        </span>
        <span class="star-inline" aria-hidden="true">&#9733;</span>
      </span>
    </label>
  `;
}

function renderComponentControls() {
  elements.componentControl.innerHTML = COMPONENTS.map(
    ([key, label]) => `
      <label class="switch-row">
        <span>${escapeHtml(label)}</span>
        <span class="switch">
          <input type="checkbox" data-bind="components.${key}" data-type="checkbox" ${data.components[key] ? "checked" : ""} />
          <span aria-hidden="true"></span>
        </span>
      </label>
    `
  ).join("");
}

function renderPageContentEditor() {
  const snapshotFields = data.pageContent.personalCover
    .map(
      (item, index) => `
        <div class="category-row">
          <figure>${imageMarkup(item.image, item.alt)}</figure>
          ${boundInput(`Snapshot ${index + 1} image`, `pageContent.personalCover.${index}.image`)}
          ${boundInput("Alt", `pageContent.personalCover.${index}.alt`)}
          ${boundInput("Place", `pageContent.personalCover.${index}.place`)}
          ${boundInput("Date", `pageContent.personalCover.${index}.date`)}
          <span class="small-label">Personal Cover</span>
        </div>
      `
    )
    .join("");

  elements.pageContentEditor.innerHTML = `
    ${boundInput("Header brand", "pageContent.header.brand")}
    ${boundInput("Header active", "pageContent.header.active")}
    ${boundInput("Header kicker", "pageContent.header.kicker")}
    ${boundInput("Header nav", "pageContent.header.nav", { wide: true })}
    ${boundInput("Hero title", "pageContent.hero.title")}
    ${boundInput("Page path", "pageContent.hero.pagePath")}
    ${boundTextarea("Hero description", "pageContent.hero.description", { wide: true })}
    ${boundInput("Portrait Rail label", "pageContent.portraitRail.label")}
    ${boundInput("Portrait Rail number", "pageContent.portraitRail.number")}
    ${boundInput("Archive No.", "pageContent.archiveMeta.archiveNo")}
    ${boundInput("Updated", "pageContent.archiveMeta.updated")}
    ${boundInput("Based in", "pageContent.archiveMeta.basedIn")}
    ${boundTextarea("Archive Stamp title", "pageContent.archiveStamp.title")}
    ${boundInput("Archive Stamp number", "pageContent.archiveStamp.number")}
    ${boundInput("Portrait Cover image", "pageContent.portraitCover.image", { wide: true })}
    ${boundInput("Portrait Cover alt", "pageContent.portraitCover.alt", { wide: true })}
    ${boundInput("Portrait Cover year", "pageContent.portraitCover.year")}
    ${boundInput("Portrait Cover light", "pageContent.portraitCover.light")}
    ${boundInput("Portrait Cover location", "pageContent.portraitCover.location")}
    <div class="field is-wide"><label>Personal Cover snapshots</label><div class="content-editor nested">${snapshotFields}</div></div>
    ${boundInput("Toolbar filter", "pageContent.toolbar.filter", { wide: true })}
    ${boundInput("Toolbar sort", "pageContent.toolbar.sort")}
    ${boundInput("Toolbar view", "pageContent.toolbar.view")}
    ${boundInput("Footer Archive", "pageContent.footer.archive")}
    ${boundInput("Footer Archive text", "pageContent.footer.archiveText")}
    ${boundInput("Footer Capture Life", "pageContent.footer.captureLife")}
    ${boundInput("Footer Capture text", "pageContent.footer.captureText")}
    ${boundInput("Footer Photography", "pageContent.footer.photography")}
    ${boundInput("Footer Photography text", "pageContent.footer.photographyText")}
    ${boundInput("Footer copyright", "pageContent.footer.copyright", { wide: true })}
  `;
}

function boundInput(label, path, options = {}) {
  return `
    <label class="field ${options.wide ? "is-wide" : ""}">
      <span>${escapeHtml(label)}</span>
      <input data-bind="${escapeHtml(path)}" value="${escapeHtml(getByPath(path) ?? "")}" />
    </label>
  `;
}

function boundTextarea(label, path, options = {}) {
  return `
    <label class="field ${options.wide ? "is-wide" : ""}">
      <span>${escapeHtml(label)}</span>
      <textarea class="short" data-bind="${escapeHtml(path)}">${escapeHtml(getByPath(path) ?? "")}</textarea>
    </label>
  `;
}

function renderCategoryList() {
  elements.categoryList.innerHTML = data.categories
    .map(
      (category, index) => `
        <div class="category-row">
          <figure>${imageMarkup(category.image, category.alt)}</figure>
          ${boundInput("Name", `categories.${index}.name`)}
          ${boundInput("Image", `categories.${index}.image`)}
          ${boundInput("Alt", `categories.${index}.alt`)}
          ${boundInput("Image count", `categories.${index}.imageCount`)}
          <label class="switch-row">
            <span>Visible</span>
            <span class="switch">
              <input type="checkbox" data-bind="categories.${index}.visible" data-type="checkbox" ${category.visible ? "checked" : ""} />
              <span aria-hidden="true"></span>
            </span>
          </label>
          ${boundInput("Order", `categories.${index}.order`)}
        </div>
      `
    )
    .join("");
}

function renderFeaturedList() {
  const featured = getOrderedPhotos(data.photos.filter((photo) => photo.featured));

  if (!featured.length) {
    elements.featuredList.innerHTML = `<p class="empty-state">No featured photos selected.</p>`;
    return;
  }

  elements.featuredList.innerHTML = featured
    .map(
      (photo) => `
        <div class="featured-row">
          <figure>${imageMarkup(photo.image, photo.altText)}</figure>
          <div>
            <h3>${escapeHtml(photo.title)}</h3>
            <p>${escapeHtml(photo.category)} / # ${String(photo.sortOrder).padStart(4, "0")}</p>
          </div>
          <div class="row-actions">
            <button class="small-button" type="button" data-action="move-up" data-id="${escapeHtml(photo.id)}">Up</button>
            <button class="small-button" type="button" data-action="move-down" data-id="${escapeHtml(photo.id)}">Down</button>
            <button class="danger-button" type="button" data-action="toggle-featured" data-id="${escapeHtml(photo.id)}">Remove</button>
          </div>
        </div>
      `
    )
    .join("");
}

function renderUploadQueue() {
  elements.uploadQueue.hidden = uploadJobs.length === 0;
  if (!uploadJobs.length) return;

  const done = uploadJobs.filter((job) => job.complete).length;
  const total = uploadJobs.length;
  const average = Math.round(uploadJobs.reduce((sum, job) => sum + job.progress, 0) / total);

  elements.uploadSummaryText.textContent = `Uploading ${Math.min(done + 1, total)} of ${total} files`;
  elements.uploadSummaryBar.style.width = `${average}%`;
  elements.uploadSummaryPercent.textContent = `${average}%`;
  elements.uploadItems.innerHTML = uploadJobs.map(renderUploadJob).join("");
}

function renderUploadJob(job) {
  return `
    <div class="upload-file">
      ${job.preview ? `<img src="${escapeHtml(job.preview)}" alt="" />` : `<div class="upload-placeholder">Reading</div>`}
      <div>
        <strong>${escapeHtml(job.name)}</strong>
        <small>${formatBytes(job.loaded)} / ${formatBytes(job.size)}</small>
        <div class="upload-progress"><span style="width: ${job.progress}%"></span></div>
      </div>
    </div>
  `;
}

function updateCharacterCounters() {
  document.querySelectorAll("[data-count-for]").forEach((node) => {
    const field = node.dataset.countFor;
    const photo = getPhoto(activePhotoId);
    node.textContent = String(photo ? photo[field] || "" : "").length;
  });
}

function renderAll() {
  renderComponentControls();
  renderPageContentEditor();
  renderCategoryList();
  renderFeaturedList();
  renderPhotoGrid();
  renderEditPanel();
  renderUploadQueue();
  updateDirtyState();
}

function setActivePhoto(id) {
  const photo = getPhoto(id);
  if (!photo) return;
  activePhotoId = id;
  editorBaseline = clone(photo);
  renderPhotoGrid();
  renderEditPanel();
}

function updatePhotoField(target) {
  const photo = getPhoto(activePhotoId);
  if (!photo) return;

  const field = target.dataset.photoField;
  let value = target.dataset.type === "checkbox" ? target.checked : target.value;
  if (field === "sortOrder") value = Number(value) || 0;
  photo[field] = value;

  updateCharacterCounters();
  renderPhotoGrid();
  renderFeaturedList();
  updateDirtyState();
}

function updateBoundField(target) {
  const path = target.dataset.bind;
  if (!path) return false;
  let value = target.dataset.type === "checkbox" ? target.checked : target.value;
  if (path.endsWith(".imageCount") || path.endsWith(".order")) value = Number(value) || 0;
  setByPath(path, value);
  updateDirtyState();
  return true;
}

function toggleFeatured(id) {
  const photo = getPhoto(id);
  if (!photo) return;
  photo.featured = !photo.featured;
  updateDirtyState();
  renderPhotoGrid();
  renderFeaturedList();
  if (id === activePhotoId) renderEditPanel();
}

function deletePhoto(id) {
  const photo = getPhoto(id);
  if (!photo) return;
  const shouldDelete = window.confirm(`Delete "${photo.title}" from this mock gallery?`);
  if (!shouldDelete) return;

  data.photos = data.photos.filter((item) => item.id !== id);
  selectedIds.delete(id);
  if (activePhotoId === id) {
    activePhotoId = data.photos[0] ? data.photos[0].id : "";
    editorBaseline = activePhotoId ? clone(getPhoto(activePhotoId)) : null;
  }
  updateDirtyState();
  renderPhotoGrid();
  renderFeaturedList();
  renderEditPanel();
}

function movePhoto(id, direction) {
  const visible = getFilteredPhotos();
  const index = visible.findIndex((photo) => photo.id === id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= visible.length) return;

  const current = visible[index];
  const target = visible[next];
  const currentOrder = current.sortOrder;
  current.sortOrder = target.sortOrder;
  target.sortOrder = currentOrder;
  updateDirtyState();
  renderPhotoGrid();
  renderFeaturedList();
  if (id === activePhotoId) renderEditPanel();
}

function applyBatch(action) {
  const selected = data.photos.filter((photo) => selectedIds.has(photo.id));
  if (!selected.length) return;

  if (action === "feature") {
    selected.forEach((photo) => {
      photo.featured = true;
    });
  }

  if (action === "unfeature") {
    selected.forEach((photo) => {
      photo.featured = false;
    });
  }

  if (action === "category") {
    const nextCategory = elements.batchCategory.value;
    if (!CATEGORIES.includes(nextCategory)) {
      showToast("Choose a category before applying.", true);
      return;
    }
    selected.forEach((photo) => {
      photo.category = nextCategory;
    });
    elements.batchCategory.value = "";
  }

  if (action === "delete") {
    const shouldDelete = window.confirm(`Delete ${selected.length} selected mock photos?`);
    if (!shouldDelete) return;
    data.photos = data.photos.filter((photo) => !selectedIds.has(photo.id));
    selectedIds = new Set();
    if (!getPhoto(activePhotoId)) {
      activePhotoId = data.photos[0] ? data.photos[0].id : "";
      editorBaseline = activePhotoId ? clone(getPhoto(activePhotoId)) : null;
    }
  }

  updateDirtyState();
  renderPhotoGrid();
  renderFeaturedList();
  renderEditPanel();
}

function cancelEdit() {
  if (!editorBaseline || !activePhotoId) return;
  const index = data.photos.findIndex((photo) => photo.id === activePhotoId);
  if (index < 0) return;
  data.photos[index] = clone(editorBaseline);
  updateDirtyState();
  renderPhotoGrid();
  renderFeaturedList();
  renderEditPanel();
}

function isSupportedImage(file) {
  return ALLOWED_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
}

function readImageFile(file, callback) {
  if (!isSupportedImage(file)) {
    showToast(`${file.name} is not a JPG, PNG, or WEBP image.`, true);
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.addEventListener("error", () => showToast(`Could not read ${file.name}.`, true));
  reader.readAsDataURL(file);
}

function startUploads(files) {
  const imageFiles = Array.from(files).filter(isSupportedImage);
  if (!imageFiles.length) {
    showToast("Choose JPG, PNG, or WEBP files.", true);
    return;
  }

  uploadJobs.forEach((job) => window.clearInterval(job.timer));
  uploadJobs = imageFiles.map((file) => ({
    id: makeUniqueId(file.name),
    file,
    name: file.name,
    size: file.size,
    loaded: 0,
    progress: 0,
    preview: "",
    complete: false,
    timer: null
  }));

  renderUploadQueue();

  uploadJobs.forEach((job) => {
    readImageFile(job.file, (result) => {
      job.preview = result;
      job.timer = window.setInterval(() => {
        if (job.complete) return;
        job.progress = Math.min(100, job.progress + 9 + Math.round(Math.random() * 16));
        job.loaded = Math.round((job.size * job.progress) / 100);

        if (job.progress >= 100) {
          job.complete = true;
          window.clearInterval(job.timer);
          addUploadedPhoto(job, result);
        }

        renderUploadQueue();
      }, 180);
    });
  });
}

function addUploadedPhoto(job, imageData) {
  const title = titleFromFilename(job.name);
  const sortOrder = getNextSortOrder();
  const photo = {
    id: makeUniqueId(title),
    title,
    description: "",
    category: "Personal",
    image: imageData,
    altText: title,
    featured: false,
    status: "Draft",
    sortOrder,
    year: "",
    location: "",
    date: "",
    camera: "",
    lens: "",
    aperture: "",
    shutter: "",
    iso: ""
  };

  data.photos.push(photo);
  activePhotoId = photo.id;
  editorBaseline = clone(photo);
  ui.page = Math.max(1, Math.ceil(getFilteredPhotos().length / ui.rowsPerPage));
  updateDirtyState();
  renderPhotoGrid();
  renderFeaturedList();
  renderEditPanel();
}

function cancelUploads() {
  uploadJobs.forEach((job) => window.clearInterval(job.timer));
  uploadJobs = [];
  renderUploadQueue();
}

function replaceActiveImage(file) {
  const photo = getPhoto(activePhotoId);
  if (!photo || !file) return;

  readImageFile(file, (result) => {
    photo.image = result;
    if (!photo.altText) photo.altText = photo.title;
    updateDirtyState();
    renderPhotoGrid();
    renderFeaturedList();
    renderEditPanel();
  });
}

function makeUniqueId(value) {
  const base = slugify(value || "photo");
  let candidate = base;
  let index = 1;
  const ids = new Set(data && data.photos ? data.photos.map((photo) => photo.id) : DEFAULT_DATA.photos.map((photo) => photo.id));

  while (ids.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }

  return candidate;
}

function slugify(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `photo-${Date.now()}`;
}

function titleFromFilename(name) {
  return String(name)
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getNextSortOrder() {
  return data.photos.reduce((max, photo) => Math.max(max, Number(photo.sortOrder) || 0), 0) + 1;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

document.addEventListener("input", (event) => {
  const target = event.target;

  if (target === elements.searchInput) {
    ui.search = target.value;
    ui.page = 1;
    renderPhotoGrid();
    return;
  }

  if (target.dataset.photoField) {
    updatePhotoField(target);
    return;
  }

  if (target.dataset.bind) {
    updateBoundField(target);
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;

  if (target === elements.categoryFilter) {
    ui.category = target.value;
    ui.page = 1;
    selectedIds = new Set();
    renderPhotoGrid();
    return;
  }

  if (target === elements.featuredFilter) {
    ui.featured = target.value;
    ui.page = 1;
    selectedIds = new Set();
    renderPhotoGrid();
    return;
  }

  if (target === elements.statusFilter) {
    ui.status = target.value;
    ui.page = 1;
    selectedIds = new Set();
    renderPhotoGrid();
    return;
  }

  if (target === elements.rowsPerPage) {
    ui.rowsPerPage = Number(target.value);
    ui.page = 1;
    renderPhotoGrid();
    return;
  }

  if (target === elements.selectVisible) {
    const visibleIds = getPagedPhotos().map((photo) => photo.id);
    if (target.checked) {
      visibleIds.forEach((id) => selectedIds.add(id));
    } else {
      visibleIds.forEach((id) => selectedIds.delete(id));
    }
    renderPhotoGrid();
    return;
  }

  if (target === elements.uploadInput) {
    startUploads(target.files);
    target.value = "";
    return;
  }

  if (target.dataset.replaceImage) {
    replaceActiveImage(target.files[0]);
    target.value = "";
    return;
  }

  if (target.dataset.photoField) {
    updatePhotoField(target);
    return;
  }

  if (target.dataset.bind) {
    updateBoundField(target);
  }
});

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    ui.view = viewButton.dataset.view;
    syncControls();
    renderPhotoGrid();
    return;
  }

  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    ui.page = Number(pageButton.dataset.page);
    renderPhotoGrid();
    return;
  }

  const selectBox = event.target.closest("[data-select-id]");
  if (selectBox) {
    const id = selectBox.dataset.selectId;
    if (selectBox.checked) {
      selectedIds.add(id);
    } else {
      selectedIds.delete(id);
    }
    renderPhotoGrid();
    return;
  }

  const button = event.target.closest("[data-action]");
  if (button) {
    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "save-all") {
      saveAll();
      return;
    }

    if (action === "reset-data") {
      resetData();
      return;
    }

    if (action === "cancel-upload") {
      cancelUploads();
      return;
    }

    if (action === "close-editor") {
      elements.editContent.innerHTML = `<p class="edit-empty">Select a photo card to edit details.</p>`;
      activePhotoId = "";
      renderPhotoGrid();
      return;
    }

    if (action === "cancel-edit") {
      cancelEdit();
      return;
    }

    if (action === "toggle-featured") {
      toggleFeatured(id);
      return;
    }

    if (action === "delete-photo") {
      deletePhoto(id);
      return;
    }

    if (action === "move-up") {
      movePhoto(id, -1);
      return;
    }

    if (action === "move-down") {
      movePhoto(id, 1);
      return;
    }

    if (action === "batch-feature") {
      applyBatch("feature");
      return;
    }

    if (action === "batch-unfeature") {
      applyBatch("unfeature");
      return;
    }

    if (action === "batch-category") {
      applyBatch("category");
      return;
    }

    if (action === "batch-delete") {
      applyBatch("delete");
      return;
    }
  }

  const card = event.target.closest("[data-card-id]");
  if (card) {
    setActivePhoto(card.dataset.cardId);
  }
});

window.addEventListener("beforeunload", (event) => {
  if (JSON.stringify(data) === JSON.stringify(savedData)) return;
  event.preventDefault();
  event.returnValue = "";
});

syncControls();
renderAll();
