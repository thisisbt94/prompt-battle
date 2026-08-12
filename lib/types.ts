export type BattleId = "a" | "b";

export type ChallengeCategory =
  | "LEADERSHIP"
  | "COMMUNICATION"
  | "DECISION MAKING"
  | "PEOPLE"
  | "PRODUCTIVITY"
  | "WILDCARD";

export interface Challenge {
  id: string;
  category: ChallengeCategory;
  title: string;
  prompt: string;
  enabled: boolean;
}

export type BattlePhase =
  | "attract"
  | "select"
  | "battle"
  | "thinking"
  | "result"
  | "error";

export type Player = "A" | "B";

export interface JudgeTips {
  promptATips: string[];
  promptBTips: string[];
}

export interface JudgeResult extends JudgeTips {
  winner: Player | "TIE";
  scoreA: number;
  scoreB: number;
  reason: string;
  lesson: string;
  elementsA: string[];
  elementsB: string[];
}

export interface BattleSession {
  id: BattleId;
  phase: BattlePhase;
  challenge: Challenge | null;
  promptA: string | null;
  promptB: string | null;
  responseA: string | null;
  responseB: string | null;
  submittedA: boolean;
  submittedB: boolean;
  joinedA: boolean;
  joinedB: boolean;
  judge: JudgeResult | null;
  durationSeconds: number;
  startedAt: number | null;
  error: string | null;
  round: number;
  updatedAt: number;
}

export type AiProvider = "n8n" | "ilmu";

export interface AppConfig {
  aiProvider: AiProvider;
  battleDurationSeconds: number;
  judgingEnabled: boolean;
  showResultsOnPublicDisplay: boolean;
  demoMode: boolean;
}

export type HealthStatus = "online" | "slow" | "offline";

export interface HealthState {
  status: HealthStatus;
  latencyMs: number | null;
  checkedAt: number;
  message?: string;
}

export interface BattleLogEntry {
  battleId: BattleId;
  round: number;
  challengeId: string;
  challengeTitle: string;
  category: ChallengeCategory;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  winner: Player | "TIE" | null;
  lesson: string | null;
  // Full transcript — kept because organisers want to review how people
  // actually prompted, not just the aggregate outcome.
  promptA: string | null;
  promptB: string | null;
  responseA: string | null;
  responseB: string | null;
  scoreA: number | null;
  scoreB: number | null;
  reason: string | null;
}
