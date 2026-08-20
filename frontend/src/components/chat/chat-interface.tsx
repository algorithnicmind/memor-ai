import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { MemorySidebar } from "./memory-sidebar";
import { Message } from "@/lib/types";
import { api } from "@/lib/api";
import { HexagonPattern } from "@/components/ui/hexagon-pattern";
import { Brain, Sparkles, Command, Shield, Network } from "lucide-react";

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
        {/* Subtle darkening overlay so text remains readable */}
        <div className="absolute inset-0 bg-black/40" />
      </div>
      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Premium Floating Header */}
        <nav className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between border w-[calc(100%-2rem)] sm:w-full max-w-7xl px-8 py-4 border-slate-700/50 bg-black/40 backdrop-blur-2xl rounded-full text-white text-base shadow-2xl">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/20">
                <Image src="/logo.jpg" alt="Memorai Logo" fill className="object-cover" />
              </div>
              <span className="font-semibold tracking-tight text-lg hidden sm:block">Memorai</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {['Dashboard', 'Memory Graph', 'Settings'].map((label) => (
                <a key={label} href="#" className="relative overflow-hidden h-6 group text-zinc-300 hover:text-white transition-colors font-medium">
                  <span className="block group-hover:-translate-y-full transition-transform duration-300">{label}</span>
                  <span className="block absolute top-full left-0 group-hover:translate-y-[-100%] transition-transform duration-300">{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button className="border border-slate-600/60 hover:bg-slate-800/60 px-6 py-2.5 rounded-full font-medium transition-colors text-zinc-300 hover:text-white">
              Clear Memory
            </button>
            <button 
              className="bg-white hover:shadow-[0px_0px_30px_10px] shadow-[0px_0px_20px_5px] hover:shadow-white/40 shadow-white/40 text-black px-6 py-2.5 rounded-full font-medium hover:bg-slate-100 transition duration-300 relative z-10"
              onClick={() => window.location.reload()}
            >
              New Chat
            </button>
          </div>
        </nav>

        {/* Messages area (added pt-24 to account for floating header) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 pt-24 pb-4 space-y-4"
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
        Welcome to Memorai
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-zinc-400 text-[15px] md:text-base tracking-wide max-w-[480px] mb-14 leading-relaxed"
      >
        The intelligent assistant with persistent memory. Share your thoughts, and I&apos;ll seamlessly connect the dots for our future conversations.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl w-full px-4">
        {[
          {
            icon: <Brain className="w-5 h-5 text-zinc-300" />,
            title: "Persistent Memory",
            desc: "I remember every detail you share over time.",
          },
          {
            icon: <Network className="w-5 h-5 text-zinc-300" />,
            title: "Smart Graph",
            desc: "I actively map relationships between topics.",
          },
          {
            icon: <Shield className="w-5 h-5 text-zinc-300" />,
            title: "Private Context",
            desc: "Your decisions and choices stay locally secured.",
          },
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + idx * 0.1 }}
            className="p-8 rounded-[1.5rem] bg-zinc-950/40 backdrop-blur-xl border border-white/[0.05] shadow-2xl flex flex-col items-center text-center hover:bg-zinc-900/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/[0.05] mb-5 shadow-inner">
              {feature.icon}
            </div>
            <h3 className="text-[14px] font-semibold text-zinc-200 tracking-wide mb-2">{feature.title}</h3>
            <p className="text-[13px] text-zinc-500 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex items-center gap-2 text-zinc-500 bg-white/[0.02] border border-white/[0.05] px-4 py-2 rounded-full backdrop-blur-md"
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[13px] font-medium tracking-wide">Try saying: &quot;My name is Alex&quot;</span>
      </motion.div>
    </motion.div>
  );
}
