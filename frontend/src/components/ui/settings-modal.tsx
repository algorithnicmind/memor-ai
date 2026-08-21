"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Monitor, Brain, Shield, Bell, Check, Sparkles } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [appearance, setAppearance] = useState("Dark");
  const [aiMode, setAiMode] = useState("Cloud");
  const [autoMemory, setAutoMemory] = useState(true);
  const [indicators, setIndicators] = useState(true);
  const [localProcessing, setLocalProcessing] = useState(false);
  const [notifications, setNotifications] = useState(true);

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
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Settings & Preferences
            </h2>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
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
                    onClick={() => setAppearance(mode)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
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
                    onClick={() => setAiMode(item.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
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
                { label: "Automatic Memory Extraction", desc: "Extract facts from every message in background", active: autoMemory, toggle: () => setAutoMemory(!autoMemory) },
                { label: "Live Memory Grounding Badges", desc: "Show retrieved facts chips on assistant responses", active: indicators, toggle: () => setIndicators(!indicators) },
                { label: "Real-time Graph Syncing", desc: "Update entity graph nodes dynamically", active: notifications, toggle: () => setNotifications(!notifications) },
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
