import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";

import testRoute from "./routes/testRoute.js";
import userRoutes from "./routes/userRoutes.js";
import stakingRoutes from "./routes/stakingRoutes.js";
import payoutRoutes from "./routes/payoutRoutes.js";

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

// Root endpoint
app.get("/", (req, res) => {
    res.send("Backend API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});