import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { Eyebrow } from "@/components/ui";

const LINKS = [
  { href: "/battle/a", title: "Battle Station A — Host", desc: "Open on the first booth tablet/TV." },
  { href: "/battle/b", title: "Battle Station B — Host", desc: "Open on the second booth tablet/TV." },
  { href: "/display", title: "Central Display", desc: "Put this on the TV above the booth." },
  { href: "/admin", title: "Admin", desc: "Challenges, AI provider, live dashboard, transcripts." },
];

export default function Home() {
  return (
    <div className="grain-bg flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div>
        <Wordmark size="lg" />
        <p className="mt-4 font-display text-lg text-ink-soft">Same AI. Better Question.</p>
      </div>

      <div className="w-full max-w-md text-left">
        <Eyebrow>Launch</Eyebrow>
        <div className="mt-3 space-y-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-[var(--radius-md)] border border-line bg-paper-raised px-6 py-4 shadow-sm transition-colors hover:border-accent hover:bg-accent-soft"
            >
              <div className="font-display font-semibold text-ink">{l.title}</div>
              <div className="text-sm text-ink-soft">{l.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      <p className="max-w-sm text-xs text-ink-faint">
        At the live event, bookmark /battle/a and /battle/b directly on each station&rsquo;s
        tablet/TV. Players never open this page — they get a QR code on the host screen that
        opens their own private /play/&lt;station&gt;/&lt;A or B&gt; link on their phone.
      </p>
    </div>
  );
}
