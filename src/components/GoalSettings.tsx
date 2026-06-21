import React from "react";
import { Target, CheckCircle, Circle, Award, ChevronDown, ChevronUp } from "lucide-react";
import { SessionConfigGoal, SessionGoalProgress } from "../types";

interface GoalSettingsProps {
  goals: SessionConfigGoal;
  onChangeGoals: (newGoals: SessionConfigGoal) => void;
  progress: SessionGoalProgress;
  sessionActive: boolean;
  onClearGoals: () => void;
}

export const GoalSettings: React.FC<GoalSettingsProps> = ({
  goals,
  onChangeGoals,
  progress,
  sessionActive,
  onClearGoals
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const updateGoal = <K extends keyof SessionConfigGoal>(key: K, value: SessionConfigGoal[K]) => {
    onChangeGoals({
      ...goals,
      [key]: value
    });
  };

  const kpmPresets = [150, 200, 250, 300, 350, 400];
  const accuracyPresets = [90, 95, 98, 99, 100];
  const streakPresets = [10, 25, 50, 75, 100];

  return (
    <div className="w-full bg-[#090909] border border-[#1c1c1c] rounded-xl overflow-hidden shadow-lg shadow-black/40">
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 py-3 bg-[#0c0c0c] border-b border-[#1c1c1c] cursor-pointer hover:bg-[#121212] transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <Target size={14} className="text-[#00ff88] animate-pulse" />
          <span className="text-[10px] font-black font-mono tracking-wider text-white uppercase">
            目標設定 // SESSION TARGETS
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Active indicator badges */}
          {(goals.kpmEnabled || goals.accuracyEnabled || goals.streakEnabled) && (
            <span className="text-[8px] font-mono bg-[#00ff88]/10 text-[#00ff88] px-1.5 py-0.5 rounded border border-[#00ff88]/30">
              ACTIVE
            </span>
          )}
          <span className="text-neutral-500">
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 flex flex-col gap-4 animate-fade-in text-neutral-300">
          <p className="text-[9px] text-neutral-500 font-sans leading-relaxed">
            現在の練習セッション（60秒測定）で達成したい目標値を設定できます。達成するとリアルタイムに通知され、効果音でお祝いします。
          </p>

          {/* 1. KPM Goal */}
          <div className="border border-[#1a1a1a] rounded-lg p-3 bg-[#050505] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={goals.kpmEnabled}
                  onChange={(e) => updateGoal("kpmEnabled", e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#333] bg-black text-[#00ff88] focus:ring-0 focus:ring-offset-0 accent-[#00ff88] cursor-pointer"
                />
                <span className={`text-[11px] font-bold font-mono tracking-wide ${goals.kpmEnabled ? "text-white" : "text-neutral-500"}`}>
                  目標速度 (KPM)
                </span>
              </label>

              {goals.kpmEnabled && (
                <div className="flex items-center gap-1.5">
                  {progress.kpmAchieved ? (
                    <span className="flex items-center gap-1 text-[9px] font-black font-mono text-[#00ff88] px-1.5 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded">
                      <CheckCircle size={10} /> CLEAR
                    </span>
                  ) : (
                    sessionActive && (
                      <span className="text-[8px] font-mono text-neutral-500 animate-pulse">
                        RUNNING
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            {goals.kpmEnabled && (
              <div className="flex flex-col gap-2 mt-1 animate-fade-in pl-5">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={goals.kpmValue === 0 ? "" : goals.kpmValue}
                    onChange={(e) => updateGoal("kpmValue", Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-20 bg-black border border-[#222] focus:border-[#00ff88] outline-none text-white font-mono text-xs font-bold px-2 py-1 rounded text-center"
                    placeholder="250"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono">KPM</span>
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-1">
                  {kpmPresets.map((val) => (
                    <button
                      key={val}
                      onClick={() => updateGoal("kpmValue", val)}
                      className={`text-[9.5px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        goals.kpmValue === val
                          ? "bg-[#00ff88] text-black font-bold border-[#00ff88]"
                          : "bg-[#111] text-neutral-400 border-[#222] hover:bg-neutral-800"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Accuracy Goal */}
          <div className="border border-[#1a1a1a] rounded-lg p-3 bg-[#050505] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={goals.accuracyEnabled}
                  onChange={(e) => updateGoal("accuracyEnabled", e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#333] bg-black text-[#00ff88] focus:ring-0 focus:ring-offset-0 accent-[#00ff88] cursor-pointer"
                />
                <span className={`text-[11px] font-bold font-mono tracking-wide ${goals.accuracyEnabled ? "text-white" : "text-neutral-500"}`}>
                  目標正確性 (%)
                </span>
              </label>

              {goals.accuracyEnabled && (
                <div className="flex items-center gap-1.5">
                  {progress.accuracyAchieved ? (
                    <span className="flex items-center gap-1 text-[9px] font-black font-mono text-cyan-400 px-1.5 bg-cyan-950/20 border border-cyan-500/30 rounded">
                      <CheckCircle size={10} /> CLEAR
                    </span>
                  ) : (
                    sessionActive && (
                      <span className="text-[8px] font-mono text-neutral-500 animate-pulse">
                        RUNNING
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            {goals.accuracyEnabled && (
              <div className="flex flex-col gap-2 mt-1 animate-fade-in pl-5">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={goals.accuracyValue === 0 ? "" : goals.accuracyValue}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(100, parseInt(e.target.value) || 0));
                      updateGoal("accuracyValue", val);
                    }}
                    className="w-20 bg-black border border-[#222] focus:border-cyan-500/80 outline-none text-white font-mono text-xs font-bold px-2 py-1 rounded text-center"
                    placeholder="95"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono">%</span>
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-1">
                  {accuracyPresets.map((val) => (
                    <button
                      key={val}
                      onClick={() => updateGoal("accuracyValue", val)}
                      className={`text-[9.5px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        goals.accuracyValue === val
                          ? "bg-cyan-500 text-black font-bold border-cyan-500"
                          : "bg-[#111] text-neutral-400 border-[#222] hover:bg-neutral-800"
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Streak/Combo Goal */}
          <div className="border border-[#1a1a1a] rounded-lg p-3 bg-[#050505] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={goals.streakEnabled}
                  onChange={(e) => updateGoal("streakEnabled", e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#333] bg-black text-[#00ff88] focus:ring-0 focus:ring-offset-0 accent-[#00ff88] cursor-pointer"
                />
                <span className={`text-[11px] font-bold font-mono tracking-wide ${goals.streakEnabled ? "text-white" : "text-neutral-500"}`}>
                  目標コンボ数
                </span>
              </label>

              {goals.streakEnabled && (
                <div className="flex items-center gap-1.5">
                  {progress.streakAchieved ? (
                    <span className="flex items-center gap-1 text-[9px] font-black font-mono text-orange-400 px-1.5 bg-orange-950/20 border border-orange-500/30 rounded">
                      <CheckCircle size={10} /> CLEAR
                    </span>
                  ) : (
                    sessionActive && (
                      <span className="text-[8px] font-mono text-neutral-500 animate-pulse">
                        RUNNING
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            {goals.streakEnabled && (
              <div className="flex flex-col gap-2 mt-1 animate-fade-in pl-5">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={goals.streakValue === 0 ? "" : goals.streakValue}
                    onChange={(e) => updateGoal("streakValue", Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-20 bg-black border border-[#222] focus:border-orange-500/80 outline-none text-white font-mono text-xs font-bold px-2 py-1 rounded text-center"
                    placeholder="30"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono">combo</span>
                </div>
                {/* Presets */}
                <div className="flex flex-wrap gap-1">
                  {streakPresets.map((val) => (
                    <button
                      key={val}
                      onClick={() => updateGoal("streakValue", val)}
                      className={`text-[9.5px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        goals.streakValue === val
                          ? "bg-orange-500 text-black font-bold border-orange-500"
                          : "bg-[#111] text-neutral-400 border-[#222] hover:bg-neutral-800"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reset button */}
          {(goals.kpmEnabled || goals.accuracyEnabled || goals.streakEnabled) && (
            <button
              onClick={onClearGoals}
              className="mt-1 w-full text-center py-2 bg-[#141414] hover:bg-neutral-900 border border-[#2a2a2a] text-[10px] font-mono font-bold text-neutral-400 hover:text-white rounded transition-colors cursor-pointer select-none"
            >
              目標をすべてクリア // CLEAR TARGETS
            </button>
          )}
        </div>
      )}
    </div>
  );
};
