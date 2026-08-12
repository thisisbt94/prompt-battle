import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/aiProvider";
import { getHealth, setHealth } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await getHealth());
}

export async function POST() {
  const result = await healthCheck();
  await setHealth(result);
  return NextResponse.json(result);
}
