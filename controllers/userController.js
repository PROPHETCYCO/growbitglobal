import User from "../models/User.js";
import Staking from "../models/Staking.js";
import Wallet from "../models/Wallet.js";
//import jwt from "jsonwebtoken";
import { generateUniqueUserId } from "../utils/generateUserId.js";
import { sendMail } from '../mailer.js';
import { format } from "date-fns-tz";
import { calculateFullTeamBusiness } from "../utils/tree.js";

export const registerUser = async (req, res) => {
    try {
        const { name, phone, email, password, parentId } = req.body;

        // Validation
        if (!name || !phone || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Check if phone/email already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }],
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email or phone number already registered",
            });
        }

        //if not parentId provided, error
        if (!parentId) {
            return res.status(400).json({
                success: false,
                message: "Parent ID is not valid",
            });
        }

        // 🔹 Step 3: Validate parentId (if provided)
        if (parentId) {
            const parentUser = await User.findOne({ userId: parentId });
            if (!parentUser) {
                return res.status(400).json({
                    success: false,
                    message: "Parent ID is not valid",
                });
            }
        }

        // Generate unique userId
        const userId = await generateUniqueUserId();

        // Create referral link
        const baseUrl = "https://example.com/register"; // Replace with your frontend URL
        const referralLink = `${baseUrl}?ref=${userId}`;

        // Create user
        const user = await User.create({
            userId,
            name,
            phone,
            email,
            password,
            referralLink,
            parentId: parentId || null,
        });

        // If user registered with a referral link, update parent user’s referredIds
        if (parentId) {
            await User.updateOne(
                { userId: parentId },
                { $push: { referredIds: userId } }
            );
        }

        try {
            const wallet = await Wallet.create({
                userId,
                name,
                walletAddress: "",
                totalWalletBalance: 0,
                withdrawals: [],
            });
            console.log("🟢 Wallet created successfully:");
        } catch (err) {
            console.error("❌ Error creating wallet:", err.message);
        }

        // Sending Mail
        const subject = `Welcome to Grow Bit Global, ${name || "User"}!`;
        const html = `
            <h2>Welcome to Grow Bit Global</h2>
            <p>Hi ${name || "there"},</p>
            <p>Your account has been created successfully.</p>
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>Login here: <a href="https://yourdomain.com/login">https://yourdomain.com/login</a></p>
            <br/>
            <p><em>Note: Please change your password after your first login.</em></p>
        `;

        await sendMail(email, subject, html);


        res.status(201).json({
            success: true,
            message: "User registered and mail sent successfully",
            // data: {
            //     userId: user.userId,
            //     name: user.name,
            //     email: user.email,
            //     referralLink: user.referralLink,
            //     status: user.status,
            // },
        });
    } catch (error) {
        console.error("Registration error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


//First User
export const registerFirstUser = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;

        // Validation
        if (!name || !phone || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Check if phone/email already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }],
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email or phone number already registered",
            });
        }

        // Generate unique userId
        const userId = await generateUniqueUserId();

        // Create referral link
        const baseUrl = "https://example.com/register"; // Replace with your frontend URL
        const referralLink = `${baseUrl}?ref=${userId}`;

        // Create user
        const user = await User.create({
            userId,
            name,
            phone,
            email,
            password,
            referralLink,
            parentId: parentId || null,
        });

        // If user registered with a referral link, update parent user’s referredIds
        if (parentId) {
            await User.updateOne(
                { userId: parentId },
                { $push: { referredIds: userId } }
            );
        }

        try {
            const wallet = await Wallet.create({
                userId,
                name,
                walletAddress: "",
                totalWalletBalance: 0,
                withdrawals: [],
            });
            console.log("🟢 Wallet created successfully:");
        } catch (err) {
            console.error("❌ Error creating wallet:", err.message);
        }

        // Sending Mail
        const subject = `Welcome to Grow Bit Global, ${name || "User"}!`;
        const html = `
            <h2>Welcome to Grow Bit Global</h2>
            <p>Hi ${name || "there"},</p>
            <p>Your account has been created successfully.</p>
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>Login here: <a href="https://yourdomain.com/login">https://yourdomain.com/login</a></p>
            <br/>
            <p><em>Note: Please change your password after your first login.</em></p>
        `;

        await sendMail(email, subject, html);


        res.status(201).json({
            success: true,
            message: "User registered and mail sent successfully",
            // data: {
            //     userId: user.userId,
            //     name: user.name,
            //     email: user.email,
            //     referralLink: user.referralLink,
            //     status: user.status,
            // },
        });
    } catch (error) {
        console.error("Registration error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


// LOGIN CONTROLLER
export const loginUser = async (req, res) => {
    try {
        const { userId, password } = req.body;

        // Validate input
        if (!userId || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide userId and password",
            });
        }

        // Find user
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Generate JWT
        const token = user.generateAuthToken();

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                status: user.status,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


//Geneology tree
export const getUserAndDirectTeamStaking = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: "userId is required" });
        }

        // 🔹 1️⃣ Find the main user
        const mainUser = await User.findOne({ userId });
        if (!mainUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 🔹 2️⃣ Get the user's staking
        const userStaking = await Staking.findOne({ userId });

        // 🔹 3️⃣ Get all direct team (level 2 — referredIds)
        const directTeamIds = mainUser.referredIds || [];

        // If no direct users, still respond properly
        if (directTeamIds.length === 0) {
            return res.status(200).json({
                success: true,
                message: "User has no direct team members",
                user: {
                    userId: mainUser.userId,
                    name: mainUser.name,
                },
                userStaking: userStaking || null,
                directTeam: [],
            });
        }

        // 🔹 4️⃣ Fetch all direct team user details
        const directUsers = await User.find({ userId: { $in: directTeamIds } });

        // 🔹 5️⃣ Fetch staking for those users
        const directStakings = await Staking.find({ userId: { $in: directTeamIds } });

        // Create a map for fast lookup
        const stakingMap = new Map();
        directStakings.forEach(stk => stakingMap.set(stk.userId, stk));

        // 🔹 6️⃣ Combine results: even if no staking, include user info
        const teamDetails = directUsers.map(user => ({
            userId: user.userId,
            name: user.name,
            email: user.email,
            staking: stakingMap.get(user.userId) || null, // null if no staking
        }));

        // 🔹 7️⃣ Final response
        res.status(200).json({
            success: true,
            message: "User and direct team staking details fetched successfully",
            data: {
                user: {
                    userId: mainUser.userId,
                    name: mainUser.name,
                    email: mainUser.email,
                },
                userStaking: userStaking || null,
                directTeam: teamDetails,
            },
        });

    } catch (error) {
        console.error("Error fetching staking tree:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};



//Register and Update KYC for Users
export const submitKYC = async (req, res) => {
    try {
        const { userId, name, walletAddress } = req.body;

        // Step 1️⃣: Validate input
        if (!userId || !walletAddress) {
            return res.status(400).json({ message: "userId and walletAddress are required." });
        }

        // Step 2️⃣: Check if user exists
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Step 3️⃣: Update wallet address in User model
        user.walletAddress = walletAddress;
        await user.save();

        // Step 4️⃣: Update wallet address in Staking model
        const staking = await Staking.findOne({ userId });
        if (staking) {
            staking.walletAddress = walletAddress;
            await staking.save();
        }

        // Step 5️⃣: Initialize Wallet model if not present
        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
            // Just update wallet address if exists
            wallet.walletAddress = walletAddress;
            await wallet.save();
        }

        return res.status(200).json({
            message: "KYC submitted successfully",
            userId,
            name: name || user.name,
            walletAddress,
        });
    } catch (error) {
        console.error("Error submitting KYC:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// withdrawal request
export const requestWithdrawal = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId || !amount) {
            return res.status(400).json({ success: false, message: "User ID and amount are required" });
        }

        if (amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid withdrawal amount" });
        }

        // Find wallet
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found" });
        }

        // Check balance
        if (wallet.totalWalletBalance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
        }

        // Format date in IST
        const istDate = format(new Date(), "yyyy-MM-dd HH:mm:ss", { timeZone: "Asia/Kolkata" });

        // Add withdrawal record
        wallet.withdrawals.push({
            amount,
            date: istDate,
            status: "pending",
        });

        // Optionally deduct immediately (uncomment if needed)
        // wallet.totalWalletBalance -= amount;

        await wallet.save();

        return res.status(201).json({
            success: true,
            message: "Withdrawal request submitted successfully",
            data: wallet,
        });
    } catch (error) {
        console.error("Error processing withdrawal request:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};



//current team business, total team business, total users in team
export const getFullTeamBusiness = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId)
            return res.status(400).json({ message: "userId is required" });

        const { totalUsers, currentTeamBusiness, totalTeamBusiness } =
            await calculateFullTeamBusiness(userId);

        res.status(200).json({
            success: true,
            message: "Team business calculated successfully",
            data: {
                totalUsers,
                currentTeamBusiness,
                totalTeamBusiness,
            },
        });
    } catch (error) {
        console.error("Error in getFullTeamBusiness:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};