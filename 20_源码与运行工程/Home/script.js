(async function () {
  function updateCurrentDate() {
    const now = new Date();
    const time = document.querySelector("[data-current-date]");
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
    // Refresh at the next Shanghai midnight, including pages left open overnight.
    const shanghai = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const elapsed = ((shanghai.getUTCHours() * 60 + shanghai.getUTCMinutes()) * 60
      + shanghai.getUTCSeconds()) * 1000 + shanghai.getUTCMilliseconds();
    clearTimeout(dateTimer);
    dateTimer = setTimeout(updateCurrentDate, 86400000 - elapsed + 50);
  }
  let dateTimer;
  updateCurrentDate();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateCurrentDate();
  });

  if ((await window.cmsStore?.ready) === false) return;
  const cmsData = window.cmsStore?.getPublicData?.();
  const cmsRender = window.cmsRender;
  const hero = document.querySelector("[data-hero]");
  const photoStage = document.querySelector(".photo-stage");
  const photoStrip = document.querySelector("[data-photo-strip]");
  const photoIndex = document.querySelector("[data-photo-index]");
  const heroControl = document.querySelector(".hero-control");
  const nextFrame = document.querySelector("[data-next-frame]");
  let featured = [];
  let comparisonConfig = {};
  let resetComparison = () => {};

  function renderCmsHome(data) {
    if (!data || !cmsRender) return;
    cmsRender.applySeo("home");
    cmsRender.applyChrome("home");
    const settings = data.settings || {};
    const homeHero = settings.homeHero || {};
    const gallery = Array.isArray(data.gallery) ? data.gallery : [];
    const text = (value, fallback) => String(value ?? fallback ?? "");
    const title = document.querySelector("#home-title");
    if (title) title.textContent = text(homeHero.heroHeadline, title.textContent);
    const archiveMeta = document.querySelector(".archive-meta");
    if (archiveMeta) {
      const strong = archiveMeta.querySelector("strong");
      const values = archiveMeta.querySelectorAll("b");
      if (strong) strong.textContent = text(homeHero.archiveNo, strong.textContent);
      if (values[1]) values[1].textContent = text(homeHero.basedIn || settings.globalInfo?.defaultLocation, values[1].textContent);
    }

    // Match the photography overview before selecting featured records.
    // Public data already excludes drafts and non-public categories.
    featured = gallery
      .filter(photo => !Array.isArray(photo.displayScopes) || photo.displayScopes.includes("overview"))
      .filter(photo => photo.featured === true)
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    if (photoStrip) {
      photoStrip.classList.toggle("is-scrollable", featured.length > 5);
      photoStrip.innerHTML = featured.map((photo, index) => {
        const number = String(index + 1).padStart(2, "0");
        const image = window.cmsPages.safeUrl(photo.image || cmsRender.defaultImage, true) || cmsRender.defaultImage;
        const meta = [photo.year, photo.categoryLabel || photo.category, photo.film].filter(Boolean).join("  /  ");
        return '<button class="film-card" type="button" data-photo-card data-index="' + (index + 1)
          + '" data-photo-id="' + cmsRender.escapeAttr(photo.id) + '" aria-pressed="false" aria-label="Focus frame '
          + number + ': ' + cmsRender.escapeAttr(photo.title || "Untitled") + '">'
          + '<span class="film-meta">' + cmsRender.escapeHtml(meta || "Selected frame") + '</span>'
          + '<img src="' + cmsRender.escapeAttr(image) + '" alt="' + cmsRender.escapeAttr(photo.altText || photo.title || "Selected photograph")
          + '" width="320" height="400" decoding="async"' + (index < 5 ? ' fetchpriority="high"' : ' loading="lazy"') + ' />'
          + '<span class="film-foot" aria-hidden="true">' + number + ' / SELECTED</span></button>';
      }).join("");
    }
    if (photoIndex) {
      photoIndex.innerHTML = featured.map((photo, index) =>
        '<button type="button" data-photo-node="' + (index + 1) + '" aria-label="Focus frame '
        + String(index + 1).padStart(2, "0") + ': ' + cmsRender.escapeAttr(photo.title || "Untitled") + '">'
        + String(index + 1).padStart(2, "0") + '</button>'
      ).join("");
    }
    const empty = document.querySelector("[data-featured-empty]");
    if (empty) {
      empty.hidden = featured.length > 0;
      empty.textContent = "Selected photographs will appear here soon.";
    }
    if (heroControl) heroControl.hidden = !featured.length || data.componentVisibility?.home?.["Photo Strip"] === false;
    if (nextFrame) {
      nextFrame.hidden = !featured.length || data.componentVisibility?.home?.["Photo Strip"] === false;
      nextFrame.disabled = featured.length < 2;
    }

    comparisonConfig = settings.homeComparison || {};
    renderComparison(comparisonConfig, featured[0]);

  }
  function renderComparison(globalConfig, photo) {
    const section = document.querySelector(".comparison-section");
    const stage = document.querySelector("[data-comparison-stage]");
    if (!section || !stage) return;
    const config = window.cmsHomeComparison.configuration({homeComparison:globalConfig}, photo, location.href);
    const safeImage = value => window.cmsPages.safeUrl(String(value || ""), true);
    const photoImage = photo ? safeImage(photo.image || cmsRender.defaultImage) || cmsRender.defaultImage : "";
    const before = safeImage(config.beforeImage);
    const imageKey = value => { try { const url=new URL(value,location.href);url.hash="";return url.href; } catch (_) { return ""; } };
    const hasPair = Boolean(photo && before && imageKey(before) !== imageKey(photoImage));
    const mode = !photo ? "empty" : hasPair ? "pair" : "single";
    const beforeImage = stage.querySelector("[data-comparison-before]");
    const afterImage = stage.querySelector("[data-comparison-after]");
    section.dataset.comparisonMode = mode;
    section.dataset.comparisonPhotoId = photo?.id || "";
    stage.classList.remove("is-demo");
    stage.classList.toggle("is-single", mode === "single");
    if (photo) afterImage.src = photoImage; else afterImage.removeAttribute("src");
    if (hasPair) beforeImage.src = before; else beforeImage.removeAttribute("src");
    const photoAlt = photo?.altText || photo?.title || "所选照片";
    beforeImage.alt = hasPair ? config.beforeAlt || photoAlt + "的原片画面" : "";
    afterImage.alt = photo ? photoAlt + "的成片画面" : "";
    const title = section.querySelector("[data-comparison-title]");
    if (title && globalConfig.title !== undefined) title.textContent = String(globalConfig.title);
    for (const [key, selector] of Object.entries({lightNote:"[data-comparison-light]",toneNote:"[data-comparison-tone]",detailNote:"[data-comparison-detail]"})) {
      const node=section.querySelector(selector);if(node)node.textContent=photo?String(config[key]??""):"";
    }
    section.querySelector("[data-comparison-work]").textContent = photo ? config.workTitle || photo.title || "Untitled" : "暂无精选照片";
    section.querySelector("[data-comparison-badge]").textContent = !photo ? "等待精选 / NO SELECTION" : hasPair ? "原片 / 成片" : "成片 / FINISHED";
    const disclosure = section.querySelector("#comparison-disclosure");
    disclosure.hidden = hasPair || !photo;
    disclosure.textContent = "这张照片暂未配置原片，当前展示成片。";
    stage.querySelector("[data-comparison-range]").setAttribute("aria-describedby",hasPair?"comparison-instructions":"comparison-disclosure");
    resetComparison();
  }

  function setupComparison() {
    const stage = document.querySelector("[data-comparison-stage]");
    const range = stage?.querySelector("[data-comparison-range]");
    if (!stage || !range) return;
    const images = [...stage.querySelectorAll("img")];
    const buttons = [...document.querySelectorAll("[data-comparison-view]")];
    const status = stage.querySelector("[data-comparison-status]");
    const beforeLabel = stage.querySelector("[data-label-before]");
    const afterLabel = stage.querySelector("[data-label-after]");
    const setPosition = value => {
      const position = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
      range.value = String(position);
      stage.style.setProperty("--comparison-position", position + "%");
      range.setAttribute("aria-valuetext", "原片显示 " + position + "%，成片显示 " + (100 - position) + "%");
      beforeLabel.hidden = position < 15;
      afterLabel.hidden = position > 85;
      buttons.forEach(button => button.setAttribute("aria-pressed", String(
        Number(button.dataset.comparisonView) === (position === 0 ? 0 : position === 100 ? 100 : 50)
      )));
    };
    const updateLoadState = () => {
      const empty = stage.closest(".comparison-section").dataset.comparisonMode === "empty";
      const pair = stage.closest(".comparison-section").dataset.comparisonMode === "pair";
      const visibleImages = pair ? images : images.filter(image => image.matches("[data-comparison-after]"));
      const error = !empty && visibleImages.some(image => image.complete && image.naturalWidth === 0);
      const ready = !empty && visibleImages.every(image => image.complete && image.naturalWidth > 0);
      stage.classList.toggle("has-load-error", error);
      stage.setAttribute("aria-busy", String(!empty && !ready && !error));
      range.disabled = !ready || !pair;
      buttons.forEach(button => button.disabled = !ready || !pair);
      status.hidden = ready;
      status.textContent = empty ? "暂无精选照片可对照，请在后台设置摄影总览精选。"
        : error ? "对照图片暂时无法加载，请稍后重试。" : "正在载入影像…";
    };
    images.forEach(image => {
      image.addEventListener("load", updateLoadState);
      image.addEventListener("error", updateLoadState);
    });
    range.addEventListener("input", () => setPosition(range.value));
    let pointerId = null;
    const moveToPointer = event => {
      const rect = stage.getBoundingClientRect();
      if (rect.width) setPosition((event.clientX - rect.left) / rect.width * 100);
    };
    range.addEventListener("pointerdown", event => {
      if (range.disabled || !event.isPrimary || event.button !== 0) return;
      if (event.pointerType === "mouse") event.preventDefault();
      pointerId = event.pointerId;
      range.focus({ preventScroll: true });
      range.setPointerCapture(pointerId);
      moveToPointer(event);
    });
    range.addEventListener("pointermove", event => {
      if (event.pointerId === pointerId) moveToPointer(event);
    });
    const endDrag = event => {
      if (event.pointerId !== pointerId) return;
      if (range.hasPointerCapture(pointerId)) range.releasePointerCapture(pointerId);
      pointerId = null;
    };
    range.addEventListener("pointerup", endDrag);
    range.addEventListener("pointercancel", endDrag);
    range.addEventListener("lostpointercapture", () => { pointerId = null; });
    buttons.forEach(button => button.addEventListener("click", () => setPosition(button.dataset.comparisonView)));
    const reset = () => {
      if (pointerId !== null && range.hasPointerCapture(pointerId)) range.releasePointerCapture(pointerId);
      pointerId = null;
      setPosition(stage.closest(".comparison-section").dataset.comparisonMode === "pair" ? 50 : 0);
      updateLoadState();
    };
    reset();
    return reset;
  }
  renderCmsHome(cmsData);
  window.cmsPages?.apply("home");
  resetComparison = setupComparison() || resetComparison;

  const photoCards = Array.from(document.querySelectorAll("[data-photo-card]"));
  const photoNodes = Array.from(document.querySelectorAll("[data-photo-node]"));
  const countLabel = document.querySelector("[data-selection-count]");
  const titleLabel = document.querySelector("[data-selection-title]");
  let selectedIndex = Math.max(1, Math.min(featured.length, Math.trunc(Number(cmsData?.settings?.homeDefaultIndex) || 1)));
  let activeIndex = selectedIndex;
  let scrollTargetIndex = 0;
  function scrollFrameIntoView(index) {
    const card = photoCards[index - 1];
    if (!photoStrip || !card) return;
    photoStrip.scrollTo({
      left: card.offsetLeft - (photoStrip.clientWidth - card.offsetWidth) / 2,
      behavior: window.wongMotion?.motionAllowed === false ? "auto" : "smooth"
    });
  }

  function setActiveArchive(index, shouldScroll = false) {
    if (!featured[index - 1]) return;
    activeIndex = index;
    photoCards.forEach(card => {
      const active = Number(card.dataset.index) === index;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-pressed", String(active));
    });
    photoNodes.forEach(node => {
      const active = Number(node.dataset.photoNode) === index;
      node.classList.toggle("is-active", active);
      if (active) node.setAttribute("aria-current", "true");
      else node.removeAttribute("aria-current");
    });
    const node = photoNodes[index - 1];
    if (photoIndex && node) {
      const rowRect = photoIndex.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      if (nodeRect.left < rowRect.left || nodeRect.right > rowRect.right) {
        photoIndex.scrollTo({ left: node.offsetLeft - (photoIndex.clientWidth - node.offsetWidth) / 2, behavior: "auto" });
      }
    }
    if (countLabel) countLabel.textContent = String(index).padStart(2, "0") + " / " + String(featured.length).padStart(2, "0");
    if (titleLabel) titleLabel.textContent = featured[index - 1].title || "Untitled";
    if (shouldScroll && photoStrip && (featured.length > 5 || matchMedia("(max-width: 900px)").matches)) {
      scrollTargetIndex = index;
      requestAnimationFrame(() => scrollFrameIntoView(index));
    }
  }
  function selectArchive(index) {
    if (!featured[index - 1]) return;
    selectedIndex = index;
    setActiveArchive(index, true);
    renderComparison(comparisonConfig, featured[index - 1]);
  }
  photoStrip?.addEventListener("transitionend", event => {
    if (event.propertyName === "flex-basis" && event.target.matches(".film-card.is-active")
      && scrollTargetIndex === activeIndex) {
      scrollTargetIndex = 0;
      scrollFrameIntoView(activeIndex);
    }
  });
  const engage = index => {
    photoStrip?.classList.add("is-engaged");
    setActiveArchive(index);
  };
  const restoreSelection = () => {
    photoStrip?.classList.remove("is-engaged");
    setActiveArchive(selectedIndex);
  };
  photoCards.forEach(card => {
    const index = Number(card.dataset.index);
    card.addEventListener("pointerenter", event => {
      if (event.pointerType === "mouse" && matchMedia("(hover: hover) and (pointer: fine)").matches) engage(index);
    });
    card.addEventListener("focus", () => engage(index));
    card.addEventListener("click", () => selectArchive(index));
  });
  photoStage?.addEventListener("pointerleave", () => {
    if (!photoStage.contains(document.activeElement)) restoreSelection();
  });
  photoStage?.addEventListener("focusout", event => {
    if (!photoStage.contains(event.relatedTarget)) restoreSelection();
  });
  photoNodes.forEach(node => node.addEventListener("click", () => {
    photoStrip?.classList.remove("is-engaged");
    selectArchive(Number(node.dataset.photoNode));
  }));

  function handleArchiveKeys(event) {
    if (!featured.length || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 1 : event.key === "End" ? featured.length
      : Math.min(featured.length, Math.max(1, activeIndex + (event.key === "ArrowRight" ? 1 : -1)));
    selectArchive(next);
    if (photoIndex?.contains(event.target)) photoNodes[next - 1]?.focus({ preventScroll: true });
    else photoCards[next - 1]?.focus({ preventScroll: true });
  }
  photoStage?.addEventListener("keydown", handleArchiveKeys);
  photoIndex?.addEventListener("keydown", handleArchiveKeys);
  // On touch screens, the index follows the photograph nearest the strip centre.
  let scrollTimer;
  photoStrip?.addEventListener("scroll", () => {
    if (!matchMedia("(max-width: 900px)").matches || !photoCards.length) return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const centre = photoStrip.scrollLeft + photoStrip.clientWidth / 2;
      const nearest = photoCards.reduce((best, card) =>
        Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre) < Math.abs(best.offsetLeft + best.offsetWidth / 2 - centre) ? card : best);
      selectedIndex = Number(nearest.dataset.index);
      setActiveArchive(selectedIndex);
      renderComparison(comparisonConfig, featured[selectedIndex - 1]);
    }, 140);
  }, { passive: true });
  selectArchive(selectedIndex);

  nextFrame?.addEventListener("click", () => {
    if (featured.length < 2) return;
    photoStrip?.classList.remove("is-engaged");
    selectArchive(selectedIndex % featured.length + 1);
  });
  const revealSections = document.querySelectorAll(".reveal-section");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealSections.forEach(section => observer.observe(section));
  } else revealSections.forEach(section => section.classList.add("is-visible"));

  if (hero && matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("mousemove", event => {
      if (window.wongMotion && !window.wongMotion.enabled("parallax")) return;
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty("--hero-x", ((event.clientX - rect.left) / rect.width - 0.5) * 10 + "px");
      hero.style.setProperty("--hero-y", ((event.clientY - rect.top) / rect.height - 0.5) * 6 + "px");
    });
    const reset = () => {
      hero.style.setProperty("--hero-x", "0px");
      hero.style.setProperty("--hero-y", "0px");
    };
    hero.addEventListener("mouseleave", reset);
    window.addEventListener("wong:motionchange", reset);
    window.addEventListener("blur", reset);
  }
  await window.cmsStore?.finishLoading?.();
})();
