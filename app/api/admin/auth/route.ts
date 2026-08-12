import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (checkAdminPassword(String(password ?? ""))) {
    return NextResponse.json({ ok: true, token: password });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
