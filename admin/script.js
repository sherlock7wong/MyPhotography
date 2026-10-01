(() => {
  "use strict";

  const DATA_KEY = "wong.cms.data";
  const AUTH_KEY = "wong.cms.auth";
  const ACTIVE_VIEW_KEY = "wong.cms.activeView";
  const sharedCmsStore = window.cmsStore || null;

  // TODO(auth): Before public deployment, replace this mock credential check with
  // real backend authentication. The frontend must only submit credentials to a
  // server; accounts and passwords must be verified and stored by the backend.
  const MOCK_AUTH = {
    username: "sherlockwong",
    password: "mrwong0421"
  };

  const VIEWS = [
    ["dashboard", "Dashboard", "DB", "Visual archive administration overview.", "A00"],
    ["profile", "Profile", "PF", "Manage identity, Home/About content, timeline, and profile modules.", "A08"],
    ["projects", "Projects", "PR", "Manage photography project experiences and case studies.", "A09"],
    ["gallery", "Gallery", "GL", "Upload, organize, filter, and edit photography archive images.", "A03"],
    ["categories", "Categories", "CT", "Manage photography categories and category page content.", "A04"],
    ["contact", "Contact", "CN", "Manage contact information, inquiry form, and public contact preview.", "A05"],
    ["messages", "Messages", "MS", "View and manage messages submitted from the Contact page.", "A06"],
    ["settings", "Settings", "ST", "Manage SEO, navigation, global information, and component visibility.", "A07"]
  ];

  const VIEW_META = Object.fromEntries(
    VIEWS.map(([id, label, short, subtitle, archiveNo]) => [id, { id, label, short, subtitle, archiveNo }])
  );

  const categoriesDefault = [
    {
      id: "portrait",
      name: "Portrait",
      slug: "/photography/portrait",
      heroTitle: "",
      description: "TODO: Add category description.",
      coverImage: "../Home/assets/portrait.png",
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
      coverImage: "../Project/assets/project-edges-light.png",
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
      coverImage: "../Project/assets/project-city-rhythm.png",
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
      coverImage: "../Home/assets/personal.png",
      coverAlt: "Personal collection preview",
      photoCount: 92,
      visibility: "Public",
      status: "Published",
      sortOrder: 4,
      seoTitle: "",
      seoDescription: ""
    }
  ];

  const componentGroupsDefault = {
    global: ["Header", "Navigation", "Footer", "SEO Meta", "Open Graph Meta"],
    home: ["Hero", "Archive Meta", "Hero Stamp", "Photo Strip", "Intro Card", "Collections", "Footer"],
    about: ["About Hero", "Profile Details", "Biography", "Skills", "Experience Timeline", "JSON-LD SEO Block"],
    projects: ["Projects Hero", "Archive Meta", "Archive Stamp", "Project Exhibition", "Project Cards", "Footer"],
    photography: ["Photography Hero", "Toolbar", "Categories", "Featured", "Gallery Grid", "Detail Panel", "Footer"],
    contact: ["Contact Info", "Contact Cards", "Message Form", "Archive Status", "Film Strip", "Contact Footer", "Toast"]
  };

  const defaultComponentVisibility = Object.fromEntries(
    Object.entries(componentGroupsDefault).map(([group, items]) => [
      group,
      Object.fromEntries(items.map((item) => [item, true]))
    ])
  );

  const defaultCmsState = {
    dashboard: {
      siteStatus: "Online",
      lastBackup: "May 12, 2025 03:15",
      storageUsage: "18.7 GB / 100 GB",
      storagePercent: 18,
      quickActions: true
    },
    profile: {
      displayName: "WonG",
      role: "Photographer / Visual Archive",
      location: "Shenzhen, China",
      availability: "Open for commissioned projects and collaborations",
      shortIntro:
        "I explore the relationship between place and people. Natural light, honest observation, and quiet moments in between.",
      biography:
        "I'm WonG, a photographer and visual archivist drawn to honest moments, natural light, and the quiet poetry of everyday life.\n\nMy work moves between people and places - portraits, landscapes, and the rhythm of the city.",
      email: "wong.studios@proton.me",
      social: "",
      avatar: "../Home/assets/photographer.png",
      tags: ["Portrait", "Landscape", "City Humanity", "Personal", "Documentary", "Natural Light"],
      timeline: [
        {
          id: "timeline-2014",
          date: "2014 - 2016",
          title: "Photography Beginnings",
          place: "Shenzhen, China",
          description: "Exploring street and travel photography. Learning to see the world with a camera.",
          active: true
        },
        {
          id: "timeline-2020",
          date: "2020 - 2022",
          title: "Collaboration & Projects",
          place: "Shenzhen, China",
          description: "Collaborating with brands and creators on photo and visual campaigns.",
          active: true
        },
        {
          id: "timeline-now",
          date: "2024 - Now",
          title: "Ongoing Archive",
          place: "Shenzhen, China",
          description: "Continuing the archive, exploring new stories and visual expressions.",
          active: true
        }
      ],
      components: {
        homeHeader: true,
        homeHero: true,
        photoStrip: true,
        introCard: true,
        aboutHero: true,
        biography: true,
        skills: true,
        timeline: true
      }
    },
    projects: [
      {
        id: "project-city-rhythm",
        title: "City Rhythm",
        slug: "city-rhythm",
        theme: "Urban Documentary / City Life",
        location: "Shanghai, China",
        year: 2023,
        description: "Fragments of everyday life in the city. People, streets and the rhythm that connects them.",
        coverImage: "../Project/assets/project-city-rhythm.png",
        categoryIds: ["city-humanity"],
        isFeatured: true,
        isVisible: true,
        sortOrder: 1,
        status: "Published"
      },
      {
        id: "project-edges-light",
        title: "Edges of Light",
        slug: "edges-of-light",
        theme: "Landscape / Coastline",
        location: "Northern California, USA",
        year: 2022,
        description: "Coastlines, fog and open distance. A personal study of atmosphere and light.",
        coverImage: "../Project/assets/project-edges-light.png",
        categoryIds: ["landscape"],
        isFeatured: true,
        isVisible: true,
        sortOrder: 2,
        status: "Published"
      },
      {
        id: "project-seen-silence",
        title: "Seen in Silence",
        slug: "seen-in-silence",
        theme: "Portrait / Natural Light",
        location: "Shenzhen, China",
        year: 2021,
        description: "Intimate portraits of people I've met. Quiet moments, honest expressions.",
        coverImage: "../Project/assets/project-seen-silence.png",
        categoryIds: ["portrait"],
        isFeatured: false,
        isVisible: true,
        sortOrder: 3,
        status: "Published"
      },
      {
        id: "project-highlands",
        title: "Highlands",
        slug: "highlands",
        theme: "Landscape / Mountain Road",
        location: "Yunnan, China",
        year: 2020,
        description: "On the road in the mountains. Searching for scale, silence and light.",
        coverImage: "../Project/assets/project-highlands.png",
        categoryIds: ["landscape"],
        isFeatured: false,
        isVisible: true,
        sortOrder: 4,
        status: "Published"
      }
    ],
    gallery: [
      {
        id: "mountain-fog",
        title: "Mountain Fog",
        description: "Low clouds moved through the valley and softened the ridge line.",
        category: "Landscape",
        image: "../Project/assets/project-highlands.png",
        altText: "Mountain valley covered with soft fog",
        featured: false,
        status: "Published",
        sortOrder: 1,
        year: "2024",
        location: "Yunnan, China"
      },
      {
        id: "rainy-street",
        title: "Rainy Street",
        description: "A rainy afternoon in the city. People walk across the wet street, umbrellas and reflections.",
        category: "City Humanity",
        image: "../CityHuman/assets/rain-walk.png",
        altText: "People walking on a rainy street in the city",
        featured: true,
        status: "Published",
        sortOrder: 2,
        year: "2024",
        location: "Shanghai, China"
      },
      {
        id: "window-light",
        title: "Window Light",
        description: "A portrait held by window light. The room was quiet, and the face stayed close to shadow.",
        category: "Portrait",
        image: "../Home/assets/portrait.png",
        altText: "A quiet portrait beside a window in soft light",
        featured: false,
        status: "Published",
        sortOrder: 3,
        year: "2024",
        location: "Shenzhen, China"
      },
      {
        id: "coastline",
        title: "Coastline",
        description: "Fog cleared in the afternoon. The light was soft and the air was clean.",
        category: "Landscape",
        image: "../Project/assets/project-edges-light.png",
        altText: "A misty coastline with waves and cliffs",
        featured: false,
        status: "Published",
        sortOrder: 4,
        year: "2024",
        location: "Northern California, USA"
      },
      {
        id: "quiet-moment",
        title: "Quiet Moment",
        description: "A small still life by the window before the day began.",
        category: "Personal",
        image: "../Home/assets/personal.png",
        altText: "A quiet table scene with warm morning light",
        featured: true,
        status: "Published",
        sortOrder: 5,
        year: "2024",
        location: "Shenzhen, China"
      },
      {
        id: "old-alley",
        title: "Old Alley",
        description: "A slow walk through the old block while light settled between the buildings.",
        category: "City Humanity",
        image: "../CityHuman/assets/old-street.png",
        altText: "People walking through an old city alley",
        featured: false,
        status: "Published",
        sortOrder: 6,
        year: "2024",
        location: "Shanghai, China"
      }
    ],
    categories: categoriesDefault,
    contact: {
      page: {
        slug: "contact",
        title: "Contact",
        subtitle: "TODO: add localized contact subtitle.",
        description: "TODO: add public contact page description.",
        year: "2020 - 2025",
        location: "Shenzhen, China",
        responseTime: "Within 48 Hours",
        availability: "Open",
        currentLocation: "Shenzhen, China",
        workingDays: "Mon - Sun",
        formTitle: "Send a Message",
        formSubtitle: "TODO: add form subtitle.",
        formNote: "* All messages are mock submissions until a real backend is connected.",
        projectTypes: ["Portrait", "Commercial", "Editorial", "Personal", "Other"]
      },
      contactMethods: [
        {
          id: "contact-instagram",
          title: "Instagram",
          slug: "instagram",
          type: "instagram",
          value: "@wong.visual.archive",
          url: "https://www.instagram.com/wong.visual.archive",
          actionLabel: "View Profile",
          description: "TODO: add Instagram contact copy.",
          coverImage: "",
          isVisible: true,
          isFeatured: true,
          sortOrder: 1
        },
        {
          id: "contact-email",
          title: "Email",
          slug: "email",
          type: "email",
          value: "hello@wongvisual.com",
          url: "mailto:hello@wongvisual.com",
          actionLabel: "Send Email",
          description: "TODO: add email contact copy.",
          coverImage: "",
          isVisible: true,
          isFeatured: true,
          sortOrder: 2
        },
        {
          id: "contact-wechat",
          title: "WeChat",
          slug: "wechat",
          type: "wechat",
          value: "Wong_Visual_Archive",
          url: "",
          actionLabel: "Add WeChat",
          description: "TODO: add WeChat instructions.",
          coverImage: "../Contact/assets/wechat-qr.png",
          isVisible: true,
          isFeatured: true,
          sortOrder: 3
        }
      ],
      filmStrip: [
        "../Project/assets/project-city-rhythm.png",
        "../Project/assets/project-seen-silence.png",
        "../Home/assets/personal.png",
        "../Project/assets/project-highlands.png"
      ]
    },
    messages: [
      {
        id: "24-0512-001",
        name: "Li Chen",
        email: "lichen@example.com",
        projectType: "portrait",
        message:
          "Hi there,\n\nI'm interested in booking a portrait session for my personal brand. Could you share your availability and pricing details?",
        status: "unread",
        submittedAt: "2025-05-12T14:32:00+08:00",
        ipAddress: "123.45.67.89",
        location: "Shanghai, China",
        userAgent: "Chrome / macOS",
        internalNotes: ""
      },
      {
        id: "24-0512-002",
        name: "Emma Zhang",
        email: "emma.zhang@example.com",
        projectType: "commercial",
        message: "We are looking for a photographer to capture our upcoming product launch.",
        status: "replied",
        submittedAt: "2025-05-12T11:08:00+08:00",
        ipAddress: "103.72.14.20",
        location: "Shenzhen, China",
        userAgent: "Safari / iOS",
        internalNotes: "Sent rate card and asked for product list."
      },
      {
        id: "24-0511-004",
        name: "Sarah Lin",
        email: "sarah.lin@example.com",
        projectType: "portrait",
        message: "Do you have any prints available from your Iceland series?",
        status: "unread",
        submittedAt: "2025-05-11T16:21:00+08:00",
        ipAddress: "117.136.22.7",
        location: "Guangzhou, China",
        userAgent: "WeChat Browser / Android",
        internalNotes: ""
      },
      {
        id: "24-0508-008",
        name: "Anna Liu",
        email: "anna.liu@example.com",
        projectType: "editorial",
        message: "Could we license two images from the city archive for an editorial feature?",
        status: "unread",
        submittedAt: "2025-05-08T15:28:00+08:00",
        ipAddress: "61.144.39.80",
        location: "Shenzhen, China",
        userAgent: "Chrome / macOS",
        internalNotes: ""
      },
      {
        id: "24-0507-011",
        name: "Oliver Chen",
        email: "oliver.chen@example.com",
        projectType: "event",
        message: "Can you cover a private gallery opening next month? The event is small, around 60 people.",
        status: "unread",
        submittedAt: "2025-05-07T13:09:00+08:00",
        ipAddress: "116.25.75.92",
        location: "Guangzhou, China",
        userAgent: "Chrome / Windows",
        internalNotes: ""
      }
    ],
    settings: {
      seo: {
        siteTitle: "WonG Archive - Home",
        siteDescription:
          "WonG Archive, a personal photography archive exploring portraits, landscapes, city humanity, and quiet everyday moments.",
        seoTitle: "WonG Archive - Home",
        seoDescription: "A warm visual archive of light, place, people, and everyday stories by WonG.",
        ogImage: "../Home/assets/photographer.png",
        canonicalUrl: ""
      },
      homeHero: {
        heroImage: "../Home/assets/photographer.png",
        heroHeadline: "Wong Archive",
        heroIntro:
          "I explore the relationship between place and people. Natural light, honest observation, and quiet moments in between.",
        heroButtonText: "View Photography",
        heroButtonLink: "../Home/index.html#collections",
        archiveNo: "00",
        updated: "June 2026",
        basedIn: "Shenzhen, China"
      },
      globalInfo: {
        brandName: "WonG",
        headerKicker: "Photographer / Visual Archive",
        siteName: "Wong Archive",
        siteDomain: "",
        copyrightText: "(c) 2026 WonG. All rights reserved.",
        defaultLocation: "Shenzhen, China",
        contactEmail: "hello@wongvisual.com",
        socialHandle: "@wong.visual.archive"
      },
      navigation: [
        { id: "nav-home", label: "Home", url: "../Home/index.html", visible: true, sortOrder: 1 },
        { id: "nav-about", label: "About", url: "../about/index.html", visible: true, sortOrder: 2 },
        { id: "nav-projects", label: "Projects", url: "../Project/index.html", visible: true, sortOrder: 3 },
        { id: "nav-photography", label: "Photography", url: "../photography/index.html", visible: true, sortOrder: 4 },
        { id: "nav-contact", label: "Contact", url: "../Contact/index.html", visible: true, sortOrder: 5 }
      ],
      maintenance: {
        enabled: false,
        message: ""
      },
      accessibility: {
        respectReducedMotion: true,
        enableRevealAnimations: true,
        enableLazyLoading: true,
        defaultImageAltFallback: "",
        highContrastMode: false
      }
    },
    componentVisibility: defaultComponentVisibility
  };

  const cmsStore = {
    load() {
      return sharedCmsStore ? sharedCmsStore.load() : loadState();
    },
    save(data) {
      if (sharedCmsStore) {
        sharedCmsStore.save(data);
        return;
      }
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    },
    reset() {
      if (sharedCmsStore) {
        return sharedCmsStore.reset();
      }
      localStorage.removeItem(DATA_KEY);
      return clone(defaultCmsState);
    },
    getPage(pageName) {
      return sharedCmsStore ? sharedCmsStore.getPage(pageName) : clone(loadState()[pageName] || {});
    },
    updatePage(pageName, payload) {
      if (sharedCmsStore) return sharedCmsStore.updatePage(pageName, payload);
      const next = loadState();
      next[pageName] = payload;
      localStorage.setItem(DATA_KEY, JSON.stringify(next));
      return next;
    },
    getPublicData() {
      return sharedCmsStore ? sharedCmsStore.getPublicData() : normalizeState(loadState());
    },
    publish() {
      return sharedCmsStore ? sharedCmsStore.publish(state) : saveState();
    },
    login(username, password) {
      return login(username, password);
    },
    logout() {
      logout();
    }
  };

  const ui = {
    activeView: "dashboard",
    projects: { search: "", status: "all", selectedId: "project-city-rhythm" },
    gallery: { search: "", category: "all", status: "all", featured: "all", selectedId: "mountain-fog", selectedIds: new Set() },
    categories: { search: "", selectedId: "portrait", selectedIds: new Set() },
    contact: { search: "", status: "all", selectedId: "contact-instagram" },
    messages: { search: "", status: "all", type: "all", selectedId: "24-0512-001", selectedIds: new Set() },
    settings: { tab: "seo" }
  };

  let state = normalizeState(cmsStore.load());
  let savedState = clone(state);
  let toastTimer = 0;
  let pendingConfirm = null;

  const elements = {
    loginScreen: document.getElementById("loginScreen"),
    loginForm: document.getElementById("loginForm"),
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),
    adminShell: document.getElementById("adminShell"),
    sidebarNav: document.getElementById("sidebarNav"),
    viewRoot: document.getElementById("viewRoot"),
    viewTitle: document.getElementById("viewTitle"),
    viewSubtitle: document.getElementById("viewSubtitle"),
    viewArchiveNo: document.getElementById("viewArchiveNo"),
    breadcrumbView: document.getElementById("breadcrumbView"),
    unsavedNotice: document.getElementById("unsavedNotice"),
    toast: document.getElementById("toast"),
    confirmModal: document.getElementById("confirmModal"),
    confirmMessage: document.getElementById("confirmMessage"),
    confirmOk: document.querySelector("[data-confirm-ok]"),
    confirmCancel: document.querySelector("[data-confirm-cancel]"),
    topUnreadBadge: document.getElementById("topUnreadBadge"),
    sidebarAvatar: document.getElementById("sidebarAvatar"),
    topAvatar: document.getElementById("topAvatar"),
    sidebarName: document.getElementById("sidebarName"),
    topName: document.getElementById("topName")
  };

  function guardAuth() {
    try {
      const raw = sessionStorage.getItem(AUTH_KEY);
      const auth = raw ? JSON.parse(raw) : null;
      return Boolean(auth && auth.username === MOCK_AUTH.username && auth.mock === true);
    } catch {
      return false;
    }
  }

  function login(username, password) {
    const ok = username === MOCK_AUTH.username && password === MOCK_AUTH.password;
    if (!ok) return false;
    sessionStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ username: MOCK_AUTH.username, mock: true, loggedInAt: new Date().toISOString() })
    );
    return true;
  }

  function logout() {
    confirmAction("Logout and clear this mock admin session?", () => {
      sessionStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(ACTIVE_VIEW_KEY);
      elements.adminShell.hidden = true;
      elements.loginScreen.hidden = false;
      elements.loginPassword.value = "";
      history.replaceState(null, "", location.pathname);
      showToast("Logged out.");
    });
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (!raw) return clone(defaultCmsState);
      return mergeDefaults(clone(defaultCmsState), JSON.parse(raw));
    } catch {
      return clone(defaultCmsState);
    }
  }

  function saveState() {
    cmsStore.save(state);
    savedState = clone(state);
    updateDirtyState();
  }

  function resetView(viewName) {
    const view = validView(viewName) ? viewName : "dashboard";
    confirmAction(`Reset ${VIEW_META[view].label} mock data to defaults?`, () => {
      if (view === "settings") {
        state.settings = clone(defaultCmsState.settings);
        state.componentVisibility = clone(defaultCmsState.componentVisibility);
      } else {
        state[view] = clone(defaultCmsState[view]);
      }
      normalizeState(state);
      saveState();
      ensureSelections();
      renderView(view);
      showToast(`${VIEW_META[view].label} reset to default mock data.`);
    });
  }

  function setActiveView(viewName) {
    if (!guardAuth()) {
      showLogin();
      return;
    }

    const nextView = validView(viewName) ? viewName : "dashboard";
    ui.activeView = nextView;
    localStorage.setItem(ACTIVE_VIEW_KEY, nextView);
    if (location.hash !== `#${nextView}`) {
      history.replaceState(null, "", `#${nextView}`);
    }
    updateSidebarActive(nextView);
    renderView(nextView);
  }

  function renderView(viewName) {
    const meta = VIEW_META[viewName] || VIEW_META.dashboard;
    elements.viewTitle.textContent = meta.label;
    elements.viewSubtitle.textContent = meta.subtitle;
    elements.viewArchiveNo.textContent = meta.archiveNo;
    elements.breadcrumbView.textContent = meta.id;

    if (viewName === "dashboard") renderDashboard();
    if (viewName === "profile") renderProfile();
    if (viewName === "projects") renderProjects();
    if (viewName === "gallery") renderGallery();
    if (viewName === "categories") renderCategories();
    if (viewName === "contact") renderContact();
    if (viewName === "messages") renderMessages();
    if (viewName === "settings") renderSettings();

    updateSharedChrome();
    updateDirtyState();
  }

  function updateSidebarActive(viewName) {
    document.querySelectorAll("[data-view-link]").forEach((link) => {
      const active = link.dataset.viewLink === viewName;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 2600);
  }

  function confirmAction(message, callback) {
    pendingConfirm = callback;
    elements.confirmMessage.textContent = message;
    elements.confirmModal.hidden = false;
    elements.confirmOk.focus();
  }

  function renderDashboard() {
    const stats = getStats();
    elements.viewRoot.innerHTML = `
      <section class="stats-grid">
        ${stats.map((item) => statCard(item.label, item.value, item.note, item.short)).join("")}
      </section>
      <section class="triple-grid">
        <article class="panel">
          <div class="panel-heading"><div><h2>Recent Uploads</h2><p>Latest mock gallery records.</p></div></div>
          <div class="panel-body">${state.gallery.slice(0, 5).map((photo) => mediaLine(photo.image, photo.title, `${photo.category} / ${photo.status}`)).join("")}</div>
        </article>
        <article class="panel">
          <div class="panel-heading"><div><h2>Messages Preview</h2><p>${getUnreadCount()} unread messages.</p></div></div>
          <div class="panel-body">${state.messages.slice(0, 5).map((message) => messageLine(message)).join("")}</div>
        </article>
        <article class="panel">
          <div class="panel-heading"><div><h2>Site Status</h2><p>Mock operational status.</p></div></div>
          <div class="panel-body">
            <dl class="meta-list">
              <div><dt>Status</dt><dd>${escapeHtml(state.dashboard.siteStatus)}</dd></div>
              <div><dt>Last Backup</dt><dd>${escapeHtml(state.dashboard.lastBackup)}</dd></div>
              <div><dt>Storage</dt><dd>${escapeHtml(state.dashboard.storageUsage)}</dd></div>
            </dl>
            <div class="progress-track"><span style="width:${clamp(state.dashboard.storagePercent, 0, 100)}%"></span></div>
            <div class="dense-grid">
              ${VIEWS.filter(([id]) => id !== "dashboard").slice(0, 4).map(([id, label]) => `<button class="secondary-button" type="button" data-view-jump="${id}">${label}</button>`).join("")}
            </div>
          </div>
        </article>
      </section>
      <section class="split-grid">
        <article class="panel">
          <div class="panel-heading"><div><h2>Category Statistics</h2><p>Photo counts from unified state.</p></div></div>
          <div class="panel-body">${state.categories.map(categoryStat).join("")}</div>
        </article>
        <article class="panel">
          <div class="panel-heading"><div><h2>Quick Actions</h2><p>Open modules without page navigation.</p></div></div>
          <div class="panel-body dense-grid">
            ${VIEWS.filter(([id]) => id !== "dashboard").map(([id, label]) => `<button class="ghost-button" type="button" data-view-jump="${id}">${label}</button>`).join("")}
          </div>
        </article>
      </section>
    `;
  }

  function renderProfile() {
    const profile = state.profile;
    elements.viewRoot.innerHTML = `
      <section class="workspace-grid">
        <div class="panel">
          <div class="panel-heading">
            <div><h2>Profile Content</h2><p>Home/About identity and timeline data.</p></div>
            <label class="secondary-button">Change Avatar <input class="sr-only" type="file" accept="image/*" data-file-bind="profile.avatar" /></label>
          </div>
          <div class="panel-body">
            <div class="split-grid">
              <figure class="avatar-preview"><img src="${escapeAttr(profile.avatar)}" alt="${escapeAttr(profile.displayName)} avatar" /></figure>
              <div class="form-grid">
                ${inputField("Display Name", "profile.displayName")}
                ${inputField("Role", "profile.role")}
                ${inputField("Location", "profile.location")}
                ${inputField("Email", "profile.email", "email")}
                ${inputField("Availability", "profile.availability", "text", true)}
                ${textareaField("Short Intro", "profile.shortIntro", true)}
                ${textareaField("Biography", "profile.biography", true)}
                ${inputField("Social", "profile.social")}
              </div>
            </div>
            <div>
              <div class="panel-heading"><h3>Tags</h3><button class="secondary-button" type="button" data-action="add-profile-tag">Add Tag</button></div>
              <ul class="tag-list">${profile.tags.map((tag, index) => `<li class="chip">${escapeHtml(tag)}<button type="button" data-action="delete-profile-tag" data-index="${index}">x</button></li>`).join("")}</ul>
            </div>
            <div>
              <div class="panel-heading"><h3>Timeline</h3><button class="secondary-button" type="button" data-action="add-timeline">Add Item</button></div>
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Title</th><th>Place</th><th>Active</th><th></th></tr></thead>
                  <tbody>${profile.timeline.map(renderTimelineRow).join("")}</tbody>
                </table>
              </div>
            </div>
            <div>
              <div class="panel-heading"><h3>Component Control</h3></div>
              <div class="component-grid">${Object.entries(profile.components).map(([key, value]) => switchBind(labelFromKey(key), `profile.components.${key}`, value)).join("")}</div>
            </div>
          </div>
        </div>
        <aside class="preview-card light-preview" id="profilePreview">${profilePreview()}</aside>
      </section>
    `;
  }

  function renderProjects() {
    ensureSelection("projects", state.projects);
    const projects = getFilteredProjects();
    const selected = getById(state.projects, ui.projects.selectedId);
    elements.viewRoot.innerHTML = `
      <section class="workspace-grid">
        <div class="panel">
          <div class="toolbar">
            <button class="primary-button" type="button" data-action="add-project">New Project</button>
            <select data-project-status><option value="all">All Status</option><option value="Published">Published</option><option value="Draft">Draft</option><option value="Hidden">Hidden</option></select>
            <label class="search-box"><input type="search" placeholder="Search projects..." value="${escapeAttr(ui.projects.search)}" data-project-search /></label>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Project</th><th>Year</th><th>Status</th><th>Visible</th><th>Actions</th></tr></thead>
              <tbody>${projects.map(renderProjectRow).join("")}</tbody>
            </table>
          </div>
          <div class="table-footer"><p>Showing ${projects.length} of ${state.projects.length} projects</p></div>
        </div>
        <aside class="panel">
          <div class="panel-heading"><div><h2>Edit Project</h2><p>Fields map to Projects page cards.</p></div></div>
          <div class="panel-body">${selected ? projectEditor(selected) : emptyState("Select or create a project.")}</div>
        </aside>
      </section>
    `;
    const status = document.querySelector("[data-project-status]");
    if (status) status.value = ui.projects.status;
  }

  function renderGallery() {
    ensureSelection("gallery", state.gallery);
    const photos = getFilteredGallery();
    const selected = getById(state.gallery, ui.gallery.selectedId);
    elements.viewRoot.innerHTML = `
      <section class="workspace-grid">
        <div class="panel">
          <div class="toolbar">
            <label class="primary-button">Upload Images<input class="sr-only" type="file" accept="image/*" multiple data-gallery-upload /></label>
            <select data-gallery-category><option value="all">All Categories</option>${categoryOptions("")}</select>
            <select data-gallery-status><option value="all">All Status</option><option>Published</option><option>Draft</option><option>Hidden</option></select>
            <select data-gallery-featured><option value="all">All Featured</option><option value="featured">Featured</option><option value="normal">Not Featured</option></select>
            <label class="search-box"><input type="search" placeholder="Search photos..." value="${escapeAttr(ui.gallery.search)}" data-gallery-search /></label>
            <button class="danger-button" type="button" data-action="delete-selected-photos">Delete Selected</button>
          </div>
          <div class="photo-grid">${photos.map(renderPhotoCard).join("") || emptyState("No photos match current filters.")}</div>
        </div>
        <aside class="panel">
          <div class="panel-heading"><div><h2>Photo Details</h2><p>Local image previews use FileReader only.</p></div></div>
          <div class="panel-body">${selected ? photoEditor(selected) : emptyState("Select a photo to edit details.")}</div>
        </aside>
      </section>
    `;
    setSelectValue("[data-gallery-category]", ui.gallery.category);
    setSelectValue("[data-gallery-status]", ui.gallery.status);
    setSelectValue("[data-gallery-featured]", ui.gallery.featured);
  }

  function renderCategories() {
    ensureSelection("categories", state.categories);
    const categories = getFilteredCategories();
    const selected = getById(state.categories, ui.categories.selectedId);
    elements.viewRoot.innerHTML = `
      <section class="workspace-grid">
        <div class="panel">
          <div class="toolbar">
            <button class="primary-button" type="button" data-action="add-category">Add Category</button>
            <select data-category-bulk><option value="">Bulk Actions</option><option value="publish">Publish</option><option value="hide">Hide</option><option value="delete">Delete</option></select>
            <button class="secondary-button" type="button" data-action="apply-category-bulk">Apply</button>
            <label class="search-box"><input type="search" placeholder="Search categories..." value="${escapeAttr(ui.categories.search)}" data-category-search /></label>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th></th><th>Order</th><th>Category</th><th>Slug</th><th>Photos</th><th>Visibility</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>${categories.map(renderCategoryRow).join("")}</tbody>
            </table>
          </div>
          <div class="table-footer"><p>Showing ${categories.length} of ${state.categories.length} categories</p></div>
        </div>
        <aside class="panel">
          <div class="panel-heading"><div><h2>Edit Category</h2><p>SEO, cover, display state, and preview.</p></div></div>
          <div class="panel-body">${selected ? categoryEditor(selected) : emptyState("Select a category to edit.")}</div>
        </aside>
      </section>
    `;
  }

  function renderContact() {
    ensureSelection("contact", state.contact.contactMethods);
    const methods = getFilteredContactMethods();
    const selected = getById(state.contact.contactMethods, ui.contact.selectedId);
    elements.viewRoot.innerHTML = `
      <section class="workspace-grid">
        <div class="panel">
          <div class="panel-heading"><div><h2>Contact Page</h2><p>Public contact copy and form configuration.</p></div></div>
          <div class="panel-body">
            <div class="form-grid">
              ${inputField("Slug", "contact.page.slug")}
              ${inputField("Title", "contact.page.title")}
              ${inputField("Subtitle", "contact.page.subtitle", "text", true)}
              ${textareaField("Description", "contact.page.description", true)}
              ${inputField("Response Time", "contact.page.responseTime")}
              ${inputField("Availability", "contact.page.availability")}
              ${inputField("Form Title", "contact.page.formTitle")}
              ${inputField("Form Subtitle", "contact.page.formSubtitle")}
              ${textareaField("Form Note", "contact.page.formNote", true)}
            </div>
            <div class="toolbar">
              <button class="primary-button" type="button" data-action="add-contact-method">New Contact</button>
              <select data-contact-status><option value="all">All status</option><option value="visible">Visible</option><option value="hidden">Hidden</option></select>
              <label class="search-box"><input type="search" placeholder="Search contact methods..." value="${escapeAttr(ui.contact.search)}" data-contact-search /></label>
            </div>
            <div class="card-grid">${methods.map(renderContactMethodCard).join("")}</div>
          </div>
        </div>
        <aside class="panel">
          <div class="panel-heading"><div><h2>Contact Method</h2><p>Instagram, Email, WeChat, QR, or link.</p></div></div>
          <div class="panel-body">${selected ? contactMethodEditor(selected) : emptyState("Select a contact item.")}${contactPreview()}</div>
        </aside>
      </section>
    `;
    setSelectValue("[data-contact-status]", ui.contact.status);
  }

  function renderMessages() {
    ensureSelection("messages", state.messages);
    const messages = getFilteredMessages();
    const selected = getById(state.messages, ui.messages.selectedId);
    elements.viewRoot.innerHTML = `
      <section class="workspace-grid">
        <div class="panel">
          <div class="toolbar">
            <button class="primary-button" type="button" data-action="add-message">Add Mock Message</button>
            <select data-message-status><option value="all">All status</option><option value="unread">Unread</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archived</option></select>
            <select data-message-type><option value="all">All types</option><option value="portrait">Portrait</option><option value="commercial">Commercial</option><option value="editorial">Editorial</option><option value="event">Event</option><option value="other">Other</option></select>
            <label class="search-box"><input type="search" placeholder="Search messages..." value="${escapeAttr(ui.messages.search)}" data-message-search /></label>
            <button class="danger-button" type="button" data-action="delete-selected-messages">Delete Selected</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th></th><th>Name</th><th>Email</th><th>Type</th><th>Message</th><th>Status</th><th>Submitted</th></tr></thead>
              <tbody>${messages.map(renderMessageRow).join("")}</tbody>
            </table>
          </div>
          <div class="table-footer"><p>Showing ${messages.length} of ${state.messages.length} messages</p></div>
        </div>
        <aside class="panel">
          <div class="panel-heading"><div><h2>Message Detail</h2><p>Read state and internal notes sync to unread badge.</p></div></div>
          <div class="panel-body">${selected ? messageDetail(selected) : emptyState("Select a message.")}</div>
        </aside>
      </section>
    `;
    setSelectValue("[data-message-status]", ui.messages.status);
    setSelectValue("[data-message-type]", ui.messages.type);
  }

  function renderSettings() {
    elements.viewRoot.innerHTML = `
      <section class="workspace-grid">
        <div class="panel">
          <div class="toolbar">
            ${["seo", "hero", "global", "navigation", "maintenance", "accessibility", "components"].map((tab) => `<button class="chip-button ${ui.settings.tab === tab ? "is-active" : ""}" type="button" data-settings-tab="${tab}">${toTitle(tab)}</button>`).join("")}
          </div>
          <div class="panel-body">${settingsTab()}</div>
        </div>
        <aside class="preview-card light-preview">${settingsPreview()}</aside>
      </section>
    `;
  }

  function inputField(label, path, type = "text", wide = false) {
    const value = getByPath(path);
    return `
      <label class="field ${wide ? "is-wide" : ""}">
        <span>${escapeHtml(label)}</span>
        <input type="${type}" value="${escapeAttr(value ?? "")}" data-bind="${escapeAttr(path)}" />
      </label>
    `;
  }

  function textareaField(label, path, wide = false) {
    const value = getByPath(path);
    return `
      <label class="field ${wide ? "is-wide" : ""}">
        <span>${escapeHtml(label)}</span>
        <textarea data-bind="${escapeAttr(path)}">${escapeHtml(value ?? "")}</textarea>
      </label>
    `;
  }

  function switchBind(label, path, checked) {
    return `
      <label class="switch-row">
        <span>${escapeHtml(label)}</span>
        <span class="switch">
          <input type="checkbox" data-bind="${escapeAttr(path)}" data-type="checkbox" ${checked ? "checked" : ""} />
          <span aria-hidden="true"></span>
        </span>
      </label>
    `;
  }

  function statCard(label, value, note, short) {
    return `
      <article class="stat-card">
        <span class="stat-icon" aria-hidden="true">${escapeHtml(short)}</span>
        <div>
          <h2>${escapeHtml(label)}</h2>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(note)}</small>
        </div>
      </article>
    `;
  }

  function mediaLine(image, title, meta) {
    return `
      <div class="title-cell">
        <figure class="thumb"><img src="${escapeAttr(image)}" alt="${escapeAttr(title)}" /></figure>
        <span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(meta)}</small></span>
      </div>
    `;
  }

  function messageLine(message) {
    return `
      <button class="ghost-button full" type="button" data-view-jump="messages">
        ${escapeHtml(message.name)} / ${escapeHtml(message.status)} / ${escapeHtml(message.projectType)}
      </button>
    `;
  }

  function categoryStat(category) {
    const max = Math.max(...state.categories.map((item) => Number(item.photoCount) || 0), 1);
    const percent = Math.round(((Number(category.photoCount) || 0) / max) * 100);
    return `
      <div>
        <div class="card-heading"><strong>${escapeHtml(category.name)}</strong><span>${escapeHtml(category.photoCount)} photos</span></div>
        <div class="progress-track"><span style="width:${percent}%"></span></div>
      </div>
    `;
  }

  function renderTimelineRow(item, index) {
    return `
      <tr>
        <td><input class="inline-input" value="${escapeAttr(item.date)}" data-bind="profile.timeline.${index}.date" /></td>
        <td><input class="inline-input" value="${escapeAttr(item.title)}" data-bind="profile.timeline.${index}.title" /></td>
        <td><input class="inline-input" value="${escapeAttr(item.place)}" data-bind="profile.timeline.${index}.place" /></td>
        <td>${switchBind("Active", `profile.timeline.${index}.active`, item.active)}</td>
        <td><button class="table-action is-danger" type="button" data-action="delete-timeline" data-index="${index}">Delete</button></td>
      </tr>
    `;
  }

  function profilePreview() {
    const p = state.profile;
    return `
      <div class="preview-heading"><h3>${escapeHtml(p.displayName)}</h3><span class="pill">${escapeHtml(p.location)}</span></div>
      <div class="preview-image"><img src="${escapeAttr(p.avatar)}" alt="${escapeAttr(p.displayName)}" /></div>
      <h4>${escapeHtml(p.role)}</h4>
      <p>${escapeHtml(p.shortIntro)}</p>
      <ul class="tag-list">${p.tags.map((tag) => `<li class="chip">${escapeHtml(tag)}</li>`).join("")}</ul>
      <dl class="meta-list">
        <div><dt>Email</dt><dd>${escapeHtml(p.email || "TODO")}</dd></div>
        <div><dt>Availability</dt><dd>${escapeHtml(p.availability || "TODO")}</dd></div>
      </dl>
    `;
  }

  function renderProjectRow(project) {
    const active = project.id === ui.projects.selectedId;
    return `
      <tr class="${active ? "is-active" : ""}" data-project-id="${escapeAttr(project.id)}">
        <td>${escapeHtml(project.sortOrder)}</td>
        <td>${mediaLine(project.coverImage, project.title, project.theme)}</td>
        <td>${escapeHtml(project.year)}</td>
        <td><span class="status-pill ${project.status.toLowerCase()}">${escapeHtml(project.status)}</span></td>
        <td>${project.isVisible ? "Yes" : "No"}</td>
        <td class="action-group">
          <button class="table-action" type="button" data-action="move-project-up" data-id="${escapeAttr(project.id)}">Up</button>
          <button class="table-action" type="button" data-action="move-project-down" data-id="${escapeAttr(project.id)}">Down</button>
          <button class="table-action is-danger" type="button" data-action="delete-project" data-id="${escapeAttr(project.id)}">Delete</button>
        </td>
      </tr>
    `;
  }

  function projectEditor(project) {
    const index = state.projects.findIndex((item) => item.id === project.id);
    return `
      <div class="form-grid">
        ${inputField("Title", `projects.${index}.title`)}
        ${inputField("Slug", `projects.${index}.slug`)}
        ${inputField("Theme", `projects.${index}.theme`, "text", true)}
        ${inputField("Location", `projects.${index}.location`)}
        ${inputField("Year", `projects.${index}.year`, "number")}
        ${inputField("Sort Order", `projects.${index}.sortOrder`, "number")}
        ${textareaField("Description", `projects.${index}.description`, true)}
        ${inputField("Cover Image", `projects.${index}.coverImage`, "text", true)}
        ${selectBind("Status", `projects.${index}.status`, ["Published", "Draft", "Hidden"])}
        ${switchBind("Visible", `projects.${index}.isVisible`, project.isVisible)}
        ${switchBind("Featured", `projects.${index}.isFeatured`, project.isFeatured)}
      </div>
      <label class="upload-box">Change cover image preview<input type="file" accept="image/*" data-file-bind="projects.${index}.coverImage" /></label>
      <div class="preview-card">${projectPreview(project)}</div>
    `;
  }

  function projectPreview(project) {
    return `
      <div class="preview-image"><img src="${escapeAttr(project.coverImage)}" alt="${escapeAttr(project.title)}" /></div>
      <h3>${escapeHtml(project.title || "Untitled Project")}</h3>
      <p>${escapeHtml(project.theme || "TODO: theme")} / ${escapeHtml(project.location || "TODO: location")} / ${escapeHtml(project.year || "Year")}</p>
      <p>${escapeHtml(project.description || "TODO: project description")}</p>
    `;
  }

  function renderPhotoCard(photo) {
    const selected = ui.gallery.selectedIds.has(photo.id);
    const active = photo.id === ui.gallery.selectedId;
    return `
      <article class="photo-card ${active ? "is-active" : ""}" data-gallery-id="${escapeAttr(photo.id)}">
        <figure><img src="${escapeAttr(photo.image)}" alt="${escapeAttr(photo.altText)}" /></figure>
        <div class="photo-card-body">
          <label class="check-row"><span>Select</span><input type="checkbox" data-photo-check="${escapeAttr(photo.id)}" ${selected ? "checked" : ""} /></label>
          <h3>${escapeHtml(photo.title)}</h3>
          <span class="pill">${escapeHtml(photo.category)}</span>
          <span class="status-pill ${photo.status.toLowerCase()}">${escapeHtml(photo.status)}</span>
        </div>
      </article>
    `;
  }

  function photoEditor(photo) {
    const index = state.gallery.findIndex((item) => item.id === photo.id);
    return `
      <div class="form-grid">
        ${inputField("Title", `gallery.${index}.title`)}
        ${selectBind("Category", `gallery.${index}.category`, categoryNames())}
        ${selectBind("Status", `gallery.${index}.status`, ["Published", "Draft", "Hidden"])}
        ${inputField("Sort Order", `gallery.${index}.sortOrder`, "number")}
        ${inputField("Year", `gallery.${index}.year`)}
        ${inputField("Location", `gallery.${index}.location`)}
        ${textareaField("Description", `gallery.${index}.description`, true)}
        ${inputField("Alt Text", `gallery.${index}.altText`, "text", true)}
        ${switchBind("Featured", `gallery.${index}.featured`, photo.featured)}
      </div>
      <label class="upload-box">Replace image locally<input type="file" accept="image/*" data-file-bind="gallery.${index}.image" /></label>
      <div class="preview-card">${photoPreview(photo)}</div>
    `;
  }

  function photoPreview(photo) {
    return `
      <div class="preview-image"><img src="${escapeAttr(photo.image)}" alt="${escapeAttr(photo.altText)}" /></div>
      <h3>${escapeHtml(photo.title)}</h3>
      <p>${escapeHtml(photo.category)} / ${escapeHtml(photo.year)} / ${escapeHtml(photo.location)}</p>
      <p>${escapeHtml(photo.description || "TODO: photo description")}</p>
    `;
  }

  function renderCategoryRow(category) {
    const active = category.id === ui.categories.selectedId;
    const checked = ui.categories.selectedIds.has(category.id);
    return `
      <tr class="${active ? "is-active" : ""}" data-category-id="${escapeAttr(category.id)}">
        <td><input type="checkbox" data-category-check="${escapeAttr(category.id)}" ${checked ? "checked" : ""} /></td>
        <td>${escapeHtml(category.sortOrder)}</td>
        <td>${mediaLine(category.coverImage, category.name || "Untitled", category.description || "TODO")}</td>
        <td>${escapeHtml(category.slug || "TODO")}</td>
        <td>${escapeHtml(category.photoCount)}</td>
        <td><span class="status-pill ${category.visibility.toLowerCase()}">${escapeHtml(category.visibility)}</span></td>
        <td><span class="status-pill ${category.status.toLowerCase()}">${escapeHtml(category.status)}</span></td>
        <td class="action-group">
          <button class="table-action" type="button" data-action="move-category-up" data-id="${escapeAttr(category.id)}">Up</button>
          <button class="table-action" type="button" data-action="move-category-down" data-id="${escapeAttr(category.id)}">Down</button>
          <button class="table-action is-danger" type="button" data-action="delete-category" data-id="${escapeAttr(category.id)}">Delete</button>
        </td>
      </tr>
    `;
  }

  function categoryEditor(category) {
    const index = state.categories.findIndex((item) => item.id === category.id);
    return `
      <div class="form-grid">
        ${inputField("Category Name", `categories.${index}.name`)}
        ${inputField("Slug", `categories.${index}.slug`)}
        ${inputField("Hero Title", `categories.${index}.heroTitle`, "text", true)}
        ${textareaField("Description", `categories.${index}.description`, true)}
        ${inputField("Cover Image", `categories.${index}.coverImage`, "text", true)}
        ${inputField("Cover Alt", `categories.${index}.coverAlt`, "text", true)}
        ${inputField("SEO Title", `categories.${index}.seoTitle`, "text", true)}
        ${textareaField("SEO Description", `categories.${index}.seoDescription`, true)}
        ${inputField("Photo Count", `categories.${index}.photoCount`, "number")}
        ${inputField("Sort Order", `categories.${index}.sortOrder`, "number")}
        ${selectBind("Visibility", `categories.${index}.visibility`, ["Public", "Hidden"])}
        ${selectBind("Status", `categories.${index}.status`, ["Published", "Draft"])}
      </div>
      <label class="upload-box">Change cover image locally<input type="file" accept="image/*" data-file-bind="categories.${index}.coverImage" /></label>
      <div class="preview-card">${categoryPreview(category)}</div>
    `;
  }

  function categoryPreview(category) {
    return `
      <div class="preview-image"><img src="${escapeAttr(category.coverImage)}" alt="${escapeAttr(category.coverAlt)}" /></div>
      <h3>${escapeHtml(category.heroTitle || category.name || "Untitled Category")}</h3>
      <p>${escapeHtml(category.description || "TODO: Add category description.")}</p>
      <p>Archive ${String(category.sortOrder).padStart(2, "0")} / ${escapeHtml(category.photoCount)} Photos</p>
      <a href="${escapeAttr(category.slug || "#")}">View on site</a>
    `;
  }

  function renderContactMethodCard(method) {
    const active = method.id === ui.contact.selectedId;
    return `
      <article class="card photo-card ${active ? "is-active" : ""}" data-contact-id="${escapeAttr(method.id)}">
        <div class="photo-card-body">
          <h3>${escapeHtml(method.title)}</h3>
          <span class="pill">${escapeHtml(method.type)}</span>
          <span class="status-pill ${method.isVisible ? "published" : "hidden"}">${method.isVisible ? "Visible" : "Hidden"}</span>
          <p>${escapeHtml(method.value || method.url || "TODO")}</p>
        </div>
      </article>
    `;
  }

  function contactMethodEditor(method) {
    const index = state.contact.contactMethods.findIndex((item) => item.id === method.id);
    return `
      <div class="form-grid">
        ${inputField("Title", `contact.contactMethods.${index}.title`)}
        ${inputField("Slug", `contact.contactMethods.${index}.slug`)}
        ${selectBind("Type", `contact.contactMethods.${index}.type`, ["instagram", "email", "wechat", "qr", "link"])}
        ${inputField("Value", `contact.contactMethods.${index}.value`, "text", true)}
        ${inputField("URL", `contact.contactMethods.${index}.url`, "text", true)}
        ${inputField("Action Label", `contact.contactMethods.${index}.actionLabel`)}
        ${textareaField("Description", `contact.contactMethods.${index}.description`, true)}
        ${inputField("Cover / QR Image", `contact.contactMethods.${index}.coverImage`, "text", true)}
        ${inputField("Sort Order", `contact.contactMethods.${index}.sortOrder`, "number")}
        ${switchBind("Visible", `contact.contactMethods.${index}.isVisible`, method.isVisible)}
        ${switchBind("Featured", `contact.contactMethods.${index}.isFeatured`, method.isFeatured)}
      </div>
      <label class="upload-box">Replace cover / QR locally<input type="file" accept="image/*" data-file-bind="contact.contactMethods.${index}.coverImage" /></label>
      <div class="row-actions"><button class="danger-button" type="button" data-action="delete-contact-method" data-id="${escapeAttr(method.id)}">Delete Contact</button></div>
    `;
  }

  function contactPreview() {
    const page = state.contact.page;
    const methods = state.contact.contactMethods.filter((item) => item.isVisible).sort(byOrder);
    return `
      <div class="preview-card contact-preview">
        <h3>${escapeHtml(page.title)}</h3>
        <p>${escapeHtml(page.subtitle)}</p>
        <p>${escapeHtml(page.description)}</p>
        <div class="card-grid">
          ${methods.map((method) => `<div><strong>${escapeHtml(method.title)}</strong><p>${escapeHtml(method.value || method.url || "TODO")}</p>${method.coverImage ? `<figure class="thumb"><img src="${escapeAttr(method.coverImage)}" alt="${escapeAttr(method.title)}" /></figure>` : ""}</div>`).join("")}
        </div>
      </div>
    `;
  }

  function renderMessageRow(message) {
    const active = message.id === ui.messages.selectedId;
    const checked = ui.messages.selectedIds.has(message.id);
    return `
      <tr class="${active ? "is-active" : ""}" data-message-id="${escapeAttr(message.id)}">
        <td><input type="checkbox" data-message-check="${escapeAttr(message.id)}" ${checked ? "checked" : ""} /></td>
        <td><strong>${escapeHtml(message.name)}</strong></td>
        <td>${escapeHtml(message.email)}</td>
        <td>${escapeHtml(message.projectType)}</td>
        <td>${escapeHtml(message.message).slice(0, 92)}${message.message.length > 92 ? "..." : ""}</td>
        <td><span class="status-pill ${escapeAttr(message.status)}">${escapeHtml(message.status)}</span></td>
        <td>${escapeHtml(formatDate(message.submittedAt))}</td>
      </tr>
    `;
  }

  function messageDetail(message) {
    const index = state.messages.findIndex((item) => item.id === message.id);
    return `
      <div class="detail-card preview-card light-preview">
        <h3>${escapeHtml(message.name)}</h3>
        <p>${escapeHtml(message.email)} / ${escapeHtml(message.projectType)} / ${escapeHtml(formatDate(message.submittedAt))}</p>
        <p>${escapeHtml(message.message)}</p>
        <dl class="meta-list">
          <div><dt>IP</dt><dd>${escapeHtml(message.ipAddress)}</dd></div>
          <div><dt>Location</dt><dd>${escapeHtml(message.location)}</dd></div>
          <div><dt>User Agent</dt><dd>${escapeHtml(message.userAgent)}</dd></div>
        </dl>
        <label class="field">
          <span>Status</span>
          <select data-bind="messages.${index}.status">
            ${["unread", "read", "replied", "archived"].map((status) => `<option ${status === message.status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </label>
        ${textareaField("Internal Notes", `messages.${index}.internalNotes`, true)}
        <div class="detail-actions">
          <button class="secondary-button" type="button" data-action="mark-message-read" data-id="${escapeAttr(message.id)}">Mark as Read</button>
          <button class="secondary-button" type="button" data-action="mark-message-replied" data-id="${escapeAttr(message.id)}">Mark as Replied</button>
          <button class="secondary-button" type="button" data-action="archive-message" data-id="${escapeAttr(message.id)}">Archive</button>
          <button class="danger-button" type="button" data-action="delete-message" data-id="${escapeAttr(message.id)}">Delete</button>
        </div>
      </div>
    `;
  }

  function settingsTab() {
    if (ui.settings.tab === "seo") {
      return `<div class="form-grid">${inputField("Site Title", "settings.seo.siteTitle")}${textareaField("Site Description", "settings.seo.siteDescription", true)}${inputField("SEO Title", "settings.seo.seoTitle")}${textareaField("SEO Description", "settings.seo.seoDescription", true)}${inputField("OG Image", "settings.seo.ogImage", "text", true)}${inputField("Canonical URL", "settings.seo.canonicalUrl", "text", true)}</div>`;
    }
    if (ui.settings.tab === "hero") {
      return `<div class="form-grid">${inputField("Hero Image", "settings.homeHero.heroImage", "text", true)}${inputField("Hero Headline", "settings.homeHero.heroHeadline")}${textareaField("Hero Intro", "settings.homeHero.heroIntro", true)}${inputField("Button Text", "settings.homeHero.heroButtonText")}${inputField("Button Link", "settings.homeHero.heroButtonLink")}${inputField("Archive No.", "settings.homeHero.archiveNo")}${inputField("Updated", "settings.homeHero.updated")}${inputField("Based In", "settings.homeHero.basedIn")}</div><label class="upload-box">Change hero image locally<input type="file" accept="image/*" data-file-bind="settings.homeHero.heroImage" /></label>`;
    }
    if (ui.settings.tab === "global") {
      return `<div class="form-grid">${inputField("Brand Name", "settings.globalInfo.brandName")}${inputField("Header Kicker", "settings.globalInfo.headerKicker")}${inputField("Site Name", "settings.globalInfo.siteName")}${inputField("Site Domain", "settings.globalInfo.siteDomain")}${inputField("Copyright Text", "settings.globalInfo.copyrightText", "text", true)}${inputField("Default Location", "settings.globalInfo.defaultLocation")}${inputField("Contact Email", "settings.globalInfo.contactEmail")}${inputField("Social Handle", "settings.globalInfo.socialHandle")}</div>`;
    }
    if (ui.settings.tab === "navigation") {
      return `<div class="panel-heading"><h3>Navigation</h3><button class="secondary-button" type="button" data-action="add-nav-item">Add Nav</button></div><div class="table-wrap"><table><thead><tr><th>Order</th><th>Label</th><th>URL</th><th>Visible</th><th></th></tr></thead><tbody>${state.settings.navigation.sort(byOrder).map(renderNavRow).join("")}</tbody></table></div>`;
    }
    if (ui.settings.tab === "maintenance") {
      return `<div class="form-grid">${switchBind("Maintenance Mode", "settings.maintenance.enabled", state.settings.maintenance.enabled)}${textareaField("Maintenance Message", "settings.maintenance.message", true)}</div>`;
    }
    if (ui.settings.tab === "accessibility") {
      return `<div class="component-grid">${Object.entries(state.settings.accessibility).map(([key, value]) => typeof value === "boolean" ? switchBind(labelFromKey(key), `settings.accessibility.${key}`, value) : inputField(labelFromKey(key), `settings.accessibility.${key}`)).join("")}</div>`;
    }
    return `<div class="component-grid">${Object.entries(state.componentVisibility).map(([group, items]) => `<div class="card panel-body"><h3>${escapeHtml(toTitle(group))}</h3>${Object.entries(items).map(([item, value]) => switchBind(item, `componentVisibility.${group}.${item}`, value)).join("")}</div>`).join("")}</div>`;
  }

  function renderNavRow(item, index) {
    const navIndex = state.settings.navigation.findIndex((nav) => nav.id === item.id);
    return `
      <tr>
        <td><input class="inline-input" type="number" value="${escapeAttr(item.sortOrder)}" data-bind="settings.navigation.${navIndex}.sortOrder" /></td>
        <td><input class="inline-input" value="${escapeAttr(item.label)}" data-bind="settings.navigation.${navIndex}.label" /></td>
        <td><input class="inline-input" value="${escapeAttr(item.url)}" data-bind="settings.navigation.${navIndex}.url" /></td>
        <td>${switchBind("Visible", `settings.navigation.${navIndex}.visible`, item.visible)}</td>
        <td class="action-group"><button class="table-action" type="button" data-action="move-nav-up" data-id="${escapeAttr(item.id)}">Up</button><button class="table-action" type="button" data-action="move-nav-down" data-id="${escapeAttr(item.id)}">Down</button><button class="table-action is-danger" type="button" data-action="delete-nav-item" data-id="${escapeAttr(item.id)}">Delete</button></td>
      </tr>
    `;
  }

  function settingsPreview() {
    const settings = state.settings;
    return `
      <div class="preview-heading"><h3>${escapeHtml(settings.seo.seoTitle || settings.seo.siteTitle)}</h3><span class="pill">SEO</span></div>
      <p>${escapeHtml(settings.seo.seoDescription || settings.seo.siteDescription)}</p>
      <div class="preview-image"><img src="${escapeAttr(settings.homeHero.heroImage || settings.seo.ogImage)}" alt="Settings preview" /></div>
      <h4>${escapeHtml(settings.homeHero.heroHeadline)}</h4>
      <p>${escapeHtml(settings.homeHero.heroIntro)}</p>
      <ul class="tag-list">${settings.navigation.filter((item) => item.visible).sort(byOrder).map((item) => `<li class="chip">${escapeHtml(item.label)}</li>`).join("")}</ul>
      ${settings.maintenance.enabled ? `<p class="status-pill draft">${escapeHtml(settings.maintenance.message || "Maintenance enabled")}</p>` : ""}
    `;
  }

  function selectBind(label, path, options) {
    const value = getByPath(path);
    return `
      <label class="field">
        <span>${escapeHtml(label)}</span>
        <select data-bind="${escapeAttr(path)}">
          ${options.map((option) => `<option value="${escapeAttr(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
        </select>
      </label>
    `;
  }

  function renderSidebar() {
    elements.sidebarNav.innerHTML = VIEWS.map(
      ([id, label, short]) => `
        <a class="nav-item" href="#${id}" data-view-link="${id}">
          <span class="nav-icon" aria-hidden="true">${escapeHtml(short)}</span>
          <span>${escapeHtml(label)}</span>
          ${id === "messages" ? `<small class="nav-badge" data-unread-badge>${getUnreadCount()}</small>` : ""}
        </a>
      `
    ).join("");
  }

  function updateSharedChrome() {
    const unread = getUnreadCount();
    elements.topUnreadBadge.textContent = String(unread);
    document.querySelectorAll("[data-unread-badge]").forEach((badge) => {
      badge.textContent = String(unread);
    });
    elements.sidebarAvatar.src = state.profile.avatar;
    elements.topAvatar.src = state.profile.avatar;
    elements.sidebarName.textContent = state.profile.displayName || "WonG";
    elements.topName.textContent = state.profile.displayName || "WonG";
  }

  function updateDirtyState() {
    elements.unsavedNotice.hidden = JSON.stringify(state) === JSON.stringify(savedState);
  }

  function markDirty() {
    updateDirtyState();
    updateSharedChrome();
  }

  function handleInput(event) {
    const target = event.target;

    if (target.dataset.projectSearch !== undefined) {
      ui.projects.search = target.value;
      renderProjects();
      return;
    }

    if (target.dataset.gallerySearch !== undefined) {
      ui.gallery.search = target.value;
      renderGallery();
      return;
    }

    if (target.dataset.categorySearch !== undefined) {
      ui.categories.search = target.value;
      renderCategories();
      return;
    }

    if (target.dataset.contactSearch !== undefined) {
      ui.contact.search = target.value;
      renderContact();
      return;
    }

    if (target.dataset.messageSearch !== undefined) {
      ui.messages.search = target.value;
      renderMessages();
      return;
    }

    const path = target.dataset.bind;
    if (!path) return;
    setByPath(path, coerceValue(target));
    normalizeState(state);
    markDirty();
    refreshActiveViewLite();
  }

  function handleChange(event) {
    const target = event.target;

    if (target.dataset.fileBind) {
      readImageFile(target.files[0], (result) => {
        setByPath(target.dataset.fileBind, result);
        normalizeState(state);
        markDirty();
        renderView(ui.activeView);
      });
      target.value = "";
      return;
    }

    if (target.dataset.galleryUpload !== undefined) {
      Array.from(target.files || []).forEach((file) => {
        readImageFile(file, (result) => {
          const title = titleFromFilename(file.name);
          state.gallery.push({
            id: makeUniqueId(state.gallery, title),
            title,
            description: "",
            category: "Personal",
            image: result,
            altText: title,
            featured: false,
            status: "Draft",
            sortOrder: state.gallery.length + 1,
            year: "",
            location: ""
          });
          ui.gallery.selectedId = state.gallery[state.gallery.length - 1].id;
          markDirty();
          renderGallery();
        });
      });
      target.value = "";
      return;
    }

    if (target.dataset.bind) {
      setByPath(target.dataset.bind, coerceValue(target));
      normalizeState(state);
      markDirty();
      refreshActiveViewLite();
      return;
    }

    if (target.dataset.projectStatus !== undefined) {
      ui.projects.status = target.value;
      renderProjects();
    }
    if (target.dataset.galleryCategory !== undefined) {
      ui.gallery.category = target.value;
      renderGallery();
    }
    if (target.dataset.galleryStatus !== undefined) {
      ui.gallery.status = target.value;
      renderGallery();
    }
    if (target.dataset.galleryFeatured !== undefined) {
      ui.gallery.featured = target.value;
      renderGallery();
    }
    if (target.dataset.contactStatus !== undefined) {
      ui.contact.status = target.value;
      renderContact();
    }
    if (target.dataset.messageStatus !== undefined) {
      ui.messages.status = target.value;
      renderMessages();
    }
    if (target.dataset.messageType !== undefined) {
      ui.messages.type = target.value;
      renderMessages();
    }
  }

  function handleClick(event) {
    const viewLink = event.target.closest("[data-view-link]");
    if (viewLink) {
      event.preventDefault();
      setActiveView(viewLink.dataset.viewLink);
      return;
    }

    const jump = event.target.closest("[data-view-jump]");
    if (jump) {
      setActiveView(jump.dataset.viewJump);
      return;
    }

    const confirmCancel = event.target.closest("[data-confirm-cancel]");
    if (confirmCancel) {
      elements.confirmModal.hidden = true;
      pendingConfirm = null;
      return;
    }

    const confirmOk = event.target.closest("[data-confirm-ok]");
    if (confirmOk) {
      const callback = pendingConfirm;
      elements.confirmModal.hidden = true;
      pendingConfirm = null;
      if (callback) callback();
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      handleAction(actionButton);
      return;
    }

    const settingsTab = event.target.closest("[data-settings-tab]");
    if (settingsTab) {
      ui.settings.tab = settingsTab.dataset.settingsTab;
      renderSettings();
      return;
    }

    const rowTarget = event.target.closest("[data-project-id], [data-gallery-id], [data-category-id], [data-contact-id], [data-message-id]");
    if (rowTarget && !event.target.closest("input, select, textarea, button, a")) {
      selectEntity(rowTarget);
    }

    const check = event.target.closest("[data-photo-check], [data-category-check], [data-message-check]");
    if (check) {
      toggleSelection(check);
    }
  }

  function handleAction(button) {
    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "save-current") {
      saveState();
      showToast(saveMessage(ui.activeView));
      return;
    }

    if (action === "reset-current") {
      resetView(ui.activeView);
      return;
    }

    if (action === "logout") {
      logout();
      return;
    }

    if (action === "add-profile-tag") {
      const tag = prompt("New tag");
      if (tag && tag.trim()) {
        state.profile.tags.push(tag.trim());
        markDirty();
        renderProfile();
      }
      return;
    }

    if (action === "delete-profile-tag") {
      state.profile.tags.splice(Number(button.dataset.index), 1);
      markDirty();
      renderProfile();
      return;
    }

    if (action === "add-timeline") {
      state.profile.timeline.push({
        id: `timeline-${Date.now()}`,
        date: "",
        title: "TODO",
        place: "",
        description: "",
        active: true
      });
      markDirty();
      renderProfile();
      return;
    }

    if (action === "delete-timeline") {
      confirmAction("Delete this timeline item?", () => {
        state.profile.timeline.splice(Number(button.dataset.index), 1);
        markDirty();
        renderProfile();
      });
      return;
    }

    if (action === "add-project") {
      const project = {
        id: `project-${Date.now()}`,
        title: "Untitled Project",
        slug: `untitled-project-${Date.now()}`,
        theme: "",
        location: "",
        year: new Date().getFullYear(),
        description: "",
        coverImage: "",
        categoryIds: [],
        isFeatured: false,
        isVisible: false,
        sortOrder: state.projects.length + 1,
        status: "Draft"
      };
      state.projects.push(project);
      ui.projects.selectedId = project.id;
      markDirty();
      renderProjects();
      return;
    }

    if (action === "delete-project") {
      confirmAction("Delete this project from mock data?", () => {
        state.projects = state.projects.filter((item) => item.id !== id);
        ui.projects.selectedId = state.projects[0]?.id || "";
        markDirty();
        renderProjects();
      });
      return;
    }

    if (action === "move-project-up" || action === "move-project-down") {
      moveItem(state.projects, id, action.endsWith("up") ? -1 : 1);
      markDirty();
      renderProjects();
      return;
    }

    if (action === "delete-selected-photos") {
      const ids = [...ui.gallery.selectedIds];
      if (!ids.length) return showToast("Select photos first.");
      confirmAction(`Delete ${ids.length} selected mock photos?`, () => {
        state.gallery = state.gallery.filter((photo) => !ui.gallery.selectedIds.has(photo.id));
        ui.gallery.selectedIds.clear();
        ui.gallery.selectedId = state.gallery[0]?.id || "";
        markDirty();
        renderGallery();
      });
      return;
    }

    if (action === "add-category") {
      const category = {
        id: `category-${Date.now()}`,
        name: "",
        slug: "",
        heroTitle: "",
        description: "",
        coverImage: "",
        coverAlt: "",
        photoCount: 0,
        visibility: "Hidden",
        status: "Draft",
        sortOrder: state.categories.length + 1,
        seoTitle: "",
        seoDescription: ""
      };
      state.categories.push(category);
      ui.categories.selectedId = category.id;
      markDirty();
      renderCategories();
      return;
    }

    if (action === "delete-category") {
      confirmAction("Delete this category from mock data?", () => {
        state.categories = state.categories.filter((item) => item.id !== id);
        ui.categories.selectedId = state.categories[0]?.id || "";
        markDirty();
        renderCategories();
      });
      return;
    }

    if (action === "move-category-up" || action === "move-category-down") {
      moveItem(state.categories, id, action.endsWith("up") ? -1 : 1);
      markDirty();
      renderCategories();
      return;
    }

    if (action === "apply-category-bulk") {
      applyCategoryBulk();
      return;
    }

    if (action === "add-contact-method") {
      const method = {
        id: `contact-${Date.now()}`,
        title: "New Contact",
        slug: `new-contact-${Date.now()}`,
        type: "link",
        value: "",
        url: "",
        actionLabel: "Open",
        description: "",
        coverImage: "",
        isVisible: false,
        isFeatured: false,
        sortOrder: state.contact.contactMethods.length + 1
      };
      state.contact.contactMethods.push(method);
      ui.contact.selectedId = method.id;
      markDirty();
      renderContact();
      return;
    }

    if (action === "delete-contact-method") {
      confirmAction("Delete this contact item from mock data?", () => {
        state.contact.contactMethods = state.contact.contactMethods.filter((item) => item.id !== id);
        ui.contact.selectedId = state.contact.contactMethods[0]?.id || "";
        markDirty();
        renderContact();
      });
      return;
    }

    if (action === "add-message") {
      const message = {
        id: `msg-${Date.now()}`,
        name: "Mock Sender",
        email: "sender@example.com",
        projectType: "other",
        message: "TODO: mock message content.",
        status: "unread",
        submittedAt: new Date().toISOString(),
        ipAddress: "0.0.0.0",
        location: "TODO",
        userAgent: "Mock Browser",
        internalNotes: ""
      };
      state.messages.unshift(message);
      ui.messages.selectedId = message.id;
      markDirty();
      renderMessages();
      return;
    }

    if (action === "delete-message") {
      confirmAction("Delete this message from mock data?", () => {
        state.messages = state.messages.filter((message) => message.id !== id);
        ui.messages.selectedId = state.messages[0]?.id || "";
        markDirty();
        renderMessages();
      });
      return;
    }

    if (action === "delete-selected-messages") {
      const ids = [...ui.messages.selectedIds];
      if (!ids.length) return showToast("Select messages first.");
      confirmAction(`Delete ${ids.length} selected mock messages?`, () => {
        state.messages = state.messages.filter((message) => !ui.messages.selectedIds.has(message.id));
        ui.messages.selectedIds.clear();
        ui.messages.selectedId = state.messages[0]?.id || "";
        markDirty();
        renderMessages();
      });
      return;
    }

    if (action === "mark-message-read" || action === "mark-message-replied" || action === "archive-message") {
      const message = getById(state.messages, id);
      if (message) {
        message.status = action === "mark-message-read" ? "read" : action === "mark-message-replied" ? "replied" : "archived";
      }
      markDirty();
      renderMessages();
      return;
    }

    if (action === "add-nav-item") {
      state.settings.navigation.push({
        id: `nav-${Date.now()}`,
        label: "New Item",
        url: "#",
        visible: true,
        sortOrder: state.settings.navigation.length + 1
      });
      markDirty();
      renderSettings();
      return;
    }

    if (action === "delete-nav-item") {
      confirmAction("Delete this navigation item?", () => {
        state.settings.navigation = state.settings.navigation.filter((item) => item.id !== id);
        resequence(state.settings.navigation);
        markDirty();
        renderSettings();
      });
      return;
    }

    if (action === "move-nav-up" || action === "move-nav-down") {
      moveItem(state.settings.navigation, id, action.endsWith("up") ? -1 : 1);
      markDirty();
      renderSettings();
    }
  }

  function refreshActiveViewLite() {
    if (ui.activeView === "dashboard") renderDashboard();
    if (ui.activeView === "profile") {
      const preview = document.getElementById("profilePreview");
      if (preview) preview.innerHTML = profilePreview();
    }
    if (ui.activeView === "messages") updateSharedChrome();
    if (ui.activeView === "settings") {
      const preview = document.querySelector(".preview-card.light-preview");
      if (preview) preview.innerHTML = settingsPreview();
    }
  }

  function selectEntity(node) {
    if (node.dataset.projectId) {
      ui.projects.selectedId = node.dataset.projectId;
      renderProjects();
    }
    if (node.dataset.galleryId) {
      ui.gallery.selectedId = node.dataset.galleryId;
      renderGallery();
    }
    if (node.dataset.categoryId) {
      ui.categories.selectedId = node.dataset.categoryId;
      renderCategories();
    }
    if (node.dataset.contactId) {
      ui.contact.selectedId = node.dataset.contactId;
      renderContact();
    }
    if (node.dataset.messageId) {
      ui.messages.selectedId = node.dataset.messageId;
      renderMessages();
    }
  }

  function toggleSelection(input) {
    const checked = input.checked;
    const id = input.dataset.photoCheck || input.dataset.categoryCheck || input.dataset.messageCheck;
    const set = input.dataset.photoCheck ? ui.gallery.selectedIds : input.dataset.categoryCheck ? ui.categories.selectedIds : ui.messages.selectedIds;
    if (checked) set.add(id);
    else set.delete(id);
  }

  function applyCategoryBulk() {
    const select = document.querySelector("[data-category-bulk]");
    const action = select?.value || "";
    const ids = [...ui.categories.selectedIds];
    if (!action) return showToast("Choose a bulk action first.");
    if (!ids.length) return showToast("Select categories first.");

    if (action === "delete") {
      confirmAction(`Delete ${ids.length} selected categories?`, () => {
        state.categories = state.categories.filter((category) => !ui.categories.selectedIds.has(category.id));
        ui.categories.selectedIds.clear();
        ui.categories.selectedId = state.categories[0]?.id || "";
        markDirty();
        renderCategories();
      });
      return;
    }

    state.categories.forEach((category) => {
      if (!ui.categories.selectedIds.has(category.id)) return;
      if (action === "publish") {
        category.status = "Published";
        category.visibility = "Public";
      }
      if (action === "hide") category.visibility = "Hidden";
    });
    markDirty();
    renderCategories();
  }

  function getFilteredProjects() {
    const search = ui.projects.search.toLowerCase().trim();
    return [...state.projects].sort(byOrder).filter((project) => {
      if (ui.projects.status !== "all" && project.status !== ui.projects.status) return false;
      return !search || [project.title, project.description, project.theme, project.slug].join(" ").toLowerCase().includes(search);
    });
  }

  function getFilteredGallery() {
    const search = ui.gallery.search.toLowerCase().trim();
    return [...state.gallery].sort(byOrder).filter((photo) => {
      if (ui.gallery.category !== "all" && photo.category !== ui.gallery.category) return false;
      if (ui.gallery.status !== "all" && photo.status !== ui.gallery.status) return false;
      if (ui.gallery.featured === "featured" && !photo.featured) return false;
      if (ui.gallery.featured === "normal" && photo.featured) return false;
      return !search || [photo.title, photo.description, photo.altText, photo.location].join(" ").toLowerCase().includes(search);
    });
  }

  function getFilteredCategories() {
    const search = ui.categories.search.toLowerCase().trim();
    return [...state.categories].sort(byOrder).filter((category) => {
      return !search || [category.name, category.description, category.slug].join(" ").toLowerCase().includes(search);
    });
  }

  function getFilteredContactMethods() {
    const search = ui.contact.search.toLowerCase().trim();
    return [...state.contact.contactMethods].sort(byOrder).filter((method) => {
      if (ui.contact.status === "visible" && !method.isVisible) return false;
      if (ui.contact.status === "hidden" && method.isVisible) return false;
      return !search || [method.title, method.value, method.url, method.description].join(" ").toLowerCase().includes(search);
    });
  }

  function getFilteredMessages() {
    const search = ui.messages.search.toLowerCase().trim();
    return [...state.messages].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).filter((message) => {
      if (ui.messages.status !== "all" && message.status !== ui.messages.status) return false;
      if (ui.messages.type !== "all" && message.projectType !== ui.messages.type) return false;
      return !search || [message.name, message.email, message.message, message.location].join(" ").toLowerCase().includes(search);
    });
  }

  function getStats() {
    return [
      { label: "Photos", value: state.gallery.length, note: `${state.gallery.filter((item) => item.status === "Published").length} published`, short: "PH" },
      { label: "Featured", value: state.gallery.filter((item) => item.featured).length, note: "Featured gallery photos", short: "FT" },
      { label: "Projects", value: state.projects.length, note: `${state.projects.filter((item) => item.isVisible).length} visible`, short: "PR" },
      { label: "Categories", value: state.categories.length, note: `${state.categories.filter((item) => item.visibility === "Public").length} public`, short: "CT" },
      { label: "Unread", value: getUnreadCount(), note: `${state.messages.length} total messages`, short: "MS" }
    ];
  }

  function getUnreadCount() {
    return state.messages.filter((message) => isUnreadStatus(message.status)).length;
  }

  function showLogin() {
    elements.loginScreen.hidden = false;
    elements.adminShell.hidden = true;
    elements.loginError.hidden = true;
  }

  function showApp() {
    elements.loginScreen.hidden = true;
    elements.adminShell.hidden = false;
  }

  function init() {
    renderSidebar();
    elements.loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const ok = cmsStore.login(elements.loginUsername.value.trim(), elements.loginPassword.value);
      elements.loginError.hidden = ok;
      if (!ok) return;
      showApp();
      setActiveView("dashboard");
      showToast("Logged in.");
    });

    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("click", handleClick);
    window.addEventListener("hashchange", () => {
      if (!guardAuth()) return showLogin();
      setActiveView(hashView() || "dashboard");
    });
    window.addEventListener("beforeunload", (event) => {
      if (JSON.stringify(state) === JSON.stringify(savedState)) return;
      event.preventDefault();
      event.returnValue = "";
    });

    if (!guardAuth()) {
      showLogin();
      return;
    }

    showApp();
    const initial = hashView() || localStorage.getItem(ACTIVE_VIEW_KEY) || "dashboard";
    setActiveView(initial);
  }

  function normalizeState(value) {
    const next = value && typeof value === "object" ? value : clone(defaultCmsState);
    next.componentVisibility = mergeDefaults(clone(defaultComponentVisibility), next.componentVisibility || {});
    next.categories = Array.isArray(next.categories) ? next.categories : clone(categoriesDefault);
    next.projects = Array.isArray(next.projects) ? next.projects : clone(defaultCmsState.projects);
    next.gallery = Array.isArray(next.gallery) ? next.gallery : clone(defaultCmsState.gallery);
    next.messages = Array.isArray(next.messages) ? next.messages.map(normalizeMessageRecord) : clone(defaultCmsState.messages);
    resequence(next.categories);
    resequence(next.projects);
    resequence(next.gallery);
    resequence(next.contact?.contactMethods || []);
    resequence(next.settings?.navigation || []);
    return next;
  }

  function normalizeMessageRecord(message) {
    const createdAt = message.createdAt || message.submittedAt || new Date().toISOString();
    return {
      ...message,
      id: message.id || `msg-${Date.now()}`,
      name: message.name || "Unknown Sender",
      email: message.email || "",
      projectType: message.projectType || "other",
      message: message.message || "",
      createdAt,
      submittedAt: message.submittedAt || createdAt,
      status: normalizeMessageStatus(message.status),
      ipAddress: message.ipAddress || "",
      location: message.location || "",
      userAgent: message.userAgent || "",
      internalNotes: message.internalNotes || ""
    };
  }

  function normalizeMessageStatus(status) {
    const lower = String(status || "unread").toLowerCase();
    if (lower === "new") return "unread";
    if (["unread", "read", "replied", "archived"].includes(lower)) return lower;
    return "unread";
  }

  function isUnreadStatus(status) {
    const lower = String(status || "").toLowerCase();
    return lower === "new" || lower === "unread";
  }

  function mergeDefaults(defaultValue, savedValue) {
    if (Array.isArray(defaultValue)) return Array.isArray(savedValue) ? savedValue : clone(defaultValue);
    if (defaultValue && typeof defaultValue === "object") {
      const merged = {};
      Object.keys(defaultValue).forEach((key) => {
        merged[key] = mergeDefaults(defaultValue[key], savedValue ? savedValue[key] : undefined);
      });
      return merged;
    }
    return savedValue === undefined || savedValue === null ? defaultValue : savedValue;
  }

  function getByPath(path) {
    return path.split(".").reduce((target, part) => (target == null ? undefined : target[part]), state);
  }

  function setByPath(path, value) {
    const parts = path.split(".");
    let target = state;
    parts.slice(0, -1).forEach((part) => {
      target = target[part];
    });
    target[parts[parts.length - 1]] = value;
  }

  function coerceValue(target) {
    if (target.dataset.type === "checkbox") return target.checked;
    if (target.type === "number") return Number(target.value) || 0;
    return target.value;
  }

  function ensureSelections() {
    ensureSelection("projects", state.projects);
    ensureSelection("gallery", state.gallery);
    ensureSelection("categories", state.categories);
    ensureSelection("contact", state.contact.contactMethods);
    ensureSelection("messages", state.messages);
  }

  function ensureSelection(type, list) {
    const key = type === "categories" ? "selectedId" : "selectedId";
    const selected = ui[type][key];
    if (!getById(list, selected)) ui[type][key] = list[0]?.id || "";
  }

  function getById(list, id) {
    return list.find((item) => item.id === id);
  }

  function validView(viewName) {
    return Boolean(VIEW_META[viewName]);
  }

  function hashView() {
    const view = location.hash.replace("#", "").trim();
    return validView(view) ? view : "";
  }

  function categoryNames() {
    return state.categories.map((category) => category.name).filter(Boolean);
  }

  function categoryOptions(selected) {
    return categoryNames().map((name) => `<option value="${escapeAttr(name)}" ${name === selected ? "selected" : ""}>${escapeHtml(name)}</option>`).join("");
  }

  function moveItem(list, id, direction) {
    const ordered = [...list].sort(byOrder);
    const index = ordered.findIndex((item) => item.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;
    const [item] = ordered.splice(index, 1);
    ordered.splice(targetIndex, 0, item);
    ordered.forEach((entry, orderIndex) => {
      entry.sortOrder = orderIndex + 1;
    });
    list.splice(0, list.length, ...ordered);
  }

  function resequence(list) {
    if (!Array.isArray(list)) return;
    [...list].sort(byOrder).forEach((item, index) => {
      if (!Number(item.sortOrder)) item.sortOrder = index + 1;
    });
  }

  function byOrder(a, b) {
    return (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0);
  }

  function readImageFile(file, callback) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.addEventListener("error", () => showToast("Could not read this image."));
    reader.readAsDataURL(file);
  }

  function makeUniqueId(list, value) {
    const base = slugify(value || "item");
    let candidate = base;
    let suffix = 1;
    const ids = new Set(list.map((item) => item.id));
    while (ids.has(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
  }

  function titleFromFilename(name) {
    return String(name)
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function saveMessage(view) {
    const messages = {
      profile: "Profile saved successfully.",
      projects: "Project saved successfully.",
      gallery: "Photo saved successfully.",
      categories: "Category updated successfully.",
      contact: "Contact settings saved successfully.",
      messages: "Message updated successfully.",
      settings: "Saved successfully.",
      dashboard: "Saved successfully."
    };
    return messages[view] || "Saved successfully.";
  }

  function emptyState(message) {
    return `<p class="empty-state">${escapeHtml(message)}</p>`;
  }

  function setSelectValue(selector, value) {
    const select = document.querySelector(selector);
    if (select) select.value = value;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "mock data";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function labelFromKey(value) {
    return String(value).replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
  }

  function toTitle(value) {
    return String(value).replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(Number(value) || 0, min), max);
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

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  init();
})();
