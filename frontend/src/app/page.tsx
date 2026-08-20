
"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { ChatInterface } from "@/components/chat";
import { HexagonPattern } from "@/components/ui/hexagon-pattern";
import { ArrowRight, Lock, Command } from "lucide-react";

// Helper to safely get localStorage on client
function getInitialUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("memorai_user_id");
}

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [inputName, setInputName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    setUserId(getInitialUserId());
  }, []);

  if (!isMounted) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    setIsLoading(true);
    // Simulate brief loading
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newUserId = inputName.trim().toLowerCase().replace(/\s+/g, "_");
    localStorage.setItem("memorai_user_id", newUserId);
    setUserId(newUserId);
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("memorai_user_id");
    setUserId(null);
    setInputName("");
  };

  // Show chat if logged in
  if (userId) {
    return (
      <div className="relative">
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-lg bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/50 text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all"
        >
          Logout ({userId})
        </button>
        <ChatInterface userId={userId} />
      </div>
    );
  }

  // Premium Login screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 sm:p-8 overflow-hidden relative font-sans selection:bg-purple-500/30">
      
      {/* Background Video */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4" type="video/mp4" />
        </video>
        {/* Subtle darkening overlay so text remains readable */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Premium Floating Header */}
      <nav className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between border w-[calc(100%-2rem)] sm:w-full max-w-7xl px-8 py-4 border-slate-700/50 bg-black/40 backdrop-blur-2xl rounded-full text-white text-base shadow-2xl">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/20">
              <Image src="/logo.jpg" alt="Memorai Logo" fill className="object-cover" />
            </div>
            <span className="font-semibold tracking-tight text-lg hidden sm:block">Memorai</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Graph Architecture', 'Privacy'].map((label) => (
              <a key={label} href="#" className="relative overflow-hidden h-6 group text-zinc-300 hover:text-white transition-colors font-medium">
                <span className="block group-hover:-translate-y-full transition-transform duration-300">{label}</span>
                <span className="block absolute top-full left-0 group-hover:translate-y-[-100%] transition-transform duration-300">{label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <a href="https://github.com/memorai" target="_blank" className="border border-slate-600/60 hover:bg-slate-800/60 px-6 py-2.5 rounded-full font-medium transition-colors text-zinc-300 hover:text-white">
            View Source
          </a>
          <button className="bg-white hover:shadow-[0px_0px_30px_10px] shadow-[0px_0px_20px_5px] hover:shadow-white/40 shadow-white/40 text-black px-6 py-2.5 rounded-full font-medium hover:bg-slate-100 transition duration-300 relative z-10">
            Start Session
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px] flex flex-col items-center"
      >
        {/* Logo Profile */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-24 h-24 mb-8 rounded-[2rem] overflow-hidden shadow-2xl shadow-purple-900/20 ring-1 ring-white/10"
        >
          <Image 
            src="/logo.jpg" 
            alt="Memorai Logo" 
            fill 
            className="object-cover"
            priority
          />
        </motion.div>

        {/* Title & Subtitle */}
        <div className="text-center mb-10 space-y-3">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white via-zinc-200 to-zinc-500"
          >
            Welcome to Memorai
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-zinc-400 text-sm tracking-wide max-w-xs mx-auto"
          >
            The intelligent assistant with infinite, graph-powered memory.
          </motion.p>
        </div>

        {/* Glassmorphism Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-full bg-zinc-950/40 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-8 shadow-2xl shadow-black"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">
                Enter your identity
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g., Alex"
                  className="w-full h-14 bg-zinc-900/50 border border-white/10 rounded-2xl px-5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-lg"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!inputName.trim() || isLoading}
              className="w-full h-14 bg-white text-black font-medium text-[15px] rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 hover:scale-[0.98] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <span className="animate-pulse">Connecting...</span>
              ) : (
                <>
                  Initialize Session
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Premium Features List */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/[0.05]">
                <Command className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <span className="text-xs font-medium text-zinc-300">Graph Memory</span>
              <span className="text-[10px] text-zinc-500 leading-tight">Complex relationship tracking</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/[0.05]">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <span className="text-xs font-medium text-zinc-300">End-to-End</span>
              <span className="text-[10px] text-zinc-500 leading-tight">Local-first privacy architecture</span>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-[11px] text-zinc-600 tracking-wider uppercase font-medium"
        >
          Hackathon Edition 2026
        </motion.p>
      </motion.div>
    </div>
  );
}
