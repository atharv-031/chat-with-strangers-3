(function () {
  "use strict";

  if (!CWS.requireAge()) return;
  const profile = CWS.requireProfile();
  if (!profile) return;

  const launchButton = document.getElementById("launch-connection");
  const newChatButton = document.getElementById("new-chat");
  const startChatButton = document.getElementById("start-chat");
  const addInterestButton = document.getElementById("add-interest");
  const interestList = document.getElementById("interest-list");
  const scrollLinks = Array.from(document.querySelectorAll("[data-scroll]"));
  const toastLinks = Array.from(document.querySelectorAll("[data-toast]"));
  const viewAllGroups = document.getElementById("view-all-groups");
  const extraGroups = document.getElementById("extra-groups");
  const recentList = document.getElementById("recent-list");
  const settingsButton = document.getElementById("settings-btn");
  const helpButton = document.getElementById("help-btn");
  const groupCards = Array.from(document.querySelectorAll("[data-group-tag]"));
  const popularGroupList = document.getElementById("popular-group-list");
  const globalActivity = document.getElementById("global-activity");

  let selectedMode = CWS.getMode();
  const selectedInterests = new Set((profile.interests || []).map((i) => i.toUpperCase()));

  function setMode(mode) {
    selectedMode = mode;
    CWS.setMode(mode);
    ["text", "video", "groups"].forEach((name) => {
      const btn = document.getElementById(`mode-${name}`);
      if (!btn) return;
      const icon = btn.querySelector(".material-symbols-outlined");
      if (name === mode) {
        btn.classList.add("border-primary", "ring-1", "ring-primary", "neon-glow-primary");
        btn.classList.remove("hover:bg-glass-surface");
        if (icon) {
          icon.classList.add("text-primary");
          icon.classList.remove("text-on-surface-variant");
        }
      } else {
        btn.classList.remove("border-primary", "ring-1", "ring-primary", "neon-glow-primary");
        btn.classList.add("hover:bg-glass-surface");
        if (icon) {
          icon.classList.remove("text-primary");
          icon.classList.add("text-on-surface-variant");
        }
      }
    });
  }

  window.toggleMode = setMode;
  setMode(selectedMode || "text");

  function applyInterestState(tag, active) {
    if (active) {
      tag.classList.add("border-secondary", "text-secondary");
      tag.classList.remove("border-glass-border");
    } else {
      tag.classList.remove("border-secondary", "text-secondary");
      tag.classList.add("border-glass-border");
    }
  }

  function toggleInterest(tag) {
    const value = tag.getAttribute("data-interest");
    if (!value) return;
    if (selectedInterests.has(value)) {
      selectedInterests.delete(value);
      applyInterestState(tag, false);
    } else {
      selectedInterests.add(value);
      applyInterestState(tag, true);
    }
  }

  function setupInterestTag(tag) {
    const value = tag.getAttribute("data-interest");
    if (value && selectedInterests.has(value)) {
      applyInterestState(tag, true);
    }
    tag.addEventListener("click", () => toggleInterest(tag));
  }

  function addInterestTag(raw, options) {
    if (!interestList) return null;
    const cleaned = CWS.safeText(raw, 20).replace(/[^A-Za-z0-9 _-]/g, "").trim();
    if (!cleaned) {
      CWS.showToast("Enter a valid interest tag.", "error");
      return null;
    }
    const value = cleaned.toUpperCase();
    const existing = document.querySelector(`[data-interest="${value}"]`);
    if (existing) {
      selectedInterests.add(value);
      applyInterestState(existing, true);
      CWS.showToast("Tag already added.");
      return existing;
    }

    const chip = document.createElement("span");
    chip.className =
      "px-4 py-1 rounded-full bg-glass-surface border border-glass-border font-label-caps text-label-caps hover:border-secondary cursor-pointer transition-all";
    chip.setAttribute("data-interest", value);
    chip.textContent = `#${cleaned}`;

    if (addInterestButton && addInterestButton.parentElement === interestList) {
      interestList.insertBefore(chip, addInterestButton);
    } else {
      interestList.appendChild(chip);
    }

    setupInterestTag(chip);
    if (!options || options.select !== false) {
      selectedInterests.add(value);
      applyInterestState(chip, true);
    }
    return chip;
  }

  Array.from(document.querySelectorAll("[data-interest]")).forEach((tag) => setupInterestTag(tag));

  function launch() {
    const interests = Array.from(selectedInterests.values());
    CWS.setProfile({ interests, mode: selectedMode });
    sendActivity(interests);
    const mode = selectedMode === "groups" ? "text" : selectedMode;
    CWS.navigate(`/chat?mode=${mode}`);
  }

  if (launchButton) launchButton.addEventListener("click", launch);
  if (newChatButton) newChatButton.addEventListener("click", launch);
  if (startChatButton) startChatButton.addEventListener("click", launch);

  if (addInterestButton) {
    addInterestButton.addEventListener("click", () => {
      const raw = window.prompt("Add an interest tag");
      if (raw !== null) addInterestTag(raw, { select: true });
    });
  }

  function sendActivity(tags) {
    const payload = JSON.stringify({ tags });
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/activity", blob);
      return;
    }
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    }).catch(() => {});
  }

  scrollLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("data-scroll");
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  toastLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const message = link.getAttribute("data-toast");
      if (message) CWS.showToast(message);
    });
  });

  if (settingsButton) {
    settingsButton.addEventListener("click", () => {
      CWS.showToast("Settings are saved on this device.");
    });
  }

  if (helpButton) {
    helpButton.addEventListener("click", () => {
      CWS.showToast("Need help? Email support@chatwithstrangers.com");
    });
  }

  groupCards.forEach((card) => {
    const tag = card.getAttribute("data-group-tag");
    if (!tag) return;
    card.addEventListener("click", () => {
      addInterestTag(tag, { select: true });
      CWS.showToast(`${tag} added to interests.`);
    });
  });

  if (viewAllGroups) {
    const extraGroupData = [
      {
        tag: "MOVIE CLUB",
        title: "Movie Club",
        members: "614 members active",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC8z93r0o3x2VgyI-dwS3WIn9A3E7U8A2XqR7_W44TeG69n1-rQvK1IJcA2cV9yc9ERv8_NtklK8yQc8IvKkgONCg1rf21XHu6ir0pt3q2s9XhSGnGxg3y7Y7c2dNVknm0MGJ7A9mFBRFNPU6TcZ4lJxE3C9qYxEKM0L2Auh8u5fCzdnSKlkxy2a0xn6l6MLo_m0V5Ove4c1WS7bA6oY8t5xQnF6QkP0cC6aHf5yQ0Z1s3lA3j8A1zg",
      },
      {
        tag: "SYNTH WAVE",
        title: "Synth Wave",
        members: "312 members active",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBZLZcXwOfgu6n9xv4F3Uj1G4gQXfB3Q0H0U3xAdqf0hD_1m2-0qJzCD9kBq4PzGuvzLo_sWw0FV_JDk6t2t8b7Z9yVNJ1JpVbmlZ4Yf4p_-8M7oGmI0a2XGgdw9q9QHSe7Q3QmDg-ckdJ7lqZ8FQq9dD0NVGm2r0AaeP1Anx3btCqZunDg3y1cRy2z7o2Nt9EadKzW9c2i3iR0WL6T8oQG0HjUWBqW3o8T1sQ7r1Gx-lXx7mW6g",
      },
    ];

    let extraRendered = false;

    function renderExtraGroups() {
      if (!extraGroups || extraRendered) return;
      extraGroups.innerHTML = "";
      extraGroupData.forEach((group) => {
        const card = document.createElement("div");
        card.className = "glass-card p-4 rounded-2xl hover:border-secondary/50 transition-all group cursor-pointer";
        card.setAttribute("data-group-tag", group.tag);

        card.innerHTML =
          `<div class="w-full h-24 rounded-xl mb-3 overflow-hidden">` +
          `<img alt="Group Thumbnail" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="${group.image}"/>` +
          `</div>` +
          `<h4 class="font-label-caps text-label-caps">${group.title}</h4>` +
          `<p class="text-xs text-text-muted mt-1">${group.members}</p>`;

        card.addEventListener("click", () => {
          addInterestTag(group.tag, { select: true });
          CWS.showToast(`${group.tag} added to interests.`);
        });

        extraGroups.appendChild(card);
      });
      extraRendered = true;
    }

    viewAllGroups.addEventListener("click", (event) => {
      event.preventDefault();
      if (!extraGroups) {
        CWS.showToast("More groups coming soon.");
        return;
      }
      renderExtraGroups();
      extraGroups.classList.toggle("hidden");
      viewAllGroups.textContent = extraGroups.classList.contains("hidden") ? "View All" : "Hide";
    });
  }

  function formatTimeAgo(timestamp) {
    if (!timestamp) return "Just now";
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function renderRecentEncounters() {
    if (!recentList) return;
    const recent = CWS.getRecentEncounters();
    if (!recent.length) return;
    recentList.innerHTML = "";

    recent.slice(0, 6).forEach((item) => {
      const row = document.createElement("div");
      row.className = "flex items-center justify-between p-3 rounded-xl hover:bg-glass-surface transition-all cursor-pointer";

      const left = document.createElement("div");
      left.className = "flex items-center gap-4";

      const avatar = document.createElement("div");
      avatar.className =
        "w-12 h-12 rounded-full overflow-hidden bg-surface-container-highest border border-primary/40 flex items-center justify-center text-sm font-label-caps text-primary";
      if (item.avatarUrl) {
        const img = document.createElement("img");
        img.src = item.avatarUrl;
        img.alt = item.nickname;
        img.className = "w-full h-full object-cover";
        avatar.innerHTML = "";
        avatar.appendChild(img);
      } else {
        avatar.textContent = item.nickname.slice(0, 1).toUpperCase();
      }

      const meta = document.createElement("div");
      meta.innerHTML =
        `<h4 class="font-label-caps text-label-caps">${item.nickname}</h4>` +
        `<p class="text-xs text-text-muted">Connected · ${formatTimeAgo(item.lastSeen)}</p>`;

      const more = document.createElement("span");
      more.className = "material-symbols-outlined text-on-surface-variant hover:text-primary";
      more.textContent = "more_vert";

      left.appendChild(avatar);
      left.appendChild(meta);
      row.appendChild(left);
      row.appendChild(more);
      row.addEventListener("click", launch);

      recentList.appendChild(row);
    });
  }

  function renderRecentFromServer(items) {
    if (!recentList) return false;
    if (!Array.isArray(items) || !items.length) return false;
    recentList.innerHTML = "";

    items.slice(0, 6).forEach((item) => {
      const row = document.createElement("div");
      row.className = "flex items-center justify-between p-3 rounded-xl hover:bg-glass-surface transition-all cursor-pointer";

      const left = document.createElement("div");
      left.className = "flex items-center gap-4";

      const avatar = document.createElement("div");
      avatar.className =
        "w-12 h-12 rounded-full overflow-hidden bg-surface-container-highest border border-primary/40 flex items-center justify-center text-sm font-label-caps text-primary";

      if (item.avatarUrl) {
        const img = document.createElement("img");
        img.src = item.avatarUrl;
        img.alt = item.nickname || "Stranger";
        img.className = "w-full h-full object-cover";
        avatar.appendChild(img);
      } else {
        avatar.textContent = (item.nickname || "S").slice(0, 1).toUpperCase();
      }

      const meta = document.createElement("div");
      meta.innerHTML =
        `<h4 class="font-label-caps text-label-caps">${item.nickname || "Stranger"}</h4>` +
        `<p class="text-xs text-text-muted">Connected · ${formatTimeAgo(item.lastSeen)}</p>`;

      const more = document.createElement("span");
      more.className = "material-symbols-outlined text-on-surface-variant hover:text-primary";
      more.textContent = "more_vert";

      left.appendChild(avatar);
      left.appendChild(meta);
      row.appendChild(left);
      row.appendChild(more);
      row.addEventListener("click", launch);
      recentList.appendChild(row);
    });

    return true;
  }

  function renderGlobalActivity(events) {
    if (!globalActivity) return;
    if (!Array.isArray(events) || !events.length) return;
    globalActivity.innerHTML = "";

    events.slice(0, 2).forEach((event) => {
      const card = document.createElement("div");
      card.className = "glass-card rounded-xl p-3 flex items-center gap-3";

      const avatar = document.createElement("div");
      avatar.className =
        "w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest border border-primary/30 flex items-center justify-center text-[10px] font-label-caps text-primary";
      if (event.avatarUrl) {
        const img = document.createElement("img");
        img.src = event.avatarUrl;
        img.alt = "Activity";
        img.className = "w-full h-full object-cover";
        avatar.appendChild(img);
      } else {
        avatar.textContent = "LIVE";
      }

      const meta = document.createElement("div");
      meta.innerHTML =
        `<p class="font-label-caps text-label-caps text-on-surface">${event.text || "Activity"}</p>` +
        `<p class="text-[10px] text-text-muted">${formatTimeAgo(event.time)}</p>`;

      card.appendChild(avatar);
      card.appendChild(meta);
      globalActivity.appendChild(card);
    });
  }

  function renderPopularGroups(groups) {
    if (!popularGroupList) return false;
    if (!Array.isArray(groups) || !groups.length) return false;
    popularGroupList.innerHTML = "";

    const imageMap = {
      "NIGHT OWLS":
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDrwTGmceoYLVnhVJe5OozjvAZEJD5xEvrs7SLKeQcsNAFBjJOIBebJ6QUPtg76QMgvatKdA0wz9vzJZ59F0ynFR8vXolB7QtNOOiEPC9AjSDBNVuLb2QEPEjvsHyJIrRRz6MouOqo0KYumtB7bfzfXuBdMVy6nW0ePVWOS5wP7E4-gwNluCySCJDQJs52T0pbVjjMj2kE6pMdEj1z4RVRC1UWceQGWzpjMpbkybLPBcM1rTmGql9Mn-VgxyT3T5_rivtoNQlYYrqQ",
      "RETRO GAMING":
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAx8nsgAYwWzVBYvrtjE_et8tPcKpYCQWPi0wK9eVl0WmXKH6icdgMzw3dIaA8JM4EYPmddeHMQLVlAacijM3nuy0EpEtZe1ZAAjJCVMY-DEBkfrn9jgwvqVETVQPzq7knVNxJa8TqSbwEuMhhQUGHGfMu9dV4W5QIffKJJh8VZfGow5hxBn_tFmyN2U6K1qKqXY3L7qNOll6cuTIw6rG4Pkgm6tfsMmYPVUx163qZG1-3bvx1x11De4h15Uy-yUG55NCBGkt3CV44",
      TECHNOLOGY:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBZLZcXwOfgu6n9xv4F3Uj1G4gQXfB3Q0H0U3xAdqf0hD_1m2-0qJzCD9kBq4PzGuvzLo_sWw0FV_JDk6t2t8b7Z9yVNJ1JpVbmlZ4Yf4p_-8M7oGmI0a2XGgdw9q9QHSe7Q3QmDg-ckdJ7lqZ8FQq9dD0NVGm2r0AaeP1Anx3btCqZunDg3y1cRy2z7o2Nt9EadKzW9c2i3iR0WL6T8oQG0HjUWBqW3o8T1sQ7r1Gx-lXx7mW6g",
    };

    groups.slice(0, 4).forEach((group) => {
      const tag = group.tag || "GROUP";
      const title = tag
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const card = document.createElement("div");
      card.className = "glass-card p-4 rounded-2xl hover:border-secondary/50 transition-all group cursor-pointer";
      card.setAttribute("data-group-tag", tag);

      const image = imageMap[tag] || imageMap["TECHNOLOGY"];
      card.innerHTML =
        `<div class="w-full h-24 rounded-xl mb-3 overflow-hidden">` +
        `<img alt="Group Thumbnail" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="${image}"/>` +
        `</div>` +
        `<h4 class="font-label-caps text-label-caps">${title}</h4>` +
        `<p class="text-xs text-text-muted mt-1">${group.count || 0} members active</p>`;

      card.addEventListener("click", () => {
        addInterestTag(tag, { select: true });
        CWS.showToast(`${tag} added to interests.`);
      });

      popularGroupList.appendChild(card);
    });

    return true;
  }

  async function fetchLiveData() {
    try {
      const res = await fetch("/api/live");
      if (!res.ok) return;
      const data = await res.json();

      if (typeof data.onlineCount === "number") {
        const onlineEl = document.getElementById("online-count");
        if (onlineEl) onlineEl.textContent = data.onlineCount.toLocaleString("en-US");
      }

      renderGlobalActivity(data.liveEvents || []);
      const renderedGroups = renderPopularGroups(data.trendingGroups || []);
      const renderedRecent = renderRecentFromServer(data.recentEncounters || []);

      if (!renderedRecent) renderRecentEncounters();
      if (!renderedGroups) renderPopularGroups([]);
    } catch (err) {
      renderRecentEncounters();
    }
  }

  renderRecentEncounters();
  fetchLiveData();
  setInterval(fetchLiveData, 12000);
})();
