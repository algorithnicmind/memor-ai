"use client";

import React from "react";
import { motion } from "motion/react";
import { Brain } from "lucide-react";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3"
    >
      {/* Avatar */}
      <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/20">
        <Brain className="w-5 h-5 text-white" />
      </div>

      {/* Typing indicator bubble */}
      <div className="rounded-2xl px-4 py-3 bg-zinc-800/80 border border-zinc-700/50">
        <div className="flex items-center gap-1.5">
          <motion.span
            className="w-2 h-2 rounded-full bg-zinc-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          />
          <motion.span
            className="w-2 h-2 rounded-full bg-zinc-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
          <motion.span
            className="w-2 h-2 rounded-full bg-zinc-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          />
          <span className="ml-2 text-xs text-zinc-500">Memorai is thinking...</span>
        </div>
      </div>
    </motion.div>
  );
}
