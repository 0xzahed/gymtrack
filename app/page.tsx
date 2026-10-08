"use client";

import { useCallback, useEffect, useState } from "react";

interface Member {
  id: string;
  name: string;
  phone: string;
  planId: string;
  planName: string;
  validUntil: string;
}

interface Plan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
}

interface Alerts {
  counts: { active: number; expiring: number; expired: number; noPlan: number };
  expiring: (Member & { daysLeft: number })[];
  expired: (Member & { daysLeft: number })[];
}

interface Checkin {
  id: string;
  memberName: string;
  at: string;
}

const input =
  "h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm outline-none placeholder:text-slate-600 focus:border-orange-500";
const btn =
  "h-11 cursor-pointer rounded-xl bg-orange-500 px-5 font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40";
const ghost =
  "h-9 cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-orange-500 hover:text-white";

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [alerts, setAlerts] = useState<Alerts | null>(null);
  const [today, setToday] = useState<Checkin[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [error, setError] = useState("");
  const [mForm, setMForm] = useState({ name: "", phone: "" });
  const [pForm, setPForm] = useState({ name: "", durationDays: "", price: "" });
  const [sub, setSub] = useState({ memberId: "", planId: "" });
  const [pay, setPay] = useState({ memberId: "", amount: "" });

  const load = useCallback(async () => {
    try {
      const [m, p, a, c, r] = await Promise.all([
        fetch("/api/members").then((x) => x.json()),
        fetch("/api/plans").then((x) => x.json()),
        fetch("/api/alerts").then((x) => x.json()),
        fetch("/api/checkin").then((x) => x.json()),
        fetch("/api/payments").then((x) => x.json()),
      ]);
      setMembers(m.members ?? []);
      setPlans(p.plans ?? []);
      setAlerts(a);
      setToday(c.checkins ?? []);
      setRevenue(r.monthRevenue ?? 0);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Failed.");

  const post = async (url: string, body: unknown) => {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? "Failed.");
    return j;
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await post("/api/members", mForm);
      setMForm({ name: "", phone: "" });
      load();
    } catch (e) {
      fail(e);
    }
  };

  const addPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await post("/api/plans", { name: pForm.name, durationDays: Number(pForm.durationDays), price: Number(pForm.price) });
      setPForm({ name: "", durationDays: "", price: "" });
      load();
    } catch (e) {
      fail(e);
    }
  };

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await post("/api/members/subscribe", sub);
      setSub({ memberId: "", planId: "" });
      load();
    } catch (e) {
      fail(e);
    }
  };

  const collect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await post("/api/payments", { memberId: pay.memberId, amount: Number(pay.amount), note: "Fee collection" });
      setPay({ memberId: "", amount: "" });
      load();
    } catch (e) {
      fail(e);
    }
  };

  const checkin = async (memberId: string, name: string) => {
    setError("");
    try {
      const j = await post("/api/checkin", { memberId });
      if (j.expired) setError(`⚠ ${name} er membership expired — renew korte bolo. (Check-in recorded)`);
      load();
    } catch (e) {
      fail(e);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this member?")) return;
    await fetch(`/api/members?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  };

  const seed = async () => {
    await fetch("/api/seed", { method: "POST" });
    load();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-orange-400">GymTrack</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Gym, fully managed.</h1>
          <p className="mt-2 text-slate-400">Members · plans · check-in · fees — one dashboard.</p>
        </div>
        <button onClick={seed} className={ghost}>Load demo data</button>
      </header>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      {alerts && (alerts.counts.expired > 0 || alerts.counts.expiring > 0) && (
        <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="font-bold text-amber-300">⚠ Renewals needed</p>
          <ul className="mt-1.5 space-y-1 text-slate-300">
            {alerts.expired.map((m) => (
              <li key={m.id}>🔴 <b>{m.name}</b> expired {m.validUntil} — call for renewal!</li>
            ))}
            {alerts.expiring.map((m) => (
              <li key={m.id}>🟡 <b>{m.name}</b> expires in {m.daysLeft} days ({m.validUntil}).</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Active members", v: alerts?.counts.active ?? 0 },
          { l: "Check-ins today", v: today.length },
          { l: "Revenue this month (৳)", v: revenue },
          { l: "Expired", v: alerts?.counts.expired ?? 0 },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">{c.l}</p>
            <p className="mt-1 text-3xl font-black tabular-nums">{c.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Members</h2>
          <form onSubmit={addMember} className="mt-3 flex gap-2">
            <input value={mForm.name} onChange={(e) => setMForm({ ...mForm, name: e.target.value })} placeholder="Name *" className={`${input} flex-1`} />
            <input value={mForm.phone} onChange={(e) => setMForm({ ...mForm, phone: e.target.value })} placeholder="Phone" className={`${input} flex-1`} />
            <button type="submit" className={btn}>Add</button>
          </form>
          <ul className="mt-3 space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{m.name} <span className="font-mono text-xs font-normal text-slate-500">{m.phone}</span></p>
                  <p className="font-mono text-xs text-slate-500">{m.planName || "no plan"}{m.validUntil ? ` · till ${m.validUntil}` : ""}</p>
                </div>
                <span className="ml-auto flex gap-2">
                  <button onClick={() => checkin(m.id, m.name)} className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:border-orange-500">✓ In</button>
                  <button onClick={() => remove(m.id)} className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500 hover:border-red-500 hover:text-red-300">Del</button>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-8">
          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Plans</h2>
            <form onSubmit={addPlan} className="mt-3 flex gap-2">
              <input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} placeholder="Monthly" className={`${input} flex-1`} />
              <input value={pForm.durationDays} onChange={(e) => setPForm({ ...pForm, durationDays: e.target.value })} placeholder="Days" inputMode="numeric" className={`${input} w-24`} />
              <input value={pForm.price} onChange={(e) => setPForm({ ...pForm, price: e.target.value })} placeholder="৳" inputMode="numeric" className={`${input} w-24`} />
              <button type="submit" className={btn}>Add</button>
            </form>
            <ul className="mt-3 space-y-2">
              {plans.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm">
                  <b>{p.name}</b>
                  <span className="font-mono text-xs text-slate-500">{p.durationDays} days</span>
                  <span className="ml-auto font-mono font-bold">৳{p.price}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Subscribe / renew</h2>
            <form onSubmit={subscribe} className="mt-3 flex gap-2">
              <select value={sub.memberId} onChange={(e) => setSub({ ...sub, memberId: e.target.value })} className={`${input} flex-1 cursor-pointer`}>
                <option value="">Member…</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={sub.planId} onChange={(e) => setSub({ ...sub, planId: e.target.value })} className={`${input} flex-1 cursor-pointer`}>
                <option value="">Plan…</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — ৳{p.price}</option>)}
              </select>
              <button type="submit" className={btn}>Go</button>
            </form>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Collect fee</h2>
            <form onSubmit={collect} className="mt-3 flex gap-2">
              <select value={pay.memberId} onChange={(e) => setPay({ ...pay, memberId: e.target.value })} className={`${input} flex-1 cursor-pointer`}>
                <option value="">Member…</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} placeholder="৳" inputMode="numeric" className={`${input} w-28`} />
              <button type="submit" className={btn}>Collect</button>
            </form>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Today&apos;s check-ins ({today.length})</h2>
            <ul className="mt-3 space-y-1.5">
              {today.map((c) => (
                <li key={c.id} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  <b>{c.memberName}</b>
                  <span className="ml-auto font-mono text-xs text-slate-500">{new Date(c.at).toLocaleTimeString()}</span>
                </li>
              ))}
              {today.length === 0 && <li className="text-sm text-slate-600">Nobody checked in yet today.</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
