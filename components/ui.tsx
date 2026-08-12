"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export function PrimaryButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-base font-semibold text-paper transition-transform active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none hover:bg-accent-ink",
        className
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-transparent px-6 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-40 disabled:pointer-events-none",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Eyebrow({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "accent" | "teal" }) {
  const color = tone === "accent" ? "text-accent" : tone === "teal" ? "text-teal" : "text-ink-faint";
  return (
    <span className={clsx("font-display text-xs font-semibold uppercase tracking-[0.22em]", color)}>
      {children}
    </span>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx("rounded-[var(--radius-lg)] border border-line bg-paper-raised", className)}>
      {children}
    </div>
  );
}

export function Chip({
  children,
  active = true,
  tone = "ink",
}: {
  children: ReactNode;
  active?: boolean;
  tone?: "ink" | "accent" | "teal" | "gold";
}) {
  const toneMap = {
    ink: "border-line text-ink-soft bg-paper",
    accent: "border-accent/30 text-accent-ink bg-accent-soft",
    teal: "border-teal/25 text-teal bg-teal-soft",
    gold: "border-gold/30 text-gold bg-gold-soft",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-opacity",
        toneMap[tone],
        !active && "opacity-30"
      )}
    >
      {active && "✓ "}
      {children}
    </span>
  );
}
