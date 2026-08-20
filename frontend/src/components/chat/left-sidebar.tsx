import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { Plus, Search, Folder, MessageSquare, Settings, User, MoreVertical, Pin, Share, Trash, Edit2 } from "lucide-react";

interface LeftSidebarProps {
  userId: string;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export function LeftSidebar({ userId, onNewChat, onOpenSettings, onOpenProfile, onLogout }: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const mockProjects = [
    "AI/ML Project",
    "College",
    "Internship",
    "Personal"
  ];

  const mockChats = [
    { title: "Build AI project", group: "Today" },
    { title: "Python error", group: "Today" },
    { title: "Machine Learning roadmap", group: "Today" },
    { title: "React project", group: "Yesterday" },
    { title: "Internship discussion", group: "Yesterday" },
    { title: "Database design", group: "Previous 7 Days" },
  ];

  return (
    <div className="w-64 h-full bg-zinc-950/60 backdrop-blur-3xl border-r border-white/5 flex flex-col z-20">
      
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/20">
          <Image src="/logo.jpg" alt="Memorai Logo" fill className="object-cover" />
        </div>
        <span className="font-semibold tracking-tight text-white text-lg">Memorai</span>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 space-y-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between bg-white text-black px-4 py-2.5 rounded-xl font-medium hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Chat
          </span>
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        
        {/* Projects */}
        <div>
          <div className="px-2 mb-2 flex items-center justify-between text-xs font-semibold text-zinc-500 tracking-wider">
            PROJECTS
            <button className="hover:text-zinc-300 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {mockProjects.map(project => (
              <button key={project} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors text-sm group text-left">
                <Folder className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                <span className="truncate">{project}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chats grouped by date */}
        {['Today', 'Yesterday', 'Previous 7 Days'].map(group => {
          const groupChats = mockChats.filter(c => c.group === group);
          if (groupChats.length === 0) return null;
          return (
            <div key={group}>
              <div className="px-2 mb-2 text-xs font-semibold text-zinc-500 tracking-wider uppercase">
                {group}
              </div>
              <div className="space-y-0.5">
                {groupChats.map(chat => (
                  <div key={chat.title} className="group relative flex items-center w-full px-2 py-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors text-sm cursor-pointer">
                    <MessageSquare className="w-4 h-4 opacity-50 group-hover:opacity-100 mr-2.5 shrink-0" />
                    <span className="truncate pr-6">{chat.title}</span>
                    <button className="absolute right-2 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

      </div>

      {/* Footer Profile / Settings */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button onClick={onOpenProfile} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
          <div className="w-5 h-5 rounded-full bg-linear-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
            {userId.substring(0,2).toUpperCase()}
          </div>
          <span className="truncate flex-1 text-left">{userId}</span>
        </button>
      </div>

    </div>
  );
}
