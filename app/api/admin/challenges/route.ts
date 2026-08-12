import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/adminAuth";
import { getChallenges, removeChallenge, upsertChallenge } from "@/lib/store";
import { Challenge } from "@/lib/types";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ challenges: await getChallenges() });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  if (body.action === "delete") {
    await removeChallenge(String(body.id));
    return NextResponse.json({ challenges: await getChallenges() });
  }

  const challenge = body.challenge as Challenge;
  if (!challenge?.id || !challenge?.title || !challenge?.prompt || !challenge?.category) {
    return NextResponse.json({ error: "Missing challenge fields" }, { status: 400 });
  }
  await upsertChallenge({ ...challenge, enabled: challenge.enabled ?? true });
  return NextResponse.json({ challenges: await getChallenges() });
}
