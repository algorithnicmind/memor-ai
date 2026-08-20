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
import { HexagonPattern } from "@/components/ui/hexagon-pattern";
import { Brain, Sparkles, Command, Shield, Network } from "lucide-react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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
      if (response.memories_created && response.memories_created.length > 0) {
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

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen w-full bg-black relative font-sans selection:bg-purple-500/30">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Left Sidebar */}
      <LeftSidebar 
        userId={userId} 
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={onLogout}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Messages area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 pt-10 pb-4 space-y-4"
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
          placeholder="Ask Memorai anything..."
        />
      </div>

      {/* Memory sidebar */}
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

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center h-full text-center px-4"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-24 h-24 rounded-[2rem] overflow-hidden shadow-2xl shadow-purple-900/30 ring-1 ring-white/10 mb-10"
      >
        <Image 
          src="/logo.jpg" 
          alt="Memorai Logo" 
          fill 
          className="object-cover"
          priority
        />
      </motion.div>

      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white via-zinc-200 to-zinc-500 mb-5"
      >
        How can I help you today?
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full px-4 mt-8">
        {[
          "Help me plan my AI/ML roadmap",
          "Remember my project requirements",
          "Explain this concept simply",
          "Help me organize my goals"
        ].map((prompt, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + idx * 0.1 }}
            className="p-4 rounded-2xl bg-zinc-950/40 backdrop-blur-xl border border-white/[0.05] shadow-lg flex items-center justify-between text-left hover:bg-zinc-900/60 transition-colors group"
          >
            <span className="text-[13px] text-zinc-300 font-medium group-hover:text-white transition-colors">{prompt}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
