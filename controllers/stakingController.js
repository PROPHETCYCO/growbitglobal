import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";
import Staking from "../models/Staking.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { format } from "date-fns-tz";
import moment from "moment-timezone";
import crypto from "crypto";

export const addCoinStaking = async (req, res) => {
    try {
        const { coins, hash } = req.body;
        const file = req.file;
        const user = req.user;

        if (!coins || !hash || !file) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Unique file key for S3
        const uniqueKey = `screenshots/${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${file.originalname}`;

        // Prepare upload command
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: uniqueKey,
            Body: file.buffer,
            ContentType: file.mimetype,
            //ACL: "public-read",
        };

        await s3.send(new PutObjectCommand(uploadParams));

        // Public URL format (if your bucket is public)
        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;

        // Indian date-time
        const istDate = format(new Date(), "yyyy-MM-dd HH:mm:ss", { timeZone: "Asia/Kolkata" });

        // Check if staking exists for user
        let staking = await Staking.findOne({ userId: user.userId });
        if (!staking) {
            staking = new Staking({
                userId: user.userId,
                name: user.name,
                walletAddress: "",
            });
        }

        // Push new staking record
        staking.stakingAdded.push({
            coins,
            hash,
            screenshot: fileUrl,
            dateTime: istDate,
            status: "pending",
        });

        await staking.save();

        res.status(201).json({
            success: true,
            message: "Coin transfer submitted successfully",
            data: staking,
        });
    } catch (err) {
        console.error("Error adding staking:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


// Coin Transfer approve by Admin
export const approveCoinTransfer = async (req, res) => {
    try {
        const { userId, hash } = req.body;

        if (!userId || !hash) {
            return res.status(400).json({ message: "userId and hash are required" });
        }

        // Find staking record for this user
        const staking = await Staking.findOne({ userId });
        if (!staking) {
            return res.status(404).json({ message: "Staking record not found" });
        }

        // Find the specific staking entry by hash
        const stakingEntry = staking.stakingAdded.find(
            (entry) => entry.hash === hash && entry.status === "pending"
        );

        if (!stakingEntry) {
            return res.status(404).json({ message: "Pending staking entry not found for this hash" });
        }

        // ✅ Update entry status to completed
        stakingEntry.status = "approved";

        // ✅ Add this staking amount to overall staking
        const addedCoins = stakingEntry.coins || 0;
        staking.myStaking = (staking.myStaking || 0) + addedCoins;

        await staking.save();

        // ✅ Update user's myStaking field too
        const user = await User.findOne({ userId });
        if (user) {
            user.myStaking = (user.myStaking || 0) + addedCoins;
            await user.save();
        }

        return res.status(200).json({
            message: "Coin transfer approved successfully",
            userId,
            coinsAdded: addedCoins,
            newUserMyStaking: user?.myStaking || 0,
            newTotalMyStaking: staking.myStaking,
        });
    } catch (error) {
        console.error("Error approving coin transfer:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// Run daily at 11:58 PM IST
export const calculateDailyStakingRewards = async (req, res) => {
    try {
        const allStakings = await Staking.find();
        const rewardRate = 0.0011; // 0.11%
        const currentTime = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

        let summary = [];

        for (const staking of allStakings) {
            const { myStaking = 0, stakingRewards = 0 } = staking;

            if (myStaking > 0) {
                const reward = myStaking * rewardRate;
                staking.stakingRewards = stakingRewards + reward;
                await staking.save();

                // ✅ Update or create Wallet entry
                let wallet = await Wallet.findOne({ userId: staking.userId });
                if (!wallet) {
                    res.status(500).json({ message: `Wallet not found for userId: ${staking.userId}` });
                    continue;
                } else {
                    wallet.totalWalletBalance += reward;
                }
                await wallet.save();

                summary.push({
                    userId: staking.userId,
                    name: staking.name,
                    rewardAdded: reward,
                    newTotalRewards: staking.stakingRewards,
                    time: currentTime,
                });
            }
        }

        return res.status(200).json({
            message: "Daily staking rewards calculated successfully",
            time: currentTime,
            summary,
        });
    } catch (error) {
        console.error("Error calculating daily staking rewards:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};