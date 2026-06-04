(function () {
  const config = window.SHERLOCK_SUPABASE || {};
  const tableName = config.contentTable || "site_content";
  const contentId = config.contentId || 1;
  const storageBucket = config.storageBucket || "portfolio-images";
  const imageCdnBaseUrl = String(config.imageCdnBaseUrl || "").replace(/\/+$/, "");
  const supabaseScriptUrl = config.supabaseScriptUrl || "/vendor/supabase-js.min.js";
  const maxUploadBytes = 50 * 1024 * 1024;
  const isAdminPage = window.location?.pathname?.startsWith("/admin/");
  let client = null;
  let supabaseScriptPromise = null;

  function hasSupabaseCredentials() {
    return Boolean(config.url && config.key);
  }

  function hasSupabaseConfig() {
    return Boolean(hasSupabaseCredentials() && window.supabase?.createClient);
  }

  function getClient() {
    if (!hasSupabaseConfig()) return null;
    if (!client) {
      client = window.supabase.createClient(config.url, config.key);
    }
    return client;
  }

  async function loadSupabaseScript() {
    if (window.supabase?.createClient || !hasSupabaseCredentials()) return;
    if (typeof document === "undefined" || !document.createElement) return;

    if (!supabaseScriptPromise) {
      supabaseScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = supabaseScriptUrl;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Supabase client."));
        document.head.append(script);
      });
    }

    await supabaseScriptPromise;
  }

  async function getClientAsync() {
    await loadSupabaseScript();
    return getClient();
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

  async function loadStaticContentFallback() {
    const response = await fetch("/data/content.json", { cache: "no-store" });
    if (!response.ok) return {};
    return response.json();
  }

  function throwIfError(error, fallback) {
    if (!error) return;
    throw new Error(error.message || fallback);
  }

  function hasContentPayload(content) {
    return Boolean(
      content &&
        typeof content === "object" &&
        !Array.isArray(content) &&
        Object.keys(content).length
    );
  }

  async function loadContent() {
    if (hasSupabaseCredentials()) {
      try {
        const freshContent = await loadFreshContent();
        if (hasContentPayload(freshContent)) return freshContent;
      } catch {
        // Public pages use Supabase as the source of truth when configured.
      }

      return isAdminPage ? loadStaticContentFallback() : {};
    }

    const staticContent = await loadStaticContentFallback();
    if (hasContentPayload(staticContent)) return staticContent;

    if (!hasSupabaseCredentials()) {
      try {
        return await request("/api/content");
      } catch {
        return {};
      }
    }

    return {};
  }

  async function loadFreshContent() {
    const supabaseClient = await getClientAsync();
    if (!supabaseClient) return {};

    const { data, error } = await supabaseClient
      .from(tableName)
      .select("content")
      .eq("id", contentId)
      .maybeSingle();

    throwIfError(error, "Failed to load content.");
    if (hasContentPayload(data?.content)) return data.content;
    return {};
  }

  async function saveContent(content) {
    const supabaseClient = getClient();
    if (!supabaseClient) {
      return request("/api/content", {
        method: "PUT",
        body: JSON.stringify(content)
      });
    }

    const { data, error } = await supabaseClient
      .from(tableName)
      .upsert(
        {
          id: contentId,
          content,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      )
      .select("id")
      .maybeSingle();

    throwIfError(error, "Failed to save content.");
    if (!data?.id) {
      throw new Error("Supabase did not confirm the saved content. Check update permissions.");
    }
    return { ok: true };
  }

  async function login(credentials) {
    const supabaseClient = getClient();
    if (!supabaseClient) {
      return request("/api/login", {
        method: "POST",
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });
    }

    const email = String(credentials.email || credentials.username || "").trim();
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password: credentials.password
    });

    throwIfError(error, "Login failed.");
    return { ok: true };
  }

  async function logout() {
    const supabaseClient = getClient();
    if (!supabaseClient) {
      return request("/api/logout", { method: "POST", body: "{}" });
    }

    const { error } = await supabaseClient.auth.signOut();
    throwIfError(error, "Logout failed.");
    return { ok: true };
  }

  async function getSession() {
    const supabaseClient = getClient();
    if (!supabaseClient) {
      return request("/api/session");
    }

    const { data, error } = await supabaseClient.auth.getSession();
    throwIfError(error, "Failed to read session.");
    return { authenticated: Boolean(data.session) };
  }

  function extensionFromFile(file) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension === "jpeg") return "jpg";
    if (["png", "jpg", "webp", "gif"].includes(extension)) return extension;
    const typeExtension = file.type.split("/")[1]?.toLowerCase();
    return typeExtension === "jpeg" ? "jpg" : typeExtension;
  }

  async function uploadFile(file) {
    const supabaseClient = getClient();
    if (!supabaseClient) {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      return request("/api/upload", {
        method: "POST",
        body: JSON.stringify({ data })
      });
    }

    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      throw new Error("Only PNG, JPG, WEBP, and GIF images are supported.");
    }
    if (file.size > maxUploadBytes) {
      throw new Error("Image size cannot exceed 50MB.");
    }

    const extension = extensionFromFile(file);
    const now = new Date();
    const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
    const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const path = `${folder}/${filename}`;
    const { error } = await supabaseClient.storage.from(storageBucket).upload(path, file, {
      cacheControl: "31536000",
      upsert: false
    });

    throwIfError(error, "Upload failed.");
    const { data } = supabaseClient.storage.from(storageBucket).getPublicUrl(path);
    return { url: data.publicUrl };
  }

  function storagePathFromPublicUrl(url) {
    const value = String(url || "").trim();
    if (!value) return "";
    const marker = `/storage/v1/object/public/${storageBucket}/`;
    const markerIndex = value.indexOf(marker);
    if (markerIndex === -1) return "";
    const pathWithQuery = value.slice(markerIndex + marker.length);
    return decodeURIComponent(pathWithQuery.split("?")[0] || "");
  }

  function cdnUrlForPath(path) {
    return `${imageCdnBaseUrl}/${String(path || "").replace(/^\/+/, "")}`;
  }

  function resolveImageUrl(url) {
    const value = String(url || "").trim();
    if (!imageCdnBaseUrl || !value || /^(data|blob):/i.test(value)) return value;

    if (value.startsWith("/uploads/") || value.startsWith("uploads/")) {
      return cdnUrlForPath(value);
    }

    const storagePath = storagePathFromPublicUrl(value);
    if (storagePath) return cdnUrlForPath(storagePath);

    return value;
  }

  async function deleteFile(url) {
    const value = String(url || "").trim();
    if (!value) return { ok: true, skipped: true };

    const supabaseClient = getClient();
    if (!supabaseClient) {
      return request("/api/delete-upload", {
        method: "POST",
        body: JSON.stringify({ url: value })
      });
    }

    const storagePath = storagePathFromPublicUrl(value);
    if (!storagePath) return { ok: true, skipped: true };

    const { error } = await supabaseClient.storage.from(storageBucket).remove([storagePath]);
    throwIfError(error, "Delete failed.");
    return { ok: true };
  }

  window.SherlockContentApi = {
    getClient,
    getSession,
    deleteFile,
    loadFreshContent,
    loadContent,
    login,
    logout,
    resolveImageUrl,
    saveContent,
    uploadFile
  };
})();
