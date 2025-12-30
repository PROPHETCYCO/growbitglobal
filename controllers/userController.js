import User from "../models/User.js";
import Staking from "../models/Staking.js";
import Wallet from "../models/Wallet.js";
import Payout from "../models/Payout.js";
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
        const baseUrl = "https://growbitglobal.org/register"; // Replace with your frontend URL
        const referralLink = `${baseUrl}/${userId}`;

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
                ryWalletBalance: 0,
                payoutWalletBalance: 0,
                withdrawals: [],
                ryWithdrawals: [],
                payoutWithdrawals: [],
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
            <p>Login here: <a href="https://growbitglobal.org/login">https://growbitglobal.org/login</a></p>
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
        const baseUrl = "https://growbitglobal.org/register"; // Replace with your frontend URL
        const referralLink = `${baseUrl}/${userId}`;

        // Create user
        const user = await User.create({
            userId,
            name,
            phone,
            email,
            password,
            referralLink,
        });

        // If user registered with a referral link, update parent user’s referredIds
        // if (parentId) {
        //     await User.updateOne(
        //         { userId: parentId },
        //         { $push: { referredIds: userId } }
        //     );
        // }

        try {
            const wallet = await Wallet.create({
                userId,
                name,
                walletAddress: "",
                totalWalletBalance: 0,
                ryWalletBalance: 0,
                payoutWalletBalance: 0,
                withdrawals: [],
                ryWithdrawals: [],
                payoutWithdrawals: [],
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
            <p>Login here: <a href="https://growbitglobal.org/login">https://growbitglobal.org/login</a></p>
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
export const requestpayoutWithdrawal = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId || !amount) {
            return res.status(400).json({ success: false, message: "User ID and amount are required" });
        }

        if (amount < 30) {
            return res.status(400).json({ success: false, message: "Minimum withdrawal amount is ₹30" });
        }

        // Find wallet
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found" });
        }

        // Check balance
        if (wallet.payoutWalletBalance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
        }

        // Format date in IST
        //const istDate = format(new Date(), "yyyy-MM-dd HH:mm:ss", { timeZone: "Asia/Kolkata" });

        const fee = amount * 0.05;
        const finalAmount = amount - fee;

        // Add withdrawal record
        wallet.payoutWithdrawals.push({
            amount,
            payment: finalAmount,
            status: "pending",
        });

        //Add ryWalletBalance deduction on request
        wallet.withdrawals.push({
            amount,
            payment: finalAmount,
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


// RY withdrawal Request
export const requestryWithdrawal = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        // 1️⃣ Validate input
        if (!userId || !amount) {
            return res.status(400).json({ success: false, message: "User ID and amount are required" });
        }

        if (amount < 30) {
            return res.status(400).json({ success: false, message: "Minimum withdrawal amount is ₹30" });
        }

        // 2️⃣ Find user wallet
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found" });
        }

        // 3️⃣ Check if user has enough balance
        if (wallet.ryWalletBalance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient RY wallet balance" });
        }

        // 4️⃣ Check 30-day gap between withdrawals
        // const lastWithdrawal = wallet.ryWithdrawals?.length
        //     ? wallet.ryWithdrawals[wallet.ryWithdrawals.length - 1]
        //     : null;

        // if (lastWithdrawal) {
        //     const lastDate = new Date(lastWithdrawal.date.replace("+05:30", "Z")); // Convert IST ISO to UTC Date
        //     const now = new Date();
        //     const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);

        //     if (diffDays < 30) {
        //         return res.status(400).json({
        //             success: false,
        //             message: `You can request a new withdrawal after ${Math.ceil(30 - diffDays)} day(s).`,
        //         });
        //     }
        // }

        // 📅 Withdrawal allowed only on fixed dates
        const now = new Date();

        // Convert to IST
        const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
        const currentDay = istNow.getDate();       // 1–31
        const currentMonth = istNow.getMonth() + 1; // 1–12

        let allowedDay;

        // February → 28th (leap year ignored as per requirement)
        if (currentMonth === 2) {
            allowedDay = 28;
        } else {
            allowedDay = 30;
        }

        if (currentDay !== allowedDay) {
            return res.status(400).json({
                success: false,
                message: `Withdrawals are allowed only on ${allowedDay}${currentMonth === 2 ? "th February" : "th of each month"}.`,
            });
        }

        const fee = amount * 0.05;
        const finalAmount = amount - fee;

        // 5️⃣ Add new withdrawal (date auto-saved as IST by schema)
        wallet.ryWithdrawals.push({
            amount,
            payment: finalAmount,
            status: "pending",
        });

        // Optional: also add to generic withdrawals array if you track both
        wallet.withdrawals.push({
            amount,
            payment: finalAmount,
            status: "pending",
        });

        await wallet.save();

        // 6️⃣ Success response
        return res.status(201).json({
            success: true,
            message: "Withdrawal request submitted successfully",
            data: wallet,
        });

    } catch (error) {
        console.error("❌ Error processing withdrawal request:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};



//current team business, total team business, total users in team
export const getFullTeamBusiness = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: "userId is required" });
        }

        // 🧮 Calculate team business
        const { totalUsers, currentTeamBusiness, totalTeamBusiness } =
            await calculateFullTeamBusiness(userId);

        // 🧍 Fetch main user
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 🧾 Optional data
        const staking = await Staking.findOne({ userId }).catch(() => null);
        const payouts = await Payout.find({ userId }).sort({ createdAt: -1 }).catch(() => []);
        const wallet = await Wallet.findOne({ userId }).catch(() => null);

        if (!staking) console.log(`⚠️ No staking record found for user ${userId}`);
        if (!payouts.length) console.log(`⚠️ No payouts found for user ${userId}`);
        if (!wallet) console.log(`⚠️ No wallet found for user ${userId}`);

        // 💰 Calculate 10% referral bonus from referred users’ myStaking
        let totalReferralBonus = 0;
        let referredBonuses = [];

        if (user.referredIds && user.referredIds.length > 0) {
            const referredUsers = await User.find({ userId: { $in: user.referredIds } });

            referredBonuses = referredUsers.map(ref => {
                const bonus = ref.myStaking * 0.10; // 10% of their staking
                totalReferralBonus += bonus;
                return {
                    referredUserId: ref.userId,
                    referredName: ref.name,
                    referredStaking: ref.myStaking,
                    referralBonus: bonus,
                };
            });
        }

        // ✅ Send final response
        res.status(200).json({
            success: true,
            message: "Team business calculated successfully",
            data: {
                totalUsers,
                currentTeamBusiness,
                totalTeamBusiness,
                totalReferralBonus, // 💸 Total 10% earnings
                referredBonuses,     // Detailed breakdown
            },
            user,
            staking: staking || null,
            payouts: payouts || [],
            wallet: wallet || null,
        });

    } catch (error) {
        console.error("❌ Error in getFullTeamBusiness:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};