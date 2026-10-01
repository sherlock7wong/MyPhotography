(function () {
  const form = document.querySelector("[data-login-form]");
  const alertCard = document.querySelector("[data-login-alert]");
  const alertClose = document.querySelector("[data-alert-close]");
  const forgotPasswordButton = document.querySelector("[data-forgot-password]");
  const inputShells = Array.from(document.querySelectorAll(".input-shell"));

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

  function showAlert() {
    if (!alertCard) {
      return;
    }

    alertCard.classList.remove("is-hidden");
  }

  function hideAlert() {
    alertCard?.classList.add("is-hidden");
  }

  function validateLogin() {
    if (!form) {
      return false;
    }

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let isValid = true;

    setFieldError("email", "");
    setFieldError("password", "");

    if (!email) {
      setFieldError("email", "Please enter your email.");
      isValid = false;
    } else if (!emailPattern.test(email)) {
      setFieldError("email", "Please enter a valid email.");
      isValid = false;
    }

    if (!password) {
      setFieldError("password", "Please enter your password.");
      isValid = false;
    }

    return isValid;
  }

  inputShells.forEach((shell) => {
    const input = shell.querySelector("input");

    input?.addEventListener("focus", () => {
      shell.classList.add("is-focused");
    });

    input?.addEventListener("blur", () => {
      shell.classList.remove("is-focused");
      shell.classList.toggle("is-filled", Boolean(input.value.trim()));
    });

    input?.addEventListener("input", () => {
      shell.classList.toggle("is-filled", Boolean(input.value.trim()));
      setFieldError(input.name, "");
      hideAlert();
    });
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateLogin()) {
      const firstInvalid = form.querySelector("[aria-invalid='true']");
      firstInvalid?.focus();
      return;
    }

    const submitButton = form.querySelector(".signin-button");
    submitButton?.classList.add("is-loading");

    window.setTimeout(() => {
      submitButton?.classList.remove("is-loading");
      showAlert();
    }, 260);
  });

  forgotPasswordButton?.addEventListener("click", () => {
    showAlert();
  });

  alertClose?.addEventListener("click", hideAlert);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideAlert();
    }
  });
})();
