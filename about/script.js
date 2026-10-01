(function () {
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
    const fallbackImage = profile.avatar || "Image/about-portrait-crop.png";
    const photo = document.querySelector(".archive-photo img");
    if (photo) {
      photo.src = fallbackImage;
      photo.alt = `${profile.displayName || "WonG"} portrait`;
    }

    const archiveMeta = document.querySelector(".archive-meta");
    if (archiveMeta) {
      const values = archiveMeta.querySelectorAll("b");
      if (values[0]) values[0].textContent = settings.homeHero?.updated || values[0].textContent;
      if (values[1]) values[1].textContent = profile.location || settings.globalInfo?.defaultLocation || values[1].textContent;
    }

    const details = [
      ["Name", profile.displayName],
      ["Role", profile.role],
      ["Location", profile.location],
      ["Availability", profile.availability],
      ["Email", profile.email]
    ];
    const infoList = document.querySelector(".info-list");
    if (infoList) {
      infoList.innerHTML = details
        .map(([label, value]) => {
          const safe = cmsRender.escapeHtml(value || "To be added");
          const content = label === "Email" && value ? `<a href="mailto:${cmsRender.escapeAttr(value)}">${safe}</a>` : safe;
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
      tagList.innerHTML = profile.tags.map((tag) => `<li>${cmsRender.escapeHtml(tag)}</li>`).join("");
    }

    const timeline = Array.isArray(profile.timeline) ? profile.timeline.filter((item) => item.active !== false) : [];
    const timelineTrack = document.querySelector(".timeline-track");
    const timelineList = document.querySelector("[data-timeline-list]");
    if (timelineTrack && timeline.length) {
      timelineTrack.innerHTML = timeline
        .map((_, index) => `<span class="timeline-node ${index === 0 ? "is-active" : ""}"></span>`)
        .join("");
    }
    if (timelineList && timeline.length) {
      timelineList.innerHTML = timeline
        .map((item, index) => `
          <article class="timeline-card ${index === 0 ? "is-active" : ""}" data-timeline-card>
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

  const list = document.querySelector("[data-timeline-list]");
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
    return;
  }

  let activeIndex = 0;

  function setActiveTimeline(nextIndex) {
    activeIndex = Math.min(Math.max(nextIndex, 0), cards.length - 1);

    cards.forEach((card, index) => {
      card.classList.toggle("is-active", index === activeIndex);
    });

    nodes.forEach((node, index) => {
      node.classList.toggle("is-active", index === activeIndex);
    });

    if (prevButton) {
      prevButton.disabled = activeIndex === 0;
    }

    if (nextButton) {
      nextButton.disabled = activeIndex === cards.length - 1;
    }
  }

  function scrollToTimeline(nextIndex) {
    setActiveTimeline(nextIndex);
    cards[activeIndex].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }

  prevButton?.addEventListener("click", () => {
    scrollToTimeline(activeIndex - 1);
  });

  nextButton?.addEventListener("click", () => {
    scrollToTimeline(activeIndex + 1);
  });

  list.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollToTimeline(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollToTimeline(activeIndex + 1);
    }
  });

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      setActiveTimeline(index);
    });
  });

  setActiveTimeline(activeIndex);
})();
