"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Mail, Calendar, Shield, LogOut, Check, Brain } from "lucide-react";
import { api } from "@/lib/api";
import { UserProfile } from "@/lib/types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onLogout: () => void;
}

export function ProfileModal({ isOpen, onClose, userId, onLogout }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memCount, setMemCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      Promise.all([
        api.getMe().catch(() => null),
        api.getMemories().catch(() => null),
      ]).then(([userRes, memRes]) => {
        if (userRes) setProfile(userRes);
        if (memRes && memRes.memories) setMemCount(memRes.memories.length);
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayEmail = profile?.email || `${userId.toLowerCase().replace(/\s+/g, "_")}@memorai.ai`;
  const displayName = profile?.name || userId;

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
          className="relative w-full max-w-sm bg-[#0c0c14] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-white/[0.02]">
            <h2 className="text-base font-bold text-white">User Profile</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 flex flex-col items-center">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-2xl text-white font-bold mb-6 shadow-xl shadow-purple-950/50 border border-purple-400/30">
              {displayName.substring(0, 2).toUpperCase()}
            </div>

            <div className="w-full space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3 h-3 text-purple-400" />
                  <span>Display Name</span>
                </label>
                <div className="bg-white/[0.04] border border-white/[0.06] px-3.5 py-2.5 rounded-xl text-zinc-200 text-xs font-mono">
                  {displayName}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-purple-400" />
                  <span>Account Email</span>
                </label>
                <div className="bg-white/[0.04] border border-white/[0.06] px-3.5 py-2.5 rounded-xl text-zinc-200 text-xs font-mono truncate">
                  {displayEmail}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-3 h-3 text-purple-400" />
                  <span>Knowledge Graph Status</span>
                </label>
                <div className="bg-white/[0.04] border border-white/[0.06] px-3.5 py-2.5 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active & Syncing</span>
                  </div>
                  <span className="font-mono text-purple-300 text-[11px]">{memCount} facts</span>
                </div>
              </div>
            </div>

            <div className="w-full mt-6 space-y-2 pt-4 border-t border-white/[0.06]">
              <button
                onClick={onLogout}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl transition-all text-xs flex items-center justify-center gap-2 border border-red-500/20 cursor-pointer active:scale-[0.98]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}