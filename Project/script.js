(function () {
  const cmsData = window.cmsStore?.getPublicData?.();
  const cmsRender = window.cmsRender;

  function renderCmsProjects(data) {
    if (!data || !cmsRender) {
      return;
    }

    cmsRender.applySeo("projects", {
      ogImage: data.projects?.[0]?.coverImage || "../Project/assets/project-edges-light.png"
    });
    cmsRender.applyChrome("projects");

    const settings = data.settings || {};
    const projects = Array.isArray(data.projects) ? data.projects : [];
    const categories = new Map((data.categories || []).map((category) => [category.id, category.name]));
    const archiveMeta = document.querySelector(".archive-meta");
    if (archiveMeta) {
      const values = archiveMeta.querySelectorAll("b");
      if (values[0]) values[0].textContent = settings.homeHero?.updated || values[0].textContent;
      if (values[1]) values[1].textContent = settings.homeHero?.basedIn || settings.globalInfo?.defaultLocation || values[1].textContent;
    }

    const rail = document.querySelector(".project-rail");
    const grid = document.querySelector("[data-project-list]");
    if (!grid || !projects.length) {
      return;
    }

    if (rail) {
      rail.innerHTML = projects
        .map((project, index) => `
          <button
            class="rail-node ${index === 0 ? "is-active" : ""}"
            type="button"
            data-project-node="${index}"
            aria-label="Select ${cmsRender.escapeAttr(project.title || "project")}"
            ${index === 0 ? 'aria-current="true"' : ""}
          ></button>
        `)
        .join("");
    }

    grid.innerHTML = projects
      .map((project, index) => {
        const categoryLabel = (project.categoryIds || []).map((id) => categories.get(id)).filter(Boolean).join(" / ") || project.theme || "Photography";
        const active = index === 0 ? " is-active" : "";
        return `
          <article class="project-card${active}" id="${cmsRender.escapeAttr(project.id)}" data-project-card data-index="${index}" tabindex="0" ${index === 0 ? 'aria-selected="true"' : ""}>
            <img
              src="${cmsRender.escapeAttr(project.coverImage || cmsRender.defaultImage)}"
              alt="${cmsRender.escapeAttr(project.coverAlt || project.title || "Project cover")}"
              width="386"
              height="242"
              loading="${index === 0 ? "eager" : "lazy"}"
              decoding="async"
            />
            <div class="project-card-body">
              <h3>${cmsRender.escapeHtml(project.title || "Untitled Project")}</h3>
              <p class="project-tag">${cmsRender.escapeHtml(categoryLabel)}</p>
              <dl class="project-meta">
                <div><dt>Location</dt><dd>${cmsRender.escapeHtml(project.location || "To be added")}</dd></div>
                <div><dt>Year</dt><dd>${cmsRender.escapeHtml(project.year || "To be added")}</dd></div>
              </dl>
              <p class="project-summary">${cmsRender.escapeHtml(project.description || "Project description to be added.")}</p>
              <a class="view-link" href="#${cmsRender.escapeAttr(project.id)}">View Collection <span aria-hidden="true">&rarr;</span></a>
            </div>
          </article>
        `;
      })
      .join("");
  }

  renderCmsProjects(cmsData);

  const cards = Array.from(document.querySelectorAll("[data-project-card]"));
  const nodes = Array.from(document.querySelectorAll("[data-project-node]"));
  const prevButton = document.querySelector("[data-project-prev]");
  const nextButton = document.querySelector("[data-project-next]");

  if (!cards.length) {
    return;
  }

  let activeIndex = Math.max(
    0,
    cards.findIndex((card) => card.classList.contains("is-active"))
  );

  function setActiveProject(nextIndex, shouldFocus) {
    activeIndex = (nextIndex + cards.length) % cards.length;

    cards.forEach((card, index) => {
      const isActive = index === activeIndex;
      card.classList.toggle("is-active", isActive);
      card.toggleAttribute("aria-selected", isActive);
    });

    nodes.forEach((node, index) => {
      const isActive = index === activeIndex;
      node.classList.toggle("is-active", isActive);

      if (isActive) {
        node.setAttribute("aria-current", "true");
      } else {
        node.removeAttribute("aria-current");
      }
    });

    if (shouldFocus) {
      cards[activeIndex].focus({ preventScroll: true });
    }
  }

  cards.forEach((card, index) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        return;
      }

      setActiveProject(index, false);
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveProject(index, false);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveProject(activeIndex - 1, true);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveProject(activeIndex + 1, true);
      }
    });
  });

  nodes.forEach((node) => {
    node.addEventListener("click", () => {
      setActiveProject(Number(node.dataset.projectNode), true);
    });
  });

  prevButton?.addEventListener("click", () => {
    setActiveProject(activeIndex - 1, true);
  });

  nextButton?.addEventListener("click", () => {
    setActiveProject(activeIndex + 1, true);
  });
})();
