import { NextResponse } from "next/server";
import { subscribe } from "@/lib/store";

export async function POST(req: Request) {
  let b: { memberId?: string; planId?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { memberId, planId }." }, { status: 400 });
  }
  try {
    const m = await subscribe(String(b.memberId ?? ""), String(b.planId ?? ""));
    return NextResponse.json(m);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}
