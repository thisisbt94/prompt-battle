"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import { Eyebrow } from "@/components/ui";
import { BattleId, Player } from "@/lib/types";

interface DisplayBattle {
  id: BattleId;
  phase: string;
  round: number;
  challengeTitle: string | null;
  category: string | null;
  joinedA: boolean;
  joinedB: boolean;
  submittedA: boolean;
  submittedB: boolean;
  promptA: string | null;
  promptB: string | null;
  responseA: string | null;
  responseB: string | null;
  judge: { winner: Player | "TIE"; scoreA: number; scoreB: number; reason: string } | null;
}

const PHASE_LABEL: Record<string, string> = {
  attract: "Waiting for players",
  select: "Choosing a challenge",
  battle: "Writing prompts",
  thinking: "Asking ILMU…",
  result: "Result",
  error: "Reconnecting…",
};

function BattleCard({ data }: { data: DisplayBattle }) {
  return (
    <div className="flex-1 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-8">
      <div className="flex items-center justify-between">
        <span className="font-display text-2xl font-semibold text-ink">
          Battle {data.id.toUpperCase()}
        </span>
        <span className="rounded-full border border-line px-3 py-1 text-sm font-medium text-ink-soft">
          {PHASE_LABEL[data.phase] ?? data.phase}
        </span>
      </div>

      {data.challengeTitle && (
        <p className="mt-3 text-ink-soft">
          <span className="font-display font-semibold text-accent">{data.category}</span>
          {"  ·  "}
          {data.challengeTitle}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-[var(--radius-md)] bg-accent-soft px-5 py-4 text-center">
          <div className="font-display font-semibold text-accent-ink">Player A</div>
          <div className="mt-1 text-sm text-ink-soft">
            {data.submittedA ? "Submitted ✓" : data.joinedA ? "Typing…" : "Waiting to join…"}
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] bg-teal-soft px-5 py-4 text-center">
          <div className="font-display font-semibold text-teal">Player B</div>
          <div className="mt-1 text-sm text-ink-soft">
            {data.submittedB ? "Submitted ✓" : data.joinedB ? "Typing…" : "Waiting to join…"}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {data.phase === "result" && data.judge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 border-t border-line pt-6 text-center"
          >
            <p className="font-display text-3xl font-semibold text-ink">
              {data.judge.winner === "TIE" ? "🤝 Tie" : `🏆 Player ${data.judge.winner} wins`}
            </p>
            <p className="font-display mt-1 text-xl text-ink-soft">
              {data.judge.scoreA} vs {data.judge.scoreB}
            </p>
            {data.responseA && data.responseB && (
              <div className="mt-5 grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-xs italic text-ink-faint">&ldquo;{data.promptA}&rdquo;</p>
                  <p className="mt-1 line-clamp-4 text-sm text-ink-soft">{data.responseA}</p>
                </div>
                <div>
                  <p className="text-xs italic text-ink-faint">&ldquo;{data.promptB}&rdquo;</p>
                  <p className="mt-1 line-clamp-4 text-sm text-ink-soft">{data.responseB}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DisplayPage() {
  const [a, setA] = useState<DisplayBattle | null>(null);
  const [b, setB] = useState<DisplayBattle | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/display");
        const data = await res.json();
        setA(data.a);
        setB(data.b);
      } catch {
        // keep last known state; next poll retries
      }
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grain-bg min-h-dvh px-10 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <Wordmark size="md" />
          <Eyebrow>Live Now</Eyebrow>
        </div>

        <div className="mt-8 flex flex-col gap-6 md:flex-row">
          {a && <BattleCard data={a} />}
          {b && <BattleCard data={b} />}
        </div>
      </div>
    </div>
  );
}
