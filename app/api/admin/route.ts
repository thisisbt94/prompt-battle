import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import {
  getChallenges,
  getConfig,
  getHealth,
  getLog,
  isPersistentStoreConfigured,
  resetBattle,
  updateConfig,
} from "@/lib/store";
import { BattleId, BattleLogEntry } from "@/lib/types";

function computeStats(log: BattleLogEntry[]) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const today = log.filter((e) => e.endedAt >= startOfDay.getTime());

  const battlesCompletedToday = today.length;
  const avgDurationMs = today.length
    ? Math.round(today.reduce((sum, e) => sum + e.durationMs, 0) / today.length)
    : 0;

  const popularity = new Map<string, { title: string; count: number }>();
  for (const e of log) {
    const cur = popularity.get(e.challengeId) ?? { title: e.challengeTitle, count: 0 };
    cur.count += 1;
    popularity.set(e.challengeId, cur);
  }
  let mostPopularChallenge: string | null = null;
  let max = 0;
  for (const { title, count } of popularity.values()) {
    if (count > max) {
      max = count;
      mostPopularChallenge = title;
    }
  }

  const lessons = Array.from(
    new Set(log.map((e) => e.lesson).filter((l): l is string => Boolean(l)))
  ).slice(-20);

  return { battlesCompletedToday, avgDurationMs, mostPopularChallenge, lessons, totalBattles: log.length };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const log = await getLog();
  return NextResponse.json({
    config: await getConfig(),
    challenges: await getChallenges(),
    health: await getHealth(),
    stats: computeStats(log),
    transcripts: log.slice(0, 30),
    persistentStore: isPersistentStoreConfigured(),
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  if (body.action === "resetBattle") {
    const id = body.battleId as BattleId;
    if (id !== "a" && id !== "b") return NextResponse.json({ error: "Invalid battle id" }, { status: 400 });
    await resetBattle(id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "updateConfig") {
    const config = await updateConfig(body.config ?? {});
    return NextResponse.json({ ok: true, config });
  }

  if (body.action === "exportTranscripts") {
    const log = await getLog();
    return NextResponse.json({ transcripts: log });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
