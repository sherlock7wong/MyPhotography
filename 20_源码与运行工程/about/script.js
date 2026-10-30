(async function () {
  let dateTimer;
  function updateCurrentDate() {
    const now = new Date();
    const time = document.querySelector("[data-about-current-date]");
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

  if ((await window.cmsStore?.ready) === false) return;
  const cmsData = window.cmsStore?.getPublicData?.();
  const cmsRender = window.cmsRender;

  function renderCmsAbout(data) {
    if (!data || !cmsRender) {
      return;
    }

    cmsRender.applySeo("about", {
      ogImage: data.profile?.avatar || "Image/about-portrait-crop.png"
    });
    cmsRender.applyChrome("about");

    const profile = data.profile || {};
    const settings = data.settings || {};
    const profileLocation = profile.location ?? settings.globalInfo?.defaultLocation ?? "";
    const fallbackImage = profile.avatar || (window.cmsStore?.mode === "cloud" ? "" : "Image/about-portrait-crop.png");
    const photo = document.querySelector(".archive-photo img");
    if (photo) {
      if (fallbackImage) photo.src = fallbackImage;
      else photo.removeAttribute("src");
      photo.hidden = !fallbackImage;
      photo.alt = `${profile.displayName || "WonG"} portrait`;
    }

    const archiveMeta = document.querySelector(".archive-meta");
    if (archiveMeta) {
      const values = archiveMeta.querySelectorAll("b");
      if (values[1]) values[1].textContent = profileLocation || "To be added";
    }

    const details = [
      ["Name", profile.displayName],
      ["Role", profile.role],
      ["Location", profileLocation],
      ["Availability", profile.availability],
      ["Email", profile.email]
    ];
    const infoList = document.querySelector(".info-list");
    if (infoList) {
      infoList.innerHTML = details
        .map(([label, value]) => {
          const safe = cmsRender.escapeHtml(value || "To be added");
          const content = label === "Email" && value ? `<a href="mailto:${cmsRender.escapeAttr(value)}">${safe.replace("@", "<wbr>@")}</a>` : safe;
          return `<div><dt>${cmsRender.escapeHtml(label)}</dt><dd>${content}</dd></div>`;
        })
        .join("");
    }

    const bioBlock = document.querySelector(".bio-block");
    if (bioBlock) {
      const paragraphs = String(profile.biography || profile.shortIntro || "")
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean);
      bioBlock.innerHTML = `
        <h2 id="bio-title">Biography</h2>
        ${paragraphs.map((paragraph) => `<p>${cmsRender.escapeHtml(paragraph)}</p>`).join("") || "<p>Biography to be added.</p>"}
      `;
    }

    const tagList = document.querySelector(".skills-block .tag-list");
    if (tagList && Array.isArray(profile.tags)) {
      tagList.innerHTML = profile.tags.map((tag) => `<li><button class="focus-tag" type="button" aria-pressed="false"><span>${cmsRender.escapeHtml(tag)}</span></button></li>`).join("");
    }

    const timeline = Array.isArray(profile.timeline) ? profile.timeline.filter((item) => item.active !== false) : [];
    const timelineTrack = document.querySelector(".timeline-track");
    const timelineList = document.querySelector("[data-timeline-list]");
    const timelineFrames = timelineList?.querySelector("[data-timeline-frames]") || timelineList;
    if (timelineTrack) {
      timelineTrack.style.setProperty("--timeline-count", String(timeline.length || 1));
      timelineTrack.innerHTML = '<span class="timeline-progress" aria-hidden="true"></span><span class="timeline-indicator" aria-hidden="true"></span>' + timeline
        .map((item, index) => `<button class="timeline-node ${index === 0 ? "is-active" : ""}" type="button" data-timeline-index="${index}" aria-controls="timeline-entry-${index + 1}" aria-label="${cmsRender.escapeAttr([item.date, item.title].filter(Boolean).join(": "))}" aria-pressed="${index === 0}" tabindex="${index === 0 ? "0" : "-1"}"></button>`)
        .join("");
    }
    if (timelineFrames) {
      timelineFrames.innerHTML = timeline
        .map((item, index) => `
          <article class="timeline-card ${index === 0 ? "is-active" : ""}" id="timeline-entry-${index + 1}" data-timeline-card role="button" tabindex="${index === 0 ? "0" : "-1"}" aria-pressed="${index === 0}" aria-label="${cmsRender.escapeAttr([item.date, item.title].filter(Boolean).join(": "))}">
            <p class="timeline-date">${cmsRender.escapeHtml(item.date || "")}</p>
            <h3>${cmsRender.escapeHtml(item.title || "Timeline item")}</h3>
            <p class="timeline-place">${cmsRender.escapeHtml(item.place || profile.location || "")}</p>
            <p>${cmsRender.escapeHtml(item.description || "")}</p>
            <span>${cmsRender.escapeHtml(item.type || "Experience")}</span>
          </article>
        `)
        .join("");
    }

    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      jsonLd.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: `${profile.displayName || "WonG"} About`,
        description: profile.shortIntro || data.settings?.seo?.seoDescription || "",
        url: "../about/index.html",
        image: fallbackImage
      });
    }
  }

  renderCmsAbout(cmsData);

  const tagList = document.querySelector(".skills-block .tag-list");
  tagList?.addEventListener("click", (event) => {
    const button = event.target.closest(".focus-tag");
    if (!button || !tagList.contains(button)) return;
    const selected = button.getAttribute("aria-pressed") !== "true";
    tagList.querySelectorAll(".focus-tag").forEach(tag => {
      tag.setAttribute("aria-pressed", String(tag === button && selected));
      tag.classList.remove("is-exposing");
    });
    const animate = window.wongMotion ? window.wongMotion.motionAllowed
      : !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate) {
      void button.offsetWidth;
      button.classList.add("is-exposing");
    }
  });
  tagList?.addEventListener("animationend", event => {
    if (event.target.matches(".focus-tag")) event.target.classList.remove("is-exposing");
  });

  const list = document.querySelector("[data-timeline-list]");
  const frames = list?.querySelector("[data-timeline-frames]") || list;
  const perforations = Array.from(document.querySelectorAll(".timeline-perforations"));
  const track = document.querySelector(".timeline-track");
  const cards = Array.from(document.querySelectorAll("[data-timeline-card]"));
  const nodes = Array.from(document.querySelectorAll(".timeline-node"));
  const prevButton = document.querySelector("[data-timeline-prev]");
  const nextButton = document.querySelector("[data-timeline-next]");
  const revealSections = Array.from(document.querySelectorAll(".reveal-section"));

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
      { threshold: 0.16 }
    );

    revealSections.forEach((section) => revealObserver.observe(section));
  } else {
    revealSections.forEach((section) => section.classList.add("is-visible"));
  }

  if (!list || !cards.length) {
    if (track) track.hidden = true;
    if (prevButton) prevButton.disabled = true;
    if (nextButton) nextButton.disabled = true;
    await window.cmsStore?.finishLoading?.();
    return;
  }

  let activeIndex = -1;
  const filmAnimations = new Set();
  const motionAllowed = () => window.wongMotion ? window.wongMotion.motionAllowed
    : !matchMedia("(prefers-reduced-motion: reduce)").matches;
  track?.style.setProperty("--timeline-count", String(cards.length));

  function clearFeedback() {
    filmAnimations.forEach(animation => animation.cancel());
    filmAnimations.clear();
  }

  function animateFilm(previousIndex) {
    if (!motionAllowed() || !frames.animate) return;
    const duration = window.wongMotion?.duration || 620;
    const strength = window.wongMotion?.strength || 1;
    const style = getComputedStyle(frames);
    const room = Math.max(0, Math.min(parseFloat(style.paddingLeft) || 0, parseFloat(style.paddingRight) || 0) - 3);
    const travel = Math.min(22 * strength, room);
    const direction = activeIndex >= previousIndex ? 1 : -1;
    const x = amount => `translateX(${amount / 22 * direction * travel}px)`;
    const play = (element, keyframes, easing) => {
      const animation = element.animate(keyframes, { duration, easing });
      filmAnimations.add(animation);
      animation.finished.then(() => filmAnimations.delete(animation), () => filmAnimations.delete(animation));
    };
    play(frames, [
      { transform: x(22) },
      { transform: x(5), offset: 0.28 },
      { transform: x(5), offset: 0.42 },
      { transform: x(-3), offset: 0.68 },
      { transform: x(-3), offset: 0.79 },
      { transform: x(0) }
    ], "linear");
    perforations.forEach(element => play(element, [
      { backgroundPositionX: `${20 * direction}px` }, { backgroundPositionX: "0px" }
    ], "steps(4, end)"));
  }

  function setActiveTimeline(nextIndex, feedback = false) {
    const previousIndex = activeIndex;
    activeIndex = Math.min(Math.max(nextIndex, 0), cards.length - 1);
    clearFeedback();
    cards.forEach((card, index) => {
      const selected = index === activeIndex;
      card.classList.toggle("is-active", selected);
      card.setAttribute("aria-pressed", String(selected));
      card.tabIndex = selected ? 0 : -1;
    });
    nodes.forEach((node, index) => {
      const selected = index === activeIndex;
      node.classList.toggle("is-active", selected);
      node.setAttribute("aria-pressed", String(selected));
      node.tabIndex = selected ? 0 : -1;
    });
    track?.style.setProperty("--timeline-index", String(activeIndex));
    if (prevButton) prevButton.disabled = activeIndex === 0;
    if (nextButton) nextButton.disabled = activeIndex === cards.length - 1;
    if (feedback) animateFilm(previousIndex);
  }

  function scrollToTimeline(nextIndex) {
    setActiveTimeline(nextIndex, true);
    const inset = parseFloat(getComputedStyle(frames).paddingLeft) || 0;
    const left = Math.max(0, Math.min(cards[activeIndex].offsetLeft - inset, list.scrollWidth - list.clientWidth));
    list.scrollTo({ left, behavior: motionAllowed() ? "smooth" : "instant" });
  }

  function keyboardIndex(key) {
    if (key === "ArrowLeft") return activeIndex - 1;
    if (key === "ArrowRight") return activeIndex + 1;
    if (key === "Home") return 0;
    if (key === "End") return cards.length - 1;
    return null;
  }

  prevButton?.addEventListener("click", () => scrollToTimeline(activeIndex - 1));
  nextButton?.addEventListener("click", () => scrollToTimeline(activeIndex + 1));

  track?.addEventListener("keydown", event => {
    if (!event.target.closest(".timeline-node")) return;
    const nextIndex = keyboardIndex(event.key);
    if (nextIndex === null) return;
    event.preventDefault();
    scrollToTimeline(nextIndex);
    nodes[activeIndex]?.focus({ preventScroll: true });
  });

  list.addEventListener("keydown", event => {
    const nextIndex = keyboardIndex(event.key);
    if (nextIndex !== null) {
      event.preventDefault();
      scrollToTimeline(nextIndex);
      if (event.target.closest("[data-timeline-card]")) cards[activeIndex].focus({ preventScroll: true });
    } else if ((event.key === "Enter" || event.key === " ") && event.target.closest("[data-timeline-card]")) {
      event.preventDefault();
      scrollToTimeline(cards.indexOf(event.target.closest("[data-timeline-card]")));
    }
  });

  function previewTimeline(index) {
    cards.forEach((card, cardIndex) => card.classList.toggle("is-preview", cardIndex === index));
    nodes.forEach((node, nodeIndex) => node.classList.toggle("is-preview", nodeIndex === index));
  }

  [...cards, ...nodes].forEach((element, position) => {
    const index = position % cards.length;
    element.addEventListener("click", () => scrollToTimeline(index));
    element.addEventListener("pointerenter", event => {
      if (event.pointerType !== "touch") previewTimeline(index);
    });
    element.addEventListener("pointerleave", () => previewTimeline(-1));
    element.addEventListener("focus", () => previewTimeline(index));
    element.addEventListener("blur", () => previewTimeline(-1));
  });

  window.addEventListener("wong:motionchange", () => {
    clearFeedback();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearFeedback();
  });
  setActiveTimeline(0);
  await window.cmsStore?.finishLoading?.();
})();
