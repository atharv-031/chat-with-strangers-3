(function () {
  "use strict";

  if (!CWS.requireAge()) return;

  const cards = Array.from(document.querySelectorAll(".avatar-card"));
  const nameInput = document.getElementById("display-name");
  const bioInput = document.getElementById("bio");
  const enterButton = document.getElementById("enter-chatroom");
  const errorEl = document.getElementById("persona-error");
  const navStart = document.getElementById("start-chat");

  let selectedAvatar = null;

  function setError(message) {
    if (!errorEl) return;
    if (message) {
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
    } else {
      errorEl.textContent = "";
      errorEl.classList.add("hidden");
    }
  }

  function selectAvatar(card) {
    cards.forEach((item) => {
      const container = item.querySelector(".avatar-container");
      const overlay = item.querySelector(".absolute");
      if (container) container.classList.remove("neon-glow-active", "!border-primary");
      if (overlay) {
        overlay.classList.add("opacity-0");
        overlay.classList.remove("opacity-100");
      }
    });

    const container = card.querySelector(".avatar-container");
    const overlay = card.querySelector(".absolute");
    if (container) container.classList.add("neon-glow-active", "!border-primary");
    if (overlay) {
      overlay.classList.remove("opacity-0");
      overlay.classList.add("opacity-100");
    }

    selectedAvatar = {
      name: card.getAttribute("data-avatar-name") || "",
      url: card.getAttribute("data-avatar-src") || "",
    };

    card.style.transform = "scale(0.95)";
    setTimeout(() => {
      card.style.transform = "scale(1)";
    }, 100);
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => selectAvatar(card));
  });

  const activeCard = cards.find((card) =>
    card.querySelector(".avatar-container")?.classList.contains("neon-glow-active")
  );
  if (activeCard) selectAvatar(activeCard);
  else if (cards.length) selectAvatar(cards[0]);

  const profile = CWS.getProfile();
  if (nameInput && profile.nickname) nameInput.value = profile.nickname;
  if (bioInput && profile.bio) bioInput.value = profile.bio;

  function submit() {
    const rawName = CWS.safeText(nameInput?.value || "", 24);
    const cleaned = rawName.replace(/[^A-Za-z0-9_ -]/g, "").trim();
    if (cleaned.length < 3) {
      setError("Display name must be at least 3 characters.");
      return;
    }

    const bio = CWS.safeText(bioInput?.value || "", 140);
    const avatarName = selectedAvatar?.name || "";
    const avatarUrl = selectedAvatar?.url || "";

    CWS.setProfile({
      nickname: cleaned,
      bio,
      avatarName,
      avatarUrl,
    });

    setError("");
    CWS.navigate("/dashboard");
  }

  if (enterButton) enterButton.addEventListener("click", submit);
  if (nameInput) {
    nameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") submit();
    });
  }

  if (navStart) navStart.addEventListener("click", () => CWS.navigate("/dashboard"));

  const scroller = document.getElementById("avatar-scroller");
  if (scroller) {
    scroller.addEventListener("wheel", (event) => {
      event.preventDefault();
      scroller.scrollLeft += event.deltaY;
    });
  }
})();
