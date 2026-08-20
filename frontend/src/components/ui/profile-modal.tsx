import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Mail, Calendar, Shield, LogOut } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onLogout: () => void;
}

export function ProfileModal({ isOpen, onClose, userId, onLogout }: ProfileModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-100">Profile</h2>
            <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex flex-col items-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-linear-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-4xl text-white font-bold mb-6 shadow-xl shadow-purple-900/20">
              {userId.substring(0, 2).toUpperCase()}
            </div>

            <div className="w-full space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase flex items-center gap-2"><User className="w-3 h-3"/> Name</label>
                <div className="bg-zinc-800/50 px-3 py-2 rounded-lg text-zinc-300 text-sm">{userId}</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase flex items-center gap-2"><Mail className="w-3 h-3"/> Email</label>
                <div className="bg-zinc-800/50 px-3 py-2 rounded-lg text-zinc-300 text-sm">{userId}@example.com</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase flex items-center gap-2"><Calendar className="w-3 h-3"/> Account Created</label>
                <div className="bg-zinc-800/50 px-3 py-2 rounded-lg text-zinc-300 text-sm">August 2026</div>
              </div>
            </div>

            <div className="w-full mt-8 space-y-3">
              <button className="w-full py-2.5 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 transition-colors text-sm flex items-center justify-center gap-2">
                Save Changes
              </button>
              
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <button className="w-full py-2.5 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-colors text-sm flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" /> Change Password
                </button>
                <button onClick={onLogout} className="w-full py-2.5 bg-red-500/10 text-red-400 font-medium rounded-xl hover:bg-red-500/20 transition-colors text-sm flex items-center justify-center gap-2 border border-red-500/20">
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
