"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { Plus, Search, Folder, MessageSquare, Settings, User, MoreVertical, Network, PanelLeftClose, Pin } from "lucide-react";

interface LeftSidebarProps {
  userId: string;
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenDashboard: () => void;
  onLogout: () => void;
}

export function LeftSidebar({
  userId,
  isOpen,
  onToggle,
  onNewChat,
  onOpenSettings,
  onOpenProfile,
  onOpenDashboard,
  onLogout
}: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const mockProjects = [
    "AI/ML Project",
    "College",
    "Internship",
    "Personal"
  ];

  const mockChats = [
    { title: "AI/ML Career Roadmap", group: "Pinned", pinned: true },
    { title: "Build AI project", group: "Today" },
    { title: "Python error", group: "Today" },
    { title: "Machine Learning roadmap", group: "Today" },
    { title: "React project", group: "Yesterday" },
    { title: "Internship discussion", group: "Yesterday" },
    { title: "Database design", group: "Previous 7 Days" },
  ];

  const filteredChats = mockChats.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="shrink-0 h-full w-[280px] bg-zinc-950/90 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col z-30 overflow-hidden"
        >
          {/* Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/20">
                <Image src="/logo.jpg" alt="Memorai" fill sizes="28px" className="object-cover" />
              </div>
              <span className="font-semibold tracking-tight text-white text-[15px]">Memorai</span>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="p-3 space-y-2.5 shrink-0">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            </div>
          </div>

          {/* Scrollable History & Projects */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            
            {/* Projects Section */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 tracking-wider uppercase mb-1.5 px-2">
                <span>Projects</span>
                <button className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors" title="New Project">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-0.5">
                {mockProjects.map((project) => (
                  <button
                    key={project}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors text-left group"
                  >
                    <Folder className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors shrink-0" />
                    <span className="truncate">{project}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grouped Chats */}
            {["Pinned", "Today", "Yesterday", "Previous 7 Days"].map((group) => {
              const groupChats = filteredChats.filter((c) => c.group === group);
              if (groupChats.length === 0) return null;

              return (
                <div key={group}>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 tracking-wider uppercase mb-1.5 px-2">
                    {group === "Pinned" && <Pin className="w-2.5 h-2.5 text-purple-400" />}
                    <span>{group}</span>
                  </div>
                  <div className="space-y-0.5">
                    {groupChats.map((chat) => (
                      <div
                        key={chat.title}
                        className="group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-4">
                          <MessageSquare className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors shrink-0" />
                          <span className="truncate">{chat.title}</span>
                        </div>
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-200 rounded hover:bg-white/10 transition-all shrink-0"
                          title="Chat Options"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          </div>

          {/* Footer Section */}
          <div className="p-3 border-t border-white/[0.08] space-y-2 bg-zinc-950 shrink-0">
            <button
              onClick={onOpenDashboard}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-all text-xs font-semibold"
            >
              <Network className="w-3.5 h-3.5 text-purple-400" />
              <span>Memory Dashboard</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onOpenSettings}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors text-xs font-medium"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                onClick={onOpenProfile}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors text-xs font-medium"
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>
            </div>
          </div>

        </motion.aside>
      )}
    </AnimatePresence>
  );
}
