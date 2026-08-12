import { getConfig } from "./store";
import { BattleId, HealthState, JudgeResult, Player } from "./types";

// -----------------------------------------------------------------------
// AI PROVIDER ABSTRACTION
//
// Every AI call in Prompt Battle goes through this file. Nothing outside
// lib/ or app/api/ ever touches N8N_* / ILMU_* env vars or secrets — the
// browser only ever talks to our own /api/* routes.
//
// Switch providers with AI_PROVIDER=n8n|ilmu (see AppConfig / /admin).
// -----------------------------------------------------------------------

const TIMEOUT_MS = 18_000;
const RETRY_ONCE = true;

class AiProviderError extends Error {}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!RETRY_ONCE) throw err;
    return await fn();
  }
}

// ---------- Demo mode (only ever used when DEMO_MODE=true) -------------

const DEMO_RESPONSES = [
  "Here's a focused way to approach that: start by naming the outcome you actually need, then work backwards into the three moves that get you there fastest. I'd sequence it as (1) stabilise, (2) communicate, (3) course-correct — each with a single clear owner.",
  "Let's break this into what's urgent versus what's important. The urgent part needs a two-line message today. The important part needs 20 minutes on the calendar this week with the right two people in the room — not everyone.",
  "I'd reframe the ask first: what does success look like for the person on the other side of this? Once that's clear, the message almost writes itself — direct, specific, and easy to say yes to.",
];

function demoGenerate(prompt: string): string {
  const idx = Math.abs(hashCode(prompt)) % DEMO_RESPONSES.length;
  return DEMO_RESPONSES[idx];
}

function demoJudge(promptA: string, promptB: string): JudgeResult {
  const aScore = 60 + (Math.abs(hashCode(promptA)) % 30);
  const bScore = 60 + (Math.abs(hashCode(promptB)) % 30);
  const winner: Player | "TIE" = aScore === bScore ? "TIE" : aScore > bScore ? "A" : "B";
  return {
    winner,
    scoreA: aScore,
    scoreB: bScore,
    reason:
      winner === "TIE"
        ? "Both prompts gave the AI a similar amount to work with."
        : `Player ${winner} gave clearer context and a more specific outcome to aim for.`,
    promptATips: ["Name the audience", "State the outcome you want"],
    promptBTips: ["Add a constraint (length, tone, format)", "Say what 'good' looks like"],
    lesson:
      "Giving AI context about the audience and desired outcome usually produces a more useful response.",
    elementsA: deriveElements(promptA),
    elementsB: deriveElements(promptB),
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function deriveElements(prompt: string): string[] {
  const p = prompt.toLowerCase();
  const found: string[] = [];
  if (/\b(for|to)\s+\w+/.test(p) || /audience|reader|ceo|client|team|manager/.test(p))
    found.push("Audience");
  if (/goal|outcome|so that|in order to|result/.test(p)) found.push("Objective");
  if (/context|background|because|given that/.test(p)) found.push("Context");
  if (/word|sentence|paragraph|tone|format|bullet|list|under|within|minutes/.test(p))
    found.push("Constraints");
  if (/email|memo|message|table|list|summary|script|toast/.test(p)) found.push("Format");
  return found;
}

// ---------- Public API ---------------------------------------------------

export async function healthCheck(): Promise<HealthState> {
  const config = await getConfig();
  if (config.demoMode) {
    return { status: "online", latencyMs: 42, checkedAt: Date.now(), message: "Demo mode" };
  }

  const start = Date.now();
  try {
    if (config.aiProvider === "n8n") {
      const url = process.env.N8N_WEBHOOK_URL;
      const secret = process.env.N8N_SHARED_SECRET;
      if (!url) throw new AiProviderError("N8N_WEBHOOK_URL is not configured");
      await withTimeout((signal) =>
        fetch(url, {
          method: "POST",
          signal,
          headers: {
            "Content-Type": "application/json",
            ...(secret ? { "x-agent-token": secret } : {}),
          },
          body: JSON.stringify({ action: "health" }),
        })
      );
    } else {
      const apiUrl = process.env.ILMU_API_URL || "https://api.ilmu.ai/v1";
      const apiKey = process.env.ILMU_API_KEY;
      const model = process.env.ILMU_MODEL || "ilmu-v3.1";
      if (!apiKey) throw new AiProviderError("ILMU_API_KEY is not configured");
      await withTimeout((signal) =>
        fetch(`${apiUrl}/chat/completions`, {
          method: "POST",
          signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: 1,
            messages: [{ role: "user", content: "ping" }],
          }),
        })
      );
    }
    const latencyMs = Date.now() - start;
    return {
      status: latencyMs > 6000 ? "slow" : "online",
      latencyMs,
      checkedAt: Date.now(),
    };
  } catch (err) {
    return {
      status: "offline",
      latencyMs: null,
      checkedAt: Date.now(),
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function generateResponse(params: {
  battleId: BattleId;
  player: Player;
  challenge: string;
  prompt: string;
}): Promise<string> {
  const config = await getConfig();
  if (config.demoMode) return demoGenerate(params.prompt);

  return withRetry(async () => {
    if (config.aiProvider === "n8n") {
      return callN8n({
        action: "generate",
        experience: "prompt-battle",
        battleId: params.battleId,
        player: params.player,
        challenge: params.challenge,
        prompt: params.prompt,
        timestamp: new Date().toISOString(),
      }).then((data) => {
        if (!data?.success || typeof data.response !== "string") {
          throw new AiProviderError("n8n did not return a usable response");
        }
        return data.response;
      });
    }
    return callIlmuChat([
      {
        role: "system",
        content:
          "You are ILMU, a helpful, concise workplace AI assistant. Answer the person's instruction directly and usefully. Keep it practical and under 180 words unless the instruction clearly calls for more.",
      },
      { role: "user", content: `Challenge context: ${params.challenge}\n\nInstruction: ${params.prompt}` },
    ]);
  });
}

export async function judgeBattle(params: {
  battleId: BattleId;
  challenge: string;
  promptA: string;
  responseA: string;
  promptB: string;
  responseB: string;
}): Promise<JudgeResult> {
  const config = await getConfig();
  if (config.demoMode) return demoJudge(params.promptA, params.promptB);

  return withRetry(async () => {
    let raw: unknown;
    if (config.aiProvider === "n8n") {
      const data = await callN8n({
        action: "judge",
        experience: "prompt-battle",
        battleId: params.battleId,
        challenge: params.challenge,
        promptA: params.promptA,
        responseA: params.responseA,
        promptB: params.promptB,
        responseB: params.responseB,
      });
      raw = typeof data.response === "string" ? safeJsonParse(data.response) : data.response ?? data;
    } else {
      const text = await callIlmuChat(
        [
          {
            role: "system",
            content: JUDGE_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: JSON.stringify({
              challenge: params.challenge,
              promptA: params.promptA,
              responseA: params.responseA,
              promptB: params.promptB,
              responseB: params.responseB,
            }),
          },
        ],
        { jsonMode: true }
      );
      raw = safeJsonParse(text);
    }
    return normalizeJudgeResult(raw, params.promptA, params.promptB);
  });
}

const JUDGE_SYSTEM_PROMPT = `You are the judge for "Prompt Battle", a live conference activity. Two people wrote two different instructions ("prompts") for the same AI, in response to the same challenge. You will be given the challenge, both prompts, and both AI-generated responses.

Judge which RESPONSE is more useful — relevance, clarity, usefulness, understanding of context, specificity, and practicality. Do NOT reward a prompt just for being longer.

Reply with ONLY a JSON object, no preamble, no markdown fences, in exactly this shape:
{"winner":"A"|"B"|"TIE","scoreA":0-100,"scoreB":0-100,"reason":"one short sentence","promptATips":["...","..."],"promptBTips":["...","..."],"lesson":"one short, general, teachable sentence about what made the stronger prompt work"}`;

function safeJsonParse(text: string): unknown {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* fall through */
      }
    }
    throw new AiProviderError("Judge response was not valid JSON");
  }
}

function normalizeJudgeResult(raw: unknown, promptA: string, promptB: string): JudgeResult {
  if (!raw || typeof raw !== "object") throw new AiProviderError("Judge response missing");
  const r = raw as Record<string, unknown>;
  const winner = r.winner === "A" || r.winner === "B" || r.winner === "TIE" ? r.winner : "TIE";
  const clampScore = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 70;
  return {
    winner,
    scoreA: clampScore(r.scoreA),
    scoreB: clampScore(r.scoreB),
    reason: typeof r.reason === "string" && r.reason ? r.reason : "The AI judge compared both answers.",
    promptATips: Array.isArray(r.promptATips) ? r.promptATips.map(String).slice(0, 3) : [],
    promptBTips: Array.isArray(r.promptBTips) ? r.promptBTips.map(String).slice(0, 3) : [],
    lesson:
      typeof r.lesson === "string" && r.lesson
        ? r.lesson
        : "Better questions usually produce better answers.",
    elementsA: deriveElements(promptA),
    elementsB: deriveElements(promptB),
  };
}

// ---------- Provider transports ------------------------------------------

async function callN8n(payload: Record<string, unknown>): Promise<{ success?: boolean; response?: unknown }> {
  const url = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_SHARED_SECRET;
  if (!url) throw new AiProviderError("N8N_WEBHOOK_URL is not configured");

  const res = await withTimeout((signal) =>
    fetch(url, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-agent-token": secret } : {}),
      },
      body: JSON.stringify(payload),
    })
  );
  if (!res.ok) throw new AiProviderError(`n8n webhook returned ${res.status}`);
  return res.json();
}

async function callIlmuChat(
  messages: { role: string; content: string }[],
  opts?: { jsonMode?: boolean }
): Promise<string> {
  const apiUrl = process.env.ILMU_API_URL || "https://api.ilmu.ai/v1";
  const apiKey = process.env.ILMU_API_KEY;
  const model = process.env.ILMU_MODEL || "ilmu-v3.1";
  if (!apiKey) throw new AiProviderError("ILMU_API_KEY is not configured");

  const res = await withTimeout((signal) =>
    fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts?.jsonMode ? 0 : 0.7,
        max_tokens: opts?.jsonMode ? 400 : 500,
      }),
    })
  );
  if (!res.ok) throw new AiProviderError(`ILMU API returned ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new AiProviderError("ILMU API returned no content");
  return content;
}
