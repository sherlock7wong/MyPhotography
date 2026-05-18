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
  secondaryButtonHref: "/contact/",
  heroImage: "assets/hero-placeholder.svg",
  heroImageAlt: "Placeholder for SherlockWonG signature hero photograph",
  quote: "You don't take a photograph, you make it. - Ansel Adams",
  workEyebrow: "Selected work",
  workTitle: "Portfolio exhibition windows.",
  filterAll: "All",
  filterPortrait: "Portrait",
  filterCity: "CityScape",
  filterLife: "Life",
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
  footerEmail: "Sherlock7.Wong@gmail.com",
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
const uploadFeedbackBySection = {};

function setStatus(node, text) {
  node.textContent = text || "";
}

function setModuleStatus(node, text, tone = "info") {
  node.textContent = text || "";
  node.dataset.tone = tone;
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

const DEFAULT_COLOR_PICKER_VALUE = "#f8ead3";

function colorKeyFor(fieldKey) {
  return `${fieldKey}Color`;
}

function normalizeColor(value) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : "";
}

function colorPickerValue(value) {
  return normalizeColor(value) || DEFAULT_COLOR_PICKER_VALUE;
}

function setTextColor(target, fieldKey, value) {
  const key = colorKeyFor(fieldKey);
  const color = normalizeColor(value);
  if (color) {
    target[key] = color;
    return;
  }
  delete target[key];
}

function appendField(card, labelText, value, onInput, options = {}) {
  const field = document.createElement("div");
  field.className = "field";

  const label = document.createElement("label");
  const labelSpan = document.createElement("span");
  const input = options.textarea ? document.createElement("textarea") : document.createElement("input");

  labelSpan.textContent = labelText;
  input.value = value || "";
  if (options.placeholder) input.placeholder = options.placeholder;
  input.addEventListener("input", () => onInput(input.value));

  label.append(labelSpan, input);
  field.append(label);

  if (options.onColorChange) {
    const colorRow = document.createElement("div");
    colorRow.className = "color-row";

    const colorLabel = document.createElement("span");
    colorLabel.textContent = "文字颜色";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = colorPickerValue(options.colorValue);
    colorInput.setAttribute("aria-label", `${labelText}文字颜色`);
    colorInput.addEventListener("input", () => options.onColorChange(colorInput.value));

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.textContent = "默认颜色";
    resetButton.addEventListener("click", () => {
      colorInput.value = DEFAULT_COLOR_PICKER_VALUE;
      options.onColorChange("");
    });

    colorRow.append(colorLabel, colorInput, resetButton);
    field.append(colorRow);
  }

  card.append(field);
  return input;
}

function appendTextField(card, labelText, target, fieldKey, options = {}) {
  return appendField(
    card,
    labelText,
    target[fieldKey],
    (value) => {
      target[fieldKey] = value;
    },
    {
      ...options,
      colorValue: target[colorKeyFor(fieldKey)],
      onColorChange: (color) => setTextColor(target, fieldKey, color)
    }
  );
}

async function uploadFile(file) {
  return contentApi.uploadFile(file);
}

async function deleteImageAndSave({ image, remove, restore, afterRemove, afterRestore }) {
  const currentImage = String(image || "").trim();
  if (!currentImage) {
    setStatus(editorStatus, "当前没有可删除的图片。");
    return false;
  }

  if (!window.confirm("确定删除这张图片吗？删除后前台将不再展示。")) {
    return false;
  }

  try {
    setStatus(editorStatus, "正在删除图片...");
    remove();
    afterRemove?.();
    await contentApi.saveContent(content);
    await contentApi.deleteFile(currentImage);
    setStatus(editorStatus, "图片已删除并保存。");
    return true;
  } catch (error) {
    restore();
    afterRestore?.();
    try {
      await contentApi.saveContent(content);
    } catch {
      // Keep the original delete error visible.
    }
    setStatus(editorStatus, error.message);
    return false;
  }
}

function appendImageField(card, labelText, value, onChange, options = {}) {
  const preview = document.createElement("div");
  preview.className = "preview";
  updatePreview(preview, value);
  card.append(preview);

  let currentValue = value || "";
  const imageInput = appendField(card, labelText, value, (nextValue) => {
    currentValue = nextValue.trim();
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
      currentValue = result.url;
      onChange(result.url);
      imageInput.value = result.url;
      updatePreview(preview, result.url);
      await contentApi.saveContent(content);
      setStatus(editorStatus, "上传成功，可以上传下一张照片。已保存。");
    } catch (error) {
      setStatus(editorStatus, error.message);
    }
  });

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.textContent = "清除图片";
  clearButton.addEventListener("click", () => {
    currentValue = "";
    onChange("");
    imageInput.value = "";
    fileInput.value = "";
    updatePreview(preview, "");
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "danger-button";
  deleteButton.textContent = "删除图片";
  deleteButton.addEventListener("click", async () => {
    const imageToDelete = currentValue || imageInput.value;
    const deleted = await deleteImageAndSave({
      image: imageToDelete,
      remove: () => {
        currentValue = "";
        if (options.removeImage) {
          options.removeImage();
        } else {
          onChange("");
        }
      },
      restore: () => {
        currentValue = imageToDelete;
        if (options.restoreImage) {
          options.restoreImage(imageToDelete);
        } else {
          onChange(imageToDelete);
        }
      },
      afterRemove: () => {
        imageInput.value = "";
        fileInput.value = "";
        updatePreview(preview, "");
      },
      afterRestore: () => {
        imageInput.value = imageToDelete;
        updatePreview(preview, imageToDelete);
      }
    });
    if (deleted) options.afterDelete?.();
  });

  const fileRow = document.createElement("div");
  fileRow.className = "file-row";
  fileRow.append(fileInput, uploadButton, clearButton, deleteButton);
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
  appendTextField(identity, "品牌名称", site, "brand");
  appendTextField(identity, "人像导航", site, "navPortrait");
  appendTextField(identity, "风景导航", site, "navLandscape");
  appendTextField(identity, "生活导航", site, "navLife");
  appendTextField(identity, "城市导航", site, "navCityscape");
  appendTextField(identity, "关于导航", site, "navAbout");

  const hero = createCard("首页首屏");
  appendTextField(hero, "标题第 1 行", site, "heroLine1");
  appendTextField(hero, "标题第 2 行", site, "heroLine2");
  appendTextField(hero, "标题第 3 行", site, "heroLine3");
  appendTextField(hero, "首屏简介", site, "heroLead", { textarea: true });
  appendTextField(hero, "主按钮文字", site, "primaryButtonText");
  appendField(hero, "主按钮链接", site.primaryButtonHref, (value) => (site.primaryButtonHref = value));
  appendTextField(hero, "次按钮文字", site, "secondaryButtonText");
  appendField(hero, "次按钮链接", site.secondaryButtonHref, (value) => (site.secondaryButtonHref = value));
  appendImageField(hero, "首屏图片地址", site.heroImage, (value) => (site.heroImage = value));
  appendField(hero, "首屏图片替代文字", site.heroImageAlt, (value) => (site.heroImageAlt = value));

  const portfolio = createCard("作品区");
  appendTextField(portfolio, "摄影格言", site, "quote", { textarea: true });
  appendTextField(portfolio, "作品区小标题", site, "workEyebrow");
  appendTextField(portfolio, "作品区标题", site, "workTitle");
  appendTextField(portfolio, "全部筛选", site, "filterAll");
  appendTextField(portfolio, "人像筛选", site, "filterPortrait");
  appendTextField(portfolio, "城市筛选", site, "filterCity");
  appendTextField(portfolio, "生活筛选", site, "filterLife");
  appendTextField(portfolio, "风景筛选", site, "filterLandscape");

  const about = createCard("关于区");
  appendImageField(about, "关于图片地址", site.aboutImage, (value) => (site.aboutImage = value));
  appendField(about, "关于图片替代文字", site.aboutImageAlt, (value) => (site.aboutImageAlt = value));
  appendTextField(about, "关于小标题", site, "aboutEyebrow");
  appendTextField(about, "关于标题", site, "aboutTitle");
  appendTextField(about, "关于段落 1", site, "aboutBody1", { textarea: true });
  appendTextField(about, "关于段落 2", site, "aboutBody2", { textarea: true });

  const footer = createCard("页脚");
  appendTextField(footer, "版权文字", site, "footerCopyright");
  appendTextField(footer, "邮箱", site, "footerEmail");
  appendTextField(footer, "首页页脚按钮", site, "footerBackLabel");
  appendTextField(footer, "分类页页脚按钮", site, "footerHomeLabel");

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
    appendTextField(card, "栏目标签", page, "eyebrow");
    appendTextField(card, "标题第 1 行", page, "titleLine1");
    appendTextField(card, "标题第 2 行", page, "titleLine2");
    appendTextField(card, "页面说明", page, "summary", { textarea: true });
    appendField(card, "标签按钮，使用英文逗号分隔", (page.tags || []).join(", "), (value) => {
      page.tags = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }, {
      colorValue: page.tagsColor,
      onColorChange: (color) => {
        const nextColor = normalizeColor(color);
        if (nextColor) {
          page.tagsColor = nextColor;
          return;
        }
        delete page.tagsColor;
      }
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
  fileInput.multiple = true;

  const uploadButton = document.createElement("button");
  uploadButton.type = "button";
  uploadButton.textContent = "上传并新增窗口";

  const uploadStatus = document.createElement("p");
  uploadStatus.className = "module-status";
  uploadStatus.setAttribute("role", "status");
  const currentFeedback = uploadFeedbackBySection[activeSection];
  setModuleStatus(uploadStatus, currentFeedback?.text || "", currentFeedback?.tone);

  uploadButton.addEventListener("click", async () => {
    try {
      const files = Array.from(fileInput.files || []);
      if (!files.length && !draftImage) {
        uploadFeedbackBySection[activeSection] = { text: "请先选择图片文件，或填写图片地址。", tone: "error" };
        setModuleStatus(uploadStatus, uploadFeedbackBySection[activeSection].text, "error");
        setStatus(editorStatus, "");
        return;
      }

      const images = [];
      if (files.length) {
        for (const [index, file] of files.entries()) {
          const progressText = `正在上传 ${index + 1}/${files.length}...`;
          uploadFeedbackBySection[activeSection] = { text: progressText, tone: "info" };
          setModuleStatus(uploadStatus, progressText);
          const result = await uploadFile(file);
          images.push(result.url);
        }
      }
      if (draftImage) images.push(draftImage);

      images.forEach((image) => fillOrAppendWindowItem(activeSection, image));
      await contentApi.saveContent(content);
      imageInput.value = "";
      fileInput.value = "";
      draftImage = "";
      const message =
        images.length === 1
          ? `上传成功，已新增到 ${pageLabel}，可以上传下一张照片。`
          : `已成功上传 ${images.length} 张图片到 ${pageLabel}，可以继续上传下一批照片。`;
      uploadFeedbackBySection[activeSection] = { text: message, tone: "success" };
      renderEditor();
      setStatus(editorStatus, "");
    } catch (error) {
      uploadFeedbackBySection[activeSection] = { text: error.message, tone: "error" };
      setModuleStatus(uploadStatus, error.message, "error");
      setStatus(editorStatus, "");
    }
  });

  const fileRow = document.createElement("div");
  fileRow.className = "file-row";
  fileRow.append(fileInput, uploadButton);
  uploadCard.append(fileRow);
  uploadCard.append(uploadStatus);
  grid.append(uploadCard);

  const visibleItems = items.filter((item) => String(item.image || "").trim());
  if (!visibleItems.length) {
    return;
  }

  visibleItems.forEach((item) => {
    const card = createCard(item.id);
    card.classList.add("window-item-card");
    let removedIndex = -1;

    appendImageField(
      card,
      "图片地址",
      item.image,
      (value) => (item.image = value.trim()),
      {
        removeImage: () => {
          const list = sectionItems(activeSection);
          removedIndex = list.indexOf(item);
          if (removedIndex >= 0) list.splice(removedIndex, 1);
        },
        restoreImage: (imageToDelete) => {
          item.image = imageToDelete;
          const list = sectionItems(activeSection);
          if (!list.includes(item)) {
            const insertIndex = removedIndex >= 0 ? Math.min(removedIndex, list.length) : list.length;
            list.splice(insertIndex, 0, item);
          }
          removedIndex = -1;
        },
        afterDelete: renderEditor
      }
    );
    appendTextField(card, "窗口标签", item, "label");
    appendTextField(card, "窗口标题", item, "title");

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
