import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Staking from '../models/Staking.js';
import Payout from '../models/Payout.js';
import { format } from "date-fns-tz";

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


//Withdrawal approval by admin
export const updateWithdrawalStatus = async (req, res) => {
    try {
        const { userId, withdrawalId, action } = req.body;

        if (!userId || !withdrawalId || !action) {
            return res.status(400).json({ success: false, message: "userId, withdrawalId, and action are required" });
        }

        if (!["approve", "reject"].includes(action)) {
            return res.status(400).json({ success: false, message: "Action must be 'approve' or 'reject'" });
        }

        // Find wallet
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found" });
        }

        // Find withdrawal record
        const withdrawal = wallet.withdrawals.id(withdrawalId);
        if (!withdrawal) {
            return res.status(404).json({ success: false, message: "Withdrawal record not found" });
        }

        if (withdrawal.status !== "pending") {
            return res.status(400).json({ success: false, message: "This withdrawal has already been processed" });
        }

        if (action === "approve") {
            // Check sufficient balance before approval
            if (wallet.totalWalletBalance < withdrawal.amount) {
                return res.status(400).json({ success: false, message: "Insufficient wallet balance to approve withdrawal" });
            }

            // Deduct the amount
            wallet.totalWalletBalance -= withdrawal.amount;

            withdrawal.status = "approved";
            withdrawal.date = format(new Date(), "yyyy-MM-dd HH:mm:ss", { timeZone: "Asia/Kolkata" });

        } else if (action === "reject") {
            // If rejected, just mark it
            withdrawal.status = "rejected";
            withdrawal.date = format(new Date(), "yyyy-MM-dd HH:mm:ss", { timeZone: "Asia/Kolkata" });
        }

        await wallet.save();

        res.status(200).json({
            success: true,
            message: `Withdrawal ${action}ed successfully`,
            data: wallet,
        });

    } catch (error) {
        console.error("Error updating withdrawal:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


export const adminUpdateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, phone, email, password, walletAddress } = req.body;

        // Check if user exists
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Update fields only if provided
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (email) user.email = email;
        if (password) user.password = password; // pre-save hook will hash this
        if (walletAddress) user.walletAddress = walletAddress;

        await user.save(); // triggers the pre("save") hook for password hashing

        // If walletAddress provided, update across models
        if (walletAddress) {
            await Promise.all([
                Wallet.updateOne({ userId }, { $set: { walletAddress } }),
                Staking.updateOne({ userId }, { $set: { walletAddress } }),
                Payout.updateMany({ userId }, { $set: { walletAddress } }),
            ]);
        }

        res.status(200).json({
            success: true,
            message: "User details updated successfully",
            updatedUser: {
                userId: user.userId,
                name: user.name,
                phone: user.phone,
                email: user.email,
                walletAddress: user.walletAddress,
            },
        });
    } catch (error) {
        console.error("❌ Error updating user:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating user details",
            error: error.message,
        });
    }
};