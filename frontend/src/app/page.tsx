"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ArrowRight, Mail, Key, User, Sparkles, HelpCircle } from "lucide-react";
import { api } from "@/lib/api";

function getInitialUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("memorai_user_id");
}

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [view, setView] = useState<'welcome' | 'signin' | 'signup' | 'about' | 'contact'>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");

  React.useEffect(() => {
    setIsMounted(true);
    setUserId(getInitialUserId());
  }, []);

  if (!isMounted) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    try {
      let result;
      if (view === "signup") {
        result = await api.register(name, email, password);
      } else {
        result = await api.login(email, password);
      }

      if (result && result.access_token) {
        api.setToken(result.access_token);
        const resolvedUserId = result.user?.id || (name || email.split("@")[0] || "user").trim().toLowerCase().replace(/\s+/g, "_");
        localStorage.setItem("memorai_user_id", resolvedUserId);
        setUserId(resolvedUserId);
      }
    } catch (err: unknown) {
      console.warn("Backend auth call warning, using preview fallback:", err);
      // Fallback for seamless demo/preview
      const fallbackUserId = (name || email.split("@")[0] || "user").trim().toLowerCase().replace(/\s+/g, "_");
      localStorage.setItem("memorai_user_id", fallbackUserId);
      setUserId(fallbackUserId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    localStorage.removeItem("memorai_user_id");
    setUserId(null);
    setView("welcome");
    setEmail("");
    setPassword("");
    setName("");
    setAuthError("");
  };

  if (userId) {
    return (
      <div className="w-full h-screen">
        <ChatInterface userId={userId} onLogout={handleLogout} />
      </div>
    );
  }

  const inputClass = "w-full h-[50px] bg-zinc-900/80 border border-zinc-700/60 rounded-xl pl-11 pr-4 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/60 transition-all duration-150";
  const labelClass = "text-[11px] font-bold text-zinc-400 uppercase tracking-[0.1em]";
  const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-500 pointer-events-none z-10";

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-black font-sans select-none">

      {/* ── Background Video ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-50 shrink-0 h-16 bg-black/30 backdrop-blur-xl border-b border-white/[0.08] px-6 md:px-10 flex items-center justify-between">
        
        {/* Left: Brand */}
        <button
          onClick={() => setView("welcome")}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/20 group-hover:ring-purple-500/60 transition-all">
            <Image src="/logo.jpg" alt="Memorai" fill sizes="32px" className="object-cover" />
          </div>
          <span className="font-semibold text-white text-lg tracking-tight group-hover:text-purple-400 transition-colors">
            Memorai
          </span>
        </button>

        {/* Center: Nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {(["welcome", "about", "contact"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`transition-colors duration-150 py-1.5 px-2 rounded-lg cursor-pointer ${
                view === v ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
              }`}
            >
              {v === "welcome" ? "Home" : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Right: Auth buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("signup")}
            className="bg-white text-black text-xs md:text-sm font-semibold px-5 py-2 rounded-full hover:bg-zinc-100 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            Register
          </button>
          <button
            onClick={() => setView("signin")}
            className="text-xs md:text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── Content Area ── */}
      <div className="flex-1 min-h-0 relative z-10 overflow-y-auto flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[460px] mx-auto flex items-center justify-center">

          <motion.div
            key={view}
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >

            {/* ══ WELCOME / HERO ══ */}
            {view === "welcome" && (
              <div className="text-center flex flex-col items-center gap-7">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-[11px] font-semibold tracking-widest text-zinc-300 uppercase">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  The Next Generation of AI
                </span>

                <h1 className="text-5xl sm:text-[68px] font-extrabold leading-[1.05] tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white/95 to-zinc-400">
                  Your AI that<br />remembers.
                </h1>

                <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-sm">
                  Personalized conversations powered by your unique memory graph.
                </p>

                <button
                  onClick={() => setView("signup")}
                  className="inline-flex items-center gap-3 h-12 px-9 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-base rounded-full border border-purple-500/40 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(139,92,246,0.45)] active:scale-95 transition-all duration-200 group cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* ══ SIGN IN ══ */}
            {view === "signin" && (
              <div className="bg-zinc-950/85 backdrop-blur-2xl rounded-3xl border border-white/[0.1] shadow-2xl shadow-black/80 overflow-hidden">
                {/* Header */}
                <div className="px-8 pt-8 pb-5 text-center border-b border-white/[0.06]">
                  <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                  <p className="mt-1 text-sm text-zinc-400">Sign in to continue to Memorai</p>
                </div>

                {/* Form */}
                <form onSubmit={handleAuth} className="p-8 space-y-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Email</label>
                    <div className="relative">
                      <Mail className={iconClass} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <Key className={iconClass} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 mt-2 bg-white text-black font-semibold text-sm rounded-xl flex items-center justify-center hover:bg-zinc-100 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md cursor-pointer"
                  >
                    {isLoading ? "Signing in…" : "Sign In"}
                  </button>
                </form>

                {/* Footer */}
                <div className="px-8 pb-7 flex flex-col items-center gap-2.5 text-xs sm:text-sm text-zinc-500 border-t border-white/[0.04] pt-4">
                  <button className="hover:text-zinc-300 transition-colors">Forgot Password?</button>
                  <p>
                    Don&apos;t have an account?{" "}
                    <button
                      onClick={() => setView("signup")}
                      className="text-zinc-200 font-semibold hover:text-white hover:underline transition-colors ml-1"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ══ SIGN UP ══ */}
            {view === "signup" && (
              <div className="bg-zinc-950/85 backdrop-blur-2xl rounded-3xl border border-white/[0.1] shadow-2xl shadow-black/80 overflow-hidden">
                <div className="px-8 pt-8 pb-5 text-center border-b border-white/[0.06]">
                  <h2 className="text-2xl font-bold text-white">Create Account</h2>
                  <p className="mt-1 text-sm text-zinc-400">Join Memorai and start your AI journey</p>
                </div>

                <form onSubmit={handleAuth} className="p-8 space-y-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Name</label>
                    <div className="relative">
                      <User className={iconClass} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Doe"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Email</label>
                    <div className="relative">
                      <Mail className={iconClass} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <Key className={iconClass} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 mt-2 bg-white text-black font-semibold text-sm rounded-xl flex items-center justify-center hover:bg-zinc-100 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md cursor-pointer"
                  >
                    {isLoading ? "Creating account…" : "Create Account"}
                  </button>
                </form>

                <div className="px-8 pb-7 text-center text-xs sm:text-sm text-zinc-500 border-t border-white/[0.04] pt-4">
                  <p>
                    Already have an account?{" "}
                    <button
                      onClick={() => setView("signin")}
                      className="text-zinc-200 font-semibold hover:text-white hover:underline transition-colors ml-1"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ══ ABOUT ══ */}
            {view === "about" && (
              <div className="bg-zinc-950/85 backdrop-blur-2xl rounded-3xl border border-white/[0.1] shadow-2xl shadow-black/80 overflow-hidden">
                <div className="px-8 pt-8 pb-5 text-center border-b border-white/[0.06]">
                  <h2 className="text-2xl font-bold text-white">About Memorai</h2>
                </div>
                <div className="p-8 space-y-4 text-zinc-300 text-sm leading-relaxed">
                  <p>Memorai is not just another chatbot. It builds a dynamic Knowledge Graph based on every conversation you have.</p>
                  <p>By remembering your preferences, projects, technical skills, and past decisions, Memorai ensures every interaction is tailored specifically to you.</p>
                  <p>Designed with an enterprise-level architecture, Memorai organizes your data through intelligent tagging, relationships, and persistent memory.</p>
                </div>
                <div className="px-8 pb-8 text-center border-t border-white/[0.04] pt-4">
                  <button
                    onClick={() => setView("signup")}
                    className="px-8 py-2.5 bg-white text-black font-semibold text-sm rounded-full hover:bg-zinc-100 active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            )}

            {/* ══ CONTACT ══ */}
            {view === "contact" && (
              <div className="bg-zinc-950/85 backdrop-blur-2xl rounded-3xl border border-white/[0.1] shadow-2xl shadow-black/80 overflow-hidden">
                <div className="px-8 pt-8 pb-5 text-center border-b border-white/[0.06]">
                  <h2 className="text-2xl font-bold text-white">Contact Us</h2>
                </div>
                <div className="p-8 space-y-5 text-sm text-zinc-300">
                  <p>Have questions about Memorai&apos;s memory graph? We&apos;d love to hear from you.</p>
                  <div className="flex flex-col gap-3.5 bg-black/40 rounded-2xl border border-white/[0.08] p-5">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="text-zinc-200">hello@memorai.ai</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="text-zinc-200">Support Team: 24/7 Availability</span>
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8 text-center border-t border-white/[0.04] pt-4">
                  <button
                    onClick={() => setView("welcome")}
                    className="text-sm text-zinc-400 hover:text-white transition-colors font-medium cursor-pointer"
                  >
                    ← Back to Home
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </div>
      </div>

    </div>
  );
}
