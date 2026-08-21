"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { ChatInterface } from "@/components/chat/chat-interface";
import {
  ArrowRight,
  Mail,
  Key,
  User,
  Brain,
  Shield,
  Zap,
  Globe,
  MessageSquare,
  Layers,
  Send,
  CheckCircle,
  Menu,
  X,
} from "lucide-react";
import { api } from "@/lib/api";

/* â”€â”€â”€ Feature card data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const features = [
  {
    icon: Brain,
    title: "Persistent Memory",
    description:
      "Unlike ordinary chatbots, Memorai builds a living Knowledge Graph from every conversation â€” so it never forgets what matters to you.",
    color: "from-purple-500/20 to-indigo-500/10",
    iconColor: "text-purple-400",
    border: "border-purple-500/20",
  },
  {
    icon: Zap,
    title: "Instant Context",
    description:
      "Skip the repetitive introductions. Memorai knows your projects, preferences, and past decisions the moment you start typing.",
    color: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-400",
    border: "border-amber-500/20",
  },
  {
    icon: Shield,
    title: "Private by Design",
    description:
      "Your memory graph is yours alone. End-to-end encryption and granular privacy controls keep your data safe and under your control.",
    color: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  {
    icon: Layers,
    title: "Intelligent Tagging",
    description:
      "Automatically organises your knowledge into topics, skills, and relationships â€” making every future conversation smarter.",
    color: "from-sky-500/20 to-blue-500/10",
    iconColor: "text-sky-400",
    border: "border-sky-500/20",
  },
  {
    icon: Globe,
    title: "Enterprise Grade",
    description:
      "Built on a scalable, distributed architecture designed to handle teams and organisations of any size without compromise.",
    color: "from-pink-500/20 to-rose-500/10",
    iconColor: "text-pink-400",
    border: "border-pink-500/20",
  },
  {
    icon: MessageSquare,
    title: "Natural Language",
    description:
      "Converse in plain English. Memorai understands nuance, context, and intent â€” delivering answers that feel genuinely human.",
    color: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
    border: "border-violet-500/20",
  },
];

const stats = [
  { value: "10M+", label: "Memories stored" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "< 200ms", label: "Response time" },
  { value: "50K+", label: "Active users" },
];

function getInitialUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("memorai_user_id");
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [authModal, setAuthModal] = useState<"signin" | "signup" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  /* section refs for smooth scroll */
  const heroRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -80]);

  useEffect(() => {
    setIsMounted(true);
    setUserId(getInitialUserId());
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!isMounted) return null;

  /* â”€â”€ scrollTo helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    setMobileMenu(false);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");
    try {
      let result;
      if (authModal === "signup") {
        result = await api.register(name, email, password);
      } else {
        result = await api.login(email, password);
      }
      if (result?.access_token) {
        api.setToken(result.access_token);
        const resolvedUserId =
          result.user?.id ||
          (name || email.split("@")[0] || "user")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");
        localStorage.setItem("memorai_user_id", resolvedUserId);
        setUserId(resolvedUserId);
      }
    } catch (err: unknown) {
      console.warn("Backend auth call warning, using preview fallback:", err);
      const fallbackUserId = (name || email.split("@")[0] || "user")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
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
    setEmail(""); setPassword(""); setName(""); setAuthError("");
  };

  const openModal = (m: "signin" | "signup") => {
    setAuthModal(m);
    setAuthError("");
    setEmail(""); setPassword(""); setName("");
  };

  const closeModal = () => setAuthModal(null);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => setContactSent(false), 4000);
    setContactForm({ name: "", email: "", message: "" });
  };

  /* â”€â”€ If logged in, show chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (userId) {
    return (
      <div className="w-full h-screen">
        <ChatInterface userId={userId} onLogout={handleLogout} />
      </div>
    );
  }

  /* â”€â”€ Reusable input classes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const inputCls =
    "w-full h-[50px] bg-zinc-900/80 border border-zinc-700/60 rounded-xl pl-11 pr-4 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/60 transition-all duration-150";
  const iconCls =
    "absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-500 pointer-events-none z-10";

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  return (
    <>
      {/* â•â• AUTH MODALS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <AnimatePresence>
        {authModal && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={closeModal}
          >
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            {/* card */}
            <motion.div
              key={authModal}
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[420px] bg-zinc-950/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-black overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* close btn */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all z-10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* header */}
              <div className="px-8 pt-8 pb-5 text-center border-b border-white/[0.06]">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {authModal === "signup" ? "Create Account" : "Welcome back"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {authModal === "signup"
                    ? "Join Memorai and start your AI journey"
                    : "Sign in to continue to Memorai"}
                </p>
              </div>

              {/* form */}
              <form onSubmit={handleAuth} className="p-8 space-y-4">
                {authModal === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.1em]">Name</label>
                    <div className="relative">
                      <User className={iconCls} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Doe"
                        className={inputCls}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.1em]">Email</label>
                  <div className="relative">
                    <Mail className={iconCls} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className={inputCls}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.1em]">Password</label>
                  <div className="relative">
                    <Key className={iconCls} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      className={inputCls}
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
                  className="w-full h-12 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm rounded-xl flex items-center justify-center hover:opacity-90 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20 cursor-pointer"
                >
                  {isLoading
                    ? authModal === "signup" ? "Creating accountâ€¦" : "Signing inâ€¦"
                    : authModal === "signup" ? "Create Account" : "Sign In"}
                </button>
              </form>

              {/* footer */}
              <div className="px-8 pb-8 text-center text-xs text-zinc-500 border-t border-white/[0.04] pt-4">
                {authModal === "signup" ? (
                  <p>
                    Already have an account?{" "}
                    <button
                      onClick={() => openModal("signin")}
                      className="text-purple-400 font-semibold hover:text-purple-300 transition-colors ml-1 cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p>
                    Don&apos;t have an account?{" "}
                    <button
                      onClick={() => openModal("signup")}
                      className="text-purple-400 font-semibold hover:text-purple-300 transition-colors ml-1 cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â•â• MAIN PAGE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="min-h-screen bg-black font-sans">

        {/* â”€â”€ Fixed Video Background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
        </div>

        {/* â”€â”€ NAVBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <nav
          className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
            scrolled
              ? "bg-black/60 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl shadow-black/40"
              : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
            {/* Brand */}
            <button
              onClick={() => scrollTo(heroRef)}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/20 group-hover:ring-purple-500/60 transition-all">
                <Image src="/logo.jpg" alt="Memorai" fill sizes="32px" className="object-cover" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight group-hover:text-purple-300 transition-colors">
                Memorai
              </span>
            </button>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: "Home", ref: heroRef },
                { label: "About", ref: aboutRef },
                { label: "Contact", ref: contactRef },
              ].map(({ label, ref }) => (
                <button
                  key={label}
                  onClick={() => scrollTo(ref)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => openModal("signup")}
                className="bg-white text-black text-sm font-semibold px-5 py-2 rounded-full hover:bg-zinc-100 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                Register
              </button>
              <button
                onClick={() => openModal("signin")}
                className="text-sm font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                Sign In
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-black/90 backdrop-blur-2xl border-t border-white/[0.06] overflow-hidden"
              >
                <div className="px-6 py-4 flex flex-col gap-2">
                  {[
                    { label: "Home", ref: heroRef },
                    { label: "About", ref: aboutRef },
                    { label: "Contact", ref: contactRef },
                  ].map(({ label, ref }) => (
                    <button
                      key={label}
                      onClick={() => scrollTo(ref)}
                      className="text-left px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white rounded-xl hover:bg-white/[0.06] transition-all cursor-pointer"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="flex gap-3 pt-2 border-t border-white/[0.06] mt-2">
                    <button
                      onClick={() => { setMobileMenu(false); openModal("signup"); }}
                      className="flex-1 bg-white text-black text-sm font-semibold py-2.5 rounded-full hover:bg-zinc-100 transition-all cursor-pointer"
                    >
                      Register
                    </button>
                    <button
                      onClick={() => { setMobileMenu(false); openModal("signin"); }}
                      className="flex-1 text-sm font-medium text-zinc-200 py-2.5 rounded-full border border-white/20 hover:bg-white/[0.05] transition-all cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* â”€â”€ HERO SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section
          ref={heroRef}
          id="home"
          className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-16"
        >
          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm text-[11px] font-semibold tracking-[0.15em] text-purple-300 uppercase mb-8 select-none">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                The Next Generation of AI
              </span>
            </motion.div>

            {/* heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl sm:text-7xl md:text-[88px] font-extrabold leading-[1.02] tracking-[-0.03em] text-white mb-6"
            >
              Your AI that
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
                remembers.
              </span>
            </motion.h1>

            {/* subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto mb-10"
            >
              Personalized conversations powered by your unique memory graph.
              <br className="hidden sm:block" />
              Memorai learns, adapts, and evolves â€” just like you.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={() => openModal("signup")}
                className="group inline-flex items-center gap-3 px-9 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-base rounded-full border border-purple-500/40 hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-purple-500/20"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => scrollTo(aboutRef)}
                className="inline-flex items-center gap-2 px-8 py-3.5 text-zinc-300 hover:text-white font-medium text-base rounded-full border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-200 cursor-pointer"
              >
                Learn More
              </button>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
              <span className="text-[11px] font-medium text-zinc-500 tracking-widest uppercase">Scroll</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-px h-8 bg-gradient-to-b from-zinc-500 to-transparent"
              />
            </motion.div>
          </motion.div>
        </section>

        {/* â”€â”€ STATS BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="relative z-10 py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.08]">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-black/50 backdrop-blur-xl px-8 py-8 text-center"
                >
                  <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* â”€â”€ ABOUT SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section
          ref={aboutRef}
          id="about"
          className="relative z-10 py-24 md:py-32 px-6"
        >
          {/* Section dark overlay */}
          <div className="absolute inset-0 bg-black/55" />

          <div className="relative max-w-6xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-[11px] font-semibold tracking-[0.15em] text-purple-300 uppercase mb-6">
                  <Brain className="w-3 h-3" />
                  About Memorai
                </span>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-5">
                  AI that grows
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                    smarter with you.
                  </span>
                </h2>
                <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto">
                  Memorai is not just another chatbot. It builds a dynamic Knowledge Graph
                  based on every conversation â€” remembering your preferences, projects,
                  and decisions so every interaction feels truly personal.
                </p>
              </motion.div>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`group relative bg-gradient-to-br ${f.color} border ${f.border} rounded-2xl p-6 backdrop-blur-xl hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 cursor-default`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-black/40 border ${f.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-14"
            >
              <button
                onClick={() => openModal("signup")}
                className="group inline-flex items-center gap-3 px-9 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-base rounded-full border border-purple-500/40 hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] active:scale-95 transition-all duration-200 cursor-pointer shadow-lg shadow-purple-500/20"
              >
                <span>Start for Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* â”€â”€ CONTACT SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section
          ref={contactRef}
          id="contact"
          className="relative z-10 py-24 md:py-32 px-6"
        >
          <div className="absolute inset-0 bg-black/65" />

          <div className="relative max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-[11px] font-semibold tracking-[0.15em] text-purple-300 uppercase mb-6">
                  <Mail className="w-3 h-3" />
                  Get in Touch
                </span>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-5">
                  We&apos;d love to
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                    hear from you.
                  </span>
                </h2>
                <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto">
                  Have questions about Memorai? Whether it&apos;s about our memory graph,
                  pricing, or enterprise plans â€” our team is ready to help.
                </p>
              </motion.div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

              {/* LEFT: Info cards */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-5"
              >
                {[
                  {
                    icon: Mail,
                    title: "Email Us",
                    value: "hello@memorai.ai",
                    sub: "We reply within 24 hours",
                    color: "text-purple-400",
                    bg: "bg-purple-500/10 border-purple-500/20",
                  },
                  {
                    icon: MessageSquare,
                    title: "Live Chat",
                    value: "Available in the app",
                    sub: "Response time < 5 minutes",
                    color: "text-indigo-400",
                    bg: "bg-indigo-500/10 border-indigo-500/20",
                  },
                  {
                    icon: Globe,
                    title: "Support",
                    value: "24/7 Availability",
                    sub: "Enterprise SLA included",
                    color: "text-violet-400",
                    bg: "bg-violet-500/10 border-violet-500/20",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className={`flex items-start gap-4 p-5 rounded-2xl border ${item.bg} backdrop-blur-xl hover:scale-[1.01] transition-all duration-200`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg} border`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-0.5">
                        {item.title}
                      </div>
                      <div className="text-white font-semibold text-sm">{item.value}</div>
                      <div className="text-zinc-500 text-xs mt-0.5">{item.sub}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* RIGHT: Contact form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/40"
              >
                <AnimatePresence mode="wait">
                  {contactSent ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center py-10 text-center gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                        <CheckCircle className="w-7 h-7 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Message sent!</h3>
                      <p className="text-zinc-400 text-sm max-w-xs">
                        Thanks for reaching out. Our team will get back to you within 24 hours.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleContactSubmit}
                      className="space-y-5"
                    >
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">Send us a message</h3>
                        <p className="text-zinc-500 text-sm">Fill out the form and we&apos;ll be in touch.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.1em]">
                            Your Name
                          </label>
                          <input
                            type="text"
                            value={contactForm.name}
                            onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Alex Doe"
                            className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.1em]">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                            placeholder="alex@example.com"
                            className="w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.1em]">
                          Message
                        </label>
                        <textarea
                          value={contactForm.message}
                          onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                          placeholder="Tell us how we can help..."
                          rows={5}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all resize-none"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="group w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
                      >
                        <span>Send Message</span>
                        <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </section>

        {/* â”€â”€ FOOTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <footer className="relative z-10 border-t border-white/[0.06] bg-black/70 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Brand */}
              <div className="flex items-center gap-2.5">
                <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/20">
                  <Image src="/logo.jpg" alt="Memorai" fill sizes="28px" className="object-cover" />
                </div>
                <span className="font-semibold text-white text-base tracking-tight">Memorai</span>
              </div>

              {/* Links */}
              <div className="flex items-center gap-6 text-sm text-zinc-500">
                {["Privacy", "Terms", "Security"].map((l) => (
                  <button key={l} className="hover:text-white transition-colors cursor-pointer">
                    {l}
                  </button>
                ))}
              </div>

              {/* Copyright */}
              <p className="text-sm text-zinc-600">
                Â© {new Date().getFullYear()} Memorai. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}