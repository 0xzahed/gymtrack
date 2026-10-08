import { NextResponse } from "next/server";
import { listMembers } from "@/lib/store";
import { memberStatus } from "@/lib/membership";

export const dynamic = "force-dynamic";

export async function GET() {
  const members = await listMembers();
  const withStatus = members.map((m) => ({ ...m, ...memberStatus(m) }));
  return NextResponse.json({
    counts: {
      active: withStatus.filter((m) => m.status === "active").length,
      expiring: withStatus.filter((m) => m.status === "expiring").length,
      expired: withStatus.filter((m) => m.status === "expired").length,
      noPlan: withStatus.filter((m) => m.status === "no-plan").length,
    },
    expiring: withStatus.filter((m) => m.status === "expiring"),
    expired: withStatus.filter((m) => m.status === "expired"),
  });
}
