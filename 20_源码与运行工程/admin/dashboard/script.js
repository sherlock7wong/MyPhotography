(() => {
  "use strict";

  const STORAGE_KEY = "wong.dashboard.admin.data";
  const STATUSES = ["New", "Unread", "Read"];
  const PAGE_STATUSES = ["Published", "Draft", "Hidden"];

  const MODULES = [
    ["statsCards", "Stats Cards", "Archive counts and high-level changes."],
    ["recentUploads", "Recent Uploads", "Latest archive images from frontend assets."],
    ["messagePreview", "Message Preview", "Local mock contact messages."],
    ["categorySummary", "Category Summary", "Photography collections and counts."],
    ["siteStatus", "Site Status", "Editable mock server fields only."],
    ["quickActions", "Quick Actions", "Shortcuts to existing admin sections."],
    ["footer", "Footer", "Private archive footer metadata."]
  ];

  const DEFAULT_VISIBILITY = Object.fromEntries(MODULES.map(([key]) => [key, true]));

  const ICONS = {
    Photos: '<path d="M4 5h16v14H4zM8 15l3-3 3 3 2-2 4 4M8 9h.01" />',
    Featured: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />',
    Projects: '<path d="M4 6h7l2 2h7v10H4z" />',
    Messages: '<path d="M4 6h16v12H4zM4 7l8 6 8-6" />',
    Portrait: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />',
    Landscape: '<path d="m3 17 5-7 4 5 3-4 6 6M3 20h18" />',
    "City Humanity": '<path d="M4 21V8h5v13M9 21V4h6v17M15 21v-9h5v9M6 11h1M6 15h1M11 7h1M11 11h1M17 15h1" />',
    Personal: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v16H7.5A3.5 3.5 0 0 0 4 21.5zM4 5.5v16" />'
  };

  const DEFAULT_DATA = {
    // Sources: Photography/index.html category cards and photography/script.js featured flags.
    stats: [
      { label: "Photos", value: 590, change: "From Photography category counts", tone: "up" },
      { label: "Featured", value: 7, change: "Featured mock photos", tone: "up" },
      { label: "Projects", value: 4, change: "Project cards found", tone: "flat" },
      { label: "Messages", value: 4, change: "2 unread", tone: "warn" }
    ],
    // Sources: About, Home, Project and Photography frontend image references.
    recentUploads: [
      {
        id: "about-portrait",
        fileName: "ABOUT_PORTRAIT.JPG",
        date: "May 12, 2025",
        source: "About / personal profile",
        image: "../../about/Image/about-portrait-crop.png",
        alt: "WonG profile portrait beside a window"
      },
      {
        id: "home-landscape",
        fileName: "RDP3_0876.JPG",
        date: "May 11, 2025",
        source: "Home / landscape strip",
        image: "../../Home/assets/landscape.png",
        alt: "Landscape collection preview from the homepage"
      },
      {
        id: "project-city",
        fileName: "DSCF0921.JPG",
        date: "May 10, 2025",
        source: "Projects / City Rhythm",
        image: "../../Project/assets/project-city-rhythm.png",
        alt: "City Rhythm project preview"
      },
      {
        id: "home-personal",
        fileName: "RDP3_0731.JPG",
        date: "May 9, 2025",
        source: "Home / personal collection",
        image: "../../Home/assets/personal.png",
        alt: "Personal collection table scene"
      },
      {
        id: "project-edges",
        fileName: "DSCF0887.JPG",
        date: "May 8, 2025",
        source: "Photography / Featured",
        image: "../../Project/assets/project-edges-light.png",
        alt: "Edges of Light landscape preview"
      }
    ],
    // Source: Contact form purpose. Names/emails are mock data, not real submitted messages.
    messages: [
      {
        id: "msg-collaboration",
        from: "Alex Chen",
        email: "alex@example.com",
        subject: "Collaboration Inquiry",
        excerpt: "Hi, I love your work and would like to discuss a photography collaboration.",
        time: "May 12, 2025 09:15",
        status: "New"
      },
      {
        id: "msg-submission",
        from: "Lena Park",
        email: "lena@filmjournal.com",
        subject: "Project Submission",
        excerpt: "Please find attached my portfolio for review.",
        time: "May 11, 2025 18:42",
        status: "Unread"
      },
      {
        id: "msg-print",
        from: "Tom Wu",
        email: "tom.wu@studio.co",
        subject: "Print Purchase",
        excerpt: "I'd like to inquire about a fine art print from the archive.",
        time: "May 11, 2025 11:08",
        status: "Read"
      },
      {
        id: "msg-workshop",
        from: "Yi Zhang",
        email: "yi.zhang@gmail.com",
        subject: "Workshop Question",
        excerpt: "Could you share more details about future workshops?",
        time: "May 10, 2025 16:30",
        status: "Read"
      }
    ],
    // Source: Photography/index.html category cards.
    categories: [
      { id: "portrait", name: "Portrait", count: 128 },
      { id: "landscape", name: "Landscape", count: 156 },
      { id: "city-humanity", name: "City Humanity", count: 214 },
      { id: "personal", name: "Personal", count: 92 }
    ],
    // Mock-only fields. No real WordPress, PHP, backup, storage or uptime checks are performed.
    siteStatus: {
      systemHealth: "Good",
      websiteStatus: "Online",
      lastBackup: "May 12, 2025 03:15",
      storageUsage: "18.7 GB / 100 GB",
      storagePercent: 18,
      wordpressVersion: "6.4.3",
      theme: "Wong Visual Archive 1.2.0",
      phpVersion: "8.2.12"
    },
    quickActions: true,
    componentVisibility: DEFAULT_VISIBILITY,
    selectedUploadId: "about-portrait",
    activeMessageId: "msg-collaboration",
    // Sources: frontend page sections requested by the task.
    pageOverview: [
      { id: "home", name: "Home", path: "../../Home/index.html", modules: ["Hero", "Photo Strip", "Collections", "Footer"], status: "Published", editHref: "../settings/index.html" },
      { id: "about", name: "About", path: "../../about/index.html", modules: ["Profile", "Biography", "Skills", "Experience Timeline"], status: "Published", editHref: "../profile/index.html" },
      { id: "projects", name: "Projects", path: "../../Project/index.html", modules: ["Projects Hero", "Project Cards"], status: "Published", editHref: "../../backendProject/backendProject.html" },
      { id: "photography", name: "Photography", path: "../../photography/index.html", modules: ["Hero", "Categories", "Featured", "Gallery", "Detail Panel"], status: "Published", editHref: "../gallery/index.html" },
      { id: "contact", name: "Contact", path: "../../Contact/index.html", modules: ["Contact Info", "Contact Cards", "Message Form", "Archive Status"], status: "Published", editHref: "../../backendContact/backendContact.html" }
    ]
  };

  let state = normalizeData(mergeDefaults(clone(DEFAULT_DATA), readStoredData()));
  let savedState = clone(state);
  let toastTimer = 0;

  const elements = {
    statsGrid: document.querySelector(".stats-grid"),
    recentUploads: document.getElementById("recentUploads"),
    uploadSelection: document.getElementById("uploadSelection"),
    messageRows: document.getElementById("messageRows"),
    messageDetail: document.getElementById("messageDetail"),
    categorySummary: document.getElementById("categorySummary"),
    siteStatusForm: document.getElementById("siteStatusForm"),
    componentControls: document.getElementById("componentControls"),
    pageOverviewRows: document.getElementById("pageOverviewRows"),
    unsavedBar: document.getElementById("unsavedBar"),
    statusToast: document.getElementById("statusToast"),
    toastMessage: document.querySelector("[data-toast-message]")
  };

  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("input", handleInput);
  window.addEventListener("beforeunload", handleBeforeUnload);

  renderAll();
  updateDirtyState();
  showToast("Site settings saved successfully.");

  function handleClick(event) {
    const action = event.target.closest("[data-action]");
    const uploadButton = event.target.closest("[data-upload-id]");
    const messageRow = event.target.closest("[data-message-id]");

    if (uploadButton) {
      state.selectedUploadId = uploadButton.dataset.uploadId;
      markDirty();
      renderRecentUploads();
      return;
    }

    if (messageRow && !event.target.closest("select")) {
      state.activeMessageId = messageRow.dataset.messageId;
      markDirty();
      renderMessages();
      return;
    }

    if (!action) {
      return;
    }

    const name = action.dataset.action;
    if (name === "save") {
      saveData();
    } else if (name === "reset") {
      resetData();
    } else if (name === "discard") {
      state = clone(savedState);
      renderAll();
      updateDirtyState();
      showToast("Unsaved changes discarded.");
    } else if (name === "dismiss-toast") {
      hideToast();
    }
  }

  function handleChange(event) {
    const target = event.target;

    if (target.matches("[data-component-key]")) {
      state.componentVisibility[target.dataset.componentKey] = target.checked;
      markDirty();
      renderComponentControls();
      applyComponentVisibility();
      return;
    }

    if (target.matches("[data-message-status]")) {
      const message = state.messages.find((item) => item.id === target.dataset.messageStatus);
      if (!message) return;
      message.status = STATUSES.includes(target.value) ? target.value : "Unread";
      updateMessageStats();
      markDirty();
      renderStats();
      renderMessages();
      return;
    }

    if (target.matches("[data-page-status]")) {
      const page = state.pageOverview.find((item) => item.id === target.dataset.pageStatus);
      if (!page) return;
      page.status = PAGE_STATUSES.includes(target.value) ? target.value : "Draft";
      markDirty();
      renderPageOverview();
    }
  }

  function handleInput(event) {
    const target = event.target;
    const field = target.dataset.statusField;

    if (!field) {
      return;
    }

    state.siteStatus[field] = field === "storagePercent" ? clamp(Number(target.value) || 0, 0, 100) : target.value;
    markDirty();
    renderStorageMeter();
  }

  function renderAll() {
    updateMessageStats();
    renderStats();
    renderRecentUploads();
    renderMessages();
    renderCategorySummary();
    renderSiteStatus();
    renderComponentControls();
    renderPageOverview();
    applyComponentVisibility();
  }

  function renderStats() {
    if (!elements.statsGrid) return;

    elements.statsGrid.innerHTML = state.stats
      .map(
        (stat) => `
          <article class="stat-card">
            <span class="stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[stat.label] || ICONS.Photos}</svg></span>
            <div>
              <h2>${escapeHtml(stat.label)}</h2>
              <strong>${formatNumber(stat.value)}</strong>
              <small class="${stat.tone === "flat" ? "is-muted" : ""}">${formatChange(stat)}</small>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderRecentUploads() {
    if (!elements.recentUploads) return;

    elements.recentUploads.innerHTML = state.recentUploads
      .map((upload) => {
        const active = upload.id === state.selectedUploadId;
        return `
          <button class="upload-card ${active ? "is-active" : ""}" type="button" data-upload-id="${escapeAttribute(upload.id)}" aria-pressed="${active}" aria-label="Select ${escapeAttribute(upload.fileName)}">
            <figure>
              <img src="${escapeAttribute(upload.image)}" alt="${escapeAttribute(upload.alt)}" width="180" height="220" loading="lazy" decoding="async" />
            </figure>
            <strong>${escapeHtml(upload.fileName)}</strong>
            <span>${escapeHtml(upload.date)}</span>
          </button>
        `;
      })
      .join("");

    const selected = state.recentUploads.find((upload) => upload.id === state.selectedUploadId) || state.recentUploads[0];
    if (elements.uploadSelection && selected) {
      elements.uploadSelection.textContent = `Selected: ${selected.fileName} / ${selected.source}`;
    }
  }

  function renderMessages() {
    if (!elements.messageRows) return;

    elements.messageRows.innerHTML = state.messages
      .map((message) => {
        const active = message.id === state.activeMessageId;
        return `
          <tr class="${active ? "is-active" : ""}" data-message-id="${escapeAttribute(message.id)}" tabindex="0" aria-selected="${active}">
            <td>
              <strong>${escapeHtml(message.from)}</strong>
              <span class="table-subtext">${escapeHtml(message.email)}</span>
            </td>
            <td>
              <strong>${escapeHtml(message.subject)}</strong>
              <span class="table-subtext">${escapeHtml(message.excerpt)}</span>
            </td>
            <td>${escapeHtml(splitTime(message.time).date)}<span class="table-subtext">${escapeHtml(splitTime(message.time).clock)}</span></td>
            <td>
              <label>
                <span class="sr-only">Message status</span>
                <select class="status-select" data-message-status="${escapeAttribute(message.id)}" aria-label="Status for ${escapeAttribute(message.subject)}">
                  ${STATUSES.map((status) => `<option ${status === message.status ? "selected" : ""}>${status}</option>`).join("")}
                </select>
              </label>
            </td>
          </tr>
        `;
      })
      .join("");

    renderMessageDetail();
  }

  function renderMessageDetail() {
    if (!elements.messageDetail) return;

    const message = state.messages.find((item) => item.id === state.activeMessageId) || state.messages[0];
    if (!message) {
      elements.messageDetail.textContent = "No message selected.";
      return;
    }

    elements.messageDetail.innerHTML = `
      <strong>${escapeHtml(message.subject)}</strong> from ${escapeHtml(message.from)}.
      <span>${escapeHtml(message.excerpt)}</span>
    `;
  }

  function renderCategorySummary() {
    if (!elements.categorySummary) return;

    const maxCount = Math.max(...state.categories.map((category) => Number(category.count) || 0), 1);
    elements.categorySummary.innerHTML = state.categories
      .map((category) => {
        const percent = Math.round(((Number(category.count) || 0) / maxCount) * 100);
        return `
          <div class="category-row">
            <span class="category-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[category.name] || ICONS.Photos}</svg></span>
            <h3>${escapeHtml(category.name)}</h3>
            <p>${formatNumber(category.count)} photos</p>
            <div class="progress-track" aria-label="${escapeAttribute(category.name)} progress ${percent}%">
              <span style="width: ${percent}%"></span>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderSiteStatus() {
    if (!elements.siteStatusForm) return;

    const fields = [
      ["systemHealth", "System Health", "text"],
      ["websiteStatus", "Website Status", "text"],
      ["lastBackup", "Last Backup", "text"],
      ["storageUsage", "Storage Usage", "text"],
      ["storagePercent", "Storage Percent", "number"],
      ["wordpressVersion", "WordPress Version", "text"],
      ["theme", "Theme", "text"],
      ["phpVersion", "PHP Version", "text"]
    ];

    elements.siteStatusForm.innerHTML = fields
      .map(([key, label, type]) => {
        const value = state.siteStatus[key];
        const extra = key === "storagePercent" ? ' min="0" max="100" step="1"' : "";
        return `
          <label for="status-${key}">
            <span>${escapeHtml(label)}</span>
            <input id="status-${key}" type="${type}" value="${escapeAttribute(value)}" data-status-field="${escapeAttribute(key)}"${extra} />
          </label>
          ${key === "storagePercent" ? '<div class="storage-field"><div class="storage-meter" aria-hidden="true"><span data-storage-meter></span></div></div>' : ""}
        `;
      })
      .join("");

    renderStorageMeter();
  }

  function renderStorageMeter() {
    const meter = document.querySelector("[data-storage-meter]");
    if (meter) {
      meter.style.width = `${clamp(Number(state.siteStatus.storagePercent) || 0, 0, 100)}%`;
    }
  }

  function renderComponentControls() {
    if (!elements.componentControls) return;

    elements.componentControls.innerHTML = MODULES.map(([key, label, hint]) => {
      const checked = state.componentVisibility[key] !== false;
      return `
        <label class="component-row" for="component-${escapeAttribute(key)}">
          <span>
            <strong>${escapeHtml(label)}</strong>
            <small>${escapeHtml(hint)}</small>
          </span>
          <span class="switch">
            <input id="component-${escapeAttribute(key)}" type="checkbox" data-component-key="${escapeAttribute(key)}" ${checked ? "checked" : ""} />
            <span aria-hidden="true"></span>
          </span>
        </label>
      `;
    }).join("");
  }

  function renderPageOverview() {
    if (!elements.pageOverviewRows) return;

    elements.pageOverviewRows.innerHTML = state.pageOverview
      .map(
        (page) => `
          <tr>
            <td><strong>${escapeHtml(page.name)}</strong></td>
            <td><a href="${escapeAttribute(page.path)}">${escapeHtml(pathLabel(page.path))}</a></td>
            <td>${escapeHtml(page.modules.length)}</td>
            <td>
              <label>
                <span class="sr-only">Status for ${escapeHtml(page.name)}</span>
                <select data-page-status="${escapeAttribute(page.id)}" aria-label="Status for ${escapeAttribute(page.name)}">
                  ${PAGE_STATUSES.map((status) => `<option ${status === page.status ? "selected" : ""}>${status}</option>`).join("")}
                </select>
              </label>
            </td>
            <td><a class="edit-link" href="${escapeAttribute(page.editHref)}">Edit</a></td>
          </tr>
        `
      )
      .join("");
  }

  function applyComponentVisibility() {
    MODULES.forEach(([key]) => {
      document.querySelectorAll(`[data-module="${key}"]`).forEach((node) => {
        node.classList.toggle("is-hidden", state.componentVisibility[key] === false);
      });
    });
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    savedState = clone(state);
    updateDirtyState();
    showToast("Site settings saved successfully.");
  }

  function resetData() {
    localStorage.removeItem(STORAGE_KEY);
    state = normalizeData(clone(DEFAULT_DATA));
    savedState = clone(state);
    renderAll();
    updateDirtyState();
    showToast("Site settings saved successfully.");
  }

  function markDirty() {
    updateDirtyState();
  }

  function updateDirtyState() {
    const dirty = JSON.stringify(state) !== JSON.stringify(savedState);
    if (elements.unsavedBar) {
      elements.unsavedBar.hidden = !dirty;
    }
  }

  function showToast(message) {
    if (!elements.statusToast || !elements.toastMessage) return;
    window.clearTimeout(toastTimer);
    elements.toastMessage.textContent = message;
    elements.statusToast.hidden = false;
    toastTimer = window.setTimeout(hideToast, 3200);
  }

  function hideToast() {
    if (elements.statusToast) {
      elements.statusToast.hidden = true;
    }
  }

  function updateMessageStats() {
    const messageStat = state.stats.find((item) => item.label === "Messages");
    if (!messageStat) return;
    const unread = state.messages.filter((message) => message.status === "New" || message.status === "Unread").length;
    messageStat.value = state.messages.length;
    messageStat.change = `${unread} unread`;
    messageStat.tone = unread ? "warn" : "flat";
  }

  function readStoredData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
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
    next.componentVisibility = mergeDefaults(clone(DEFAULT_VISIBILITY), next.componentVisibility || {});
    next.messages = Array.isArray(next.messages) ? next.messages : clone(DEFAULT_DATA.messages);
    next.messages.forEach((message, index) => {
      message.id = message.id || `message-${index + 1}`;
      message.status = STATUSES.includes(message.status) ? message.status : "Unread";
    });
    next.pageOverview = Array.isArray(next.pageOverview) ? next.pageOverview : clone(DEFAULT_DATA.pageOverview);
    next.pageOverview.forEach((page) => {
      page.status = PAGE_STATUSES.includes(page.status) ? page.status : "Draft";
      page.modules = Array.isArray(page.modules) ? page.modules : [];
    });
    next.categories = Array.isArray(next.categories) ? next.categories : clone(DEFAULT_DATA.categories);
    next.stats = Array.isArray(next.stats) ? next.stats : clone(DEFAULT_DATA.stats);
    next.siteStatus = mergeDefaults(clone(DEFAULT_DATA.siteStatus), next.siteStatus || {});
    return next;
  }

  function formatChange(stat) {
    if (stat.tone === "up") return `+ ${stat.change}`;
    if (stat.tone === "warn") return `+ ${stat.change}`;
    return stat.change;
  }

  function splitTime(value) {
    const parts = String(value || "").split(" ");
    return {
      date: parts.slice(0, 3).join(" "),
      clock: parts.slice(3).join(" ")
    };
  }

  function pathLabel(path) {
    return String(path || "").replace("../../", "/").replace("index.html", "");
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(Number(value) || 0);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function handleBeforeUnload(event) {
    if (JSON.stringify(state) === JSON.stringify(savedState)) return;
    event.preventDefault();
    event.returnValue = "";
  }
})();
