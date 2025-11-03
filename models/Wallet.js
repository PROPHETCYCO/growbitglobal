import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: String,
        default: () => new Date().toISOString(),
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
}, { _id: true }); // MongoDB will auto-generate `_id` for each withdrawal

const walletSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    walletAddress: {
        type: String,
        default: "",
    },
    totalWalletBalance: {
        type: Number,
        default: 0,
    },
    withdrawals: [withdrawalSchema],
}, { timestamps: true });

export default mongoose.model("Wallet", walletSchema);