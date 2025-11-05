import mongoose from "mongoose";

// 🕒 Helper function to get IST date string
export function getISTDateString() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC + 5:30
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().replace("Z", "+05:30");
}

// 🔹 Common withdrawal schema
const withdrawalSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    payment:{
        type: Number,
        required: true,
    },
    date: {
        type: String,
        default: getISTDateString, // Save time in IST
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
}, { _id: true });

// 🔹 Main wallet schema
const walletSchema = new mongoose.Schema(
    {
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

        // 🟢 Wallet Balances
        totalWalletBalance: {
            type: Number,
            default: 0,
        },
        ryWalletBalance: {
            type: Number,
            default: 0,
        },
        payoutWalletBalance: {
            type: Number,
            default: 0,
        },

        // 🟣 Withdrawals
        withdrawals: [withdrawalSchema],
        ryWithdrawals: [withdrawalSchema],
        payoutWithdrawals: [withdrawalSchema],
    },
    { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);