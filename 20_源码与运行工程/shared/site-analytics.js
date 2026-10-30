/* Count visible public documents through the same-origin service. */
(() => {
  "use strict";
  const pages = { home:"home", about:"about", projects:"projects", "project-detail":"projects", photography:"photography", contact:"contact" };
  const uuid = () => typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : null;
  let eventId = uuid();
  let sent = false;
  let ready = false;
  let page;
  let visitorId;
  function record() {
    if (!ready || sent || document.hidden || !eventId || !visitorId) return;
    sent = true;
    fetch("/api/analytics/pageview", { method:"POST", credentials:"same-origin", keepalive:true, headers:{"Content-Type":"application/json"}, body:JSON.stringify({eventId,visitorId,page}) })
      .then(response => { if (!response.ok) sent=false; }).catch(() => { sent=false; });
  }
  async function start() {
    page = pages[document.querySelector("main")?.id];
    if (!page || window.cmsStore?.mode === "local" || (await window.cmsStore?.ready) === false) return;
    try {
      visitorId = localStorage.getItem("wong.analytics.visitor.v1");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId || "")) {
        visitorId=uuid();if(visitorId)localStorage.setItem("wong.analytics.visitor.v1",visitorId);
      }
    } catch (_) { visitorId=uuid(); }
    ready=true;record();
  }
  document.addEventListener("visibilitychange", record);
  window.addEventListener("pageshow", event => { if(event.persisted){eventId=uuid();sent=false;record();} });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true}); else start();
})();
