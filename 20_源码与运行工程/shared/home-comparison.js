/* The finished image always belongs to the selected featured photograph. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.cmsHomeComparison = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const fields = ["beforeImage", "beforeAlt", "workTitle", "lightNote", "toneNote", "detailNote"];
  function featured(data) {
    return (Array.isArray(data?.gallery) ? data.gallery : [])
      .filter(photo => (!Array.isArray(photo.displayScopes) || photo.displayScopes.includes("overview")) && photo.featured === true)
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  }
  function imageKey(value, baseUrl) {
    if (!value) return "";
    try { const url = new URL(String(value), baseUrl); url.hash = ""; return url.href; } catch (_) { return ""; }
  }
  function configuration(settings, photo, baseUrl) {
    const config = settings?.homeComparison || {};
    const entries = Array.isArray(config.entries) ? config.entries : [];
    const index = entries.findIndex(entry => entry && entry.photoId === photo?.id);
    const entry = index < 0 ? null : entries[index];
    const after = imageKey(config.afterImage, baseUrl);
    const before = imageKey(config.beforeImage, baseUrl);
    const inherited = !entry && Boolean(photo && after && before && before !== after && after === imageKey(photo.image, baseUrl));
    const result = { entryIndex:index, inheritedLegacy:inherited, title:config.title, beforeImage:"", beforeAlt:"", workTitle:photo?.title || "" };
    for (const key of fields) {
      if (entry && Object.prototype.hasOwnProperty.call(entry, key)) result[key] = entry[key];
      else if (inherited && Object.prototype.hasOwnProperty.call(config, key)) result[key] = config[key];
      else if (["lightNote", "toneNote", "detailNote"].includes(key)) result[key] = config[key] ?? "";
    }
    return result;
  }
  return { featured, configuration, fields };
});
