import type { MemberDoc } from "@/lib/store";

export const RENEW_SOON_DAYS = 7;

export type MemberStatus = "active" | "expiring" | "expired" | "no-plan";

export function memberStatus(m: MemberDoc): { status: MemberStatus; daysLeft: number | null } {
  if (!m.validUntil) return { status: "no-plan", daysLeft: null };
  const ms = new Date(m.validUntil + "T00:00:00Z").getTime() - Date.now();
  const daysLeft = Math.floor(ms / 86400000);
  if (daysLeft < 0) return { status: "expired", daysLeft };
  if (daysLeft <= RENEW_SOON_DAYS) return { status: "expiring", daysLeft };
  return { status: "active", daysLeft };
}
