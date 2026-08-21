"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Monitor, Brain, Sparkles, Check } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [appearance, setAppearance] = useState("Dark");
  const [aiMode, setAiMode] = useState("Cloud");
  const [autoMemory, setAutoMemory] = useState(true);
  const [indicators, setIndicators] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [savedBadge, setSavedBadge] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("memorai_pref_theme");
      if (savedTheme) setAppearance(savedTheme);
      const savedAiMode = localStorage.getItem("memorai_pref_aimode");
      if (savedAiMode) setAiMode(savedAiMode);
      const savedAutoMem = localStorage.getItem("memorai_pref_automem");
      if (savedAutoMem !== null) setAutoMemory(savedAutoMem === "true");
      const savedInd = localStorage.getItem("memorai_pref_indicators");
      if (savedInd !== null) setIndicators(savedInd === "true");
      const savedNotif = localStorage.getItem("memorai_pref_notif");
      if (savedNotif !== null) setNotifications(savedNotif === "true");
    }
  }, [isOpen]);

  const showSavedIndicator = () => {
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1500);
  };

  const updateAppearance = (mode: string) => {
    setAppearance(mode);
    localStorage.setItem("memorai_pref_theme", mode);
    showSavedIndicator();
  };

  const updateAiMode = (mode: string) => {
    setAiMode(mode);
    localStorage.setItem("memorai_pref_aimode", mode);
    showSavedIndicator();
  };

  const toggleAutoMemory = () => {
    const val = !autoMemory;
    setAutoMemory(val);
    localStorage.setItem("memorai_pref_automem", String(val));
    showSavedIndicator();
  };

  const toggleIndicators = () => {
    const val = !indicators;
    setIndicators(val);
    localStorage.setItem("memorai_pref_indicators", String(val));
    showSavedIndicator();
  };

  const toggleNotifications = () => {
    const val = !notifications;
    setNotifications(val);
    localStorage.setItem("memorai_pref_notif", String(val));
    showSavedIndicator();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0c0c14] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-bold text-white">Settings & Preferences</h2>
            </div>
            <div className="flex items-center gap-2">
              {savedBadge && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono"
                >
                  <Check className="w-3 h-3" />
                  <span>Saved</span>
                </motion.div>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            {/* Appearance */}
            <section className="space-y-2.5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-purple-400" />
                Theme Mode
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {["Dark", "OLED", "System"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateAppearance(mode)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      appearance === mode
                        ? "border-purple-500/50 bg-purple-500/15 text-purple-200 shadow-sm"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </section>

            {/* AI Engine */}
            <section className="space-y-2.5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                Backend Ingestion Mode
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "Cloud", label: "Mistral Large (Fast)" },
                  { id: "Local", label: "Local Ollama" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => updateAiMode(item.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      aiMode === item.id
                        ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-200 shadow-sm"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Toggles */}
            <section className="space-y-3 pt-3 border-t border-white/[0.06]">
              {[
                {
                  label: "Automatic Memory Extraction",
                  desc: "Extract facts from every message in background",
                  active: autoMemory,
                  toggle: toggleAutoMemory,
                },
                {
                  label: "Live Memory Grounding Badges",
                  desc: "Show retrieved facts chips on assistant responses",
                  active: indicators,
                  toggle: toggleIndicators,
                },
                {
                  label: "Real-time Graph Syncing",
                  desc: "Update entity graph nodes dynamically",
                  active: notifications,
                  toggle: toggleNotifications,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={item.toggle}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] cursor-pointer transition-all"
                >
                  <div className="space-y-0.5 pr-3">
                    <div className="text-xs font-semibold text-zinc-200">{item.label}</div>
                    <div className="text-[11px] text-zinc-500">{item.desc}</div>
                  </div>
                  <div
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                      item.active ? "bg-purple-600" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        item.active ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </section>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
