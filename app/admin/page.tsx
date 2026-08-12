"use client";

import { useCallback, useEffect, useState } from "react";
import { AppConfig, Challenge, ChallengeCategory, HealthState } from "@/lib/types";
import { PrimaryButton, GhostButton, Eyebrow, Panel } from "@/components/ui";
import { StatusDot } from "@/components/StatusDot";
import { Wordmark } from "@/components/Wordmark";

const CATEGORIES: ChallengeCategory[] = [
  "LEADERSHIP",
  "COMMUNICATION",
  "DECISION MAKING",
  "PEOPLE",
  "PRODUCTIVITY",
  "WILDCARD",
];

interface Stats {
  battlesCompletedToday: number;
  avgDurationMs: number;
  mostPopularChallenge: string | null;
  lessons: string[];
  totalBattles: number;
}

interface Transcript {
  battleId: "a" | "b";
  round: number;
  challengeTitle: string;
  category: string;
  endedAt: number;
  winner: string | null;
  lesson: string | null;
  promptA: string | null;
  promptB: string | null;
  responseA: string | null;
  responseB: string | null;
  scoreA: number | null;
  scoreB: number | null;
}

function LoginGate({ onAuthed }: { onAuthed: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(false);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      sessionStorage.setItem("pb-admin-token", password);
      onAuthed(password);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
      <Wordmark size="md" />
      <Panel className="w-full max-w-sm p-6">
        <Eyebrow>Admin access</Eyebrow>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Password"
          className="mt-3 w-full rounded-[var(--radius-sm)] border border-line px-4 py-3 text-ink outline-none focus:border-accent"
        />
        {error && <p className="mt-2 text-sm text-danger">Incorrect password.</p>}
        <PrimaryButton onClick={submit} disabled={loading || !password} className="mt-4 w-full">
          {loading ? "Checking…" : "Enter"}
        </PrimaryButton>
      </Panel>
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [health, setHealth] = useState<HealthState | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [persistentStore, setPersistentStore] = useState(true);
  const [openTranscript, setOpenTranscript] = useState<number | null>(null);
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    prompt: "",
    category: "WILDCARD" as ChallengeCategory,
  });

  useEffect(() => {
    const t = sessionStorage.getItem("pb-admin-token");
    if (t) setToken(t);
  }, []);

  const authedFetch = useCallback(
    (url: string, opts: RequestInit = {}) =>
      fetch(url, {
        ...opts,
        headers: { ...(opts.headers ?? {}), "x-admin-token": token ?? "" },
      }),
    [token]
  );

  const load = useCallback(async () => {
    if (!token) return;
    const res = await authedFetch("/api/admin");
    if (!res.ok) return;
    const data = await res.json();
    setConfig(data.config);
    setChallenges(data.challenges);
    setHealth(data.health);
    setStats(data.stats);
    setTranscripts(data.transcripts ?? []);
    setPersistentStore(data.persistentStore ?? true);
  }, [token, authedFetch]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const checkHealth = async () => {
    const res = await fetch("/api/health", { method: "POST" });
    setHealth(await res.json());
  };

  const updateConfig = async (partial: Partial<AppConfig>) => {
    await authedFetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateConfig", config: partial }),
    });
    load();
  };

  const resetBattle = async (battleId: "a" | "b") => {
    await authedFetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resetBattle", battleId }),
    });
  };

  const toggleChallenge = async (c: Challenge) => {
    await authedFetch("/api/admin/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upsert", challenge: { ...c, enabled: !c.enabled } }),
    });
    load();
  };

  const deleteChallenge = async (id: string) => {
    await authedFetch("/api/admin/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    load();
  };

  const addChallenge = async () => {
    if (!newChallenge.title.trim() || !newChallenge.prompt.trim()) return;
    const id = `custom-${Date.now()}`;
    await authedFetch("/api/admin/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challenge: { id, ...newChallenge, enabled: true },
      }),
    });
    setNewChallenge({ title: "", prompt: "", category: "WILDCARD" });
    load();
  };

  const exportTranscripts = async () => {
    const res = await authedFetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "exportTranscripts" }),
    });
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.transcripts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-battle-transcripts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!token) return <LoginGate onAuthed={setToken} />;
  if (!config) return <div className="flex min-h-dvh items-center justify-center text-ink-faint">Loading…</div>;

  return (
    <div className="min-h-dvh px-6 py-10 md:px-12">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="flex items-center justify-between">
          <Wordmark size="md" />
          {health && (
            <button onClick={checkHealth} className="flex items-center gap-2">
              <StatusDot status={health.status} />
            </button>
          )}
        </div>

        {!persistentStore && (
          <div className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger">
            <span className="font-semibold">No persistent store connected.</span> Battle state is
            only kept in this server process&rsquo;s memory — on Vercel that can reset or go out of
            sync between devices at random. Connect Upstash for Redis (Vercel dashboard →
            Marketplace → Upstash for Redis → Connect to this project) before the live event.
          </div>
        )}

        {/* Dashboard */}
        <section>
          <Eyebrow>Dashboard</Eyebrow>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Panel className="p-5">
              <div className="text-3xl font-display font-semibold">{stats?.battlesCompletedToday ?? 0}</div>
              <div className="text-sm text-ink-soft">Battles today</div>
            </Panel>
            <Panel className="p-5">
              <div className="text-3xl font-display font-semibold">
                {stats ? Math.round(stats.avgDurationMs / 1000) : 0}s
              </div>
              <div className="text-sm text-ink-soft">Avg battle time</div>
            </Panel>
            <Panel className="p-5 col-span-2 md:col-span-1">
              <div className="truncate text-lg font-display font-semibold">
                {stats?.mostPopularChallenge ?? "—"}
              </div>
              <div className="text-sm text-ink-soft">Most popular</div>
            </Panel>
            <Panel className="p-5">
              <div className="text-3xl font-display font-semibold">{stats?.totalBattles ?? 0}</div>
              <div className="text-sm text-ink-soft">All-time battles</div>
            </Panel>
          </div>
          {stats && stats.lessons.length > 0 && (
            <Panel className="mt-3 p-5">
              <Eyebrow>Recent lessons identified</Eyebrow>
              <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                {stats.lessons.slice(-6).reverse().map((l, i) => (
                  <li key={i}>· {l}</li>
                ))}
              </ul>
            </Panel>
          )}
        </section>

        {/* Battle controls */}
        <section>
          <Eyebrow>Battle stations</Eyebrow>
          <div className="mt-3 flex gap-3">
            <GhostButton onClick={() => resetBattle("a")}>Reset Battle A</GhostButton>
            <GhostButton onClick={() => resetBattle("b")}>Reset Battle B</GhostButton>
          </div>
        </section>

        {/* Settings */}
        <section>
          <Eyebrow>Settings</Eyebrow>
          <Panel className="mt-3 divide-y divide-line">
            <div className="flex items-center justify-between p-5">
              <div>
                <div className="font-medium text-ink">AI provider</div>
                <div className="text-sm text-ink-soft">Where battle answers come from</div>
              </div>
              <div className="flex gap-2">
                {(["ilmu", "n8n"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => updateConfig({ aiProvider: p })}
                    className={`rounded-full border px-4 py-2 text-sm font-medium ${
                      config.aiProvider === p
                        ? "border-accent bg-accent-soft text-accent-ink"
                        : "border-line text-ink-soft"
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-5">
              <div>
                <div className="font-medium text-ink">Battle duration</div>
                <div className="text-sm text-ink-soft">Seconds each round gives players to write</div>
              </div>
              <input
                type="number"
                min={20}
                max={180}
                value={config.battleDurationSeconds}
                onChange={(e) => updateConfig({ battleDurationSeconds: Number(e.target.value) })}
                className="w-24 rounded-[var(--radius-sm)] border border-line px-3 py-2 text-right outline-none focus:border-accent"
              />
            </div>

            <ToggleRow
              label="AI judging"
              desc="Score both answers and reveal a winner"
              value={config.judgingEnabled}
              onChange={(v) => updateConfig({ judgingEnabled: v })}
            />
            <ToggleRow
              label="Public display shows results"
              desc="Reveal prompts + answers on the central TV once a round finishes"
              value={config.showResultsOnPublicDisplay}
              onChange={(v) => updateConfig({ showResultsOnPublicDisplay: v })}
            />

            <div className="flex items-center justify-between p-5">
              <div>
                <div className="font-medium text-ink">Demo mode</div>
                <div className="text-sm text-ink-soft">
                  {config.demoMode
                    ? "ON — set by DEMO_MODE env var. Mock answers, no live ILMU calls."
                    : "OFF — live calls to the configured provider."}
                </div>
              </div>
            </div>
          </Panel>
        </section>

        {/* Challenges */}
        <section>
          <Eyebrow>Challenges</Eyebrow>
          <Panel className="mt-3 divide-y divide-line">
            {challenges.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-display font-semibold uppercase tracking-wide text-accent">
                      {c.category}
                    </span>
                    <span className="font-medium text-ink">{c.title}</span>
                  </div>
                  <p className="truncate text-sm text-ink-soft">{c.prompt}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => toggleChallenge(c)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      c.enabled ? "border-teal/30 bg-teal-soft text-teal" : "border-line text-ink-faint"
                    }`}
                  >
                    {c.enabled ? "Enabled" : "Disabled"}
                  </button>
                  <button
                    onClick={() => deleteChallenge(c.id)}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-danger hover:border-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </Panel>

          <Panel className="mt-4 p-5">
            <Eyebrow>Add a challenge</Eyebrow>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                placeholder="Title"
                value={newChallenge.title}
                onChange={(e) => setNewChallenge((s) => ({ ...s, title: e.target.value }))}
                className="rounded-[var(--radius-sm)] border border-line px-4 py-2.5 outline-none focus:border-accent"
              />
              <select
                value={newChallenge.category}
                onChange={(e) =>
                  setNewChallenge((s) => ({ ...s, category: e.target.value as ChallengeCategory }))
                }
                className="rounded-[var(--radius-sm)] border border-line px-4 py-2.5 outline-none focus:border-accent"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Challenge prompt shown to both players"
                value={newChallenge.prompt}
                onChange={(e) => setNewChallenge((s) => ({ ...s, prompt: e.target.value }))}
                className="md:col-span-2 rounded-[var(--radius-sm)] border border-line px-4 py-2.5 outline-none focus:border-accent"
                rows={2}
              />
            </div>
            <PrimaryButton onClick={addChallenge} className="mt-3">
              Add challenge
            </PrimaryButton>
          </Panel>
        </section>

        {/* Transcripts */}
        <section>
          <div className="flex items-center justify-between">
            <Eyebrow>Recent rounds (full transcript)</Eyebrow>
            <GhostButton onClick={exportTranscripts}>Export JSON</GhostButton>
          </div>
          <Panel className="mt-3 divide-y divide-line">
            {transcripts.length === 0 && (
              <p className="p-5 text-sm text-ink-soft">No completed rounds yet.</p>
            )}
            {transcripts.map((t, i) => (
              <div key={i} className="p-4">
                <button
                  onClick={() => setOpenTranscript(openTranscript === i ? null : i)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-display font-semibold uppercase tracking-wide text-accent">
                      Battle {t.battleId.toUpperCase()} · {t.category}
                    </span>
                    <span className="ml-2 font-medium text-ink">{t.challengeTitle}</span>
                  </div>
                  <span className="shrink-0 text-sm text-ink-faint">
                    {t.winner ? `Winner: ${t.winner}` : "—"} · {openTranscript === i ? "Hide" : "View"}
                  </span>
                </button>
                {openTranscript === i && (
                  <div className="mt-3 grid grid-cols-1 gap-4 rounded-[var(--radius-sm)] bg-paper p-4 text-sm md:grid-cols-2">
                    <div>
                      <div className="font-semibold text-accent-ink">Player A {t.scoreA != null ? `(${t.scoreA})` : ""}</div>
                      <p className="mt-1 italic text-ink-soft">&ldquo;{t.promptA}&rdquo;</p>
                      <p className="mt-2 whitespace-pre-wrap text-ink">{t.responseA}</p>
                    </div>
                    <div>
                      <div className="font-semibold text-teal">Player B {t.scoreB != null ? `(${t.scoreB})` : ""}</div>
                      <p className="mt-1 italic text-ink-soft">&ldquo;{t.promptB}&rdquo;</p>
                      <p className="mt-2 whitespace-pre-wrap text-ink">{t.responseB}</p>
                    </div>
                    {t.lesson && (
                      <div className="md:col-span-2 border-t border-line pt-3 text-ink-soft">
                        Lesson: {t.lesson}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </Panel>
        </section>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-5">
      <div>
        <div className="font-medium text-ink">{label}</div>
        <div className="text-sm text-ink-soft">{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`h-7 w-12 rounded-full transition-colors ${value ? "bg-accent" : "bg-line"}`}
      >
        <span
          className={`block h-5 w-5 translate-y-1 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
