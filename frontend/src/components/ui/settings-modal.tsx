import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Moon, Sun, Monitor, Brain, Shield, Bell } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
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
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
            <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            {/* Appearance */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Appearance
              </h3>
              <div className="flex gap-3">
                {['Light', 'Dark', 'System'].map(mode => (
                  <button key={mode} className={`flex-1 py-2 px-3 rounded-xl border ${mode === 'Dark' ? 'border-purple-500/50 bg-purple-500/10 text-white' : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'} text-sm font-medium transition-all`}>
                    {mode}
                  </button>
                ))}
              </div>
            </section>

            {/* AI Mode */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Mode
              </h3>
              <div className="flex gap-3">
                {['Local', 'Cloud'].map(mode => (
                  <button key={mode} className={`flex-1 py-2 px-3 rounded-xl border ${mode === 'Local' ? 'border-purple-500/50 bg-purple-500/10 text-white' : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'} text-sm font-medium transition-all`}>
                    {mode}
                  </button>
                ))}
              </div>
            </section>

            {/* Toggles */}
            <section className="space-y-4">
              {[
                { icon: <Brain className="w-4 h-4"/>, label: "Enable automatic memory", defaultOn: true },
                { icon: <Monitor className="w-4 h-4"/>, label: "Show memory indicators", defaultOn: true },
                { icon: <Shield className="w-4 h-4"/>, label: "Local processing", defaultOn: true },
                { icon: <Bell className="w-4 h-4"/>, label: "Chat notifications", defaultOn: false },
              ].map((setting, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-zinc-300 text-sm">
                    {setting.icon}
                    {setting.label}
                  </div>
                  <div className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${setting.defaultOn ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${setting.defaultOn ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              ))}
            </section>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
