"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Globe, Cpu, Check, RefreshCw, Sparkles, WifiOff, Laptop } from "lucide-react";
import { ModelsListResponse } from "@/lib/types";
import { api } from "@/lib/api";

interface ModelSelectorProps {
  selectedModel: string;
  selectedProvider: string;
  onSelectModel: (modelId: string, provider: "cloud" | "local") => void;
}

export function ModelSelector({
  selectedModel,
  selectedProvider,
  onSelectModel,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [modelsData, setModelsData] = useState<ModelsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const data = await api.getModels();
      setModelsData(data);
    } catch (err) {
      console.error("Failed to load models list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute active model display name
  const cloudModels = modelsData?.models.filter((m) => m.provider === "cloud") || [
    {
      id: "open-mistral-nemo",
      name: "Mistral NeMo (Fast Cloud)",
      provider: "cloud" as const,
      description: "12B parameter fast inference & 128k context (Online)",
      is_local: false,
      is_available: true,
    },
    {
      id: "mistral-large-latest",
      name: "Mistral Large (Reasoning)",
      provider: "cloud" as const,
      description: "Top-tier reasoning & deep conversational logic (Online)",
      is_local: false,
      is_available: true,
    },
  ];

  const localModels = modelsData?.models.filter((m) => m.provider === "local") || [
    {
      id: "qwen2.5-coder:7b",
      name: "Qwen 2.5 Coder (Ollama Offline)",
      provider: "local" as const,
      description: "Local model running on your laptop",
      is_local: true,
      is_available: modelsData?.ollama_running ?? false,
    },
  ];

  const allModels = [...cloudModels, ...localModels];
  const currentModel = allModels.find((m) => m.id === selectedModel) || {
    id: selectedModel || "open-mistral-nemo",
    name: selectedProvider === "local" ? "Qwen 2.5 Coder (Ollama)" : "Mistral NeMo (Cloud)",
    provider: (selectedProvider as "cloud" | "local") || "cloud",
    description: selectedProvider === "local" ? "Offline Local Engine" : "Online Cloud API",
    is_local: selectedProvider === "local",
    is_available: true,
  };

  const isLocalActive = selectedProvider === "local" || currentModel.is_local;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
          isLocalActive
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
            : "bg-white/[0.05] border-white/[0.1] text-zinc-200 hover:bg-white/[0.1] hover:text-white"
        }`}
        title="Switch between Cloud API and Local Ollama"
      >
        <div className="flex items-center gap-1.5">
          {isLocalActive ? (
            <Laptop className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-purple-400" />
          )}
          <span className="truncate max-w-[140px] sm:max-w-[180px]">
            {currentModel.name.replace(/ \(.*\)/, "")}
          </span>
        </div>

        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono uppercase font-bold tracking-wider ${
            isLocalActive
              ? "bg-emerald-500/25 text-emerald-200"
              : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
          }`}
        >
          {isLocalActive ? "Offline" : "Cloud"}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-[#0c0c14]/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-2xl p-2.5 z-50 overflow-hidden"
          >
            {/* Header & Rescan */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Select Model Engine</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchModels();
                }}
                disabled={isLoading}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                title="Rescan Local Ollama"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                <span>Scan</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
              {/* Group 1: Cloud Models (Online) */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-purple-400" />
                    <span>Cloud Models (Online)</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">API Key</span>
                </div>

                <div className="space-y-1">
                  {cloudModels.map((model) => {
                    const isSelected = selectedModel === model.id && selectedProvider === "cloud";
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id, "cloud");
                          setIsOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between group cursor-pointer ${
                          isSelected
                            ? "bg-purple-500/15 border-purple-500/40 shadow-sm"
                            : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.08]"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">
                              {model.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-1 leading-snug">
                            {model.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Local Models (Ollama - 100% Offline) */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-emerald-400" />
                    <span>Local Models (Ollama Offline)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        modelsData?.ollama_running ? "bg-emerald-400" : "bg-zinc-600"
                      }`}
                    />
                    <span className="text-[10px] font-mono lowercase">
                      {modelsData?.ollama_running ? "running" : "idle"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  {localModels.map((model) => {
                    const isSelected = selectedModel === model.id && selectedProvider === "local";
                    const isReady = model.is_available || modelsData?.ollama_running;
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id, "local");
                          setIsOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between group cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-500/40 shadow-sm"
                            : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.08]"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">
                              {model.name}
                            </span>
                            {isReady ? (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                0 Internet Needed
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Start Ollama
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-1 leading-snug">
                            {model.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Offline tip banner */}
            <div className="mt-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2 text-[11px] text-zinc-400">
              <WifiOff className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>Turn off Wi-Fi & select <b>Local Ollama</b> to chat 100% privately.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
