(function () {
  const config = window.SHERLOCK_SUPABASE || {};
  const tableName = config.contentTable || "site_content";
  const contentId = config.contentId || 1;
  const storageBucket = config.storageBucket || "portfolio-images";
  let client = null;

  function hasSupabaseConfig() {
    return Boolean(config.url && config.key && window.supabase?.createClient);
  }

  function getClient() {
    if (!hasSupabaseConfig()) return null;
    if (!client) {
      client = window.supabase.createClient(config.url, config.key);
    }
    return client;
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
    const supabaseClient = getClient();
    if (!supabaseClient) {
      try {
        return await request("/api/content");
      } catch {
        return loadStaticContentFallback();
      }
    }

    const { data, error } = await supabaseClient
      .from(tableName)
      .select("content")
      .eq("id", contentId)
      .maybeSingle();

    throwIfError(error, "Failed to load content.");
    if (hasContentPayload(data?.content)) return data.content;
    return loadStaticContentFallback();
  }

  async function saveContent(content) {
    const supabaseClient = getClient();
    if (!supabaseClient) {
      return request("/api/content", {
        method: "PUT",
        body: JSON.stringify(content)
      });
    }

    const { error } = await supabaseClient.from(tableName).upsert(
      {
        id: contentId,
        content,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

    throwIfError(error, "Failed to save content.");
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
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Image size cannot exceed 10MB.");
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

  window.SherlockContentApi = {
    getClient,
    getSession,
    loadContent,
    login,
    logout,
    saveContent,
    uploadFile
  };
})();
