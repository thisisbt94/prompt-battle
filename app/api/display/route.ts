import { NextResponse } from "next/server";
import { getBattle, getConfig } from "@/lib/store";
import { BattleId, BattleSession } from "@/lib/types";

function redact(s: BattleSession, showResults: boolean) {
  const canShowResult = showResults && s.phase === "result";
  return {
    id: s.id,
    phase: s.phase,
    round: s.round,
    challengeTitle: s.challenge?.title ?? null,
    category: s.challenge?.category ?? null,
    joinedA: s.joinedA,
    joinedB: s.joinedB,
    submittedA: s.submittedA,
    submittedB: s.submittedB,
    // Prompts and answers never surface publicly before both submit, and
    // only surface at all if the organiser has opted in.
    promptA: canShowResult ? s.promptA : null,
    promptB: canShowResult ? s.promptB : null,
    responseA: canShowResult ? s.responseA : null,
    responseB: canShowResult ? s.responseB : null,
    judge: canShowResult ? s.judge : null,
  };
}

export async function GET() {
  const config = await getConfig();
  const [a, b] = await Promise.all([getBattle("a" as BattleId), getBattle("b" as BattleId)]);
  return NextResponse.json({
    showResults: config.showResultsOnPublicDisplay,
    a: redact(a, config.showResultsOnPublicDisplay),
    b: redact(b, config.showResultsOnPublicDisplay),
  });
}
