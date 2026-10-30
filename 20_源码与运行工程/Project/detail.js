(async function () {
  if ((await window.cmsStore?.ready) === false) return;
  const data = window.cmsStore?.getPublicData?.();
  const render = window.cmsRender;
  const collections = window.projectCollections;
  if (!data || !render || !collections) return;
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const params = new URL(location.href).searchParams;
  const requestedId = params.get("project") || "";
  const project = projects.find(item => String(item.id) === requestedId);
  const fromValue = params.get("fromPage") || "1";
  const parsed = /^\d+$/.test(fromValue) ? Number(fromValue) : 1;
  const fromPage = Math.max(1, Math.min(Math.max(1, Math.ceil(projects.length / collections.pageSize)), parsed));
  const labels = data.settings?.pageContent?.projects || {};
  const safeUrl = (value, image = false) => window.cmsPages.safeUrl(value, image);
  const text = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value || ""; };
  render.applyChrome("projects");
  document.querySelector("[data-project-back]").href = "index.html?page=" + fromPage;
  const switcher = document.querySelector("[data-project-switch]");
  switcher.innerHTML = projects.map(item => '<a href="' + render.escapeAttr(safeUrl(collections.detailUrl(item.id, fromPage))) + '"' + (item.id === project?.id ? ' class="is-active" aria-current="page"' : '') + '>' + render.escapeHtml(item.title || "Untitled Project") + '</a>').join("");
  if (!projects.length) switcher.closest(".project-switcher").hidden = true;
  function revealCurrentProject() {
    const selected = switcher.querySelector('[aria-current="page"]');
    if (!selected || switcher.scrollWidth <= switcher.clientWidth) return;
    const bounds = switcher.getBoundingClientRect(), active = selected.getBoundingClientRect();
    if (active.left < bounds.left || active.right > bounds.right) switcher.scrollLeft += active.left - bounds.left - (switcher.clientWidth - active.width) / 2;
  }
  revealCurrentProject();
  window.addEventListener("resize", revealCurrentProject);


  if (!project) {
    document.querySelector("[data-project-missing]").hidden = false;
    window.cmsPages?.apply("projects");
    render.applySeo("projects", { projectId: requestedId });
    return;
  }
  const categories = new Map((data.categories || []).map(item => [item.id, item.name]));
  const theme = project.theme || (project.categoryIds || []).map(id => categories.get(id)).filter(Boolean).join(" / ");
  text("[data-project-detail-title]", project.title || "Untitled Project");
  text("[data-project-detail-theme]", theme);
  text("[data-project-detail-location]", project.location);
  text("[data-project-detail-year]", project.year);
  text("[data-project-detail-description]", project.description);
  document.querySelector("[data-project-detail-theme]").hidden = !theme;
  document.querySelector("[data-project-detail-description]").hidden = !project.description;
  document.querySelector("[data-project-detail-location]").parentElement.hidden = !project.location;
  document.querySelector("[data-project-detail-year]").parentElement.hidden = !project.year;
  const cover = document.querySelector("[data-project-detail-cover]");
  const coverUrl = safeUrl(project.coverImage, true);
  if (coverUrl) { cover.src = coverUrl; cover.alt = project.coverAlt || project.title || "Project cover"; }
  else cover.parentElement.hidden = true;
  const photos = collections.photos(data, project);
  const pageSize = collections.pageSize;
  const pageCount = Math.ceil(photos.length / pageSize);
  const grid = document.querySelector("[data-project-photo-grid]");
  const pagination = document.querySelector("[data-project-photo-pagination]");
  const pageGroups = document.querySelector("[data-project-photo-groups]");
  const dialog = document.querySelector("[data-project-lightbox]");
  const image = dialog.querySelector("[data-project-lightbox-image]");
  const filmStage = dialog.querySelector("[data-project-film-stage]");
  const filmFrame = dialog.querySelector("[data-project-film-frame]");
  const loading = dialog.querySelector("[data-project-image-loading]");
  const imageError = dialog.querySelector("[data-project-image-error]");
  const previous = dialog.querySelector("[data-project-lightbox-prev]");
  const next = dialog.querySelector("[data-project-lightbox-next]");
  const close = dialog.querySelector("[data-project-lightbox-close]");
  const number = value => String(value).padStart(2, "0");
  let photoPage = 1, activeIndex = 0, previousOverflow = "";
  let imageRequest = 0, pendingImage, fitRequest;
  let naturalWidth = 4, naturalHeight = 3;
  text("[data-project-photo-count]", String(photos.length));
  text("[data-project-total-photo-count]", String(photos.length));
  text("[data-project-photo-page-count]", String(pageCount));
  text("[data-project-film-brand]", data.settings?.globalInfo?.brandName || "WonG");
  document.querySelector("[data-project-photos-empty]").hidden = photos.length !== 0;
  document.querySelector("[data-project-page-index]").hidden = !photos.length;
  document.querySelector("[data-project-browse]").hidden = !photos.length;
  document.querySelector("[data-project-notes]").hidden = !project.description && !project.location && !project.year;
  document.querySelector("[data-project-detail-content]").hidden = false;
  document.querySelector("[data-project-detail-content]").dataset.emptyCollection = String(!photos.length);

  function readPhotoPage() {
    const value = new URL(location.href).searchParams.get("photoPage") || "1";
    return Math.max(1, Math.min(Math.max(1, pageCount), /^\d+$/.test(value) ? Number(value) : 1));
  }
  function writePhotoUrl(replace = false, index = (photoPage - 1) * pageSize) {
    const url = new URL(location.href);
    url.searchParams.set("photoPage", String(photoPage));
    const state = { ...(history.state || {}), projectPhotoPage: photoPage, projectPhotoIndex: index };
    if (url.href !== location.href || replace) history[replace ? "replaceState" : "pushState"](state, "", url);
  }
  function renderPagination() {
    const start = (photoPage - 1) * pageSize;
    const summary = document.createElement("span");
    summary.className = "gallery-page-summary";
    summary.setAttribute("role", "status");
    summary.append(document.createTextNode((photos.length ? start + 1 : 0) + "–" + Math.min(start + pageSize, photos.length) + " / " + photos.length + " "));
    const unit = document.createElement("span");
    unit.dataset.projectPhotoUnit = "";
    unit.textContent = labels.detailPhotoUnit ?? "images";
    summary.append(unit);
    const controls = document.createElement("div"); controls.className = "gallery-page-controls";
    function button(label, target, disabled = false) {
      const node = document.createElement("button");
      node.type = "button"; node.dataset.projectPhotoPage = String(target); node.textContent = label; node.disabled = disabled;
      node.setAttribute("aria-controls", "project-photo-results");
      if (typeof target === "number") { node.setAttribute("aria-label", "Page " + target); if (target === photoPage) node.setAttribute("aria-current", "page"); }
      return node;
    }
    controls.append(button(labels.pagePrevText ?? "← Prev", "prev", photoPage <= 1));
    const visible = Array.from({ length: pageCount }, (_, i) => i + 1).filter(page => page === 1 || page === pageCount || Math.abs(page - photoPage) <= 1);
    let last = 0;
    for (const page of visible) {
      if (page - last > 1) { const gap = document.createElement("span"); gap.textContent = "…"; gap.setAttribute("aria-hidden", "true"); controls.append(gap); }
      controls.append(button(number(page), page)); last = page;
    }
    controls.append(button(labels.pageNextText ?? "Next →", "next", !photos.length || photoPage >= pageCount));
    pagination.replaceChildren(summary, controls);
    pagination.dataset.currentPage = String(photos.length ? photoPage : 0);
    pagination.dataset.pageCount = String(pageCount);
  }
  function renderPageGroups() {
    pageGroups.innerHTML = Array.from({ length: pageCount }, (_, index) => {
      const start = index * pageSize, page = index + 1;
      const preview = photos.slice(start, start + 3).map(photo => '<img src="' + render.escapeAttr(safeUrl(photo.image, true) || render.defaultImage) + '" alt="" width="56" height="38" loading="lazy" decoding="async" />').join("");
      return '<button class="project-page-group" type="button" data-project-photo-group="' + page + '" aria-label="Page ' + page + ': ' + (start + 1) + '–' + Math.min(start + pageSize, photos.length) + '" aria-controls="project-photo-results"' + (page === photoPage ? ' aria-current="page"' : '') + '><span class="project-page-group-number">' + number(page) + '</span><span class="project-page-group-previews" aria-hidden="true">' + preview + '</span></button>';
    }).join("");
    const selected = pageGroups.querySelector('[aria-current="page"]');
    if (selected && pageGroups.scrollWidth > pageGroups.clientWidth) {
      const bounds = pageGroups.getBoundingClientRect(), active = selected.getBoundingClientRect();
      if (active.left < bounds.left || active.right > bounds.right) pageGroups.scrollLeft += active.left - bounds.left - (pageGroups.clientWidth - active.width) / 2;
    }
  }
  function renderPhotoPage(nextPage, { updateHistory = true, replace = false, index } = {}) {
    photoPage = Math.max(1, Math.min(Math.max(1, pageCount), nextPage));
    const start = (photoPage - 1) * pageSize;
    grid.innerHTML = photos.slice(start, start + pageSize).map((photo, localIndex) => {
      const index = start + localIndex, title = photo.title || "";
      const meta = [photo.location, photo.year || photo.date].filter(Boolean).join(" · ");
      return '<figure class="project-photo-card"><button type="button" data-project-photo="' + render.escapeAttr(photo.id) + '" data-photo-index="' + index + '" aria-label="' + render.escapeAttr("Open photograph: " + (title || index + 1)) + '"><img src="' + render.escapeAttr(safeUrl(photo.image, true) || render.defaultImage) + '" alt="' + render.escapeAttr(photo.altText || title || "Project photograph") + '" width="800" height="600" loading="lazy" decoding="async" /></button><figcaption><span class="project-photo-number">' + number(index + 1) + '</span><div><h3>' + render.escapeHtml(title) + '</h3>' + (meta ? '<p>' + render.escapeHtml(meta) + '</p>' : '') + '</div></figcaption></figure>';
    }).join("");
    grid.dataset.currentPage = String(photos.length ? photoPage : 0);
    text("[data-project-current-photo-page]", String(photos.length ? photoPage : 0));
    renderPagination(); renderPageGroups();
    if (updateHistory) writePhotoUrl(replace, index);
    window.cmsPages?.apply("projects");
  }
  function changePage(page, target) {
    if (page === photoPage) return;
    renderPhotoPage(page);
    if (target?.dataset.projectPhotoPage) {
      const value = target.dataset.projectPhotoPage;
      (pagination.querySelector('[data-project-photo-page="' + value + '"]:not(:disabled)') || pagination.querySelector('[aria-current="page"]'))?.focus({ preventScroll: true });
    } else pageGroups.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
    const bounds = grid.getBoundingClientRect();
    if (bounds.top < 0) grid.scrollIntoView({ block: "start", behavior: "auto" });
  }
  pagination.addEventListener("click", event => {
    const button = event.target.closest("[data-project-photo-page]"); if (!button || button.disabled) return;
    const value = button.dataset.projectPhotoPage;
    changePage(value === "prev" ? photoPage - 1 : value === "next" ? photoPage + 1 : Number(value), button);
  });
  pageGroups.addEventListener("click", event => {
    const button = event.target.closest("[data-project-photo-group]"); if (button) changePage(Number(button.dataset.projectPhotoGroup), button);
  });

  function fitFilmFrame() {
    if (!dialog.open) return;
    const bounds = filmStage.getBoundingClientRect(), style = getComputedStyle(filmFrame);
    const value = key => parseFloat(style[key]) || 0;
    const insetX = value("paddingLeft") + value("paddingRight") + value("borderLeftWidth") + value("borderRightWidth");
    const insetY = value("paddingTop") + value("paddingBottom") + value("borderTopWidth") + value("borderBottomWidth");
    const width = Math.max(1, bounds.width - insetX), height = Math.max(1, bounds.height - insetY);
    const ratio = Math.min(width / naturalWidth, height / naturalHeight);
    filmFrame.style.width = Math.floor(naturalWidth * ratio + insetX) + "px";
    filmFrame.style.height = Math.floor(naturalHeight * ratio + insetY) + "px";
  }
  function scheduleFilmFit() { cancelAnimationFrame(fitRequest); fitRequest = requestAnimationFrame(fitFilmFrame); }
  function loadPhoto(photo) {
    const token = ++imageRequest;
    pendingImage?.cancel();
    naturalWidth = 4; naturalHeight = 3;
    image.hidden = true; image.removeAttribute("src");
    filmFrame.setAttribute("aria-busy", "true");
    loading.hidden = false; imageError.hidden = true; scheduleFilmFit();
    const probe = new Image(); let timeout;
    const finish = success => {
      clearTimeout(timeout); probe.onload = probe.onerror = null;
      if (token !== imageRequest) return;
      pendingImage = null;
      filmFrame.setAttribute("aria-busy", "false"); loading.hidden = true; imageError.hidden = success;
      if (success) {
        naturalWidth = probe.naturalWidth; naturalHeight = probe.naturalHeight;
        image.src = probe.src; image.alt = photo.altText || photo.title || "Project photograph"; image.hidden = false;
      }
      scheduleFilmFit();
    };
    probe.onload = () => finish(probe.naturalWidth > 0 && probe.naturalHeight > 0);
    probe.onerror = () => finish(false);
    timeout = setTimeout(() => finish(false), 12000);
    pendingImage = { cancel() { clearTimeout(timeout); probe.onload = probe.onerror = null; probe.src = ""; } };
    probe.src = safeUrl(photo.image, true) || render.defaultImage;
  }
  function showPhoto(index, { synchronizePage = true } = {}) {
    if (!photos.length) return;
    activeIndex = (index + photos.length) % photos.length;
    const nextPage = Math.floor(activeIndex / pageSize) + 1;
    if (synchronizePage && nextPage !== photoPage) renderPhotoPage(nextPage, { index: activeIndex });
    else if (synchronizePage) writePhotoUrl(true, activeIndex);
    const photo = photos[activeIndex];
    image.draggable = false;
    text("[data-project-lightbox-title]", photo.title || "");
    text("[data-project-lightbox-meta]", [photo.location, photo.year || photo.date].filter(Boolean).join(" · "));
    text("[data-project-lightbox-description]", photo.description || "");
    text("[data-project-lightbox-position]", number(activeIndex + 1) + " / " + number(photos.length));
    text("[data-project-film-title]", photo.title || "");
    text("[data-project-film-label]", labels.detailFilmLabel ?? "Projects");
    previous.disabled = next.disabled = photos.length < 2;
    dialog.dataset.photoId = String(photo.id || "");
    loadPhoto(photo);
  }
  function openPhoto(index) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal(); showPhoto(index); scheduleFilmFit();
    close.focus({ preventScroll: true });
  }
  function closePhoto() { if (dialog.open) dialog.close(); }
  grid.addEventListener("click", event => { const button = event.target.closest("[data-project-photo]"); if (button) openPhoto(Number(button.dataset.photoIndex)); });
  previous.addEventListener("click", () => showPhoto(activeIndex - 1));
  next.addEventListener("click", () => showPhoto(activeIndex + 1));
  close.addEventListener("click", closePhoto);
  dialog.addEventListener("close", () => {
    ++imageRequest; pendingImage?.cancel(); pendingImage = null; cancelAnimationFrame(fitRequest);
    document.body.style.overflow = previousOverflow;
    grid.querySelector('[data-photo-index="' + activeIndex + '"]')?.focus({ preventScroll: true });
  });
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); showPhoto(activeIndex + (event.key === "ArrowLeft" ? -1 : 1)); }
    if (event.key === "Escape") { event.preventDefault(); closePhoto(); }
  });
  dialog.addEventListener("click", event => { if (event.target === dialog || event.target === filmStage) closePhoto(); });
  let swipe;
  image.addEventListener("pointerdown", event => { if (event.isPrimary && event.pointerType === "touch") swipe = { x: event.clientX, y: event.clientY, id: event.pointerId }; });
  image.addEventListener("pointerup", event => {
    if (!swipe || swipe.id !== event.pointerId) return;
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y; swipe = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) showPhoto(activeIndex + (dx < 0 ? 1 : -1));
  });
  image.addEventListener("pointercancel", () => { swipe = null; });
  window.addEventListener("resize", scheduleFilmFit);
  if ("ResizeObserver" in window) new ResizeObserver(scheduleFilmFit).observe(filmStage);
  window.addEventListener("popstate", event => {
    renderPhotoPage(readPhotoPage(), { updateHistory: false });
    if (dialog.open) {
      const candidate = event.state?.projectPhotoIndex;
      const first = (photoPage - 1) * pageSize;
      const index = Number.isInteger(candidate) && candidate >= first && candidate < Math.min(first + pageSize, photos.length) ? candidate : first;
      showPhoto(index, { synchronizePage: false });
    }
  });
  window.addEventListener("pagehide", closePhoto);
  renderPhotoPage(readPhotoPage(), { replace: true });
  render.applySeo("projects", { projectId: project.id });
})();
