import { NextRequest } from "next/server";

// Simple shared-secret admin gate for the prototype. Good enough for a
// staffed booth; swap for real auth before any longer-lived deployment.
export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "promptbattle2026";
  return password === expected;
}

export function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get("x-admin-token");
  const expected = process.env.ADMIN_PASSWORD || "promptbattle2026";
  return header === expected;
}
