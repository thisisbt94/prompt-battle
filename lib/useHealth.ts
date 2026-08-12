"use client";

import { useEffect, useState } from "react";
import { HealthState } from "./types";

export function useHealth(intervalMs = 20000) {
  const [health, setHealth] = useState<HealthState>({
    status: "offline",
    latencyMs: null,
    checkedAt: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/health", { method: "POST" });
        const data = await res.json();
        if (!cancelled) setHealth(data);
      } catch {
        if (!cancelled) setHealth({ status: "offline", latencyMs: null, checkedAt: Date.now() });
      }
    };
    check();
    const id = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return health;
}
