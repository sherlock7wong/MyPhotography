(async function () {
  if ((await window.cmsStore?.ready) === false) return;
  "use strict";

  const cmsData = window.cmsStore?.getPublicData?.();
  const cmsRender = window.cmsRender;
  const formSettings = cmsData?.settings?.contactForm || {};
  const minLength = Math.max(12, Math.min(5000, Number(formSettings.minLength) || 12));
  const maxLength = Math.max(minLength, Math.min(5000, Number(formSettings.maxLength) || 1000));

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
    if (cardGrid) {
      cardGrid.innerHTML = methods
        .map((method) => {
          const type = method.type || "link";
          const isQr = type === "wechat" || type === "qr" || method.coverImage;
          const href = window.cmsPages.safeUrl(type === "email" && method.value && !method.url ? `mailto:${method.value}` : method.url || "");
          const button = href
            ? `<a class="outline-button" href="${cmsRender.escapeAttr(href)}" ${href.startsWith("http") ? 'target="_blank" rel="noreferrer"' : ""}>${cmsRender.escapeHtml(method.actionLabel || "Open")} <span aria-hidden="true">&rarr;</span></a>`
            : `<button class="outline-button" type="button" data-copy-wechat>${cmsRender.escapeHtml(method.actionLabel || "Copy")} <span aria-hidden="true">&rarr;</span></button>`;
          return `
            <article class="contact-card ${isQr ? "contact-card-qr" : ""}">
              <div class="contact-icon" aria-hidden="true">${methodIcon(type)}</div>
              <h2>${cmsRender.escapeHtml(method.title || "Contact")}</h2>
              <p class="contact-handle">${cmsRender.escapeHtml(method.value || href || "")}</p>
              ${method.coverImage ? `<img class="wechat-qr" src="${cmsRender.escapeAttr(method.coverImage)}" alt="${cmsRender.escapeAttr(method.coverAlt || method.title || "Contact QR code")}" width="132" height="132" loading="lazy" decoding="async" />` : '<span class="small-rule" aria-hidden="true"></span>'}
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

    setupFeaturedFilm(Array.isArray(data.gallery) ? data.gallery : []);

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

  function setupFeaturedFilm(gallery) {
    const root = document.querySelector("[data-featured-film]");
    if (!root) return;
    const photos = gallery
      .filter(photo => !Array.isArray(photo.displayScopes) || photo.displayScopes.includes("overview"))
      .filter(photo => photo.featured === true)
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    root.dataset.filmCount = String(photos.length);
    root.setAttribute("aria-label", "精选照片集，" + photos.length + "张");
    root.innerHTML = '<div class="film-viewport" tabindex="0" aria-label="精选照片集" data-film-viewport>'
      + '<div class="film-track"><div class="film-group" data-film-primary role="list"></div></div></div>'
      + '<button class="film-playback" type="button" aria-label="暂停精选照片自动滚动" aria-pressed="false" hidden>Ⅱ</button>'
      + '<p class="film-empty" role="status"' + (photos.length ? ' hidden' : '') + '>暂无精选照片</p>';
    const viewport = root.querySelector("[data-film-viewport]");
    const track = root.querySelector(".film-track");
    const group = root.querySelector("[data-film-primary]");
    const toggle = root.querySelector(".film-playback");
    viewport.hidden = !photos.length;
    if (!photos.length) return;
    const markup = photos.map((photo, index) => {
      const image = window.cmsPages.safeUrl(photo.image || cmsRender.defaultImage, true) || cmsRender.defaultImage;
      return '<figure role="listitem" data-contact-photo-id="' + cmsRender.escapeAttr(photo.id) + '">'
        + '<span class="film-label">' + String(index + 1).padStart(2, "0") + ' / '
        + cmsRender.escapeHtml(photo.film || photo.year || "SELECTED") + '</span>'
        + '<img src="' + cmsRender.escapeAttr(image) + '" alt="' + cmsRender.escapeAttr(photo.altText || photo.title || "Selected photograph")
        + '" width="292" height="264" loading="lazy" decoding="async" /></figure>';
    }).join("");
    group.innerHTML = markup;
    let copies = 0;
    let paused = false, hovered = false, focused = false, inView = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const motionAllowed = () => window.wongMotion?.motionAllowed ?? !reduced.matches;
    function layout() {
      const frameWidth = group.querySelector("figure")?.getBoundingClientRect().width || 132;
      const count = motionAllowed() && photos.length > 1
        ? Math.max(1, Math.ceil(viewport.clientWidth / (frameWidth * photos.length))) : 1;
      if (count !== copies) {
        copies = count;
        group.innerHTML = markup;
        for (let i = 1; i < count; i++) {
          const extra = document.createElement("div");
          extra.innerHTML = markup;
          [...extra.children].forEach(frame => {
            frame.classList.add("film-repeat");
            frame.setAttribute("aria-hidden", "true");
            frame.setAttribute("inert", "");
            group.append(frame);
          });
        }
        const duplicate = group.cloneNode(true);
        duplicate.removeAttribute("data-film-primary");
        duplicate.setAttribute("aria-hidden", "true");
        duplicate.setAttribute("inert", "");
        track.replaceChildren(group, duplicate);
      }
      root.style.setProperty("--film-duration", Math.max(8, group.scrollWidth / 24) + "s");
    }
    function refreshPlayback() {
      const allowed = motionAllowed();
      root.classList.toggle("is-static", photos.length < 2 || !allowed);
      root.classList.toggle("is-playing", photos.length > 1 && allowed && inView
        && !paused && !hovered && !focused && !document.hidden && !root.closest("[hidden]"));
      toggle.hidden = photos.length < 2 || !allowed;
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute("aria-label", paused ? "继续精选照片自动滚动" : "暂停精选照片自动滚动");
      toggle.textContent = paused ? "▶" : "Ⅱ";
      layout();
    }
    toggle.addEventListener("click", () => { paused = !paused; refreshPlayback(); });
    root.addEventListener("pointerenter", event => {
      if (event.pointerType !== "touch") { hovered = true; refreshPlayback(); }
    });
    root.addEventListener("pointerleave", () => { hovered = false; refreshPlayback(); });
    viewport.addEventListener("focusin", () => { focused = true; refreshPlayback(); });
    viewport.addEventListener("focusout", event => {
      focused = viewport.contains(event.relatedTarget);
      refreshPlayback();
    });
    root.addEventListener("error", event => {
      if (!(event.target instanceof HTMLImageElement)) return;
      event.target.hidden = true;
      const frame = event.target.closest("figure");
      if (!frame || frame.querySelector(".film-image-error")) return;
      const message = document.createElement("p");
      message.className = "film-image-error";
      message.textContent = "影像暂时无法加载";
      frame.append(message);
    }, true);
    document.addEventListener("visibilitychange", refreshPlayback);
    window.addEventListener("wong:motionchange", refreshPlayback);
    reduced.addEventListener("change", refreshPlayback);
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(viewport);
    else window.addEventListener("resize", layout);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        refreshPlayback();
      }, {threshold: .1}).observe(root);
    } else inView = true;
    refreshPlayback();
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
  if (messageField) messageField.maxLength = maxLength;
  if (form?.elements.name) form.elements.name.maxLength = 120;
  if (form?.elements.email) form.elements.email.maxLength = 254;
  const count = document.querySelector(".char-count");
  if (count?.lastChild?.nodeType === 3) count.lastChild.textContent = " / " + maxLength;
  if (cmsData?.settings?.integrations?.contactEnabled === false && form) {
    const submit = form.querySelector(".submit-button"); submit.disabled=true; submit.textContent=formSettings.disabledText || "Message submissions are currently unavailable.";
  }
  if (window.cmsStore.mode !== "local" && document.querySelector(".form-note")?.textContent.includes("saved locally")) document.querySelector(".form-note").textContent="* Messages are sent to the site inbox.";

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

    if (!name || name.length > 120) {
      setFieldError("name", formSettings.nameError || "Please enter your name.");
      isValid = false;
    }

    if (!email) {
      setFieldError("email", formSettings.emailError || "Please enter your email.");
      isValid = false;
    } else if (!emailPattern.test(email) || email.length > 254) {
      setFieldError("email", formSettings.emailError || "Please enter a valid email address.");
      isValid = false;
    }

    if (!message) {
      setFieldError("message", formSettings.messageError || "Please describe your project or idea.");
      isValid = false;
    } else if (message.length < minLength || message.length > maxLength) {
      setFieldError("message", formSettings.lengthError || `Please enter between ${minLength} and ${maxLength} characters.`);
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

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (cmsData?.settings?.integrations?.contactEnabled === false || !validateForm()) { form.querySelector("[aria-invalid='true']")?.focus(); return; }
    const formData=new FormData(form); const button=form.querySelector(".submit-button"); const original=button.innerHTML;
    form.setAttribute("aria-busy", "true");
    button.disabled=true; button.textContent=formSettings.sendingText || "Saving...";
    try {
      await window.cmsStore.submitMessage({name:String(formData.get("name")||"").trim(),email:String(formData.get("email")||"").trim(),message:String(formData.get("message")||"").trim()});
      form.reset();updateMessageCount();
      showToast(formSettings.successTitle || "Message saved", window.cmsStore.mode === "cloud" ? formSettings.cloudSuccess || "Your message has been received." : formSettings.localSuccess || "Your message was saved to the local admin inbox.");
    } catch (_) { showToast("Could not save message",formSettings.errorText || "Please try again. Your entered message is still here."); }
    finally { form.removeAttribute("aria-busy");button.disabled=false;button.innerHTML=original; }
  });

  document.addEventListener("click", async (event) => {
    const copyWechatButton = event.target.closest("[data-copy-wechat]");
    if (!copyWechatButton) {
      return;
    }

    const wechatId = copyWechatButton.closest(".contact-card")?.querySelector(".contact-handle")?.textContent?.trim() || "Wong_Visual_Archive";

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
