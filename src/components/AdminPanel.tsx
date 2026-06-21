import React, { useState, useEffect } from "react";
import { 
  X, 
  Trash2, 
  Users, 
  Trophy, 
  BarChart3, 
  ShieldAlert,
  Loader,
  RefreshCw,
  Search,
  Settings,
  Ban,
  Activity,
  AlertTriangle
} from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isBanned?: boolean;
  createdAt: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  kpm: number;
  accuracy: number;
  mode: string;
  timestamp: string;
}

interface AdminPanelProps {
  token: string;
  onClose: () => void;
}

export function AdminPanel({ token, onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"scores" | "users" | "settings">("scores");

  // System Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [customAnnouncement, setCustomAnnouncement] = useState("");
  const [minKpmForLeaderboard, setMinKpmForLeaderboard] = useState(0);
  const [maxKpmLimit, setMaxKpmLimit] = useState(1200);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch users
      const usersRes = await fetch("/api/admin/users", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!usersRes.ok) {
        throw new Error("ユーザーデータの取得に失敗しました。");
      }
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Fetch leaderboard
      const leaderboardRes = await fetch("/api/leaderboard");
      if (!leaderboardRes.ok) {
        throw new Error("ランキングデータの取得に失敗しました。");
      }
      const scoresData = await leaderboardRes.json();
      setScores(scoresData);

      // Fetch settings
      const settingsRes = await fetch("/api/admin/settings", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setMaintenanceMode(!!settingsData.maintenanceMode);
        setCustomAnnouncement(settingsData.customAnnouncement || "");
        setMinKpmForLeaderboard(Number(settingsData.minKpmForLeaderboard || 0));
        setMaxKpmLimit(Number(settingsData.maxKpmLimit || 1200));
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "管理者データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("このユーザーを完全に削除しますか？アカウントのすべてのデータが失われます。")) return;
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ユーザーの削除に失敗しました。");
      }
      setSuccessMsg("ユーザーアカウントを削除しました。");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBanToggle = async (userId: string, currentBanStatus: boolean) => {
    const actionName = currentBanStatus ? "凍結解除 (UNBAN)" : "凍結 (BAN)";
    if (!window.confirm(`このユーザーを本当に${actionName}しますか？`)) return;
    setError("");
    setSuccessMsg("");
    try {
      const endpoint = currentBanStatus 
        ? `/api/admin/users/${userId}/unban` 
        : `/api/admin/users/${userId}/ban`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "凍結操作に失敗しました。");
      }
      setSuccessMsg(`ユーザーを${actionName}しました。`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          maintenanceMode,
          customAnnouncement,
          minKpmForLeaderboard: Number(minKpmForLeaderboard),
          maxKpmLimit: Number(maxKpmLimit)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "設定の保存に失敗しました。");
      }
      setSuccessMsg("システム設定の変更を保存しました。");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleDeleteScore = async (entryId: string) => {
    if (!window.confirm("このスコア記録をランキングから削除しますか？")) return;
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/admin/leaderboard/${entryId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "スコアの削除に失敗しました。");
      }
      setSuccessMsg("スコアを削除しました。");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter systems
  const filteredScores = scores.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.mode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics calculation
  const totalRegisteredUsers = users.length;
  const adminCount = users.filter(u => u.isAdmin).length;
  const averageKpm = scores.length > 0 
    ? Math.round(scores.reduce((sum, s) => sum + s.kpm, 0) / scores.length) 
    : 0;
  const highestKpm = scores.length > 0 
    ? Math.max(...scores.map(s => s.kpm)) 
    : 0;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-xl">
      <div className="bg-[#0b0b0b] border border-[#222] rounded-2xl w-full max-w-5xl shadow-2xl p-6 relative flex flex-col gap-6 max-h-[90vh] overflow-hidden">
        
        {/* Header decoration bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-t-2xl"></div>

        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-950/20 border border-red-500/40 rounded-xl text-red-400">
              <ShieldAlert size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">-2-55Typing 管理者コントロールパネル</h1>
              <p className="text-[10px] text-neutral-500 font-mono">AUTHORIZED ACCESS ONLY // ADMIN: ozakirikito8795@gmail.com</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 bg-[#121212] hover:bg-[#1c1c1c] border border-neutral-800 hover:border-neutral-700 text-white rounded-lg transition-colors cursor-pointer"
              title="リフレッシュ"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-[#121212] hover:bg-[#1c1c1c] border border-neutral-800 hover:border-red-500/50 text-white hover:text-red-400 rounded-lg transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Core Admin Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#111]/50 border border-neutral-900 rounded-xl p-4">
          <div className="flex flex-col">
            <span className="text-[9px] text-[#555] font-bold uppercase tracking-wider font-mono">総登録ユーザー数</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-white">{totalRegisteredUsers}</span>
              <span className="text-[10px] text-neutral-600 font-bold">名</span>
            </div>
          </div>
          <div className="flex flex-col border-l border-neutral-900/40 pl-4">
            <span className="text-[9px] text-[#555] font-bold uppercase tracking-wider font-mono">管理者アカウント</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-amber-500">{adminCount}</span>
              <span className="text-[10px] text-neutral-600 font-bold">名</span>
            </div>
          </div>
          <div className="flex flex-col border-l border-neutral-900/40 pl-4">
            <span className="text-[9px] text-[#555] font-bold uppercase tracking-wider font-mono">平均打鍵速度</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-emerald-400">{averageKpm}</span>
              <span className="text-[10px] text-neutral-600 font-bold">KPM</span>
            </div>
          </div>
          <div className="flex flex-col border-l border-neutral-900/40 pl-4">
            <span className="text-[9px] text-[#555] font-bold uppercase tracking-wider font-mono">最高打鍵速度記録</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-cyan-400">{highestKpm}</span>
              <span className="text-[10px] text-neutral-600 font-bold">KPM</span>
            </div>
          </div>
        </div>

        {/* Message Logs */}
        {error && (
          <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-bold">
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs text-center font-bold">
            🎉 {successMsg}
          </div>
        )}

        {/* Search, Filter Tabs and Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-900 pb-4">
          <div className="flex bg-[#121212] border border-neutral-900 rounded-lg p-1 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab("scores")}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold w-full sm:w-auto transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "scores"
                  ? "bg-[#222] text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Trophy size={13} />
              <span>スコア管理</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold w-full sm:w-auto transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "users"
                  ? "bg-[#222] text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Users size={13} />
              <span>ユーザー管理</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold w-full sm:w-auto transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "settings"
                  ? "bg-[#222] text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Settings size={13} />
              <span>システム設定</span>
            </button>
          </div>

          {activeTab !== "settings" && (
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
              <input
                type="text"
                placeholder={activeTab === "scores" ? "登録者名やモードで検索..." : "お名前やメールで検索..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#111] border border-neutral-800 text-white text-xs pl-9 pr-3 py-2 w-full rounded-lg outline-none focus:border-[#00ff88] transition-colors"
              />
            </div>
          )}
        </div>

        {/* List Tables / Settings Forms Area */}
        <div className="flex-grow overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader className="animate-spin text-neutral-500" size={24} />
              <span className="text-xs text-neutral-500">データを読み込み中...</span>
            </div>
          ) : activeTab === "scores" ? (
            /* Leaderboards Management Tab */
            filteredScores.length === 0 ? (
              <div className="text-center py-20 text-xs text-neutral-600 font-mono">
                検索条件に合致するスコア記録が見つかりません。
              </div>
            ) : (
              <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-[#111] text-[#777] uppercase font-mono tracking-wider text-[10px] border-b border-[#222]">
                    <tr>
                      <th className="p-3.5 pl-4">順位 / Player</th>
                      <th className="p-3.5">コース</th>
                      <th className="p-3.5">速度 (KPM)</th>
                      <th className="p-3.5">正確性</th>
                      <th className="p-3.5">日時</th>
                      <th className="p-3.5 text-right pr-4">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181818]">
                    {filteredScores.map((score, index) => (
                      <tr key={score.id} className="hover:bg-[#111]/30 table-row transition-all">
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded bg-[#161616] border border-[#222] text-[#888] font-mono text-[9px] flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <span className="font-bold text-white max-w-[150px] truncate">
                              {score.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9.5px]">
                            {score.mode}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-emerald-400 font-mono">
                          {score.kpm}
                        </td>
                        <td className="p-3.5 font-mono">
                          {score.accuracy}%
                        </td>
                        <td className="p-3.5 text-neutral-500 font-mono text-[10px]">
                          {new Date(score.timestamp).toLocaleString("ja-JP")}
                        </td>
                        <td className="p-3.5 text-right pr-4">
                          <button
                            onClick={() => handleDeleteScore(score.id)}
                            className="p-1 px-2.5 bg-red-950/20 hover:bg-red-900 border border-red-955 hover:border-red-500/50 text-red-400 hover:text-white rounded text-[10px] duration-150 inline-flex items-center gap-1 cursor-pointer font-sans"
                          >
                            <Trash2 size={10} />
                            <span>削除</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === "users" ? (
            /* Users Management Tab */
            filteredUsers.length === 0 ? (
              <div className="text-center py-20 text-xs text-neutral-600 font-mono">
                検索条件に合致するユーザーアカウントがありません。
              </div>
            ) : (
              <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-[#111] text-[#777] uppercase font-mono tracking-wider text-[10px] border-b border-[#222]">
                    <tr>
                      <th className="p-3.5 pl-4">ユーザーID / お名前</th>
                      <th className="p-3.5">メールアドレス</th>
                      <th className="p-3.5">ステータス / 権限</th>
                      <th className="p-3.5">登録日時</th>
                      <th className="p-3.5 text-right pr-4">各種コントロール</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181818]">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className={`hover:bg-[#111]/30 table-row transition-all ${user.isBanned ? "bg-red-950/5" : ""}`}>
                        <td className="p-3.5 pl-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              {user.name}
                              {user.isBanned && (
                                <span className="px-1.5 py-0.2 bg-red-500/10 border border-red-500/30 text-red-500 text-[8px] tracking-tight rounded">
                                  凍結 (BAN)
                                </span>
                              )}
                            </span>
                            <span className="text-[8.5px] font-mono text-neutral-500">{user.id}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono select-all">
                          {user.email}
                        </td>
                        <td className="p-3.5">
                          {user.isAdmin ? (
                            <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-600/40 text-amber-500 text-[9.5px] font-bold">
                              サイト管理者
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-500 text-[9.5px]">
                              一般会員
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-neutral-500 font-mono text-[10px]">
                          {new Date(user.createdAt).toLocaleString("ja-JP")}
                        </td>
                        <td className="p-3.5 text-right pr-4">
                          <div className="flex items-center justify-end gap-2 shrink-0">
                            {/* Ban / Unban Toggle Button */}
                            <button
                              onClick={() => handleBanToggle(user.id, !!user.isBanned)}
                              disabled={user.email === "ozakirikito8795@gmail.com" || user.id === "admin_user"}
                              className={`p-1 px-2.5 border rounded text-[10px] duration-150 inline-flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
                                user.isBanned
                                  ? "bg-emerald-950/20 hover:bg-emerald-900 border-emerald-900 hover:border-emerald-500/50 text-emerald-400 hover:text-white"
                                  : "bg-amber-950/20 hover:bg-amber-900 border-amber-950 hover:border-amber-500/50 text-amber-400 hover:text-white"
                              }`}
                            >
                              <Ban size={10} />
                              <span>{user.isBanned ? "凍結解除" : "凍結 (BAN)"}</span>
                            </button>

                            {/* Delete User Button */}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.email === "ozakirikito8795@gmail.com" || user.id === "admin_user"}
                              className="p-1 px-2.5 bg-red-950/10 hover:bg-red-900 border border-red-955 hover:border-red-500/50 text-red-500 hover:text-white rounded text-[10px] duration-150 inline-flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <Trash2 size={10} />
                              <span>アカウント完全削除</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* System Settings Tab UI */
            <form onSubmit={handleSaveSettings} className="bg-[#111]/40 border border-neutral-900/80 rounded-xl p-6 max-w-2xl mx-auto flex flex-col gap-6">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-900 pb-3">
                <Settings size={16} className="text-[#00ff88]" />
                <span>タイピングシステム基本設定</span>
              </h2>

              {/* Maintenance Toggle */}
              <div className="flex items-center justify-between bg-black/30 border border-neutral-900 p-4 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">メンテナンスモード</span>
                  <span className="text-[10px] text-neutral-500 mt-1">有効にすると一般の参加メンバーはタイピング練習やログイン・スコア登録が制限されます。</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
                </label>
              </div>

              {/* Announcement Block */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-400">システム告知アナウンスメント (サイト最上部でスクロール表示)</label>
                <textarea
                  value={customAnnouncement}
                  onChange={(e) => setCustomAnnouncement(e.target.value)}
                  className="bg-black/40 border border-neutral-800 text-neutral-200 text-xs px-3 py-2 w-full rounded-lg outline-none focus:border-[#00ff88] transition-colors min-h-[80px]"
                  placeholder="ユーザーに表示する告知文（空白にすると非表示になります）"
                />
              </div>

              {/* Anti-cheat & Leaderboard criteria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-neutral-400">スコア登録最低KPM基準</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={minKpmForLeaderboard}
                      onChange={(e) => setMinKpmForLeaderboard(Number(e.target.value))}
                      className="bg-black/40 border border-neutral-800 text-white text-xs px-3 py-2 w-full rounded-lg outline-none focus:border-[#00ff88] transition-colors pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-mono font-bold">KPM 以上</span>
                  </div>
                  <span className="text-[9px] text-neutral-500">これより遅いスコアはリーダーボードに掲載されません（スパム対策用）</span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-neutral-400">スコア上限リミッター (チート対策閾値)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={100}
                      max={3000}
                      value={maxKpmLimit}
                      onChange={(e) => setMaxKpmLimit(Number(e.target.value))}
                      className="bg-black/40 border border-neutral-800 text-white text-xs px-3 py-2 w-full rounded-lg outline-none focus:border-[#00ff88] transition-colors pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-mono font-bold">KPM 以下</span>
                  </div>
                  <span className="text-[9px] text-neutral-500">これより速いスコアは自動的にハックとみなして検出を遮断します</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={settingsSaving}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-[#00ff88] to-[#00b3ff] hover:brightness-110 active:scale-[0.99] text-black font-black text-xs uppercase tracking-wider rounded-lg transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {settingsSaving ? (
                  <>
                    <Loader className="animate-spin text-black" size={13} />
                    <span>変更内容を保存中...</span>
                  </>
                ) : (
                  <>
                    <Settings size={13} />
                    <span>システム構成をアップデートする</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
