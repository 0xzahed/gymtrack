import { NextResponse } from "next/server";
import { monthRevenue, recordPayment } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ monthRevenue: await monthRevenue() });
}

export async function POST(req: Request) {
  let b: { memberId?: string; amount?: number; note?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { memberId, amount, note? }." }, { status: 400 });
  }
  try {
    const p = await recordPayment(String(b.memberId ?? ""), Number(b.amount), String(b.note ?? ""));
    return NextResponse.json(p, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}
