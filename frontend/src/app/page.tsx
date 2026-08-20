"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { ChatInterface } from "@/components/chat/chat-interface";
import { HexagonPattern } from "@/components/ui/hexagon-pattern";
import { ArrowRight, Lock, Command, Mail, Key, User } from "lucide-react";

// Helper to safely get localStorage on client
function getInitialUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("memorai_user_id");
}

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [view, setView] = useState<'welcome' | 'signin' | 'signup'>('welcome');
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  React.useEffect(() => {
    setIsMounted(true);
    setUserId(getInitialUserId());
  }, []);

  if (!isMounted) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Fallback pseudo-auth for wireframe
    const newUserId = (name || email.split('@')[0] || "user").trim().toLowerCase().replace(/\s+/g, "_");
    localStorage.setItem("memorai_user_id", newUserId);
    setUserId(newUserId);
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("memorai_user_id");
    setUserId(null);
    setView('welcome');
    setEmail("");
    setPassword("");
    setName("");
  };

  // Show chat if logged in
  if (userId) {
    return (
      <div className="relative">
        {/* We will handle logout inside the new sidebar, but keeping a fallback here just in case */}
        <ChatInterface userId={userId} onLogout={handleLogout} />
      </div>
    );
  }

  // Premium Auth screen
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
        <div className="absolute inset-0 bg-black/40" />
      </div>

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
          className="relative w-24 h-24 mb-6 rounded-[2rem] overflow-hidden shadow-2xl shadow-purple-900/20 ring-1 ring-white/10"
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
        <div className="text-center mb-8 space-y-3">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white via-zinc-200 to-zinc-500"
          >
            {view === 'welcome' ? 'Memorai' : view === 'signin' ? 'Welcome back' : 'Create your account'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-zinc-400 text-sm tracking-wide max-w-xs mx-auto"
          >
            {view === 'welcome' ? 'An AI that actually remembers you.' : 'Your conversations. Your memory. Your AI.'}
          </motion.p>
        </div>

        {/* Glassmorphism Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-full bg-zinc-950/40 backdrop-blur-2xl rounded-3xl border border-white/[0.08] p-8 shadow-2xl shadow-black overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {view === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setView('signin')}
                  className="w-full h-14 bg-white text-black font-medium text-[15px] rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 hover:scale-[0.98] active:scale-95 transition-all group"
                >
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setView('signup')}
                  className="w-full h-14 bg-transparent border border-white/20 text-white font-medium text-[15px] rounded-2xl flex items-center justify-center gap-2 hover:bg-white/5 hover:scale-[0.98] active:scale-95 transition-all"
                >
                  Sign Up
                </button>
              </motion.div>
            )}

            {view === 'signin' && (
              <motion.form
                key="signin"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleAuth}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full h-14 bg-zinc-900/50 border border-white/10 rounded-2xl pl-12 pr-5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-14 bg-zinc-900/50 border border-white/10 rounded-2xl pl-12 pr-5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 mt-2 bg-white text-black font-medium text-[15px] rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 hover:scale-[0.98] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In'}
                </button>
                <div className="text-center mt-6">
                  <button type="button" className="text-sm text-zinc-400 hover:text-white transition-colors mb-2 block w-full">Forgot Password?</button>
                  <button type="button" onClick={() => setView('signup')} className="text-sm text-zinc-400 hover:text-white transition-colors">Don't have an account? Sign Up</button>
                </div>
              </motion.form>
            )}

            {view === 'signup' && (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleAuth}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Doe"
                      className="w-full h-12 bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full h-12 bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 mt-4 bg-white text-black font-medium text-[15px] rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 hover:scale-[0.98] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
                <div className="text-center mt-4">
                  <button type="button" onClick={() => setView('signin')} className="text-sm text-zinc-400 hover:text-white transition-colors">Already have an account? Sign In</button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
