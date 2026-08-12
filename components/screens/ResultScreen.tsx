"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BattleSession, Player } from "@/lib/types";
import { Chip, Eyebrow, Panel, PrimaryButton } from "@/components/ui";

const ALL_ELEMENTS = ["Context", "Objective", "Audience", "Constraints", "Format"];

function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

function AnswerPanel({
  player,
  prompt,
  response,
  isWinner,
  tone,
}: {
  player: Player;
  prompt: string | null;
  response: string | null;
  isWinner: boolean;
  tone: "accent" | "teal";
}) {
  return (
    <Panel className={isWinner ? "ring-2 ring-gold/60" : ""}>
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <span
          className={`font-display inline-flex items-center rounded-full px-3.5 py-1 text-sm font-semibold ${
            tone === "accent" ? "bg-accent text-white" : "bg-teal text-white"
          }`}
        >
          Player {player}
        </span>
        {isWinner && <span className="font-display text-sm font-semibold text-gold">🏆 Winner</span>}
      </div>
      <div className="space-y-4 px-6 py-5">
        <div>
          <Eyebrow>Their prompt</Eyebrow>
          <p className="mt-1.5 text-sm italic leading-relaxed text-ink-soft">&ldquo;{prompt}&rdquo;</p>
        </div>
        <div>
          <Eyebrow tone={tone === "accent" ? "accent" : "teal"}>ILMU response</Eyebrow>
          <p className="mt-1.5 whitespace-pre-wrap text-base leading-relaxed text-ink">{response}</p>
        </div>
      </div>
    </Panel>
  );
}

export function ResultScreen({
  session,
  onPlayAgain,
  showPlayAgain = true,
}: {
  session: BattleSession;
  onPlayAgain: () => void;
  showPlayAgain?: boolean;
}) {
  const judge = session.judge;
  const scoreA = useCountUp(judge?.scoreA ?? 0);
  const scoreB = useCountUp(judge?.scoreB ?? 0);
  const winner = judge?.winner ?? "TIE";
  const winnerElements = winner === "A" ? judge?.elementsA : winner === "B" ? judge?.elementsB : [];

  return (
    <div className="min-h-dvh px-6 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        {judge && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="font-display text-3xl font-semibold text-ink md:text-4xl">
              {winner === "TIE" ? "🤝 It's a tie" : `🏆 Player ${winner} wins`}
            </p>
            <p className="font-display mt-2 text-xl tabular-nums text-ink-soft">
              {scoreA} <span className="text-ink-faint">vs</span> {scoreB}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-ink-soft">{judge.reason}</p>
          </motion.div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <AnswerPanel
            player="A"
            prompt={session.promptA}
            response={session.responseA}
            isWinner={winner === "A"}
            tone="accent"
          />
          <AnswerPanel
            player="B"
            prompt={session.promptB}
            response={session.responseB}
            isWinner={winner === "B"}
            tone="teal"
          />
        </div>

        {judge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 text-center"
          >
            <Eyebrow>What made the difference</Eyebrow>
            <div className="mt-3 flex flex-wrap justify-center gap-2.5">
              {ALL_ELEMENTS.map((el) => (
                <Chip key={el} active={Boolean(winnerElements?.includes(el))} tone="gold">
                  {el}
                </Chip>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-xl font-display text-lg font-medium text-ink">
              The lesson: {judge.lesson}
            </p>
          </motion.div>
        )}

        <div className="mt-10 flex justify-center">
          {showPlayAgain ? (
            <PrimaryButton onClick={onPlayAgain} className="px-12 py-4 text-lg">
              Play Again
            </PrimaryButton>
          ) : (
            <p className="text-sm text-ink-faint">Ask the host to start the next round.</p>
          )}
        </div>
      </div>
    </div>
  );
}
