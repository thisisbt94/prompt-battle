"use client";

import { PrimaryButton, GhostButton, Eyebrow } from "@/components/ui";

export function ErrorScreen({
  message,
  onRetry,
  onStartOver,
}: {
  message: string | null;
  onRetry: () => void;
  onStartOver: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Eyebrow tone="ink">Connection issue</Eyebrow>
      <p className="font-display max-w-md text-2xl font-semibold text-ink">
        We couldn&rsquo;t reach ILMU just now.
      </p>
      <p className="max-w-sm text-ink-soft">{message || "Try again in a moment."}</p>
      <div className="mt-2 flex gap-3">
        <PrimaryButton onClick={onRetry}>Try Again</PrimaryButton>
        <GhostButton onClick={onStartOver}>Start Over</GhostButton>
      </div>
    </div>
  );
}
