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

  let socket = null;
  let peer = null;
  let localStream = null;
  let videoEnabled = mode === "video";
  let currentPartner = null;

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
  if (navStart) navStart.addEventListener("click", () => CWS.navigate("/dashboard"));
  if (micToggle) micToggle.addEventListener("click", toggleMic);
  if (videoToggle) videoToggle.addEventListener("click", toggleVideo);

  if (mode !== "video") {
    if (videoToggle) videoToggle.classList.add("hidden");
    if (micToggle) micToggle.classList.add("hidden");
    if (remoteVideo) remoteVideo.classList.add("hidden");
    if (localVideo) localVideo.classList.add("hidden");
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
