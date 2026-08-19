"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { MemorySidebar } from "./memory-sidebar";
import { Message } from "@/lib/types";
import { api } from "@/lib/api";
import { Brain, Sparkles } from "lucide-react";

interface ChatInterfaceProps {
  userId: string;
}

export function ChatInterface({ userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to API
      const response = await api.sendMessage(content, userId);

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.response,
        memories_used: response.memories_used,
        relations_used: response.relations_used,
        memories_created: response.memories_created,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Trigger sidebar refresh if memories were created
      if (response.memories_created.length > 0) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please make sure the backend is running at http://localhost:8000",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20"
            >
              <Brain className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg font-semibold text-zinc-100"
              >
                Memorai
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xs text-zinc-500"
              >
                AI that remembers you
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Connected</span>
          </motion.div>
        </header>

        {/* Messages area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              <AnimatePresence>{isLoading && <TypingIndicator />}</AnimatePresence>
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          placeholder="Tell me something about yourself..."
        />
      </div>

      {/* Memory sidebar */}
      <MemorySidebar
        userId={userId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex flex-col items-center justify-center h-full text-center px-4"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="w-20 h-20 rounded-2xl bg-linear-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-500/30 mb-6"
      >
        <Brain className="w-10 h-10 text-white" />
      </motion.div>

      <h2 className="text-2xl font-bold text-zinc-100 mb-2">
        Welcome to Memorai
      </h2>
      <p className="text-zinc-400 max-w-md mb-8">
        I&apos;m an AI assistant with persistent memory. Tell me about yourself,
        and I&apos;ll remember everything for our future conversations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
        {[
          {
            icon: "🧠",
            title: "Persistent Memory",
            desc: "I remember everything you tell me",
          },
          {
            icon: "🔗",
            title: "Smart Connections",
            desc: "I understand relationships between topics",
          },
          {
            icon: "📝",
            title: "Decision Tracking",
            desc: "I recall your choices and why you made them",
          },
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50"
          >
            <span className="text-2xl mb-2 block">{feature.icon}</span>
            <h3 className="text-sm font-medium text-zinc-200">{feature.title}</h3>
            <p className="text-xs text-zinc-500 mt-1">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 flex items-center gap-2 text-zinc-500"
      >
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-sm">Try saying: &quot;My name is ...&quot;</span>
      </motion.div>
    </motion.div>
  );
}
