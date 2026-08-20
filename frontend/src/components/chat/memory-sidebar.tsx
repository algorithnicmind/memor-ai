"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, ChevronLeft, ChevronRight, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  simple: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  decision: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  preference: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  plan: "bg-green-500/20 text-green-400 border-green-500/30",
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
      const response = await api.getMemories(userId);
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
      await api.clearMemories(userId);
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
    <>
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          "fixed top-20 z-50 transition-all duration-300",
          isOpen ? "right-[320px]" : "right-4"
        )}
      >
        {isOpen ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </Button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed right-0 top-0 h-full w-80 bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800 z-40 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Memories
                  </h2>
                  <p className="text-xs text-zinc-500">{memories.length} saved</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchMemories}
                  disabled={isLoading}
                  className="h-8 w-8"
                >
                  <RefreshCw
                    className={cn("w-4 h-4", isLoading && "animate-spin")}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearMemories}
                  className="h-8 w-8 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Memory list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {memories.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No memories yet</p>
                  <p className="text-xs mt-1">
                    Start chatting to create memories!
                  </p>
                </div>
              ) : (
                memories.map((memory) => (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    onDelete={() => handleDeleteMemory(memory.id)}
                  />
                ))
              )}
            </div>
            {/* Dashboard Button */}
            {onOpenDashboard && (
              <div className="p-4 border-t border-zinc-800">
                <Button 
                  onClick={onOpenDashboard}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                >
                  Open Memory Dashboard
                </Button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function MemoryCard({
  memory,
  onDelete,
}: {
  memory: Memory;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600/50 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-200 leading-relaxed">
            {memory.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border",
                memoryTypeColors[memory.memory_type] || memoryTypeColors.simple
              )}
            >
              {memoryTypeIcons[memory.memory_type] || "📝"}
              {memory.memory_type}
            </span>
            <span className="text-[10px] text-zinc-500">
              {new Date(memory.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
