(() => {
  "use strict";
  const root = document.documentElement;
  const systemMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let manualReduction = root.dataset.manualReduction === "true";
  if (document.body.hasAttribute("data-detail-page")) {
    return;
  }
  const lab = document.getElementById("motion-lab");
  if (!lab) return;
  const stage = document.getElementById("preview-stage");
  const reticle = document.getElementById("cursor-reticle");
  const ghost = document.getElementById("ghost-cursor");
  const dialog = document.getElementById("image-dialog");
  const expanded = document.getElementById("expanded-photo");
  const hero = document.getElementById("hero-photo");
  const scrollWindow = document.getElementById("scroll-window");
  const demoButton = document.getElementById("demo-button");
  const status = document.getElementById("experience-status");
  const intensityInput = document.getElementById("intensity");
  const reductionInput = document.getElementById("reduce-motion");
  const forceFallback = new URLSearchParams(location.search).has("fallback");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const scenes = {
    overview: ["THE WHOLE EXPERIENCE", "克制，但能被记住。", "移动鼠标、停留在照片上，再点开它。所有交互使用同一套摄影语言。", "在照片上停留，感受对焦；点击照片，体验连续展开。"],
    cursor: ["THE VIEWFINDER", "镜头，跟随你的目光。", "取景框轻跟随鼠标；进入作品区变为光圈。保留系统指针，按钮只做小幅磁吸。", "在预览内移动鼠标。触屏使用点击反馈，不显示跟随光标。"],
    hover: ["A MOMENT OF FOCUS", "停留，让画面靠近。", "照片轻微放大，取景角标延迟浮现；卡片随手势轻倾斜。文字保持清楚，移开自然回位。", "停留约 120 ms，观察对焦角标和查看作品入口。"],
    click: ["THE SHUTTER ECHO", "按下，留一道余韵。", "局部光圈短促扩散，按钮轻压回弹；照片连续展开。使用柔和反馈，避免全屏闪光。", "点击任意照片，体验局部光圈与大图展开；Esc 返回。"],
    transition: ["THE NEXT FRAME", "下一页，接着这一帧。", "优先用照片连续展开串起页面，也可比较镜头光圈和胶片推幕。真实跳转由独立样片演示。", "选择下方转场方式，切换 Home、Photography、About。"],
    scroll: ["A SCROLL THROUGH LIGHT", "把滚动，交给光阴。", "照片随着滚动逐渐显影，底部细线记录阅读进度。保留原生滚动，不接管滚轮或强制吸附。", "在预览画卷内滚动；也可以点“演示一次”观看。"],
    atmosphere: ["LIGHT ON PAPER", "纸是静的，光是活的。", "保留暖纸与胶片气质；鼠标带动局部柔光，叠加静态微颗粒。没有持续粒子循环。", "移动鼠标查看纸上微光；选择“沉浸”放大变化，“减少动态”暂停位移。"]
  };
  const photos = {
    landscape: { src: "../Home/assets/landscape.png", alt: "海雾中的山崖与海岸", caption: "LANDSCAPE / 海岸 · 02A" },
    portrait: { src: "../Home/assets/portrait.png", alt: "窗边柔光中的人像", caption: "PORTRAIT / 人像 · 01A" },
    city: { src: "../Home/assets/city-humanity.png", alt: "城市街道中的行人", caption: "CITY HUMANITY / 城市 · 03A" }
  };
  let scene = "overview";
  let route = "home";
  let activeTransition = null;
  let openedFrom = null;
  let photoPhase = "closed";
  let photoOperation = 0;
  let framePending = 0;
  let pointerX = 0;
  let pointerY = 0;
  let demoToken = 0;
  let fallbackObserver = null;
  const reduced = () => manualReduction || systemMotion.matches;
  const magnitude = () => ({quiet: .5, standard: 1, immersive: 1.6})[intensityInput.value] || 1;
  const sleep = (duration) => new Promise(resolve => setTimeout(resolve, duration));
  function restorePhotoName() {
    document.querySelectorAll(".photo-piece img").forEach(img => { img.style.viewTransitionName = "none"; });
    expanded.style.viewTransitionName = "none";
    if (route !== "about" && scene !== "scroll" && !dialog.open) hero.style.viewTransitionName = "archive-photo";
  }
  async function transition(update) {
    if (activeTransition) { activeTransition.skipTransition(); activeTransition = null; }
    if (reduced() || forceFallback || !document.startViewTransition) {
      update();
      stage.dataset.transitioning = "false";
      if (!reduced() && stage.animate) stage.animate([{opacity:.65,transform:"translateY(5px)"},{opacity:1,transform:"none"}], {duration:300,easing:"ease-out"});
      return;
    }
    const current = document.startViewTransition(update);
    activeTransition = current;
    stage.dataset.transitioning = "true";
    current.ready.catch(() => {});
    await current.finished.catch(() => {});
    if (activeTransition === current) { activeTransition = null; stage.dataset.transitioning = "false"; }
  }
  function setRoute(nextRoute, animate = true) {
    if (!["home","photography","about"].includes(nextRoute)) return Promise.resolve();
    const update = () => {
      route = nextRoute;
      stage.dataset.route = route;
      document.querySelectorAll("[data-route]").forEach(button => {
        if (button.dataset.route === route) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      });
      const about = route === "about";
      document.querySelector(".stage-heading").hidden = about;
      document.getElementById("photo-composition").hidden = about;
      document.querySelector(".stage-bottom").hidden = about;
      document.getElementById("about-state").hidden = !about;
      document.getElementById("route-heading").textContent = route === "photography" ? "Stories in light." : "Capture the quiet.";
      document.getElementById("route-kicker").textContent = route === "photography" ? "THE PHOTOGRAPHY COLLECTION" : "A STUDY OF LIGHT & TIME";
      status.textContent = `当前样片：${route === "home" ? "Home" : route === "about" ? "About" : "Photography"}。${reduced() ? "已减少动态。" : "可以继续点开照片。"}`;
      restorePhotoName();
    };
    return animate ? transition(update) : Promise.resolve(update());
  }
  function stopDemo() {
    demoToken++;
    ghost.style.opacity = "0";
    ghost.getAnimations().forEach(animation => animation.cancel());
    document.querySelectorAll(".is-demo-hover").forEach(node => node.classList.remove("is-demo-hover"));
    demoButton.disabled = false;
    demoButton.innerHTML = "<span aria-hidden='true'>▷</span> 演示一次 <span aria-hidden='true'>↗</span>";
  }
  function setScene(nextScene) {
    if (!scenes[nextScene]) return;
    stopDemo();
    if (photoPhase === "opening" && !dialog.open) { photoOperation++; photoPhase = "closed"; }
    scene = nextScene;
    lab.dataset.scene = scene;
    document.querySelectorAll("[data-scene]").forEach(button => {
      const active = button.dataset.scene === scene;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const data = scenes[scene];
    ["scene-kicker","scene-title","scene-copy"].forEach((id,index) => { document.getElementById(id).textContent = data[index]; });
    status.textContent = reduced() ? "已减少动态：可正常查看与打开照片。" : data[3];
    document.getElementById("photo-experience").hidden = scene === "scroll";
    document.getElementById("scroll-experience").hidden = scene !== "scroll";
    document.getElementById("transition-options").hidden = scene !== "transition";
    if (scene !== "scroll" && route === "about") setRoute("home",false);
    restorePhotoName();
  }
  function applyMotion() {
    stopDemo();
    if (photoPhase === "opening" && !dialog.open) { photoOperation++; photoPhase = "closed"; restorePhotoName(); }
    root.dataset.motion = reduced() ? "reduced" : "full";
    root.style.setProperty("--motion-scale", reduced() ? "0" : String(magnitude()));
    const time = {quiet:480,standard:620,immersive:820}[intensityInput.value] || 620;
    root.style.setProperty("--transition-time", `${time}ms`);
    lab.dataset.intensity = intensityInput.value;
    document.getElementById("duration-note").textContent = reduced() ? "减少动态已开启" : `220 ms 微交互 / ${time} ms 转场`;
    reductionInput.checked = reduced();
    reductionInput.disabled = systemMotion.matches;
    reductionInput.title = systemMotion.matches ? "系统已开启减少动态，优先遵循系统设置" : "减少动态";
    if (reduced()) {
      activeTransition?.skipTransition();
      document.getAnimations().forEach(animation => animation.cancel());
      reticle.style.opacity = "0";
      stage.style.setProperty("--light-x", "32%");
      stage.style.setProperty("--light-y", "22%");
      document.querySelectorAll(".photo-piece,.magnetic-button").forEach(node => { node.style.transform = ""; });
    }
    status.textContent = reduced() ? "已减少动态：停止鼠标跟随、倾斜、缩放和转场，保留所有操作。" : scenes[scene][3];
  }
  function echo(element, x, y) {
    if (reduced() || !element.animate) return;
    const ring = document.createElement("span");
    ring.className = "click-echo";
    ring.setAttribute("aria-hidden","true");
    ring.style.left = `${x - 7}px`;
    ring.style.top = `${y - 7}px`;
    element.append(ring);
    const animation = ring.animate([{transform:"scale(.5)",opacity:.7},{transform:`scale(${6*magnitude()+2})`,opacity:0}], {duration:440,easing:"cubic-bezier(.2,.7,.2,1)"});
    animation.finished.catch(() => {}).finally(() => ring.remove());
  }
  async function openPhoto(button) {
    if (dialog.open || photoPhase !== "closed") return;
    const photo = photos[button.dataset.photo];
    if (!photo) return;
    const operation = ++photoOperation;
    photoPhase = "opening";
    openedFrom = button;
    document.querySelectorAll(".photo-piece img").forEach(img => { img.style.viewTransitionName = "none"; });
    const source = button.querySelector("img");
    source.style.viewTransitionName = "archive-photo";
    expanded.src = photo.src;
    expanded.alt = photo.alt;
    document.getElementById("dialog-caption").textContent = photo.caption;
    await expanded.decode().catch(() => {});
    if (operation !== photoOperation) return;
    await transition(() => {
      if (operation !== photoOperation) return;
      source.style.viewTransitionName = "none";
      expanded.style.viewTransitionName = "archive-photo";
      dialog.showModal();
      photoPhase = "open";
    });
    if (operation !== photoOperation) return;
    status.textContent = "已展开作品。关闭照片后回到原位置。";
  }
  async function closePhoto() {
    if (!dialog.open || photoPhase === "closing") return;
    const operation = ++photoOperation;
    photoPhase = "closing";
    const trigger = openedFrom;
    const source = trigger?.querySelector("img");
    await transition(() => {
      expanded.style.viewTransitionName = "none";
      dialog.close();
      if (source) source.style.viewTransitionName = "archive-photo";
    });
    if (operation !== photoOperation) return;
    photoPhase = "closed";
    restorePhotoName();
    trigger?.focus({preventScroll:true});
    status.textContent = scenes[scene][3];
  }
  stage.addEventListener("pointermove", event => {
    if (reduced() || !finePointer.matches || event.pointerType === "touch") return;
    const rect = stage.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    reticle.style.opacity = "1";
    reticle.classList.toggle("on-photo", Boolean(event.target.closest(".photo-piece")));
    if (!framePending) framePending = requestAnimationFrame(() => {
      const size = reticle.classList.contains("on-photo") ? 51 : 34;
      reticle.style.transform = `translate3d(${pointerX-size/2}px,${pointerY-size/2}px,0)`;
      stage.style.setProperty("--light-x", `${20 + pointerX/rect.width*60}%`);
      stage.style.setProperty("--light-y", `${10 + pointerY/rect.height*65}%`);
      framePending = 0;
    });
  });
  stage.addEventListener("pointerleave", () => { reticle.style.opacity = "0"; });
  document.querySelectorAll(".photo-piece").forEach(button => {
    button.addEventListener("pointermove", event => {
      if (reduced() || !finePointer.matches) return;
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left)/rect.width - .5;
      const y = (event.clientY - rect.top)/rect.height - .5;
      button.style.transform = `perspective(900px) rotateX(${-y*4*magnitude()}deg) rotateY(${x*4*magnitude()}deg) translateY(${-3*magnitude()}px)`;
    });
    button.addEventListener("pointerleave", () => { button.style.transform = ""; });
    button.addEventListener("click", event => {
      const rect = stage.getBoundingClientRect();
      if (!reduced()) {
        const x = event.detail ? event.clientX - rect.left : rect.width/2;
        const y = event.detail ? event.clientY - rect.top : rect.height/2;
        echo(stage,x,y);
      }
      root.style.setProperty("--origin-x", `${event.clientX || innerWidth/2}px`);
      root.style.setProperty("--origin-y", `${event.clientY || innerHeight/2}px`);
      openPhoto(button);
    });
  });
  document.querySelectorAll(".magnetic-button").forEach(button => {
    button.addEventListener("pointermove", event => {
      if (reduced() || !finePointer.matches) return;
      const rect = button.getBoundingClientRect();
      button.style.transform = `translate(${((event.clientX-rect.left)/rect.width-.5)*8*magnitude()}px,${((event.clientY-rect.top)/rect.height-.5)*6*magnitude()}px)`;
    });
    button.addEventListener("pointerleave", () => { button.style.transform = ""; });
    button.addEventListener("pointerdown", event => {
      const rect = button.getBoundingClientRect();
      echo(button,event.clientX-rect.left,event.clientY-rect.top);
      if (!reduced()) button.animate([{scale:1},{scale:.96},{scale:1}],{duration:240,easing:"ease-out"});
    });
  });
  document.querySelectorAll("[data-scene]").forEach(button => button.addEventListener("click", () => setScene(button.dataset.scene)));
  document.querySelectorAll("[data-route]").forEach(button => button.addEventListener("click", () => setRoute(button.dataset.route)));
  document.getElementById("explore-button").addEventListener("click", () => setRoute(route === "photography" ? "home" : "photography"));
  document.getElementById("route-demo").addEventListener("click", () => setRoute(route === "home" ? "photography" : "home"));
  document.getElementById("transition-style").addEventListener("change", event => { root.dataset.transition = event.target.value; });
  intensityInput.addEventListener("change", applyMotion);
  reductionInput.addEventListener("change", () => {
    manualReduction = reductionInput.checked;
    window.wongMotionPreviewPreferences?.setReduction(manualReduction);
    applyMotion();
  });
  systemMotion.addEventListener("change", applyMotion);
  dialog.querySelector(".dialog-close").addEventListener("click", closePhoto);
  dialog.addEventListener("cancel", event => { event.preventDefault(); closePhoto(); });
  dialog.addEventListener("click", event => { if (event.target !== dialog) return; const box = dialog.getBoundingClientRect(); if (event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom) closePhoto(); });
  async function runDemo() {
    stopDemo();
    if (reduced()) { status.textContent = "当前遵循减少动态设置。仍可点击照片、切换页面和滚动查看。"; return; }
    const token = ++demoToken;
    demoButton.disabled = true;
    demoButton.innerHTML = "<span aria-hidden='true'>▷</span> 正在演示…";
    if (scene === "scroll") {
      scrollWindow.scrollTo({top:0,behavior:"instant"});
      await sleep(160);
      if (token !== demoToken) return;
      scrollWindow.scrollTo({top:scrollWindow.scrollHeight,behavior:"smooth"});
      await sleep(1000);
    } else if (scene === "transition") {
      await setRoute(route === "home" ? "photography" : "home");
    } else {
      if (route === "about") await setRoute("home",false);
      const stageBox = stage.getBoundingClientRect();
      const main = document.querySelector(".photo-piece-main");
      const target = main.getBoundingClientRect();
      const x = target.left-stageBox.left+target.width*.58;
      const y = target.top-stageBox.top+target.height*.55;
      ghost.style.opacity = "1";
      const animation = ghost.animate([{transform:`translate(${stageBox.width*.15}px,${stageBox.height*.75}px)`},{transform:`translate(${x}px,${y}px)`}],{duration:850,easing:"cubic-bezier(.22,1,.36,1)",fill:"forwards"});
      await animation.finished.catch(() => {});
      if (token !== demoToken) return;
      main.classList.add("is-demo-hover");
      stage.style.setProperty("--light-x", "75%");
      stage.style.setProperty("--light-y", "42%");
      await sleep(680);
      if (token !== demoToken) return;
      if (scene === "click" || scene === "overview") {
        echo(stage,x,y);
        main.animate([{transform:"translateY(0)"},{transform:"translateY(2px) scale(.98)"},{transform:"translateY(0)"}],{duration:250});
        await sleep(430);
      }
      if (scene === "overview") await setRoute("photography");
    }
    if (token !== demoToken) return;
    stopDemo();
    status.textContent = "演示完成，可以继续亲自操作。";
  }
  demoButton.addEventListener("click", runDemo);
  const hasScrollTimeline = CSS.supports("animation-timeline: scroll()");
  if (!hasScrollTimeline || forceFallback) {
    document.querySelectorAll(".scroll-frame,.scroll-progress span").forEach(node => { node.style.animation = "none"; });
    if ("IntersectionObserver" in window) {
      fallbackObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting || entry.target.dataset.revealed) return;
        entry.target.dataset.revealed = "true";
        if (!reduced()) entry.target.animate([{opacity:.45,transform:"translateY(20px)"},{opacity:1,transform:"none"}],{duration:480,easing:"ease-out"});
      }),{root:scrollWindow,threshold:.15});
      document.querySelectorAll(".scroll-frame").forEach(node => fallbackObserver.observe(node));
    }
    scrollWindow.addEventListener("scroll", () => {
      const max = scrollWindow.scrollHeight-scrollWindow.clientHeight;
      document.querySelector(".scroll-progress span").style.transform = `scaleX(${max>0 ? scrollWindow.scrollTop/max : 0})`;
    },{passive:true});
  }
  const capabilities = [
    ["同页 View Transitions", Boolean(document.startViewTransition) && !forceFallback],
    ["跨文档声明（非完整支持检测）", CSS.supports("view-transition-name: archive-photo") && "PageSwapEvent" in window],
    ["CSS 滚动时间轴", hasScrollTimeline && !forceFallback],
    ["Web Animations", typeof Element.prototype.animate === "function"],
    ["离散过渡 allow-discrete", CSS.supports("transition-behavior: allow-discrete")]
  ];
  const capabilityList = document.getElementById("capability-list");
  capabilities.forEach(([name,supported]) => { const term=document.createElement("dt"); term.textContent=name; const detail=document.createElement("dd"); detail.textContent=supported?"当前能力可用":"使用基础呈现"; capabilityList.append(term,detail); });
  window.addEventListener("pagehide", stopDemo);
  root.dataset.transition = "shared";
  stage.dataset.transitioning = "false";
  setRoute("home",false);
  const requestedScene = new URLSearchParams(location.search).get("scene");
  setScene(scenes[requestedScene] ? requestedScene : "overview");
  applyMotion();
})();
