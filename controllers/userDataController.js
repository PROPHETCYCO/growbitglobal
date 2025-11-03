import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Payout from "../models/Payout.js";
import Staking from "../models/Staking.js";

// 🔹 Get user details by userId
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Error fetching user:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 🔹 Get wallet by userId
export const getWalletByUserId = async (req, res) => {
    try {
        const { userId } = req.body;

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found" });
        }

        res.status(200).json({ success: true, wallet });
    } catch (error) {
        console.error("Error fetching wallet:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 🔹 Get payouts by userId
export const getPayoutsByUserId = async (req, res) => {
    try {
        const { userId } = req.body;

        const payouts = await Payout.find({ userId }).sort({ createdAt: -1 });
        if (!payouts || payouts.length === 0) {
            return res.status(404).json({ success: false, message: "No payouts found" });
        }

        res.status(200).json({ success: true, count: payouts.length, payouts });
    } catch (error) {
        console.error("Error fetching payouts:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 🔹 Get staking info by userId
export const getStakingByUserId = async (req, res) => {
    try {
        const { userId } = req.body;

        const staking = await Staking.findOne({ userId });
        if (!staking) {
            return res.status(404).json({ success: false, message: "Staking record not found" });
        }

        res.status(200).json({ success: true, staking });
    } catch (error) {
        console.error("Error fetching staking:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};