"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain, User, Sparkles, Link2, Info, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [showMemoryDetails, setShowMemoryDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasMemories = message.memories_used && message.memories_used.length > 0;
  const hasRelations = message.relations_used && message.relations_used.length > 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex gap-3 w-full group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-md",
          isUser
            ? "bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-900/30"
            : "bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-900/30 ring-1 ring-white/10"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Brain className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col max-w-[82%] sm:max-w-[78%] relative",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-lg relative group/content",
            isUser
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-xs"
              : "bg-zinc-900/90 border border-white/[0.08] text-zinc-100 rounded-tl-xs backdrop-blur-md"
          )}
        >
          <div className="prose prose-invert prose-sm max-w-none text-[13.5px] leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-2 p-1.5 rounded-lg text-xs opacity-0 group-hover/content:opacity-100 transition-all cursor-pointer ${
              isUser
                ? "bg-black/30 text-white hover:bg-black/50"
                : "bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20"
            }`}
            title="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Memory context tags */}
        {!isUser && (hasMemories || hasRelations) && (
          <div className="mt-2 space-y-1.5 w-full">
            <button
              onClick={() => setShowMemoryDetails(!showMemoryDetails)}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-300 hover:bg-purple-500/20 transition-all text-xs font-medium cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>
                {message.memories_used?.length || 0} {message.memories_used?.length === 1 ? "memory" : "memories"} used
              </span>
              {hasRelations && (
                <>
                  <span className="text-purple-500/50">•</span>
                  <span className="text-cyan-300">
                    {message.relations_used?.length} {message.relations_used?.length === 1 ? "relationship" : "relationships"}
                  </span>
                </>
              )}
              {showMemoryDetails ? (
                <ChevronUp className="w-3 h-3 text-purple-400 ml-0.5" />
              ) : (
                <ChevronDown className="w-3 h-3 text-purple-400 ml-0.5" />
              )}
            </button>

            {/* Expandable Memory Detail Popover */}
            <AnimatePresence>
              {showMemoryDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-xl bg-zinc-900/95 border border-purple-500/30 shadow-xl space-y-2 text-xs">
                    <div className="font-semibold text-zinc-300 flex items-center gap-1.5 pb-1 border-b border-white/[0.06]">
                      <Info className="w-3.5 h-3.5 text-purple-400" />
                      <span>Retrieved Memory Context</span>
                    </div>

                    {message.memories_used?.map((mem, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-zinc-300 bg-white/[0.03] p-2 rounded-lg">
                        <Brain className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="leading-snug">{mem.memory}</p>
                          <span className="text-[10px] text-purple-400/80 font-mono">
                            Relevance: {(mem.score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}

                    {message.relations_used?.map((rel, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-cyan-300 bg-white/[0.03] p-2 rounded-lg font-mono text-[11px]">
                        <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{rel.source} → <span className="text-zinc-400">{rel.relation}</span> → {rel.target}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* New memories created badge */}
        {!isUser && message.memories_created && message.memories_created.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-300"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>
              +{message.memories_created.length} new {message.memories_created.length === 1 ? "fact" : "facts"} saved to your graph
            </span>
          </motion.div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-zinc-500 mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
