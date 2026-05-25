(function () {
  "use strict";

  if (!CWS.requireAge()) return;
  const profile = CWS.requireProfile();
  if (!profile) return;

  const mode = CWS.getMode();
  CWS.setMode(mode);

  const chatMessages = document.getElementById("chat-messages");
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-btn");
  const skipButton = document.getElementById("skip-btn");
  const reportButton = document.getElementById("report-btn");
  const partnerName = document.getElementById("partner-name");
  const partnerStatus = document.getElementById("partner-status");
  const partnerLocation = document.getElementById("partner-location");
  const partnerInterests = document.getElementById("partner-interests");
  const partnerBio = document.getElementById("partner-bio");
  const navStart = document.getElementById("nav-start-chat");
  const newChatButton = document.getElementById("sidebar-new-chat");
  const friendButton = document.getElementById("friend-btn");
  const hideButton = document.getElementById("hide-btn");
  const micToggle = document.getElementById("mic-toggle");
  const videoToggle = document.getElementById("video-toggle");
  const remoteVideo = document.getElementById("remote-video");
  const localVideo = document.getElementById("local-video");
  const videoPlaceholder = document.getElementById("video-placeholder");
  const videoCard = document.getElementById("video-card");

  const emojiButton = document.getElementById("emoji-btn");
  const attachButton = document.getElementById("attach-btn");
  const fileInput = document.getElementById("file-input");

  const skipButtonMobile = document.getElementById("skip-btn-mobile");
  const friendButtonMobile = document.getElementById("friend-btn-mobile");
  const hideButtonMobile = document.getElementById("hide-btn-mobile");

  let socket = null;
  let peer = null;
  let localStream = null;
  let videoEnabled = mode === "video";
  let currentPartner = null;

  const MAX_FILE_BYTES = 512 * 1024;
  const EMOJIS = [
    "😀",
    "😁",
    "😂",
    "😅",
    "😊",
    "😍",
    "😎",
    "🤔",
    "😴",
    "😭",
    "😡",
    "👍",
    "👎",
    "🙏",
    "❤️",
    "🔥",
    "🎉",
    "✨",
    "😮",
    "😬",
    "🙃",
    "🤝",
    "💯",
    "🥳",
  ];

  let emojiPanel = null;

  function scrollToBottom() {
    if (!chatMessages) return;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function clearMessages() {
    if (chatMessages) chatMessages.innerHTML = "";
  }

  function appendMessage(text, side) {
    if (!chatMessages) return;
    const row = document.createElement("div");
    const bubble = document.createElement("div");

    if (side === "self") {
      row.className = "flex justify-end";
      bubble.className =
        "bg-gradient-to-br from-primary-container to-on-primary-fixed-variant text-white p-4 rounded-2xl rounded-br-none max-w-[80%] font-chat-bubble text-chat-bubble neon-glow-violet message-in";
    } else if (side === "partner") {
      row.className = "flex justify-start";
      bubble.className =
        "bg-[#1E1E20] border border-glass-border text-on-surface p-4 rounded-2xl rounded-bl-none max-w-[80%] font-chat-bubble text-chat-bubble message-in";
    } else {
      row.className = "flex justify-center";
      bubble.className = "text-xs text-text-muted font-label-caps";
    }

    bubble.textContent = text;
    row.appendChild(bubble);
    chatMessages.appendChild(row);
    scrollToBottom();
  }

  function formatBytes(bytes) {
    if (!bytes || typeof bytes !== "number") return "";
    const kb = Math.round(bytes / 1024);
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  function appendFileMessage(payload) {
    if (!chatMessages || !payload) return;
    const side = payload.side === "self" ? "self" : payload.side === "partner" ? "partner" : "system";

    const row = document.createElement("div");
    const bubble = document.createElement("div");

    if (side === "self") {
      row.className = "flex justify-end";
      bubble.className =
        "bg-gradient-to-br from-primary-container to-on-primary-fixed-variant text-white p-4 rounded-2xl rounded-br-none max-w-[80%] font-chat-bubble text-chat-bubble neon-glow-violet message-in";
    } else if (side === "partner") {
      row.className = "flex justify-start";
      bubble.className =
        "bg-[#1E1E20] border border-glass-border text-on-surface p-4 rounded-2xl rounded-bl-none max-w-[80%] font-chat-bubble text-chat-bubble message-in";
    } else {
      row.className = "flex justify-center";
      bubble.className = "text-xs text-text-muted font-label-caps";
    }

    const name = CWS.safeText(String(payload.name || "file"), 80) || "file";
    const sizeText = typeof payload.size === "number" ? formatBytes(payload.size) : "";
    const label = side === "self" ? "You sent a file" : "File received";

    const header = document.createElement("div");
    header.className = "text-xs opacity-90";
    header.textContent = sizeText ? `${label}: ${name} (${sizeText})` : `${label}: ${name}`;
    bubble.appendChild(header);

    const mime = typeof payload.mime === "string" ? payload.mime : "application/octet-stream";
    let blob;
    try {
      blob = new Blob([payload.data], { type: mime || "application/octet-stream" });
    } catch (err) {
      blob = new Blob([payload.data]);
    }

    const url = URL.createObjectURL(blob);

    if (mime && mime.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = name;
      img.loading = "lazy";
      img.className = "mt-3 max-h-64 rounded-xl border border-glass-border";
      bubble.appendChild(img);
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.target = "_blank";
    link.rel = "noopener";
    link.className =
      side === "self"
        ? "mt-3 inline-block underline text-white"
        : "mt-3 inline-block underline text-secondary";
    link.textContent = "Download";
    bubble.appendChild(link);

    row.appendChild(bubble);
    chatMessages.appendChild(row);
    scrollToBottom();

    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        // ignore
      }
    }, 60000);
  }

  function insertAtCursor(input, text) {
    if (!input || !text) return;
    const start = typeof input.selectionStart === "number" ? input.selectionStart : input.value.length;
    const end = typeof input.selectionEnd === "number" ? input.selectionEnd : input.value.length;
    input.value = `${input.value.slice(0, start)}${text}${input.value.slice(end)}`;
    const next = start + text.length;
    try {
      input.setSelectionRange(next, next);
    } catch (err) {
      // ignore
    }
    input.focus();
  }

  function ensureEmojiPanel() {
    if (emojiPanel || !messageInput) return;
    const anchor = messageInput.parentElement;
    if (!anchor) return;

    emojiPanel = document.createElement("div");
    emojiPanel.id = "emoji-panel";
    emojiPanel.className =
      "hidden absolute bottom-full right-0 mb-3 glass-card rounded-2xl p-3 border border-glass-border backdrop-blur-xl z-50 w-72 max-w-[calc(100vw-2rem)]";

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-8 gap-1";
    EMOJIS.forEach((emoji) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "w-8 h-8 rounded-lg hover:bg-glass-surface flex items-center justify-center";
      btn.textContent = emoji;
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        insertAtCursor(messageInput, emoji);
        closeEmojiPanel();
      });
      grid.appendChild(btn);
    });

    emojiPanel.appendChild(grid);
    anchor.appendChild(emojiPanel);
  }

  function closeEmojiPanel() {
    if (!emojiPanel) return;
    emojiPanel.classList.add("hidden");
  }

  function toggleEmojiPanel() {
    ensureEmojiPanel();
    if (!emojiPanel) return;
    emojiPanel.classList.toggle("hidden");
  }

  async function sendFile(file) {
    if (!socket || !socket.connected) {
      CWS.showToast("Not connected yet.", "error");
      return;
    }
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      CWS.showToast(`File too large. Max ${Math.round(MAX_FILE_BYTES / 1024)}KB.`, "error");
      return;
    }
    try {
      const data = await file.arrayBuffer();
      socket.emit("file", {
        name: file.name,
        mime: file.type || "application/octet-stream",
        data,
      });
    } catch (err) {
      CWS.showToast("Could not read this file.", "error");
    }
  }

  function setPartner(profileData) {
    currentPartner = profileData || null;
    if (partnerName) partnerName.textContent = profileData ? profileData.nickname : "Searching...";
    if (partnerStatus) {
      partnerStatus.textContent = profileData ? "Connected now" : "Searching for a partner";
    }
    if (partnerLocation) partnerLocation.textContent = profileData?.location || "Unknown";
    if (partnerBio) partnerBio.textContent = profileData?.bio || "Anonymous profile";

    if (partnerInterests) {
      partnerInterests.innerHTML = "";
      const interests = profileData?.interests || [];
      if (!interests.length) {
        const chip = document.createElement("span");
        chip.className =
          "bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-label-caps text-on-surface";
        chip.textContent = "NO TAGS";
        partnerInterests.appendChild(chip);
      } else {
        interests.slice(0, 6).forEach((interest) => {
          const chip = document.createElement("span");
          chip.className =
            "bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-label-caps text-on-surface";
          chip.textContent = interest;
          partnerInterests.appendChild(chip);
        });
      }
    }
    if (profileData) {
      CWS.addRecentEncounter(profileData);
    }
  }

  async function ensureLocalStream() {
    if (!videoEnabled) return null;
    if (localStream) return localStream;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      appendMessage("Video chat is not supported in this browser.", "system");
      videoEnabled = false;
      updateVideoUI();
      return null;
    }
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideo) {
        localVideo.srcObject = localStream;
        localVideo.muted = true;
        localVideo.play().catch(() => {});
      }
      return localStream;
    } catch (err) {
      appendMessage("Camera or mic blocked. Video disabled.", "system");
      videoEnabled = false;
      updateVideoUI();
      return null;
    }
  }

  function updateVideoUI() {
    if (!videoToggle) return;
    if (videoEnabled) {
      videoToggle.classList.add("text-primary");
      videoToggle.classList.remove("text-white");
    } else {
      videoToggle.classList.remove("text-primary");
      videoToggle.classList.add("text-white");
    }
    if (videoPlaceholder) {
      videoPlaceholder.classList.toggle("hidden", !!remoteVideo?.srcObject);
    }
  }

  async function createPeer(initiator) {
    peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate && socket) socket.emit("webrtc-ice", event.candidate);
    };

    peer.ontrack = (event) => {
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
        remoteVideo.play().catch(() => {});
      }
      if (videoPlaceholder) videoPlaceholder.classList.add("hidden");
    };

    const stream = await ensureLocalStream();
    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }

    if (initiator) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("webrtc-offer", peer.localDescription);
    }
  }

  async function handleOffer(offer) {
    if (!peer) await createPeer(false);
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit("webrtc-answer", peer.localDescription);
  }

  async function handleAnswer(answer) {
    if (!peer) return;
    await peer.setRemoteDescription(answer);
  }

  async function handleIce(candidate) {
    if (!peer || !candidate) return;
    try {
      await peer.addIceCandidate(candidate);
    } catch (err) {
      // Ignore ICE failures
    }
  }

  function resetPeer() {
    if (peer) {
      peer.ontrack = null;
      peer.onicecandidate = null;
      peer.close();
      peer = null;
    }
    if (remoteVideo) remoteVideo.srcObject = null;
    if (videoPlaceholder) videoPlaceholder.classList.remove("hidden");
  }

  function sendMessage() {
    if (!socket || !messageInput) return;
    const text = CWS.safeText(messageInput.value, 500);
    if (!text) return;
    socket.emit("message", text);
    messageInput.value = "";
  }

  function skipPartner() {
    if (!socket) return;
    socket.emit("skip");
  }

  function reportPartner() {
    if (!socket) return;
    socket.emit("report");
    CWS.showToast("Report submitted.");
  }

  function addFriend() {
    if (!currentPartner) {
      CWS.showToast("No partner to add yet.", "error");
      return;
    }
    CWS.addFriend(currentPartner);
    CWS.showToast("Added to friends.");
  }

  function hidePartner() {
    if (!socket) return;
    socket.emit("skip");
    CWS.showToast("Partner hidden.");
  }

  function toggleMic() {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (!audioTracks.length) return;
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
  }

  async function toggleVideo() {
    videoEnabled = !videoEnabled;
    if (videoEnabled && !localStream) {
      appendMessage("Restart the chat to enable video.", "system");
      videoEnabled = false;
      updateVideoUI();
      return;
    }
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = videoEnabled;
      });
    }
    updateVideoUI();
  }

  function connectSocket() {
    socket = io();

    socket.on("connect", () => {
      socket.emit("join", {
        nickname: profile.nickname,
        bio: profile.bio,
        avatarName: profile.avatarName,
        avatarUrl: profile.avatarUrl,
        interests: profile.interests || [],
        mode: mode,
      });
    });

    socket.on("queue", () => {
      clearMessages();
      resetPeer();
      setPartner(null);
      appendMessage("Searching for a partner...", "system");
    });

    socket.on("partner", (payload) => {
      clearMessages();
      setPartner(payload.profile);
      resetPeer();
      if (mode === "video") createPeer(!!payload.initiator);
    });

    socket.on("partner-left", () => {
      resetPeer();
      setPartner(null);
      appendMessage("Partner left. Looking for someone else...", "system");
    });

    socket.on("system", (payload) => {
      if (payload?.text) appendMessage(payload.text, "system");
    });

    socket.on("message", (payload) => {
      if (!payload?.text) return;
      const side = payload.side === "self" ? "self" : "partner";
      appendMessage(payload.text, side);
    });

    socket.on("file", (payload) => {
      appendFileMessage(payload);
    });

    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice", handleIce);
  }

  if (sendButton) sendButton.addEventListener("click", sendMessage);
  if (messageInput) {
    messageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") sendMessage();
    });
  }
  if (skipButton) skipButton.addEventListener("click", skipPartner);
  if (newChatButton) newChatButton.addEventListener("click", skipPartner);
  if (reportButton) reportButton.addEventListener("click", reportPartner);
  if (friendButton) friendButton.addEventListener("click", addFriend);
  if (hideButton) hideButton.addEventListener("click", hidePartner);
  if (skipButtonMobile) skipButtonMobile.addEventListener("click", skipPartner);
  if (friendButtonMobile) friendButtonMobile.addEventListener("click", addFriend);
  if (hideButtonMobile) hideButtonMobile.addEventListener("click", hidePartner);
  if (navStart) navStart.addEventListener("click", () => CWS.navigate("/dashboard"));
  if (micToggle) micToggle.addEventListener("click", toggleMic);
  if (videoToggle) videoToggle.addEventListener("click", toggleVideo);

  if (emojiButton) {
    emojiButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleEmojiPanel();
    });
  }

  if (attachButton && fileInput) {
    attachButton.addEventListener("click", (event) => {
      event.preventDefault();
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = "";
      await sendFile(file);
    });
  }

  document.addEventListener("click", (event) => {
    if (!emojiPanel || emojiPanel.classList.contains("hidden")) return;
    const target = event.target;
    if (emojiPanel.contains(target)) return;
    if (emojiButton && emojiButton.contains(target)) return;
    closeEmojiPanel();
  });

  if (mode !== "video") {
    if (videoToggle) videoToggle.classList.add("hidden");
    if (micToggle) micToggle.classList.add("hidden");
    if (remoteVideo) remoteVideo.classList.add("hidden");
    if (localVideo) localVideo.classList.add("hidden");
    if (videoCard) videoCard.classList.add("hidden");
  }

  setPartner(null);
  connectSocket();

  document.querySelectorAll(".glass-card").forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });
})();
