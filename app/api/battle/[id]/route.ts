import { NextRequest, NextResponse } from "next/server";
import { runBattle } from "@/lib/battleEngine";
import { getBattle, getChallenges, getConfig, resetBattle, setBattle } from "@/lib/store";
import { BattleId } from "@/lib/types";

function isBattleId(v: string): v is BattleId {
  return v === "a" || v === "b";
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isBattleId(id)) return NextResponse.json({ error: "Unknown battle id" }, { status: 404 });
  return NextResponse.json(await getBattle(id));
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isBattleId(id)) return NextResponse.json({ error: "Unknown battle id" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  const session = await getBattle(id);

  switch (action) {
    case "begin": {
      // Attract mode -> challenge selection
      await setBattle(id, { ...session, phase: "select" });
      return NextResponse.json(await getBattle(id));
    }

    case "select": {
      const challenges = await getChallenges();
      const challenge = challenges.find((c) => c.id === body.challengeId && c.enabled);
      if (!challenge) return NextResponse.json({ error: "Unknown or disabled challenge" }, { status: 400 });
      const config = await getConfig();
      await setBattle(id, {
        ...session,
        phase: "battle",
        challenge,
        promptA: null,
        promptB: null,
        responseA: null,
        responseB: null,
        submittedA: false,
        submittedB: false,
        joinedA: false,
        joinedB: false,
        judge: null,
        error: null,
        durationSeconds: config.battleDurationSeconds,
        startedAt: Date.now(),
        round: session.round + 1,
      });
      return NextResponse.json(await getBattle(id));
    }

    case "join": {
      // A player opened their personal link — mark them as connected so
      // the host screen can show "Player A has joined" before they type.
      const player = body.player as "A" | "B";
      if (player !== "A" && player !== "B") {
        return NextResponse.json({ error: "player must be A or B" }, { status: 400 });
      }
      const updated = { ...session };
      if (player === "A") updated.joinedA = true;
      else updated.joinedB = true;
      await setBattle(id, updated);
      return NextResponse.json(await getBattle(id));
    }

    case "submit": {
      const player = body.player as "A" | "B";
      const prompt = String(body.prompt ?? "").trim();
      if (player !== "A" && player !== "B") {
        return NextResponse.json({ error: "player must be A or B" }, { status: 400 });
      }
      if (!prompt) return NextResponse.json({ error: "Prompt is empty" }, { status: 400 });
      if (session.phase !== "battle") {
        return NextResponse.json({ error: "Battle is not accepting submissions" }, { status: 409 });
      }

      const updated = { ...session };
      if (player === "A") {
        updated.promptA = prompt;
        updated.submittedA = true;
        updated.joinedA = true;
      } else {
        updated.promptB = prompt;
        updated.submittedB = true;
        updated.joinedB = true;
      }

      const bothIn = updated.submittedA && updated.submittedB;
      updated.phase = bothIn ? "thinking" : "battle";
      await setBattle(id, updated);

      if (bothIn) {
        // Fire and forget — clients poll GET for the result.
        runBattle(id);
      }
      return NextResponse.json(await getBattle(id));
    }

    case "retry": {
      if (session.phase !== "error") {
        return NextResponse.json({ error: "Nothing to retry" }, { status: 409 });
      }
      await setBattle(id, { ...session, phase: "thinking", error: null });
      runBattle(id);
      return NextResponse.json(await getBattle(id));
    }

    case "playAgain": {
      // Like reset, but drops straight back to challenge selection instead
      // of the idle attract loop — keeps the booth queue moving.
      await resetBattle(id);
      const fresh = await getBattle(id);
      await setBattle(id, { ...fresh, phase: "select" });
      return NextResponse.json(await getBattle(id));
    }

    case "reset": {
      await resetBattle(id);
      return NextResponse.json(await getBattle(id));
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
