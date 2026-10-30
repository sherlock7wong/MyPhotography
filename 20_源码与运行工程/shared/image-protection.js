/* Reduce direct image saving on public pages; rendered images remain retrievable. */
(() => {
  "use strict";
  if (window.cmsImageProtection || document.getElementById("adminShell") || /\/(?:admin|AdminLogin|backendContact|backendMessages|backendProject)(?:\/|$)/i.test(location.pathname)) return;
  window.cmsImageProtection = Object.freeze({ enabled: true });

  const editable = node => node?.closest?.('input:not([type="range"]),textarea,select,[contenteditable]:not([contenteditable="false"])');
  const element = target => target?.nodeType === 1 ? target : target?.parentElement;
  const imageExtension = /\.(?:avif|gif|jpe?g|png|svg|webp|bmp|tiff?|heic)(?:$|[?#])/i;
  function imageLink(target) {
    const link = element(target)?.closest('a[href]');
    if (!link) return null;
    const href = link.getAttribute("href") || "";
    let pathname = "";
    try { pathname = new URL(href, document.baseURI).pathname; } catch (_) { return null; }
    return /^data:image\//i.test(href) || imageExtension.test(pathname) || imageExtension.test(link.getAttribute("download") || "") ? link : null;
  }
  function imageTarget(target) {
    const node = element(target);
    if (!node || editable(node)) return null;
    return node.closest('img,picture') || node.closest('.comparison-stage,[data-image-save-guard]')?.querySelector('img') || imageLink(node);
  }
  function preventImageAction(event) {
    if (imageTarget(event.target)) event.preventDefault();
  }
  document.addEventListener("contextmenu", preventImageAction, true);
  document.addEventListener("dragstart", event => {
    const node = element(event.target);
    if (imageTarget(node) || (!editable(node) && node?.closest('a[href]')?.querySelector('img'))) event.preventDefault();
  }, true);
  for (const name of ["click", "auxclick"]) document.addEventListener(name, event => {
    if (imageLink(event.target)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "s") event.preventDefault();
  }, true);
  document.addEventListener("copy", event => {
    if (editable(element(event.target))) return;
    const selection = document.getSelection();
    let containsImage = Boolean(imageTarget(event.target));
    for (let i = 0; selection && i < selection.rangeCount && !containsImage; i++) containsImage = Boolean(selection.getRangeAt(i).cloneContents().querySelector('img,picture'));
    if (!containsImage) return;
    event.preventDefault();
    // Keep the selected words, without the image payload or image HTML.
    event.clipboardData?.setData("text/plain", selection?.toString() || "");
  }, true);

  function protect(node) {
    if (node.nodeType !== 1) return;
    if (node.matches("img")) node.draggable = false;
    node.querySelectorAll("img").forEach(image => { image.draggable = false; });
  }
  protect(document.documentElement);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) protect(node);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
