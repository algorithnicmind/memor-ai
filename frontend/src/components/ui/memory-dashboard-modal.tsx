import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Target, Code, Heart, CheckSquare, Network, AlertTriangle } from "lucide-react";

interface MemoryDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function MemoryDashboardModal({ isOpen, onClose, userId }: MemoryDashboardModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                <Network className="w-6 h-6 text-purple-400" />
                Memory Dashboard
              </h2>
              <p className="text-sm text-zinc-500 mt-1">Manage what the AI knows about you</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-900">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 flex-1 bg-black/20">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-6">My Memory Categories</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {/* Profile Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-purple-500/30 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-zinc-200 flex items-center gap-2"><User className="w-4 h-4 text-purple-400"/> Profile</h4>
                  <button className="px-2 py-1 text-xs text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">Edit</button>
                </div>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>• Computer Science Student</li>
                </ul>
              </div>

              {/* Goals Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-blue-500/30 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-zinc-200 flex items-center gap-2"><Target className="w-4 h-4 text-blue-400"/> Goals</h4>
                  <button className="px-2 py-1 text-xs text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">Edit</button>
                </div>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>• Learn AI/ML</li>
                  <li>• Become ML Engineer</li>
                </ul>
              </div>

              {/* Skills Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-green-500/30 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-zinc-200 flex items-center gap-2"><Code className="w-4 h-4 text-green-400"/> Skills</h4>
                  <button className="px-2 py-1 text-xs text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">Edit</button>
                </div>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>• Python</li>
                  <li>• FastAPI</li>
                  <li>• React</li>
                </ul>
              </div>

              {/* Preferences Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-pink-500/30 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-zinc-200 flex items-center gap-2"><Heart className="w-4 h-4 text-pink-400"/> Preferences</h4>
                  <button className="px-2 py-1 text-xs text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">Edit</button>
                </div>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>• Local AI models</li>
                  <li>• Simple explanations</li>
                </ul>
              </div>

              {/* Decisions Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-amber-500/30 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-zinc-200 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-amber-400"/> Decisions</h4>
                  <button className="px-2 py-1 text-xs text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">Edit</button>
                </div>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>• Using PyTorch for new project</li>
                </ul>
              </div>
            </div>

            {/* Knowledge Graph Snapshot */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-transparent pointer-events-none" />
              <h4 className="font-semibold text-zinc-200 flex items-center gap-2 mb-6"><Network className="w-4 h-4 text-indigo-400"/> Knowledge Graph</h4>
              
              <div className="flex flex-col items-center justify-center space-y-4 font-mono text-xs">
                <div className="px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700 text-purple-300">User (Alex)</div>
                <div className="w-px h-6 bg-zinc-700 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 px-2 py-0.5 rounded text-[10px] text-zinc-500">learning</div>
                </div>
                <div className="px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700 text-blue-300">Recommendation System</div>
                <div className="w-px h-6 bg-zinc-700 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 px-2 py-0.5 rounded text-[10px] text-zinc-500">using</div>
                </div>
                <div className="px-4 py-2 bg-zinc-800 rounded-lg border border-zinc-700 text-green-300">PyTorch</div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6">
              <h4 className="font-semibold text-red-400 flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5"/> Danger Zone</h4>
              <div className="flex flex-wrap gap-3">
                <button className="px-5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-colors">
                  Forget specific category...
                </button>
                <button className="px-5 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors">
                  Wipe All Memory
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
