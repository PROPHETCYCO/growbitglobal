import moment from "moment-timezone";

import Payout from "../models/Payout.js";
import User from "../models/User.js";
import { calculateTreeCommission } from "../utils/tree.js";

// POST /api/payout/calculate
export const calculateCurrentPayout = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        const { totalUsers, commission } = await calculateTreeCommission(userId);

        let payout = await Payout.findOne({ userId });
        if (!payout) {
            payout = new Payout({ userId, name: user.name });
        }

        payout.currentPayout = commission;
        await payout.save();

        return res.json({
            userId,
            name: user.name,
            totalUsersInTree: totalUsers,
            totalCommission: commission,
        });
    } catch (err) {
        console.error("Error calculating current payout:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


// POST /api/payout/finalize
export const finalizeAllPayouts = async (req, res) => {
    try {
        const users = await User.find();
        let summary = [];

        for (const user of users) {
            const { totalUsers, commission } = await calculateTreeCommission(user.userId);

            let payout = await Payout.findOne({ userId: user.userId });
            if (!payout) {
                payout = new Payout({ userId: user.userId, name: user.name });
            }

            if (commission > 0) {
                // Add to total payout
                payout.totalPayout += commission;
                payout.payouts.push({
                    amount: commission,
                    date: moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
                    status: "pending",
                });

                summary.push({
                    userId: user.userId,
                    name: user.name,
                    totalUsersInTree: totalUsers,
                    commissionAdded: commission,
                });
            }

            // ✅ Always reset currentPayout and myStaking for all users
            payout.currentPayout = 0;
            await payout.save();

            user.myStaking = 0;
            await user.save();
        }

        return res.json({
            message: "Payouts finalized successfully for all users",
            summary,
        });
    } catch (err) {
        console.error("Error finalizing payouts:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};