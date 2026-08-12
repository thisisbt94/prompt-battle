import clsx from "clsx";

export function Wordmark({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-5xl md:text-7xl",
  };
  return (
    <div className={clsx("font-display font-semibold tracking-tight text-ink", sizes[size], className)}>
      PROMPT <span className="text-accent">BATTLE</span>
    </div>
  );
}
