import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cron from "node-cron";
import connectDB from "./config/db.js";

import testRoute from "./routes/testRoute.js";
import userRoutes from "./routes/userRoutes.js";
import stakingRoutes from "./routes/stakingRoutes.js";
import payoutRoutes from "./routes/payoutRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userDataRoutes from "./routes/userDataRoutes.js";
import { calculateDailyStakingRewards } from "./controllers/stakingController.js";

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json()); // parse JSON body
app.use(cors()); // allow cross-origin requests
app.use(helmet()); // add security headers
app.use(morgan("dev")); // log incoming requests

// Routes
app.use("/api/v1/test", testRoute);
app.use("/api/users", userRoutes);
app.use("/api/staking", stakingRoutes);
app.use("/api/payout", payoutRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/userdata", userDataRoutes);

// Schedule: Every day at 11:58 PM IST
cron.schedule("*/5 * * * *", async () => {
    console.log("⏰ Running staking reward calculation every 10 seconds (TEST MODE)...");
    try {
        await calculateDailyStakingRewards(
            { body: {} },
            { status: () => ({ json: () => { } }) }
        ); // mock req,res for cron
    } catch (err) {
        console.error("Error running staking reward cron (test):", err);
    }
}, {
    timezone: "Asia/Kolkata",
});

// Root endpoint
app.get("/", (req, res) => {
    res.send("Backend API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});