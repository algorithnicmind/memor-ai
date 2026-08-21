"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { Plus, Search, Folder, MessageSquare, Settings, User, Trash2, Network, PanelLeftClose, Pin, FolderPlus, Check } from "lucide-react";
import { ConversationSummary } from "@/lib/types";
import { api } from "@/lib/api";

interface LeftSidebarProps {
  userId: string;
  isOpen: boolean;
  activeConversationId?: string | null;
  refreshTrigger?: number;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenDashboard: () => void;
  onLogout: () => void;
}

export function LeftSidebar({
  userId,
  isOpen,
  activeConversationId,
  refreshTrigger = 0,
  onToggle,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onOpenSettings,
  onOpenProfile,
  onOpenDashboard,
  onLogout
}: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<string[]>([
    "AI/ML Project",
    "College",
    "Internship",
    "Personal"
  ]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const convos = await api.getConversations();
      setConversations(convos);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (onDeleteConversation) {
        onDeleteConversation(id);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim() && !projects.includes(newProjectName.trim())) {
      setProjects((prev) => [...prev, newProjectName.trim()]);
      setNewProjectName("");
      setIsAddingProject(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = !selectedProject || c.title.toLowerCase().includes(selectedProject.toLowerCase());
    return matchesSearch && matchesProject;
  });

  // Group conversations by date
  const groupConversations = (items: ConversationSummary[]) => {
    const groups: { [key: string]: ConversationSummary[] } = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOf7Days = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

    items.forEach((convo) => {
      const date = new Date(convo.updated_at || convo.created_at);
      if (date >= startOfToday) {
        groups.Today.push(convo);
      } else if (date >= startOfYesterday) {
        groups.Yesterday.push(convo);
      } else if (date >= startOf7Days) {
        groups["Previous 7 Days"].push(convo);
      } else {
        groups.Older.push(convo);
      }
    });

    return groups;
  };

  const grouped = groupConversations(filteredConversations);

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
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="p-3 space-y-2.5 shrink-0">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
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
                <span>Projects & Folders</span>
                <button
                  onClick={() => setIsAddingProject(!isAddingProject)}
                  className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                  title="New Project"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {isAddingProject && (
                <form onSubmit={handleAddProject} className="flex items-center gap-1.5 px-2 mb-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Project tag..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="flex-1 h-7 bg-zinc-900 border border-purple-500/40 rounded-md px-2 text-[11px] text-zinc-200 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-7 px-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-[10px] font-semibold flex items-center justify-center"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </form>
              )}

              <div className="space-y-0.5">
                {projects.map((project) => {
                  const isSelected = selectedProject === project;
                  return (
                    <button
                      key={project}
                      onClick={() => setSelectedProject(isSelected ? null : project)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left group cursor-pointer ${
                        isSelected
                          ? "bg-purple-500/15 text-purple-200 border border-purple-500/30"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Folder className={`w-3.5 h-3.5 transition-colors shrink-0 ${isSelected ? "text-purple-400" : "text-zinc-500 group-hover:text-purple-400"}`} />
                        <span className="truncate">{project}</span>
                      </div>
                      {isSelected && <span className="text-[10px] text-purple-400 font-mono">active</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Real Grouped Conversations */}
            {isLoading && conversations.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 font-mono animate-pulse">
                Loading history...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-6 px-2 space-y-1">
                <p className="text-xs text-zinc-500 font-medium">No conversations yet</p>
                <p className="text-[11px] text-zinc-600">Start chatting to build your history</p>
              </div>
            ) : (
              Object.entries(grouped).map(([group, groupChats]) => {
                if (groupChats.length === 0) return null;

                return (
                  <div key={group}>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 tracking-wider uppercase mb-1.5 px-2">
                      <span>{group}</span>
                    </div>
                    <div className="space-y-0.5">
                      {groupChats.map((chat) => {
                        const isActive = activeConversationId === chat.id;
                        return (
                          <div
                            key={chat.id}
                            onClick={() => onSelectConversation(chat.id)}
                            className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              isActive
                                ? "bg-purple-600/20 text-white border border-purple-500/40 shadow-sm"
                                : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <MessageSquare className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                isActive ? "text-purple-400" : "text-zinc-500 group-hover:text-purple-400"
                              }`} />
                              <span className="truncate">{chat.title || "Conversation"}</span>
                            </div>
                            
                            <button
                              onClick={(e) => handleDelete(e, chat.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all shrink-0 cursor-pointer"
                              title="Delete Conversation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

          </div>

          {/* Footer Section */}
          <div className="p-3 border-t border-white/[0.08] space-y-2 bg-zinc-950 shrink-0">
            <button
              onClick={onOpenDashboard}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 active:scale-[0.98] transition-all text-xs font-semibold cursor-pointer"
            >
              <Network className="w-3.5 h-3.5 text-purple-400" />
              <span>Memory Dashboard</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onOpenSettings}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] active:scale-[0.98] transition-colors text-xs font-medium cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                onClick={onOpenProfile}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] active:scale-[0.98] transition-colors text-xs font-medium cursor-pointer"
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
