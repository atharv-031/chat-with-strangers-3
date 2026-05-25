(function () {
  "use strict";

  const modal = document.getElementById("age-modal");
  const startChat = document.getElementById("start-chat");
  const startText = document.getElementById("start-text");
  const startVideo = document.getElementById("start-video");
  const jumpIn = document.getElementById("jump-in");

  function hideModal() {
    if (!modal) return;
    modal.style.opacity = "0";
    modal.style.pointerEvents = "none";
    setTimeout(() => {
      modal.classList.add("hidden");
    }, 400);
    document.body.style.overflow = "auto";
  }

  function showModal() {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    CWS.setAgeConfirmed();
    hideModal();
  }

  function goToPersona(mode) {
    if (!CWS.isAgeConfirmed()) {
      showModal();
      return;
    }
    if (mode) CWS.setMode(mode);
    CWS.navigate("/persona");
  }

  window.closeModal = closeModal;

  if (CWS.isAgeConfirmed()) {
    hideModal();
  } else {
    showModal();
  }

  if (startChat) startChat.addEventListener("click", () => goToPersona("text"));
  if (startText) startText.addEventListener("click", () => goToPersona("text"));
  if (startVideo) startVideo.addEventListener("click", () => goToPersona("video"));
  if (jumpIn) jumpIn.addEventListener("click", () => goToPersona("text"));

  CWS.fetchOnlineCount("online-count");
  setInterval(() => CWS.fetchOnlineCount("online-count"), 15000);

  const glow = document.createElement("div");
  glow.className =
    "fixed w-[600px] h-[600px] rounded-full pointer-events-none z-[-1] opacity-20 blur-[120px] transition-opacity duration-1000";
  glow.style.background =
    "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(6, 182, 212, 0) 70%)";
  document.body.appendChild(glow);

  document.addEventListener("mousemove", (event) => {
    const x = event.clientX - 300;
    const y = event.clientY - 300;
    glow.style.transform = `translate(${x}px, ${y}px)`;
  });
})();
