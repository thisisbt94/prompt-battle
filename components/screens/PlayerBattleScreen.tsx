"use client";

import { useState } from "react";
import { BattleSession, Player } from "@/lib/types";
import { Eyebrow, PrimaryButton } from "@/components/ui";
import { TimerBadge, useCountdown } from "@/components/Timer";

const PLAYER_STYLE = {
  A: { label: "You're Player A", tag: "bg-accent text-white", focus: "focus:border-accent" },
  B: { label: "You're Player B", tag: "bg-teal text-white", focus: "focus:border-teal" },
} as const;

export function PlayerBattleScreen({
  player,
  session,
  onSubmit,
}: {
  player: Player;
  session: BattleSession;
  onSubmit: (prompt: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const remaining = useCountdown(session.startedAt, session.durationSeconds);
  const submitted = player === "A" ? session.submittedA : session.submittedB;
  const style = PLAYER_STYLE[player];

  if (submitted) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <span className={`font-display inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${style.tag}`}>
          {style.label}
        </span>
        <p className="font-display text-2xl font-semibold text-ink">Submitted ✓</p>
        <p className="max-w-xs text-ink-soft">Look up at the screen — results are coming.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col gap-5 px-5 py-6">
      <div className="flex items-center justify-between">
        <span className={`font-display inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${style.tag}`}>
          {style.label}
        </span>
        <TimerBadge remaining={remaining} total={session.durationSeconds} />
      </div>

      <div>
        <Eyebrow tone="accent">Challenge</Eyebrow>
        <p className="mt-1 text-lg font-medium leading-snug text-ink">{session.challenge?.prompt}</p>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={remaining <= 0}
        autoFocus
        placeholder="Type your instruction to ILMU…"
        className={`min-h-[38vh] flex-1 resize-none rounded-[var(--radius-md)] border-2 border-line bg-paper-raised p-4 text-lg leading-relaxed text-ink outline-none transition-colors disabled:opacity-50 ${style.focus}`}
      />

      <PrimaryButton
        onClick={() => onSubmit(draft.trim())}
        disabled={!draft.trim() || remaining <= 0}
        className="w-full py-4 text-lg"
      >
        Submit
      </PrimaryButton>
      <p className="text-center text-xs text-ink-faint">
        Only you can see this. Player {player === "A" ? "B" : "A"} is writing on their own phone.
      </p>
    </div>
  );
}
