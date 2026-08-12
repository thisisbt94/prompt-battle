"use client";

import { HealthStatus } from "@/lib/types";
import clsx from "clsx";

const LABEL: Record<HealthStatus, string> = {
  online: "ILMU online",
  slow: "ILMU slow",
  offline: "ILMU offline",
};

const COLOR: Record<HealthStatus, string> = {
  online: "bg-teal",
  slow: "bg-gold",
  offline: "bg-danger",
};

export function StatusDot({ status, compact = false }: { status: HealthStatus; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-ink-faint">
      <span className={clsx("relative inline-flex h-2 w-2 rounded-full", COLOR[status])}>
        {status === "online" && (
          <span className={clsx("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", COLOR[status])} />
        )}
      </span>
      {!compact && LABEL[status]}
    </span>
  );
}
