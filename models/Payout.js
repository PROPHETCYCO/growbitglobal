import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    name: String,
    currentPayout: { type: Number, default: 0 },
    totalPayout: { type: Number, default: 0 },
    payouts: [
        {
            amount: Number,
            date: String, // Indian time formatted
            status: { type: String, enum: ["completed", "pending"], default: "pending" },
        },
    ],
});

export default mongoose.model("Payout", payoutSchema);