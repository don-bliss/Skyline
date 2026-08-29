/* =========================================================
   SKYLINE AUTHENTICATION v2
   Cloud mode: Supabase Auth (cross-device)
   Fallback: local demo mode for offline/front-end testing
   ========================================================= */
(() => {
  "use strict";

  const CLOUD = window.SKYLINE_CLOUD || {};
  const hasCloudConfig = Boolean(CLOUD.enabled && CLOUD.supabaseUrl && CLOUD.supabaseAnonKey && window.supabase);
  const sb = hasCloudConfig ? window.supabase.createClient(CLOUD.supabaseUrl, CLOUD.supabaseAnonKey) : null;
  window.skylineAuth = { cloud: hasCloudConfig, client: sb };

  const protectedPages = ["home.html", "timeline.html", "profile.html", "inbox.html", "wallet.html", "settings.html", "notifications.html"];
  const page = (location.pathname.split("/").pop() || "index.html").split(/[?#]/)[0];

  const LOCAL_USERS = "skylineUsers";
  const SESSION = "skylineSession";

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(LOCAL_USERS) || "[]"); } catch { return []; }
  }
  function saveUsers(users) { localStorage.setItem(LOCAL_USERS, JSON.stringify(users)); }
  function getLocalSession() {
    try { return JSON.parse(localStorage.getItem(SESSION) || "null"); } catch { return null; }
  }
  function setLocalSession(user) {
    localStorage.setItem(SESSION, JSON.stringify(user));
    localStorage.setItem("skylineLoggedIn", "true");
  }
  function clearLocalSession() {
    localStorage.removeItem(SESSION);
    localStorage.removeItem("skylineLoggedIn");
  }

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function accountNumber() {
    let n = "";
    for (let i = 0; i < 10; i++) n += Math.floor(Math.random() * 10);
    return n;
  }

  function normalizeUser(u) {
    return {
      id: u.id || u.email,
      name: u.name || u.user_metadata?.full_name || "SkyLine User",
      email: u.email || "",
      phone: u.phone || u.user_metadata?.phone || "",
      accountNumber: u.accountNumber || u.user_metadata?.account_number || "",
      username: u.username || u.user_metadata?.username || u.accountNumber || u.user_metadata?.account_number || "",
      balance: Number(u.balance ?? u.user_metadata?.balance ?? 0),
      avatar: u.avatar || u.user_metadata?.avatar || ""
    };
  }

  async function getSession() {
    if (window.SkyLineAPI?.isConfigured?.()) {
      try {
        const data = await window.SkyLineAPI.me();
        const user = normalizeUser(data.user);
        localStorage.setItem("skylineUser", JSON.stringify(user));
        return user;
      } catch (_) {
        window.SkyLineAPI.clearTokens?.();
      }
    }
    if (sb) {
      const { data } = await sb.auth.getSession();
      return data?.session ? normalizeUser(data.session.user) : null;
    }
    return getLocalSession();
  }

  async function signUp({ name, email, phone, password, avatar }) {
    email = email.trim().toLowerCase();
    const acc = accountNumber();
    if (window.SkyLineAPI?.isConfigured?.()) {
      const result = await window.SkyLineAPI.authSignup({ name, email, phone, password, avatar: avatar || "" });
      window.SkyLineAPI.setTokens(result.accessToken, result.refreshToken);
      const user = normalizeUser(result.user);
      setLocalSession(user);
      localStorage.setItem("skylineUser", JSON.stringify(user));
      return { user, needsEmailConfirmation: false };
    }
    if (sb) {
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { full_name: name.trim(), phone: phone.trim(), username: acc, account_number: acc, avatar: avatar || "", balance: 0 } }
      });
      if (error) throw error;
      return { user: normalizeUser(data.user || { email, user_metadata: { full_name: name, phone, account_number: acc, avatar } }), needsEmailConfirmation: !data.session };
    }
    const users = getUsers();
    if (users.some(u => u.email === email)) throw new Error("An account already exists with that email.");
    const passwordHash = await sha256(password);
    const user = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name: name.trim(), email, phone: phone.trim(), accountNumber: acc, username: acc, avatar: avatar || "", balance: 0, passwordHash, createdAt: new Date().toISOString(), emailVerified: false };
    users.push(user); saveUsers(users);
    return { user: normalizeUser(user), needsEmailConfirmation: false };
  }

  async function signIn(email, password) {
    email = email.trim().toLowerCase();
    if (window.SkyLineAPI?.isConfigured?.()) {
      const result = await window.SkyLineAPI.authLogin({ email, password });
      window.SkyLineAPI.setTokens(result.accessToken, result.refreshToken);
      const user = normalizeUser(result.user);
      setLocalSession(user);
      localStorage.setItem("skylineUser", JSON.stringify(user));
      return user;
    }
    if (sb) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const user = normalizeUser(data.user);
      localStorage.setItem("skylineUser", JSON.stringify(user));
      return user;
    }
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) throw new Error("No SkyLine account was found with that email.");
    if ((await sha256(password)) !== user.passwordHash) throw new Error("Incorrect password. Please try again.");
    if (user.emailVerified !== true) throw new Error("Please verify your email with the one-time verification code before logging in.");
    const normalized = normalizeUser(user);
    setLocalSession(normalized);
    localStorage.setItem("skylineUser", JSON.stringify(normalized));
    return normalized;
  }


  function markLocalEmailVerified(email) {
    const users = getUsers();
    const idx = users.findIndex(u => u.email === String(email || "").trim().toLowerCase());
    if (idx < 0) return false;
    users[idx].emailVerified = true;
    users[idx].verifiedAt = new Date().toISOString();
    saveUsers(users);
    return true;
  }

  async function signOut() {
    if (window.SkyLineAPI?.isConfigured?.()) {
      try { await window.SkyLineAPI.authLogout(); } catch (_) {}
      window.SkyLineAPI.clearTokens?.();
    }
    if (sb) await sb.auth.signOut();
    clearLocalSession();
    localStorage.removeItem("skylineUser");
    location.replace("index.html");
  }

  async function requireAuth() {
    if (!protectedPages.includes(page)) return true;
    const session = await getSession();
    if (!session) {
      const next = encodeURIComponent(page);
      location.replace(`login.html?next=${next}`);
      return false;
    }
    localStorage.setItem("skylineUser", JSON.stringify(session));
    return true;
  }

  window.skylineGetSession = getSession;
  window.skylineSignUp = signUp;
  window.skylineSignIn = signIn;
  window.skylineMarkLocalEmailVerified = markLocalEmailVerified;
  window.skylineLogout = signOut;
  window.skylineRequireAuth = requireAuth;

  requireAuth();

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-logout]").forEach(btn => btn.addEventListener("click", e => { e.preventDefault(); signOut(); }));
  });
})();
