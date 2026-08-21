"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { MemorySidebar } from "./memory-sidebar";
import { LeftSidebar } from "./left-sidebar";
import { Message } from "@/lib/types";
import { api } from "@/lib/api";
import { Brain, PanelLeftOpen, Sparkles } from "lucide-react";
import { SettingsModal } from "@/components/ui/settings-modal";
import { ProfileModal } from "@/components/ui/profile-modal";
import { MemoryDashboardModal } from "@/components/ui/memory-dashboard-modal";

interface ChatInterfaceProps {
  userId: string;
  onLogout: () => void;
}

export function ChatInterface({ userId, onLogout }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Memory Right Sidebar
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true); // Left Chat Sidebar
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [memoryCount, setMemoryCount] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMemoryDashboardOpen, setIsMemoryDashboardOpen] = useState(false);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Fetch memory count on mount and update
  useEffect(() => {
    api.getMemories().then(res => {
      if (res && res.memories) {
        setMemoryCount(res.memories.length);
      }
    }).catch(() => {});
  }, [refreshTrigger]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.sendMessage(content);

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

      if (response.memories_created && response.memories_created.length > 0) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error communicating with the memory system. Please ensure the backend is running.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen w-full bg-black relative font-sans overflow-hidden select-none">
      
      {/* Background Ambient Video/Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      {/* ── 1. Left Sidebar (Collapsible in flow) ── */}
      <LeftSidebar 
        userId={userId} 
        isOpen={isLeftSidebarOpen}
        onToggle={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenDashboard={() => setIsMemoryDashboardOpen(true)}
        onLogout={onLogout}
      />

      {/* ── 2. Center Chat Area (Flex-1) ── */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative z-10 overflow-hidden bg-zinc-950/40">
        
        {/* Top Header Bar */}
        <header className="h-14 shrink-0 px-4 md:px-6 flex items-center justify-between border-b border-white/[0.08] bg-black/30 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            {!isLeftSidebarOpen && (
              <button
                onClick={() => setIsLeftSidebarOpen(true)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Open Sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
            
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-base tracking-tight">Memorai</span>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[11px] font-medium text-purple-300">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Memory Active
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Memory Panel Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isSidebarOpen
                  ? "bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
              title="Toggle Memory Panel"
            >
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Memory</span>
              {memoryCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-[10px] text-purple-200">
                  {memoryCount}
                </span>
              )}
            </button>

            {/* Profile Button */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md hover:ring-2 hover:ring-purple-400 transition-all ml-1"
              title="Open Profile"
            >
              {userId.substring(0, 2).toUpperCase()}
            </button>
          </div>
        </header>

        {/* Message Stream Area / Empty State */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <EmptyState onSelectPrompt={handleSendMessage} />
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
            >
              <div className="max-w-3xl mx-auto w-full space-y-6">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <AnimatePresence>{isLoading && <TypingIndicator />}</AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Container */}
        <div className="shrink-0 p-4 pt-1 border-t border-white/[0.04] bg-black/20 backdrop-blur-md">
          <ChatInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            placeholder="Message Memorai..."
          />
        </div>
      </main>

      {/* ── 3. Right Memory Panel (Collapsible) ── */}
      <MemorySidebar
        userId={userId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        refreshTrigger={refreshTrigger}
        onOpenDashboard={() => setIsMemoryDashboardOpen(true)}
      />

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} userId={userId} onLogout={onLogout} />
      <MemoryDashboardModal isOpen={isMemoryDashboardOpen} onClose={() => setIsMemoryDashboardOpen(false)} userId={userId} />

    </div>
  );
}

function EmptyState({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  const starterPrompts = [
    "Help me plan my AI/ML roadmap",
    "Remember my project requirements",
    "Explain this concept simply",
    "Help me organize my goals"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center text-center px-4 py-8 max-w-2xl mx-auto"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-20 h-20 rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/40 ring-1 ring-white/20 mb-6"
      >
        <Image 
          src="/logo.jpg" 
          alt="Memorai Logo" 
          fill 
          sizes="80px"
          className="object-cover"
          priority
        />
      </motion.div>

      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3"
      >
        How can I help you today?
      </motion.h2>

      <p className="text-sm text-zinc-400 mb-8 max-w-md">
        I remember your preferences, background, and previous discussions to provide truly personalized responses.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {starterPrompts.map((prompt, idx) => (
          <motion.button
            key={idx}
            onClick={() => onSelectPrompt(prompt)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.08 }}
            className="p-4 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] shadow-lg flex items-center justify-between text-left hover:bg-zinc-800/80 hover:border-purple-500/40 transition-all group"
          >
            <span className="text-sm text-zinc-300 font-medium group-hover:text-white transition-colors leading-snug">
              {prompt}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
