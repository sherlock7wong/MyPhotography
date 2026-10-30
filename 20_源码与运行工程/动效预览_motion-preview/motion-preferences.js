(() => {
  "use strict";
  const key = "wong.motion.preview.reduce";
  const system = matchMedia("(prefers-reduced-motion: reduce)");
  let manual = false;
  try { manual = sessionStorage.getItem(key) === "true"; } catch (_) { /* Storage can be unavailable in private contexts. */ }
  const apply = () => {
    document.documentElement.dataset.manualReduction = String(manual);
    document.documentElement.dataset.motion = manual || system.matches ? "reduced" : "full";
  };
  window.wongMotionPreviewPreferences = {
    setReduction(value) {
      manual = Boolean(value);
      try { sessionStorage.setItem(key, String(manual)); } catch (_) { /* The current page still respects the choice. */ }
      apply();
    }
  };
  apply();
  system.addEventListener("change", apply);
})();
