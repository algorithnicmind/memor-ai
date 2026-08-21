"use client";

import { useMotionValue, motion, useSpring, useTransform } from "motion/react";
import React, { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHoverButtonProps {
  text: string;
  imgSrc?: string;
  onClick: () => void;
  className?: string;
}

export function InteractiveHoverButton({ 
  text, 
  imgSrc = "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80", 
  onClick,
  className 
}: InteractiveHoverButtonProps) {
  const ref = useRef<HTMLButtonElement | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const top = useTransform(mouseYSpring, [0.5, -0.5], ["40%", "60%"]);
  const left = useTransform(mouseXSpring, [0.5, -0.5], ["60%", "40%"]);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    const rect = ref.current!.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  return (
    <motion.button
      onClick={onClick}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      initial="initial"
      whileHover="whileHover"
      className={cn(
        "group relative flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] shadow-lg text-left transition-all hover:bg-zinc-800/80 hover:border-purple-500/40",
        className
      )}
    >
      <div className="relative z-10 w-full overflow-hidden">
        <motion.span
          variants={{
            initial: { x: 0 },
            whileHover: { x: -8 },
          }}
          transition={{
            type: "spring",
            staggerChildren: 0.05,
            delayChildren: 0.1,
          }}
          className="relative z-10 block text-sm font-medium text-zinc-300 transition-colors duration-500 group-hover:text-white truncate"
        >
          {text.split("").map((l, i) => (
            <motion.span
              variants={{
                initial: { x: 0 },
                whileHover: { x: 8 },
              }}
              transition={{ type: "spring" }}
              className="inline-block"
              key={i}
            >
              {l === " " ? "\u00A0" : l}
            </motion.span>
          ))}
        </motion.span>
      </div>

      <motion.img
        style={{
          top,
          left,
          translateX: "-10%",
          translateY: "-50%",
        }}
        variants={{
          initial: { scale: 0, rotate: "-12.5deg" },
          whileHover: { scale: 1, rotate: "12.5deg" },
        }}
        transition={{ type: "spring" }}
        src={imgSrc}
        className="absolute z-20 h-16 w-24 rounded-lg object-cover shadow-2xl pointer-events-none border border-white/10"
        alt={`Image representing ${text}`}
      />
      <div className="overflow-hidden absolute right-4 z-30 pointer-events-none bg-zinc-800/80 rounded-full">
        <motion.div
          variants={{
            initial: {
              x: "100%",
              opacity: 0,
            },
            whileHover: {
              x: "0%",
              opacity: 1,
            },
          }}
          transition={{ type: "spring" }}
          className="relative z-10 p-1.5"
        >
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </motion.div>
      </div>
    </motion.button>
  );
}
