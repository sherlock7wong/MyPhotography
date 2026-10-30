/* WonG public-site motion. No paid service or animation dependency. */
(function () {
  "use strict";
  if (window.wongEffectsReady || !document.body) return;
  window.wongEffectsReady = true;
  const body = document.body;
  const motion = window.wongMotion;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine) and (min-width: 761px)");
  const defaults = { pageTransition: true, filmGrain: true, customCursor: true, imageHover: true, scrollReveal: true, parallax: true, lightbox: true, reducedMotionRespect: true };
  let effects = readEffects();
  let revealObserver;
  let firstPreparation = true;
  let resetPointer = () => {};
  let resetInteractions = () => {};
  const revealSelector = ".reveal-item,.reveal-section,.collection-card,.project-card,.photo-card,.category-card,.featured-thumb,.contact-card,.film-strip,.timeline-card,.message-panel";
  const imageSelector = ".film-card:not(.film-card-ghost),.collection-card,.project-card,.photo-card,.category-card,.featured-thumb,.contact-card,.film-strip figure,.photo-frame";
  const magnetSelector = ".archive-button,.submit-button,.outline-button,.primary-button,.secondary-button";
  const excluded = "input,textarea,select,[contenteditable]:not([contenteditable='false']),.fx-preferences,.photo-lightbox,.admin-access-link";
  const enabled = (name) => effects[name] !== false && (motion ? motion.motionAllowed : !matchMedia("(prefers-reduced-motion: reduce)").matches);
  const strength = () => motion?.strength || 1;

  function readEffects() {
    try { return { ...defaults, ...window.cmsStore?.getPublicData()?.settings?.effects }; }
    catch (_) { return { ...defaults }; }
  }

  function applySettings() {
    effects = readEffects();
    body.classList.add("effects-ready", "is-loaded");
    body.classList.toggle("is-reduced-motion", motion ? !motion.motionAllowed : matchMedia("(prefers-reduced-motion: reduce)").matches);
    for (const [name, suffix] of Object.entries({ pageTransition: "page-transition", filmGrain: "film-grain", customCursor: "cursor", imageHover: "image-hover", scrollReveal: "scroll-reveal", parallax: "parallax", lightbox: "lightbox" })) {
      body.classList.toggle("effects-" + suffix, enabled(name));
    }
    if (!enabled("scrollReveal")) document.querySelectorAll(".fx-reveal").forEach((node) => node.classList.add("is-visible"));
    if (!enabled("customCursor") || !finePointer.matches) resetPointer();
    if (!enabled("imageHover") || !finePointer.matches) resetInteractions();
    document.querySelector(".fx-preferences")?.dispatchEvent(new Event("wong:refresh"));
  }

  function setupReveal() {
    if ("IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -24px" });
    }
    prepare(document);
    firstPreparation = false;
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (!(node instanceof Element) || node.closest("[data-fx-ui]")) return;
        prepare(node);
      }));
      prepareDetailImage();
    });
    observer.observe(body, { childList: true, subtree: true });
  }

  function matching(root, selector) {
    return [...(root instanceof Element && root.matches(selector) ? [root] : []), ...root.querySelectorAll(selector)];
  }

  function prepare(root) {
    matching(root, imageSelector).forEach((node) => {
      if (node.dataset.fxImage) return;
      node.dataset.fxImage = "true";
      node.classList.add("fx-image");
      if (!node.querySelector(":scope > .fx-focus-corners")) {
        const corners = document.createElement("span");
        corners.className = "fx-focus-corners";
        corners.setAttribute("aria-hidden", "true");
        corners.dataset.fxUi = "";
        node.appendChild(corners);
      }
    });
    matching(root, revealSelector).forEach((node, index) => {
      if (node.dataset.fxReveal) return;
      node.dataset.fxReveal = "true";
      node.classList.add("fx-takeover");
      if (node.parentElement?.closest(".fx-reveal")) {
        node.classList.add("is-visible");
        return;
      }
      node.classList.add("fx-reveal");
      node.style.setProperty("--fx-stagger", Math.min(index % 6, 5) * 55 + "ms");
      if (!firstPreparation || !enabled("scrollReveal") || !revealObserver) node.classList.add("is-visible");
      else revealObserver.observe(node);
    });
  }

  function setupAtmosphere() {
    const grain = document.createElement("div");
    grain.className = "fx-grain";
    grain.dataset.fxUi = "";
    grain.setAttribute("aria-hidden", "true");
    body.appendChild(grain);
    const progress = document.createElement("div");
    progress.className = "fx-reading-progress";
    progress.dataset.fxUi = "";
    progress.setAttribute("aria-hidden", "true");
    body.appendChild(progress);
    if (!CSS.supports("animation-timeline: scroll()")) {
      let frame = 0;
      const update = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const distance = document.documentElement.scrollHeight - innerHeight;
          progress.style.setProperty("--reading-progress", String(distance > 0 ? scrollY / distance : 0));
        });
      };
      addEventListener("scroll", update, { passive: true });
      addEventListener("resize", update, { passive: true });
      update();
    }
  }

  function setupPointer() {
    const canvas = document.createElement("canvas");
    canvas.className = "wong-trail";
    canvas.dataset.fxUi = "";
    canvas.setAttribute("aria-hidden", "true");
    const dot = document.createElement("span");
    dot.className = "wong-pointer-dot";
    dot.dataset.fxUi = "";
    dot.setAttribute("aria-hidden", "true");
    body.append(canvas, dot);
    const context = canvas.getContext("2d");
    if (!context) return;
    const points = Array.from({ length: 12 }, () => ({ x: 0, y: 0 }));
    let frame = 0;
    let lastMove = 0;
    let previousTime = 0;
    let targetX = 0;
    let targetY = 0;
    let present = false;
    function resize() {
      reset();
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(innerWidth * ratio);
      canvas.height = Math.round(innerHeight * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastMove = 0;
      previousTime = 0;
      present = false;
      context.clearRect(0, 0, innerWidth, innerHeight);
      canvas.dataset.active = "false";
      dot.style.opacity = "0";
      body.style.removeProperty("--fx-light-x");
      body.style.removeProperty("--fx-light-y");
    }
    function draw(time) {
      frame = 0;
      const age = time - lastMove;
      if (!present || age >= 700 || !enabled("customCursor") || !finePointer.matches || document.hidden) { reset(); return; }
      const elapsed = previousTime ? Math.min((time - previousTime) / 16.667, 3) : 1;
      previousTime = time;
      const follow = 1 - Math.pow(1 - 0.35, elapsed);
      points[0].x = targetX;
      points[0].y = targetY;
      for (let i = 1; i < points.length; i++) {
        const previous = points[i - 1];
        const point = points[i];
        point.x += (previous.x - point.x) * follow;
        point.y += (previous.y - point.y) * follow;
        const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
        if (distance > 12) {
          point.x = previous.x + (point.x - previous.x) * 12 / distance;
          point.y = previous.y + (point.y - previous.y) * 12 / distance;
        }
      }
      context.clearRect(0, 0, innerWidth, innerHeight);
      const fade = Math.max(0, 1 - age / 650);
      context.lineWidth = 1.7;
      context.lineCap = "round";
      context.lineJoin = "round";
      for (let i = points.length - 1; i > 0; i--) {
        context.strokeStyle = "rgba(101,108,72," + (0.6 * fade * (1 - i / points.length)) + ")";
        context.beginPath();
        context.moveTo(points[i].x, points[i].y);
        context.lineTo(points[i - 1].x, points[i - 1].y);
        context.stroke();
      }
      dot.style.transform = "translate3d(" + targetX + "px," + targetY + "px,0)";
      dot.style.opacity = String(0.8 * fade);
      if (enabled("parallax")) {
        body.style.setProperty("--fx-light-x", targetX + "px");
        body.style.setProperty("--fx-light-y", targetY + "px");
      }
      frame = requestAnimationFrame(draw);
    }
    document.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || !finePointer.matches || !enabled("customCursor") || event.target.closest(excluded)) { reset(); return; }
      targetX = event.clientX;
      targetY = event.clientY;
      if (!present) points.forEach((point) => { point.x = targetX; point.y = targetY; });
      present = true;
      lastMove = performance.now();
      canvas.dataset.active = "true";
      if (!frame) frame = requestAnimationFrame(draw);
    }, { passive: true });
    document.addEventListener("focusin", (event) => { if (event.target.closest(excluded)) reset(); });
    document.documentElement.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", () => { if (document.hidden) reset(); });
    addEventListener("blur", reset);
    addEventListener("pagehide", reset);
    addEventListener("pageswap", reset);
    addEventListener("resize", resize, { passive: true });
    finePointer.addEventListener("change", reset);
    resetPointer = reset;
    resize();
  }

  function setupInteractions() {
    let card;
    let magnet;
    let frame = 0;
    let point;
    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (card) { card.style.removeProperty("--fx-tilt-x"); card.style.removeProperty("--fx-tilt-y"); card.style.removeProperty("--fx-card-x"); card.style.removeProperty("--fx-card-y"); }
      if (magnet) { magnet.style.removeProperty("--fx-magnet-x"); magnet.style.removeProperty("--fx-magnet-y"); magnet.classList.remove("fx-magnet"); }
      card = null;
      magnet = null;
    };
    resetInteractions = clear;
    document.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || !finePointer.matches || !enabled("imageHover") || event.target.closest(excluded)) { clear(); return; }
      const nextCard = event.target.closest(imageSelector);
      const nextMagnet = event.target.closest(magnetSelector);
      if (nextCard !== card || nextMagnet !== magnet) clear();
      card = nextCard;
      magnet = nextMagnet;
      point = { x: event.clientX, y: event.clientY };
      if (frame || (!card && !magnet)) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (card?.isConnected) {
          const rect = card.getBoundingClientRect();
          const x = (point.x - rect.left) / rect.width - 0.5;
          const y = (point.y - rect.top) / rect.height - 0.5;
          card.style.setProperty("--fx-card-x", ((x + 0.5) * 100) + "%");
          card.style.setProperty("--fx-card-y", ((y + 0.5) * 100) + "%");
          // Individual rotate composes with the page's original film-strip transform.
          card.style.setProperty("--fx-tilt-x", (-y * 0.9 * strength()) + "deg");
          card.style.setProperty("--fx-tilt-y", (x * 0.9 * strength()) + "deg");
        }
        if (magnet?.isConnected) {
          const rect = magnet.getBoundingClientRect();
          magnet.classList.add("fx-magnet");
          magnet.style.setProperty("--fx-magnet-x", ((point.x - rect.left - rect.width / 2) * 0.075 * strength()) + "px");
          magnet.style.setProperty("--fx-magnet-y", ((point.y - rect.top - rect.height / 2) * 0.075 * strength()) + "px");
        }
      });
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", clear);
    addEventListener("blur", clear);
    document.addEventListener("click", (event) => {
      const target = event.target.closest("a,button");
      if (!target || target.closest(excluded) || !enabled("imageHover") || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (!event.detail) return;
      const rect = target.getBoundingClientRect();
      const ring = document.createElement("span");
      ring.className = "fx-click-ring";
      ring.dataset.fxUi = "";
      ring.setAttribute("aria-hidden", "true");
      ring.style.left = event.clientX + "px";
      ring.style.top = event.clientY + "px";
      body.appendChild(ring);
      const animation = ring.animate([{ opacity: 0.5, scale: "0.35" }, { opacity: 0, scale: "1.5" }], { duration: 440, easing: "cubic-bezier(.16,1,.3,1)" });
      animation.finished.catch(() => {}).finally(() => ring.remove());
      if (rect.width < 300 && rect.height < 120) target.animate([{ scale: "1" }, { scale: "0.975", offset: 0.35 }, { scale: "1" }], { duration: 240, easing: "ease-out" });
    }, true);
  }

  function setupNavigation() {
    const key = "wong.motion.shared-image";
    let namedImage;
    const clearName = () => {
      if (namedImage?.isConnected) namedImage.style.removeProperty("view-transition-name");
      namedImage = null;
    };
    const eligible = (link, event) => {
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.download || (link.target && link.target !== "_self")) return false;
      const url = new URL(link.href, location.href);
      return url.origin === location.origin && /^https?:$/.test(url.protocol) && url.pathname !== location.pathname;
    };
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!eligible(link, event) || !enabled("pageTransition")) return;
      clearName();
      const image = link.querySelector("img") || link.closest(".collection-card,.project-card")?.querySelector("img");
      if (image && motion?.preferences.transition === "shared") {
        namedImage = image;
        image.style.viewTransitionName = "wong-shared-photo";
        try { sessionStorage.setItem(key, JSON.stringify({ src: image.currentSrc || image.src, destination: new URL(link.href, location.href).href, time: Date.now() })); } catch (_) {}
      } else {
        try { sessionStorage.removeItem(key); } catch (_) {}
      }
      resetPointer();
      resetInteractions();
      // Navigation remains native: no preventDefault, timers or fullscreen mask.
    });
    const receiveImage = () => {
      if (!enabled("pageTransition") || motion?.preferences.transition !== "shared") return;
      let record;
      try { record = JSON.parse(sessionStorage.getItem(key) || "null"); } catch (_) { return; }
      if (!record || Date.now() - record.time > 10000 || record.destination !== location.href) return;
      namedImage = Array.from(document.images).find((image) => (image.currentSrc || image.src) === record.src && image.getBoundingClientRect().width > 0);
      if (namedImage) namedImage.style.viewTransitionName = "wong-shared-photo";
      try { sessionStorage.removeItem(key); } catch (_) {}
    };
    addEventListener("pagereveal", (event) => {
      // Match after the destination document is laid out, before its first transition frame.
      // Consuming this record during script evaluation can miss the visible CMS image.
      if (event.viewTransition) {
        receiveImage();
        event.viewTransition.ready.catch(() => {}).finally(clearName);
      } else clearName();
    });
    addEventListener("pageswap", (event) => {
      resetPointer();
      resetInteractions();
      event.viewTransition?.finished.catch(() => {}).finally(clearName);
    });
    addEventListener("pageshow", (event) => {
      body.classList.add("is-loaded");
      body.classList.remove("is-transitioning");
      if (event.persisted && !document.activeViewTransition) clearName();
    });
  }

  function setupFeaturedDrag() {
    const rail = document.querySelector("[data-featured-rail]");
    if (!rail) return;
    let active;
    let dragged = false;
    rail.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      active = { id: event.pointerId, x: event.clientX, scroll: rail.scrollLeft };
      dragged = false;
    });
    rail.addEventListener("pointermove", (event) => {
      if (!active || event.pointerId !== active.id) return;
      const distance = event.clientX - active.x;
      if (!dragged && Math.abs(distance) > 5) {
        dragged = true;
        rail.setPointerCapture(event.pointerId);
        rail.classList.add("is-dragging");
      }
      if (dragged) { event.preventDefault(); rail.scrollLeft = active.scroll - distance; }
    });
    const end = () => {
      if (active && rail.hasPointerCapture(active.id)) rail.releasePointerCapture(active.id);
      active = null;
      rail.classList.remove("is-dragging");
    };
    rail.addEventListener("pointerup", end);
    rail.addEventListener("pointercancel", end);
    rail.addEventListener("lostpointercapture", end);
    rail.addEventListener("click", (event) => {
      if (dragged) { event.preventDefault(); event.stopImmediatePropagation(); dragged = false; }
    }, true);
    rail.addEventListener("dragstart", (event) => event.preventDefault());
  }

  let prepareDetailImage = () => {};
  function setupLightbox() {
    const source = document.querySelector("[data-detail-image]");
    if (!source || typeof HTMLDialogElement === "undefined") return;
    const panel = source.closest(".detail-panel");
    if (!panel) return;
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "fx-open-photo";
    trigger.textContent = "查看大图 ↗";
    trigger.setAttribute("aria-haspopup", "dialog");
    source.insertAdjacentElement("afterend", trigger);
    const dialog = document.createElement("dialog");
    dialog.className = "photo-lightbox";
    dialog.dataset.fxUi = "";
    dialog.setAttribute("aria-label", "照片大图预览");
    dialog.innerHTML = '<button type="button" class="photo-lightbox__close" aria-label="关闭大图">关闭 ×</button><figure class="photo-lightbox__figure"><img class="photo-lightbox__image" alt="" /><figcaption class="photo-lightbox__caption"></figcaption></figure><div class="photo-lightbox__controls"><button type="button" class="photo-lightbox__prev" aria-label="上一张照片">←</button><span class="photo-lightbox__count" aria-live="polite"></span><button type="button" class="photo-lightbox__next" aria-label="下一张照片">→</button></div>';
    body.appendChild(dialog);
    const image = dialog.querySelector("img");
    const caption = dialog.querySelector("figcaption");
    const count = dialog.querySelector(".photo-lightbox__count");
    const close = dialog.querySelector(".photo-lightbox__close");
    const figure = dialog.querySelector(".photo-lightbox__figure");
    let filmFrame;
    let filmTitle;
    if (document.querySelector("main#photography")) {
      dialog.dataset.photoFrame = "film";
      filmFrame = document.createElement("div");
      filmFrame.className = "photo-lightbox__film";
      image.before(filmFrame);
      filmFrame.appendChild(image);
      const brandMark = document.createElement("span");
      brandMark.className = "photo-lightbox__film-brand";
      brandMark.setAttribute("aria-hidden", "true");
      brandMark.textContent = (document.querySelector(".brand")?.textContent?.trim() || "Photography") + " · Archive";
      filmTitle = document.createElement("span");
      filmTitle.className = "photo-lightbox__film-title";
      filmTitle.setAttribute("aria-hidden", "true");
      filmFrame.append(brandMark, filmTitle);
    }
    let items = [];
    let index = 0;
    let openingFocus;
    let animation;
    let request = 0;
    let closing = false;

    prepareDetailImage = () => {
      trigger.hidden = effects.lightbox === false;
      source.classList.toggle("fx-expandable", effects.lightbox !== false);
    };
    function collect() {
      const nodes = Array.from(document.querySelectorAll(".gallery-grid .photo-card-image img,.photo-grid .photo-image img"));
      const seen = new Set();
      items = nodes.map((node) => ({
        id: node.closest(".photo-card")?.dataset.photoId,
        src: node.currentSrc || node.src,
        alt: node.alt,
        title: node.closest(".photo-card")?.querySelector(".photo-card-title,.photo-title")?.textContent || node.alt
      })).filter((item) => !seen.has(item.src) && seen.add(item.src));
      const src = source.currentSrc || source.src;
      const selectedId = document.querySelector(".photo-card.is-active")?.dataset.photoId;
      index = items.findIndex((item) => selectedId ? item.id === selectedId : item.src === src);
      if (index < 0) { items.unshift({ src, alt: source.alt, title: source.alt }); index = 0; }
      else items[index] = { ...items[index], src, alt: source.alt };
    }
    function render() {
      const item = items[index];
      image.src = item.src;
      image.alt = item.alt || item.title;
      caption.textContent = item.title;
      if (filmTitle) filmTitle.textContent = "Photography / " + item.title;
      fitFilmFrame();
      count.textContent = (index + 1) + " / " + items.length;
      dialog.querySelector(".photo-lightbox__prev").disabled = items.length < 2;
      dialog.querySelector(".photo-lightbox__next").disabled = items.length < 2;
    }
    function fitFilmFrame() {
      if (!filmFrame || !dialog.open || !image.naturalWidth || !image.naturalHeight) return;
      const rect = figure.getBoundingClientRect();
      const frameStyle = getComputedStyle(filmFrame);
      const value = key => parseFloat(frameStyle[key]) || 0;
      const insetX = value("paddingLeft") + value("paddingRight") + value("borderLeftWidth") + value("borderRightWidth");
      const insetY = value("paddingTop") + value("paddingBottom") + value("borderTopWidth") + value("borderBottomWidth");
      const gap = parseFloat(getComputedStyle(figure).rowGap) || 0;
      const width = Math.max(1, rect.width - insetX);
      const height = Math.max(1, rect.height - caption.getBoundingClientRect().height - gap - insetY);
      const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      filmFrame.style.width = Math.floor(image.naturalWidth * ratio + insetX) + "px";
      filmFrame.style.height = Math.floor(image.naturalHeight * ratio + insetY) + "px";
    }
    if (filmFrame) {
      image.addEventListener("load", fitFilmFrame);
      addEventListener("resize", () => {
        if (!dialog.open) return;
        animation?.cancel();
        requestAnimationFrame(fitFilmFrame);
      });
      if ("ResizeObserver" in window) {
        const filmLayoutObserver = new ResizeObserver(fitFilmFrame);
        filmLayoutObserver.observe(figure);
        filmLayoutObserver.observe(caption);
      }
    }
    function fittedImageRect() {
      const rect = image.getBoundingClientRect();
      const ratio = Math.min(rect.width / (image.naturalWidth || 1), rect.height / (image.naturalHeight || 1));
      const width = image.naturalWidth * ratio;
      const height = image.naturalHeight * ratio;
      return { left: rect.left + (rect.width - width) / 2, top: rect.top + (rect.height - height) / 2, width, height };
    }
    async function morph(from, to) {
      animation?.cancel();
      if (!enabled("lightbox") || !from.width || !to.width) return;
      const clone = document.createElement("img");
      clone.className = "fx-photo-morph";
      clone.src = image.currentSrc || image.src;
      clone.alt = "";
      clone.setAttribute("aria-hidden", "true");
      Object.assign(clone.style, { left: from.left + "px", top: from.top + "px", width: from.width + "px", height: from.height + "px" });
      dialog.appendChild(clone);
      image.style.visibility = "hidden";
      const current = clone.animate([
        { left: from.left + "px", top: from.top + "px", width: from.width + "px", height: from.height + "px", borderRadius: "6px" },
        { left: to.left + "px", top: to.top + "px", width: to.width + "px", height: to.height + "px", borderRadius: "2px" }
      ], { duration: motion?.duration || 620, easing: "cubic-bezier(.22,.8,.2,1)", fill: "both" });
      animation = current;
      try { await current.finished; } catch (_) {}
      clone.remove();
      if (animation === current) {
        image.style.removeProperty("visibility");
        animation = null;
      }
    }
    async function open() {
      if (effects.lightbox === false || panel.hidden || dialog.open) return;
      const token = ++request;
      collect();
      render();
      try { await image.decode(); } catch (_) {}
      if (token !== request || !source.isConnected || panel.hidden || effects.lightbox === false) return;
      const from = source.getBoundingClientRect();
      openingFocus = document.activeElement;
      dialog.showModal();
      fitFilmFrame();
      body.classList.add("has-photo-lightbox");
      close.focus({ preventScroll: true });
      await new Promise(requestAnimationFrame);
      if (dialog.open && token === request) morph(from, fittedImageRect());
      resetPointer();
    }
    async function hide() {
      if (!dialog.open || closing) return;
      closing = true;
      ++request;
      const samePhoto = (source.currentSrc || source.src) === (image.currentSrc || image.src) && !panel.hidden;
      if (samePhoto) await morph(fittedImageRect(), source.getBoundingClientRect());
      else if (enabled("lightbox")) await dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180 }).finished.catch(() => {});
      dialog.close();
      closing = false;
    }
    function move(direction) {
      if (closing || !items.length) return;
      ++request;
      animation?.cancel();
      index = (index + direction + items.length) % items.length;
      render();
      if (enabled("lightbox")) image.animate([{ opacity: 0.25, translate: (direction * 12) + "px 0" }, { opacity: 1, translate: "0 0" }], { duration: 280, easing: "ease-out" });
    }
    trigger.addEventListener("click", open);
    source.addEventListener("click", open);
    close.addEventListener("click", hide);
    dialog.querySelector(".photo-lightbox__prev").addEventListener("click", () => move(-1));
    dialog.querySelector(".photo-lightbox__next").addEventListener("click", () => move(1));
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); hide(); });
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); hide(); }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); event.stopPropagation(); move(event.key === "ArrowLeft" ? -1 : 1); }
    }, true);
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.querySelector("figure").getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) hide();
    });
    dialog.addEventListener("close", () => {
      ++request;
      animation?.cancel();
      body.classList.remove("has-photo-lightbox");
      openingFocus?.isConnected && openingFocus.focus({ preventScroll: true });
    });
    addEventListener("wong:motionchange", () => {
      prepareDetailImage();
      if (!enabled("lightbox")) animation?.cancel();
      if (effects.lightbox === false && dialog.open) dialog.close();
    });
    prepareDetailImage();
  }

  function setupPreferences() {
    if (!motion) return;
    const panel = document.createElement("details");
    panel.className = "fx-preferences";
    panel.dataset.fxUi = "";
    panel.innerHTML = '<summary>动效设置</summary><div class="fx-preferences__body"><label>动效强度<select data-motion-intensity><option value="quiet">安静</option><option value="standard">标准</option><option value="immersive">沉浸</option></select></label><label>页面转场<select data-motion-transition><option value="shared">照片连续</option><option value="iris">光圈展开</option><option value="curtain">幕布揭示</option></select></label><label class="fx-preferences__reduce"><input type="checkbox" data-motion-reduce />减少动态</label><p data-motion-status></p></div>';
    body.appendChild(panel);
    const intensity = panel.querySelector("[data-motion-intensity]");
    const transition = panel.querySelector("[data-motion-transition]");
    const reduce = panel.querySelector("[data-motion-reduce]");
    const status = panel.querySelector("[data-motion-status]");
    const refresh = () => {
      const preferences = motion.preferences;
      intensity.value = preferences.intensity;
      transition.value = preferences.transition;
      reduce.checked = preferences.reduce;
      reduce.disabled = motion.systemReduced;
      status.textContent = motion.systemReduced ? "已遵循系统的减少动态设置。" : preferences.reduce ? "已关闭移动、转场与尾迹。" : "选择会保存在当前浏览器。";
    };
    intensity.addEventListener("change", () => motion.setPreferences({ intensity: intensity.value }));
    transition.addEventListener("change", () => motion.setPreferences({ transition: transition.value }));
    reduce.addEventListener("change", () => motion.setPreferences({ reduce: reduce.checked }));
    panel.addEventListener("wong:refresh", refresh);
    refresh();
  }

  function setupAdminAccess() {
    if (document.querySelector(".admin-access-link") || /\/admin(?:login)?\//i.test(location.pathname)) return;
    const link = document.createElement("a");
    link.className = "admin-access-link";
    link.href = "/admin/index.html";
    link.setAttribute("aria-label", "Open admin login");
    link.textContent = "CMS";
    body.appendChild(link);
  }

  motion?.applySettings(effects);
  applySettings();
  addEventListener("wong:motionchange", applySettings);
  addEventListener("wong:cmsready", () => { effects=readEffects(); if(motion) motion.applySettings(effects); else applySettings(); });
  setupAtmosphere();
  setupPointer();
  setupInteractions();
  setupNavigation();
  setupFeaturedDrag();
  setupLightbox();
  setupPreferences();
  setupAdminAccess();
  setupReveal();
  finePointer.addEventListener("change", applySettings);
  addEventListener("focus", () => {
    effects = readEffects();
    motion?.applySettings(effects);
    applySettings();
  });
})();
