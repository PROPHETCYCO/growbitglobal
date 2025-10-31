import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";
import Staking from "../models/Staking.js";
import { format } from "date-fns-tz";
import crypto from "crypto";

export const addCoinStaking = async (req, res) => {
    try {
        const { coins, hash, walletAddress } = req.body;
        const file = req.file;
        const user = req.user;

        if (!coins || !hash || !walletAddress || !file) {
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
                walletAddress,
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