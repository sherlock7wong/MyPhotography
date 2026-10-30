(() => {
  "use strict";

  const LEGACY_STORAGE_KEY = "wong.site.settings.admin.data";

  const COMPONENT_GROUPS = {
    global: ["Header", "Navigation", "Footer", "SEO Meta", "Open Graph Meta"],
    home: ["Hero", "Archive Meta", "Hero Stamp", "Photo Strip", "Intro Card", "Collections", "Footer"],
    about: ["About Hero", "Profile Details", "Biography", "Skills", "Experience Timeline", "JSON-LD SEO Block"],
    projects: ["Projects Hero", "Archive Meta", "Archive Stamp", "Project Exhibition", "Project Cards", "Footer"],
    photography: ["Photography Hero", "Toolbar", "Categories", "Featured", "Gallery Grid", "Detail Panel", "Footer"],
    contact: ["Contact Info", "Contact Cards", "Message Form", "Archive Status", "Film Strip", "Contact Footer", "Toast"]
  };

  const defaultVisibility = Object.fromEntries(
    Object.entries(COMPONENT_GROUPS).map(([group, items]) => [
      group,
      Object.fromEntries(items.map((item) => [item, true]))
    ])
  );

  const DEFAULT_SETTINGS = {
    // Source: Home/index.html title, meta description, og:title, og:description and og:image.
    // TODO(source-missing): No canonical link or public domain is present in the provided frontend HTML.
    seo: {
      siteTitle: "WonG Archive - Home",
      siteDescription:
        "WonG Archive, a personal photography archive exploring portraits, landscapes, city humanity, and quiet everyday moments.",
      seoTitle: "WonG Archive - Home",
      seoDescription: "A warm visual archive of light, place, people, and everyday stories by WonG.",
      ogImage: "../../Home/assets/photographer.png",
      canonicalUrl: ""
    },
    // Source: Home/index.html hero, archive metadata, intro card and first CTA.
    homeHero: {
      heroImage: "../../Home/assets/photographer.png",
      heroHeadline: "Wong Archive",
      heroIntro:
        "I explore the relationship between place and people. Natural light, honest observation, and quiet moments in between.",
      heroButtonText: "View Photography",
      heroButtonLink: "../../Home/index.html#collections",
      archiveNo: "00",
      updated: "June 2026",
      basedIn: "Shenzhen, China"
    },
    // Source: shared frontend headers, Home footer, About/Contact profile details.
    // TODO(source-difference): About uses wong.studios@proton.me; Contact uses hello@wongvisual.com. Home has no email.
    // TODO(source-difference): Home footer says 2026, About/Projects/Photography say 2025, Contact says 2020 - 2025.
    // TODO(source-missing): Site domain is not present in the provided frontend HTML.
    globalInfo: {
      brandName: "WonG",
      headerKicker: "Photographer / Visual Archive",
      siteName: "Wong Archive",
      siteDomain: "",
      copyrightText: "\u00a9 2026 WonG. All rights reserved.",
      defaultLocation: "Shenzhen, China",
      contactEmail: "hello@wongvisual.com",
      socialHandle: "@wong.visual.archive"
    },
    // Source: frontend navigation labels. URLs are normalized relative to admin/settings/index.html.
    // TODO(source-difference): Home/About/Project pages use mixed hash and relative URLs; settings keeps concrete page URLs.
    navigation: [
      { id: "nav-home", label: "Home", url: "../../Home/index.html", visible: true, sortOrder: 1 },
      { id: "nav-projects", label: "Projects", url: "../../Project/index.html", visible: true, sortOrder: 2 },
      { id: "nav-photography", label: "Photography", url: "../../photography/index.html", visible: true, sortOrder: 3 },
      { id: "nav-about", label: "About", url: "../../about/index.html", visible: true, sortOrder: 4 },
      { id: "nav-contact", label: "Contact", url: "../../Contact/index.html", visible: true, sortOrder: 5 }
    ],
    // TODO(source-missing): No frontend maintenance setting exists.
    maintenance: {
      enabled: false,
      message: ""
    },
    effects: {
      pageTransition: true,
      filmGrain: true,
      customCursor: true,
      imageHover: true,
      scrollReveal: true,
      parallax: true,
      lightbox: true,
      reducedMotionRespect: true
    },
    // Source: frontend CSS includes prefers-reduced-motion blocks and reveal animations; frontend HTML includes lazy-loaded images.
    // TODO(source-missing): No default alt fallback or high-contrast setting exists in frontend HTML.
    accessibility: {
      respectReducedMotion: true,
      enableRevealAnimations: true,
      enableLazyLoading: true,
      defaultImageAltFallback: "",
      highContrastMode: false
    },
    componentVisibility: defaultVisibility,
    preview: {
      device: "desktop"
    }
  };

  let state = mergeSettings(clone(DEFAULT_SETTINGS), readStoredSettings());
  let savedState = clone(state);
  let toastTimer = 0;

  const fields = Array.from(document.querySelectorAll("[data-bind]"));
  const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
  const tabPanels = Array.from(document.querySelectorAll("[data-panel]"));
  const unsavedBar = document.getElementById("unsavedBar");
  const statusToast = document.getElementById("statusToast");
  const toastMessage = statusToast?.querySelector("[data-toast-message]");
  const navigationList = document.getElementById("navigationList");
  const componentControl = document.getElementById("componentControl");
  const homepagePreview = document.getElementById("homepagePreview");
  const seoSearchPreview = document.getElementById("seoSearchPreview");
  const ogPreview = document.getElementById("ogPreview");
  const ogImageThumb = document.getElementById("ogImageThumb");
  const ogImageEmpty = document.getElementById("ogImageEmpty");
  const heroImageThumb = document.getElementById("heroImageThumb");

  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleChange);
  document.addEventListener("click", handleClick);

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });

  renderAll();
  updateDirtyState();

  function handleInput(event) {
    const target = event.target;
    const bindPath = target?.dataset?.bind;

    if (!bindPath || target.type === "checkbox") {
      return;
    }

    setPath(state, bindPath, target.value);
    markDirty();
    renderDependentViews();
  }

  function handleChange(event) {
    const target = event.target;

    if (target?.dataset?.bind && target.type === "checkbox") {
      setPath(state, target.dataset.bind, target.checked);
      markDirty();
      renderDependentViews();
      return;
    }

    if (target?.dataset?.imageTarget && target.files?.[0]) {
      const file = target.files[0];
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        setPath(state, target.dataset.imageTarget, reader.result);
        target.value = "";
        markDirty();
        renderAll();
      });

      reader.readAsDataURL(file);
    }
  }

  function handleClick(event) {
    const actionElement = event.target.closest("[data-action]");
    const deviceElement = event.target.closest("[data-device]");

    if (deviceElement) {
      state.preview.device = deviceElement.dataset.device;
      markDirty();
      renderDeviceButtons();
      renderHomepagePreview();
      return;
    }

    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.action;
    const id = actionElement.dataset.id;
    const group = actionElement.dataset.group;
    const item = actionElement.dataset.item;

    if (action === "save") {
      saveSettings();
      return;
    }

    if (action === "discard") {
      state = clone(savedState);
      renderAll();
      updateDirtyState();
      showToast("Unsaved changes discarded.");
      return;
    }

    if (action === "reset") {
      resetSettingsInCms();
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      state = clone(DEFAULT_SETTINGS);
      savedState = clone(state);
      renderAll();
      updateDirtyState();
      showToast("Settings defaults restored in wong.cms.data.");
      return;
    }

    if (action === "dismiss-toast") {
      hideToast();
      return;
    }

    if (action === "add-nav") {
      addNavigationItem();
      return;
    }

    if (action === "delete-nav") {
      state.navigation = state.navigation.filter((itemData) => itemData.id !== id);
      normalizeNavigationOrder();
      markDirty();
      renderNavigation();
      renderHomepagePreview();
      return;
    }

    if (action === "move-nav-up" || action === "move-nav-down") {
      moveNavigationItem(id, action === "move-nav-up" ? -1 : 1);
      markDirty();
      renderNavigation();
      renderHomepagePreview();
      return;
    }

    if (action === "toggle-component") {
      state.componentVisibility[group][item] = !state.componentVisibility[group][item];
      markDirty();
      renderComponentControl();
      renderDependentViews();
    }
  }

  function renderAll() {
    renderFields();
    renderImages();
    renderNavigation();
    renderComponentControl();
    renderDeviceButtons();
    renderDependentViews();
  }

  function renderFields() {
    fields.forEach((field) => {
      const value = getPath(state, field.dataset.bind);

      if (field.type === "checkbox") {
        field.checked = Boolean(value);
      } else {
        field.value = value ?? "";
      }
    });
  }

  function renderImages() {
    const ogImage = state.seo.ogImage;
    const heroImage = state.homeHero.heroImage;

    if (ogImageThumb) {
      ogImageThumb.src = toAdminPath(ogImage) || "";
      ogImageThumb.alt = ogImage ? "Current Open Graph preview" : "";
      ogImageThumb.hidden = !ogImage;
    }

    if (ogImageEmpty) {
      ogImageEmpty.textContent = ogImage ? "Current OG image" : "No image uploaded";
    }

    if (heroImageThumb) {
      heroImageThumb.src = toAdminPath(heroImage) || "";
      heroImageThumb.alt = heroImage ? "Current homepage hero preview" : "";
      heroImageThumb.hidden = !heroImage;
    }
  }

  function renderNavigation() {
    if (!navigationList) {
      return;
    }

    const rows = getSortedNavigation().map((item, index, list) => {
      const visibleId = `visible-${item.id}`;
      const labelId = `label-${item.id}`;
      const urlId = `url-${item.id}`;
      const orderId = `order-${item.id}`;

      return `
        <div class="nav-row" data-nav-row="${escapeAttribute(item.id)}">
          <span class="drag-mark" aria-hidden="true">::</span>
          <label class="sr-label" for="${labelId}">
            <span class="visually-hidden">Navigation label</span>
            <input class="nav-input" id="${labelId}" type="text" value="${escapeAttribute(item.label)}" data-nav-field="label" data-id="${escapeAttribute(item.id)}" />
          </label>
          <label class="sr-label" for="${urlId}">
            <span class="visually-hidden">Navigation URL</span>
            <input class="nav-input" id="${urlId}" type="text" value="${escapeAttribute(item.url)}" data-nav-field="url" data-id="${escapeAttribute(item.id)}" />
          </label>
          <label class="visibility-toggle" for="${visibleId}">
            <input id="${visibleId}" type="checkbox" ${item.visible ? "checked" : ""} data-nav-field="visible" data-id="${escapeAttribute(item.id)}" />
            Visible
          </label>
          <label class="sr-label" for="${orderId}">
            <span class="visually-hidden">Sort order</span>
            <input class="nav-order" id="${orderId}" type="number" min="1" value="${Number(item.sortOrder) || index + 1}" data-nav-field="sortOrder" data-id="${escapeAttribute(item.id)}" />
          </label>
          <div class="row-actions" aria-label="Navigation item actions">
            <button class="action-icon" type="button" data-action="move-nav-up" data-id="${escapeAttribute(item.id)}" ${index === 0 ? "disabled" : ""} aria-label="Move ${escapeAttribute(item.label)} up">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>
            </button>
            <button class="action-icon" type="button" data-action="move-nav-down" data-id="${escapeAttribute(item.id)}" ${index === list.length - 1 ? "disabled" : ""} aria-label="Move ${escapeAttribute(item.label)} down">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <button class="action-icon is-danger" type="button" data-action="delete-nav" data-id="${escapeAttribute(item.id)}" aria-label="Delete ${escapeAttribute(item.label)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V5h6v2M9 10v8M15 10v8M7 7l1 14h8l1-14" /></svg>
            </button>
          </div>
        </div>
      `;
    });

    navigationList.innerHTML = rows.join("");

    navigationList.querySelectorAll("[data-nav-field]").forEach((input) => {
      input.addEventListener("input", handleNavigationInput);
      input.addEventListener("change", handleNavigationInput);
    });
  }

  function handleNavigationInput(event) {
    const target = event.target;
    const item = state.navigation.find((navItem) => navItem.id === target.dataset.id);

    if (!item) {
      return;
    }

    const field = target.dataset.navField;
    if (field === "visible") {
      item.visible = target.checked;
    } else if (field === "sortOrder") {
      item.sortOrder = Number(target.value) || 1;
      normalizeNavigationOrder(false);
    } else {
      item[field] = target.value;
    }

    markDirty();
    renderHomepagePreview();

    if (field === "sortOrder") {
      renderNavigation();
    }
  }

  function renderComponentControl() {
    if (!componentControl) {
      return;
    }

    componentControl.innerHTML = Object.entries(COMPONENT_GROUPS)
      .map(([group, items]) => {
        const rows = items
          .map((item) => {
            const id = `component-${group}-${slugify(item)}`;
            const checked = state.componentVisibility?.[group]?.[item] !== false;

            return `
              <label class="component-row" for="${id}">
                <span>${escapeHtml(item)}</span>
                <span class="switch">
                  <input id="${id}" type="checkbox" ${checked ? "checked" : ""} data-action="toggle-component" data-group="${escapeAttribute(group)}" data-item="${escapeAttribute(item)}" />
                  <span aria-hidden="true"></span>
                </span>
              </label>
            `;
          })
          .join("");

        return `
          <section class="component-group" aria-label="${escapeAttribute(toTitle(group))} component visibility">
            <h3>${escapeHtml(toTitle(group))}</h3>
            ${rows}
          </section>
        `;
      })
      .join("");
  }

  function renderDependentViews() {
    document.body.classList.toggle("is-high-contrast", Boolean(state.accessibility.highContrastMode));
    renderImages();
    renderHomepagePreview();
    renderSeoPreview();
    renderOgPreview();
  }

  function renderHomepagePreview() {
    if (!homepagePreview) {
      return;
    }

    const visible = state.componentVisibility;
    const global = visible.global || {};
    const home = visible.home || {};
    const navItems = getSortedNavigation().filter((item) => item.visible);
    const heroAlt = state.accessibility.defaultImageAltFallback || "Homepage hero image preview";
    const heroImage = toAdminPath(state.homeHero.heroImage);

    homepagePreview.className = `homepage-preview device-${state.preview.device || "desktop"}`;
    homepagePreview.innerHTML = `
      <div class="site-preview-shell">
        <div class="preview-hero-bg ${home.Hero === false ? "is-off" : ""}">
          ${heroImage ? `<img src="${escapeAttribute(heroImage)}" alt="${escapeAttribute(heroAlt)}" />` : ""}
        </div>
        <header class="preview-header ${global.Header === false ? "is-off" : ""}">
          <span class="preview-brand">${escapeHtml(state.globalInfo.brandName || "TODO")}</span>
          <nav class="preview-nav ${global.Navigation === false ? "is-off" : ""}" aria-label="Preview navigation">
            ${navItems.map((item) => `<a href="${escapeAttribute(toAdminPath(item.url))}">${escapeHtml(item.label)}</a>`).join("")}
          </nav>
        </header>
        <section class="preview-hero ${home.Hero === false ? "is-off" : ""}">
          <div>
            <h3>${escapeHtml(state.homeHero.heroHeadline || "TODO")}</h3>
            <p>${escapeHtml(state.homeHero.heroIntro || "")}</p>
            <a class="preview-cta" href="${escapeAttribute(state.homeHero.heroButtonLink || "#")}">
              ${escapeHtml(state.homeHero.heroButtonText || "View Site")} <span aria-hidden="true">-></span>
            </a>
          </div>
          <aside class="preview-archive-meta ${home["Archive Meta"] === false ? "is-off" : ""}" aria-label="Preview archive metadata">
            <span>Archive No.</span><span>Updated</span><span>Based in</span>
            <strong>${escapeHtml(state.homeHero.archiveNo || "")}</strong><strong>${escapeHtml(state.homeHero.updated || "")}</strong><strong>${escapeHtml(state.homeHero.basedIn || "")}</strong>
          </aside>
        </section>
        <div class="preview-stamp ${home["Hero Stamp"] === false ? "is-off" : ""}">
          Capture life,<br />stories in light.
        </div>
        <div class="preview-photo-strip ${home["Photo Strip"] === false ? "is-off" : ""}" aria-label="Preview photo strip">
          ${["../Home/assets/portrait.png", "../Home/assets/landscape.png", "../Home/assets/city-humanity.png", "../Home/assets/personal.png"]
            .map((src) => toAdminPath(src))
            .map((src) => `<figure><img src="${src}" alt="${escapeAttribute(heroAlt)}" /></figure>`)
            .join("")}
        </div>
        <div class="preview-intro-card ${home["Intro Card"] === false ? "is-off" : ""}">
          <p>${escapeHtml(state.globalInfo.headerKicker || "")}</p>
        </div>
        <div class="preview-collections ${home.Collections === false ? "is-off" : ""}" aria-label="Preview collections">
          <span>Portrait</span><span>Landscape</span><span>City Humanity</span><span>Personal</span>
        </div>
        <footer class="preview-footer ${global.Footer === false || home.Footer === false ? "is-off" : ""}">
          <p>${escapeHtml(state.globalInfo.copyrightText || "")}</p>
        </footer>
        ${
          state.maintenance.enabled
            ? `<div class="maintenance-overlay"><div><strong>Maintenance Mode</strong><p>${escapeHtml(state.maintenance.message || "This site is temporarily in maintenance mode.")}</p></div></div>`
            : ""
        }
      </div>
      <div class="module-status" aria-label="Component visibility status">
        ${Object.entries(COMPONENT_GROUPS)
          .map(([group, items]) => {
            const hiddenCount = items.filter((item) => state.componentVisibility?.[group]?.[item] === false).length;
            return `<span class="module-count"><strong>${escapeHtml(toTitle(group))}</strong>${hiddenCount} hidden / ${items.length}</span>`;
          })
          .join("")}
      </div>
    `;
  }

  function renderSeoPreview() {
    if (!seoSearchPreview) {
      return;
    }

    const disabled = state.componentVisibility.global?.["SEO Meta"] === false;
    const url = state.seo.canonicalUrl || state.globalInfo.siteDomain || "Canonical URL not set";
    seoSearchPreview.classList.toggle("is-disabled", disabled);
    seoSearchPreview.innerHTML = disabled
      ? `<p class="disabled-note">SEO Meta is hidden by Component Control.</p>`
      : `
        <h3 class="search-title">${escapeHtml(state.seo.seoTitle || state.seo.siteTitle || "TODO: SEO title")}</h3>
        <p class="search-url">${escapeHtml(url)}</p>
        <p class="search-desc">${escapeHtml(state.seo.seoDescription || state.seo.siteDescription || "")}</p>
      `;
  }

  function renderOgPreview() {
    if (!ogPreview) {
      return;
    }

    const disabled = state.componentVisibility.global?.["Open Graph Meta"] === false;
    const domain = getPreviewDomain();

    ogPreview.classList.toggle("is-disabled", disabled);
    ogPreview.innerHTML = disabled
      ? `<p class="disabled-note">Open Graph Meta is hidden by Component Control.</p>`
      : `
        <div class="og-image">
          ${
            state.seo.ogImage
              ? `<img src="${escapeAttribute(toAdminPath(state.seo.ogImage))}" alt="${escapeAttribute(state.accessibility.defaultImageAltFallback || "Open Graph image preview")}" />`
              : `<p class="empty-note">No OG image</p>`
          }
        </div>
        <div class="og-copy">
          <h3>${escapeHtml(state.seo.seoTitle || state.seo.siteTitle || "TODO: SEO title")}</h3>
          <p>${escapeHtml(state.seo.seoDescription || state.seo.siteDescription || "")}</p>
          <span class="og-domain">${escapeHtml(domain)}</span>
        </div>
      `;
  }

  function renderDeviceButtons() {
    document.querySelectorAll("[data-device]").forEach((button) => {
      const active = button.dataset.device === state.preview.device;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function activateTab(tabName) {
    tabButtons.forEach((button) => {
      const active = button.dataset.tab === tabName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });

    tabPanels.forEach((panel) => {
      const active = panel.dataset.panel === tabName;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
  }

  function saveSettings() {
    saveSettingsToCms();
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(state));
    savedState = clone(state);
    updateDirtyState();
    showToast("Settings saved successfully.");
  }

  function markDirty() {
    updateDirtyState();
  }

  function updateDirtyState() {
    const isDirty = JSON.stringify(state) !== JSON.stringify(savedState);

    if (unsavedBar) {
      unsavedBar.hidden = !isDirty;
    }
  }

  function showToast(message) {
    if (!statusToast || !toastMessage) {
      return;
    }

    window.clearTimeout(toastTimer);
    toastMessage.textContent = message;
    statusToast.hidden = false;
    toastTimer = window.setTimeout(hideToast, 3200);
  }

  function hideToast() {
    if (statusToast) {
      statusToast.hidden = true;
    }
  }

  function addNavigationItem() {
    const nextOrder = state.navigation.length + 1;
    state.navigation.push({
      id: `nav-${Date.now()}`,
      label: "New Item",
      url: "#",
      visible: true,
      sortOrder: nextOrder
    });
    markDirty();
    renderNavigation();
    renderHomepagePreview();
  }

  function moveNavigationItem(id, direction) {
    const sorted = getSortedNavigation();
    const index = sorted.findIndex((item) => item.id === id);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
      return;
    }

    const currentOrder = sorted[index].sortOrder;
    sorted[index].sortOrder = sorted[targetIndex].sortOrder;
    sorted[targetIndex].sortOrder = currentOrder;
    normalizeNavigationOrder(false);
  }

  function normalizeNavigationOrder(resequence = true) {
    const sorted = getSortedNavigation();
    if (resequence) {
      sorted.forEach((item, index) => {
        item.sortOrder = index + 1;
      });
    }
  }

  function getSortedNavigation() {
    return [...state.navigation].sort((a, b) => {
      const orderA = Number(a.sortOrder) || 0;
      const orderB = Number(b.sortOrder) || 0;
      return orderA - orderB;
    });
  }

  function getPreviewDomain() {
    const direct = state.globalInfo.siteDomain || state.seo.canonicalUrl;

    if (!direct) {
      return "Domain not set";
    }

    try {
      return new URL(direct.startsWith("http") ? direct : `https://${direct}`).hostname;
    } catch {
      return direct;
    }
  }

  function saveSettingsToCms() {
    const normalizedSettings = normalizeSettingsForCms(state);

    if (window.cmsStore?.load && window.cmsStore?.save) {
      const cmsState = window.cmsStore.load();
      cmsState.settings = mergeSettings(clone(cmsState.settings || window.defaultCmsState?.settings || DEFAULT_SETTINGS), normalizedSettings);
      window.cmsStore.save(cmsState);
      return;
    }

    try {
      const raw = localStorage.getItem("wong.cms.data");
      const cmsState = raw ? JSON.parse(raw) : {};
      cmsState.settings = mergeSettings(clone(cmsState.settings || DEFAULT_SETTINGS), normalizedSettings);
      localStorage.setItem("wong.cms.data", JSON.stringify(cmsState));
    } catch {
      // Keep the legacy save path below as a fallback if localStorage parsing fails.
    }
  }

  function resetSettingsInCms() {
    const defaults = normalizeSettingsForCms(mergeSettings(clone(window.defaultCmsState?.settings || DEFAULT_SETTINGS), DEFAULT_SETTINGS));

    if (window.cmsStore?.load && window.cmsStore?.save) {
      const cmsState = window.cmsStore.load();
      cmsState.settings = defaults;
      window.cmsStore.save(cmsState);
      return;
    }

    try {
      const raw = localStorage.getItem("wong.cms.data");
      const cmsState = raw ? JSON.parse(raw) : {};
      cmsState.settings = defaults;
      localStorage.setItem("wong.cms.data", JSON.stringify(cmsState));
    } catch {
      // No-op. Reset still updates the visible admin state.
    }
  }

  function readStoredSettings() {
    try {
      const cmsSettings = window.cmsStore?.load?.()?.settings;
      if (cmsSettings) {
        return normalizeSettingsForCms(cmsSettings);
      }
    } catch {
      // Fall through to legacy settings.
    }

    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      return raw ? normalizeSettingsForCms(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  function mergeSettings(base, stored) {
    if (!stored || typeof stored !== "object") {
      return base;
    }

    const merged = deepMerge(base, stored);
    merged.componentVisibility = deepMerge(clone(defaultVisibility), stored.componentVisibility || {});
    merged.navigation = Array.isArray(stored.navigation) ? stored.navigation : base.navigation;
    return merged;
  }

  function deepMerge(target, source) {
    Object.entries(source || {}).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        target[key] = deepMerge(target[key] && typeof target[key] === "object" ? target[key] : {}, value);
      } else {
        target[key] = value;
      }
    });

    return target;
  }

  function getPath(object, path) {
    return path.split(".").reduce((current, key) => current?.[key], object);
  }

  function setPath(object, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      return current[key];
    }, object);

    target[last] = value;
  }

  function normalizeSettingsForCms(settings) {
    const next = clone(settings || {});

    if (next.seo) {
      next.seo.ogImage = toCmsPath(next.seo.ogImage);
    }

    if (next.homeHero) {
      next.homeHero.heroImage = toCmsPath(next.homeHero.heroImage);
      next.homeHero.heroButtonLink = toCmsPath(next.homeHero.heroButtonLink);
    }

    if (Array.isArray(next.navigation)) {
      next.navigation = next.navigation.map((item) => ({
        ...item,
        url: toCmsPath(item.url)
      }));
    }

    return next;
  }

  function toCmsPath(value) {
    if (typeof value !== "string" || !value) {
      return value;
    }

    if (value.startsWith("../../")) {
      return `../${value.slice(6)}`;
    }

    return value;
  }

  function toAdminPath(value) {
    if (typeof value !== "string" || !value) {
      return value || "";
    }

    if (/^(https?:|data:|blob:|mailto:|tel:|#|\/)/i.test(value)) {
      return value;
    }

    if (value.startsWith("../../")) {
      return value;
    }

    if (value.startsWith("../")) {
      return `../${value}`;
    }

    return value;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function toTitle(value) {
    return value
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase())
      .trim();
  }

  function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
})();
