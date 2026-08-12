"use client";

import { motion } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import { Player } from "@/lib/types";

export function PlayerWaitingScreen({ player, label }: { player: Player; label: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Wordmark size="sm" />
      <span
        className={`font-display inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${
          player === "A" ? "bg-accent text-white" : "bg-teal text-white"
        }`}
      >
        You&rsquo;re Player {player}
      </span>
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-ink-faint"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <p className="max-w-xs text-ink-soft">{label}</p>
    </div>
  );
}
