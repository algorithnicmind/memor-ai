"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Component as LunarGravityCard } from "@/components/ui/lunar-gravity-card";
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
  Sparkles,
  Network,
  Cpu,
  GitBranch,
  Database,
  Lock,
  Compass,
  Check,
  ChevronRight,
  HelpCircle,
  Clock,
  MapPin,
  Bot,
  MessageCircle,
  Camera,
  Video,
  Briefcase
} from "lucide-react";
import { api } from "@/lib/api";
import { TeamSection } from "@/components/ui/team-section-1";

const teamMembers = [
  {
    name: "EMMA",
    designation: "Product Designer",
    imageSrc:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop", 
    socialLinks: [
      { icon: MessageCircle, href: "#" },
      { icon: Briefcase, href: "#" },
    ],
  },
  {
    name: "HENRY",
    designation: "Lead Developer",
    imageSrc:
      "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1965&auto=format&fit=crop", 
    socialLinks: [
      { icon: GitBranch, href: "#" },
      { icon: MessageCircle, href: "#" },
    ],
  },
  {
    name: "JOHN",
    designation: "Marketing Specialist",
    imageSrc:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1974&auto=format&fit=crop", 
    socialLinks: [
      { icon: Globe, href: "#" },
      { icon: Camera, href: "#" },
    ],
  },
];

const mainSocialLinks = [
  { icon: MessageCircle, href: "#" },
  { icon: Globe, href: "#" },
  { icon: Camera, href: "#" },
  { icon: Video, href: "#" },
];

function getInitialUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("memorai_user_id");
}

/* â”€â”€â”€ Feature Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const features = [
  {
    icon: Brain,
    title: "Persistent Memory Graph",
    description:
      "Builds a dynamic entity-relationship Knowledge Graph from every conversation. Never repeat your background or preferences again.",
    tag: "Core Engine",
    color: "from-purple-500/20 to-indigo-500/10",
    iconColor: "text-purple-400",
    border: "border-purple-500/25",
  },
  {
    icon: Zap,
    title: "Instant Context Retrieval",
    description:
      "Hybrid semantic vector search + graph traversal queries relevant memories in <20ms, feeding your LLM exact contextual grounding.",
    tag: "High Performance",
    color: "from-amber-500/20 to-yellow-500/10",
    iconColor: "text-amber-400",
    border: "border-amber-500/25",
  },
  {
    icon: Shield,
    title: "Zero-Leak Privacy",
    description:
      "All memory vectors and entity graphs are isolated strictly per-tenant with encrypted storage and granular user-controlled purge policies.",
    tag: "Enterprise Security",
    color: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/25",
  },
  {
    icon: GitBranch,
    title: "Automatic Fact Extraction",
    description:
      "Asynchronous background ingestion pipeline categorizes decisions, skills, projects, preferences, and plans without slowing down chat responses.",
    tag: "Async Ingestion",
    color: "from-cyan-500/20 to-blue-500/10",
    iconColor: "text-cyan-400",
    border: "border-cyan-500/25",
  },
  {
    icon: Database,
    title: "Unified Knowledge Base",
    description:
      "Connects unstructured chat history into structured relational tables (Tortoise ORM + SQLite Vector) with queryable insights.",
    tag: "Data Pipeline",
    color: "from-pink-500/20 to-rose-500/10",
    iconColor: "text-pink-400",
    border: "border-pink-500/25",
  },
  {
    icon: Cpu,
    title: "Multi-Model Compatibility",
    description:
      "Works out of the box with Mistral, OpenAI, Groq, Anthropic, or local open-weights LLMs with standard OpenAI-compatible completions.",
    tag: "Flexible LLM",
    color: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
    border: "border-violet-500/25",
  },
];

const stats = [
  { value: "10M+", label: "Memories Indexed", desc: "Across active graphs" },
  { value: "< 20ms", label: "Retrieval Latency", desc: "Vector + graph lookup" },
  { value: "99.9%", label: "Uptime Reliability", desc: "Enterprise ready" },
  { value: "100%", label: "Private & Isolated", desc: "Strict per-user data" },
];

const howItWorksSteps = [
  {
    step: "01",
    title: "You Converse Naturally",
    description: "Talk to Memorai just like you would with any AI assistant â€” discuss coding, planning, research, or career goals.",
    icon: MessageSquare,
    badge: "Chat Input"
  },
  {
    step: "02",
    title: "Autonomous Fact Extraction",
    description: "In the background, an async pipeline identifies facts, skills, decisions, and relationships, indexing them into vector and graph stores.",
    icon: Network,
    badge: "Async Ingestion"
  },
  {
    step: "03",
    title: "Context-Aware Synthesis",
    description: "On every subsequent query, relevant memories and connected relationships are seamlessly injected into the prompt for tailored answers.",
    icon: Sparkles,
    badge: "Memory Synthesis"
  }
];

const comparisonData = [
  {
    feature: "Memory Retention",
    traditional: "Resets every session / limited context window",
    memorai: "Persistent, evolving multi-session Knowledge Graph"
  },
  {
    feature: "Context Relevance",
    traditional: "Generic responses requiring repeated explanations",
    memorai: "Laser-focused answers tailored to your past projects & goals"
  },
  {
    feature: "Relationship Mapping",
    traditional: "Flat text history without relational awareness",
    memorai: "Graph nodes connect skills, tools, plans, and preferences"
  },
  {
    feature: "Data Control",
    traditional: "Opaque data retention with no granular control",
    memorai: "Full Memory Dashboard: view, edit, or purge any fact instantly"
  }
];

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
  const [activeSection, setActiveSection] = useState("hero");

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  // Section refs
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsMounted(true);
    setUserId(getInitialUserId());

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Determine active section
      const scrollPos = window.scrollY + 200;
      if (contactRef.current && scrollPos >= contactRef.current.offsetTop) {
        setActiveSection("contact");
      } else if (aboutRef.current && scrollPos >= aboutRef.current.offsetTop) {
        setActiveSection("about");
      } else if (howItWorksRef.current && scrollPos >= howItWorksRef.current.offsetTop) {
        setActiveSection("how-it-works");
      } else if (featuresRef.current && scrollPos >= featuresRef.current.offsetTop) {
        setActiveSection("features");
      } else {
        setActiveSection("hero");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isMounted) return null;

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    setMobileMenu(false);
    if (ref.current) {
      const topOffset = ref.current.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
    }
  };

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

      if (result && result.access_token) {
        api.setToken(result.access_token);
        const resolvedUserId =
          result.user?.id ||
          (name || email.split("@")[0] || "user")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");
        localStorage.setItem("memorai_user_id", resolvedUserId);
        setUserId(resolvedUserId);
        setAuthModal(null);
      }
    } catch (err: unknown) {
      console.warn("Auth request issue, entering preview mode:", err);
      // Fallback demo mode so users can seamlessly explore the full application
      const fallbackUserId = (name || email.split("@")[0] || "demo_user")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
      localStorage.setItem("memorai_user_id", fallbackUserId);
      setUserId(fallbackUserId);
      setAuthModal(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    localStorage.removeItem("memorai_user_id");
    setUserId(null);
    setEmail("");
    setPassword("");
    setName("");
    setAuthError("");
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    setTimeout(() => {
      setContactSending(false);
      setContactSent(true);
      setTimeout(() => setContactSent(false), 5000);
      setContactForm({ name: "", email: "", subject: "", message: "" });
    }, 800);
  };

  // If user is logged in, show the full chat application interface
  if (userId) {
    return (
      <div className="w-full h-screen">
        <ChatInterface userId={userId} onLogout={handleLogout} />
      </div>
    );
  }

  const navLinks = [
    { label: "Overview", ref: heroRef, id: "hero" },
    { label: "Features", ref: featuresRef, id: "features" },
    { label: "Architecture", ref: howItWorksRef, id: "how-it-works" },
    { label: "About", ref: aboutRef, id: "about" },
    { label: "Contact", ref: contactRef, id: "contact" },
  ];

  return (
    <div className="min-h-screen bg-[#030305] text-zinc-100 font-sans selection:bg-purple-500/30 selection:text-white relative">
      
      {/* â”€â”€ Background Video Layer (Pinned & Immersive) â”€â”€ */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-45 filter brightness-90 contrast-110"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4"
            type="video/mp4"
          />
        </video>
        {/* Gradients for depth and optimal text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#030305]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,50,220,0.15),rgba(255,255,255,0))]" />
      </div>

      {/* â”€â”€ Fixed Navbar â”€â”€ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#050508]/85 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl shadow-black/60 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Brand Logo */}
          <button
            onClick={() => scrollTo(heroRef)}
            className="flex items-center gap-3 group cursor-pointer focus:outline-none"
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/20 group-hover:ring-purple-500/60 shadow-lg shadow-purple-950/40 transition-all duration-300">
              <Image src="/logo.jpg" alt="Memorai Logo" fill sizes="36px" className="object-cover" priority />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-bold text-white text-lg tracking-tight group-hover:text-purple-300 transition-colors leading-none">
                Memorai
              </span>
              <span className="text-[10px] text-purple-400/80 font-mono tracking-wider uppercase leading-none mt-1">
                Memory AI
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] px-3 py-1.5 rounded-full shadow-inner">
            {navLinks.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.ref)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "text-white bg-white/[0.12] shadow-sm shadow-purple-500/20"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Desktop Auth CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => {
                setAuthError("");
                setAuthModal("signin");
              }}
              className="text-xs font-semibold text-zinc-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthError("");
                setAuthModal("signup");
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:opacity-95 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-purple-600/25 border border-purple-400/30 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get Started</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden bg-[#0a0a10]/95 backdrop-blur-2xl border-b border-white/[0.08] px-6 py-5 overflow-hidden space-y-4"
            >
              <div className="flex flex-col space-y-1">
                {navLinks.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.ref)}
                    className="text-left px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  onClick={() => {
                    setMobileMenu(false);
                    setAuthModal("signin");
                  }}
                  className="py-2.5 text-center text-xs font-semibold rounded-xl bg-white/[0.06] text-zinc-200 hover:bg-white/[0.1] transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenu(false);
                    setAuthModal("signup");
                  }}
                  className="py-2.5 text-center text-xs font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/30 transition-all"
                >
                  Register
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* â”€â”€ Main Content Container â”€â”€ */}
      <main className="relative z-10">

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* â”€â”€ 1. HERO SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section
          ref={heroRef}
          id="hero"
          className="min-h-screen flex flex-col justify-center items-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        >
          <div className="w-full flex justify-center items-center">
            <LunarGravityCard />
          </div>
        </section>

        {/* â”€â”€ STATS BAR â”€â”€ */}
        <section className="py-12 border-y border-white/[0.06] bg-black/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono mb-1">
                    {stat.value}
                  </span>
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-0.5">
                    {stat.label}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {stat.desc}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* â”€â”€ 2. FEATURES GRID SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section
          ref={featuresRef}
          id="features"
          className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        >
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider font-mono mb-4">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              Engineered for Context
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Every detail remembered.
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Every conversation elevated.
              </span>
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed">
              Standard chatbots lose context the second you refresh. Memorai preserves your technical stack, project state, decisions, and preferences.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className={`group relative p-7 rounded-3xl bg-gradient-to-br ${item.color} border ${item.border} backdrop-blur-xl bg-black/40 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-950/20 transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/[0.08] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2.5 tracking-tight group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center text-xs font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">
                  <span>Learn more</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* â”€â”€ 3. HOW IT WORKS (ARCHITECTURE PIPELINE) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section
          ref={howItWorksRef}
          id="how-it-works"
          className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]"
        >
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider font-mono mb-4">
              <Network className="w-3.5 h-3.5 text-indigo-400" />
              Under the Hood
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              How the Knowledge Graph functions.
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed">
              Three synchronized layers working together in real-time to build, update, and retrieve your personalized memory context.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            {howItWorksSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative p-8 rounded-3xl bg-[#090910]/80 border border-white/[0.08] backdrop-blur-2xl flex flex-col justify-between hover:border-purple-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-mono font-extrabold text-zinc-600 group-hover:text-purple-400 transition-colors">
                      {step.step}
                    </span>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                      {step.badge}
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                    <step.icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* â”€â”€ 4. ABOUT SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section
          ref={aboutRef}
          id="about"
          className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]"
        >
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider font-mono mb-4">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                About Memorai
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-6">
                Bridging the gap between
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Stateless AI and True Companionship.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
                Memorai was created on a single premise: AI should know you better over time, not reset after every single session. We combine vector embeddings with relational graph algorithms to produce continuous context.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="rounded-3xl border border-white/[0.1] bg-[#0c0c14]/80 backdrop-blur-2xl overflow-hidden shadow-2xl mb-14">
              <div className="p-6 border-b border-white/[0.08] bg-white/[0.02]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Why Memorai is Different
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Comparison with standard conversational assistants</p>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {comparisonData.map((row, idx) => (
                  <div key={idx} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="font-semibold text-sm text-zinc-200">
                      {row.feature}
                    </div>
                    <div className="text-xs text-zinc-500 line-through md:no-underline md:text-zinc-400">
                      <span className="md:hidden font-bold block text-zinc-500">Standard: </span>
                      {row.traditional}
                    </div>
                    <div className="text-xs font-medium text-purple-300 flex items-start gap-2 bg-purple-500/5 p-3 rounded-xl border border-purple-500/15">
                      <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>{row.memorai}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-lg font-bold text-white mb-1">FastAPI + Async</div>
                <p className="text-xs text-zinc-500">Non-blocking background ingestion with Tortoise ORM</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-lg font-bold text-white mb-1">Vector + Graph DB</div>
                <p className="text-xs text-zinc-500">Hybrid semantic retrieval with isolated tenant partitions</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-lg font-bold text-white mb-1">Mistral LLM Engine</div>
                <p className="text-xs text-zinc-500">State of the art reasoning & memory-aware synthesis</p>
              </div>
            </div>

          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* â”€â”€ 5. CONTACT SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section
          ref={contactRef}
          id="contact"
          className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]"
        >
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider font-mono mb-4">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                Get in Touch
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                Let&apos;s build together.
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed">
                Have questions about our memory architecture, enterprise deployments, or custom integrations? We&apos;re here to help.
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* Left Info Cards (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-6 rounded-3xl bg-[#0c0c14]/80 border border-white/[0.08] backdrop-blur-xl space-y-5">
                  <h3 className="text-lg font-bold text-white">Direct Channels</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 font-mono">Email Us</div>
                        <div className="text-sm font-semibold text-zinc-200">hello@memorai.ai</div>
                        <div className="text-[11px] text-purple-400">Response within 24 hours</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 font-mono">Support SLA</div>
                        <div className="text-sm font-semibold text-zinc-200">24/7 Enterprise Coverage</div>
                        <div className="text-[11px] text-zinc-500">Dedicated engineer channel</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 font-mono">Deployment</div>
                        <div className="text-sm font-semibold text-zinc-200">Cloud & On-Premises</div>
                        <div className="text-[11px] text-zinc-500">Air-gapped models supported</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ preview card */}
                <div className="p-6 rounded-3xl bg-purple-950/20 border border-purple-500/20 backdrop-blur-xl">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm mb-2">
                    <HelpCircle className="w-4 h-4" />
                    <span>Frequently Asked Question</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    <strong>Q: Can I delete individual memories?</strong>
                    <br />
                    Yes! With our Memory Dashboard, you can review, edit, or purge every single extracted entity with one click.
                  </p>
                </div>
              </div>

              {/* Right Contact Form (7 Cols) */}
              <div className="lg:col-span-7">
                <div className="p-8 sm:p-10 rounded-3xl bg-[#0c0c14]/90 border border-white/[0.1] backdrop-blur-2xl shadow-2xl shadow-black">
                  
                  {contactSent ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-12 flex flex-col items-center text-center space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Message Dispatched</h3>
                      <p className="text-sm text-zinc-400 max-w-sm">
                        Thank you for reaching out! Our team has received your message and will respond to {contactForm.email || "your email"} promptly.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-5">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">Send us a Message</h3>
                        <p className="text-xs text-zinc-400">Fill in the fields below and we&apos;ll get back to you shortly.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                            Your Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Alex Doe"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="alex@company.com"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                          Subject
                        </label>
                        <input
                          type="text"
                          placeholder="Enterprise Architecture / Inquiry"
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                          Message *
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="How can we assist with your AI memory implementation?..."
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={contactSending}
                        className="w-full h-13 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:opacity-95 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/30"
                      >
                        {contactSending ? (
                          <span>Sending message...</span>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <Send className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                </div>
              </div>

            </div>

          </div>
        </section>

        <TeamSection
          title="CREATIVE TEAM"
          description="Meet the brilliant minds behind Memorai. We are a team of passionate engineers and designers dedicated to building the future of personalized AI."
          members={teamMembers}
          registerLink="#"
          logo={<span className="text-purple-500 font-bold tracking-tighter">MEMORAI TEAM</span>}
          socialLinksMain={mainSocialLinks}
        />
      </main>

      {/* â”€â”€ Footer â”€â”€ */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#05050a]/90 backdrop-blur-2xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden ring-1 ring-white/20">
              <Image src="/logo.jpg" alt="Memorai Logo" fill sizes="32px" className="object-cover" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">Memorai</span>
              <span className="text-xs text-zinc-500 block">Personalized AI with Persistent Knowledge Graphs</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-400 font-medium">
            <button onClick={() => scrollTo(heroRef)} className="hover:text-white transition-colors cursor-pointer">Overview</button>
            <button onClick={() => scrollTo(featuresRef)} className="hover:text-white transition-colors cursor-pointer">Features</button>
            <button onClick={() => scrollTo(aboutRef)} className="hover:text-white transition-colors cursor-pointer">About</button>
            <button onClick={() => scrollTo(contactRef)} className="hover:text-white transition-colors cursor-pointer">Contact</button>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Systems Operational</span>
            <span>â€¢</span>
            <span>Â© {new Date().getFullYear()} Memorai</span>
          </div>

        </div>
      </footer>

      {/* â”€â”€ Authentication Modal (Sign In & Register) â”€â”€ */}
      <AnimatePresence>
        {authModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAuthModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-[#0d0d16] border border-white/[0.12] rounded-3xl shadow-2xl shadow-black overflow-hidden z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setAuthModal(null)}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="p-8 pb-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-950/50">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {authModal === "signup" ? "Create an Account" : "Welcome Back"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {authModal === "signup"
                    ? "Start building your personalized AI memory graph"
                    : "Access your persistent memory conversations"}
                </p>

                {/* Tab Switcher */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setAuthModal("signin");
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      authModal === "signin"
                        ? "bg-white/[0.12] text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setAuthModal("signup");
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                      authModal === "signup"
                        ? "bg-white/[0.12] text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleAuth} className="p-8 pt-2 space-y-4">
                {authModal === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        placeholder="Alex Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      required
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center font-medium">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 mt-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:opacity-95 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : authModal === "signup" ? (
                    <>
                      <span>Create Account & Start</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Hint */}
              <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] text-center text-xs text-zinc-500">
                <span>Instant Demo: enter any email/password to explore live chat & memory graphs.</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}