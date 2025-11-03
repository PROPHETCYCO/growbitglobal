import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Staking from '../models/Staking.js';
import Payout from '../models/Payout.js';

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