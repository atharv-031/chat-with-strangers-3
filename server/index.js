"use strict";

const path = require("path");
const http = require("http");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const ROOT = path.join(__dirname, "..");
const PORT = process.env.PORT || 3000;

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: "50kb" }));

app.use("/assets", express.static(path.join(ROOT, "public", "assets")));
["landing_page_18_entry", "persona_avatar_selection", "premium_bento_dashboard", "pro_active_chat_video_workspace"].forEach(
  (folder) => {
    app.use(`/${folder}`, express.static(path.join(ROOT, folder)));
  }
);

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT, "landing_page_18_entry", "code.html"));
});

app.get("/persona", (req, res) => {
  res.sendFile(path.join(ROOT, "persona_avatar_selection", "code.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(ROOT, "premium_bento_dashboard", "code.html"));
});

app.get("/chat", (req, res) => {
  res.sendFile(path.join(ROOT, "pro_active_chat_video_workspace", "code.html"));
});

let onlineCount = 0;
const liveEvents = [];
const recentEncounters = [];
const groupStats = new Map();
const MAX_LIVE_EVENTS = 8;
const MAX_RECENT_ENCOUNTERS = 12;
const MAX_TRENDING_GROUPS = 8;
app.get("/api/online", (req, res) => {
  res.json({ count: onlineCount });
});

app.get("/api/live", (req, res) => {
  res.json({
    onlineCount,
    liveEvents,
    recentEncounters,
    trendingGroups: getTrendingGroups(),
  });
});

app.post("/api/activity", (req, res) => {
  const tags = normalizeInterests(req.body?.tags || []);
  if (tags.length) {
    tags.forEach((tag) => recordGroup(tag));
    addLiveEvent({
      type: "group",
      text: `New Group: ${tags[0]}`,
      time: Date.now(),
    });
  }
  res.json({ ok: true });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.PUBLIC_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 100000,
});

const MAX_MESSAGE_LEN = 500;
const MAX_NICK_LEN = 20;
const MIN_NICK_LEN = 3;
const MAX_BIO_LEN = 140;
const MAX_INTERESTS = 8;

const queues = {
  text: [],
  video: [],
};

const ipConnections = new Map();

function normalizeMode(mode) {
  if (mode === "video") return "video";
  return "text";
}

function sanitizeText(value, maxLen) {
  if (typeof value !== "string") return "";
  let text = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (maxLen && text.length > maxLen) text = text.slice(0, maxLen);
  return text.replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"));
}

function sanitizeNickname(value) {
  const cleaned = sanitizeText(value, MAX_NICK_LEN).replace(/[^A-Za-z0-9_ -]/g, "").trim();
  if (cleaned.length < MIN_NICK_LEN) return "";
  return cleaned.slice(0, MAX_NICK_LEN);
}

function normalizeInterests(value) {
  if (!Array.isArray(value)) return [];
  const cleaned = [];
  for (const item of value) {
    const safe = sanitizeText(item, 24).toUpperCase();
    if (!safe) continue;
    if (!cleaned.includes(safe)) cleaned.push(safe);
    if (cleaned.length >= MAX_INTERESTS) break;
  }
  return cleaned;
}

function sanitizeProfile(raw) {
  if (!raw || typeof raw !== "object") return null;
  const nickname = sanitizeNickname(raw.nickname);
  if (!nickname) return null;
  return {
    nickname,
    bio: sanitizeText(raw.bio || "", MAX_BIO_LEN),
    avatarUrl: sanitizeText(raw.avatarUrl || "", 2048),
    avatarName: sanitizeText(raw.avatarName || "", 40),
    interests: normalizeInterests(raw.interests || []),
    mode: normalizeMode(raw.mode),
  };
}

function publicProfile(profile) {
  if (!profile) return null;
  return {
    nickname: profile.nickname,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    avatarName: profile.avatarName,
    interests: profile.interests,
    mode: profile.mode,
  };
}

function addLiveEvent(event) {
  if (!event) return;
  liveEvents.unshift({
    type: event.type || "event",
    text: sanitizeText(event.text || "", 80),
    time: event.time || Date.now(),
    avatarUrl: sanitizeText(event.avatarUrl || "", 2048),
  });
  if (liveEvents.length > MAX_LIVE_EVENTS) liveEvents.length = MAX_LIVE_EVENTS;
}

function addRecentEncounter(profile) {
  if (!profile || !profile.nickname) return;
  const entry = {
    nickname: profile.nickname,
    avatarUrl: profile.avatarUrl || "",
    lastSeen: Date.now(),
  };
  const filtered = recentEncounters.filter((item) => item.nickname !== entry.nickname);
  filtered.unshift(entry);
  recentEncounters.length = 0;
  recentEncounters.push(...filtered.slice(0, MAX_RECENT_ENCOUNTERS));
}

function recordGroup(tag) {
  if (!tag) return;
  const current = groupStats.get(tag) || { count: 0, lastSeen: 0 };
  current.count += 1;
  current.lastSeen = Date.now();
  groupStats.set(tag, current);
}

function getTrendingGroups() {
  return Array.from(groupStats.entries())
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      lastSeen: data.lastSeen,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.lastSeen - a.lastSeen;
    })
    .slice(0, MAX_TRENDING_GROUPS);
}

function createLimiter(maxHits, windowMs) {
  let hits = [];
  return () => {
    const now = Date.now();
    hits = hits.filter((t) => now - t < windowMs);
    if (hits.length >= maxHits) return false;
    hits.push(now);
    return true;
  };
}

function getQueue(mode) {
  return queues[normalizeMode(mode)];
}

function removeFromQueue(socket) {
  if (!socket.inQueue) return;
  const queue = getQueue(socket.profile?.mode || "text");
  const index = queue.indexOf(socket);
  if (index !== -1) queue.splice(index, 1);
  socket.inQueue = false;
}

function enqueue(socket) {
  if (!socket.profile) return;
  if (socket.inQueue || socket.partnerId) return;
  const queue = getQueue(socket.profile.mode);
  queue.push(socket);
  socket.inQueue = true;
  socket.emit("queue", { mode: socket.profile.mode });
}

function shareInterest(a, b) {
  if (!a.interests.length || !b.interests.length) return true;
  return a.interests.some((item) => b.interests.includes(item));
}

function isBlocked(socket, other) {
  if (!socket.blockedIds || !other) return false;
  return socket.blockedIds.has(other.id);
}

function canMatch(a, b) {
  if (!a.profile || !b.profile) return false;
  if (a.profile.mode !== b.profile.mode) return false;
  if (isBlocked(a, b) || isBlocked(b, a)) return false;
  return shareInterest(a.profile, b.profile);
}

function pair(a, b) {
  a.partnerId = b.id;
  b.partnerId = a.id;
  a.partner = b;
  b.partner = a;
  a.inQueue = false;
  b.inQueue = false;

  const initiator = a.id < b.id;

  a.emit("partner", {
    profile: publicProfile(b.profile),
    initiator,
  });
  b.emit("partner", {
    profile: publicProfile(a.profile),
    initiator: !initiator,
  });

  a.emit("system", { text: `Connected to ${b.profile.nickname}.` });
  b.emit("system", { text: `Connected to ${a.profile.nickname}.` });

  addLiveEvent({
    type: "match",
    text: `${a.profile.nickname} connected to ${b.profile.nickname}`,
    time: Date.now(),
    avatarUrl: a.profile.avatarUrl,
  });
  addRecentEncounter(a.profile);
  addRecentEncounter(b.profile);
}

function findMatchFor(socket) {
  const queue = getQueue(socket.profile.mode);
  for (let i = 0; i < queue.length; i++) {
    const candidate = queue[i];
    if (!candidate.connected || candidate.partnerId) {
      queue.splice(i, 1);
      i -= 1;
      continue;
    }
    if (candidate.id === socket.id) {
      queue.splice(i, 1);
      i -= 1;
      continue;
    }
    if (!canMatch(socket, candidate)) continue;
    queue.splice(i, 1);
    return candidate;
  }
  return null;
}

function tryMatch(socket) {
  if (!socket.profile || socket.partnerId) return;
  removeFromQueue(socket);
  const candidate = findMatchFor(socket);
  if (candidate) {
    pair(socket, candidate);
  } else {
    enqueue(socket);
  }
}

function clearPartner(socket, notify, reason) {
  if (!socket.partner) return;
  const partner = socket.partner;
  socket.partner = null;
  socket.partnerId = null;
  if (notify && partner.connected) {
    partner.partner = null;
    partner.partnerId = null;
    partner.emit("partner-left", { reason: reason || "left" });
    partner.emit("system", { text: "Your partner disconnected." });
  }
}

function blockPair(a, b) {
  if (!a.blockedIds) a.blockedIds = new Set();
  if (!b.blockedIds) b.blockedIds = new Set();
  a.blockedIds.add(b.id);
  b.blockedIds.add(a.id);
  if (a.blockedIds.size > 50) a.blockedIds.clear();
  if (b.blockedIds.size > 50) b.blockedIds.clear();
}

io.on("connection", (socket) => {
  const ip = socket.handshake.address || "unknown";
  const current = ipConnections.get(ip) || 0;
  if (current >= 5) {
    socket.emit("system", { text: "Too many connections from your network." });
    socket.disconnect(true);
    return;
  }
  ipConnections.set(ip, current + 1);

  onlineCount += 1;
  io.emit("online", { count: onlineCount });

  socket.profile = null;
  socket.partner = null;
  socket.partnerId = null;
  socket.inQueue = false;
  socket.blockedIds = new Set();

  socket.limits = {
    join: createLimiter(3, 60000),
    message: createLimiter(8, 2000),
    skip: createLimiter(4, 10000),
    report: createLimiter(2, 60000),
  };

  socket.on("join", (rawProfile) => {
    if (!socket.limits.join()) {
      socket.emit("system", { text: "Please wait before trying again." });
      return;
    }
    const profile = sanitizeProfile(rawProfile);
    if (!profile) {
      socket.emit("system", { text: "Invalid profile data." });
      return;
    }
    socket.profile = profile;
    socket.emit("system", { text: "Looking for a partner..." });
    tryMatch(socket);
  });

  socket.on("message", (payload) => {
    if (!socket.profile || !socket.partner) return;
    if (!socket.limits.message()) {
      socket.emit("system", { text: "You are sending messages too fast." });
      return;
    }
    const text = sanitizeText(String(payload || ""), MAX_MESSAGE_LEN);
    if (!text) return;
    socket.emit("message", { sender: "You", text, side: "self" });
    socket.partner.emit("message", { sender: socket.profile.nickname, text, side: "partner" });
  });

  socket.on("skip", () => {
    if (!socket.profile) return;
    if (!socket.limits.skip()) {
      socket.emit("system", { text: "Please slow down." });
      return;
    }
    if (socket.partner) {
      blockPair(socket, socket.partner);
      clearPartner(socket, true, "skip");
    }
    tryMatch(socket);
  });

  socket.on("report", () => {
    if (!socket.profile || !socket.partner) return;
    if (!socket.limits.report()) {
      socket.emit("system", { text: "Please wait before reporting again." });
      return;
    }
    blockPair(socket, socket.partner);
    clearPartner(socket, true, "report");
    socket.emit("system", { text: "Report received. We will review this session." });
    tryMatch(socket);
  });

  socket.on("webrtc-offer", (offer) => {
    if (socket.partner) socket.partner.emit("webrtc-offer", offer);
  });

  socket.on("webrtc-answer", (answer) => {
    if (socket.partner) socket.partner.emit("webrtc-answer", answer);
  });

  socket.on("webrtc-ice", (candidate) => {
    if (socket.partner) socket.partner.emit("webrtc-ice", candidate);
  });

  socket.on("disconnect", () => {
    removeFromQueue(socket);
    clearPartner(socket, true, "disconnect");

    const count = ipConnections.get(ip) || 1;
    if (count <= 1) ipConnections.delete(ip);
    else ipConnections.set(ip, count - 1);

    onlineCount = Math.max(0, onlineCount - 1);
    io.emit("online", { count: onlineCount });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
