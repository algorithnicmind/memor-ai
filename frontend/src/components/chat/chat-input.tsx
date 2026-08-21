"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Send, Loader2, Plus, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = "Message Memorai...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  }, [message]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech start error:", err);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const snippet = text.length > 2000 ? text.substring(0, 2000) + "\n...[truncated]" : text;
      setMessage((prev) => (prev ? `${prev}\n\n[Attached: ${file.name}]\n${snippet}` : `[Attached: ${file.name}]\n${snippet}`));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto flex flex-col items-center">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.json,.js,.ts,.py,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Sleek Input Container */}
      <div className="w-full relative flex items-end gap-2 bg-zinc-900/80 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-xl shadow-black/40 p-2 pl-3 focus-within:border-purple-500/60 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all">
        
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 w-8 shrink-0 flex items-center justify-center rounded-xl bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.12] transition-colors mb-0.5 cursor-pointer"
          title="Attach text / code file"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Textarea */}
        <div className="flex-1 relative mb-0.5">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening... speak now" : placeholder}
            disabled={isLoading}
            rows={1}
            className={cn(
              "w-full resize-none bg-transparent px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none",
              "transition-all duration-200 min-h-[24px] max-h-[180px] scrollbar-thin scrollbar-thumb-zinc-700",
              isLoading && "opacity-50 cursor-not-allowed",
              isListening && "placeholder:text-purple-400"
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 mb-0.5 pr-1 shrink-0">
          {message.trim().length === 0 ? (
            <button
              type="button"
              onClick={toggleListening}
              className={`h-8 w-8 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                isListening
                  ? "bg-purple-600 text-white animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title={isListening ? "Stop listening" : "Voice Input (Speak to type)"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading}
              className="h-8 w-8 rounded-xl bg-white text-black hover:bg-zinc-200 flex items-center justify-center transition-all disabled:opacity-50 shadow-sm cursor-pointer"
              title="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </motion.button>
          )}
        </div>

      </div>

      {/* Helper Disclaimer */}
      <span className="text-[11px] text-zinc-500 font-medium tracking-wide mt-2">
        Memorai can make mistakes. Consider verifying important information.
      </span>
    </form>
  );
}
