"use client";

import { motion } from "framer-motion";
import { Challenge, ChallengeCategory } from "@/lib/types";
import { Eyebrow } from "@/components/ui";

const CATEGORY_ORDER: ChallengeCategory[] = [
  "LEADERSHIP",
  "COMMUNICATION",
  "DECISION MAKING",
  "PEOPLE",
  "PRODUCTIVITY",
  "WILDCARD",
];

export function ChallengeSelect({
  challenges,
  onSelect,
}: {
  challenges: Challenge[];
  onSelect: (id: string) => void;
}) {
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: challenges.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-dvh px-6 py-10 md:px-12">
      <div className="mx-auto max-w-5xl">
        <Eyebrow>Choose your challenge</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink md:text-4xl">
          Pick one. Both of you will answer it.
        </h1>
        <p className="mt-2 text-ink-soft">Tap a card to start the 60-second round.</p>

        <div className="mt-10 space-y-9">
          {byCategory.map((group, gi) => (
            <div key={group.category}>
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-faint">
                {group.category}
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {group.items.map((c, ci) => (
                  <motion.button
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (gi * 2 + ci) * 0.03, duration: 0.35 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex flex-col items-start gap-1.5 rounded-[var(--radius-md)] border border-line bg-paper-raised px-6 py-5 text-left shadow-sm transition-colors hover:border-accent hover:bg-accent-soft"
                  >
                    <span className="font-display text-base font-semibold text-ink">{c.title}</span>
                    <span className="text-sm leading-snug text-ink-soft">{c.prompt}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
