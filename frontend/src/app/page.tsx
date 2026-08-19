<<<<<<< HEAD
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert h-5 w-[100px]"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the{" "}
            <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
              page.tsx
            </code>{" "}
            file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert h-[14px] w-4"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={14}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
=======
"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { ChatInterface } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles, ArrowRight, Lock } from "lucide-react";

// Helper to safely get localStorage on client
function getInitialUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("memorai_user_id");
}

export default function Home() {
  const [userId, setUserId] = useState<string | null>(getInitialUserId);
  const [inputName, setInputName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    setIsLoading(true);
    // Simulate brief loading
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newUserId = inputName.trim().toLowerCase().replace(/\s+/g, "_");
    localStorage.setItem("memorai_user_id", newUserId);
    setUserId(newUserId);
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("memorai_user_id");
    setUserId(null);
    setInputName("");
  };

  // Show chat if logged in
  if (userId) {
    return (
      <div className="relative">
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-lg bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/50 text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all"
        >
          Logout ({userId})
        </button>
        <ChatInterface userId={userId} />
      </div>
    );
  }

  // Login screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-zinc-900/70 backdrop-blur-xl border-zinc-800">
          <CardHeader className="text-center space-y-4">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-linear-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-500/30"
            >
              <Brain className="w-10 h-10 text-white" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-3xl font-bold gradient-text">
                Memorai
              </CardTitle>
              <CardDescription className="text-zinc-400 mt-2">
                An AI that actually remembers you
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Enter your name to begin
                </label>
                <Input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Your name"
                  className="h-12"
                  autoFocus
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={!inputName.trim() || isLoading}
                >
                  {isLoading ? (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Starting...
                    </motion.span>
                  ) : (
                    <>
                      Start Chatting
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 pt-6 border-t border-zinc-800"
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { icon: "🧠", label: "Memory" },
                  { icon: "🔗", label: "Graph" },
                  { icon: "⚡", label: "Fast" },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-xs text-zinc-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Privacy note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-center text-xs text-zinc-500 flex items-center justify-center gap-1"
            >
              <Lock className="w-3 h-3" />
              Your memories are stored locally and privately
            </motion.p>
          </CardContent>
        </Card>

        {/* Powered by */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center text-xs text-zinc-600 flex items-center justify-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          Built for Hackathon 2026
        </motion.p>
      </motion.div>
>>>>>>> b9f5e7db42516df84d24b675dc73685daac6df49
    </div>
  );
}
