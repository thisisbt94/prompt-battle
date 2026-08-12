"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BattleId, BattleSession, Player } from "@/lib/types";
import { PlayerWaitingScreen } from "@/components/screens/PlayerWaitingScreen";
import { PlayerBattleScreen } from "@/components/screens/PlayerBattleScreen";
import { ThinkingScreen } from "@/components/screens/ThinkingScreen";
import { ResultScreen } from "@/components/screens/ResultScreen";
import { Wordmark } from "@/components/Wordmark";

const POLL_MS = 1200;

async function postAction(id: BattleId, action: string, extra?: Record<string, unknown>) {
  const res = await fetch(`/api/battle/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  });
  return res.json() as Promise<BattleSession>;
}

export function PlayerApp({ id, player }: { id: BattleId; player: Player }) {
  const [session, setSession] = useState<BattleSession | null>(null);
  const hasJoined = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/battle/${id}`);
      const data = (await res.json()) as BattleSession;
      setSession(data);
    } catch {
      // keep last known state; next poll retries
    }
  }, [id]);

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, POLL_MS);
    return () => clearInterval(poll);
  }, [refresh]);

  // Let the host screen know this player's phone has opened the link,
  // once — as soon as we know a round is actually in progress.
  useEffect(() => {
    if (hasJoined.current || !session) return;
    if (session.phase === "battle" || session.phase === "select") {
      hasJoined.current = true;
      postAction(id, "join", { player });
    }
  }, [session, id, player]);

  if (!session) {
    return <div className="flex min-h-dvh items-center justify-center text-ink-faint">Loading…</div>;
  }

  switch (session.phase) {
    case "attract":
    case "select":
      return (
        <PlayerWaitingScreen
          player={player}
          label="Waiting for the host to start the next round…"
        />
      );
    case "battle":
      return (
        <PlayerBattleScreen
          player={player}
          session={session}
          onSubmit={(prompt) => postAction(id, "submit", { player, prompt }).then(setSession)}
        />
      );
    case "thinking":
      return <ThinkingScreen />;
    case "result":
      return <ResultScreen session={session} onPlayAgain={() => {}} showPlayAgain={false} />;
    case "error":
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <Wordmark size="sm" />
          <p className="font-display text-xl font-semibold text-ink">Connection issue</p>
          <p className="max-w-xs text-ink-soft">Check the host screen — they can retry the round.</p>
        </div>
      );
    default:
      return null;
  }
}
