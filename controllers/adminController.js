import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Staking from '../models/Staking.js';
import Payout from '../models/Payout.js';

import mongoose from 'mongoose';

// 🔹 Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 🔹 Get all wallets
export const getAllWallets = async (req, res) => {
    try {
        const wallets = await Wallet.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: wallets.length, wallets });
    } catch (error) {
        console.error("Error fetching wallets:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 🔹 Get all payouts
export const getAllPayouts = async (req, res) => {
    try {
        const payouts = await Payout.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: payouts.length, payouts });
    } catch (error) {
        console.error("Error fetching payouts:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 🔹 Get all stakings
export const getAllStakings = async (req, res) => {
    try {
        const stakings = await Staking.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: stakings.length, stakings });
    } catch (error) {
        console.error("Error fetching stakings:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



//approve payouts of user
export const approvePayoutById = async (req, res) => {
    try {
        const { userId, payoutId, amount } = req.body;

        // 🧩 Step 1: Validate inputs
        if (!userId || !payoutId || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: "userId, payoutId, and amount are required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(payoutId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payout ID format",
            });
        }

        // 🧩 Step 2: Find payout document
        const payout = await Payout.findOne({ userId });
        if (!payout) {
            return res.status(404).json({
                success: false,
                message: "Payout record not found for this user",
            });
        }

        // 🧩 Step 3: Find the specific payout entry inside the payouts array
        const payoutEntry = payout.payouts.id(payoutId);
        if (!payoutEntry) {
            return res.status(404).json({
                success: false,
                message: "Payout entry not found",
            });
        }

        // 🧩 Step 4: Ensure status is pending
        if (payoutEntry.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "This payout has already been completed",
            });
        }

        // 🧩 Step 5: Validate the amount matches
        if (Number(payoutEntry.amount) !== Number(amount)) {
            return res.status(400).json({
                success: false,
                message: `Amount mismatch. Expected ${payoutEntry.amount}, got ${amount}`,
            });
        }

        // 🧩 Step 6: Update payout entry
        payoutEntry.status = "completed";
        payout.totalPayout += payoutEntry.amount;
        await payout.save();

        // 🧩 Step 7: Update Wallet total balance
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found for this user",
            });
        }

        wallet.totalWalletBalance += payoutEntry.amount;
        await wallet.save();

        // ✅ Step 8: Return success
        return res.status(200).json({
            success: true,
            message: "Payout approved successfully and wallet updated",
            data: {
                userId,
                payoutId,
                amount: payoutEntry.amount,
                newTotalPayout: payout.totalPayout,
                newWalletBalance: wallet.totalWalletBalance,
                payoutStatus: payoutEntry.status,
            },
        });

    } catch (error) {
        console.error("Error approving payout:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while approving payout",
            error: error.message,
        });
    }
};