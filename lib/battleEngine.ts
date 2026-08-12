import { generateResponse, judgeBattle } from "./aiProvider";
import { appendLog, getBattle, getConfig, setBattle } from "./store";
import { BattleId } from "./types";

// Fires once both prompts are in. Not awaited by the API route that
// triggers it, so the client gets an instant "thinking" phase and polls
// GET /api/battle/[id] for the result.
export async function runBattle(id: BattleId) {
  const session = await getBattle(id);
  if (!session.challenge || !session.promptA || !session.promptB) return;
  if (session.phase !== "thinking") return;

  const challenge = session.challenge.prompt;

  try {
    const [responseA, responseB] = await Promise.all([
      generateResponse({ battleId: id, player: "A", challenge, prompt: session.promptA }),
      generateResponse({ battleId: id, player: "B", challenge, prompt: session.promptB }),
    ]);

    const config = await getConfig();
    const judge = config.judgingEnabled
      ? await judgeBattle({
          battleId: id,
          challenge,
          promptA: session.promptA,
          responseA,
          promptB: session.promptB,
          responseB,
        })
      : null;

    const current = await getBattle(id);
    // Guard against a reset happening mid-flight.
    if (current.phase !== "thinking") return;

    await setBattle(id, {
      ...current,
      responseA,
      responseB,
      judge,
      phase: "result",
    });

    await appendLog({
      battleId: id,
      round: session.round,
      challengeId: session.challenge.id,
      challengeTitle: session.challenge.title,
      category: session.challenge.category,
      startedAt: session.startedAt ?? Date.now(),
      endedAt: Date.now(),
      durationMs: session.startedAt ? Date.now() - session.startedAt : 0,
      winner: judge?.winner ?? null,
      lesson: judge?.lesson ?? null,
      promptA: session.promptA,
      promptB: session.promptB,
      responseA,
      responseB,
      scoreA: judge?.scoreA ?? null,
      scoreB: judge?.scoreB ?? null,
      reason: judge?.reason ?? null,
    });
  } catch (err) {
    const current = await getBattle(id);
    if (current.phase !== "thinking") return;
    await setBattle(id, {
      ...current,
      phase: "error",
      error:
        err instanceof Error
          ? err.message
          : "We couldn't reach ILMU just now. Try again.",
    });
  }
}
