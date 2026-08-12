import { getRedis } from "./redis";
import { DEFAULT_CHALLENGES } from "./challenges";
import {
  AppConfig,
  BattleId,
  BattleLogEntry,
  BattleSession,
  Challenge,
  HealthState,
} from "./types";

// -----------------------------------------------------------------------
// STORAGE
//
// Multiple devices (host tablet + two player phones + the TV display +
// admin) all hit this app's API at once. On Vercel that means multiple
// serverless function instances, which do NOT share memory — so this
// module talks to Redis (via Vercel's Upstash integration, see README)
// whenever it's configured, and falls back to a simple in-memory store
// only for local dev when no Redis env vars are set.
//
// Every exported function here is async for that reason, even the
// in-memory fallback path.
// -----------------------------------------------------------------------

const KEYS = {
  battle: (id: BattleId) => `pb:battle:${id}`,
  config: "pb:config",
  challenges: "pb:challenges",
  log: "pb:log",
  health: "pb:health",
};

const MAX_LOG_ENTRIES = 300;

function freshBattle(id: BattleId): BattleSession {
  return {
    id,
    phase: "attract",
    challenge: null,
    promptA: null,
    promptB: null,
    responseA: null,
    responseB: null,
    submittedA: false,
    submittedB: false,
    joinedA: false,
    joinedB: false,
    judge: null,
    durationSeconds: 60,
    startedAt: null,
    error: null,
    round: 0,
    updatedAt: Date.now(),
  };
}

function defaultConfig(): AppConfig {
  return {
    aiProvider: (process.env.AI_PROVIDER as AppConfig["aiProvider"]) || "ilmu",
    battleDurationSeconds: 60,
    judgingEnabled: true,
    showResultsOnPublicDisplay: true,
    demoMode: process.env.DEMO_MODE === "true",
  };
}

// ---------- In-memory fallback (local dev only) --------------------------

interface MemStore {
  battles: Map<BattleId, BattleSession>;
  config: AppConfig;
  challenges: Challenge[];
  log: BattleLogEntry[];
  health: HealthState;
}

const g = globalThis as unknown as { __promptBattleMem?: MemStore };
function mem(): MemStore {
  if (!g.__promptBattleMem) {
    g.__promptBattleMem = {
      battles: new Map([
        ["a", freshBattle("a")],
        ["b", freshBattle("b")],
      ]),
      config: defaultConfig(),
      challenges: DEFAULT_CHALLENGES.map((c) => ({ ...c })),
      log: [],
      health: { status: "offline", latencyMs: null, checkedAt: 0 },
    };
  }
  return g.__promptBattleMem;
}

// ---------- Public API -----------------------------------------------------

export async function getBattle(id: BattleId): Promise<BattleSession> {
  const redis = getRedis();
  if (redis) {
    const val = await redis.get<BattleSession>(KEYS.battle(id));
    return val ?? freshBattle(id);
  }
  return mem().battles.get(id) ?? freshBattle(id);
}

export async function setBattle(id: BattleId, session: BattleSession): Promise<void> {
  session.updatedAt = Date.now();
  const redis = getRedis();
  if (redis) {
    await redis.set(KEYS.battle(id), session);
    return;
  }
  mem().battles.set(id, session);
}

export async function resetBattle(id: BattleId): Promise<void> {
  await setBattle(id, freshBattle(id));
}

export async function getConfig(): Promise<AppConfig> {
  const redis = getRedis();
  if (redis) {
    const val = await redis.get<AppConfig>(KEYS.config);
    return val ?? defaultConfig();
  }
  return mem().config;
}

export async function updateConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
  const current = await getConfig();
  const updated = { ...current, ...partial };
  const redis = getRedis();
  if (redis) {
    await redis.set(KEYS.config, updated);
  } else {
    mem().config = updated;
  }
  return updated;
}

export async function getChallenges(): Promise<Challenge[]> {
  const redis = getRedis();
  if (redis) {
    const val = await redis.get<Challenge[]>(KEYS.challenges);
    if (val && val.length) return val;
    // Seed on first read.
    await redis.set(KEYS.challenges, DEFAULT_CHALLENGES);
    return DEFAULT_CHALLENGES;
  }
  return mem().challenges;
}

export async function setChallenges(challenges: Challenge[]): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(KEYS.challenges, challenges);
    return;
  }
  mem().challenges = challenges;
}

export async function upsertChallenge(challenge: Challenge): Promise<void> {
  const challenges = await getChallenges();
  const idx = challenges.findIndex((c) => c.id === challenge.id);
  if (idx >= 0) challenges[idx] = challenge;
  else challenges.push(challenge);
  await setChallenges(challenges);
}

export async function removeChallenge(id: string): Promise<void> {
  const challenges = await getChallenges();
  await setChallenges(challenges.filter((c) => c.id !== id));
}

export async function appendLog(entry: BattleLogEntry): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.lpush(KEYS.log, entry);
    await redis.ltrim(KEYS.log, 0, MAX_LOG_ENTRIES - 1);
    return;
  }
  mem().log.unshift(entry);
  if (mem().log.length > MAX_LOG_ENTRIES) mem().log.length = MAX_LOG_ENTRIES;
}

// Returns newest-first.
export async function getLog(): Promise<BattleLogEntry[]> {
  const redis = getRedis();
  if (redis) {
    return (await redis.lrange<BattleLogEntry>(KEYS.log, 0, MAX_LOG_ENTRIES - 1)) ?? [];
  }
  return mem().log;
}

export async function getHealth(): Promise<HealthState> {
  const redis = getRedis();
  if (redis) {
    const val = await redis.get<HealthState>(KEYS.health);
    return val ?? { status: "offline", latencyMs: null, checkedAt: 0 };
  }
  return mem().health;
}

export async function setHealth(h: HealthState): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(KEYS.health, h);
    return;
  }
  mem().health = h;
}

export function isPersistentStoreConfigured(): boolean {
  return getRedis() !== null;
}
