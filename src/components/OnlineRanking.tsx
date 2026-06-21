import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { isInappropriateName } from "../utils/validation";
import { 
  Trophy, 
  Search, 
  RefreshCw, 
  Award, 
  Target, 
  Zap, 
  Filter, 
  TrendingUp, 
  Layers, 
  Clock, 
  ChevronRight, 
  Star, 
  UserPlus
} from "lucide-react";

interface LeaderboardEntry {
  id: string;
  name: string;
  kpm: number;
  accuracy: number;
  mode: string;
  timestamp: string;
}

interface OnlineRankingProps {
  recentKpm?: number;
  recentAccuracy?: number;
  recentMode?: string;
  onSubmitSuccess?: () => void;
  token?: string;
}

export const OnlineRanking: React.FC<OnlineRankingProps> = ({ 
  recentKpm, 
  recentAccuracy, 
  recentMode = "練習", 
  onSubmitSuccess,
  token
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  
  // Scoring registration form
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem("glyph_type_nickname") || "";
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const fetchRankings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/leaderboard");
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      } else {
        setError("ランキングデータの取得に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      setError("サーバーに接続できませんでした。ネットワーク環境をご確認ください。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    if (!recentKpm) return;

    if (isInappropriateName(nickname)) {
      setError("不適切な単語が含まれています。変更してください。");
      return;
    }

    setSubmitting(true);
    try {
      const finalName = nickname.trim().substring(0, 16);
      localStorage.setItem("glyph_type_nickname", finalName);

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
          name: finalName,
          kpm: recentKpm,
          accuracy: recentAccuracy || 100,
          mode: recentMode
        })
      });

      if (response.ok) {
        setSubmitted(true);
        fetchRankings();
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        setError("スコアの送信に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      setError("通信中にエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and search entries
  const filteredEntries = entries
    .filter(entry => {
      // Name filter
      if (searchQuery && !entry.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Mode filter
      if (selectedFilter !== "ALL") {
        if (selectedFilter === "PRACTICE" && !entry.mode.includes("練習")) return false;
        if (selectedFilter === "SPECIAL" && !entry.mode.includes("特訓") && !entry.mode.includes("オンライン")) return false;
      }
      return true;
    })
    .sort((a, b) => b.kpm - a.kpm);

  // Statistics calculation for filtered view
  const stats = React.useMemo(() => {
    if (filteredEntries.length === 0) return { avgKpm: 0, avgAcc: 0 };
    const totalKpm = filteredEntries.reduce((sum, e) => sum + e.kpm, 0);
    const totalAcc = filteredEntries.reduce((sum, e) => sum + e.accuracy, 0);
    return {
      avgKpm: Math.round(totalKpm / filteredEntries.length),
      avgAcc: Math.round(totalAcc / filteredEntries.length)
    };
  }, [filteredEntries]);

  return (
    <div className="w-full flex flex-col gap-6" id="online-ranking-panel">
      {/* Dynamic Header */}
      <div className="bg-[#090909] border border-[#151515] p-6 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={24} />
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-white font-sans">
              オンラインランキング
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed max-w-xl">
            全国のプレイヤーとタイピングの打鍵速度を競い合うリアルタイム順位表です。練習モード・特訓モード等の完走時に自動または手動でここへスコアが登録されます。
          </p>
        </div>

        <button 
          onClick={fetchRankings}
          disabled={loading}
          className="self-start sm:self-center px-4 py-2 bg-[#121212] hover:bg-[#1b1b1b] border border-[#262626] text-white rounded-lg flex items-center gap-2 text-xs font-mono select-none cursor-pointer duration-150 shrink-0"
        >
          <RefreshCw size={12} className={loading ? "animate-spin text-[#00ff88]" : ""} />
          <span>最新に更新</span>
        </button>
      </div>

      {/* Manual Submission block for quick placement & recovery */}
      {recentKpm && recentKpm > 0 && !submitted && (
        <div className="bg-gradient-to-r from-emerald-950/10 to-black border border-emerald-900/40 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-5 shadow-md">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-emerald-950/30 border border-emerald-800/40 text-[#00ff88] rounded-full flex items-center justify-center font-bold">
              <Star size={22} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                未提出スコアがあります！ / UNREGISTERED RECORD
              </h4>
              <p className="text-xs text-[#00ff88] font-mono mt-0.5 font-bold">
                {recentMode}: {recentKpm} KPM / 正確性 {recentAccuracy}%
              </p>
              <p className="text-[10px] text-neutral-500 font-sans mt-1">
                ニックネームを規定して、全国のリアルタイム順位表に今回のタイピング結果を送信します。
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitScore} className="flex flex-col gap-2 w-full md:w-auto shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="お名前を入力 (最大16文字)"
                maxLength={16}
                required
                className={`bg-[#111] border outline-none text-white text-xs px-3.5 py-2.5 rounded-lg w-full md:w-44 font-mono font-bold transition-colors ${
                  isInappropriateName(nickname)
                    ? "border-red-500 focus:border-red-500"
                    : "border-[#333] focus:border-[#00ff88]"
                }`}
              />
              <button
                type="submit"
                disabled={submitting || !nickname.trim() || isInappropriateName(nickname)}
                className="px-5 py-2.5 bg-[#00ff88] hover:bg-[#1fd183] text-black font-extrabold text-xs uppercase tracking-wider rounded-lg shrink-0 transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? "登録中..." : "送信する"}
              </button>
            </div>
            {isInappropriateName(nickname) && (
              <span className="text-[10px] text-red-500 font-sans font-bold self-start leading-none">
                ⚠️ 使用できない単語が含まれています
              </span>
            )}
          </form>
        </div>
      )}

      {submitted && (
        <div className="bg-[#111] border border-[#2d2d2d] p-4 rounded-xl text-center text-xs text-[#00ff88] font-bold font-mono">
          🎉 スコアが正常にランキングサーバーへ登録されました！
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Leaderboard Table List col-span-8 */}
        <div className="lg:col-span-8 bg-[#090909] border border-[#151515] rounded-xl p-5 shadow-lg flex flex-col gap-4">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-neutral-900 gap-3">
            
            {/* Filter buttons */}
            <div className="flex gap-1 bg-neutral-950 p-1 border border-neutral-900 rounded-lg self-start sm:self-auto select-none scale-95 origin-left">
              <button
                onClick={() => setSelectedFilter("ALL")}
                className={`px-3 py-1 text-[10px] font-bold font-mono rounded cursor-pointer transition-all ${
                  selectedFilter === "ALL" ? "bg-[#1d1d1d] text-[#00ff88]" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                全モード
              </button>
              <button
                onClick={() => setSelectedFilter("PRACTICE")}
                className={`px-3 py-1 text-[10px] font-bold font-mono rounded cursor-pointer transition-all ${
                  selectedFilter === "PRACTICE" ? "bg-[#1d1d1d] text-[#00ff88]" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                練習のみ
              </button>
              <button
                onClick={() => setSelectedFilter("SPECIAL")}
                className={`px-3 py-1 text-[10px] font-bold font-mono rounded cursor-pointer transition-all ${
                  selectedFilter === "SPECIAL" ? "bg-[#1d1d1d] text-[#00ff88]" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                特訓/その他
              </button>
            </div>

            {/* Live Search */}
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={13} />
              <input
                type="text"
                placeholder="プレイヤー名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] border border-neutral-900 focus:border-[#00ff88] text-xs pl-8.5 pr-3 py-2 rounded-lg text-white font-mono outline-none transition-all placeholder:text-neutral-600"
              />
            </div>

          </div>

          {/* Leaderboard Entries List */}
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <RefreshCw size={24} className="animate-spin text-[#00ff88]" />
                <span className="text-xs font-mono text-neutral-500">ランキング読み込み中...</span>
              </div>
            ) : error ? (
              <div className="text-center py-16 px-4">
                <p className="text-xs text-red-400 font-mono italic">{error}</p>
                <button
                  onClick={fetchRankings}
                  className="mt-4 px-4 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-neutral-900 text-white rounded text-xs"
                >
                  読み込みを再試行
                </button>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-20 font-mono text-xs text-neutral-600">
                該当する順位データがありません。
              </div>
            ) : (
              filteredEntries.map((entry, idx) => {
                const isTop3 = idx < 3;
                const colors = [
                  "bg-gradient-to-r from-amber-400 to-yellow-600 text-black border-amber-300 shadow-md shadow-amber-900/10",
                  "bg-gradient-to-r from-slate-200 to-slate-400 text-black border-slate-300",
                  "bg-gradient-to-r from-amber-700 to-amber-800 text-white border-amber-800"
                ];

                const entryDate = entry.timestamp 
                  ? new Date(entry.timestamp).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })
                  : "";

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      entry.name === nickname
                        ? "bg-[#0b1c13] border-emerald-500/30"
                        : "bg-[#111]/30 hover:bg-[#111]/70 border-[#1a1a1a]"
                    }`}
                  >
                    {/* Position and Player info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {isTop3 ? (
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border ${colors[idx]}`}>
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded bg-[#161616] border border-[#222] text-neutral-400 font-mono text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                      )}

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-white truncate max-w-[150px]">
                            {entry.name}
                          </span>
                          {entry.name === nickname && (
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded uppercase font-bold shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                        
                        {/* Mode badge */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-[#777] font-sans font-medium">
                            {entry.mode || "一般"}
                          </span>
                          {entryDate && (
                            <span className="text-[9px] text-neutral-600 font-mono">
                              ・ {entryDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Performance values */}
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right">
                        <span className="text-[9px] text-neutral-600 uppercase block font-mono">SPEED</span>
                        <span className="font-mono text-sm font-black text-[#00ff88]">
                          {entry.kpm} <span className="text-[9px] text-[#00ff88]/60 font-light">KPM</span>
                        </span>
                      </div>

                      <div className="text-right min-w-[50px]">
                        <span className="text-[9px] text-neutral-600 uppercase block font-mono">ACC</span>
                        <span className="font-mono text-xs text-white font-bold">
                          {entry.accuracy}%
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {!loading && filteredEntries.length > 0 && (
            <div className="text-right text-[10px] text-neutral-600 font-serif italic pr-1 mt-1">
              ※ 全国の打鍵データから計測上位を一覧表示しています
            </div>
          )}

        </div>

        {/* Global Statistics/Ranks guide col-span-4 */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Performance summary card */}
          <div className="bg-[#090909] border border-[#151515] rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-neutral-900 pb-2 uppercase tracking-wide">
              <TrendingUp size={14} className="text-indigo-400" />
              <span>本セッションの集計データ</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 font-mono text-center">
              <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-900">
                <span className="text-[9px] text-neutral-500 uppercase block">平均打鍵速度</span>
                <span className="text-xl font-bold text-[#00ff88] mt-1 block">
                  {stats.avgKpm || "—"} <span className="text-xs text-[#00ff88]/60 font-light">KPM</span>
                </span>
              </div>
              <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-900">
                <span className="text-[9px] text-neutral-500 uppercase block">平均正確率</span>
                <span className="text-xl font-bold text-cyan-400 mt-1 block">
                  {stats.avgAcc || "—"}%
                </span>
              </div>
            </div>

            <div className="text-[11px] leading-relaxed text-neutral-500 bg-neutral-950/40 p-3.5 rounded-lg border border-neutral-900/60 font-sans">
              🏆 <span className="font-bold text-neutral-300">スピードの目安:</span>
              <ul className="list-disc pl-4 mt-1.5 space-y-1">
                <li><strong className="text-neutral-400">100-200 KPM</strong>: 基礎・初心卒業期</li>
                <li><strong className="text-neutral-300">200-350 KPM</strong>: 実務レベル・高速打鍵手</li>
                <li><strong className="text-amber-400">350-500 KPM</strong>: タイピング猛者・上位層</li>
                <li><strong className="text-[#00ff88]">500+ KPM</strong>: 神業領域・超絶順位</li>
              </ul>
            </div>
          </div>

          {/* Quick info how to participate */}
          <div className="bg-[#090909] border border-[#151515] rounded-xl p-5 shadow-lg flex flex-col gap-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide border-b border-neutral-900 pb-2">
              <Award size={14} className="text-amber-500" />
              <span>ランキング登録の方法</span>
            </h3>

            <p className="text-[11px] text-[#777] leading-relaxed">
              1. 左側のモード選択から <strong className="text-neutral-300">「練習モード」</strong> もしくは <strong className="text-neutral-300">「特訓モード」</strong> のカテゴリーを選択します。
              <br /><br />
              2. 60秒のタイピング測定を完走してください。
              <br /><br />
              3. 測定終了後、スコア画面に表示される <strong className="text-neutral-300">「ランキングに登録する」</strong> ボタンから、ニックネームを打ち込んで送信してください。
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
