(function () {
  "use strict";

  const STORAGE_KEY = "cws_profile";
  const AGE_KEY = "cws_age_confirmed";
  const RECENT_KEY = "cws_recent";
  const FRIENDS_KEY = "cws_friends";

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // Ignore storage failures
    }
  }

  function getProfile() {
    return readJson(STORAGE_KEY, {});
  }

  function setProfile(update) {
    const current = getProfile();
    const next = Object.assign({}, current, update);
    writeJson(STORAGE_KEY, next);
    return next;
  }

  function isAgeConfirmed() {
    return localStorage.getItem(AGE_KEY) === "1";
  }

  function setAgeConfirmed() {
    localStorage.setItem(AGE_KEY, "1");
  }

  function safeText(value, maxLen) {
    if (typeof value !== "string") return "";
    let text = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
    if (maxLen && text.length > maxLen) text = text.slice(0, maxLen);
    return text;
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function navigate(path) {
    window.location.href = path;
  }

  function requireAge() {
    if (!isAgeConfirmed()) {
      navigate("/");
      return false;
    }
    return true;
  }

  function requireProfile() {
    const profile = getProfile();
    if (!profile.nickname) {
      navigate("/persona");
      return null;
    }
    return profile;
  }

  function getMode() {
    const fromQuery = getQueryParam("mode");
    if (fromQuery) return fromQuery;
    const profile = getProfile();
    return profile.mode || "text";
  }

  function setMode(mode) {
    setProfile({ mode });
  }

  async function fetchOnlineCount(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    try {
      const res = await fetch("/api/online");
      const data = await res.json();
      if (data && typeof data.count === "number") {
        el.textContent = data.count.toLocaleString("en-US");
      }
    } catch (err) {
      // Ignore network failures
    }
  }

  function getStorageList(key) {
    const list = readJson(key, []);
    return Array.isArray(list) ? list : [];
  }

  function setStorageList(key, list) {
    writeJson(key, Array.isArray(list) ? list : []);
  }

  function addRecentEncounter(profile) {
    if (!profile || !profile.nickname) return;
    const recent = getStorageList(RECENT_KEY).filter(
      (item) => item.nickname !== profile.nickname
    );
    recent.unshift({
      nickname: profile.nickname,
      avatarUrl: profile.avatarUrl || "",
      lastSeen: Date.now(),
    });
    setStorageList(RECENT_KEY, recent.slice(0, 8));
  }

  function addFriend(profile) {
    if (!profile || !profile.nickname) return;
    const friends = getStorageList(FRIENDS_KEY).filter(
      (item) => item.nickname !== profile.nickname
    );
    friends.unshift({
      nickname: profile.nickname,
      avatarUrl: profile.avatarUrl || "",
      addedAt: Date.now(),
    });
    setStorageList(FRIENDS_KEY, friends.slice(0, 20));
  }

  function getRecentEncounters() {
    return getStorageList(RECENT_KEY);
  }

  function getFriends() {
    return getStorageList(FRIENDS_KEY);
  }

  function showToast(message, tone) {
    if (!message) return;
    let container = document.getElementById("cws-toast-stack");
    if (!container) {
      container = document.createElement("div");
      container.id = "cws-toast-stack";
      container.className =
        "fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-2";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className =
      "px-4 py-3 rounded-xl border border-glass-border bg-surface-container-low text-on-surface text-sm shadow-lg transition-opacity duration-300 opacity-0";
    if (tone === "error") {
      toast.classList.add("border-error", "text-error");
    }
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove("opacity-0");
    });

    setTimeout(() => {
      toast.classList.add("opacity-0");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2600);
  }

  window.CWS = {
    getProfile,
    setProfile,
    isAgeConfirmed,
    setAgeConfirmed,
    safeText,
    getQueryParam,
    navigate,
    requireAge,
    requireProfile,
    getMode,
    setMode,
    fetchOnlineCount,
    addRecentEncounter,
    addFriend,
    getRecentEncounters,
    getFriends,
    showToast,
  };
})();
