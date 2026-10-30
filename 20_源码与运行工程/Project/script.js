(async function () {
  let dateTimer;
  function updateCurrentDate() {
    const now = new Date();
    const time = document.querySelector("[data-project-current-date]");
    if (time) {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit"
      }).formatToParts(now);
      const part = type => parts.find(item => item.type === type)?.value;
      time.dateTime = [part("year"), part("month"), part("day")].join("-");
      time.textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Shanghai", day: "2-digit", month: "short", year: "numeric"
      }).format(now);
    }
    const shanghai = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const elapsed = ((shanghai.getUTCHours() * 60 + shanghai.getUTCMinutes()) * 60
      + shanghai.getUTCSeconds()) * 1000 + shanghai.getUTCMilliseconds();
    clearTimeout(dateTimer);
    dateTimer = setTimeout(updateCurrentDate, 86400000 - elapsed + 50);
  }
  updateCurrentDate();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateCurrentDate();
  });
  window.addEventListener("pageshow", updateCurrentDate);

  if ((await window.cmsStore?.ready) === false) return;
  const cmsData = window.cmsStore?.getPublicData?.();
  const cmsRender = window.cmsRender;

  function createCoverShowcase(selectProject) {
    const root = document.querySelector(".archive-stamp");
    const stage = root?.querySelector("[data-cover-showcase]");
    if (!stage) return null;
    const pieces = Array.from(stage.querySelectorAll(".showcase-piece"));
    const title = root.querySelector("[data-showcase-title]");
    const count = root.querySelector("[data-showcase-count]");
    const toggle = root.querySelector("[data-showcase-toggle]");
    const empty = root.querySelector("[data-showcase-empty]");
    let entries = [];
    const format = value => String(value).padStart(2, "0");
    // Four quarter-image polygons follow the supplied Split Showcase concept.
    const shapes = [
      ["23% 18%, 95% 13%, 100% 91%, 55% 87%", "0% 7%, 100% 9%, 95% 93%, 5% 95%", "5% 11%, 100% 14%, 95% 88%, 0% 91%", "5% 18%, 89% 21%, 62% 73%, 0% 83%"],
      ["95% 10%, 100% 80%, 62% 77%, 45% 12%", "100% 3%, 95% 95%, 5% 90%, 0% 5%", "100% 14%, 95% 84%, 0% 91%, 5% 7%", "57% 31%, 45% 67%, 0% 77%, 5% 18%"],
      ["100% 67%, 48% 63%, 28% 9%, 95% 3%", "95% 83%, 5% 78%, 0% 6%, 100% 11%", "95% 79%, 0% 86%, 5% 7%, 100% 3%", "45% 57%, 0% 67%, 5% 8%, 72% 12%"],
      ["78% 72%, 58% 34%, 95% 27%, 100% 73%", "5% 79%, 0% 21%, 100% 16%, 95% 83%", "0% 85%, 5% 14%, 100% 3%, 95% 95%", "0% 77%, 5% 18%, 47% 21%, 32% 67%"]
    ];
    const loaded = new Map();
    let timer;
    let request = 0;
    let currentIndex = -1;
    let requestedIndex = -1;
    let morph = -1;
    let loading = false;
    let paused = false;
    let hovered = false;
    let focused = false;
    let inView = false;
    const motionAllowed = () => window.wongMotion?.motionAllowed
      ?? !matchMedia("(prefers-reduced-motion: reduce)").matches;

    function refreshPlayback() {
      clearTimeout(timer);
      const allowed = motionAllowed();
      const playing = entries.length > 1 && currentIndex >= 0 && !loading && !paused
        && !hovered && !focused && inView && !document.hidden && !root.hidden && allowed;
      toggle.disabled = entries.length < 2 || !allowed;
      toggle.setAttribute("aria-pressed", String(paused));
      const label = !allowed ? "Automatic playback off · reduced motion"
        : paused ? "Play project slideshow" : "Pause project slideshow";
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
      toggle.textContent = paused ? "▶" : "Ⅱ";
      document.querySelector("[data-project-position]")?.setAttribute("aria-live", playing ? "off" : "polite");
      if (playing) timer = setTimeout(() => selectProject((currentIndex + 1) % entries.length), 4200);
    }

    function loadCover(src) {
      if (!loaded.has(src)) {
        loaded.set(src, new Promise(resolve => {
          const image = new Image();
          const finish = success => {
            clearTimeout(timeout);
            image.onload = image.onerror = null;
            resolve(success);
          };
          const timeout = setTimeout(() => { finish(false); image.src = ""; }, 10000);
          image.onload = () => finish(image.naturalWidth > 0);
          image.onerror = () => finish(false);
          image.src = src;
        }));
      }
      return loaded.get(src);
    }

    async function show(index) {
      if (!entries.length) return;
      if (index === currentIndex && !loading) { refreshPlayback(); return; }
      requestedIndex = index;
      const token = ++request;
      loading = true;
      stage.setAttribute("aria-busy", "true");
      refreshPlayback();
      const entry = entries[index];
      const success = await loadCover(entry.src);
      if (token !== request) return;
      currentIndex = index;
      morph = (morph + 1) % shapes.length;
      pieces.forEach((piece, i) => {
        piece.hidden = !success;
        if (success) {
          piece.querySelector("img").src = entry.src;
          piece.style.clipPath = "polygon(" + shapes[morph][i] + ")";
        }
      });
      empty.hidden = success;
      empty.textContent = "Cover unavailable.";
      title.textContent = entry.title;
      count.textContent = format(index + 1) + " / " + format(entries.length);
      stage.disabled = entries.length < 2;
      stage.setAttribute("aria-label", "Project cover: " + entry.title + (entries.length > 1 ? ". Show next project." : "."));
      stage.removeAttribute("aria-busy");
      root.dataset.coverIndex = String(entry.index);
      loading = false;
      refreshPlayback();
      if (entries.length > 1) loadCover(entries[(index + 1) % entries.length].src);
    }

    function setEntries(cards) {
      clearTimeout(timer);
      ++request; // A late image from the previous page must not replace this page.
      entries = cards.map(card => ({ title: card.querySelector("h3").textContent, src: card.querySelector("img").src, index: Number(card.dataset.index) }));
      currentIndex = requestedIndex = -1;
      loading = false;
      stage.removeAttribute("aria-busy");
      pieces.forEach(piece => { piece.hidden = true; });
      empty.hidden = Boolean(entries.length);
      if (!entries.length) { title.textContent = "Projects collection"; count.textContent = "00 / 00"; stage.disabled = true; }
      refreshPlayback();
    }
    stage.addEventListener("click", () => selectProject((Math.max(0, requestedIndex) + 1) % entries.length));
    toggle.addEventListener("click", () => { paused = !paused; refreshPlayback(); });
    root.addEventListener("pointerenter", event => {
      if (event.pointerType !== "touch") { hovered = true; refreshPlayback(); }
    });
    root.addEventListener("pointerleave", () => { hovered = false; refreshPlayback(); });
    root.addEventListener("focusin", () => { focused = true; refreshPlayback(); });
    root.addEventListener("focusout", event => { focused = root.contains(event.relatedTarget); refreshPlayback(); });
    document.addEventListener("visibilitychange", refreshPlayback);
    window.addEventListener("wong:motionchange", refreshPlayback);
    window.addEventListener("pagehide", () => clearTimeout(timer));
    window.addEventListener("pageshow", refreshPlayback);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.15;
        refreshPlayback();
      }, { threshold: 0.15 }).observe(root);
    } else {
      inView = true;
    }
    refreshPlayback();
    return { show, setEntries };
  }

  if (!cmsData || !cmsRender || !window.projectCollections) return;
  const collections = window.projectCollections;
  const projects = Array.isArray(cmsData.projects) ? cmsData.projects : [];
  const settings = cmsData.settings || {};
  const labels = settings.pageContent?.projects || {};
  const categories = new Map((cmsData.categories || []).map(category => [category.id, category.name]));
  const pageSize = collections.pageSize;
  const pageCount = Math.max(1, Math.ceil(projects.length / pageSize));
  const grid = document.querySelector("[data-project-list]");
  const rail = document.querySelector(".project-rail");
  const position = document.querySelector("[data-project-position]");
  const pagination = document.querySelector("[data-project-pagination]");
  const prevButton = document.querySelector("[data-project-prev]");
  const nextButton = document.querySelector("[data-project-next]");
  const number = value => String(value).padStart(2, "0");
  const imageUrl = value => window.cmsPages.safeUrl(value, true) || cmsRender.defaultImage;
  let cards = [], nodes = [], currentPage = 1;
  let activeIndex = Math.max(0, projects.findIndex(project => project.id === settings.projectsDefaultId));
  if (!grid) return;
  cmsRender.applySeo("projects", { ogImage: projects[0]?.coverImage || "../Project/assets/project-edges-light.png" });
  cmsRender.applyChrome("projects");
  const locationValue = document.querySelectorAll(".archive-meta b")[1];
  if (locationValue) locationValue.textContent = settings.globalInfo?.defaultLocation || locationValue.textContent;
  // Playback selects within the current six-card batch and never changes pages.
  const showcase = createCoverShowcase(localIndex => setActiveProject((currentPage - 1) * pageSize + localIndex));
  function readPage() {
    const value = new URL(location.href).searchParams.get("page");
    const parsed = /^\d+$/.test(value || "") ? Number(value) : 1;
    return Math.max(1, Math.min(pageCount, parsed));
  }
  function writePageUrl(replace = false) {
    const url = new URL(location.href);
    url.searchParams.set("page", String(currentPage));
    if (url.href !== location.href) history[replace ? "replaceState" : "pushState"]({ projectPage: currentPage }, "", url);
  }
  function renderPagination() {
    if (!pagination) return;
    const start = (currentPage - 1) * pageSize;
    const summary = document.createElement("span");
    summary.className = "gallery-page-summary";
    summary.setAttribute("role", "status");
    summary.append(document.createTextNode((projects.length ? start + 1 : 0) + "–" + Math.min(start + pageSize, projects.length) + " / " + projects.length + " "));
    const unit = document.createElement("span"); unit.dataset.projectUnit = ""; unit.textContent = labels.projectUnit ?? "projects"; summary.append(unit);
    const controls = document.createElement("div");
    controls.className = "gallery-page-controls";
    function button(text, target, disabled = false) {
      const node = document.createElement("button");
      node.type = "button"; node.dataset.projectPage = String(target); node.textContent = text; node.disabled = disabled;
      node.setAttribute("aria-controls", "project-results");
      if (typeof target === "number") { node.setAttribute("aria-label", "Page " + target); if (target === currentPage) node.setAttribute("aria-current", "page"); }
      return node;
    }
    controls.append(button(labels.pagePrevText || "← Prev", "prev", currentPage <= 1));
    const visible = Array.from({ length: pageCount }, (_, i) => i + 1).filter(page => page === 1 || page === pageCount || Math.abs(page - currentPage) <= 1);
    let previous = 0;
    visible.forEach(page => {
      if (page - previous > 1) { const gap = document.createElement("span"); gap.textContent = "…"; gap.setAttribute("aria-hidden", "true"); controls.append(gap); }
      controls.append(button(number(page), page)); previous = page;
    });
    controls.append(button(labels.pageNextText || "Next →", "next", !projects.length || currentPage >= pageCount));
    pagination.replaceChildren(summary, controls);
    pagination.dataset.pageCount = String(projects.length ? pageCount : 0);
    pagination.dataset.currentPage = String(projects.length ? currentPage : 0);
  }
  function renderPage(nextPage, nextActive, updateHistory = true, replace = false) {
    currentPage = Math.max(1, Math.min(pageCount, nextPage));
    const start = (currentPage - 1) * pageSize, batch = projects.slice(start, start + pageSize);
    activeIndex = nextActive >= start && nextActive < start + batch.length ? nextActive : start;
    if (updateHistory) writePageUrl(replace);
    if (rail) {
      rail.hidden = !batch.length;
      rail.innerHTML = batch.map((project, localIndex) => {
        const index = start + localIndex;
        return '<button class="rail-node" type="button" data-project-node="' + index + '" aria-label="Select project ' + (index + 1) + ': ' + cmsRender.escapeAttr(project.title || "Untitled Project") + '" aria-controls="' + cmsRender.escapeAttr(project.id) + '"><span class="rail-node-number">' + number(index + 1) + '</span><span class="rail-node-title">' + cmsRender.escapeHtml(project.title || "Untitled Project") + '</span><span class="rail-node-year">' + cmsRender.escapeHtml(project.year || "Year to be added") + '</span></button>';
      }).join("");
    }
    grid.innerHTML = batch.map((project, localIndex) => {
      const index = start + localIndex;
      const theme = project.theme || (project.categoryIds || []).map(id => categories.get(id)).filter(Boolean).join(" / ") || "Photography";
      const href = cmsRender.escapeAttr(window.cmsPages.safeUrl(collections.detailUrl(project.id, currentPage)));
      return '<article class="project-card" id="' + cmsRender.escapeAttr(project.id) + '" data-project-card data-project-id="' + cmsRender.escapeAttr(project.id) + '" data-index="' + index + '" tabindex="0">'
        + '<p class="project-card-index" aria-hidden="true"><span>Project ' + number(index + 1) + '</span><span class="project-selected-label">Selected</span></p>'
        + '<a class="project-cover-link" href="' + href + '" aria-label="' + cmsRender.escapeAttr(project.title || "Untitled Project") + '"><img src="' + cmsRender.escapeAttr(imageUrl(project.coverImage)) + '" alt="' + cmsRender.escapeAttr(project.coverAlt || project.title || "Project cover") + '" width="386" height="290" loading="' + (index === activeIndex ? "eager" : "lazy") + '" decoding="async" /></a>'
        + '<div class="project-card-body"><h3><a href="' + href + '">' + cmsRender.escapeHtml(project.title || "Untitled Project") + '</a></h3>'
        + '<p class="project-tag">' + cmsRender.escapeHtml(theme) + '</p><dl class="project-meta"><div><dt>Location</dt><dd>' + cmsRender.escapeHtml(project.location || "To be added") + '</dd></div><div><dt>Year</dt><dd>' + cmsRender.escapeHtml(project.year || "To be added") + '</dd></div></dl>'
        + '<p class="project-summary">' + cmsRender.escapeHtml(project.description || "Project description to be added.") + '</p>'
        + '<a class="view-link" href="' + href + '">' + cmsRender.escapeHtml(project.linkLabel || "View Collection") + ' <span aria-hidden="true">→</span></a></div></article>';
    }).join("");
    if (!batch.length) grid.innerHTML = '<p class="project-empty">No projects to display.</p>';
    cards = Array.from(grid.querySelectorAll("[data-project-card]"));
    nodes = Array.from(rail?.querySelectorAll("[data-project-node]") || []);
    if (prevButton) prevButton.disabled = projects.length < 2;
    if (nextButton) nextButton.disabled = projects.length < 2;
    renderPagination(); window.cmsPages?.apply("projects"); showcase?.setEntries(cards);
    if (batch.length) setActiveProject(activeIndex); else if (position) position.textContent = "00 / 00";
  }
  function setActiveProject(nextIndex, shouldReveal = false) {
    if (!projects.length) return;
    const index = (nextIndex + projects.length) % projects.length, nextPage = Math.floor(index / pageSize) + 1;
    if (nextPage !== currentPage) { renderPage(nextPage, index); if (shouldReveal) revealCard(index); return; }
    activeIndex = index;
    cards.forEach(card => { const selected = Number(card.dataset.index) === activeIndex; card.classList.toggle("is-active", selected); if (selected) card.setAttribute("aria-current", "true"); else card.removeAttribute("aria-current"); });
    nodes.forEach(node => { const selected = Number(node.dataset.projectNode) === activeIndex; node.classList.toggle("is-active", selected); if (selected) node.setAttribute("aria-current", "true"); else node.removeAttribute("aria-current"); });
    showcase?.show(activeIndex - (currentPage - 1) * pageSize);
    if (position) { const title = document.createElement("span"); title.className = "project-sr-only"; title.textContent = " — " + (projects[activeIndex].title || "Untitled Project"); position.replaceChildren(document.createTextNode(number(activeIndex + 1) + " / " + number(projects.length)), title); }
    if (shouldReveal) revealCard(activeIndex);
  }
  function revealCard(index) {
    const card = cards.find(item => Number(item.dataset.index) === index);
    if (!card) return;
    card.focus({ preventScroll: true });
    const bounds = card.getBoundingClientRect();
    const behavior = (window.wongMotion?.motionAllowed ?? !matchMedia("(prefers-reduced-motion: reduce)").matches) ? "smooth" : "auto";
    if (bounds.top < 16 || bounds.bottom > innerHeight - 16) card.scrollIntoView({ block: "start", inline: "nearest", behavior });
    const node = nodes.find(item => Number(item.dataset.projectNode) === index);
    if (rail && node && rail.scrollWidth > rail.clientWidth) { const bounds = rail.getBoundingClientRect(), item = node.getBoundingClientRect(); if (item.left < bounds.left || item.right > bounds.right) rail.scrollTo({ left: rail.scrollLeft + item.left - bounds.left - (rail.clientWidth - item.width) / 2, behavior }); }
  }
  grid.addEventListener("click", event => { if (event.target.closest("a,button,input,textarea,select")) return; const card = event.target.closest("[data-project-card]"); if (card) setActiveProject(Number(card.dataset.index)); });
  grid.addEventListener("keydown", event => {
    const card = event.target.closest("[data-project-card]"); if (!card || event.target !== card) return;
    const index = Number(card.dataset.index);
    if (event.key === "Enter") { event.preventDefault(); card.querySelector(".project-cover-link")?.click(); }
    else if (event.key === " ") { event.preventDefault(); setActiveProject(index); }
    else { const destinations = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: projects.length - 1 }; if (Object.hasOwn(destinations, event.key)) { event.preventDefault(); setActiveProject(destinations[event.key], true); } }
  });
  rail?.addEventListener("click", event => { const node = event.target.closest("[data-project-node]"); if (node) setActiveProject(Number(node.dataset.projectNode), true); });
  prevButton?.addEventListener("click", () => setActiveProject(activeIndex - 1, true));
  nextButton?.addEventListener("click", () => setActiveProject(activeIndex + 1, true));
  pagination?.addEventListener("click", event => {
    const button = event.target.closest("[data-project-page]"); if (!button || button.disabled) return;
    const target = button.dataset.projectPage, page = target === "prev" ? currentPage - 1 : target === "next" ? currentPage + 1 : Number(target);
    if (page === currentPage) return;
    renderPage(page, (page - 1) * pageSize);
    (pagination.querySelector('[data-project-page="' + target + '"]:not(:disabled)') || pagination.querySelector('[aria-current="page"]'))?.focus({ preventScroll: true });
    if (grid.getBoundingClientRect().top < 0) grid.scrollIntoView({ block: "start", behavior: "auto" });
  });
  window.addEventListener("popstate", () => renderPage(readPage(), activeIndex, true, true));
  const explicitPage = new URL(location.href).searchParams.has("page");
  renderPage(explicitPage ? readPage() : Math.floor(activeIndex / pageSize) + 1, activeIndex, true, true);
})();
