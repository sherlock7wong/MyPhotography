(function () {
  "use strict";

  const cmsData = window.cmsStore?.getPublicData?.();
  const cmsRender = window.cmsRender;

  function methodIcon(type) {
    if (type === "email") {
      return '<svg viewBox="0 0 48 48" role="img"><path d="M7 13h34v24H7z" /><path d="m8 14 16 13 16-13" /></svg>';
    }
    if (type === "wechat" || type === "qr") {
      return '<svg viewBox="0 0 54 48" role="img"><path d="M21 10C12.7 10 6 15.1 6 21.4c0 3.6 2.2 6.9 5.7 9l-1.2 4.2 5-2.3c1.7.5 3.5.8 5.5.8 8.3 0 15-5.1 15-11.5S29.3 10 21 10Z" /><path d="M34.5 20.2c7 0 12.5 4.3 12.5 9.7 0 3-1.8 5.8-4.6 7.6l1 3.5-4.2-1.9c-1.4.4-3 .6-4.7.6-7 0-12.5-4.3-12.5-9.8s5.6-9.7 12.5-9.7Z" /><circle cx="16.4" cy="20.2" r="1.4" /><circle cx="25.5" cy="20.2" r="1.4" /></svg>';
    }
    return '<svg viewBox="0 0 48 48" role="img"><rect x="8" y="8" width="32" height="32" rx="9" /><circle cx="24" cy="24" r="8" /><circle cx="33.5" cy="14.5" r="2" /></svg>';
  }

  function renderCmsContact(data) {
    if (!data || !cmsRender) {
      return;
    }

    cmsRender.applySeo("contact", {
      ogImage: data.contact?.filmStrip?.[0] || "../Image/contact.png"
    });
    cmsRender.applyChrome("contact");

    const contact = data.contact || {};
    const page = contact.page || {};
    const methods = Array.isArray(contact.contactMethods) ? contact.contactMethods : [];
    const fallbackImage = cmsRender.defaultImage;

    const title = document.querySelector("#contact-title");
    const subtitle = document.querySelector(".contact-subtitle");
    const description = document.querySelector(".contact-description");
    if (title) title.textContent = page.title || "Contact";
    if (subtitle) subtitle.textContent = page.subtitle || "Projects / Commissions / Collaboration";
    if (description) description.textContent = page.description || description.textContent;

    const factValues = document.querySelectorAll(".contact-facts dd");
    const facts = [page.year, page.location, page.responseTime, "Chinese / English"];
    factValues.forEach((node, index) => {
      node.textContent = facts[index] || node.textContent;
    });

    const cardGrid = document.querySelector(".contact-card-grid");
    if (cardGrid && methods.length) {
      cardGrid.innerHTML = methods
        .map((method) => {
          const type = method.type || "link";
          const isQr = type === "wechat" || type === "qr" || method.coverImage;
          const href = type === "email" && method.value && !method.url ? `mailto:${method.value}` : method.url || "";
          const button = href
            ? `<a class="outline-button" href="${cmsRender.escapeAttr(href)}" ${href.startsWith("http") ? 'target="_blank" rel="noreferrer"' : ""}>${cmsRender.escapeHtml(method.actionLabel || "Open")} <span aria-hidden="true">&rarr;</span></a>`
            : `<button class="outline-button" type="button" data-copy-wechat>${cmsRender.escapeHtml(method.actionLabel || "Copy")} <span aria-hidden="true">&rarr;</span></button>`;
          return `
            <article class="contact-card ${isQr ? "contact-card-qr" : ""}">
              <div class="contact-icon" aria-hidden="true">${methodIcon(type)}</div>
              <h2>${cmsRender.escapeHtml(method.title || "Contact")}</h2>
              <p class="contact-handle">${cmsRender.escapeHtml(method.value || href || "")}</p>
              ${method.coverImage ? `<img class="wechat-qr" src="${cmsRender.escapeAttr(method.coverImage)}" alt="${cmsRender.escapeAttr(method.title || "Contact QR code")}" width="132" height="132" loading="lazy" decoding="async" />` : '<span class="small-rule" aria-hidden="true"></span>'}
              <p class="card-copy">${cmsRender.escapeHtml(method.description || "")}</p>
              ${button}
            </article>
          `;
        })
        .join("");
    }

    const formTitle = document.querySelector("#message-title");
    const formSubtitle = document.querySelector(".form-heading h2 + p");
    const formNote = document.querySelector(".form-note");
    if (formTitle) formTitle.textContent = page.formTitle || "Send a Message";
    if (formSubtitle) formSubtitle.textContent = page.formSubtitle || "Tell me what you need.";
    if (formNote) formNote.textContent = page.formNote || "* Current submissions are saved locally until a real backend is connected.";

    const projectType = document.querySelector("#project-type");
    if (projectType && Array.isArray(page.projectTypes) && page.projectTypes.length) {
      projectType.innerHTML = '<option value="">Choose a project type</option>' + page.projectTypes
        .map((type) => `<option value="${cmsRender.escapeAttr(cmsRender.slugify(type))}">${cmsRender.escapeHtml(type)}</option>`)
        .join("");
    }

    const filmStrip = document.querySelector(".film-strip");
    const images = Array.isArray(contact.filmStrip) && contact.filmStrip.length ? contact.filmStrip : [];
    if (filmStrip && images.length) {
      filmStrip.innerHTML = images
        .slice(0, 5)
        .map((src, index) => `
          <figure>
            <span>${index === 4 ? "Archive 08" : "400"}</span>
            <img src="${cmsRender.escapeAttr(src || fallbackImage)}" alt="Contact archive preview ${index + 1}" width="292" height="213" loading="lazy" decoding="async" />
          </figure>
        `)
        .join("");
    }

    const statusValues = document.querySelectorAll(".status-grid > div");
    const statusData = [
      ["Archive Status", page.availability || "Open"],
      ["Location", page.currentLocation || page.location || "Shenzhen, China"],
      ["Working Time", page.workingDays || "Mon - Sun"],
      ["Reply Window", page.responseTime || "Within 48 Hours"]
    ];
    statusValues.forEach((item, index) => {
      const dds = item.querySelectorAll("dd");
      if (dds[0]) dds[0].textContent = statusData[index]?.[0] || dds[0].textContent;
      if (dds[1]) dds[1].textContent = statusData[index]?.[1] || dds[1].textContent;
    });
  }

  renderCmsContact(cmsData);

  const form = document.querySelector("[data-contact-form]");
  const messageField = document.querySelector("#message");
  const countNode = document.querySelector("[data-message-count]");
  const toast = document.querySelector("[data-toast]");
  const toastTitle = document.querySelector("[data-toast-title]");
  const toastMessage = document.querySelector("[data-toast-message]");
  const toastClose = document.querySelector("[data-toast-close]");
  const revealSections = Array.from(document.querySelectorAll(".reveal-section"));

  let toastTimer = null;

  function setFieldError(fieldName, message) {
    const field = form?.elements[fieldName];
    const errorNode = document.querySelector(`[data-error-for="${fieldName}"]`);
    const group = field?.closest(".field-group");

    if (!field || !errorNode || !group) {
      return;
    }

    errorNode.textContent = message;
    group.classList.toggle("is-invalid", Boolean(message));
    field.toggleAttribute("aria-invalid", Boolean(message));

    if (message) {
      const errorId = `${fieldName}-error`;
      errorNode.id = errorId;
      field.setAttribute("aria-describedby", errorId);
    } else {
      field.removeAttribute("aria-describedby");
    }
  }

  function showToast(title, message) {
    if (!toast || !toastTitle || !toastMessage) {
      return;
    }

    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toast.hidden = false;

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 4200);
  }

  function updateMessageCount() {
    if (!messageField || !countNode) {
      return;
    }

    countNode.textContent = String(messageField.value.length);
  }

  function validateForm() {
    if (!form) {
      return false;
    }

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let isValid = true;

    setFieldError("name", "");
    setFieldError("email", "");
    setFieldError("message", "");

    if (!name) {
      setFieldError("name", "Please enter your name.");
      isValid = false;
    }

    if (!email) {
      setFieldError("email", "Please enter your email.");
      isValid = false;
    } else if (!emailPattern.test(email)) {
      setFieldError("email", "Please enter a valid email address.");
      isValid = false;
    }

    if (!message) {
      setFieldError("message", "Please describe your project or idea.");
      isValid = false;
    } else if (message.length < 12) {
      setFieldError("message", "Please enter at least 12 characters.");
      isValid = false;
    }

    return isValid;
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
      { threshold: 0.14 }
    );

    revealSections.forEach((section) => revealObserver.observe(section));
  } else {
    revealSections.forEach((section) => section.classList.add("is-visible"));
  }

  messageField?.addEventListener("input", () => {
    updateMessageCount();
    setFieldError("message", "");
  });

  form?.addEventListener("input", (event) => {
    const target = event.target;

    if ((target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) && target.name) {
      setFieldError(target.name, "");
    }
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateForm()) {
      const firstInvalid = form.querySelector("[aria-invalid='true']");
      firstInvalid?.focus();
      return;
    }

    const formData = new FormData(form);
    const submitButton = form.querySelector(".submit-button");
    const now = new Date().toISOString();

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    // TODO(contact): Before deployment, replace this local write with a real
    // form submission API plus server-side validation and email notification.
    window.cmsStore?.addMessage?.({
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      projectType: String(formData.get("projectType") || "other").trim() || "other",
      message: String(formData.get("message") || "").trim(),
      createdAt: now,
      status: "unread"
    });

    window.setTimeout(() => {
      form.reset();
      updateMessageCount();
      submitButton.disabled = false;
      submitButton.innerHTML = 'Send Message <span aria-hidden="true">&rarr;</span>';
      showToast("Message saved", "This mock submission is now visible in Admin / Messages.");
    }, 250);
  });

  document.addEventListener("click", async (event) => {
    const copyWechatButton = event.target.closest("[data-copy-wechat]");
    if (!copyWechatButton) {
      return;
    }

    const wechatId = document.querySelector(".contact-card-qr .contact-handle")?.textContent?.trim() || "Wong_Visual_Archive";

    try {
      await navigator.clipboard.writeText(wechatId);
      showToast("WeChat copied", wechatId);
    } catch (error) {
      showToast("WeChat", wechatId);
    }
  });

  toastClose?.addEventListener("click", () => {
    if (toast) {
      toast.hidden = true;
    }

    window.clearTimeout(toastTimer);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toast && !toast.hidden) {
      toast.hidden = true;
      window.clearTimeout(toastTimer);
    }
  });

  updateMessageCount();
})();
