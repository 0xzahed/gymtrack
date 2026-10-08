import { NextResponse } from "next/server";
import { addMember, addPlan, checkIn, listMembers, listPlans } from "@/lib/store";

/** One-click demo data for client demos. */
export async function POST() {
  let plans = await listPlans();
  if (plans.length === 0) {
    await addPlan("Monthly", 30, 1000);
    await addPlan("Quarterly", 90, 2500);
    await addPlan("Yearly", 365, 9000);
    plans = await listPlans();
  }
  const monthly = plans.find((p) => p.name === "Monthly") ?? plans[0];
  let members = await listMembers();
  if (members.length === 0) {
    const seed = [
      { name: "Rahim Sheikh", phone: "01XXXXXXXX1" },
      { name: "Karim Uddin", phone: "01XXXXXXXX2" },
      { name: "Sakib Hasan", phone: "01XXXXXXXX3" },
    ];
    for (const s of seed) {
      try {
        await addMember(s.name, s.phone);
      } catch {
        /* re-seed */
      }
    }
    members = await listMembers();
  }
  let checkins = 0;
  for (const m of members.slice(0, 2)) {
    try {
      await checkIn(m.id);
      checkins++;
    } catch {
      /* skip */
    }
  }
  return NextResponse.json({ plans: plans.length, members: members.length, checkins, monthlyPlan: monthly?.id ?? null });
}
