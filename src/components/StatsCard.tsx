import React from "react";
import { Zap, Percent, Flame, AlertCircle } from "lucide-react";
import { SessionConfigGoal, SessionGoalProgress } from "../types";

interface StatsCardProps {
  kpm: number;
  accuracy: number;
  correctKeys: number;
  missedKeys: number;
  streak: number;
  bestKpm: number;
  goals?: SessionConfigGoal;
  progress?: SessionGoalProgress;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  kpm,
  accuracy,
  correctKeys,
  missedKeys,
  streak,
  bestKpm,
  goals,
  progress
}) => {
  return (
    <div id="stats-dashboard" className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
      {/* 1. 打鍵速度 */}
      <div className="px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-lg flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono mb-0.5 flex justify-between items-center pr-2">
            <span>打鍵速度 (KPM)</span>
            {goals?.kpmEnabled && (
              <span className={`text-[8.5px] px-1 rounded font-bold ${progress?.kpmAchieved ? "text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/30 animate-pulse" : "text-neutral-400 bg-neutral-900 border border-neutral-800"}`}>
                目標: {goals.kpmValue}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-white font-mono">{kpm}</span>
            <span className="text-[9px] text-neutral-600 font-mono">/min</span>
          </div>
        </div>
        <div className="text-right text-[8.5px] font-mono text-neutral-500 border-l border-[#222] pl-3 shrink-0">
          ベスト
          <span className="block text-[#00ff88] font-bold">{bestKpm} KPM</span>
        </div>
      </div>

      {/* 2. 正確性 */}
      <div className="px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-lg flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono mb-0.5 flex justify-between items-center pr-2">
            <span>正確性</span>
            {goals?.accuracyEnabled && (
              <span className={`text-[8.5px] px-1 rounded font-bold ${progress?.accuracyAchieved ? "text-cyan-400 bg-cyan-950/20 border border-cyan-500/30 animate-pulse" : "text-neutral-400 bg-neutral-900 border border-neutral-800"}`}>
                目標: {goals.accuracyValue}%
              </span>
            )}
          </div>
          <span className="text-xl font-black text-white font-mono">{accuracy}%</span>
        </div>
        <Percent size={14} className="text-cyan-500/80 shrink-0" />
      </div>

      {/* 3. コンボ数 */}
      <div className="px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-lg flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono mb-0.5 flex justify-between items-center pr-2">
            <span>コンボ</span>
            {goals?.streakEnabled && (
              <span className={`text-[8.5px] px-1 rounded font-bold ${progress?.streakAchieved ? "text-orange-400 bg-orange-950/20 border border-orange-500/30 animate-pulse" : "text-neutral-400 bg-neutral-900 border border-neutral-800"}`}>
                目標: {goals.streakValue}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-white font-mono">{streak}</span>
            <span className="text-[9px] text-neutral-600 font-mono">combo</span>
          </div>
        </div>
        <Flame size={14} className={`shrink-0 ${streak > 10 ? "text-orange-500 animate-pulse" : "text-amber-500/80"}`} />
      </div>

      {/* 4. 打鍵内訳 (成功 / ミス) */}
      <div className="px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-lg flex items-center justify-between col-span-2 md:col-span-1">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono mb-0.5">打鍵 (正解 / ミス)</p>
          <div className="font-mono text-xs flex gap-2">
            <span className="text-emerald-400 font-bold">o {correctKeys}</span>
            <span className="text-neutral-600">/</span>
            <span className="text-red-400 font-bold">x {missedKeys}</span>
          </div>
        </div>
        <AlertCircle size={14} className="text-[#555] shrink-0" />
      </div>
    </div>
  );
};
