import { NextResponse } from "next/server";
import { addPlan, listPlans } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ plans: await listPlans() });
}

export async function POST(req: Request) {
  let b: { name?: string; durationDays?: number; price?: number };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { name, durationDays, price }." }, { status: 400 });
  }
  try {
    const p = await addPlan(String(b.name ?? ""), Number(b.durationDays), Number(b.price));
    return NextResponse.json(p, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}
