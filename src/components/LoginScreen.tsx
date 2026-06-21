import React, { useState } from "react";
import { 
  Keyboard, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Loader,
  AlertCircle
} from "lucide-react";
import { isInappropriateName } from "../utils/validation";

interface LoginScreenProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "guest">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (activeTab === "guest") {
      if (!name.trim()) {
        setError("お名前 (ニックネーム) を入力してください。");
        return;
      }
      if (name.length > 16) {
        setError("ニックネームは16文字以内で入力してください。");
        return;
      }
      if (isInappropriateName(name)) {
        setError("ニックネームに不適切な単語が含まれています。");
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError("すべての項目を入力してください。");
        return;
      }

      if (activeTab === "register") {
        if (!name.trim()) {
          setError("お名前 (ニックネーム) を入力してください。");
          return;
        }
        if (name.length > 16) {
          setError("ニックネームは16文字以内で入力してください。");
          return;
        }
        if (isInappropriateName(name)) {
          setError("ニックネームに不適切な単語が含まれています。");
          return;
        }
      }
    }

    setLoading(true);
    try {
      let endpoint = "/api/auth/login";
      let payload: any = {};

      if (activeTab === "guest") {
        endpoint = "/api/auth/guest";
        payload = { name: name.trim() };
      } else if (activeTab === "register") {
        endpoint = "/api/auth/register";
        payload = { name: name.trim(), email: email.trim(), password };
      } else {
        endpoint = "/api/auth/login";
        payload = { email: email.trim(), password };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "認証に失敗しました。詳細をご確認ください。");
      }

      // Save credentials & notify parent
      localStorage.setItem("glyph_type_token", data.token);
      localStorage.setItem("glyph_type_nickname", data.user.name);
      onLoginSuccess(data.user, data.token);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "接続エラー。再試行してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col justify-center items-center p-4 selection:bg-[#00ff88]/30">
      
      {/* Background visual style grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#111_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-45"></div>
      
      {/* Container */}
      <div className="w-full max-w-sm z-10">
        
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-neutral-900 border border-neutral-800 rounded-2xl mb-4 group hover:border-[#00ff88]/30 transition-all duration-300">
            <Keyboard size={36} className="text-[#00ff88] group-hover:scale-105 transition-transform" />
          </div>
          <h1 className="text-3xl font-black font-shingo tracking-tighter text-white select-none">
            -2-55Typing
          </h1>
          <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase mt-1">
            TYPING PERFORMANCE LABORATORY
          </p>
        </div>

        {/* Card Frame */}
        <div className="bg-[#0b0b0b] border border-[#1b1b1b] rounded-2xl p-6.5 shadow-2xl relative overflow-hidden">
          
          {/* Neon side accents */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00ff88]/30 to-transparent"></div>

          {/* Three-way Tab Selection */}
          <div className="grid grid-cols-3 bg-[#050505] border border-neutral-900 rounded-lg p-1 mb-6 text-[10px] font-bold">
            <button
              onClick={() => {
                setActiveTab("login");
                setError("");
              }}
              className={`py-2 rounded-md transition-colors cursor-pointer ${
                activeTab === "login" 
                  ? "bg-[#181818] text-white shadow font-extrabold" 
                  : "text-[#555] hover:text-[#aaa]"
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setError("");
              }}
              className={`py-2 rounded-md transition-colors cursor-pointer ${
                activeTab === "register" 
                  ? "bg-[#181818] text-white shadow font-extrabold" 
                  : "text-[#555] hover:text-[#aaa]"
              }`}
            >
              新規登録
            </button>
            <button
              onClick={() => {
                setActiveTab("guest");
                setError("");
              }}
              className={`py-2 rounded-md transition-colors cursor-pointer ${
                activeTab === "guest" 
                  ? "bg-[#1aa86d] text-white shadow font-extrabold" 
                  : "text-[#555] hover:text-[#00ff88]"
              }`}
            >
              ゲストプレイ
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 rounded-lg text-[11px] font-sans font-bold flex items-center gap-2 mb-5.5 leading-snug">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nickname / Name (Register & Guest Options) */}
            {(activeTab === "register" || activeTab === "guest") && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-wider font-mono">
                  {activeTab === "guest" ? "ゲストネーム / GUEST NICKNAME" : "ニックネーム / NICKNAME"}
                </label>
                <div className="relative">
                  <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={activeTab === "guest" ? "ゲスト用のニックネームを入力" : "タイパーネームを入力 (16文字以内)"}
                    maxLength={16}
                    required
                    className="bg-[#050505] border border-neutral-850 focus:border-[#00ff88] outline-none text-white text-xs pl-9 pr-3.5 py-3 w-full rounded-lg font-bold transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email (Login & Register Ony) */}
            {activeTab !== "guest" && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-wider font-mono">
                  メールアドレス / EMAIL
                </label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="bg-[#050505] border border-neutral-850 focus:border-[#00ff88] outline-none text-white text-xs pl-9 pr-3.5 py-3 w-full rounded-lg font-bold transition-all"
                  />
                </div>
              </div>
            )}

            {/* Password (Login & Register Only) */}
            {activeTab !== "guest" && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#555] uppercase tracking-wider font-mono">
                  パスワード / PASSWORD
                </label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-[#050505] border border-neutral-850 focus:border-[#00ff88] outline-none text-white text-xs pl-9 pr-10 py-3 w-full rounded-lg font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer mt-6 ${
                activeTab === "guest" 
                  ? "bg-[#00ff88] hover:bg-[#1fd183] border border-[#00ff88]/30 shadow-[0_0_15px_rgba(0,255,136,0.15)]"
                  : "bg-white hover:bg-neutral-200"
              }`}
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>認証セッション起動中...</span>
                </>
              ) : (
                <span>
                  {activeTab === "guest" 
                    ? "登録なしで体験を開始" 
                    : activeTab === "register" 
                      ? "アカウント作成して開始" 
                      : "ログインして開始"
                  }
                </span>
              )}
            </button>
          </form>

        </div>

        {/* Outer instructions */}
        <p className="text-center text-[10px] text-neutral-600 mt-6 font-mono">
          © 2026 -2-55Typing CO. // ALL RIGHTS RESERVED
        </p>
      </div>
    </div>
  );
}
