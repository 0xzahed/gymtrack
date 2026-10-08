import mongoose, { Schema } from "mongoose";

const MemberSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    planId: { type: String, default: "" },
    planName: { type: String, default: "" },
    validUntil: { type: String, default: "" }, // YYYY-MM-DD
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export const Member = mongoose.models.Member ?? mongoose.model("Member", MemberSchema);

const PlanSchema = new Schema(
  {
    name: { type: String, required: true },
    durationDays: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Plan = mongoose.models.Plan ?? mongoose.model("Plan", PlanSchema);

const CheckInSchema = new Schema(
  {
    memberId: { type: String, required: true, index: true },
    memberName: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const CheckIn = mongoose.models.CheckIn ?? mongoose.model("CheckIn", CheckInSchema);

const PaymentSchema = new Schema(
  {
    memberId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Payment = mongoose.models.Payment ?? mongoose.model("Payment", PaymentSchema);
