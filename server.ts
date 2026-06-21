import express from "express";
import path from "path";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import crypto from "crypto";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to files
const LEADERBOARD_FILE = path.join(process.cwd(), "leaderboard.json");
const USERS_FILE = path.join(process.cwd(), "users.json");
const SETTINGS_FILE = path.join(process.cwd(), "system_settings.json");

interface LeaderboardEntry {
  id: string;
  name: string;
  kpm: number;
  accuracy: number;
  mode: string;
  timestamp: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  isBanned?: boolean;
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

interface SystemSettings {
  maintenanceMode: boolean;
  customAnnouncement: string;
  minKpmForLeaderboard: number;
  maxKpmLimit: number;
}

// In-memory active session store
const activeSessions = new Map<string, SessionUser>();

function hashPassword(password: string): string {
  // Use secure SHA-256 hashing to safeguard user passwords across the globe
  return crypto.createHash("sha256").update(password + "_2-55_typing_salt_!!").digest("hex");
}

function verifyPassword(password: string, storedHash: string): boolean {
  // Graceful support for legacy base64-encoded credentials to avoid bricking existing accounts
  const legacyHash = Buffer.from(password).toString("base64");
  const secureHash = hashPassword(password);
  return storedHash === secureHash || storedHash === legacyHash;
}

function getSystemSettings(): SystemSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading system settings file:", err);
  }
  return {
    maintenanceMode: false,
    customAnnouncement: "ようこそ -2-55Typing へ！タッチタイピング能力を極限まで高めましょう。",
    minKpmForLeaderboard: 0,
    maxKpmLimit: 1200
  };
}

function saveSystemSettings(settings: SystemSettings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing system settings file:", err);
  }
}

// Load users from local file
function getUsersList(): UserRecord[] {
  let list: UserRecord[] = [];
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      list = JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading users file:", err);
  }

  const adminEmail = "ozakirikito8795@gmail.com";
  const newPasswordHash = hashPassword("2h6y@8795");
  const existingAdmin = list.find(u => u.email.toLowerCase() === adminEmail.toLowerCase());

  if (existingAdmin) {
    if (existingAdmin.passwordHash !== newPasswordHash) {
      existingAdmin.passwordHash = newPasswordHash;
      saveUsersList(list);
    }
  } else {
    const defaultAdmin: UserRecord = {
      id: "admin_user",
      name: "管理者",
      email: adminEmail,
      passwordHash: newPasswordHash,
      createdAt: new Date().toISOString()
    };
    list.unshift(defaultAdmin);
    saveUsersList(list);
  }

  return list;
}

function saveUsersList(users: UserRecord[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing users file:", err);
  }
}

// Load current leaderboard from local file
function getLeaderboard(): LeaderboardEntry[] {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = fs.readFileSync(LEADERBOARD_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading leaderboard file:", err);
  }
  return [];
}

function saveLeaderboard(entries: LeaderboardEntry[]) {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing leaderboard file:", err);
  }
}

// Middlewares
function authenticateUser(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "ログインが必要です。" });
  }
  const token = authHeader.split(" ")[1];
  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: "セッションの有効期限が切れています。再度ログインしてください。" });
  }
  req.user = session;
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "アクセス権限がありません。" });
  }
  next();
}

// API health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

function isInappropriateName(name: string): boolean {
  if (!name) return false;

  // 1. Convert Katakana to Hiragana and make lowercase
  let normalized = name
    .replace(/[\u30a1-\u30f6]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - 0x60);
    })
    .toLowerCase();

  // 2. Clear spacing, digits, and standard delimiters, but keep mask symbols (○, ◯, ●, *, ×, etc.)
  normalized = normalized.replace(/[\s\d_\-~！@#￥%……&*（）——+=\\`\\[\]{};':",./<>?|～！？＠＃＄％＾＆＊（）——＋＝]/g, "");

  // 3. Define flexible matching patterns with support for common character masks
  const patterns = [
    // うんこ、う○こ、うこ、ウンコ、ウンこ
    /う[ん○◯●\*×☆★◆◇]?こ/i,
    // うんち、う○ち、ウンチ
    /う[ん○◯●\*×☆★◆◇]?ち/i,
    // しね、死ね、し○、死ね
    /し[ね○◯●\*×☆★◆◇]/i,
    /死[ね○◯●\*×☆★◆◇]/i,
    // ころす、殺す、ころ○
    /ころす/i,
    /殺す/i,
    /こ[ろ○◯●\*×☆★◆◇]?す/i,
    /殺[す○◯●\*×☆★◆◇]/i,
    // くそ、クソ、く○
    /く[そ○◯●\*×☆★◆◇]/i,
    // ばか、バカ、ば○、馬鹿
    /ば[か○◯●\*×☆★◆◇]/i,
    /馬鹿/i,
    /ばか/i,
    // あほ、アホ、あ○
    /あ[ほ○◯●\*×☆★◆◇]/i,
    // かす、カス、か○
    /か[す○◯●\*×☆★◆◇]/i,
    // ちんこ、チンコ、ち○こ
    /ち[ん○◯●\*×☆★◆◇]?こ/i,
    // まんこ、マンコ、ま○こ
    /ま[ん○◯●\*×☆★◆◇]?こ/i,
    // おめこ、お○こ、おめ○
    /お[め○◯●\*×☆★◆◇]?こ/i,
    // せっくす、セックス、せ○くす
    /せっくす/i,
    /せ[○◯●\*×☆★◆◇]?くす/i,
    // きちがい、キチガイ
    /きちがい/i,

    // English bad words (still standard check)
    /fuck/i,
    /shit/i,
    /bitch/i,
    /asshole/i,
    /cunt/i,
    /dick/i,
    /pussy/i,
    /rape/i,
    /sex/i,
    /cock/i
  ];

  return patterns.some(pattern => pattern.test(normalized));
}

// AUTH API ROUTES
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "全ての項目を入力してください。" });
  }
  if (name.length > 16) {
    return res.status(400).json({ error: "ニックネームは16文字以内で入力してください。" });
  }
  if (isInappropriateName(name)) {
    return res.status(400).json({ error: "ニックネームに不適切な表現が含まれています。" });
  }

  const settings = getSystemSettings();
  const isUserAdmin = email.toLowerCase().trim() === "ozakirikito8795@gmail.com";
  if (settings.maintenanceMode && !isUserAdmin) {
    return res.status(403).json({ error: "現在メンテナンス中のため、新規ユーザー登録は休止されています。" });
  }

  const users = getUsersList();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
    return res.status(400).json({ error: "このメールアドレスは既に登録されています。" });
  }

  const newUser: UserRecord = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.substring(0, 16),
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsersList(users);

  const token = `token_${Buffer.from(newUser.email + "_" + Date.now()).toString("base64")}`;
  const session: SessionUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    isAdmin: isUserAdmin,
    createdAt: newUser.createdAt
  };
  activeSessions.set(token, session);

  res.status(200).json({ token, user: session });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "メールアドレスとパスワードを入力してください。" });
  }

  const users = getUsersList();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(400).json({ error: "メールアドレスまたはパスワードが正しくありません。" });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: "このアカウントは管理者によって凍結（垢BAN）されています。" });
  }

  const settings = getSystemSettings();
  const isUserAdmin = user.email === "ozakirikito8795@gmail.com";
  if (settings.maintenanceMode && !isUserAdmin) {
    return res.status(403).json({ error: "現在メンテナンス中のため、管理ユーザー以外はログインできません。" });
  }

  const token = `token_${Buffer.from(user.email + "_" + Date.now()).toString("base64")}`;
  const session: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: isUserAdmin,
    createdAt: user.createdAt
  };
  activeSessions.set(token, session);

  res.status(200).json({ token, user: session });
});

app.post("/api/auth/guest", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "お名前 (ニックネーム) を入力してください。" });
  }
  const trimmedName = name.trim();
  if (trimmedName.length > 16) {
    return res.status(400).json({ error: "ニックネームは16文字以内で入力してください。" });
  }
  if (isInappropriateName(trimmedName)) {
    return res.status(400).json({ error: "ニックネームに不適切な表現が含まれています。" });
  }

  const settings = getSystemSettings();
  if (settings.maintenanceMode) {
    return res.status(403).json({ error: "現在メンテナンス中のため、ゲストログインはおこなえません。" });
  }

  const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  // Append a elegant Guest indicator (☕) so world sees it's a guest but can compete!
  const guestName = `${trimmedName} ☕`;

  const token = `guest_token_${Buffer.from(guestId + "_" + Date.now()).toString("base64")}`;
  const session: SessionUser = {
    id: guestId,
    name: guestName,
    email: `${guestId}@guest.local`,
    isAdmin: false,
    createdAt: new Date().toISOString()
  };
  activeSessions.set(token, session);

  res.status(200).json({ token, user: session });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "ログインしていません。" });
  }
  const token = authHeader.split(" ")[1];
  const session = activeSessions.get(token);
  if (!session) {
    return res.status(418).json({ error: "セッションの有効期限が切れています。" });
  }

  // Double check if user has been banned in real-time
  const users = getUsersList();
  const matchedUser = users.find(u => u.id === session.id);
  if (matchedUser && matchedUser.isBanned) {
    activeSessions.delete(token);
    return res.status(403).json({ error: "このアカウントは凍結（垢BAN）されました。" });
  }

  res.status(200).json({ user: session });
});

// SYSTEM SETTINGS APIs (Public & Admin)
app.get("/api/system/settings", (req, res) => {
  res.json(getSystemSettings());
});

app.get("/api/admin/settings", authenticateUser, requireAdmin, (req, res) => {
  res.json(getSystemSettings());
});

app.post("/api/admin/settings", authenticateUser, requireAdmin, (req, res) => {
  const { maintenanceMode, customAnnouncement, minKpmForLeaderboard, maxKpmLimit } = req.body;
  const current = getSystemSettings();

  if (typeof maintenanceMode === "boolean") current.maintenanceMode = maintenanceMode;
  if (typeof customAnnouncement === "string") current.customAnnouncement = customAnnouncement;
  if (typeof minKpmForLeaderboard === "number") current.minKpmForLeaderboard = minKpmForLeaderboard;
  if (typeof maxKpmLimit === "number") current.maxKpmLimit = maxKpmLimit;

  saveSystemSettings(current);
  res.json({ success: true, settings: current });
});

// ADMIN API ROUTES
app.get("/api/admin/users", authenticateUser, requireAdmin, (req, res) => {
  const list = getUsersList().map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isAdmin: u.email === "ozakirikito8795@gmail.com",
    isBanned: !!u.isBanned,
    createdAt: u.createdAt
  }));
  res.json(list);
});

app.delete("/api/admin/users/:userId", authenticateUser, requireAdmin, (req, res) => {
  const userId = req.params.userId;
  if (userId === "admin_user") {
    return res.status(400).json({ error: "初期管理者は削除できません。" });
  }

  let users = getUsersList();
  const target = users.find(u => u.id === userId);
  if (target && target.email === "ozakirikito8795@gmail.com") {
    return res.status(400).json({ error: "管理者アカウントは削除できません。" });
  }

  users = users.filter(u => u.id !== userId);
  saveUsersList(users);

  // Clear session for deleted user
  for (const [token, session] of activeSessions.entries()) {
    if (session.id === userId) {
      activeSessions.delete(token);
    }
  }

  res.json({ success: true });
});

// BAN / UNBAN ENDPOINTS
app.post("/api/admin/users/:userId/ban", authenticateUser, requireAdmin, (req, res) => {
  const userId = req.params.userId;
  if (userId === "admin_user") {
    return res.status(400).json({ error: "初期管理者はBANできません。" });
  }

  const users = getUsersList();
  const target = users.find(u => u.id === userId);
  if (!target) {
    return res.status(404).json({ error: "ユーザーが見つかりません。" });
  }
  if (target.email === "ozakirikito8795@gmail.com") {
    return res.status(400).json({ error: "管理者アカウントはBANできません。" });
  }

  target.isBanned = true;
  saveUsersList(users);

  // Clear session for banned user immediately
  for (const [token, session] of activeSessions.entries()) {
    if (session.id === userId) {
      activeSessions.delete(token);
    }
  }

  res.json({ success: true });
});

app.post("/api/admin/users/:userId/unban", authenticateUser, requireAdmin, (req, res) => {
  const userId = req.params.userId;
  const users = getUsersList();
  const target = users.find(u => u.id === userId);
  if (!target) {
    return res.status(404).json({ error: "ユーザーが見つかりません。" });
  }

  target.isBanned = false;
  saveUsersList(users);
  res.json({ success: true });
});

app.delete("/api/admin/leaderboard/:entryId", authenticateUser, requireAdmin, (req, res) => {
  const entryId = req.params.entryId;
  let list = getLeaderboard();
  list = list.filter(item => item.id !== entryId);
  saveLeaderboard(list);
  res.json({ success: true });
});

// GET Leaderboard entries
app.get("/api/leaderboard", (req, res) => {
  const list = getLeaderboard()
    .sort((a, b) => b.kpm - a.kpm)
    .slice(0, 25);
  res.json(list);
});

// POST score submission
app.post("/api/leaderboard", (req, res) => {
  let submitterName = req.body.name || "Anonymous";
  const authHeader = req.headers.authorization;
  let isUserAdmin = false;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const session = activeSessions.get(token);
    if (session) {
      submitterName = session.name;
      isUserAdmin = session.isAdmin;
    }
  }

  const { kpm, accuracy, mode } = req.body;
  if (typeof kpm !== "number" || typeof accuracy !== "number") {
    return res.status(400).json({ error: "入力パラメータが不正です。" });
  }

  if (accuracy < 0 || accuracy > 100) {
    return res.status(400).json({ error: "正確度（Accuracy）の範囲が異常値です。0%〜100%の値を送信してください。" });
  }

  if (kpm < 0) {
    return res.status(400).json({ error: "KPM（打鍵速度）に負の値は登録できません。" });
  }

  if (isInappropriateName(submitterName)) {
    return res.status(400).json({ error: "不適切な単語が含まれているため、登録できません。" });
  }

  const settings = getSystemSettings();
  if (settings.maintenanceMode && !isUserAdmin) {
    return res.status(403).json({ error: "現在サーバーメンテナンス中のため、一般スコア登録は受け付けていません。" });
  }

  if (kpm < settings.minKpmForLeaderboard) {
    return res.status(400).json({ error: `スコア登録の最低速度基準（${settings.minKpmForLeaderboard} KPM以上）に達していません。` });
  }

  if (kpm > settings.maxKpmLimit) {
    return res.status(400).json({ error: `スコア登録の最高速度上限（${settings.maxKpmLimit} KPM以下）を超えています（不正値フィルタ）。` });
  }

  const list = getLeaderboard();
  const newEntry: LeaderboardEntry = {
    id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: submitterName.substring(0, 16),
    kpm,
    accuracy,
    mode: mode || "練習",
    timestamp: new Date().toISOString()
  };

  list.push(newEntry);
  saveLeaderboard(list);

  res.status(200).json({ success: true, item: newEntry });
});

// Predefined server sentences for multiplayer parity
const MULTIPLAYER_POOL = [
  { id: "m1", kanji: "吾輩は猫である。", kana: "わがはいはねこである。", romaji: "wagahaihanekodearu.", meaning: "夏目漱石『吾輩は猫である』" },
  { id: "m2", kanji: "メロスは激怒した。", kana: "めろすはげきどした。", romaji: "merosuhagekidoshita.", meaning: "太宰治『走れメロス』" },
  { id: "m3", kanji: "恥の多い生涯。", kana: "はじのおおいしょうがい。", romaji: "hajinoooishougai.", meaning: "太宰治『人間失格』" },
  { id: "m4", kanji: "雪国であった。", kana: "ゆきぐにであった。", romaji: "yukigunideatta.", meaning: "川端康成『雪国』" },
  { id: "m5", kanji: "雨ニモマケズ。", kana: "あめにもまけず。", romaji: "amenimomakezu.", meaning: "宮沢賢治" },
  { id: "m6", kanji: "一期一会", kana: "いちごいちえ", romaji: "ichigoichie", meaning: "一生に一度の出会い" },
  { id: "m7", kanji: "七転八起", kana: "しちてんはっき", romaji: "shichitenhakki", meaning: "何度倒れても立ち上がる" },
  { id: "m8", kanji: "温故知新", kana: "おんこちしん", romaji: "onkochishin", meaning: "過去から新しい智恵を学ぶ" }
];

// Select 4 random questions for a match
function getRandomSentences(): typeof MULTIPLAYER_POOL {
  const shuffled = [...MULTIPLAYER_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
}

// Inline Types for WebSocket match management
interface VSPlayer {
  id: string;
  name: string;
  ws: WebSocket;
  sentenceIndex: number;
  syllableIndex: number;
  typedInSyllable: string;
  correctKeys: number;
  missedKeys: number;
  kpm: number;
  accuracy: number;
  finished: boolean;
  rematchRequested?: boolean;
}

interface VSRoom {
  code: string;
  players: VSPlayer[];
  status: "waiting" | "countdown" | "playing" | "finished";
  sentences: typeof MULTIPLAYER_POOL;
  countdownTimer: number; // For game beginning (3s count)
  durationSecs: number; // 60s max
  matchInterval?: NodeJS.Timeout;
}

const activeRooms = new Map<string, VSRoom>();
const connectedSockets = new Map<string, { ws: WebSocket; name: string }>();

// Broadcast helper for specific room players
function broadcastToRoom(room: VSRoom, data: any) {
  const msg = JSON.stringify(data);
  room.players.forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(msg);
    }
  });
}

function sendLobbyState(ws: WebSocket) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "lobby_info",
      payload: {
        onlineCount: connectedSockets.size,
        activeRoomsCount: activeRooms.size
      }
    }));
  }
}

function broadcastLobbyUpdate() {
  const msg = JSON.stringify({
    type: "lobby_info",
    payload: {
      onlineCount: connectedSockets.size,
      activeRoomsCount: activeRooms.size
    }
  });
  connectedSockets.forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(msg);
    }
  });
}

// Main game loop manager for active rooms
function startRoomGameLoop(room: VSRoom) {
  room.status = "countdown";
  room.countdownTimer = 3;
  room.sentences = getRandomSentences();

  broadcastToRoom(room, {
    type: "match_countdown",
    payload: {
      timer: room.countdownTimer,
      sentences: room.sentences,
      players: room.players.map(p => ({ id: p.id, name: p.name }))
    }
  });

  const countdownInterval = setInterval(() => {
    room.countdownTimer--;
    if (room.countdownTimer <= 0) {
      clearInterval(countdownInterval);
      room.status = "playing";
      room.durationSecs = 60;

      broadcastToRoom(room, {
        type: "match_started",
        payload: {
          durationSecs: room.durationSecs
        }
      });

      // Regular game tick
      room.matchInterval = setInterval(() => {
        room.durationSecs--;
        if (room.durationSecs <= 0) {
          endRoomMatch(room);
        } else {
          broadcastToRoom(room, {
            type: "match_tick",
            payload: {
              timeLeft: room.durationSecs
            }
          });
        }
      }, 1000);
    } else {
      broadcastToRoom(room, {
        type: "match_countdown",
        payload: {
          timer: room.countdownTimer,
          sentences: room.sentences,
          players: room.players.map(p => ({ id: p.id, name: p.name }))
        }
      });
    }
  }, 1000);
}

function endRoomMatch(room: VSRoom) {
  if (room.matchInterval) {
    clearInterval(room.matchInterval);
    room.matchInterval = undefined;
  }
  room.status = "finished";

  // Determine winner
  let winnerId = "";
  let highestKpm = -1;

  // Let's filter players who finished first or have highest KPM
  const finishedPlayers = room.players.filter(p => p.finished);
  if (finishedPlayers.length === 1) {
    winnerId = finishedPlayers[0].id;
  } else if (finishedPlayers.length > 1) {
    // Both finished, compare speed
    winnerId = room.players[0].kpm > room.players[1].kpm ? room.players[0].id : room.players[1].id;
  } else {
    // Neither finished, highest KPM wins
    winnerId = room.players[0].kpm >= room.players[1].kpm ? room.players[0].id : room.players[1].id;
  }

  broadcastToRoom(room, {
    type: "match_finished",
    payload: {
      winnerId,
      results: room.players.map(p => ({
        id: p.id,
        name: p.name,
        kpm: p.kpm,
        accuracy: p.accuracy,
        finished: p.finished
      }))
    }
  });
}

function cleanUpPlayerRoom(playerId: string) {
  for (const [code, room] of activeRooms.entries()) {
    const pIdx = room.players.findIndex(p => p.id === playerId);
    if (pIdx !== -1) {
      room.players.splice(pIdx, 1);
      
      if (room.matchInterval) {
        clearInterval(room.matchInterval);
        room.matchInterval = undefined;
      }

      if (room.players.length === 0) {
        activeRooms.delete(code);
      } else {
        room.status = "finished";
        broadcastToRoom(room, {
          type: "opponent_disconnected",
          payload: {
            msg: "対戦相手が切断しました。あなたの勝利です！"
          }
        });
      }
      broadcastLobbyUpdate();
      break;
    }
  }
}

// Create vite middleware or fallback to dist static serves
const isProductionRun = process.env.NODE_ENV === "production" || 
                        (typeof __filename !== "undefined" && (__filename.endsWith("server.cjs") || __filename.includes("dist")));

async function initializeServer() {
  if (isProductionRun) {
    console.log("Serving static production assets from public / dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    try {
      console.log("Setting up Vite development server middleware...");
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("Failed to load Vite development middleware, falling back to static:", err);
      console.log("Serving static production assets from public / dist...");
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} [Production: ${isProductionRun}]`);
  });

  // Attach WebSocket server on same Port
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    const socketId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    connectedSockets.set(socketId, { ws, name: "GUEST" });
    
    // Send initial lobby info
    sendLobbyState(ws);
    broadcastLobbyUpdate();

    ws.on("message", (message) => {
      try {
        const raw = message.toString();
        const data = JSON.parse(raw);
        const { type, payload } = data;

        switch (type) {
          case "join_lobby": {
            const name = (payload?.name || "匿名").substring(0, 16);
            connectedSockets.set(socketId, { ws, name });
            broadcastLobbyUpdate();
            break;
          }

          case "quick_match": {
            const socketInfo = connectedSockets.get(socketId);
            const pName = socketInfo ? socketInfo.name : "ゲスト";

            // Search for an existing waiting room
            let targetRoom: VSRoom | null = null;
            for (const room of activeRooms.values()) {
              if (room.status === "waiting" && room.players.length === 1) {
                targetRoom = room;
                break;
              }
            }

            if (targetRoom) {
              // Join the waiting room
              const p: VSPlayer = {
                id: socketId,
                name: pName,
                ws,
                sentenceIndex: 0,
                syllableIndex: 0,
                typedInSyllable: "",
                correctKeys: 0,
                missedKeys: 0,
                kpm: 0,
                accuracy: 100,
                finished: false
              };
              targetRoom.players.push(p);
              
              broadcastToRoom(targetRoom, {
                type: "room_updated",
                payload: {
                  code: targetRoom.code,
                  players: targetRoom.players.map(pl => ({ id: pl.id, name: pl.name, finished: pl.finished }))
                }
              });

              // Start the duel countdown!
              startRoomGameLoop(targetRoom);
            } else {
              // Create a brand new waiting room
              const code = Math.random().toString(36).substring(2, 6).toUpperCase();
              const newRoom: VSRoom = {
                code,
                players: [{
                  id: socketId,
                  name: pName,
                  ws,
                  sentenceIndex: 0,
                  syllableIndex: 0,
                  typedInSyllable: "",
                  correctKeys: 0,
                  missedKeys: 0,
                  kpm: 0,
                  accuracy: 100,
                  finished: false
                }],
                status: "waiting",
                sentences: [],
                countdownTimer: 0,
                durationSecs: 60
              };
              activeRooms.set(code, newRoom);

              ws.send(JSON.stringify({
                type: "room_updated",
                payload: {
                  code,
                  players: newRoom.players.map(pl => ({ id: pl.id, name: pl.name, finished: pl.finished }))
                }
              }));
            }
            broadcastLobbyUpdate();
            break;
          }

          case "create_room": {
            const socketInfo = connectedSockets.get(socketId);
            const pName = socketInfo ? socketInfo.name : "ゲスト";
            const code = Math.random().toString(36).substring(2, 6).toUpperCase();

            const newRoom: VSRoom = {
              code,
              players: [{
                id: socketId,
                name: pName,
                ws,
                sentenceIndex: 0,
                syllableIndex: 0,
                typedInSyllable: "",
                correctKeys: 0,
                missedKeys: 0,
                kpm: 0,
                accuracy: 100,
                finished: false
              }],
              status: "waiting",
              sentences: [],
              countdownTimer: 0,
              durationSecs: 60
            };
            activeRooms.set(code, newRoom);

            ws.send(JSON.stringify({
              type: "room_updated",
              payload: {
                code,
                players: newRoom.players.map(pl => ({ id: pl.id, name: pl.name, finished: pl.finished }))
              }
            }));
            broadcastLobbyUpdate();
            break;
          }

          case "join_room": {
            const code = (payload?.code || "").toUpperCase();
            const targetRoom = activeRooms.get(code);

            if (!targetRoom) {
              ws.send(JSON.stringify({ type: "room_error", payload: { msg: "部屋が見つかりませんでした。" } }));
              return;
            }

            if (targetRoom.players.length >= 2) {
              ws.send(JSON.stringify({ type: "room_error", payload: { msg: "部屋は既に満員です。" } }));
              return;
            }

            if (targetRoom.status !== "waiting") {
              ws.send(JSON.stringify({ type: "room_error", payload: { msg: "ゲームは既に開始されています。" } }));
              return;
            }

            const socketInfo = connectedSockets.get(socketId);
            const pName = socketInfo ? socketInfo.name : "ゲスト";

            const p: VSPlayer = {
              id: socketId,
              name: pName,
              ws,
              sentenceIndex: 0,
              syllableIndex: 0,
              typedInSyllable: "",
              correctKeys: 0,
              missedKeys: 0,
              kpm: 0,
              accuracy: 100,
              finished: false
            };
            targetRoom.players.push(p);

            broadcastToRoom(targetRoom, {
              type: "room_updated",
              payload: {
                code: targetRoom.code,
                players: targetRoom.players.map(pl => ({ id: pl.id, name: pl.name, finished: pl.finished }))
              }
            });

            // Start the room countdown
            startRoomGameLoop(targetRoom);
            break;
          }

          case "progress": {
            // Find active room containing player
            let foundRoom: VSRoom | null = null;
            let playerRef: VSPlayer | null = null;

            for (const room of activeRooms.values()) {
              const p = room.players.find(pl => pl.id === socketId);
              if (p) {
                foundRoom = room;
                playerRef = p;
                break;
              }
            }

            if (foundRoom && playerRef && foundRoom.status === "playing") {
              playerRef.sentenceIndex = payload?.sentenceIndex || 0;
              playerRef.syllableIndex = payload?.syllableIndex || 0;
              playerRef.typedInSyllable = payload?.typedInSyllable || "";
              playerRef.correctKeys = payload?.correctKeys || 0;
              playerRef.missedKeys = payload?.missedKeys || 0;
              playerRef.kpm = payload?.kpm || 0;
              playerRef.accuracy = payload?.accuracy || 100;

              // Forward progress parameters to opponent
              const opponent = foundRoom.players.find(pl => pl.id !== socketId);
              if (opponent && opponent.ws.readyState === WebSocket.OPEN) {
                opponent.ws.send(JSON.stringify({
                  type: "opponent_progress",
                  payload: {
                    sentenceIndex: playerRef.sentenceIndex,
                    syllableIndex: playerRef.syllableIndex,
                    typedInSyllable: playerRef.typedInSyllable,
                    kpm: playerRef.kpm,
                    accuracy: playerRef.accuracy
                  }
                }));
              }
            }
            break;
          }

          case "finished": {
            let foundRoom: VSRoom | null = null;
            let playerRef: VSPlayer | null = null;

            for (const room of activeRooms.values()) {
              const p = room.players.find(pl => pl.id === socketId);
              if (p) {
                foundRoom = room;
                playerRef = p;
                break;
              }
            }

            if (foundRoom && playerRef && foundRoom.status === "playing") {
              playerRef.finished = true;
              playerRef.kpm = payload?.kpm || 0;
              playerRef.accuracy = payload?.accuracy || 100;

              // Check if everyone is finished or all sentences loaded are typed
              const allDone = foundRoom.players.every(pl => pl.finished);
              if (allDone) {
                endRoomMatch(foundRoom);
              } else {
                // Inform opponent that this player has completed
                const opponent = foundRoom.players.find(pl => pl.id !== socketId);
                if (opponent && opponent.ws.readyState === WebSocket.OPEN) {
                  opponent.ws.send(JSON.stringify({
                    type: "opponent_finished",
                    payload: {
                      name: playerRef.name,
                      kpm: playerRef.kpm,
                      accuracy: playerRef.accuracy
                    }
                  }));
                }
              }
            }
            break;
          }

          case "rematch_request": {
            let foundRoom: VSRoom | null = null;
            let playerRef: VSPlayer | null = null;

            for (const room of activeRooms.values()) {
              const p = room.players.find(pl => pl.id === socketId);
              if (p) {
                foundRoom = room;
                playerRef = p;
                break;
              }
            }

            if (foundRoom && playerRef && foundRoom.status === "finished") {
              playerRef.rematchRequested = true;

              const allWantRematch = foundRoom.players.every(pl => pl.rematchRequested);

              if (allWantRematch && foundRoom.players.length === 2) {
                // Clear state and restart!
                foundRoom.players.forEach(pl => {
                  pl.sentenceIndex = 0;
                  pl.syllableIndex = 0;
                  pl.typedInSyllable = "";
                  pl.correctKeys = 0;
                  pl.missedKeys = 0;
                  pl.kpm = 0;
                  pl.accuracy = 100;
                  pl.finished = false;
                  pl.rematchRequested = false;
                });
                startRoomGameLoop(foundRoom);
              } else {
                // Signal opponent they want rematch
                const opponent = foundRoom.players.find(pl => pl.id !== socketId);
                if (opponent && opponent.ws.readyState === WebSocket.OPEN) {
                  opponent.ws.send(JSON.stringify({
                    type: "rematch_requested",
                    payload: {}
                  }));
                }
              }
            }
            break;
          }

          case "leave": {
            cleanUpPlayerRoom(socketId);
            break;
          }
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    });

    ws.on("close", () => {
      cleanUpPlayerRoom(socketId);
      connectedSockets.delete(socketId);
      broadcastLobbyUpdate();
    });
  });
}

initializeServer().catch((err) => {
  console.error("Critical error during server initialization:", err);
});
