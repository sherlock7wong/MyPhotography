/* WonG motion preferences. Loaded in <head> so navigation uses the saved choice. */
(function () {
  "use strict";
  if (window.wongMotion) return;
  const root = document.documentElement;
  const key = "wong.motion.preferences";
  const system = window.matchMedia("(prefers-reduced-motion: reduce)");
  const durations = { quiet: 480, standard: 620, immersive: 820 };
  const strengths = { quiet: 0.5, standard: 1, immersive: 1.4 };
  let effects = {};
  let preferences = readPreferences();
  let activeTransition;
  let revision = 0;
  const navigationRule = document.createElement("style");
  navigationRule.id = "wong-navigation-transition";
  document.head.appendChild(navigationRule);

  function readPreferences() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(key) || "{}"); } catch (_) { saved = {}; }
    return {
      intensity: Object.hasOwn(durations, saved?.intensity) ? saved.intensity : "standard",
      transition: ["shared", "iris", "curtain"].includes(saved?.transition) ? saved.transition : "shared",
      reduce: saved?.reduce === true
    };
  }

  function readSettings() {
    try { return JSON.parse(localStorage.getItem("wong.cms.data") || "{}").settings?.effects || {}; }
    catch (_) { return {}; }
  }

  function allowed() { return !system.matches && !preferences.reduce; }

  function apply() {
    root.dataset.wongMotion = allowed() ? "full" : "reduced";
    root.dataset.wongIntensity = preferences.intensity;
    root.dataset.wongTransition = preferences.transition;
    root.style.setProperty("--motion-duration", durations[preferences.intensity] + "ms");
    root.style.setProperty("--motion-strength", String(strengths[preferences.intensity]));
    navigationRule.textContent = "@view-transition { navigation: " + (allowed() && effects.pageTransition !== false ? "auto" : "none") + "; }";
    if (!allowed() || effects.pageTransition === false) activeTransition?.skipTransition();
    window.dispatchEvent(new CustomEvent("wong:motionchange"));
  }

  function setPreferences(patch) {
    preferences = {
      intensity: Object.hasOwn(durations, patch.intensity) ? patch.intensity : preferences.intensity,
      transition: ["shared", "iris", "curtain"].includes(patch.transition) ? patch.transition : preferences.transition,
      reduce: typeof patch.reduce === "boolean" ? patch.reduce : preferences.reduce
    };
    try { localStorage.setItem(key, JSON.stringify(preferences)); } catch (_) { /* Session preference still works. */ }
    apply();
  }

  function focusIdentity() {
    const element = document.activeElement;
    for (const attribute of ["data-photo-id", "data-featured-id", "data-category", "data-view", "id"]) {
      const value = element?.getAttribute(attribute);
      if (value) return { attribute, value };
    }
    return null;
  }

  function transition(update) {
    const run = () => {
      // Read focus when the snapshot callback actually runs, after page keyboard handlers.
      const identity = focusIdentity();
      update();
      if (identity && (!document.activeElement || document.activeElement === document.body)) {
        const selector = "[" + identity.attribute + '="' + CSS.escape(identity.value) + '"]';
        document.querySelector(selector)?.focus({ preventScroll: true });
      }
    };
    if (!allowed() || effects.pageTransition === false || !document.startViewTransition || document.hidden) {
      run();
      return null;
    }
    const token = ++revision;
    activeTransition?.skipTransition();
    try {
      activeTransition = document.startViewTransition(() => { if (token === revision) run(); });
      const current = activeTransition;
      current.ready.catch(() => {});
      current.updateCallbackDone.catch((error) => console.error("WonG content update failed", error));
      current.finished.catch(() => {}).finally(() => { if (activeTransition === current) activeTransition = null; });
      return current;
    } catch (_) { run(); return null; }
  }

  window.wongMotion = {
    get preferences() { return { ...preferences }; },
    get motionAllowed() { return allowed(); },
    get systemReduced() { return system.matches; },
    get duration() { return durations[preferences.intensity]; },
    get strength() { return strengths[preferences.intensity]; },
    enabled(name) { return allowed() && effects[name] !== false; },
    setPreferences,
    applySettings(value) { effects = { ...value }; apply(); },
    transition
  };
  effects = readSettings();
  apply();
  system.addEventListener("change", apply);
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === "wong.cms.data" || event.key === null) {
      preferences = readPreferences();
      effects = readSettings();
      apply();
    }
  });
})();
