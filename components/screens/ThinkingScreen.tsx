"use client";

import { motion } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";

export function ThinkingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <Wordmark size="sm" className="opacity-60" />
      <div className="flex items-center gap-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-3 w-3 rounded-full bg-accent"
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1, 0.85] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <p className="font-display text-2xl font-semibold text-ink md:text-3xl">Asking ILMU…</p>
    </div>
  );
}
