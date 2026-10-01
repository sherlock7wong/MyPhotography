(function () {
  const filters = [
    { value: "all", label: "All" },
    { value: "street", label: "Street" },
    { value: "commute", label: "Commute" },
    { value: "market", label: "Market" },
    { value: "night", label: "Night" },
    { value: "public-space", label: "Public Space" }
  ];

  const photos = [
    {
      id: "old-lane",
      title: "老街巷弄",
      category: "street",
      categoryLabel: "Street",
      year: 2024,
      date: "Mar 10, 2024",
      time: "16:38",
      location: "Shenzhen, China",
      route: "Old Town",
      image: "assets/old-street.png",
      alt: "People walking through an old narrow city street",
      description: "街巷里的人群缓慢穿过，招牌、线缆与脚步声留住了城市的旧时间。",
      camera: "Leica M6",
      lens: "Summicron 50mm",
      film: "Kodak Portra 400",
      aperture: "f/4",
      shutter: "1/250s",
      iso: "400",
      focalLength: "50mm",
      weather: "Cloudy",
      aspect: "3:2",
      layout: "tall",
      tags: ["street"]
    },
    {
      id: "bus-window",
      title: "公交车上",
      category: "commute",
      categoryLabel: "Commute",
      year: 2024,
      date: "May 08, 2024",
      time: "17:21",
      location: "Shenzhen, China",
      route: "Bus Route 204",
      image: "assets/bus-window.png",
      detailImage: "assets/detail-commute.png",
      alt: "Passengers sitting on a city bus in low light",
      description: "傍晚的公交车，光线透过车窗落在她的身上。城市在移动，人们也在各自的方向上前行。",
      camera: "Leica M6",
      lens: "Summicron 50mm",
      film: "Kodak Portra 400",
      aperture: "f/2.8",
      shutter: "1/125s",
      iso: "400",
      focalLength: "50mm",
      weather: "Cloudy",
      aspect: "3:2",
      layout: "normal",
      tags: ["street", "commute"]
    },
    {
      id: "crossing",
      title: "过街",
      category: "street",
      categoryLabel: "Street",
      year: 2024,
      date: "Mar 22, 2024",
      time: "16:42",
      location: "Shenzhen, China",
      route: "Nanshan Old Street",
      image: "assets/crossing.png",
      alt: "Pedestrians crossing an old urban street",
      description: "红绿灯切换的几秒钟，行人、车辆与街角同时进入画面，城市短暂地对齐。",
      camera: "Leica M6",
      lens: "Summicron 50mm",
      film: "Kodak Portra 400",
      aperture: "f/5.6",
      shutter: "1/250s",
      iso: "400",
      focalLength: "50mm",
      weather: "Overcast",
      aspect: "3:2",
      layout: "normal",
      tags: ["street"]
    },
    {
      id: "after-rain",
      title: "雨后",
      category: "street",
      categoryLabel: "Street",
      year: 2024,
      date: "Mar 14, 2024",
      time: "17:28",
      location: "Shenzhen, China",
      route: "Wet Block",
      image: "assets/rain-walk.png",
      alt: "A person walking with an umbrella on a wet city street",
      description: "雨停后的傍晚，街角的积水映出路人与匆忙的影。城市里潮湿的空气里恢复日常的节奏。",
      camera: "Leica M6",
      lens: "Summicron 50mm",
      film: "Kodak Portra 400",
      aperture: "f/4",
      shutter: "1/250s",
      iso: "400",
      focalLength: "50mm",
      weather: "Rain",
      aspect: "3:2",
      layout: "tall",
      tags: ["street", "public-space"]
    },
    {
      id: "station-platform",
      title: "站台",
      category: "commute",
      categoryLabel: "Commute",
      year: 2023,
      date: "Dec 06, 2023",
      time: "18:04",
      location: "Shenzhen, China",
      route: "Terminal Stop",
      image: "assets/station.png",
      alt: "Silhouettes of people waiting at a station window",
      description: "站台上的剪影被车窗分隔开，等待本身也成为城市移动的一部分。",
      camera: "Fujifilm X100V",
      lens: "23mm f/2",
      film: "Digital",
      aperture: "f/2.8",
      shutter: "1/160s",
      iso: "800",
      focalLength: "35mm equiv.",
      weather: "Nightfall",
      aspect: "3:2",
      layout: "normal",
      tags: ["street", "commute"]
    },
    {
      id: "market-table",
      title: "菜市场",
      category: "market",
      categoryLabel: "Market",
      year: 2023,
      date: "Sep 18, 2023",
      time: "10:26",
      location: "Shenzhen, China",
      route: "Morning Market",
      image: "assets/market.png",
      alt: "Market workers arranging food at a city market",
      description: "市场的桌面被手势和声音填满，真实的城市温度通常藏在这些重复劳动里。",
      camera: "Fujifilm X100V",
      lens: "23mm f/2",
      film: "Digital",
      aperture: "f/4",
      shutter: "1/250s",
      iso: "640",
      focalLength: "35mm equiv.",
      weather: "Indoor",
      aspect: "3:2",
      layout: "normal",
      tags: ["street", "market"]
    },
    {
      id: "riverwalk",
      title: "滨海步道",
      category: "public-space",
      categoryLabel: "Public Space",
      year: 2024,
      date: "Apr 02, 2024",
      time: "18:12",
      location: "Shenzhen, China",
      route: "Coastal Walk",
      image: "assets/riverwalk.png",
      alt: "Two people standing beside a waterfront railing",
      description: "临水的步道让城市慢下来，人和建筑之间留出一段安静的距离。",
      camera: "Leica M6",
      lens: "Summicron 50mm",
      film: "Kodak Portra 400",
      aperture: "f/5.6",
      shutter: "1/500s",
      iso: "400",
      focalLength: "50mm",
      weather: "Hazy",
      aspect: "3:2",
      layout: "wide",
      tags: ["street", "public-space"]
    },
    {
      id: "tea-restaurant",
      title: "茶餐厅",
      category: "street",
      categoryLabel: "Daily",
      year: 2023,
      date: "Nov 19, 2023",
      time: "14:36",
      location: "Shenzhen, China",
      route: "Corner Cafe",
      image: "assets/cafe.png",
      alt: "A man reading in a small restaurant by the street",
      description: "街边的小店里，报纸、杯子和窗外车流共同构成了一个下午的停顿。",
      camera: "Fujifilm X100V",
      lens: "23mm f/2",
      film: "Digital",
      aperture: "f/2.8",
      shutter: "1/125s",
      iso: "500",
      focalLength: "35mm equiv.",
      weather: "Cloudy",
      aspect: "16:9",
      layout: "wide",
      tags: ["street"]
    },
    {
      id: "night-street",
      title: "夜晚的街头",
      category: "night",
      categoryLabel: "Night",
      year: 2023,
      date: "Oct 30, 2023",
      time: "21:07",
      location: "Shenzhen, China",
      route: "Main Road",
      image: "assets/night-street.png",
      alt: "People and cars moving through a city street at night",
      description: "夜色把街头压低，车灯与店铺灯光留下更慢的层次。",
      camera: "Fujifilm X100V",
      lens: "23mm f/2",
      film: "Digital",
      aperture: "f/2",
      shutter: "1/80s",
      iso: "1600",
      focalLength: "35mm equiv.",
      weather: "Clear",
      aspect: "16:9",
      layout: "wide",
      tags: ["street", "night"]
    }
  ];

  const state = {
    filter: "street",
    sort: "latest",
    view: "grid",
    activeId: "bus-window"
  };

  const filterGroup = document.querySelector("[data-filter-group]");
  const sortSelect = document.querySelector("[data-sort]");
  const viewButtons = Array.from(document.querySelectorAll("[data-view]"));
  const photoGrid = document.querySelector("[data-photo-grid]");
  const detailPanel = document.querySelector("[data-detail-panel]");
  const detailClose = document.querySelector("[data-detail-close]");
  const detailImage = document.querySelector("[data-detail-image]");
  const detailTitle = document.querySelector("[data-detail-title]");
  const detailMeta = document.querySelector("[data-detail-meta]");
  const detailDescription = document.querySelector("[data-detail-description]");
  const detailSpecs = document.querySelector("[data-detail-specs]");
  const detailCount = document.querySelector("[data-detail-count]");
  const emptyState = document.querySelector("[data-empty-state]");
  const prevButton = document.querySelector("[data-photo-prev]");
  const nextButton = document.querySelector("[data-photo-next]");
  const revealSections = Array.from(document.querySelectorAll(".reveal-section"));

  function getFilteredPhotos() {
    const filtered = photos.filter((photo) => state.filter === "all" || photo.tags.includes(state.filter));

    return filtered.sort((a, b) => {
      if (state.sort === "oldest") {
        return a.year - b.year || photos.indexOf(a) - photos.indexOf(b);
      }

      if (state.sort === "title") {
        return a.title.localeCompare(b.title, "zh-Hans-CN");
      }

      return b.year - a.year || photos.indexOf(a) - photos.indexOf(b);
    });
  }

  function getActivePhoto(list) {
    return photos.find((photo) => photo.id === state.activeId) || list[0] || photos[0];
  }

  function setActivePhoto(photoId, shouldFocusDetail) {
    state.activeId = photoId;
    detailPanel.hidden = false;
    render();

    if (shouldFocusDetail) {
      detailPanel.focus({ preventScroll: true });
    }
  }

  function moveActive(direction) {
    const visible = getFilteredPhotos();

    if (!visible.length) {
      return;
    }

    const currentIndex = Math.max(0, visible.findIndex((photo) => photo.id === state.activeId));
    const nextIndex = (currentIndex + direction + visible.length) % visible.length;
    setActivePhoto(visible[nextIndex].id, false);
  }

  function renderFilters() {
    const label = document.createElement("span");
    label.textContent = "Filter:";
    const buttons = filters.map((filter) => {
      const button = document.createElement("button");
      const isActive = filter.value === state.filter;

      button.type = "button";
      button.dataset.filter = filter.value;
      button.textContent = filter.label;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));

      return button;
    });

    filterGroup.replaceChildren(label, ...buttons);
  }

  function makePhotoCard(photo, index) {
    const button = document.createElement("button");
    const className = ["photo-card"];

    if (photo.layout === "tall") {
      className.push("is-tall");
    }

    if (photo.layout === "wide") {
      className.push("is-wide");
    }

    if (photo.id === state.activeId) {
      className.push("is-active");
      button.setAttribute("aria-current", "true");
    }

    button.className = className.join(" ");
    button.type = "button";
    button.dataset.photoId = photo.id;
    button.style.animationDelay = `${Math.min(index, 9) * 42}ms`;
    button.innerHTML = `
      <span class="photo-image">
        <img src="${photo.image}" alt="${photo.alt}" width="420" height="260" loading="lazy" decoding="async" />
      </span>
      <span class="photo-body">
        <span class="photo-title">${photo.title}</span>
        <span class="photo-meta">${photo.categoryLabel}</span>
        <span class="photo-year">${photo.year}</span>
      </span>
    `;

    button.addEventListener("click", () => setActivePhoto(photo.id, false));
    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveActive(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveActive(1);
      }
    });

    return button;
  }

  function renderGallery() {
    const visible = getFilteredPhotos();

    if (visible.length && !visible.some((photo) => photo.id === state.activeId)) {
      state.activeId = visible[0].id;
    }

    photoGrid.classList.toggle("is-list", state.view === "list");
    photoGrid.replaceChildren(...visible.map((photo, index) => makePhotoCard(photo, index)));

    if (emptyState) {
      emptyState.hidden = visible.length > 0;
    }
  }

  function renderDetail() {
    const visible = getFilteredPhotos();
    const activePhoto = getActivePhoto(visible);

    if (!activePhoto) {
      detailPanel.hidden = true;
      return;
    }

    const visibleIndex = Math.max(0, visible.findIndex((photo) => photo.id === activePhoto.id));
    const specs = [
      ["Location", activePhoto.location],
      ["Time", activePhoto.time],
      ["Light", "Natural"],
      ["Weather", activePhoto.weather],
      ["Camera", activePhoto.camera],
      ["Lens", activePhoto.lens],
      ["Film", activePhoto.film],
      ["Aperture", activePhoto.aperture],
      ["Shutter", activePhoto.shutter],
      ["ISO", activePhoto.iso],
      ["Focal Length", activePhoto.focalLength],
      ["Aspect Ratio", activePhoto.aspect]
    ];

    detailImage.src = activePhoto.detailImage || activePhoto.image;
    detailImage.alt = activePhoto.alt;
    detailTitle.textContent = activePhoto.title;
    detailMeta.innerHTML = `<span>${activePhoto.categoryLabel}</span><span>${activePhoto.year}</span>`;
    detailDescription.textContent = activePhoto.description;
    detailSpecs.replaceChildren(
      ...specs.map(([label, value]) => {
        const item = document.createElement("div");
        const term = document.createElement("dt");
        const detail = document.createElement("dd");

        term.textContent = label;
        detail.textContent = value || "-";
        item.append(term, detail);
        return item;
      })
    );
    detailCount.textContent = `${visibleIndex + 1} / ${visible.length}`;
  }

  function renderControls() {
    renderFilters();

    if (sortSelect) {
      sortSelect.value = state.sort;
    }

    viewButtons.forEach((button) => {
      const isActive = button.dataset.view === state.view;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function render() {
    renderControls();
    renderGallery();
    renderDetail();
  }

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

  filterGroup.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");

    if (!button) {
      return;
    }

    state.filter = button.dataset.filter;
    render();
  });

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    render();
  });

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  prevButton.addEventListener("click", () => moveActive(-1));
  nextButton.addEventListener("click", () => moveActive(1));

  detailClose.addEventListener("click", () => {
    detailPanel.hidden = true;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !detailPanel.hidden) {
      detailPanel.hidden = true;
    }
  });

  render();
})();
