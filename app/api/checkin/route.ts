import { NextResponse } from "next/server";
import { checkIn, todayCheckins } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ checkins: await todayCheckins() });
}

export async function POST(req: Request) {
  let b: { memberId?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { memberId }." }, { status: 400 });
  }
  try {
    const r = await checkIn(String(b.memberId ?? ""));
    return NextResponse.json(r, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}
