(function () {
  "use strict";

  const DATA_KEY = "wong.cms.data";
  const DEFAULT_IMAGE = "../Home/assets/photographer.png";

  const defaultComponentVisibility = {
    global: {
      Header: true,
      Navigation: true,
      Footer: true,
      "SEO Meta": true,
      "Open Graph Meta": true
    },
    home: {
      Hero: true,
      "Archive Meta": true,
      "Hero Stamp": true,
      "Photo Strip": true,
      "Intro Card": true,
      Collections: true,
      Footer: true
    },
    about: {
      "About Hero": true,
      "Profile Details": true,
      Biography: true,
      Skills: true,
      "Experience Timeline": true,
      "JSON-LD SEO Block": true
    },
    projects: {
      "Projects Hero": true,
      "Archive Meta": true,
      "Archive Stamp": true,
      "Project Exhibition": true,
      "Project Cards": true,
      Footer: true
    },
    photography: {
      "Photography Hero": true,
      Toolbar: true,
      Categories: true,
      Featured: true,
      "Gallery Grid": true,
      "Detail Panel": true,
      Footer: true
    },
    contact: {
      "Contact Info": true,
      "Contact Cards": true,
      "Message Form": true,
      "Archive Status": true,
      "Film Strip": true,
      "Contact Footer": true,
      Toast: true
    }
  };

  const defaultCmsState = {
    dashboard: {
      siteStatus: "Online",
      lastBackup: "Local mock only",
      storageUsage: "Local browser storage",
      storagePercent: 0,
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
    categories: [
      {
        id: "portrait",
        name: "Portrait",
        slug: "/photography/portrait",
        heroTitle: "",
        description: "Faces, expressions, and intimate light.",
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
        description: "Nature, distance, and the light of place.",
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
        description: "Streets, people, and the rhythm of the city.",
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
        description: "Diary fragments and quiet everyday details.",
        coverImage: "../Home/assets/personal.png",
        coverAlt: "Personal diary collection preview",
        photoCount: 92,
        visibility: "Public",
        status: "Published",
        sortOrder: 4,
        seoTitle: "",
        seoDescription: ""
      }
    ],
    contact: {
      page: {
        slug: "contact",
        title: "Contact",
        subtitle: "Projects / Commissions / Collaboration",
        description:
          "For photography projects, visual collaborations, licensing, or archive inquiries, send a message and I will reply after reviewing the details.",
        year: "2020 - 2025",
        location: "Shenzhen, China",
        responseTime: "Within 48 Hours",
        availability: "Open",
        currentLocation: "Shenzhen, China",
        workingDays: "Mon - Sun",
        formTitle: "Send a Message",
        formSubtitle: "Tell me what you need.",
        formNote: "* Current submissions are saved locally until a real backend is connected.",
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
          description: "Recent archive updates and behind-the-scenes photography notes.",
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
          description: "Project collaboration, commercial photography, media and licensing inquiries.",
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
          description: "Add WeChat and include a short note about the project.",
          coverImage: "../Contact/assets/wechat-qr.png",
          isVisible: true,
          isFeatured: true,
          sortOrder: 3
        }
      ],
      filmStrip: [
        "../Project/assets/project-city-rhythm.png",
        "../Project/assets/project-seen-silence.png",
        "../Project/assets/project-edges-light.png",
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
          "Hi there, I am interested in booking a portrait session for my personal brand. Could you share your availability?",
        status: "unread",
        createdAt: "2025-05-12T14:32:00+08:00",
        submittedAt: "2025-05-12T14:32:00+08:00",
        ipAddress: "0.0.0.0",
        location: "Mock",
        userAgent: "Mock Browser",
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
      pageSeo: {
        home: {},
        about: {},
        projects: {},
        photography: {},
        contact: {}
      },
      homeHero: {
        heroImage: "../Home/assets/photographer.png",
        heroHeadline: "Wong Archive",
        heroIntro:
          "I explore the relationship between place and people. Natural light, honest observation, and quiet moments in between.",
        heroButtonText: "View Photography",
        heroButtonLink: "../photography/index.html",
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
      accessibility: {
        respectReducedMotion: true,
        enableRevealAnimations: true,
        enableLazyLoading: true,
        defaultImageAltFallback: "Photography archive image",
        highContrastMode: false
      }
    },
    componentVisibility: defaultComponentVisibility
  };

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
        .replace(/[^a-z0-9]+/g, "-")
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
    next.categories = Array.isArray(next.categories) ? next.categories : [];
    next.projects = Array.isArray(next.projects) ? next.projects : [];
    next.gallery = Array.isArray(next.gallery) ? next.gallery : [];
    next.messages = Array.isArray(next.messages) ? next.messages.map(normalizeMessage) : [];
    next.contact.contactMethods = Array.isArray(next.contact.contactMethods) ? next.contact.contactMethods : [];
    next.contact.page.projectTypes = Array.isArray(next.contact.page.projectTypes) ? next.contact.page.projectTypes : [];
    return next;
  }

  function isVisibleStatus(value) {
    const normalized = String(value || "").toLowerCase();
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
    const categoryMap = new Map(categories.map((category) => [slugify(category.name || category.id), category]));
    const gallery = state.gallery
      .filter((photo) => isVisibleStatus(photo.status))
      .sort(byOrder)
      .map((photo) => {
        const categoryId = slugify(photo.category);
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
        coverImage: project.coverImage || DEFAULT_IMAGE,
        coverAlt: project.coverAlt || project.title || "Project cover"
      }));
    const contactMethods = state.contact.contactMethods
      .filter((method) => method.isVisible !== false)
      .sort(byOrder);

    return {
      settings: clone(state.settings),
      componentVisibility: clone(state.componentVisibility),
      profile: clone(state.profile),
      projects,
      gallery,
      categories,
      contact: {
        ...clone(state.contact),
        contactMethods
      },
      messages: clone(state.messages),
      stats: {
        photos: state.gallery.length,
        featured: state.gallery.filter((photo) => photo.featured).length,
        projects: state.projects.length,
        categories: state.categories.length,
        unreadMessages: state.messages.filter((message) => isUnreadStatus(message.status)).length
      }
    };
  }

  function loadState() {
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
    localStorage.setItem(DATA_KEY, JSON.stringify(normalized));
    return clone(normalized);
  }

  // TODO(cms): After deployment, connect this adapter to a real API/database or
  // a static JSON publishing flow. localStorage only updates the current browser;
  // it is not a real online CMS data source for all visitors.
  const cmsStore = {
    key: DATA_KEY,
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
    return "Page";
  }

  function applySeo(pageName, fallback = {}) {
    const data = cmsStore.getPublicData();
    const settings = data.settings;
    const global = settings.globalInfo || {};
    const seo = settings.seo || {};
    const pageSeo = settings.pageSeo?.[pageName] || {};
    const pageTitle = pageName === "home" ? seo.seoTitle || seo.siteTitle : `${global.brandName || "WonG"} - ${pageTitleFromName(pageName)}`;
    const title = pageSeo.title || fallback.title || pageTitle;
    const description = pageSeo.description || fallback.description || seo.seoDescription || seo.siteDescription || "";
    const image = pageSeo.ogImage || fallback.ogImage || seo.ogImage || DEFAULT_IMAGE;

    document.title = title;
    ensureMeta('meta[name="description"]', { name: "description" }).setAttribute("content", description);
    ensureMeta('meta[property="og:title"]', { property: "og:title" }).setAttribute("content", title);
    ensureMeta('meta[property="og:description"]', { property: "og:description" }).setAttribute("content", description);
    ensureMeta('meta[property="og:image"]', { property: "og:image" }).setAttribute("content", image);
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
          return `<a ${active ? 'class="is-active" aria-current="page"' : ""} href="${escapeAttr(item.url || "#")}">${escapeHtml(item.label || "Link")}</a>`;
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

  window.defaultCmsState = defaultCmsState;
  window.cmsStore = cmsStore;
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
