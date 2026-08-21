"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Target, Code, Heart, CheckSquare, Network, AlertTriangle, Trash2, RefreshCw, Sparkles, Brain, Search } from "lucide-react";
import { Memory } from "@/lib/types";
import { api } from "@/lib/api";

interface MemoryDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function MemoryDashboardModal({ isOpen, onClose, userId }: MemoryDashboardModalProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMemories();
      if (res && res.memories) {
        setMemories(res.memories);
      }
    } catch (e) {
      console.error("Failed to load dashboard memories:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
    }
  }, [isOpen]);

  const handleWipe = async () => {
    if (!confirm("Are you sure you want to completely erase all persistent memories for your account?")) return;
    try {
      await api.clearMemories();
      setMemories([]);
    } catch (e) {
      console.error("Wipe failed:", e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error("Delete memory failed:", e);
    }
  };

  const filteredMemories = memories.filter((m) => {
    const matchesFilter = selectedFilter === "all" || m.memory_type.toLowerCase() === selectedFilter.toLowerCase();
    const matchesQuery = !searchQuery.trim() || m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

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
          className="relative w-full max-w-4xl max-h-[88vh] bg-[#0c0c14] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Memory Dashboard
                </h2>
                <p className="text-xs text-zinc-400">
                  {memories.length} facts indexed across your personal Knowledge Graph
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchMemories}
                disabled={isLoading}
                className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 flex-1 space-y-6">
            
            {/* Category Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { type: "all", label: "All Memories", count: memories.length, icon: Brain, color: "text-purple-400 border-purple-500/20 bg-purple-500/10" },
                { type: "decision", label: "Decisions", count: memories.filter(m => m.memory_type === "decision").length, icon: CheckSquare, color: "text-amber-400 border-amber-500/20 bg-amber-500/10" },
                { type: "preference", label: "Preferences", count: memories.filter(m => m.memory_type === "preference").length, icon: Heart, color: "text-pink-400 border-pink-500/20 bg-pink-500/10" },
                { type: "plan", label: "Plans & Goals", count: memories.filter(m => m.memory_type === "plan").length, icon: Target, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
              ].map((cat) => (
                <button
                  key={cat.type}
                  onClick={() => setSelectedFilter(cat.type)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedFilter === cat.type
                      ? "ring-2 ring-purple-500/50 bg-white/[0.08] border-purple-500/40"
                      : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <cat.icon className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-bold text-white font-mono">{cat.count}</span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-300">{cat.label}</div>
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search memories and graph facts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            </div>

            {/* Memories List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Indexed Knowledge Nodes ({filteredMemories.length})
                </h3>
              </div>

              {filteredMemories.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-white/[0.06] bg-white/[0.01]">
                  <Brain className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">No memories match the criteria.</p>
                  <p className="text-xs text-zinc-600 mt-1">Start chatting to automatically extract knowledge!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMemories.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all flex items-start justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <p className="text-sm text-zinc-200 leading-relaxed font-normal">{m.content}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase bg-purple-500/10 border border-purple-500/20 text-purple-300">
                            {m.memory_type}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {new Date(m.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(m.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 cursor-pointer"
                        title="Delete memory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Purge Knowledge Graph</span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Permanently delete all stored facts, relationships, and vector embeddings.
                </p>
              </div>

              <button
                onClick={handleWipe}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer"
              >
                Clear All Memories
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}