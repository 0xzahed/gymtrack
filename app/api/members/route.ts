import { NextResponse } from "next/server";
import { addMember, deleteMember, listMembers } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ members: await listMembers() });
}

export async function POST(req: Request) {
  let b: { name?: string; phone?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { name, phone? }." }, { status: 400 });
  }
  try {
    const m = await addMember(String(b.name ?? ""), String(b.phone ?? ""));
    return NextResponse.json(m, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed." }, { status: 422 });
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  return NextResponse.json({ deleted: await deleteMember(id) });
}
