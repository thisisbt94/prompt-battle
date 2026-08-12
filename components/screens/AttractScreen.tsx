"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import { PrimaryButton } from "@/components/ui";
import { StatusDot } from "@/components/StatusDot";
import { useHealth } from "@/lib/useHealth";
import { Challenge } from "@/lib/types";

const ROTATE_MS = 4200;

export function AttractScreen({
  onStart,
  challenges,
}: {
  onStart: () => void;
  challenges: Challenge[];
}) {
  const [i, setI] = useState(0);
  const health = useHealth();
  const examples = challenges.length ? challenges : [];

  useEffect(() => {
    if (!examples.length) return;
    const id = setInterval(() => setI((v) => (v + 1) % examples.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [examples.length]);

  return (
    <div className="grain-bg relative flex h-full min-h-dvh flex-col items-center justify-between overflow-hidden px-6 py-10 text-center">
      <div className="flex w-full items-center justify-between">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-ink-faint">
          Prompt Battle
        </span>
        <StatusDot status={health.status} compact />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Wordmark size="lg" />
          <p className="mt-5 font-display text-lg text-ink-soft md:text-xl">
            Same AI. Better Question.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-xl space-y-1.5 text-lg leading-relaxed text-ink-soft md:text-xl"
        >
          <p>Two people.</p>
          <p>One challenge.</p>
          <p>Same AI.</p>
          <p className="font-semibold text-ink">Who gets the better answer?</p>
        </motion.div>

        {examples.length > 0 && (
          <div className="mt-2 h-16 w-full max-w-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={examples[i]?.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="rounded-full border border-line bg-paper-raised px-6 py-3 text-sm text-ink-soft shadow-sm"
              >
                <span className="font-display font-semibold text-accent">{examples[i]?.category}</span>
                {"  ·  "}
                {examples[i]?.prompt}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="pb-6"
      >
        <PrimaryButton onClick={onStart} className="px-14 py-5 text-lg">
          Start Battle
        </PrimaryButton>
      </motion.div>
    </div>
  );
}
