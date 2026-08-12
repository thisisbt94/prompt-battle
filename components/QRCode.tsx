"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QRCodeCanvas({ value, size = 168 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#14171c", light: "#ffffff" },
    }).catch(() => {
      /* if generation fails, the join-link text next to it still works */
    });
  }, [value, size]);

  return <canvas ref={ref} width={size} height={size} className="rounded-[var(--radius-sm)]" />;
}
