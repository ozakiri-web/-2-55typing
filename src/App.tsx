import React, { useState, useEffect, useCallback, useRef } from "react";
import { TypingSentence, TypingCategory, GameSettings, ScoreRecord, SessionConfigGoal, SessionGoalProgress } from "./types";
import { PRACTICE_SENTENCES } from "./data/sentences";
import { tokenizeKana } from "./utils/romaji";
import { StatsCard } from "./components/StatsCard";
import { GoalSettings } from "./components/GoalSettings";
import { GoalNotificationToast, ToastItem } from "./components/GoalNotificationToast";
import { KpmHistoryChart } from "./components/KpmHistoryChart";
import { LegalModal } from "./components/LegalModals";
import { 
  evaluateBadges, 
  BADGES_LIST, 
  BadgeMiniDisplay, 
  BadgeCatalogList, 
  BadgeUnlockModal, 
  BadgeDef 
} from "./components/BadgeSystem";
import { TypingArena } from "./components/TypingArena";
import { TypingAnalyzer } from "./components/TypingAnalyzer";
import { OnlineRanking } from "./components/OnlineRanking";
import { isInappropriateName } from "./utils/validation";
import { LoginScreen } from "./components/LoginScreen";
import { AdminPanel } from "./components/AdminPanel";
import { 
  Keyboard, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  BookOpen, 
  Play, 
  CheckCircle, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  HelpCircle,
  Trophy,
  Sliders,
  Sparkles,
  AlertTriangle,
  X
} from "lucide-react";

// Hook adapting the user's requested Adobe Typekit loading logic to the React lifecycle
function useTypekit(kitId: string, enabled: boolean) {
  const [status, setStatus] = useState<"loading" | "active" | "inactive">("inactive");

  useEffect(() => {
    if (!enabled || !kitId) {
      setStatus("inactive");
      return;
    }

    setStatus("loading");
    const d = document;
    const h = d.documentElement;

    h.className = h.className.replace(/\bwf-active|wf-loading|wf-inactive\b/g, "") + " wf-loading";

    const timeout = setTimeout(() => {
      h.className = h.className.replace(/\bwf-loading\b/g, "") + " wf-inactive";
      setStatus("inactive");
    }, 3000);

    const tk = d.createElement("script");
    tk.src = `https://use.typekit.net/${kitId}.js`;
    tk.async = true;

    let executed = false;
    (tk as any).onload = (tk as any).onreadystatechange = function(this: any) {
      const state = this.readyState;
      if (executed || (state && state !== "complete" && state !== "loaded")) return;
      executed = true;
      clearTimeout(timeout);

      try {
        if ((window as any).Typekit) {
          (window as any).Typekit.load({
            kitId: kitId,
            scriptTimeout: 3000,
            async: true,
            active: () => {
              h.className = h.className.replace(/\bwf-loading\b/g, "") + " wf-active";
              setStatus("active");
            },
            inactive: () => {
              h.className = h.className.replace(/\bwf-loading\b/g, "") + " wf-inactive";
              setStatus("inactive");
            }
          });
        } else {
          throw new Error();
        }
      } catch (err) {
        h.className = h.className.replace(/\bwf-loading\b/g, "") + " wf-inactive";
        setStatus("inactive");
      }
    };

    const s = d.getElementsByTagName("script")[0];
    if (s && s.parentNode) {
      s.parentNode.insertBefore(tk, s);
    } else {
      d.head.appendChild(tk);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [kitId, enabled]);

  return status;
}

export default function App() {
  const kitId = "tjb7zhq";
  const typekitState = useTypekit(kitId, true);

  // Core Modes State: "practice" (練習モード), "special" (特訓モード), or "online" (オンライン対戦)
  const [currentMode, setCurrentMode] = useState<"practice" | "special" | "online">("practice");
  const [specialSentences, setSpecialSentences] = useState<TypingSentence[]>([]);
  const [specialTitle, setSpecialTitle] = useState("特訓モード [標準コース]");
  const [practicePhrases, setPracticePhrases] = useState<TypingSentence[]>(PRACTICE_SENTENCES);

  // States of the finished game for online leaderboard submission
  const [lastFinishedKpm, setLastFinishedKpm] = useState<number>(0);
  const [lastFinishedAccuracy, setLastFinishedAccuracy] = useState<number>(0);
  const [lastFinishedModeName, setLastFinishedModeName] = useState<string>("");

  const [nickname, setNickname] = useState(() => localStorage.getItem("glyph_type_nickname") || "");
  const [user, setUser] = useState<{ id: string; name: string; email: string; isAdmin: boolean } | null>(null);

  // Goal settings & session target states
  const [goals, setGoals] = useState<SessionConfigGoal>(() => {
    try {
      const saved = localStorage.getItem("glyph_type_session_goals");
      return saved ? JSON.parse(saved) : {
        kpmEnabled: false,
        kpmValue: 200,
        accuracyEnabled: false,
        accuracyValue: 95,
        streakEnabled: false,
        streakValue: 30
      };
    } catch {
      return {
        kpmEnabled: false,
        kpmValue: 200,
        accuracyEnabled: false,
        accuracyValue: 95,
        streakEnabled: false,
        streakValue: 30
      };
    }
  });

  const [goalProgress, setGoalProgress] = useState<SessionGoalProgress>({
    kpmAchieved: false,
    accuracyAchieved: false,
    streakAchieved: false
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [token, setToken] = useState<string>("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<"terms" | "privacy" | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Achievement badges states
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("glyph_type_unlocked_badges");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newlyUnlocked, setNewlyUnlocked] = useState<BadgeDef[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // System settings state loaded from public metadata
  const [systemAnnouncement, setSystemAnnouncement] = useState("");
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch("/api/system/settings");
      if (res.ok) {
        const data = await res.json();
        setSystemAnnouncement(data.customAnnouncement || "");
        setMaintenanceEnabled(!!data.maintenanceMode);
      }
    } catch (err) {
      console.error("Failed to load system settings", err);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, [user]);

  useEffect(() => {
    const savedToken = localStorage.getItem("glyph_type_token");
    if (!savedToken) {
      setCheckingSession(false);
      return;
    }

    const verifySession = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${savedToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(savedToken);
          if (data.user?.name) {
            setNickname(data.user.name);
            localStorage.setItem("glyph_type_nickname", data.user.name);
          }
        } else {
          localStorage.removeItem("glyph_type_token");
        }
      } catch (err) {
        console.error("Error verifying session:", err);
      } finally {
        setCheckingSession(false);
      }
    };

    verifySession();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("glyph_type_token");
    setUser(null);
    setToken("");
    setShowAdminPanel(false);
  };

  const [innerSubmitting, setInnerSubmitting] = useState(false);
  const [innerSubmitted, setInnerSubmitted] = useState(false);
  const [innerError, setInnerError] = useState("");

  const handleHomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || lastFinishedKpm <= 0) return;

    if (isInappropriateName(nickname)) {
      setInnerError("不適切な単語が含まれています。変更してください。");
      return;
    }

    setInnerSubmitting(true);
    setInnerError("");
    try {
      const trimmedName = nickname.trim().substring(0, 16);
      localStorage.setItem("glyph_type_nickname", trimmedName);
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: trimmedName,
          kpm: lastFinishedKpm,
          accuracy: lastFinishedAccuracy,
          mode: lastFinishedModeName || "練習"
        })
      });
      if (response.ok) {
        setInnerSubmitted(true);
      } else {
        const errData = await response.json();
        setInnerError(errData.error || "登録に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      setInnerError("通信中にエラーが発生しました。");
    } finally {
      setInnerSubmitting(false);
    }
  };

  // Construct category representations for integration
  const practiceCategory: TypingCategory = {
    id: "practice",
    name: "練習モード",
    emoji: "🌱",
    description: "誰でも気軽に遊べる基本の練習問題です。",
    sentences: practicePhrases
  };

  const specialCategory: TypingCategory = {
    id: "special",
    name: specialTitle,
    emoji: "🛡️",
    description: "苦手キーを自動抽出し、狙い撃ちで訓練する特訓。練習モードを繰り返すと分析データが成熟します。",
    sentences: specialSentences.length > 0 ? specialSentences : [
      { id: "s1", kanji: "基礎的なタッチタイピングの練習。", kana: "きそてきなタッチタイピングのれんしゅう。", romaji: "kisotekinataichitaipingunorenshuu.", meaning: "ホームポジション確認" },
      { id: "s2", kanji: "正しい指使いで正確性を高めよう。", kana: "ただしいゆびづかいでせいかくせいをたかめよう。", romaji: "tadashiiyubizukaideseikakuseiwotakameyou.", meaning: "正確性第一" },
      { id: "s3", kanji: "スピードよりも連続して打つこと。", kana: "スピードよりもれんぞくしてうつこと。", romaji: "supiidoyorimorenzokushiteutsukoto.", meaning: "打鍵リズム維持" }
    ]
  };

  const activeCategory = currentMode === "online"
    ? { id: "online", name: "オンラインランキング", emoji: "🏆", description: "全国のプレイヤーのスコア順位表", sentences: [] as TypingSentence[] }
    : (currentMode === "practice" ? practiceCategory : specialCategory);

  // Typing Active session state
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [syllableIndex, setSyllableIndex] = useState(0);
  const [typedInSyllable, setTypedInSyllable] = useState("");
  const [chosenRomajiList, setChosenRomajiList] = useState<string[]>([]);
  
  const activeSentence = activeCategory.sentences[sentenceIndex];

  // Tokenize current kana guiding syllables list
  const syllables = React.useMemo(() => {
    return tokenizeKana(activeSentence?.kana || activeSentence?.romaji || "");
  }, [activeSentence]);
  const [correctKeys, setCorrectKeys] = useState(0);
  const [missedKeys, setMissedKeys] = useState(0);
  const [streak, setStreak] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [shake, setShake] = useState(false);

  // 1-minute type test active state
  const [gameStatus, setGameStatus] = useState<"idle" | "playing" | "completed">("idle");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const isCompleted = gameStatus === "completed";

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    showHiraganaGuide: true,
    soundEnabled: true,
    currentCategoryId: "practice",
    fontSizeMultiplier: 1.2
  });

  // Audio synthesize system (Correct Mechanical vs. Miss Dull Thud clicks)
  const playSynthesizedSound = useCallback((isCorrect: boolean) => {
    if (!settings.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      if (isCorrect) {
        // High-Tech Crisp click - sine wave with tiny pitch slide and fast decay
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else {
        // Low Pitch Thud (type: triangle / sawtooth mix)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sawtooth";
        // Dark frequency thud
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.setValueAtTime(60, now + 0.12);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      }
    } catch (err) {
      console.warn("Synth audio feedback blocked/error:", err);
    }
  }, [settings.soundEnabled]);

  // Chime sound played on target milestone achievement
  const playGoalAchievedSound = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      const playTone = (frequency: number, startTime: number, duration: number, type: OscillatorType = "sine") => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Play an sparkling electronic chime (C6 -> E6 -> G6 -> C7)
      playTone(1046.50, now, 0.25);
      playTone(1318.51, now + 0.06, 0.25);
      playTone(1567.98, now + 0.12, 0.25);
      playTone(2093.00, now + 0.18, 0.45, "triangle");
    } catch (err) {
      console.warn("Chime play blocked/error:", err);
    }
  }, [settings.soundEnabled]);

  // Arpeggio sound played on full category progress completion
  const playVictoryArpeggio = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      const playTone = (frequency: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(frequency, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Cyberpunk major 7th rise arpeggio: C5 -> E5 -> G5 -> B5 -> C6
      playTone(523.25, now, 0.35);
      playTone(659.25, now + 0.09, 0.35);
      playTone(783.99, now + 0.18, 0.35);
      playTone(987.77, now + 0.27, 0.35);
      playTone(1046.50, now + 0.36, 0.55);
    } catch (err) {
      console.warn(err);
    }
  }, [settings.soundEnabled]);

  // History and High Scores persistent stats loads
  const [history, setHistory] = useState<ScoreRecord[]>([]);
  const [bestKpm, setBestKpm] = useState<number>(0);

  // Detailed alphabet error tracking and keystroke statistics state
  const [keyStats, setKeyStats] = useState<Record<string, { typed: number; missed: number }>>({});

  // Use a React ref to capture dynamic variables for the countdown interval safely without re-triggering timers
  const stateRef = useRef({ correctKeys, missedKeys, startTime, activeCategoryName: activeCategory.name });
  useEffect(() => {
    stateRef.current = { correctKeys, missedKeys, startTime, activeCategoryName: activeCategory.name };
  }, [correctKeys, missedKeys, startTime, activeCategory.name]);

  const concludeGame = useCallback(() => {
    setGameStatus("completed");
    playVictoryArpeggio();

    const { correctKeys: finalCorrect, missedKeys: finalMissed, startTime: start, activeCategoryName } = stateRef.current;
    
    // Calculate final stats based on actual typing duration up to 60 seconds
    const elapsedSecs = start ? (Date.now() - start) / 1000 : 60;
    const safeTimeMinutes = elapsedSecs > 0 ? elapsedSecs / 60 : 1.0;
    const finalKpm = Math.max(0, Math.round(finalCorrect / safeTimeMinutes));
    const finalAccuracy = (finalCorrect + finalMissed) > 0
      ? Math.round((finalCorrect / (finalCorrect + finalMissed)) * 100)
      : 100;

    const record: ScoreRecord = {
      id: `trial_${Date.now()}`,
      categoryName: `${activeCategoryName} (60秒測定)`,
      kpm: finalKpm,
      accuracy: finalAccuracy,
      correctKeys: finalCorrect,
      missedKeys: finalMissed,
      timestamp: new Date().toISOString()
    };

    setHistory(prev => {
      const next = [record, ...prev];
      localStorage.setItem("glyph_type_history", JSON.stringify(next));

      // Calculate badges and update
      const computedBadges = evaluateBadges(next);
      let savedBadges: string[] = [];
      try {
        const saved = localStorage.getItem("glyph_type_unlocked_badges");
        savedBadges = saved ? JSON.parse(saved) : [];
      } catch {
        savedBadges = [];
      }

      const newBadgeIds = computedBadges.filter(id => !savedBadges.includes(id));
      if (newBadgeIds.length > 0) {
        const unlockedObjects = BADGES_LIST.filter(b => newBadgeIds.includes(b.id));
        setNewlyUnlocked(unlockedObjects);
        setShowUnlockModal(true);
        setUnlockedBadges(computedBadges);
        localStorage.setItem("glyph_type_unlocked_badges", JSON.stringify(computedBadges));
      }

      return next;
    });

    setBestKpm(prev => {
      const updatedBest = finalKpm > prev ? finalKpm : prev;
      return updatedBest;
    });

    setLastFinishedKpm(finalKpm);
    setLastFinishedAccuracy(finalAccuracy);
    setLastFinishedModeName(activeCategoryName);

    // Final check for achievements at the end of the 60 seconds session
    setGoalProgress(prev => {
      const finalUpdates: Partial<SessionGoalProgress> = {};
      const newToasts: ToastItem[] = [];

      if (goals.kpmEnabled && !prev.kpmAchieved && finalKpm >= goals.kpmValue) {
        finalUpdates.kpmAchieved = true;
        newToasts.push({
          id: `kpm_final_${Date.now()}`,
          type: "kpm",
          title: `目標タイピング速度 ${goals.kpmValue} KPMをクリア！（最終結果）`,
          value: finalKpm
        });
      }
      if (goals.accuracyEnabled && !prev.accuracyAchieved && finalAccuracy >= goals.accuracyValue && finalCorrect >= 10) {
        finalUpdates.accuracyAchieved = true;
        newToasts.push({
          id: `accuracy_final_${Date.now()}`,
          type: "accuracy",
          title: `目標正確性 ${goals.accuracyValue}%を維持・達成！（最終結果）`,
          value: finalAccuracy
        });
      }
      if (goals.streakEnabled && !prev.streakAchieved && streak >= goals.streakValue) {
        finalUpdates.streakAchieved = true;
        newToasts.push({
          id: `streak_final_${Date.now()}`,
          type: "streak",
          title: `目標コンボ ${goals.streakValue} comboを達成！（最終結果）`,
          value: streak
        });
      }

      if (Object.keys(finalUpdates).length > 0) {
        if (newToasts.length > 0) {
          setToasts(toastsPrev => [...toastsPrev, ...newToasts]);
          playGoalAchievedSound();
        }
        return { ...prev, ...finalUpdates };
      }
      return prev;
    });
  }, [playVictoryArpeggio, goals, streak, playGoalAchievedSound]);

  const concludeGameRef = useRef(concludeGame);
  useEffect(() => {
    concludeGameRef.current = concludeGame;
  }, [concludeGame]);

  // Handle countdown interval during active play
  useEffect(() => {
    if (gameStatus !== "playing") return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          concludeGameRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus]);

  const handleStartGame = useCallback(() => {
    setSentenceIndex(0);
    setSyllableIndex(0);
    setTypedInSyllable("");
    setChosenRomajiList([]);
    setCorrectKeys(0);
    setMissedKeys(0);
    setStreak(0);
    setStartTime(Date.now());
    setTimeLeft(60);
    setGameStatus("playing");
    setShake(false);
    setGoalProgress({
      kpmAchieved: false,
      accuracyAchieved: false,
      streakAchieved: false
    });
  }, []);

  const handleStopGame = useCallback(() => {
    concludeGame();
  }, [concludeGame]);

  // Load stats history on Mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("glyph_type_history");
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
        // Find maximum KPM
        const max = parsed.reduce((acc: number, record: ScoreRecord) => Math.max(acc, record.kpm), 0);
        setBestKpm(max);

        // Compute and trigger any initial badges if not loaded
        const computed = evaluateBadges(parsed);
        if (computed.length > 0) {
          setUnlockedBadges(computed);
          localStorage.setItem("glyph_type_unlocked_badges", JSON.stringify(computed));
        }
      }
      
      const savedKeyStats = localStorage.getItem("glyph_type_key_stats");
      if (savedKeyStats) {
        setKeyStats(JSON.parse(savedKeyStats));
      }
    } catch (e) {
      console.error("Could not parse typing history log:", e);
    }
  }, []);

  // Soft-reset keystroke deviation track statistics
  const handleResetStats = useCallback(() => {
    localStorage.removeItem("glyph_type_key_stats");
    setKeyStats({});
  }, []);

  // Setup dynamically generated target-practice categories
  const handleGenerateWeaknessCourse = useCallback((weaknessCat: TypingCategory) => {
    setSpecialSentences(weaknessCat.sentences);
    setSpecialTitle(weaknessCat.name);
    setCurrentMode("special");
    setSentenceIndex(0);
    setSyllableIndex(0);
    setTypedInSyllable("");
    setChosenRomajiList([]);
    setCorrectKeys(0);
    setMissedKeys(0);
    setStreak(0);
    setStartTime(null);
    setGameStatus("idle");
    setTimeLeft(60);
    setShake(false);
  }, []);

  // Reset current typing session state
  const resetSession = useCallback(() => {
    setSentenceIndex(0);
    setSyllableIndex(0);
    setTypedInSyllable("");
    setChosenRomajiList([]);
    setCorrectKeys(0);
    setMissedKeys(0);
    setStreak(0);
    setStartTime(null);
    setGameStatus("idle");
    setTimeLeft(60);
    setShake(false);

    setLastFinishedKpm(0);
    setLastFinishedAccuracy(0);
    setLastFinishedModeName("");
    setInnerSubmitted(false);
    setInnerError("");

    setGoalProgress({
      kpmAchieved: false,
      accuracyAchieved: false,
      streakAchieved: false
    });
  }, []);

  // Update active category session when current mode shifts
  useEffect(() => {
    resetSession();
  }, [currentMode, resetSession]);

  // Monitor real-time progress against session goals
  useEffect(() => {
    if (gameStatus !== "playing" || !startTime) return;

    // Calculate current live metrics
    const durationMinutes = (Date.now() - startTime) / 60000;
    const liveKpm = durationMinutes > 0 ? Math.round(correctKeys / durationMinutes) : 0;
    const totalKeys = correctKeys + missedKeys;
    const liveAccuracy = totalKeys > 0 ? Math.round((correctKeys / totalKeys) * 100) : 100;

    const newProg: Partial<SessionGoalProgress> = {};
    const triggeredToasts: ToastItem[] = [];

    // 1. KPM Trigger check (minimum 10 correct keys to avoid artificial spikes on first keypress)
    if (goals.kpmEnabled && !goalProgress.kpmAchieved && correctKeys >= 10 && liveKpm >= goals.kpmValue) {
      newProg.kpmAchieved = true;
      triggeredToasts.push({
        id: `kpm_${Date.now()}`,
        type: "kpm",
        title: `目標タイピング速度 ${goals.kpmValue} KPMをクリア！`,
        value: liveKpm
      });
    }

    // 2. Combo / Streak Trigger check
    if (goals.streakEnabled && !goalProgress.streakAchieved && streak >= goals.streakValue) {
      newProg.streakAchieved = true;
      triggeredToasts.push({
        id: `streak_${Date.now()}`,
        type: "streak",
        title: `目標コンボ ${goals.streakValue} comboに到達！`,
        value: streak
      });
    }

    // 3. Accuracy Trigger check (minimum 25 correct keys to make it a challenge after a sustained sequence)
    if (goals.accuracyEnabled && !goalProgress.accuracyAchieved && correctKeys >= 25 && liveAccuracy >= goals.accuracyValue) {
      newProg.accuracyAchieved = true;
      triggeredToasts.push({
        id: `accuracy_${Date.now()}`,
        type: "accuracy",
        title: `目標正確性 ${goals.accuracyValue}%を突破・維持！`,
        value: liveAccuracy
      });
    }

    // If there is any newly achieved target, update state and trigger sound/toast
    if (Object.keys(newProg).length > 0) {
      setGoalProgress(prev => ({ ...prev, ...newProg }));
      playGoalAchievedSound();

      if (triggeredToasts.length > 0) {
        setToasts(prev => [...prev, ...triggeredToasts]);
      }
    }
  }, [correctKeys, missedKeys, streak, gameStatus, startTime, goals, goalProgress, playGoalAchievedSound]);

  // Auto-dismiss goal notification toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts]);





  // Handle keys pressed by user, ignoring meta keystrokes
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (currentMode === "online" || gameStatus !== "playing" || syllables.length === 0) return;

    // Filter layout commands, key combinations, and system keys
    if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return;

    // Start timer at the very first keystroke if not already set
    if (startTime === null) {
      setStartTime(Date.now());
    }

    const typedChar = e.key.toLowerCase();

    if (syllableIndex >= syllables.length) return;

    const currentSyllable = syllables[syllableIndex];
    if (!currentSyllable) return;

    const expectedStr = typedInSyllable + typedChar;

    // Check if there is any option starting with expectedStr
    const hasMatchingOption = currentSyllable.options.some(opt => opt.startsWith(expectedStr));

    if (hasMatchingOption) {
      // Record correct keystroke for tracking
      if (/^[a-z]$/.test(typedChar)) {
        setKeyStats(prev => {
          const current = prev[typedChar] || { typed: 0, missed: 0 };
          const updated = {
            ...prev,
            [typedChar]: { typed: current.typed + 1, missed: current.missed }
          };
          localStorage.setItem("glyph_type_key_stats", JSON.stringify(updated));
          return updated;
        });
      }

      // Play correct sound, increase metrics
      playSynthesizedSound(true);
      setCorrectKeys(prev => prev + 1);
      setStreak(prev => prev + 1);

      // Check if this newly typed substring completely completes any option of the syllable
      const exactMatch = currentSyllable.options.find(opt => opt === expectedStr);

      if (exactMatch) {
        // This syllable is completed!
        const nextSyllableIndex = syllableIndex + 1;
        const nextChosen = [...chosenRomajiList, exactMatch];
        setChosenRomajiList(nextChosen);
        setSyllableIndex(nextSyllableIndex);
        setTypedInSyllable("");

        // Check if the overall sentence is completed
        if (nextSyllableIndex === syllables.length) {
          // Sentence fully finished! Proceed or wrap around
          const nextSentenceIndex = sentenceIndex + 1;
          if (nextSentenceIndex < activeCategory.sentences.length) {
            setSentenceIndex(nextSentenceIndex);
            setSyllableIndex(0);
            setTypedInSyllable("");
            setChosenRomajiList([]);
          } else {
            setSentenceIndex(0);
            setSyllableIndex(0);
            setTypedInSyllable("");
            setChosenRomajiList([]);
          }
        }
      } else {
        // Partial match in progress
        setTypedInSyllable(expectedStr);
      }
    } else {
      // Inaccurate stroke
      const currentActiveOptions = currentSyllable.options.filter(opt => opt.startsWith(typedInSyllable));
      const activeOpt = currentActiveOptions[0] || currentSyllable.options[0];
      const expectedChar = activeOpt ? activeOpt[typedInSyllable.length] : "";

      if (expectedChar && /^[a-z]$/.test(expectedChar)) {
        setKeyStats(prev => {
          const current = prev[expectedChar] || { typed: 0, missed: 0 };
          const updated = {
            ...prev,
            [expectedChar]: { typed: current.typed, missed: current.missed + 1 }
          };
          localStorage.setItem("glyph_type_key_stats", JSON.stringify(updated));
          return updated;
        });
      }

      playSynthesizedSound(false);
      setMissedKeys(prev => prev + 1);
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 240);
    }
  }, [
    gameStatus,
    syllables,
    syllableIndex,
    typedInSyllable,
    chosenRomajiList,
    sentenceIndex,
    activeCategory.sentences.length,
    startTime,
    playSynthesizedSound
  ]);

  // Calculate dynamic active state (Accuracy, KPM)
  const timeElapsedMinutes = startTime ? (Date.now() - startTime) / 60000 : 0;
  const currentKpm = timeElapsedMinutes > 0 ? Math.round(correctKeys / timeElapsedMinutes) : 0;
  const currentAccuracy = (correctKeys + missedKeys) > 0 
    ? Math.round((correctKeys / (correctKeys + missedKeys)) * 100) 
    : 100;

  const handleClearHistory = () => {
    if (window.confirm("これまでのスコア履歴データをすべて消去しますか？")) {
      localStorage.removeItem("glyph_type_history");
      setHistory([]);
      setBestKpm(0);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#070707] text-[#555] flex flex-col justify-center items-center font-mono text-xs">
        <div className="animate-spin h-5 w-5 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full mb-3"></div>
        <span>-2-55Typing 認証セッションを起動中...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen 
        onLoginSuccess={(u, t) => {
          setUser(u);
          setToken(t);
          if (u.name) {
            setNickname(u.name);
          }
        }} 
      />
    );
  }

  // Active Maintenance Mode Overlay for regular users
  if (maintenanceEnabled && !user.isAdmin) {
    return (
      <div className="min-h-screen bg-[#070707] text-[#d1d1d1] flex flex-col justify-center items-center p-6 text-center select-none">
        <div className="w-16 h-16 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 mb-6 animate-pulse">
          <AlertTriangle size={30} />
        </div>
        <h1 className="text-xl font-black text-white tracking-tight mb-2">現在システムメンテナンス中です</h1>
        <p className="text-xs text-neutral-500 max-w-sm leading-relaxed mb-6">
          -2-55Typing は現在開発者によるシステム調整のため、一般アカウントの機能を制限しております。完了までしばらくお待ちください。
        </p>
        <button
          onClick={handleLogout}
          className="py-2.5 px-6 bg-[#121212] hover:bg-[#1a1a1a] border border-neutral-800 text-xs font-bold rounded-lg text-white font-sans transition-all cursor-pointer"
        >
          ログアウト（別アカウントでサインイン）
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060606] text-[#d1d1d1] flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Admin Panel Modal Overlay */}
      {showAdminPanel && user.isAdmin && (
        <AdminPanel 
          token={token} 
          onClose={() => {
            setShowAdminPanel(false);
            fetchSystemSettings();
          }} 
        />
      )}

      {/* Retro Styled System Announcement Banner */}
      {systemAnnouncement && (
        <div className="bg-amber-950/15 border-b border-amber-900/30 text-amber-400 py-1.5 px-6 text-[11px] flex items-center gap-3 shrink-0">
          <span className="shrink-0 bg-amber-400/10 border border-amber-400/30 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide font-mono">
            重要告知
          </span>
          <marquee className="text-neutral-300 font-medium cursor-default" scrollamount="4">
            {systemAnnouncement}
          </marquee>
        </div>
      )}

      {/* Sleek, Minimal Top Navbar */}
      <nav className="h-14 border-b border-[#1c1c1c] flex items-center justify-between px-6 bg-[#090909] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-5.5 h-5.5 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded flex items-center justify-center text-[#00ff88] font-bold text-xs select-none font-sans flex-shrink-0">
            T
          </div>
          <div className="text-white font-bold tracking-tight text-base font-shingo">-2-55Typing</div>
        </div>

        <div className="flex items-center gap-3">
          {/* User Profile Badge & Admin controls */}
          <div className="flex items-center gap-2 bg-[#121212] px-3 py-1 border border-[#222] rounded-lg text-xs font-bold">
            <span className="text-[#555] font-mono text-[9px] uppercase">PLAYER:</span>
            <span className="text-white font-black mr-1">{user.name}</span>
            <BadgeMiniDisplay 
              unlockedIds={unlockedBadges} 
              onShowCollection={() => setShowCatalogModal(true)} 
            />
            {user.isAdmin && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="ml-1.5 px-2 py-0.5 bg-red-950/40 hover:bg-red-900 border border-red-900/60 text-red-400 hover:text-white rounded text-[9.5px] cursor-pointer transition-colors"
              >
                管理者
              </button>
            )}
            <button
              onClick={handleLogout}
              className="ml-1 px-2 py-0.5 bg-[#1b1b1b] hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded text-[9.5px] cursor-pointer transition-colors"
            >
              ログアウト
            </button>
          </div>

          <button
            onClick={() => setSettings(p => ({ ...p, soundEnabled: !p.soundEnabled }))}
            className={`p-1.5 rounded border transition-colors cursor-pointer ${
              settings.soundEnabled 
                ? "bg-transparent border-[#222] text-[#00ff88] hover:border-[#00ff88]/50" 
                : "bg-transparent border-[#222] text-neutral-600 hover:text-white"
            }`}
            title={settings.soundEnabled ? "効果音: オン" : "効果音: ミュート"}
          >
            {settings.soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
        </div>
      </nav>

      {/* Main Workspace Frame */}
      <div className="flex-grow flex flex-col lg:flex-row max-w-[1500px] w-full mx-auto p-4 md:p-6 gap-6 overflow-hidden">
        
        {/* SIDEBAR: Simplified Mode Selector */}
        <aside className="w-full lg:w-64 border border-[#1c1c1c] bg-[#090909] p-4.5 rounded-xl flex flex-col gap-5 shrink-0 self-start">
          
          <div>
            <h3 className="text-[9px] uppercase tracking-[0.16em] text-[#555] mb-2.5 font-mono">練習モード選択 // MODE SELECT</h3>
            <div className="space-y-2">
              {/* Practice Mode Button */}
              <button
                onClick={() => {
                  setCurrentMode("practice");
                }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all duration-200 flex flex-col gap-1 cursor-pointer select-none group ${
                  currentMode === "practice"
                    ? "bg-[#141414] border-white text-white shadow-md shadow-black/40"
                    : "bg-transparent border-[#1c1c1c] text-[#777] hover:bg-[#111] hover:text-[#bbb]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base shrink-0">🌱</span>
                  <span className="text-xs font-black tracking-tight">練習モード</span>
                </div>
                <p className="text-[9px] leading-relaxed text-neutral-500 group-hover:text-neutral-400">
                  初心者から上級者まで、快適なフレーズを連続入力して基礎固め
                </p>
              </button>

              {/* Special Training Mode Button */}
              <button
                onClick={() => {
                  setCurrentMode("special");
                }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all duration-200 flex flex-col gap-1 cursor-pointer select-none group ${
                  currentMode === "special"
                    ? "bg-gradient-to-r from-emerald-950/20 to-black border-[#00ff88] text-white shadow-lg shadow-emerald-950/5"
                    : "bg-transparent border-[#1c1c1c] text-[#777] hover:bg-[#111] hover:text-[#bbb]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base shrink-0 animate-pulse">🛡️</span>
                  <span className="text-xs font-black tracking-tight text-[#00ff88]">特訓モード</span>
                </div>
                <p className="text-[9px] leading-relaxed text-neutral-500 group-hover:text-neutral-400">
                  ミス頻度の高い苦手アルファベットを熱伝導マップから自動抽出
                </p>
              </button>

              {/* Online Ranking Mode Button */}
              <button
                onClick={() => {
                  setCurrentMode("online");
                }}
                className={`w-full text-left p-3.5 rounded-lg border transition-all duration-200 flex flex-col gap-1 cursor-pointer select-none group ${
                  currentMode === "online"
                    ? "bg-gradient-to-r from-amber-950/20 to-black border-amber-400 text-white shadow-lg shadow-amber-950/5"
                    : "bg-transparent border-[#1c1c1c] text-[#777] hover:bg-[#111] hover:text-[#bbb]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base shrink-0">🏆</span>
                  <span className="text-xs font-black tracking-tight text-amber-500 group-hover:text-amber-400">上位ランキング</span>
                </div>
                <p className="text-[9px] leading-relaxed text-neutral-500 group-hover:text-neutral-400">
                  全国のハイレベル・タイパーの打鍵速度（KPM）を集計した順位表です
                </p>
              </button>
            </div>
          </div>

          {/* Minimal 1-line instructions helper */}
          <div className="p-3 bg-[#111]/40 border border-[#1e1e1e] rounded-lg text-[10px] leading-relaxed text-neutral-500 font-sans">
            <span className="font-bold text-neutral-400">💡 アナリティクス連動: </span>
            <span>「練習モード」でのミス打鍵はリアルタイムで分析され、「特訓モード」の苦手文字配列に直ちに蓄積されます。</span>
          </div>
        </aside>

        {/* MAIN TYPING CONGESTION AREA */}
        <main className="flex-grow flex-1 flex flex-col gap-5 overflow-hidden">
          {currentMode === "online" ? (
            <OnlineRanking 
              recentKpm={lastFinishedKpm}
              recentAccuracy={lastFinishedAccuracy}
              recentMode={lastFinishedModeName}
              token={token}
              onSubmitSuccess={() => {
                setLastFinishedKpm(0);
                setLastFinishedAccuracy(0);
                setLastFinishedModeName("");
              }}
            />
          ) : (
            <>
              {/* Active sentence stage header details */}
              <div className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded-lg text-xs font-mono">
                <div className="flex items-center gap-2">
                  <BookOpen size={12} className="text-[#00ff88]" />
                  <span className="text-neutral-400">現在地:</span>
                  <span className="text-white font-bold">{activeCategory.name}</span>
                </div>

                <div className="flex items-center gap-4">
                  {activeCategory.sentences.length > 0 && (
                    <div className="text-neutral-400 text-[10px]">
                      進捗: {sentenceIndex + 1} / {activeCategory.sentences.length} 文
                    </div>
                  )}
                  <button
                    onClick={() => resetSession()}
                    className="flex items-center gap-1 px-2.5 py-0.5 bg-[#181818] hover:bg-[#252525] border border-[#333] hover:border-neutral-600 rounded text-[10px] text-white transition-colors cursor-pointer font-bold uppercase tracking-wider"
                  >
                    <RefreshCw size={10} />
                    <span>再試行</span>
                  </button>
                </div>
              </div>

              {/* Core Typing Arena Card / Congratulations Modal Portal */}
              {!isCompleted ? (
                activeSentence ? (
                  <TypingArena
                    sentence={activeSentence}
                    syllables={syllables}
                    syllableIndex={syllableIndex}
                    typedInSyllable={typedInSyllable}
                    chosenRomajiList={chosenRomajiList}
                    shakeTrigger={shake}
                    onKeyDown={handleKeyDown}
                    isAiGenerated={false}
                    gameStatus={gameStatus}
                    onStartGame={handleStartGame}
                    onStopGame={handleStopGame}
                    timeLeft={timeLeft}
                  />
                ) : (
                  <div className="flex-1 min-h-[300px] flex items-center justify-center bg-[#0d0d0d] border border-[#222] rounded-xl text-center p-8">
                    <p className="text-xs text-neutral-400 font-mono">文が登録されていません。</p>
                  </div>
                )
              ) : (
                /* CONGRATULATIONS WINDOW */
                <div className="w-full min-h-[360px] bg-[#0c0c0c] border-2 border-[#00ff88]/50 rounded-xl p-8 flex flex-col items-center justify-center relative shadow-xl shadow-emerald-950/5 relative overflow-hidden animate-fade-in z-10">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#00ff88]/5 to-transparent pointer-events-none"></div>
                  
                  <div className="w-12 h-12 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] mb-4 shadow-[0_0_15px_rgba(0,255,136,0.2)] animate-bounce" style={{ animationDuration: "2s" }}>
                    <Trophy size={20} />
                  </div>

                  <div className="text-center">
                    <h2 className="text-2xl text-white font-shingo tracking-tight mb-2">測定終了！お疲れ様でした</h2>
                    <p className="text-[11px] text-neutral-400 tracking-wider font-mono uppercase mb-6">
                      60-SECONDS TEST COMPLETED: {activeCategory.name}
                    </p>
                  </div>

                  {/* Score summary panel */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-md p-4.5 bg-[#0a0a0a] border border-[#222] rounded-lg mb-6 text-center font-mono text-xs shadow-inner">
                    <div>
                      <p className="text-[#555] text-[10px] mb-1 uppercase font-bold text-[9px]">打鍵速度 (KPM)</p>
                      <p className="text-2xl font-black text-[#00ff88]">{currentKpm}</p>
                    </div>
                    <div>
                      <p className="text-[#555] text-[10px] mb-1 uppercase font-bold text-[9px]">正確性</p>
                      <p className="text-2xl font-black text-cyan-400">{currentAccuracy}%</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[#555] text-[10px] mb-1 uppercase font-bold text-[9px]">正確 / ミス入力数</p>
                      <p className="text-2xl font-black text-neutral-300">
                        {correctKeys} <span className="text-neutral-600 text-xs font-normal">/</span> <span className="text-red-500">{missedKeys}</span>
                      </p>
                    </div>
                  </div>

                  {/* Leaderboard Submission Form Widget */}
                  <div className="w-full max-w-md bg-[#0a0a0a] border border-[#1b1b1b]/80 p-4 rounded-lg mb-6 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <Trophy size={14} className="text-amber-400 animate-pulse" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-300 font-mono">
                        オンラインランキング登録 / LEADERBOARD SUBMIT
                      </span>
                    </div>

                    {!innerSubmitted ? (
                      <form onSubmit={handleHomeSubmit} className="flex flex-col gap-2 w-full">
                        <div className="flex gap-2 w-full">
                          <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="ニックネームを入力 (16文字以内)"
                            maxLength={16}
                            required
                            className={`bg-[#111] border focus:border-[#00ff88] outline-none text-white text-xs px-3.5 py-2.5 rounded flex-1 font-mono font-bold transition-colors ${
                              isInappropriateName(nickname)
                                ? "border-red-500 focus:border-red-500"
                                : "border-neutral-800"
                            }`}
                          />
                          <button
                            type="submit"
                            disabled={innerSubmitting || !nickname.trim() || isInappropriateName(nickname)}
                            className="px-4 py-2 bg-[#00ff88] hover:bg-[#1fd183] text-black font-extrabold text-[10px] uppercase tracking-wider rounded transition-colors disabled:opacity-45 cursor-pointer shrink-0"
                          >
                            {innerSubmitting ? "送信中" : "スコア提出"}
                          </button>
                        </div>
                        {isInappropriateName(nickname) && (
                          <span className="text-[10px] text-red-500 font-sans font-bold text-left ml-1 mt-0.5 leading-none">
                            ⚠️ 使用できない単語が含まれています
                          </span>
                        )}
                      </form>
                    ) : (
                      <div className="text-[11px] text-[#00ff88] font-mono text-center font-bold bg-[#0d1c12] py-2 border border-emerald-500/20 rounded">
                        🎉 ランキングに登録しました！「上位ランキング」から確認できます
                      </div>
                    )}
                    {innerError && (
                      <p className="text-[9px] text-red-500 font-mono text-center">{innerError}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => resetSession(activeCategory)}
                      className="px-5 py-2.5 bg-[#161616] hover:bg-[#202020] border border-[#333] hover:border-[#555] text-white font-bold text-xs rounded transition-colors cursor-pointer"
                    >
                      もう一回挑戦する
                    </button>
                    {currentMode === "special" && (
                      <button
                        onClick={() => {
                          setCurrentMode("practice");
                        }}
                        className="px-5 py-2.5 bg-white hover:bg-[#eaeaea] text-black font-extrabold text-xs rounded transition-colors cursor-pointer"
                      >
                        練習モードに戻る
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* STATS & TREND LINE CHART */}
              <div id="stats-and-chart" className="grid grid-cols-1 xl:grid-cols-3 gap-4 w-full">
                <div className="xl:col-span-2 flex flex-col gap-4 min-w-0">
                  <div className="flex flex-col gap-1.5 w-full">
                    <h3 className="text-[10px] font-bold text-[#555] uppercase tracking-wider font-mono px-0.5">現在のリアルタイムステート // CURRENT STATE</h3>
                    <StatsCard
                      kpm={startTime ? currentKpm : 0}
                      accuracy={currentAccuracy}
                      correctKeys={correctKeys}
                      missedKeys={missedKeys}
                      streak={streak}
                      bestKpm={bestKpm}
                      goals={goals}
                      progress={goalProgress}
                    />
                  </div>

                  {/* Goal Settings Panel */}
                  <GoalSettings
                    goals={goals}
                    onChangeGoals={(newGoals) => {
                      setGoals(newGoals);
                      localStorage.setItem("glyph_type_session_goals", JSON.stringify(newGoals));
                    }}
                    progress={goalProgress}
                    sessionActive={gameStatus === "playing"}
                    onClearGoals={() => {
                      const cleared = {
                        kpmEnabled: false,
                        kpmValue: 200,
                        accuracyEnabled: false,
                        accuracyValue: 95,
                        streakEnabled: false,
                        streakValue: 30
                      };
                      setGoals(cleared);
                      localStorage.removeItem("glyph_type_session_goals");
                      setGoalProgress({
                        kpmAchieved: false,
                        accuracyAchieved: false,
                        streakAchieved: false
                      });
                    }}
                  />
                </div>
                
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-1.5 w-full">
                    <h3 className="text-[10px] font-bold text-[#555] uppercase tracking-wider font-mono px-0.5">打鍵速度の推移 (KPM履歴) // SPEED TREND</h3>
                    <KpmHistoryChart history={history} />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <h3 className="text-[10px] font-bold text-[#555] uppercase tracking-wider font-mono px-0.5">獲得実績バッジ // ACHIEVEMENTS</h3>
                    <BadgeCatalogList unlockedIds={unlockedBadges} />
                  </div>
                </div>
              </div>

              {/* REAL-TIME KEYSTROKE DEVIATION & WEAKNESS DEVIATION ANALYZER */}
              <TypingAnalyzer
                keyStats={keyStats}
                onResetStats={handleResetStats}
                onGenerateWeaknessCourse={handleGenerateWeaknessCourse}
              />
            </>
          )}

          {/* Simple Minimalist Footer */}
          <footer className="h-8 border-t border-[#181818] flex items-center justify-between px-2 text-[10px] text-neutral-600 bg-transparent font-mono">
            <div className="flex items-center gap-4">
              <span>© 2026 -2-55Typing</span>
              <span className="text-neutral-800">|</span>
              <button 
                id="footer-terms-btn"
                onClick={() => { setLegalModalType("terms"); setLegalModalOpen(true); }}
                className="hover:text-[#00ff88] transition-colors font-bold uppercase tracking-wide cursor-pointer"
              >
                利用規約 // TERMS
              </button>
              <span className="text-neutral-800">|</span>
              <button 
                id="footer-privacy-btn"
                onClick={() => { setLegalModalType("privacy"); setLegalModalOpen(true); }}
                className="hover:text-[#00ccff] transition-colors font-bold uppercase tracking-wide cursor-pointer"
              >
                プライバシー // PRIVACY
              </button>
            </div>
            <div className="hidden sm:block">和文タッチタイピング練習</div>
          </footer>

          <LegalModal 
            isOpen={legalModalOpen} 
            type={legalModalType} 
            onClose={() => { 
              setLegalModalOpen(false); 
              setLegalModalType(null); 
            }} 
          />

          <GoalNotificationToast
            toasts={toasts}
            onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
          />

          <BadgeUnlockModal 
            isOpen={showUnlockModal} 
            newlyUnlocked={newlyUnlocked} 
            onClose={() => {
              setShowUnlockModal(false);
              setNewlyUnlocked([]);
            }} 
          />

          {showCatalogModal && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all"
              onClick={() => setShowCatalogModal(false)}
            >
              <div 
                className="w-full max-w-md bg-[#0a0a0a] border border-[#222] rounded-lg shadow-2xl flex flex-col overflow-hidden text-left"
                onClick={(e) => e.stopPropagation()}
                id="achievement-catalog-popup"
              >
                <div className="flex items-center justify-between border-b border-[#222] px-4 py-3 bg-[#080808]">
                  <div className="flex items-center gap-1.5">
                    <Trophy size={14} className="text-[#00ff88]" />
                    <span className="text-[10px] font-black font-mono tracking-wider text-white uppercase">
                      ACHIEVEMENT COLLECTION // 獲得実績一覧
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowCatalogModal(false)}
                    className="text-neutral-400 hover:text-white transition-colors p-1 hover:bg-neutral-900 rounded cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="p-4 bg-[#050505]">
                  <BadgeCatalogList unlockedIds={unlockedBadges} />
                </div>
                <div className="border-t border-[#222] px-4 py-2.5 bg-[#080808] flex justify-end">
                  <button
                    onClick={() => setShowCatalogModal(false)}
                    className="px-3 py-1.5 bg-[#181818] border border-[#333] hover:border-[#444] text-neutral-300 hover:text-white transition-colors text-xs font-mono font-bold rounded cursor-pointer"
                  >
                    閉じる // CLOSE
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
