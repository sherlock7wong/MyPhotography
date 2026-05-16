const loginView = document.querySelector("[data-login-view]");
const editorView = document.querySelector("[data-editor-view]");
const loginForm = document.querySelector("[data-login-form]");
const loginStatus = document.querySelector("[data-login-status]");
const editorStatus = document.querySelector("[data-editor-status]");
const tabs = document.querySelector("[data-page-tabs]");
const grid = document.querySelector("[data-editor-grid]");
const saveButton = document.querySelector("[data-save]");
const logoutButton = document.querySelector("[data-logout]");

const defaultSite = {
  brand: "SherlockWonG",
  navPortrait: "Portrait",
  navLandscape: "Landscape",
  navLife: "Life",
  navCityscape: "CityScape",
  navAbout: "About",
  heroLine1: "SherlockWonG",
  heroLine2: "photographs quiet",
  heroLine3: "human moments.",
  heroLead:
    "Photography for portraits, urban stories, personal archives, and selective brand visuals. The work focuses on composition, atmosphere, and images that stay useful after the first impression.",
  primaryButtonText: "View selected work",
  primaryButtonHref: "/portrait/",
  secondaryButtonText: "Start a shoot brief",
  secondaryButtonHref: "mailto:Sherlock7.wong@gmail.com",
  heroImage: "assets/hero-placeholder.svg",
  heroImageAlt: "Placeholder for SherlockWonG signature hero photograph",
  quote: "You don't take a photograph, you make it. - Ansel Adams",
  workEyebrow: "Selected work",
  workTitle: "Portfolio exhibition windows.",
  filterAll: "All",
  filterPortrait: "Portrait",
  filterCity: "City",
  filterLandscape: "Landscape",
  aboutImage: "assets/portrait-detail.svg",
  aboutImageAlt: "Placeholder detail image for SherlockWonG profile",
  aboutEyebrow: "About SherlockWonG",
  aboutTitle: "PhotoGraphy as a disciplined way to notice.",
  aboutBody1:
    "I am a photographer based in China. This homepage is built around a simple promise: fewer distractions, stronger frames, and a clear way for viewers or collaborators to understand the work quickly.",
  aboutBody2:
    "The current copy is intentionally concise. When real portfolio details are ready, this area should mention your strongest subjects, service regions, collaboration style, and any public exhibitions or clients.",
  footerCopyright: "SherlockWonG. Photography portfolio.",
  footerEmail: "Sherlock7.wong@gmail.com",
  footerBackLabel: "Back to top",
  footerHomeLabel: "Home"
};

const defaultPageMeta = {
  portrait: {
    eyebrow: "Portrait",
    titleLine1: "Portrait studies",
    titleLine2: "with quiet tension.",
    summary: "Portrait work focuses on quiet character, available light, restrained direction, and human presence.",
    tags: ["People", "Available light", "Editorial mood"]
  },
  landscape: {
    eyebrow: "Landscape",
    titleLine1: "Open fields,",
    titleLine2: "controlled silence.",
    summary: "Landscape work studies terrain, distance, weather, and the quiet structure of natural light.",
    tags: ["Terrain", "Light", "Distance"]
  },
  life: {
    eyebrow: "Life",
    titleLine1: "Daily scenes",
    titleLine2: "with lasting weight.",
    summary: "生活作品记录日常片段、旅途中偶遇、室内细节和私人视觉档案，让普通时刻保留安静的重量。",
    tags: ["Everyday", "Archive", "Memory"]
  },
  cityscape: {
    eyebrow: "CityScape",
    titleLine1: "Urban forms",
    titleLine2: "after the noise.",
    summary: "CityScape work captures architecture, street rhythm, night surfaces, and the geometry of urban space.",
    tags: ["Architecture", "Street", "Night"]
  }
};

const sections = [
  { key: "site", label: "主页内容", type: "site" },
  { key: "pageMeta", label: "分类页文案", type: "pageMeta" },
  { key: "portrait", label: "Portrait 窗口", type: "windows" },
  { key: "landscape", label: "Landscape 窗口", type: "windows" },
  { key: "life", label: "Life 窗口", type: "windows" },
  { key: "cityscape", label: "CityScape 窗口", type: "windows" }
];

const windowPageLabels = {
  portrait: "Portrait",
  landscape: "Landscape",
  life: "Life",
  cityscape: "CityScape"
};

const windowLabelPrefixes = {
  portrait: "Portrait",
  landscape: "Landscape",
  life: "Life",
  cityscape: "City"
};

let content = null;
let activeSection = "site";
const contentApi = window.SherlockContentApi;

function setStatus(node, text) {
  node.textContent = text || "";
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

function normalizeContent(rawContent) {
  const next = rawContent || {};
  next.site = { ...defaultSite, ...(next.site || {}) };
  next.pageMeta = {
    portrait: { ...defaultPageMeta.portrait, ...(next.pageMeta?.portrait || {}) },
    landscape: { ...defaultPageMeta.landscape, ...(next.pageMeta?.landscape || {}) },
    life: { ...defaultPageMeta.life, ...(next.pageMeta?.life || {}) },
    cityscape: { ...defaultPageMeta.cityscape, ...(next.pageMeta?.cityscape || {}) }
  };
  next.home = next.home || [];
  next.pages = next.pages || {};
  ["portrait", "landscape", "life", "cityscape"].forEach((key) => {
    next.pages[key] = next.pages[key] || [];
  });
  return next;
}

function sectionItems(key) {
  content.pages[key] = content.pages[key] || [];
  return content.pages[key];
}

function updatePreview(preview, image) {
  if (image) {
    preview.style.backgroundImage = `linear-gradient(145deg, rgba(7,8,13,.08), rgba(7,8,13,.44)), url("${image}")`;
    preview.style.backgroundPosition = "center";
    preview.style.backgroundRepeat = "no-repeat";
    preview.style.backgroundSize = "cover, contain";
  } else {
    preview.style.backgroundImage = "";
    preview.style.backgroundPosition = "";
    preview.style.backgroundRepeat = "";
    preview.style.backgroundSize = "";
  }
}

function formatWindowNumber(value) {
  return String(value).padStart(2, "0");
}

function nextWindowNumber(items, key) {
  const prefix = `${key}-`;
  return (
    items.reduce((max, item) => {
      const value = String(item.id || "");
      if (!value.startsWith(prefix)) return max;
      const number = Number(value.slice(prefix.length));
      return Number.isFinite(number) ? Math.max(max, number) : max;
    }, 0) + 1
  );
}

function fillOrAppendWindowItem(key, image) {
  const items = sectionItems(key);
  const labelPrefix = windowLabelPrefixes[key] || key;
  const reusable = items.find((item) => !String(item.image || "").trim());
  if (reusable) {
    const number = String(reusable.id || "").match(/(\d+)$/)?.[1] || formatWindowNumber(nextWindowNumber(items, key));
    const label = `${labelPrefix} ${formatWindowNumber(Number(number))}`;
    reusable.label = label;
    reusable.title = label;
    reusable.image = image;
    return reusable;
  }

  const number = nextWindowNumber(items, key);
  const item = {
    id: `${key}-${formatWindowNumber(number)}`,
    label: `${labelPrefix} ${formatWindowNumber(number)}`,
    title: `${labelPrefix} ${formatWindowNumber(number)}`,
    image
  };
  items.push(item);
  return item;
}

function createCard(titleText) {
  const card = document.createElement("article");
  card.className = "editor-card";

  const title = document.createElement("h2");
  title.textContent = titleText;
  card.append(title);
  return card;
}

function appendField(card, labelText, value, onInput, options = {}) {
  const label = document.createElement("label");
  const labelSpan = document.createElement("span");
  const input = options.textarea ? document.createElement("textarea") : document.createElement("input");

  labelSpan.textContent = labelText;
  input.value = value || "";
  if (options.placeholder) input.placeholder = options.placeholder;
  input.addEventListener("input", () => onInput(input.value));

  label.append(labelSpan, input);
  card.append(label);
  return input;
}

async function uploadFile(file) {
  return contentApi.uploadFile(file);
}

function appendImageField(card, labelText, value, onChange) {
  const preview = document.createElement("div");
  preview.className = "preview";
  updatePreview(preview, value);
  card.append(preview);

  const imageInput = appendField(card, labelText, value, (nextValue) => {
    onChange(nextValue);
    updatePreview(preview, nextValue);
  });

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png,image/jpeg,image/webp,image/gif";

  const uploadButton = document.createElement("button");
  uploadButton.type = "button";
  uploadButton.textContent = "上传图片";
  uploadButton.addEventListener("click", async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      setStatus(editorStatus, "请先选择图片文件。");
      return;
    }
    try {
      setStatus(editorStatus, "正在上传...");
      const result = await uploadFile(file);
      onChange(result.url);
      imageInput.value = result.url;
      updatePreview(preview, result.url);
      setStatus(editorStatus, "上传完成，请点击“保存全部”。");
    } catch (error) {
      setStatus(editorStatus, error.message);
    }
  });

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.textContent = "清除图片";
  clearButton.addEventListener("click", () => {
    onChange("");
    imageInput.value = "";
    fileInput.value = "";
    updatePreview(preview, "");
  });

  const fileRow = document.createElement("div");
  fileRow.className = "file-row";
  fileRow.append(fileInput, uploadButton, clearButton);
  card.append(fileRow);
}

function renderTabs() {
  tabs.innerHTML = "";
  sections.forEach((section) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = section.label;
    button.classList.toggle("is-active", section.key === activeSection);
    button.addEventListener("click", () => {
      activeSection = section.key;
      renderTabs();
      renderEditor();
    });
    tabs.append(button);
  });
}

function renderSiteEditor() {
  grid.className = "editor-grid editor-grid-wide";
  const site = content.site;

  const identity = createCard("站点身份与导航");
  appendField(identity, "品牌名称", site.brand, (value) => (site.brand = value));
  appendField(identity, "人像导航", site.navPortrait, (value) => (site.navPortrait = value));
  appendField(identity, "风景导航", site.navLandscape, (value) => (site.navLandscape = value));
  appendField(identity, "生活导航", site.navLife, (value) => (site.navLife = value));
  appendField(identity, "城市导航", site.navCityscape, (value) => (site.navCityscape = value));
  appendField(identity, "关于导航", site.navAbout, (value) => (site.navAbout = value));

  const hero = createCard("首页首屏");
  appendField(hero, "标题第 1 行", site.heroLine1, (value) => (site.heroLine1 = value));
  appendField(hero, "标题第 2 行", site.heroLine2, (value) => (site.heroLine2 = value));
  appendField(hero, "标题第 3 行", site.heroLine3, (value) => (site.heroLine3 = value));
  appendField(hero, "首屏简介", site.heroLead, (value) => (site.heroLead = value), { textarea: true });
  appendField(hero, "主按钮文字", site.primaryButtonText, (value) => (site.primaryButtonText = value));
  appendField(hero, "主按钮链接", site.primaryButtonHref, (value) => (site.primaryButtonHref = value));
  appendField(hero, "次按钮文字", site.secondaryButtonText, (value) => (site.secondaryButtonText = value));
  appendField(hero, "次按钮链接", site.secondaryButtonHref, (value) => (site.secondaryButtonHref = value));
  appendImageField(hero, "首屏图片地址", site.heroImage, (value) => (site.heroImage = value));
  appendField(hero, "首屏图片替代文字", site.heroImageAlt, (value) => (site.heroImageAlt = value));

  const portfolio = createCard("作品区");
  appendField(portfolio, "摄影格言", site.quote, (value) => (site.quote = value), { textarea: true });
  appendField(portfolio, "作品区小标题", site.workEyebrow, (value) => (site.workEyebrow = value));
  appendField(portfolio, "作品区标题", site.workTitle, (value) => (site.workTitle = value));
  appendField(portfolio, "全部筛选", site.filterAll, (value) => (site.filterAll = value));
  appendField(portfolio, "人像筛选", site.filterPortrait, (value) => (site.filterPortrait = value));
  appendField(portfolio, "城市筛选", site.filterCity, (value) => (site.filterCity = value));
  appendField(portfolio, "风景筛选", site.filterLandscape, (value) => (site.filterLandscape = value));

  const about = createCard("关于区");
  appendImageField(about, "关于图片地址", site.aboutImage, (value) => (site.aboutImage = value));
  appendField(about, "关于图片替代文字", site.aboutImageAlt, (value) => (site.aboutImageAlt = value));
  appendField(about, "关于小标题", site.aboutEyebrow, (value) => (site.aboutEyebrow = value));
  appendField(about, "关于标题", site.aboutTitle, (value) => (site.aboutTitle = value));
  appendField(about, "关于段落 1", site.aboutBody1, (value) => (site.aboutBody1 = value), { textarea: true });
  appendField(about, "关于段落 2", site.aboutBody2, (value) => (site.aboutBody2 = value), { textarea: true });

  const footer = createCard("页脚");
  appendField(footer, "版权文字", site.footerCopyright, (value) => (site.footerCopyright = value));
  appendField(footer, "邮箱", site.footerEmail, (value) => (site.footerEmail = value));
  appendField(footer, "首页页脚按钮", site.footerBackLabel, (value) => (site.footerBackLabel = value));
  appendField(footer, "分类页页脚按钮", site.footerHomeLabel, (value) => (site.footerHomeLabel = value));

  grid.append(identity, hero, portfolio, about, footer);
}

function renderPageMetaEditor() {
  grid.className = "editor-grid editor-grid-wide";
  const pageNames = {
    portrait: "人像页",
    landscape: "风景页",
    life: "生活页",
    cityscape: "城市页"
  };
  Object.entries(content.pageMeta).forEach(([key, page]) => {
    const card = createCard(pageNames[key] || key);
    appendField(card, "栏目标签", page.eyebrow, (value) => (page.eyebrow = value));
    appendField(card, "标题第 1 行", page.titleLine1, (value) => (page.titleLine1 = value));
    appendField(card, "标题第 2 行", page.titleLine2, (value) => (page.titleLine2 = value));
    appendField(card, "页面说明", page.summary, (value) => (page.summary = value), { textarea: true });
    appendField(card, "标签按钮，使用英文逗号分隔", (page.tags || []).join(", "), (value) => {
      page.tags = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    });
    grid.append(card);
  });
}

function renderWindowEditor() {
  grid.className = "editor-grid editor-grid-wide";
  const items = sectionItems(activeSection);
  const pageLabel = windowPageLabels[activeSection] || activeSection;
  let draftImage = "";

  const uploadCard = createCard(`新增 ${pageLabel} 图片`);
  uploadCard.classList.add("window-upload-card");

  const preview = document.createElement("div");
  preview.className = "preview";
  uploadCard.append(preview);

  const imageInput = appendField(
    uploadCard,
    "图片地址",
    "",
    (value) => {
      draftImage = value.trim();
      updatePreview(preview, draftImage);
    },
    { placeholder: "上传后自动生成，也可以粘贴图片地址" }
  );

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/png,image/jpeg,image/webp,image/gif";

  const uploadButton = document.createElement("button");
  uploadButton.type = "button";
  uploadButton.textContent = "上传并新增窗口";
  uploadButton.addEventListener("click", async () => {
    try {
      let image = draftImage;
      const file = fileInput.files?.[0];
      if (file) {
        setStatus(editorStatus, "正在上传...");
        const result = await uploadFile(file);
        image = result.url;
      }

      if (!image) {
        setStatus(editorStatus, "请先选择图片文件，或填写图片地址。");
        return;
      }

      fillOrAppendWindowItem(activeSection, image);
      setStatus(editorStatus, `已新增到 ${pageLabel}，请点击“保存全部”。`);
      imageInput.value = "";
      fileInput.value = "";
      renderEditor();
    } catch (error) {
      setStatus(editorStatus, error.message);
    }
  });

  const fileRow = document.createElement("div");
  fileRow.className = "file-row";
  fileRow.append(fileInput, uploadButton);
  uploadCard.append(fileRow);
  grid.append(uploadCard);

  const visibleItems = items.filter((item) => String(item.image || "").trim());
  if (!visibleItems.length) {
    const emptyCard = createCard("当前展示窗口");
    const emptyText = document.createElement("p");
    emptyText.textContent = "当前还没有上传图片。上传后会自动生成展示窗口。";
    emptyCard.append(emptyText);
    grid.append(emptyCard);
    return;
  }

  visibleItems.forEach((item) => {
    const card = createCard(item.id);
    card.classList.add("window-item-card");

    const preview = document.createElement("div");
    preview.className = "preview";
    updatePreview(preview, item.image);
    card.append(preview);

    appendField(card, "图片地址", item.image, (value) => {
      item.image = value.trim();
      updatePreview(preview, item.image);
    });

    appendField(card, "窗口标签", item.label, (value) => (item.label = value));
    appendField(card, "窗口标题", item.title, (value) => (item.title = value));

    grid.append(card);
  });
}

function renderEditor() {
  grid.innerHTML = "";
  const section = sections.find((item) => item.key === activeSection);
  if (section.type === "site") renderSiteEditor();
  if (section.type === "pageMeta") renderPageMetaEditor();
  if (section.type === "windows") renderWindowEditor();
}

async function showEditor() {
  content = normalizeContent(await contentApi.loadContent());
  loginView.classList.add("is-hidden");
  editorView.classList.remove("is-hidden");
  renderTabs();
  renderEditor();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(loginStatus, "正在验证...");
  const form = new FormData(loginForm);
  try {
    await contentApi.login({
      username: form.get("username"),
      password: form.get("password")
    });
    setStatus(loginStatus, "");
    await showEditor();
  } catch (error) {
    setStatus(loginStatus, error.message);
  }
});

saveButton.addEventListener("click", async () => {
  setStatus(editorStatus, "正在保存...");
  try {
    await contentApi.saveContent(content);
    setStatus(editorStatus, "已保存。");
  } catch (error) {
    setStatus(editorStatus, error.message);
  }
});

logoutButton.addEventListener("click", async () => {
  await contentApi.logout();
  window.location.reload();
});

(async function init() {
  if (!contentApi) {
    setStatus(loginStatus, "Content API is not loaded.");
    return;
  }
  try {
    const session = await contentApi.getSession();
    if (session.authenticated) await showEditor();
  } catch {
    setStatus(loginStatus, "后台服务未启动。请运行 node server.js，或双击 启动网站.bat。");
  }
})();
