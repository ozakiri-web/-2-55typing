import React, { useState } from "react";
import { Award, CheckCircle2, Lock, Sparkles, X } from "lucide-react";
import { ScoreRecord } from "../types";

export interface BadgeDef {
  id: string;
  name: string;
  type: "speed" | "count" | "accuracy";
  threshold: number;
  description: string;
  emoji: string;
  color: string;   // Tailwind border class
  bg: string;      // Tailwind dark background theme
  text: string;    // Tailwind neon accent text color
  glow: string;    // Tailwind shadow glow class
}

export const BADGES_LIST: BadgeDef[] = [
  {
    id: "first_lesson",
    name: "初級練習生",
    type: "count",
    threshold: 1,
    description: "タイピング練習を1回以上完了する",
    emoji: "🌱",
    color: "border-emerald-500/50",
    bg: "bg-emerald-950/20",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/20"
  },
  {
    id: "five_lessons",
    name: "タイピング愛好家",
    type: "count",
    threshold: 5,
    description: "タイピング練習を5回以上完了する",
    emoji: "🔥",
    color: "border-orange-500/50",
    bg: "bg-orange-950/20",
    text: "text-orange-400",
    glow: "shadow-orange-500/20"
  },
  {
    id: "fifteen_lessons",
    name: "不屈の努力家",
    type: "count",
    threshold: 15,
    description: "タイピング練習を15回以上完了する",
    emoji: "🛡️",
    color: "border-pink-500/50",
    bg: "bg-pink-950/20",
    text: "text-pink-400",
    glow: "shadow-pink-500/20"
  },
  {
    id: "speed_150",
    name: "快速快速ビギナー",
    type: "speed",
    threshold: 150,
    description: "打鍵速度 150 KPM 以上を記録する",
    emoji: "⚡",
    color: "border-yellow-500/50",
    bg: "bg-yellow-950/20",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20"
  },
  {
    id: "speed_300",
    name: "音速タイパー",
    type: "speed",
    threshold: 300,
    description: "打鍵速度 300 KPM 以上を記録する",
    emoji: "💫",
    color: "border-cyan-500/50",
    bg: "bg-cyan-950/20",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/20"
  },
  {
    id: "speed_450",
    name: "光速覇王",
    type: "speed",
    threshold: 450,
    description: "打鍵速度 450 KPM 以上を記録する",
    emoji: "☄️",
    color: "border-violet-500/50",
    bg: "bg-violet-950/20",
    text: "text-violet-400",
    glow: "shadow-violet-500/20"
  },
  {
    id: "accuracy_95",
    name: "必中精密スナイパー",
    type: "accuracy",
    threshold: 95,
    description: "タイピング精度 95% 以上で練習を完了する",
    emoji: "🎯",
    color: "border-purple-500/50",
    bg: "bg-purple-950/20",
    text: "text-purple-400",
    glow: "shadow-purple-500/20"
  },
  {
    id: "accuracy_98",
    name: "明鏡止水のタイパー",
    type: "accuracy",
    threshold: 98,
    description: "タイピング精度 98% 以上で練習を完了する",
    emoji: "🌌",
    color: "border-rose-500/50",
    bg: "bg-rose-950/20",
    text: "text-rose-400",
    glow: "shadow-rose-500/20"
  }
];

// Evaluates history entries to determine which badge IDs are unlocked
export const evaluateBadges = (history: ScoreRecord[]): string[] => {
  if (!history || history.length === 0) return [];

  const unlockedIds: string[] = [];
  const completedCount = history.length;
  const maxKpm = Math.max(...history.map(h => h.kpm));
  const maxAccuracy = Math.max(...history.map(h => h.accuracy));

  BADGES_LIST.forEach(badge => {
    if (badge.type === "count") {
      if (completedCount >= badge.threshold) {
        unlockedIds.push(badge.id);
      }
    } else if (badge.type === "speed") {
      if (maxKpm >= badge.threshold) {
        unlockedIds.push(badge.id);
      }
    } else if (badge.type === "accuracy") {
      // Check if any single completed trial matches or exceeds the threshold
      const hasQualifiedTrial = history.some(h => h.accuracy >= badge.threshold);
      if (hasQualifiedTrial) {
        unlockedIds.push(badge.id);
      }
    }
  });

  return unlockedIds;
};

interface BadgeMiniDisplayProps {
  unlockedIds: string[];
  onShowCollection: () => void;
}

export const BadgeMiniDisplay: React.FC<BadgeMiniDisplayProps> = ({ unlockedIds, onShowCollection }) => {
  const unlockedBadges = BADGES_LIST.filter(badge => unlockedIds.includes(badge.id));

  // Max render 3 badges in raw format, rest with a counter pill
  const visibleBadges = unlockedBadges.slice(0, 4);

  return (
    <div 
      className="flex items-center gap-1 cursor-pointer select-none" 
      onClick={onShowCollection}
      title="クリックしてアチーブメント一覧を表示"
    >
      {visibleBadges.map(badge => (
        <span 
          key={badge.id}
          className={`flex items-center justify-center text-[10px] w-5 h-5 rounded-full border ${badge.color} ${badge.bg} transition-transform hover:scale-110 active:scale-95`}
          title={`${badge.name}: ${badge.description}`}
        >
          {badge.emoji}
        </span>
      ))}
      {unlockedBadges.length > 4 && (
        <span className="text-[8.5px] px-1 bg-neutral-800 text-neutral-400 border border-neutral-700/60 rounded font-mono font-bold">
          +{unlockedBadges.length - 4}
        </span>
      )}
      {unlockedIds.length === 0 && (
        <span 
          className="text-[9px] text-[#555] hover:text-[#00ff88] transition-colors border border-dashed border-neutral-800 px-1.5 py-0.5 rounded flex items-center gap-0.5"
          title="アチーブメントがありません。練習を完了してアンロックしましょう！"
        >
          <Award size={9.5} />
          NO BADGES
        </span>
      )}
    </div>
  );
};

interface BadgeCatalogProps {
  unlockedIds: string[];
}

export const BadgeCatalogList: React.FC<BadgeCatalogProps> = ({ unlockedIds }) => {
  return (
    <div 
      id="achievement-badge-catalog" 
      className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3 flex flex-col gap-2 select-none"
    >
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-neutral-900/50 pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Award size={11} className="text-[#00ff88]" />
          <span className="text-neutral-400 font-bold uppercase tracking-wide">TYPING ACHIEVEMENTS</span>
        </div>
        <div className="text-neutral-500 font-bold text-[8.5px]">
          獲得状況: <span className="text-white font-extrabold">{unlockedIds.length}</span> / {BADGES_LIST.length}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-0.5 max-h-[148px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
        {BADGES_LIST.map(badge => {
          const isUnlocked = unlockedIds.includes(badge.id);
          return (
            <div
              key={badge.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded border transition-all duration-200 ${
                isUnlocked 
                  ? `${badge.color} ${badge.bg} text-neutral-200` 
                  : "border-neutral-900 bg-neutral-950/20 text-neutral-600"
              }`}
            >
              <div 
                className={`text-sm shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${
                  isUnlocked ? "bg-black/30 border border-neutral-700/20" : "bg-neutral-900/30 opacity-40 text-[10px]"
                }`}
              >
                {isUnlocked ? badge.emoji : <Lock size={10} className="text-neutral-700" />}
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className={`text-[10px] font-extrabold truncate ${isUnlocked ? 'text-white' : 'text-neutral-500'}`}>
                  {badge.name}
                </span>
                <span className="text-[8.5px] font-medium text-neutral-500 truncate" title={badge.description}>
                  {badge.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface BadgeUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  newlyUnlocked: BadgeDef[];
}

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ isOpen, onClose, newlyUnlocked }) => {
  if (!isOpen || newlyUnlocked.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-[#0d0d0d] border border-amber-500/30 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        id="badge-unlock-modal-container"
      >
        <div className="flex items-center justify-between border-b border-[#222] px-4 py-3 bg-[#0a0a0a]">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span className="text-[10px] font-black font-mono tracking-wider text-amber-400 uppercase">
              ACHIEVEMENT UNLOCKED // 実績解除
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center text-center gap-4">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full blur-lg opacity-25 animate-pulse"></div>
            <div className="w-16 h-16 rounded-full border-2 border-amber-400 bg-amber-950/20 flex items-center justify-center text-3xl shadow-xl relative animate-bounce">
              {newlyUnlocked[0].emoji}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-black text-white">{newlyUnlocked[0].name}</h3>
            <p className="text-[10px] text-neutral-400 max-w-[240px] leading-relaxed mx-auto">
              {newlyUnlocked[0].description}
            </p>
          </div>

          {newlyUnlocked.length > 1 && (
            <div className="text-[9px] text-neutral-500 bg-neutral-950/40 border border-neutral-900 px-2 py-1 rounded">
              他 {newlyUnlocked.length - 1} つの実績も同時に解除されました！
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-[10px] uppercase tracking-wider rounded transition-all shadow-lg cursor-pointer"
          >
            OK // CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
