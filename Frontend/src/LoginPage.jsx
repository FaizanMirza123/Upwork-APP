import { useState, useRef, useEffect } from "react";
import {
  Package, Lock, User, Eye, EyeOff, ArrowRight,
  Shield, KeyRound, Copy, Check, Sparkles,
} from "lucide-react";
import { login } from "./api";

const DEMO_CREDENTIALS = [
  { username: "admin", password: "admin123", role: "Admin", desc: "Full access to all features" },
  { username: "demo", password: "demo123", role: "Viewer", desc: "Read-only demo account" },
];

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const usernameRef = useRef(null);

  useEffect(() => { usernameRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      await login(username.trim(), password);
      onLogin();
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (cred) => {
    setUsername(cred.username);
    setPassword(cred.password);
    setError("");
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">

      {/* ─── Left: Login Form ─────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Package size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Order Manager</h1>
              <p className="text-xs text-gray-400">Manage your orders with ease</p>
            </div>
          </div>

          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={usernameRef}
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 animate-fade-in-up">
                <Shield size={16} className="text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-violet-500 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-primary-500/25 transition-all duration-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Quick fill hint */}
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            Use the demo credentials on the right to sign in quickly
          </p>
        </div>
      </div>

      {/* ─── Right: Credentials Panel ─────────────── */}
      <div className="hidden lg:flex w-[480px] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-primary-900 to-violet-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6TTAgMGgydjM0SDB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="absolute top-20 -right-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-10 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center p-10 w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-medium text-white/70 mb-4">
              <Sparkles size={12} className="text-amber-400" />
              Demo Credentials
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Quick Access</h2>
            <p className="text-sm text-white/50">Click any card below to auto-fill the login form with those credentials.</p>
          </div>

          {/* Credential Cards */}
          <div className="space-y-4">
            {DEMO_CREDENTIALS.map((cred) => (
              <div
                key={cred.username}
                onClick={() => fillCredentials(cred)}
                className="group relative bg-white/[0.07] backdrop-blur-md border border-white/10 rounded-2xl p-5 cursor-pointer hover:bg-white/[0.12] hover:border-white/20 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Role badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cred.role === "Admin" ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-blue-400 to-cyan-500"}`}>
                      <Shield size={14} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{cred.role}</div>
                      <div className="text-[11px] text-white/40">{cred.desc}</div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Credentials */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between bg-black/20 rounded-lg px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <User size={13} className="text-white/40" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Username</div>
                        <div className="text-sm font-mono font-medium text-white/90">{cred.username}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(cred.username, `${cred.username}-user`); }}
                      className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                      title="Copy username"
                    >
                      {copied === `${cred.username}-user` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-white/50" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-black/20 rounded-lg px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <KeyRound size={13} className="text-white/40" />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Password</div>
                        <div className="text-sm font-mono font-medium text-white/90">{cred.password}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(cred.password, `${cred.username}-pass`); }}
                      className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                      title="Copy password"
                    >
                      {copied === `${cred.username}-pass` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-white/50" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center gap-2 text-[11px] text-white/30">
            <Lock size={11} />
            <span>Credentials are for demonstration purposes only</span>
          </div>
        </div>
      </div>

      {/* ─── Mobile: Credentials below form (lg hidden) ────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-50">
        <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sparkles size={11} className="text-amber-400" /> Quick Login
        </p>
        <div className="flex gap-2">
          {DEMO_CREDENTIALS.map((cred) => (
            <button
              key={cred.username}
              onClick={() => fillCredentials(cred)}
              className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.07] border border-white/10 hover:bg-white/[0.12] transition"
            >
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${cred.role === "Admin" ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-blue-400 to-cyan-500"}`}>
                <Shield size={12} className="text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white">{cred.role}</div>
                <div className="text-[10px] text-white/40 font-mono">{cred.username}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
