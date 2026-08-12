"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BattleId, BattleSession, Challenge } from "@/lib/types";
import { AttractScreen } from "@/components/screens/AttractScreen";
import { ChallengeSelect } from "@/components/screens/ChallengeSelect";
import { HostWaitingScreen } from "@/components/screens/HostWaitingScreen";
import { ThinkingScreen } from "@/components/screens/ThinkingScreen";
import { ResultScreen } from "@/components/screens/ResultScreen";
import { ErrorScreen } from "@/components/screens/ErrorScreen";

const POLL_MS = 1200;
const IDLE_TIMEOUT_MS = 120_000; // return to attract mode after 2 minutes of no action

async function postAction(id: BattleId, action: string, extra?: Record<string, unknown>) {
  const res = await fetch(`/api/battle/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  });
  return res.json() as Promise<BattleSession>;
}

/** The booth tablet / TV — controls the flow, never types a prompt itself. */
export function BattleApp({ id }: { id: BattleId }) {
  const [session, setSession] = useState<BattleSession | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/battle/${id}`);
      const data = (await res.json()) as BattleSession;
      setSession(data);
    } catch {
      // Network hiccup — keep showing the last known state; next poll retries.
    }
  }, [id]);

  useEffect(() => {
    fetch("/api/challenges")
      .then((r) => r.json())
      .then((d) => setChallenges(d.challenges ?? []));
  }, []);

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, POLL_MS);
    return () => clearInterval(poll);
  }, [refresh]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      postAction(id, "reset").then(setSession);
    }, IDLE_TIMEOUT_MS);
  }, [id]);

  useEffect(() => {
    if (session?.phase === "select" || session?.phase === "battle") {
      resetIdleTimer();
    } else if (idleTimer.current) {
      clearTimeout(idleTimer.current);
    }
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [session?.phase, session?.round, resetIdleTimer]);

  if (!session) {
    return <div className="flex min-h-dvh items-center justify-center text-ink-faint">Loading…</div>;
  }

  switch (session.phase) {
    case "attract":
      return (
        <AttractScreen
          challenges={challenges}
          onStart={() => postAction(id, "begin").then(setSession)}
        />
      );
    case "select":
      return (
        <ChallengeSelect
          challenges={challenges}
          onSelect={(challengeId) => postAction(id, "select", { challengeId }).then(setSession)}
        />
      );
    case "battle":
      return (
        <HostWaitingScreen
          id={id}
          session={session}
          onSubmit={(player, prompt) =>
            postAction(id, "submit", { player, prompt }).then(setSession)
          }
        />
      );
    case "thinking":
      return <ThinkingScreen />;
    case "result":
      return (
        <ResultScreen
          session={session}
          onPlayAgain={() => postAction(id, "playAgain").then(setSession)}
        />
      );
    case "error":
      return (
        <ErrorScreen
          message={session.error}
          onRetry={() => postAction(id, "retry").then(setSession)}
          onStartOver={() => postAction(id, "reset").then(setSession)}
        />
      );
    default:
      return null;
  }
}
