"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Trash2, RefreshCw, X, User, Target, Code, Heart, Network } from "lucide-react";
import { Memory } from "@/lib/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface MemorySidebarProps {
  userId: string;
  isOpen: boolean;
  onToggle: () => void;
  refreshTrigger?: number;
  onOpenDashboard?: () => void;
}

const memoryTypeColors: Record<string, string> = {
  simple: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  decision: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  preference: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  plan: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const memoryTypeIcons: Record<string, string> = {
  simple: "📝",
  decision: "⚖️",
  preference: "❤️",
  plan: "📅",
};

export function MemorySidebar({
  userId,
  isOpen,
  onToggle,
  refreshTrigger,
  onOpenDashboard,
}: MemorySidebarProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMemories = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await api.getMemories();
      setMemories(response.memories);
    } catch (error) {
      console.error("Failed to fetch memories:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchMemories();
    }
  }, [userId, refreshTrigger, fetchMemories]);

  const handleClearMemories = async () => {
    if (!confirm("Are you sure you want to clear all memories?")) return;
    try {
      await api.clearMemories();
      setMemories([]);
    } catch (error) {
      console.error("Failed to clear memories:", error);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      await api.deleteMemory(memoryId);
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    } catch (error) {
      console.error("Failed to delete memory:", error);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="shrink-0 h-full w-80 bg-zinc-950/90 backdrop-blur-2xl border-l border-white/[0.08] flex flex-col z-30 overflow-hidden"
        >
          {/* Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Memory Profile</h2>
                <p className="text-[10px] text-zinc-400">{memories.length} saved facts</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={fetchMemories}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Refresh Memories"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              </button>
              <button
                onClick={handleClearMemories}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Clear All"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                title="Close Memory Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            
            {/* Quick Profile Summary (Wireframe Section 16) */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase px-1">
                Active Knowledge Graph
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-300 mb-1">
                    <User className="w-3 h-3 text-purple-400" />
                    <span>Profile</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">CS Student</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-300 mb-1">
                    <Target className="w-3 h-3 text-blue-400" />
                    <span>Goals</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">Learn AI/ML</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 mb-1">
                    <Code className="w-3 h-3 text-emerald-400" />
                    <span>Skills</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">Python, React</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-pink-300 mb-1">
                    <Heart className="w-3 h-3 text-pink-400" />
                    <span>Preference</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">Concise code</p>
                </div>
              </div>
            </div>

            {/* Individual Memories List */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase px-1">
                Recent Extracted Memories
              </div>

              {memories.length === 0 ? (
                <div className="text-center py-6 px-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  <Brain className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                  <p className="text-xs font-medium text-zinc-400">No memories extracted yet</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Chat to automatically build your memory graph!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {memories.map((memory) => (
                    <div
                      key={memory.id}
                      className="group p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-zinc-200 leading-relaxed font-normal">
                          {memory.content}
                        </p>
                        <button
                          onClick={() => handleDeleteMemory(memory.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all shrink-0"
                          title="Delete fact"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border",
                            memoryTypeColors[memory.memory_type] || memoryTypeColors.simple
                          )}
                        >
                          <span>{memoryTypeIcons[memory.memory_type] || "📝"}</span>
                          <span>{memory.memory_type}</span>
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(memory.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer View All Memories */}
          {onOpenDashboard && (
            <div className="p-3 border-t border-white/[0.08] bg-zinc-950 shrink-0">
              <button
                onClick={onOpenDashboard}
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <Network className="w-3.5 h-3.5" />
                <span>View Full Memory Dashboard</span>
              </button>
            </div>
          )}

        </motion.aside>
      )}
    </AnimatePresence>
  );
}
