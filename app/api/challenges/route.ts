import { NextResponse } from "next/server";
import { getChallenges } from "@/lib/store";

export async function GET() {
  const challenges = (await getChallenges()).filter((c) => c.enabled);
  return NextResponse.json({ challenges });
}
