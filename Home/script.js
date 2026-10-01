(function () {
  const cmsData = window.cmsStore?.getPublicData?.();
  const cmsRender = window.cmsRender;

  function renderCmsHome(data) {
    if (!data || !cmsRender) {
      return;
    }

    cmsRender.applySeo("home");
    cmsRender.applyChrome("home");

    const settings = data.settings || {};
    const hero = settings.homeHero || {};
    const profile = data.profile || {};
    const gallery = Array.isArray(data.gallery) ? data.gallery : [];
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const fallbackImage = cmsRender.defaultImage;
    const text = (value, fallback) => String(value || fallback || "");

    const title = document.querySelector("#home-title");
    if (title) title.textContent = text(hero.heroHeadline, title.textContent);

    const archiveMeta = document.querySelector(".archive-meta");
    if (archiveMeta) {
      const strong = archiveMeta.querySelector("strong");
      const values = archiveMeta.querySelectorAll("b");
      if (strong) strong.textContent = text(hero.archiveNo, strong.textContent);
      if (values[0]) values[0].textContent = text(hero.updated, values[0].textContent);
      if (values[1]) values[1].textContent = text(hero.basedIn || settings.globalInfo?.defaultLocation, values[1].textContent);
    }

    const introKicker = document.querySelector(".intro-kicker");
    const introRole = document.querySelector(".intro-role");
    const introCopy = document.querySelector(".intro-copy");
    const introLinks = document.querySelectorAll(".intro-actions a");
    if (introKicker) introKicker.textContent = text(profile.displayName, introKicker.textContent);
    if (introRole) introRole.textContent = text(profile.role, introRole.textContent);
    if (introCopy) introCopy.textContent = text(profile.shortIntro || hero.heroIntro, introCopy.textContent);
    if (introLinks[0]) {
      introLinks[0].href = text(hero.heroButtonLink, "../photography/index.html");
      introLinks[0].firstChild.textContent = `${text(hero.heroButtonText, "View Photography")} `;
    }
    if (introLinks[1]) introLinks[1].href = "../Contact/index.html";

    const stripItems = [
      gallery[0],
      gallery[1],
      gallery[2] || { image: hero.heroImage || profile.avatar, altText: profile.displayName },
      gallery[3],
      gallery[4],
      gallery[5],
      gallery[0]
    ].filter(Boolean);

    document.querySelectorAll("[data-photo-card]").forEach((card, index) => {
      const item = stripItems[index] || stripItems[0] || {};
      const image = card.querySelector("img");
      const meta = card.querySelector(".film-meta");
      if (image) {
        image.src = item.image || fallbackImage;
        image.alt = item.altText || item.title || "Photography archive image";
      }
      if (meta) {
        meta.textContent = [item.year, item.categoryLabel || item.category, item.title].filter(Boolean).join("  ");
      }
    });

    const grid = document.querySelector("[data-collection-grid]");
    if (grid && categories.length) {
      grid.innerHTML = categories
        .map((category, index) => {
          const active = index === 0 ? " is-active" : "";
          const image = category.coverImage || fallbackImage;
          const alt = category.coverAlt || `${category.name || "Photography"} collection preview`;
          const count = Number(category.photoCount) || gallery.filter((photo) => photo.categoryId === cmsRender.slugify(category.name)).length;
          return `
            <article class="collection-card${active}" data-collection-card data-index="${index + 1}" tabindex="0">
              <div class="collection-title">
                <span>${String(index + 1).padStart(2, "0")}</span>
                <h3>${cmsRender.escapeHtml(category.name || "Photography")}</h3>
              </div>
              <img src="${cmsRender.escapeAttr(image)}" alt="${cmsRender.escapeAttr(alt)}" width="287" height="218" loading="lazy" decoding="async" />
              <p>${cmsRender.escapeHtml(category.description || `${count} images`)}</p>
              <a href="../photography/index.html" aria-label="View ${cmsRender.escapeAttr(category.name || "photography")} collection">&rarr;</a>
            </article>
          `;
        })
        .join("");
    }
  }

  renderCmsHome(cmsData);

  const hero = document.querySelector("[data-hero]");
  const photoStage = document.querySelector(".photo-stage");
  const introCard = document.querySelector("[data-photo-tip]");
  const photoStrip = document.querySelector("[data-photo-strip]");
  const photoCards = Array.from(document.querySelectorAll("[data-photo-card]"));
  const photoNodes = Array.from(document.querySelectorAll("[data-photo-node]"));
  const collectionCards = Array.from(document.querySelectorAll("[data-collection-card]"));
  const revealSections = Array.from(document.querySelectorAll(".reveal-section"));
  const scrollButtons = Array.from(document.querySelectorAll("[data-scroll-target]"));
  const controlThumb = document.querySelector(".control-line span");

  const nodeIndexes = photoNodes.map((node) => Number(node.dataset.photoNode));
  const tipPhotoCards = photoCards.filter((card) => {
    const index = Number(card.dataset.index);
    return index > 0 && index < 6;
  });
  let activeIndex = 3;
  let photoTipHideTimer;

  function setPhotoTipVisible(isVisible) {
    if (!hero || !introCard) {
      return;
    }

    window.clearTimeout(photoTipHideTimer);
    hero.classList.toggle("is-photo-tip-visible", isVisible);

    if (isVisible) {
      introCard.removeAttribute("aria-hidden");
      introCard.removeAttribute("inert");
      return;
    }

    introCard.setAttribute("aria-hidden", "true");
    introCard.setAttribute("inert", "");
  }

  function showPhotoTip() {
    setPhotoTipVisible(true);
  }

  function queuePhotoTipHide() {
    if (!introCard) {
      return;
    }

    window.clearTimeout(photoTipHideTimer);
    photoTipHideTimer = window.setTimeout(() => {
      const activeElement = document.activeElement;
      const stillHovering = Boolean(photoStage?.matches(":hover") || introCard.matches(":hover"));
      const stillFocused = Boolean(
        activeElement && (photoStage?.contains(activeElement) || introCard.contains(activeElement))
      );

      if (!stillHovering && !stillFocused) {
        setPhotoTipVisible(false);
      }
    }, 120);
  }

  function setActiveArchive(nextIndex, shouldScroll) {
    activeIndex = nextIndex;

    photoCards.forEach((card) => {
      const isActive = Number(card.dataset.index) === activeIndex;
      card.classList.toggle("is-active", isActive);
      card.toggleAttribute("aria-selected", isActive);
    });

    photoNodes.forEach((node) => {
      const isActive = Number(node.dataset.photoNode) === activeIndex;
      node.classList.toggle("is-active", isActive);

      if (isActive) {
        node.setAttribute("aria-current", "true");
      } else {
        node.removeAttribute("aria-current");
      }
    });

    collectionCards.forEach((card) => {
      card.classList.toggle("is-active", Number(card.dataset.index) === activeIndex);
    });

    if (controlThumb && nodeIndexes.length) {
      const nodePosition = Math.max(0, nodeIndexes.indexOf(activeIndex));
      const percent = nodeIndexes.length === 1 ? 0 : (nodePosition / (nodeIndexes.length - 1)) * 15.1;
      controlThumb.style.left = `${7.2 + percent}%`;
    }

    if (shouldScroll && window.matchMedia("(max-width: 900px)").matches) {
      const activeCard = photoCards.find((card) => Number(card.dataset.index) === activeIndex);
      activeCard?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }

  photoCards.forEach((card) => {
    card.addEventListener("click", () => {
      const index = Number(card.dataset.index);

      if (index > 0 && index < 6) {
        setActiveArchive(index, true);
        showPhotoTip();
      }
    });
  });

  tipPhotoCards.forEach((card) => {
    card.addEventListener("pointerenter", showPhotoTip);
    card.addEventListener("focusin", showPhotoTip);
  });

  photoStage?.addEventListener("pointerleave", queuePhotoTipHide);
  photoStage?.addEventListener("focusin", showPhotoTip);
  photoStage?.addEventListener("focusout", queuePhotoTipHide);

  introCard?.addEventListener("pointerenter", showPhotoTip);
  introCard?.addEventListener("pointerleave", queuePhotoTipHide);
  introCard?.addEventListener("focusin", showPhotoTip);
  introCard?.addEventListener("focusout", queuePhotoTipHide);

  photoNodes.forEach((node) => {
    node.addEventListener("click", () => {
      setActiveArchive(Number(node.dataset.photoNode), true);
    });
  });

  collectionCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        return;
      }

      setActiveArchive(Number(card.dataset.index), true);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveArchive(Number(card.dataset.index), true);
      }
    });
  });

  photoStage?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const currentPosition = nodeIndexes.indexOf(activeIndex);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextPosition = Math.min(Math.max(currentPosition + direction, 0), nodeIndexes.length - 1);
    setActiveArchive(nodeIndexes[nextPosition], true);
  });

  scrollButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scrollTarget);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  if (revealSections.length && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    revealSections.forEach((section) => revealObserver.observe(section));
  } else {
    revealSections.forEach((section) => section.classList.add("is-visible"));
  }

  if (hero && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("mousemove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;

      hero.style.setProperty("--hero-x", `${x}px`);
      hero.style.setProperty("--hero-y", `${y}px`);
    });

    hero.addEventListener("mouseleave", () => {
      hero.style.setProperty("--hero-x", "0px");
      hero.style.setProperty("--hero-y", "0px");
    });
  }

  setActiveArchive(activeIndex, false);
})();
