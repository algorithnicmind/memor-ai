"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Message, MemoryUsed, RelationUsed } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain, User, Sparkles, Link2 } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex gap-3 w-full",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
          isUser
            ? "bg-linear-to-br from-purple-600 to-indigo-600 shadow-purple-500/20"
            : "bg-linear-to-br from-emerald-600 to-teal-600 shadow-emerald-500/20"
        )}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Brain className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-lg",
            isUser
              ? "bg-linear-to-r from-purple-600/90 to-indigo-600/90 text-white"
              : "bg-zinc-800/80 border border-zinc-700/50 text-zinc-100"
          )}
        >
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Memory badges (for assistant messages) */}
        {!isUser && message.memories_used && message.memories_used.length > 0 && (
          <MemoryBadges memories={message.memories_used} />
        )}

        {/* Relation badges */}
        {!isUser && message.relations_used && message.relations_used.length > 0 && (
          <RelationBadges relations={message.relations_used} />
        )}

        {/* New memories created badge */}
        {!isUser && message.memories_created && message.memories_created.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="text-xs text-emerald-400">
              +{message.memories_created.length} new{" "}
              {message.memories_created.length === 1 ? "memory" : "memories"} saved
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

function MemoryBadges({ memories }: { memories: MemoryUsed[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-wrap gap-1.5 mt-2"
    >
      {memories.slice(0, 3).map((memory, idx) => (
        <div
          key={idx}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30"
          title={memory.memory}
        >
          <Brain className="w-3 h-3 text-purple-400" />
          <span className="text-xs text-purple-300 truncate max-w-[150px]">
            {memory.memory}
          </span>
          <span className="text-[10px] text-purple-400/70">
            {(memory.score * 100).toFixed(0)}%
          </span>
        </div>
      ))}
      {memories.length > 3 && (
        <span className="text-xs text-zinc-500 self-center">
          +{memories.length - 3} more
        </span>
      )}
    </motion.div>
  );
}

function RelationBadges({ relations }: { relations: RelationUsed[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="flex flex-wrap gap-1.5 mt-1"
    >
      {relations.slice(0, 2).map((rel, idx) => (
        <div
          key={idx}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
        >
          <Link2 className="w-3 h-3 text-cyan-400" />
          <span className="text-xs text-cyan-300">
            {rel.source} → {rel.relation} → {rel.target}
          </span>
        </div>
      ))}
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
