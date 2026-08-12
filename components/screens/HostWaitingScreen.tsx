"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BattleId, BattleSession, Player } from "@/lib/types";
import { Eyebrow } from "@/components/ui";
import { TimerBadge, useCountdown } from "@/components/Timer";
import { QRCodeCanvas } from "@/components/QRCode";

const PLAYER_STYLE = {
  A: { label: "Player A", tag: "bg-accent text-white", ring: "ring-accent/30" },
  B: { label: "Player B", tag: "bg-teal text-white", ring: "ring-teal/30" },
} as const;

function statusText(joined: boolean, submitted: boolean) {
  if (submitted) return "Submitted ✓";
  if (joined) return "Typing…";
  return "Waiting to join…";
}

function PlayerCard({
  player,
  joined,
  submitted,
  joinUrl,
}: {
  player: Player;
  joined: boolean;
  submitted: boolean;
  joinUrl: string;
}) {
  const style = PLAYER_STYLE[player];
  return (
    <div className={`flex-1 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6 text-center ring-2 ${submitted ? style.ring : "ring-transparent"}`}>
      <span className={`font-display inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${style.tag}`}>
        {style.label}
      </span>
      <p className="mt-3 text-sm font-medium text-ink-soft">{statusText(joined, submitted)}</p>

      {!submitted && (
        <div className="mt-5 flex flex-col items-center gap-2">
          <div className="rounded-[var(--radius-md)] border border-line bg-white p-2">
            <QRCodeCanvas value={joinUrl} size={140} />
          </div>
          <p className="text-xs text-ink-faint">Scan to join on your phone</p>
        </div>
      )}
    </div>
  );
}

export function HostWaitingScreen({
  id,
  session,
  onSubmit,
}: {
  id: BattleId;
  session: BattleSession;
  onSubmit: (player: "A" | "B", prompt: string) => void;
}) {
  const remaining = useCountdown(session.startedAt, session.durationSeconds);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  // If a player never opens the join link in time, auto-submit an empty
  // answer for them so the round doesn't hang forever.
  useEffect(() => {
    if (remaining > 0) return;
    if (!session.submittedA) onSubmit("A", "(no answer submitted)");
    if (!session.submittedB) onSubmit("B", "(no answer submitted)");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const joinUrlA = origin ? `${origin}/play/${id}/A` : "";
  const joinUrlB = origin ? `${origin}/play/${id}/B` : "";

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="border-b border-line bg-paper-raised px-6 py-6 text-center md:px-10">
        <Eyebrow tone="accent">Your challenge</Eyebrow>
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-2 max-w-3xl font-display text-2xl font-semibold text-ink md:text-3xl"
        >
          {session.challenge?.prompt}
        </motion.h1>
        <div className="mt-4 flex justify-center">
          <TimerBadge remaining={remaining} total={session.durationSeconds} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-6 py-10 md:flex-row">
        <PlayerCard player="A" joined={session.joinedA} submitted={session.submittedA} joinUrl={joinUrlA} />
        <PlayerCard player="B" joined={session.joinedB} submitted={session.submittedB} joinUrl={joinUrlB} />
      </div>
    </div>
  );
}
