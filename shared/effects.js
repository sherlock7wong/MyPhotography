(function () {
  "use strict";

  const DEFAULT_EFFECTS = {
    pageTransition: true,
    filmGrain: true,
    customCursor: true,
    imageHover: true,
    scrollReveal: true,
    parallax: true,
    lightbox: true,
    reducedMotionRespect: true
  };

  const EFFECT_TARGETS = [
    ".reveal-item",
    ".reveal-section",
    ".film-card:not(.film-card-ghost)",
    ".collection-card",
    ".project-card",
    ".photo-card",
    ".category-card",
    ".featured-thumb",
    ".contact-card",
    ".film-strip",
    ".film-strip figure",
    ".timeline-card",
    ".message-panel"
  ].join(",");

  const IMAGE_HOVER_TARGETS = [
    ".film-card:not(.film-card-ghost)",
    ".collection-card",
    ".project-card",
    ".photo-card",
    ".category-card",
    ".featured-thumb",
    ".contact-card",
    ".film-strip figure"
  ].join(",");

  const TILT_TARGETS = ".project-card, .contact-card, .collection-card";
  const MAGNETIC_TARGETS = ".archive-button, .submit-button, .outline-button, .primary-button, .secondary-button";
  const ACTION_TARGETS = "a, button, input, textarea, select, [role='button']";
  const IMAGE_CURSOR_TARGETS = ".film-card, .collection-card, .project-card, .photo-card, .category-card, .featured-thumb, .contact-card, .film-strip figure, .photo-frame";

  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const body = document.body;
  const effects = readEffects();
  const reducedMotion = reduceQuery.matches;
  const complexMotion = !reducedMotion;
  let revealObserver = null;
  let timelineObserver = null;
  let mutationTimer = 0;

  function readEffects() {
    const settings = window.cmsStore?.getPublicData?.().settings?.effects;
    return { ...DEFAULT_EFFECTS, ...(settings && typeof settings === "object" ? settings : {}) };
  }

  function applyEffectClasses() {
    body.classList.add("effects-ready");
    body.classList.toggle("is-reduced-motion", reducedMotion);
    body.classList.toggle("effects-film-grain", Boolean(effects.filmGrain));
    body.classList.toggle("effects-page-transition", Boolean(effects.pageTransition && complexMotion));
    body.classList.toggle("effects-cursor", Boolean(effects.customCursor && complexMotion && isFinePointer()));
    body.classList.toggle("effects-image-hover", Boolean(effects.imageHover));
    body.classList.toggle("effects-scroll-reveal", Boolean(effects.scrollReveal && complexMotion));
    body.classList.toggle("effects-parallax", Boolean(effects.parallax && complexMotion));
    body.classList.toggle("effects-tilt", Boolean(effects.imageHover && complexMotion && isFinePointer()));
    body.classList.toggle("effects-lightbox", Boolean(effects.lightbox));
  }

  function isFinePointer() {
    return window.matchMedia("(pointer: fine)").matches && window.matchMedia("(min-width: 761px)").matches;
  }

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }

    callback();
  }

  function loadPage() {
    requestAnimationFrame(() => {
      body.classList.add("is-loaded");
    });
  }

  function setupPageTransition() {
    if (!effects.pageTransition || !complexMotion) {
      return;
    }

    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const link = event.target.closest("a[href]");
      if (!link || !shouldTransition(link)) {
        return;
      }

      event.preventDefault();
      showTransitionOverlay();
      body.classList.add("is-transitioning");
      window.setTimeout(() => {
        window.location.href = link.href;
      }, 260);
    });
  }

  function showTransitionOverlay() {
    document.querySelector(".fx-transition-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.className = "fx-transition-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
  }

  function shouldTransition(link) {
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download")) return false;

    const rawHref = link.getAttribute("href") || "";
    if (!rawHref || rawHref.startsWith("#")) return false;
    if (/^(mailto:|tel:|sms:|javascript:)/i.test(rawHref)) return false;

    const targetUrl = new URL(link.href, window.location.href);
    if (targetUrl.origin !== window.location.origin) return false;

    const current = new URL(window.location.href);
    if (targetUrl.pathname === current.pathname && targetUrl.hash) return false;

    return true;
  }

  function setupReveal() {
    if (!effects.scrollReveal || !complexMotion) {
      document.querySelectorAll(EFFECT_TARGETS).forEach((node) => node.classList.add("is-visible"));
      return;
    }

    revealObserver = "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
        )
      : null;

    timelineObserver = "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              lightTimelineNode(entry.target);
            });
          },
          { threshold: 0.42 }
        )
      : null;

    prepareEffects(document);
  }

  function setupGrainOverlay() {
    if (!effects.filmGrain || document.querySelector(".fx-grain-overlay")) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "fx-grain-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
  }

  function prepareEffects(root) {
    const scope = root instanceof Element || root instanceof Document ? root : document;
    const nodes = scope.querySelectorAll ? Array.from(scope.querySelectorAll(EFFECT_TARGETS)) : [];

    if (scope instanceof Element && scope.matches(EFFECT_TARGETS)) {
      nodes.unshift(scope);
    }

    nodes.forEach((node, index) => {
      if (node.dataset.fxPrepared === "true") return;
      node.dataset.fxPrepared = "true";
      node.classList.add("effect-reveal");
      node.style.setProperty("--fx-delay", `${Math.min(index % 8, 7) * 45}ms`);
      revealObserver?.observe(node);

      if (!revealObserver) {
        node.classList.add("is-visible");
      }

      if (node.matches(".timeline-card")) {
        timelineObserver?.observe(node);
      }
    });

    decorateImageHover(scope);
    prepareTilt(scope);
  }

  function decorateImageHover(root) {
    if (!effects.imageHover) return;

    const scope = root instanceof Element || root instanceof Document ? root : document;
    const nodes = scope.querySelectorAll ? Array.from(scope.querySelectorAll(IMAGE_HOVER_TARGETS)) : [];

    if (scope instanceof Element && scope.matches(IMAGE_HOVER_TARGETS)) {
      nodes.unshift(scope);
    }

    nodes.forEach((node, index) => {
      if (!node.dataset.fxNo) {
        node.dataset.fxNo = String((index % 99) + 1).padStart(2, "0");
      }

      if (!node.matches(".film-card") && !node.querySelector(":scope > .fx-frame-label")) {
        const label = document.createElement("span");
        label.className = "fx-frame-label";
        label.setAttribute("aria-hidden", "true");
        label.textContent = `WONG / ${node.dataset.fxNo}`;
        node.appendChild(label);
      }

      if (node.matches(".film-strip figure") && !node.querySelector(":scope > .fx-light-leak")) {
        const leak = document.createElement("span");
        leak.className = "fx-light-leak";
        leak.setAttribute("aria-hidden", "true");
        node.appendChild(leak);
      }
    });
  }

  function lightTimelineNode(card) {
    const cards = Array.from(document.querySelectorAll(".timeline-card"));
    const index = cards.indexOf(card);
    if (index < 0) return;

    card.classList.add("is-lit");
    const nodes = Array.from(document.querySelectorAll(".timeline-node"));
    nodes[index]?.classList.add("is-lit");
  }

  function prepareTilt(root) {
    if (!effects.imageHover || !complexMotion || !isFinePointer()) return;

    const scope = root instanceof Element || root instanceof Document ? root : document;
    const nodes = scope.querySelectorAll ? Array.from(scope.querySelectorAll(TILT_TARGETS)) : [];

    if (scope instanceof Element && scope.matches(TILT_TARGETS)) {
      nodes.unshift(scope);
    }

    nodes.forEach((node) => {
      if (node.dataset.fxTilt === "true") return;
      node.dataset.fxTilt = "true";
      node.classList.add("tilt-card");
      node.addEventListener("pointermove", handleTiltMove);
      node.addEventListener("pointerleave", resetTilt);
      node.addEventListener("blur", resetTilt, true);
    });
  }

  function handleTiltMove(event) {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    target.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
    target.style.setProperty("--tilt-y", `${(x * 4).toFixed(2)}deg`);
    target.style.setProperty("--tilt-lift", "-2px");
    target.classList.add("is-tilting");
  }

  function resetTilt(event) {
    const target = event.currentTarget;
    target.classList.remove("is-tilting");
    target.style.setProperty("--tilt-x", "0deg");
    target.style.setProperty("--tilt-y", "0deg");
    target.style.setProperty("--tilt-lift", "0px");
  }

  function setupMagneticButtons() {
    if (!effects.imageHover || !complexMotion || !isFinePointer()) return;

    document.addEventListener("pointermove", (event) => {
      const target = event.target.closest(MAGNETIC_TARGETS);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = event.clientX - centerX;
      const distanceY = event.clientY - centerY;

      if (Math.abs(distanceX) > rect.width * 0.78 || Math.abs(distanceY) > rect.height * 1.05) {
        target.style.transform = "";
        return;
      }

      target.style.transform = `translate3d(${(distanceX * 0.06).toFixed(2)}px, ${(distanceY * 0.08).toFixed(2)}px, 0)`;
    });

    document.addEventListener("pointerout", (event) => {
      const target = event.target.closest?.(MAGNETIC_TARGETS);
      if (target) target.style.transform = "";
    });
  }

  function setupParallax() {
    if (!effects.parallax || !complexMotion || !isFinePointer()) return;

    const frames = Array.from(document.querySelectorAll(".photo-frame"));
    if (!frames.length) return;

    let ticking = false;

    function update() {
      ticking = false;
      const viewportCenter = window.innerHeight / 2;
      frames.forEach((frame) => {
        const rect = frame.getBoundingClientRect();
        const progress = (rect.top + rect.height / 2 - viewportCenter) / viewportCenter;
        const y = Math.max(-10, Math.min(10, -progress * 8));
        frame.style.setProperty("--fx-parallax-y", `${y.toFixed(2)}px`);
      });
    }

    function queue() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    frames.forEach((frame) => {
      frame.addEventListener("pointermove", (event) => {
        const rect = frame.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
        frame.style.setProperty("--fx-parallax-x", `${x.toFixed(2)}px`);
        frame.style.setProperty("--fx-parallax-y", `${y.toFixed(2)}px`);
      });
      frame.addEventListener("pointerleave", () => {
        frame.style.setProperty("--fx-parallax-x", "0px");
        queue();
      });
    });
    queue();
  }

  function setupCounters() {
    if (!complexMotion) return;

    const counters = Array.from(document.querySelectorAll(".archive-meta strong"));
    if (!counters.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries, io) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          countNode(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.7 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  function countNode(node) {
    const raw = node.textContent.trim();
    if (!/^\d+$/.test(raw)) return;

    const target = Number(raw);
    const pad = raw.length;
    const start = performance.now();
    const duration = 620;

    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = String(Math.round(target * eased)).padStart(pad, "0");
      if (progress < 1) requestAnimationFrame(frame);
    }

    node.textContent = "0".padStart(pad, "0");
    requestAnimationFrame(frame);
  }

  function setupLetterReveal() {
    if (!complexMotion) return;

    const title = document.querySelector(".hero-title");
    if (!title || title.dataset.fxLetterized === "true") return;

    const text = title.textContent || "";
    title.textContent = "";
    title.classList.add("fx-letterized");
    title.dataset.fxLetterized = "true";

    Array.from(text).forEach((char, index) => {
      const span = document.createElement("span");
      span.className = "fx-char";
      span.style.setProperty("--fx-char-index", String(index));
      span.textContent = char === " " ? "\u00a0" : char;
      title.appendChild(span);
    });
  }

  function setupCursor() {
    if (!effects.customCursor || !complexMotion || !isFinePointer()) return;

    const cursor = document.createElement("div");
    cursor.className = "wong-viewfinder-cursor";
    cursor.innerHTML = "<span></span>";
    document.body.appendChild(cursor);

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let ticking = false;

    function render() {
      ticking = false;
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      if (Math.abs(targetX - currentX) > 0.2 || Math.abs(targetY - currentY) > 0.2) {
        requestAnimationFrame(render);
        ticking = true;
      }
    }

    document.addEventListener("pointermove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      const overImage = Boolean(event.target.closest(IMAGE_CURSOR_TARGETS));
      cursor.classList.add("is-visible");
      cursor.classList.toggle("is-image", overImage);
      cursor.classList.toggle("is-action", !overImage && Boolean(event.target.closest(ACTION_TARGETS)));

      if (!ticking) {
        ticking = true;
        requestAnimationFrame(render);
      }
    }, { passive: true });

    document.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-visible");
    });
  }

  function setupFeaturedDrag() {
    const rail = document.querySelector("[data-featured-rail]");
    if (!rail || !complexMotion) return;

    let startX = 0;
    let startLeft = 0;
    let pointerId = null;
    let dragged = false;

    rail.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startLeft = rail.scrollLeft;
      dragged = false;
      rail.classList.add("is-dragging");
      rail.setPointerCapture(pointerId);
    });

    rail.addEventListener("pointermove", (event) => {
      if (pointerId !== event.pointerId) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 4) dragged = true;
      rail.scrollLeft = startLeft - delta;
    });

    rail.addEventListener("pointerup", endDrag);
    rail.addEventListener("pointercancel", endDrag);
    rail.addEventListener("click", (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    }, true);

    function endDrag(event) {
      if (pointerId === event.pointerId) {
        rail.releasePointerCapture?.(pointerId);
        pointerId = null;
      }
      rail.classList.remove("is-dragging");
    }
  }

  function setupLightbox() {
    if (!effects.lightbox || !document.querySelector(".photography-page")) return;

    const lightbox = document.createElement("div");
    lightbox.className = "photo-lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Photography image preview");
    lightbox.innerHTML = `
      <button class="photo-lightbox__close" type="button" aria-label="Close image preview">x</button>
      <button class="photo-lightbox__nav photo-lightbox__prev" type="button" aria-label="Previous image">&lt;</button>
      <figure>
        <img src="" alt="" />
        <figcaption></figcaption>
      </figure>
      <button class="photo-lightbox__nav photo-lightbox__next" type="button" aria-label="Next image">&gt;</button>
      <p class="photo-lightbox__count" aria-live="polite"></p>
    `;
    document.body.appendChild(lightbox);

    const closeButton = lightbox.querySelector(".photo-lightbox__close");
    const prevButton = lightbox.querySelector(".photo-lightbox__prev");
    const nextButton = lightbox.querySelector(".photo-lightbox__next");
    const image = lightbox.querySelector("img");
    const caption = lightbox.querySelector("figcaption");
    const count = lightbox.querySelector(".photo-lightbox__count");
    let items = [];
    let activeIndex = 0;
    let lastFocus = null;

    document.addEventListener("click", (event) => {
      const clickedImage = event.target.closest(".gallery-grid .photo-card-image img, .featured-rail .featured-thumb img, .detail-panel > img");
      if (!clickedImage) return;

      event.preventDefault();
      event.stopPropagation();
      items = collectLightboxItems(clickedImage);
      activeIndex = Math.max(0, items.findIndex((item) => item.src === clickedImage.currentSrc || item.src === clickedImage.src));
      openLightbox();
    }, true);

    closeButton.addEventListener("click", closeLightbox);
    prevButton.addEventListener("click", () => moveLightbox(-1));
    nextButton.addEventListener("click", () => moveLightbox(1));
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
      if (event.key === "Tab") trapFocus(event, lightbox);
    });

    function collectLightboxItems(sourceImage) {
      const galleryItems = Array.from(document.querySelectorAll(".gallery-grid .photo-card")).map(itemFromCard).filter(Boolean);
      const sourceCard = sourceImage.closest(".photo-card");
      if (sourceCard && galleryItems.length) return galleryItems;

      const featuredItems = Array.from(document.querySelectorAll(".featured-rail .featured-thumb")).map(itemFromCard).filter(Boolean);
      if (sourceImage.closest(".featured-thumb") && featuredItems.length) return featuredItems;

      return [{
        src: sourceImage.currentSrc || sourceImage.src,
        alt: sourceImage.alt || "Photography image",
        title: document.querySelector("[data-detail-title]")?.textContent?.trim() || sourceImage.alt || "Photography"
      }];
    }

    function itemFromCard(card) {
      const img = card.querySelector("img");
      if (!img) return null;
      const title = card.querySelector(".photo-card-title")?.textContent?.trim()
        || card.getAttribute("aria-label")
        || img.alt
        || "Photography";
      const meta = card.querySelector(".photo-card-meta")?.textContent?.trim() || "";
      return {
        src: img.currentSrc || img.src,
        alt: img.alt || title,
        title,
        meta
      };
    }

    function openLightbox() {
      if (!items.length) return;
      lastFocus = document.activeElement;
      renderLightbox();
      lightbox.hidden = false;
      lightbox.classList.add("is-open");
      document.documentElement.style.overflow = "hidden";
      closeButton.focus({ preventScroll: true });
    }

    function closeLightbox() {
      lightbox.hidden = true;
      lightbox.classList.remove("is-open");
      document.documentElement.style.overflow = "";
      lastFocus?.focus?.({ preventScroll: true });
    }

    function moveLightbox(direction) {
      if (!items.length) return;
      activeIndex = (activeIndex + direction + items.length) % items.length;
      renderLightbox();
    }

    function renderLightbox() {
      const item = items[activeIndex];
      image.src = item.src;
      image.alt = item.alt;
      caption.textContent = [item.title, item.meta].filter(Boolean).join(" / ");
      count.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    }
  }

  function setupAdminAccess() {
    if (document.querySelector(".admin-access-link")) {
      return;
    }

    const path = window.location.pathname.toLowerCase();
    if (path.includes("/admin/") || path.includes("/adminlogin/")) {
      return;
    }

    const link = document.createElement("a");
    link.className = "admin-access-link";
    link.href = "../AdminLogin/index.html";
    link.setAttribute("aria-label", "Open admin login");
    link.textContent = "CMS";
    document.body.appendChild(link);
  }

  function trapFocus(event, root) {
    const focusable = Array.from(root.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
      .filter((node) => !node.disabled && !node.hidden);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!mutations.some((mutation) => mutation.addedNodes.length)) return;
      window.clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(() => prepareEffects(document), 40);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  applyEffectClasses();

  ready(() => {
    loadPage();
    setupGrainOverlay();
    setupPageTransition();
    setupLetterReveal();
    setupReveal();
    setupCounters();
    setupParallax();
    setupCursor();
    setupMagneticButtons();
    setupFeaturedDrag();
    setupLightbox();
    setupAdminAccess();
    setupMutationObserver();
  });
})();
