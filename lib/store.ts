import { db } from "@/lib/db";
import { CheckIn, Member, Payment, Plan } from "@/models/Gym";

export interface MemberDoc {
  id: string;
  name: string;
  phone: string;
  planId: string;
  planName: string;
  validUntil: string;
  createdAt: string;
}

export interface PlanDoc {
  id: string;
  name: string;
  durationDays: number;
  price: number;
}

export interface CheckInDoc {
  id: string;
  memberId: string;
  memberName: string;
  at: string;
}

export interface PaymentDoc {
  id: string;
  memberId: string;
  amount: number;
  note: string;
  at: string;
}

type Raw = Record<string, unknown> & { _id?: unknown; createdAt?: Date | string };

const memMembers = new Map<string, MemberDoc>();
const memPlans = new Map<string, PlanDoc>();
const memCheckins: CheckInDoc[] = [];
const memPayments: PaymentDoc[] = [];

const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ---------- Plans ----------
export async function listPlans(): Promise<PlanDoc[]> {
  if (await db()) {
    const rows = (await Plan.find({}).sort({ price: 1 }).lean().catch(() => [])) as unknown as Raw[];
    return rows.map((r) => ({
      id: String(r._id ?? ""),
      name: String(r.name ?? ""),
      durationDays: Number(r.durationDays ?? 0),
      price: Number(r.price ?? 0),
    }));
  }
  return [...memPlans.values()].sort((a, b) => a.price - b.price);
}

export async function addPlan(name: string, durationDays: number, price: number): Promise<PlanDoc> {
  if (!name.trim()) throw new Error("Plan name is required.");
  if (!Number.isFinite(durationDays) || durationDays <= 0) throw new Error("Duration must be positive days.");
  if (!Number.isFinite(price) || price < 0) throw new Error("Price must be 0 or more.");
  if (await db()) {
    const c = await Plan.create({ name: name.trim(), durationDays, price });
    const r = c.toObject() as unknown as Raw;
    return { id: String(r._id ?? ""), name: String(r.name), durationDays: Number(r.durationDays), price: Number(r.price) };
  }
  const p: PlanDoc = { id: rid(), name: name.trim(), durationDays, price };
  memPlans.set(p.id, p);
  return p;
}

async function getPlan(planId: string): Promise<PlanDoc | null> {
  if (await db()) {
    const r = (await Plan.findById(planId).lean().catch(() => null)) as unknown as Raw | null;
    return r ? { id: String(r._id ?? ""), name: String(r.name ?? ""), durationDays: Number(r.durationDays ?? 0), price: Number(r.price ?? 0) } : null;
  }
  return memPlans.get(planId) ?? null;
}

// ---------- Members ----------
const toMember = (r: Raw): MemberDoc => ({
  id: String(r._id ?? r.id ?? ""),
  name: String(r.name ?? ""),
  phone: String(r.phone ?? ""),
  planId: String(r.planId ?? ""),
  planName: String(r.planName ?? ""),
  validUntil: String(r.validUntil ?? ""),
  createdAt: String(r.createdAt ?? new Date().toISOString()),
});

export async function listMembers(): Promise<MemberDoc[]> {
  if (await db()) {
    const rows = (await Member.find({}).sort({ name: 1 }).lean().catch(() => [])) as unknown as Raw[];
    return rows.map(toMember);
  }
  return [...memMembers.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function addMember(name: string, phone: string): Promise<MemberDoc> {
  if (!name.trim()) throw new Error("Member name is required.");
  if (await db()) {
    const c = await Member.create({ name: name.trim(), phone: phone.trim() });
    return toMember(c.toObject() as unknown as Raw);
  }
  const m: MemberDoc = { id: rid(), name: name.trim(), phone: phone.trim(), planId: "", planName: "", validUntil: "", createdAt: new Date().toISOString() };
  memMembers.set(m.id, m);
  return m;
}

export async function deleteMember(id: string): Promise<boolean> {
  if (await db()) {
    const r = await Member.findByIdAndDelete(id).catch(() => null);
    return !!r;
  }
  return memMembers.delete(id);
}

/** Subscribe/renew: sets plan + extends validUntil from today (or current expiry if still active). */
export async function subscribe(id: string, planId: string): Promise<MemberDoc> {
  const plan = await getPlan(planId);
  if (!plan) throw new Error("Plan not found.");
  const today = new Date().toISOString().slice(0, 10);
  const extend = (current: string) => {
    const base = current && current >= today ? current : today;
    const d = new Date(base + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + plan.durationDays);
    return d.toISOString().slice(0, 10);
  };
  if (await db()) {
    const m = await Member.findById(id);
    if (!m) throw new Error("Member not found.");
    m.planId = plan.id;
    m.planName = plan.name;
    m.validUntil = extend(String(m.validUntil ?? ""));
    await m.save();
    await Payment.create({ memberId: id, amount: plan.price, note: `Subscription: ${plan.name}` }).catch(() => undefined);
    return toMember(m.toObject() as unknown as Raw);
  }
  const cur = memMembers.get(id);
  if (!cur) throw new Error("Member not found.");
  const next: MemberDoc = { ...cur, planId: plan.id, planName: plan.name, validUntil: extend(cur.validUntil) };
  memMembers.set(id, next);
  memPayments.push({ id: rid(), memberId: id, amount: plan.price, note: `Subscription: ${plan.name}`, at: new Date().toISOString() });
  return next;
}

// ---------- Check-ins ----------
export async function checkIn(memberId: string): Promise<{ checkin: CheckInDoc; expired: boolean }> {
  let name = "";
  let expired = true;
  if (await db()) {
    const m = (await Member.findById(memberId).lean().catch(() => null)) as unknown as Raw | null;
    if (!m) throw new Error("Member not found.");
    name = String(m.name ?? "");
    const today = new Date().toISOString().slice(0, 10);
    expired = !m.validUntil || String(m.validUntil) < today;
    const c = await CheckIn.create({ memberId, memberName: name });
    const r = c.toObject() as unknown as Raw;
    return { checkin: { id: String(r._id ?? ""), memberId, memberName: name, at: String(r.createdAt ?? new Date().toISOString()) }, expired };
  }
  const cur = memMembers.get(memberId);
  if (!cur) throw new Error("Member not found.");
  const today = new Date().toISOString().slice(0, 10);
  expired = !cur.validUntil || cur.validUntil < today;
  const ci: CheckInDoc = { id: rid(), memberId, memberName: cur.name, at: new Date().toISOString() };
  memCheckins.push(ci);
  return { checkin: ci, expired };
}

export async function todayCheckins(): Promise<CheckInDoc[]> {
  const day = new Date().toISOString().slice(0, 10);
  if (await db()) {
    const start = new Date(day + "T00:00:00Z");
    const rows = (await CheckIn.find({ createdAt: { $gte: start } }).sort({ createdAt: -1 }).lean().catch(() => [])) as unknown as Raw[];
    return rows.map((r) => ({ id: String(r._id ?? ""), memberId: String(r.memberId ?? ""), memberName: String(r.memberName ?? ""), at: String(r.createdAt ?? "") }));
  }
  return memCheckins.filter((c) => c.at.slice(0, 10) === day).reverse();
}

// ---------- Payments ----------
export async function recordPayment(memberId: string, amount: number, note: string): Promise<PaymentDoc> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be positive.");
  if (await db()) {
    const exists = await Member.findById(memberId).lean().catch(() => null);
    if (!exists) throw new Error("Member not found.");
    const c = await Payment.create({ memberId, amount, note });
    const r = c.toObject() as unknown as Raw;
    return { id: String(r._id ?? ""), memberId, amount, note, at: String(r.createdAt ?? new Date().toISOString()) };
  }
  if (!memMembers.has(memberId)) throw new Error("Member not found.");
  const p: PaymentDoc = { id: rid(), memberId, amount, note, at: new Date().toISOString() };
  memPayments.push(p);
  return p;
}

export async function monthRevenue(): Promise<number> {
  const month = new Date().toISOString().slice(0, 7);
  if (await db()) {
    const start = new Date(month + "-01T00:00:00Z");
    const rows = (await Payment.find({ createdAt: { $gte: start } }).lean().catch(() => [])) as unknown as { amount: number }[];
    return rows.reduce((a, r) => a + (Number(r.amount) || 0), 0);
  }
  return memPayments.filter((p) => p.at.slice(0, 7) === month).reduce((a, p) => a + p.amount, 0);
}
