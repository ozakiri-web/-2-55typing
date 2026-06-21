import React, { useEffect, useRef } from "react";
import { TypingSentence } from "../types";
import { SyllableState } from "../utils/romaji";
import { Keyboard, ArrowRight, CornerDownLeft, Sparkles } from "lucide-react";

interface TypingArenaProps {
  sentence: TypingSentence;
  syllables: SyllableState[];
  syllableIndex: number;
  typedInSyllable: string;
  chosenRomajiList: string[];
  shakeTrigger: boolean;
  onKeyDown: (e: KeyboardEvent) => void;
  isAiGenerated?: boolean;
  gameStatus: "idle" | "playing" | "completed";
  onStartGame: () => void;
  onStopGame: () => void;
  timeLeft: number;
}

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m", ",", "."]
];

export const TypingArena: React.FC<TypingArenaProps> = ({
  sentence,
  syllables,
  syllableIndex,
  typedInSyllable,
  chosenRomajiList,
  shakeTrigger,
  onKeyDown,
  isAiGenerated = false,
  gameStatus,
  onStartGame,
  onStopGame,
  timeLeft
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Choose the currently targeted character key to guide virtual keyboard styling
  const currentSyllable = syllables[syllableIndex];
  const activeOptions = currentSyllable
    ? currentSyllable.options.filter(opt => opt.startsWith(typedInSyllable))
    : [];
  const activeOpt = activeOptions[0] || (currentSyllable ? currentSyllable.options[0] : "");
  const targetKey = activeOpt ? activeOpt[typedInSyllable.length]?.toLowerCase() || "" : "";

  // Capture global key events only when typing arena is active
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Prevent browser default actions for Space, Backspace to avoid scrolling/navigating
      if (e.key === " " || e.key === "Backspace") {
        e.preventDefault();
      }
      
      if (gameStatus === "idle" && (e.key === "Enter" || e.key === " ")) {
        onStartGame();
        return;
      }
      
      onKeyDown(e);
    };

    window.addEventListener("keydown", handleGlobalKey);
    return () => {
      window.removeEventListener("keydown", handleGlobalKey);
    };
  }, [onKeyDown, gameStatus, onStartGame]);

  return (
    <div 
      ref={containerRef}
      className={`w-full bg-[#0d0d0d] border border-[#222] rounded-xl p-8 relative flex flex-col items-center justify-between min-h-[380px] shadow-2xl transition-all duration-150 ${
        shakeTrigger ? "animate-shake border-red-500/50 shadow-red-950/10" : ""
      }`}
    >
      {/* Background Decorative Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none rounded-xl"></div>

      {/* Idle Overlay over the stage */}
      {gameStatus === "idle" && (
        <div className="absolute inset-0 bg-[#070707]/96 backdrop-blur-[4px] rounded-xl flex flex-col items-center justify-center p-6 z-30 transition-all duration-150">
          <div className="text-center max-w-sm flex flex-col items-center">
            {/* Hourglass/Timer Icon */}
            <div className="w-14 h-14 rounded-full bg-[#00ff88]/5 border border-[#00ff88]/20 flex items-center justify-center text-[#00ff88] mb-4 shadow-[0_0_20px_rgba(0,255,136,0.1)]">
              <span className="text-2xl animate-pulse">⏱️</span>
            </div>
            
            <h3 className="text-base text-white font-black tracking-wide mb-1">
              1分間タイピング測定
            </h3>
            
            <p className="text-neutral-400 text-[11px] leading-relaxed mb-6">
              制限時間「60秒」であなたの和文タイピング能力（KPM・正確性）を測定します。<br />
              <span className="text-neutral-500 text-[10px] block mt-2">
                下の「測定を開始」をクリックするか、<br />
                <span className="text-white font-mono bg-neutral-900 border border-neutral-800 px-1 py-0.5 rounded text-[9px] mx-1">Space</span> 又は <span className="text-white font-mono bg-neutral-900 border border-neutral-800 px-1 py-0.5 rounded text-[9px]">Enter</span>キーを押して直ちに開始。
              </span>
            </p>

            <button
              onClick={onStartGame}
              className="w-full px-6 py-2.5 bg-[#00ff88] hover:bg-[#00e077] text-black font-extrabold text-xs tracking-wider rounded-lg shadow-[0_4px_15px_rgba(0,255,136,0.3)] transition-all cursor-pointer flex items-center justify-center gap-1.5 group transform active:scale-95 text-center uppercase"
            >
              <span>測定を開始 (START)</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Header Indicators */}
      <div className="w-full flex items-center justify-between text-[10px] text-[#555] font-mono tracking-widest uppercase mb-6 z-10">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${gameStatus === "playing" ? "bg-red-500 animate-ping" : "bg-[#00ff88]"}`}></span>
          <span>
            {gameStatus === "playing" ? "測定中 // MEASURING SESSION ACTIVE" : "和文入力端末 // SENSOR INPUT ACTIVE"}
          </span>
        </div>
        
        {/* Timer status and Stop Control right in the arena header */}
        <div className="flex items-center gap-3">
          {gameStatus === "playing" ? (
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded text-[11px] font-mono font-black ${
                timeLeft <= 10 
                  ? "bg-red-950/40 border border-red-500/80 text-red-500 animate-pulse" 
                  : "bg-neutral-900 border border-neutral-800 text-[#00ff88]"
              }`}>
                ⏰ 残り {timeLeft} 秒
              </span>
              <button
                onClick={onStopGame}
                className="px-2.5 py-1 bg-red-950/20 hover:bg-red-950/50 border border-red-900/50 hover:border-red-500 text-red-400 rounded text-[9px] font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 uppercase transform active:scale-95"
                title="測定をストップして結果を出します"
              >
                <span className="w-1 h-1 bg-red-500 rounded-sm"></span>
                <span>STOP</span>
              </button>
            </div>
          ) : (
            isAiGenerated && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-950/50 text-cyan-400 border border-cyan-800/40 rounded text-[9px]">
                <Sparkles size={11} />
                <span>AI GENERATED</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Primary Display Layout */}
      <div className="w-full flex flex-col items-center text-center my-auto z-10 px-4">
        {/* Kanji Target (Large High-Tech Typography) */}
        <h2 
          className="text-2xl md:text-[34px] leading-snug text-white tracking-normal mb-3 transition-colors filter drop-shadow-md select-none font-shingo"
        >
          {sentence.kanji}
        </h2>

        {/* Pronunciation Hiragana Guide */}
        <div className="text-xs md:text-sm text-neutral-400 tracking-wide bg-[#151515] px-4 py-1.5 rounded-full border border-[#222] mb-6 select-none font-shingo">
          {sentence.kana}
        </div>

        {/* Romaji typing guide */}
        <div className="flex flex-wrap justify-center font-mono text-base md:text-xl tracking-[0.05em] leading-relaxed max-w-2xl bg-[#080808] p-5 rounded-lg border border-[#1b1b1b] shadow-inner select-none gap-x-2">
          {syllables.map((syllable, sIdx) => {
            if (sIdx < syllableIndex) {
              const typedStr = chosenRomajiList[sIdx] || (syllable.options[0] || "");
              return (
                <span key={sIdx} className="text-[#00ff88] font-bold border-b border-transparent">
                  {typedStr}
                </span>
              );
            } else if (sIdx === syllableIndex) {
              const activeOpts = syllable.options.filter(opt => opt.startsWith(typedInSyllable));
              const activeOpt = activeOpts[0] || (syllable.options[0] || "");
              
              const typedPart = activeOpt.substring(0, typedInSyllable.length);
              const activeChar = activeOpt.substring(typedInSyllable.length, typedInSyllable.length + 1);
              const remainingPart = activeOpt.substring(typedInSyllable.length + 1);

              return (
                <span key={sIdx} className="inline-flex">
                  {typedPart && (
                    <span className="text-[#00ff88] font-bold">
                      {typedPart}
                    </span>
                  )}
                  {activeChar && (
                    <span className="text-white bg-[#1fd183]/20 px-[2px] rounded-sm font-black animate-pulse border-b-2 border-[#00ff88]">
                      {activeChar}
                    </span>
                  )}
                  {remainingPart && (
                    <span className="text-neutral-600">
                      {remainingPart}
                    </span>
                  )}
                </span>
              );
            } else {
              const defaultStr = syllable.options[0] || "";
              return (
                <span key={sIdx} className="text-neutral-600">
                  {defaultStr}
                </span>
              );
            }
          })}
          {/* Complete trigger indicator if done */}
          {syllableIndex === syllables.length && (
            <span className="ml-2 text-emerald-400 font-bold animate-bounce flex items-center gap-1 text-sm font-mono">
              <CornerDownLeft size={14} /> COMPLETE!
            </span>
          )}
        </div>

        {sentence.meaning && (
          <p className="text-[11px] text-neutral-500 font-medium italic mt-4 max-w-lg">
            釈義: {sentence.meaning}
          </p>
        )}
      </div>

      {/* Cyberpunk Visual on-screen Keyboard */}
      <div id="virtual-keyboard" className="w-full max-w-xl mt-8 flex flex-col gap-1 px-2 py-3 bg-[#0a0a0a] rounded-lg border border-[#1b1b1b] z-10 select-none">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1">
            {row.map(keyChar => {
              const isActiveTarget = targetKey === keyChar;
              return (
                <div
                  key={keyChar}
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded flex items-center justify-center font-mono text-[10px] md:text-xs transition-all uppercase tracking-wider relative ${
                    isActiveTarget
                      ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/80 shadow-[0_0_10px_rgba(0,255,136,0.15)] font-bold animate-pulse scale-105 z-20"
                      : "bg-[#0d0d0d] text-neutral-500 border border-[#222]/80"
                  }`}
                >
                  {/* Subtle small label representing letters */}
                  <span>{keyChar}</span>
                  {isActiveTarget && (
                    <span className="absolute -top-1.5 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
