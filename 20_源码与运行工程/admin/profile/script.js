const STORAGE_KEY = "wong.visual.profile.management.v1";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const DEFAULT_DATA = {
  profile: {
    displayName: "WonG",
    identityRole: "Photographer / Visual Archive",
    location: "Shenzhen, China",
    availability: "Open for commissioned projects and collaborations",
    shortIntro:
      "I explore the relationship between place and people. Natural light, honest observation, and quiet moments in between.",
    biography:
      "I'm WonG, a photographer and visual archivist drawn to honest moments, natural light, and the quiet poetry of everyday life.\n\nMy work moves between people and places - portraits, landscapes, and the rhythm of the city. I believe in photographing with curiosity and respect, letting stories unfold as they are.\n\nThis portfolio is my ongoing archive and visual notebook.",
    email: "wong.studios@proton.me",
    social: "",
    archiveNo: "A08",
    updated: "June 2026",
    basedIn: "Shenzhen, China",
    avatar: "assets/photographer.png",
    skills: ["Portrait", "Landscape", "City Humanity", "Personal", "Documentary", "Natural Light", "Visual Storytelling", "Film Aesthetic", "Editing & Post"],
    gallery: [
      { src: "assets/portrait.png", alt: "Portrait collection preview" },
      { src: "assets/landscape.png", alt: "Landscape collection preview" },
      { src: "assets/city-humanity.png", alt: "City humanity collection preview" },
      { src: "assets/personal.png", alt: "Personal diary collection preview" },
      { src: "Image/about-portrait-crop.png", alt: "WonG sitting beside a window and holding a camera" }
    ]
  },
  home: {
    headerBrand: "WonG",
    headerKicker: "Photographer / Visual Archive",
    nav: [
      { label: "Home", href: "index.html" },
      { label: "About", href: "../about/index.html" },
      { label: "Projects", href: "../Project/index.html" },
      { label: "Photography", href: "#collections" },
      { label: "Contact", href: "#contact" }
    ],
    archiveMeta: {
      archiveNo: "00",
      updated: "June 2026",
      basedIn: "Shenzhen, China"
    },
    heroTitle: "Wong Archive",
    heroStamp: "Capture life,\nstories in light.",
    photoStrip: [
      {
        index: "01",
        type: "Portrait",
        image: "assets/portrait.png",
        alt: "A quiet portrait of a woman sitting beside a window",
        filmMeta: "112  Portra 400  02",
        filmFoot: "11A",
        active: false
      },
      {
        index: "02",
        type: "Landscape",
        image: "assets/landscape.png",
        alt: "A misty coastline with waves and cliffs",
        filmMeta: "133  Landscape  502",
        filmFoot: "12A",
        active: false
      },
      {
        index: "03",
        type: "Archive Cover",
        image: "assets/photographer.png",
        alt: "A photographer holding a camera in soft window light",
        filmMeta: "D T  F Parrella H 40",
        filmFoot: "W01",
        active: true
      },
      {
        index: "04",
        type: "City Humanity",
        image: "assets/city-humanity.png",
        alt: "A person crossing a quiet city street",
        filmMeta: "312  City Humanity  942",
        filmFoot: "08",
        active: false
      },
      {
        index: "05",
        type: "Personal",
        image: "assets/personal.png",
        alt: "A cup of coffee beside a book on a quiet table",
        filmMeta: "713  Personal  42",
        filmFoot: "13A",
        active: false
      }
    ],
    introCard: {
      kicker: "WonG",
      role: "Photographer / Visual Archive",
      introCopy:
        "I explore the relationship between place and people.\nNatural light, honest observation,\nand quiet moments in between.",
      button1Text: "View Photography",
      button1Link: "#collections",
      button2Text: "Contact",
      button2Link: "#contact"
    },
    collections: [
      {
        index: "01",
        title: "Portrait",
        image: "assets/portrait.png",
        description: "Faces, expressions, and intimate light.",
        link: "#collections",
        active: true
      },
      {
        index: "02",
        title: "Landscape",
        image: "assets/landscape.png",
        description: "Nature, distance, and the light of place.",
        link: "#collections",
        active: true
      },
      {
        index: "03",
        title: "City Humanity",
        image: "assets/city-humanity.png",
        description: "Streets, people, and the rhythm of the city.",
        link: "#collections",
        active: true
      },
      {
        index: "04",
        title: "Personal",
        image: "assets/personal.png",
        description: "Diary fragments and quiet everyday details.",
        link: "#collections",
        active: true
      }
    ],
    footer: {
      archiveLabel: "Archive",
      archiveText: "WonG",
      captureLabel: "Capture Life",
      captureText: "Keep it real.",
      photographyLabel: "Photography",
      photographyText: "Stories in light.",
      copyrightYear: "2026",
      copyrightName: "WonG"
    }
  },
  about: {
    pageTitle: "About",
    pagePath: "/about",
    heroImage: "Image/about-portrait-crop.png",
    frame: {
      leftText: "WonG Archive / Portra 400",
      rightText: "X100T",
      topNumber: "12",
      bottomNumber: "43"
    },
    archiveMeta: {
      archiveNo: "01",
      updated: "May 2025",
      basedIn: "Shenzhen, China"
    },
    details: {
      name: "WonG",
      role: "Photographer / Visual Archive",
      location: "Shenzhen, China",
      availability: "Open for commissioned projects and collaborations",
      email: "wong.studios@proton.me"
    },
    biographyParagraphs: [
      "I'm WonG, a photographer and visual archivist drawn to honest moments, natural light, and the quiet poetry of everyday life.",
      "My work moves between people and places - portraits, landscapes, and the rhythm of the city. I believe in photographing with curiosity and respect, letting stories unfold as they are.",
      "This portfolio is my ongoing archive and visual notebook."
    ],
    skills: ["Portrait", "Landscape", "City Humanity", "Personal", "Documentary", "Natural Light", "Visual Storytelling", "Film Aesthetic", "Editing & Post"],
    experiences: [
      {
        date: "2014 - 2016",
        title: "Photography Beginnings",
        place: "Shenzhen, China",
        description: "Exploring street and travel photography. Learning to see the world with a camera.",
        label: "Personal Project",
        active: true
      },
      {
        date: "2016 - 2018",
        title: "Independent Creator",
        place: "Shenzhen, China",
        description: "Building personal projects and visual stories focused on people and place.",
        label: "Independent Work",
        active: true
      },
      {
        date: "2018 - 2020",
        title: "Visual Storyteller",
        place: "Shenzhen, China",
        description: "Working on commissioned projects and documenting real-life stories.",
        label: "Commercial & Editorial",
        active: true
      },
      {
        date: "2020 - 2022",
        title: "Collaboration & Projects",
        place: "Shenzhen, China",
        description: "Collaborating with brands and creators on photo and visual campaigns.",
        label: "Commercial Work",
        active: true
      },
      {
        date: "2022 - 2024",
        title: "Expanding Perspectives",
        place: "Shenzhen, China",
        description: "Expanding long-term projects and deepening documentary photography.",
        label: "Personal & Editorial",
        active: true
      },
      {
        date: "2024 - Now",
        title: "Ongoing Archive",
        place: "Shenzhen, China",
        description: "Continuing the archive, exploring new stories and visual expressions.",
        label: "Ongoing",
        active: true
      }
    ]
  },
  components: {
    home: {
      header: true,
      heroArchiveMeta: true,
      heroStamp: true,
      photoStrip: true,
      introCard: true,
      heroControl: true,
      scrollCallout: true,
      collections: true,
      footer: true
    },
    about: {
      header: true,
      aboutHeroImage: true,
      archiveMeta: true,
      profileDetails: true,
      biography: true,
      skills: true,
      experienceTimeline: true,
      footer: true,
      jsonLdSeoBlock: true
    }
  }
};

let state = loadState();
let isDirty = false;
let toastTimer = null;

const formRoot = document.getElementById("profileForm");
const previewRoot = document.getElementById("profilePreview");
const timelineRows = document.getElementById("timelineRows");
const unsavedNotice = document.getElementById("unsavedNotice");
const toast = document.getElementById("toast");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const fallback = clone(DEFAULT_DATA);

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;
    return mergeDefaults(fallback, JSON.parse(saved));
  } catch (error) {
    return fallback;
  }
}

function mergeDefaults(defaultValue, savedValue) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(savedValue) ? savedValue : clone(defaultValue);
  }

  if (defaultValue && typeof defaultValue === "object") {
    const merged = {};
    Object.keys(defaultValue).forEach((key) => {
      merged[key] = mergeDefaults(defaultValue[key], savedValue ? savedValue[key] : undefined);
    });
    return merged;
  }

  return savedValue === undefined || savedValue === null ? defaultValue : savedValue;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(value) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function getByPath(path) {
  return path.split(".").reduce((target, part) => {
    if (target === undefined || target === null) return undefined;
    return target[part];
  }, state);
}

function setByPath(path, value) {
  const parts = path.split(".");
  let target = state;

  parts.slice(0, -1).forEach((part) => {
    target = target[part];
  });

  target[parts[parts.length - 1]] = value;
}

function resolveImage(src) {
  if (!src) return "";
  if (/^(data:|https?:|blob:|\.\.\/|\.\.\\|\/)/i.test(src)) return src;
  if (src.startsWith("assets/")) return `../../Home/${src}`;
  if (src.startsWith("Image/")) return `../../about/${src}`;
  return src;
}

function imageMarkup(src, alt) {
  const resolved = resolveImage(src);
  if (!resolved) return `<div class="placeholder-box">TODO: image</div>`;
  return `<img src="${escapeHtml(resolved)}" alt="${escapeHtml(alt || "")}" />`;
}

function inputField(label, path, options = {}) {
  const value = getByPath(path) ?? "";
  const required = options.required ? " *" : "";
  const placeholder = options.placeholder ? ` placeholder="${escapeHtml(options.placeholder)}"` : "";
  const maxlength = options.maxlength ? ` maxlength="${options.maxlength}"` : "";
  const type = options.type || "text";

  return `
    <label class="field ${options.wide ? "is-wide" : ""}">
      <span>${escapeHtml(label)}${required}</span>
      <input type="${type}" data-bind="${escapeHtml(path)}" value="${escapeHtml(value)}"${placeholder}${maxlength} />
      ${options.maxlength ? `<span class="field-footer"><span data-count-for="${escapeHtml(path)}">${String(value).length}</span> / ${options.maxlength}</span>` : ""}
    </label>
  `;
}

function textareaField(label, path, options = {}) {
  const value = getByPath(path) ?? "";
  const required = options.required ? " *" : "";
  const placeholder = options.placeholder ? ` placeholder="${escapeHtml(options.placeholder)}"` : "";
  const maxlength = options.maxlength ? ` maxlength="${options.maxlength}"` : "";

  return `
    <label class="field ${options.wide ? "is-wide" : ""}">
      <span>${escapeHtml(label)}${required}</span>
      <textarea class="${options.short ? "short" : ""}" data-bind="${escapeHtml(path)}"${placeholder}${maxlength}>${escapeHtml(value)}</textarea>
      ${options.maxlength ? `<span class="field-footer"><span data-count-for="${escapeHtml(path)}">${String(value).length}</span> / ${options.maxlength}</span>` : ""}
    </label>
  `;
}

function selectField(label, path, options) {
  const value = getByPath(path) ?? "";

  return `
    <label class="field">
      <span>${escapeHtml(label)} *</span>
      <select data-bind="${escapeHtml(path)}">
        ${options
          .map((option) => `<option value="${escapeHtml(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`)
          .join("")}
      </select>
    </label>
  `;
}

function checkboxField(label, path) {
  const checked = getByPath(path) ? "checked" : "";

  return `
    <label class="switch-row">
      <span>${escapeHtml(label)}</span>
      <span class="switch">
        <input type="checkbox" data-bind="${escapeHtml(path)}" data-type="checkbox" ${checked} />
        <span aria-hidden="true"></span>
      </span>
    </label>
  `;
}

function renderTags(path) {
  const tags = getByPath(path) || [];
  return `
    <div class="tag-editor">
      <ul class="tag-list">
        ${tags
          .map(
            (tag, index) => `
              <li class="tag-pill">
                ${escapeHtml(tag)}
                <button type="button" data-action="remove-tag" data-tag-path="${escapeHtml(path)}" data-tag-index="${index}" aria-label="Remove ${escapeHtml(tag)}">x</button>
              </li>
            `
          )
          .join("")}
      </ul>
      <input class="tag-input" type="text" data-tag-input="${escapeHtml(path)}" placeholder="Add tag and press Enter" />
    </div>
  `;
}

function renderEditor() {
  formRoot.innerHTML = `
    <details class="editor-section" open>
      <summary>Basic Information</summary>
      <div class="section-body">
        <div class="form-grid">
          ${inputField("Display Name", "profile.displayName", { required: true })}
          ${inputField("Identity / Role", "profile.identityRole", { required: true })}
          ${inputField("Location", "profile.location", { required: true })}
          ${selectField("Availability", "profile.availability", [
            "Open for commissioned projects and collaborations",
            "Available for commissions",
            "Limited availability",
            "Not available"
          ])}
          ${textareaField("Short Intro", "profile.shortIntro", { wide: true, short: true, required: true, maxlength: 120 })}
          ${textareaField("Biography", "profile.biography", { wide: true, required: true, maxlength: 500 })}
          ${inputField("Email", "profile.email", { type: "email" })}
          ${inputField("Instagram / Social Handle", "profile.social", { placeholder: "TODO: add social handle" })}
          ${inputField("Archive No.", "profile.archiveNo")}
          ${inputField("Updated", "profile.updated")}
          ${inputField("Based in", "profile.basedIn")}
        </div>
      </div>
    </details>

    <details class="editor-section" open>
      <summary>Images & Gallery</summary>
      <div class="section-body">
        <div class="image-tools">
          <figure class="avatar-preview" aria-label="Avatar current image">
            ${imageMarkup(state.profile.avatar, `${state.profile.displayName} avatar`)}
          </figure>
          <label class="upload-box">
            <input type="file" accept="image/*" data-upload="profile.avatar" />
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>
              Click to upload
              <small>PNG / JPG. Max 5MB</small>
            </span>
          </label>
        </div>

        <div class="gallery-editor">
          <div class="panel-heading">
            <h3 class="section-kicker">Gallery thumbnails</h3>
            <button class="secondary-button" type="button" data-action="add-gallery">Add Image</button>
          </div>
          <div class="gallery-list">
            ${state.profile.gallery.map(renderGalleryItem).join("")}
          </div>
        </div>
      </div>
    </details>

    <details class="editor-section" open>
      <summary>Skill Tags</summary>
      <div class="section-body">
        ${renderTags("profile.skills")}
      </div>
    </details>

    <details class="editor-section">
      <summary>Home Page Content</summary>
      <div class="section-body">
        <div class="form-grid">
          ${inputField("Header brand", "home.headerBrand")}
          ${inputField("Header kicker", "home.headerKicker")}
          ${inputField("Archive No.", "home.archiveMeta.archiveNo")}
          ${inputField("Updated", "home.archiveMeta.updated")}
          ${inputField("Based in", "home.archiveMeta.basedIn")}
          ${inputField("Hero title", "home.heroTitle")}
          ${textareaField("Hero stamp", "home.heroStamp", { wide: true, short: true })}
        </div>

        <div class="nested-card">
          <div class="panel-heading">
            <h4>Header nav text and links</h4>
            <button class="small-button" type="button" data-action="add-home-nav">Add Nav</button>
          </div>
          <div class="nav-list">${state.home.nav.map(renderNavItem).join("")}</div>
        </div>

        <div class="nested-card">
          <div class="panel-heading">
            <h4>Photo Strip</h4>
            <button class="small-button" type="button" data-action="add-photo-strip">Add Photo</button>
          </div>
          <div class="photo-strip-list">${state.home.photoStrip.map(renderPhotoStripItem).join("")}</div>
        </div>

        <div class="nested-card">
          <h4>Intro Card</h4>
          <div class="form-grid">
            ${inputField("Kicker", "home.introCard.kicker")}
            ${inputField("Role", "home.introCard.role")}
            ${textareaField("Intro copy", "home.introCard.introCopy", { wide: true, short: true })}
            ${inputField("Button 1 text", "home.introCard.button1Text")}
            ${inputField("Button 1 link", "home.introCard.button1Link")}
            ${inputField("Button 2 text", "home.introCard.button2Text")}
            ${inputField("Button 2 link", "home.introCard.button2Link")}
          </div>
        </div>

        <div class="nested-card">
          <div class="panel-heading">
            <h4>Collection Cards</h4>
            <button class="small-button" type="button" data-action="add-collection">Add Card</button>
          </div>
          <div class="collection-list">${state.home.collections.map(renderCollectionItem).join("")}</div>
        </div>

        <div class="nested-card">
          <h4>Footer</h4>
          <div class="form-grid">
            ${inputField("Archive label", "home.footer.archiveLabel")}
            ${inputField("Archive text", "home.footer.archiveText")}
            ${inputField("Capture Life label", "home.footer.captureLabel")}
            ${inputField("Capture Life text", "home.footer.captureText")}
            ${inputField("Photography label", "home.footer.photographyLabel")}
            ${inputField("Photography text", "home.footer.photographyText")}
            ${inputField("Copyright year", "home.footer.copyrightYear")}
            ${inputField("Copyright name", "home.footer.copyrightName")}
          </div>
        </div>
      </div>
    </details>

    <details class="editor-section">
      <summary>About Page Content</summary>
      <div class="section-body">
        <div class="form-grid">
          ${inputField("Page title", "about.pageTitle")}
          ${inputField("Page path", "about.pagePath")}
          ${inputField("About hero image", "about.heroImage", { wide: true })}
          ${inputField("Frame left text", "about.frame.leftText")}
          ${inputField("Frame right text", "about.frame.rightText")}
          ${inputField("Frame top number", "about.frame.topNumber")}
          ${inputField("Frame bottom number", "about.frame.bottomNumber")}
          ${inputField("Archive No.", "about.archiveMeta.archiveNo")}
          ${inputField("Updated", "about.archiveMeta.updated")}
          ${inputField("Based in", "about.archiveMeta.basedIn")}
          ${inputField("Name", "about.details.name")}
          ${inputField("Role", "about.details.role")}
          ${inputField("Location", "about.details.location")}
          ${inputField("Availability", "about.details.availability")}
          ${inputField("Email", "about.details.email", { type: "email" })}
        </div>

        <div class="nested-card">
          <div class="panel-heading">
            <h4>Biography paragraphs</h4>
            <button class="small-button" type="button" data-action="add-bio-paragraph">Add Paragraph</button>
          </div>
          <div class="paragraph-list">${state.about.biographyParagraphs.map(renderBioParagraph).join("")}</div>
        </div>

        <div class="nested-card">
          <h4>Skills & Focus</h4>
          ${renderTags("about.skills")}
        </div>
      </div>
    </details>

    <details class="editor-section" open>
      <summary>Component Control</summary>
      <div class="section-body component-grid">
        <div class="component-group">
          <p class="component-group-title">Home components</p>
          ${checkboxField("Header", "components.home.header")}
          ${checkboxField("Hero Archive Meta", "components.home.heroArchiveMeta")}
          ${checkboxField("Hero Stamp", "components.home.heroStamp")}
          ${checkboxField("Photo Strip", "components.home.photoStrip")}
          ${checkboxField("Intro Card", "components.home.introCard")}
          ${checkboxField("Hero Control", "components.home.heroControl")}
          ${checkboxField("Scroll Callout", "components.home.scrollCallout")}
          ${checkboxField("Collections", "components.home.collections")}
          ${checkboxField("Footer", "components.home.footer")}
        </div>
        <div class="component-group">
          <p class="component-group-title">About components</p>
          ${checkboxField("Header", "components.about.header")}
          ${checkboxField("About Hero Image", "components.about.aboutHeroImage")}
          ${checkboxField("Archive Meta", "components.about.archiveMeta")}
          ${checkboxField("Profile Details", "components.about.profileDetails")}
          ${checkboxField("Biography", "components.about.biography")}
          ${checkboxField("Skills", "components.about.skills")}
          ${checkboxField("Experience Timeline", "components.about.experienceTimeline")}
          ${checkboxField("Footer", "components.about.footer")}
          ${checkboxField("JSON-LD SEO Block", "components.about.jsonLdSeoBlock")}
        </div>
      </div>
    </details>
  `;
}

function renderGalleryItem(item, index) {
  return `
    <div class="gallery-item">
      <figure>${imageMarkup(item.src, item.alt)}</figure>
      <div class="form-grid">
        ${inputField("Image address", `profile.gallery.${index}.src`, { wide: true })}
        ${inputField("Alt text", `profile.gallery.${index}.alt`, { wide: true })}
      </div>
      <div class="gallery-actions">
        <label class="gallery-file">
          Replace
          <input type="file" accept="image/*" data-gallery-upload="${index}" />
        </label>
        <button class="danger-button" type="button" data-action="delete-gallery" data-index="${index}">Delete</button>
      </div>
    </div>
  `;
}

function renderNavItem(item, index) {
  return `
    <div class="inline-card">
      <div class="form-grid">
        ${inputField("Nav text", `home.nav.${index}.label`)}
        ${inputField("Nav link", `home.nav.${index}.href`)}
      </div>
      <button class="danger-button" type="button" data-action="delete-home-nav" data-index="${index}">Delete Nav</button>
    </div>
  `;
}

function renderPhotoStripItem(item, index) {
  return `
    <div class="inline-card">
      <div class="form-grid">
        ${inputField("Index", `home.photoStrip.${index}.index`)}
        ${inputField("Type name", `home.photoStrip.${index}.type`)}
        ${inputField("Image address", `home.photoStrip.${index}.image`, { wide: true })}
        ${inputField("Alt text", `home.photoStrip.${index}.alt`, { wide: true })}
        ${inputField("Film meta", `home.photoStrip.${index}.filmMeta`)}
        ${inputField("Film foot", `home.photoStrip.${index}.filmFoot`)}
      </div>
      <div class="row-actions">
        ${checkboxField("Active", `home.photoStrip.${index}.active`)}
        <button class="danger-button" type="button" data-action="delete-photo-strip" data-index="${index}">Delete Photo</button>
      </div>
    </div>
  `;
}

function renderCollectionItem(item, index) {
  return `
    <div class="inline-card">
      <div class="form-grid">
        ${inputField("Index", `home.collections.${index}.index`)}
        ${inputField("Title", `home.collections.${index}.title`)}
        ${inputField("Image", `home.collections.${index}.image`, { wide: true })}
        ${inputField("Description", `home.collections.${index}.description`, { wide: true })}
        ${inputField("Link", `home.collections.${index}.link`)}
      </div>
      <div class="row-actions">
        ${checkboxField("Active", `home.collections.${index}.active`)}
        <button class="danger-button" type="button" data-action="delete-collection" data-index="${index}">Delete Card</button>
      </div>
    </div>
  `;
}

function renderBioParagraph(paragraph, index) {
  return `
    <div class="inline-card">
      ${textareaField(`Paragraph ${index + 1}`, `about.biographyParagraphs.${index}`, { wide: true, short: true })}
      <button class="danger-button" type="button" data-action="delete-bio-paragraph" data-index="${index}">Delete Paragraph</button>
    </div>
  `;
}

function renderTimeline() {
  timelineRows.innerHTML = state.about.experiences
    .map(
      (item, index) => `
        <tr>
          <td><span class="drag-handle" aria-label="Sort handle">::</span></td>
          <td><input data-bind="about.experiences.${index}.date" value="${escapeHtml(item.date)}" aria-label="Experience year" /></td>
          <td><input data-bind="about.experiences.${index}.title" value="${escapeHtml(item.title)}" aria-label="Experience title or role" /></td>
          <td><input data-bind="about.experiences.${index}.place" value="${escapeHtml(item.place)}" aria-label="Experience place or project" /></td>
          <td>
            <textarea data-bind="about.experiences.${index}.description" aria-label="Experience description">${escapeHtml(item.description)}</textarea>
            <div class="timeline-extra">
              <input class="timeline-label" data-bind="about.experiences.${index}.label" value="${escapeHtml(item.label)}" aria-label="Experience category label" />
              <label class="check-inline">
                <input type="checkbox" data-bind="about.experiences.${index}.active" data-type="checkbox" ${item.active ? "checked" : ""} />
                Active
              </label>
            </div>
          </td>
          <td>
            <div class="row-actions">
              <button class="action-icon" type="button" data-action="move-experience-up" data-index="${index}" aria-label="Move experience up">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 14 5-5 5 5" /></svg>
              </button>
              <button class="action-icon" type="button" data-action="move-experience-down" data-index="${index}" aria-label="Move experience down">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
              </button>
              <button class="action-icon" type="button" data-action="edit-experience" data-index="${index}" aria-label="Edit experience">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" /></svg>
              </button>
              <button class="action-icon is-danger" type="button" data-action="delete-experience" data-index="${index}" aria-label="Delete experience">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 14h10l1-14" /></svg>
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderPreview() {
  const profile = state.profile;
  const home = state.home;
  const about = state.about;
  const components = state.components;
  const activePhoto = home.photoStrip.find((item) => item.active) || home.photoStrip[0];
  const activeCollections = home.collections.filter((item) => item.active);
  const activeExperiences = about.experiences.filter((item) => item.active).slice(0, 3);

  previewRoot.innerHTML = `
    <div class="preview-identity">
      <figure class="preview-photo">
        ${components.about.aboutHeroImage ? imageMarkup(profile.avatar, `${profile.displayName} avatar`) : `<div class="placeholder-box">About Hero Image hidden</div>`}
      </figure>
      <div class="preview-title">
        <h3>${escapeHtml(profile.displayName)}</h3>
        <p class="preview-role">${escapeHtml(profile.identityRole)}</p>
        <p class="preview-intro">${escapeHtml(profile.shortIntro)}</p>
        <ul class="tag-list">
          ${profile.skills.map((tag) => `<li class="chip">${escapeHtml(tag)}</li>`).join("")}
        </ul>
        <ul class="preview-contact">
          <li>${smallIcon("pin")}${escapeHtml(profile.location || "TODO: add location")}</li>
          <li>${smallIcon("mail")}${escapeHtml(profile.email || "TODO: add email")}</li>
          <li>${smallIcon("camera")}${escapeHtml(profile.social || "TODO: add social handle")}</li>
          <li>${smallIcon("clock")}${escapeHtml(profile.availability || "TODO: add availability")}</li>
        </ul>
      </div>
    </div>

    <div class="preview-gallery">
      ${profile.gallery.map((item) => `<figure class="preview-thumb">${imageMarkup(item.src, item.alt)}</figure>`).join("")}
    </div>

    ${components.home.header ? previewSection("Home Header", `${home.headerBrand} / ${home.headerKicker}`) : ""}
    ${components.home.heroArchiveMeta ? previewSection("Home Archive Meta", `No. ${home.archiveMeta.archiveNo} / ${home.archiveMeta.updated} / ${home.archiveMeta.basedIn}`) : ""}
    ${components.home.heroStamp ? previewSection("Home Hero", `${home.heroTitle} - ${home.heroStamp.replace(/\n/g, " ")}`) : ""}
    ${
      components.home.photoStrip && activePhoto
        ? previewSection("Home Photo Strip", `${activePhoto.index} ${activePhoto.type} / ${activePhoto.filmMeta} / ${activePhoto.filmFoot}`)
        : ""
    }
    ${
      components.home.introCard
        ? previewSection("Intro Card", `${home.introCard.kicker} / ${home.introCard.role}`, home.introCard.introCopy)
        : ""
    }
    ${
      components.home.collections
        ? `<div class="preview-section"><p class="section-kicker">Collections</p><ul class="preview-modules">${activeCollections
            .map((item) => `<li class="chip">${escapeHtml(item.index)} ${escapeHtml(item.title)}</li>`)
            .join("")}</ul></div>`
        : ""
    }
    ${components.about.archiveMeta ? previewSection("About Archive Meta", `No. ${about.archiveMeta.archiveNo} / ${about.archiveMeta.updated} / ${about.archiveMeta.basedIn}`) : ""}
    ${
      components.about.profileDetails
        ? previewSection("Profile Details", `${about.details.name} / ${about.details.role} / ${about.details.location}`, about.details.availability)
        : ""
    }
    ${
      components.about.biography
        ? `<div class="preview-section"><p class="section-kicker">Biography</p>${about.biographyParagraphs
            .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
            .join("")}</div>`
        : ""
    }
    ${
      components.about.skills
        ? `<div class="preview-section"><p class="section-kicker">Skills & Focus</p><ul class="preview-modules">${about.skills
            .map((tag) => `<li class="chip">${escapeHtml(tag)}</li>`)
            .join("")}</ul></div>`
        : ""
    }
    ${
      components.about.experienceTimeline
        ? `<div class="preview-section"><p class="section-kicker">Experience Timeline</p>${activeExperiences
            .map((item) => `<p><strong>${escapeHtml(item.date)}</strong> ${escapeHtml(item.title)} / ${escapeHtml(item.place)}</p>`)
            .join("")}</div>`
        : ""
    }
    <div class="preview-section">
      <p class="section-kicker">Component Status</p>
      <ul class="preview-modules">
        ${moduleChip("Home Header", components.home.header)}
        ${moduleChip("Home Footer", components.home.footer)}
        ${moduleChip("About Header", components.about.header)}
        ${moduleChip("About Footer", components.about.footer)}
        ${moduleChip("JSON-LD", components.about.jsonLdSeoBlock)}
      </ul>
    </div>
  `;
}

function smallIcon(type) {
  const paths = {
    pin: '<path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.2" />',
    mail: '<path d="M4 6h16v12H4zM4 7l8 6 8-6" />',
    camera: '<path d="M5 8h3l2-3h4l2 3h3v11H5z" /><circle cx="12" cy="13" r="3.2" />',
    clock: '<circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" />'
  };

  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[type]}</svg>`;
}

function previewSection(kicker, title, body = "") {
  return `
    <div class="preview-section">
      <p class="section-kicker">${escapeHtml(kicker)}</p>
      <h4>${escapeHtml(title)}</h4>
      ${body ? `<p>${textToHtml(body)}</p>` : ""}
    </div>
  `;
}

function moduleChip(label, enabled) {
  return `<li class="chip preview-module ${enabled ? "" : "is-off"}">${escapeHtml(label)}</li>`;
}

function updateSharedChrome() {
  const avatar = resolveImage(state.profile.avatar);
  document.querySelectorAll('[data-render="sidebarAvatar"], [data-render="topAvatar"]').forEach((image) => {
    image.src = avatar || "";
    image.alt = `${state.profile.displayName} avatar`;
  });

  document.querySelectorAll('[data-render="sidebarName"], [data-render="topName"]').forEach((node) => {
    node.textContent = state.profile.displayName;
  });

  document.querySelector('[data-render="topArchiveNo"]').textContent = state.profile.archiveNo || "TODO";
}

function updateCounts() {
  document.querySelectorAll("[data-count-for]").forEach((node) => {
    const value = getByPath(node.dataset.countFor) ?? "";
    node.textContent = String(value).length;
  });
}

function renderAll() {
  renderEditor();
  renderTimeline();
  renderPreview();
  updateSharedChrome();
  updateCounts();
}

function markDirty() {
  isDirty = true;
  unsavedNotice.hidden = false;
}

function clearDirty() {
  isDirty = false;
  unsavedNotice.hidden = true;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function saveChanges() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  clearDirty();
  showToast("Changes saved to localStorage.");
}

function resetData() {
  state = clone(DEFAULT_DATA);
  localStorage.removeItem(STORAGE_KEY);
  clearDirty();
  renderAll();
  showToast("Default mock data restored.");
}

function readImage(file, callback) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image file.");
    return;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    showToast("Image is larger than 5MB.");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(file);
}

function addUniqueTag(path, value) {
  const tag = value.trim();
  if (!tag) {
    showToast("Empty tags are not allowed.");
    return false;
  }

  const tags = getByPath(path) || [];
  const exists = tags.some((item) => item.toLowerCase() === tag.toLowerCase());
  if (exists) {
    showToast("Duplicate tags are not allowed.");
    return false;
  }

  tags.push(tag);
  setByPath(path, tags);
  return true;
}

function swapItems(list, from, to) {
  if (to < 0 || to >= list.length) return false;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  return true;
}

document.addEventListener("input", (event) => {
  const target = event.target;
  const path = target.dataset.bind;
  if (!path) return;

  const value = target.dataset.type === "checkbox" ? target.checked : target.value;
  setByPath(path, value);
  updateCounts();
  updateSharedChrome();
  renderPreview();
  markDirty();
});

document.addEventListener("change", (event) => {
  const target = event.target;

  if (target.dataset.upload) {
    readImage(target.files[0], (result) => {
      setByPath(target.dataset.upload, result);
      renderAll();
      markDirty();
    });
  }

  if (target.dataset.galleryUpload !== undefined) {
    const index = Number(target.dataset.galleryUpload);
    readImage(target.files[0], (result) => {
      state.profile.gallery[index].src = result;
      renderAll();
      markDirty();
    });
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const tagPath = target.dataset.tagInput;

  if (tagPath && event.key === "Enter") {
    event.preventDefault();
    if (addUniqueTag(tagPath, target.value)) {
      target.value = "";
      renderEditor();
      renderPreview();
      markDirty();
      const nextInput = document.querySelector(`[data-tag-input="${CSS.escape(tagPath)}"]`);
      if (nextInput) nextInput.focus();
    }
  }
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const index = Number(button.dataset.index);

  if (action === "save") {
    saveChanges();
    return;
  }

  if (action === "reset") {
    resetData();
    return;
  }

  if (action === "dismiss-unsaved") {
    unsavedNotice.hidden = true;
    return;
  }

  if (action === "add-gallery") {
    state.profile.gallery.push({ src: "", alt: "TODO: add image alt text" });
  }

  if (action === "delete-gallery") {
    state.profile.gallery.splice(index, 1);
  }

  if (action === "remove-tag") {
    const tags = getByPath(button.dataset.tagPath) || [];
    tags.splice(Number(button.dataset.tagIndex), 1);
    setByPath(button.dataset.tagPath, tags);
  }

  if (action === "add-home-nav") {
    state.home.nav.push({ label: "TODO", href: "#" });
  }

  if (action === "delete-home-nav") {
    state.home.nav.splice(index, 1);
  }

  if (action === "add-photo-strip") {
    state.home.photoStrip.push({
      index: String(state.home.photoStrip.length + 1).padStart(2, "0"),
      type: "TODO",
      image: "",
      alt: "TODO: add image alt text",
      filmMeta: "",
      filmFoot: "",
      active: false
    });
  }

  if (action === "delete-photo-strip") {
    state.home.photoStrip.splice(index, 1);
  }

  if (action === "add-collection") {
    state.home.collections.push({
      index: String(state.home.collections.length + 1).padStart(2, "0"),
      title: "TODO",
      image: "",
      description: "",
      link: "#collections",
      active: true
    });
  }

  if (action === "delete-collection") {
    state.home.collections.splice(index, 1);
  }

  if (action === "add-bio-paragraph") {
    state.about.biographyParagraphs.push("TODO: add biography paragraph.");
  }

  if (action === "delete-bio-paragraph") {
    state.about.biographyParagraphs.splice(index, 1);
  }

  if (action === "add-experience") {
    state.about.experiences.push({
      date: "",
      title: "",
      place: "",
      description: "",
      label: "",
      active: true
    });
    renderTimeline();
    renderPreview();
    markDirty();
    const newInput = timelineRows.querySelector(`tr:last-child input[data-bind$=".date"]`);
    if (newInput) newInput.focus();
    return;
  }

  if (action === "delete-experience") {
    if (!window.confirm("Delete this experience?")) return;
    state.about.experiences.splice(index, 1);
    renderTimeline();
    renderPreview();
    markDirty();
    return;
  }

  if (action === "move-experience-up") {
    if (!swapItems(state.about.experiences, index, index - 1)) return;
    renderTimeline();
    renderPreview();
    markDirty();
    return;
  }

  if (action === "move-experience-down") {
    if (!swapItems(state.about.experiences, index, index + 1)) return;
    renderTimeline();
    renderPreview();
    markDirty();
    return;
  }

  if (action === "edit-experience") {
    const firstInput = document.querySelector(`[data-bind="about.experiences.${index}.date"]`);
    if (firstInput) firstInput.focus();
    return;
  }

  renderAll();
  markDirty();
});

window.addEventListener("beforeunload", (event) => {
  if (!isDirty) return;
  event.preventDefault();
  event.returnValue = "";
});

renderAll();
