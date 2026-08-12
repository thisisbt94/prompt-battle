"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

export function useCountdown(startedAt: number | null, durationSeconds: number) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setRemaining(Math.max(0, Math.ceil(durationSeconds - elapsed)));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [startedAt, durationSeconds]);

  return remaining;
}

export function TimerBadge({ remaining, total }: { remaining: number; total: number }) {
  const urgent = remaining <= 10;
  return (
    <div
      className={clsx(
        "font-display inline-flex items-center gap-2 rounded-full border px-5 py-2 text-lg font-semibold tabular-nums transition-colors",
        urgent ? "border-danger/40 bg-danger-soft text-danger" : "border-line bg-paper-raised text-ink"
      )}
    >
      <span className="relative flex h-2 w-2">
        {urgent && remaining > 0 && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-70" />
        )}
        <span className={clsx("relative inline-flex h-2 w-2 rounded-full", urgent ? "bg-danger" : "bg-accent")} />
      </span>
      {remaining}s
    </div>
  );
}
