import express from "express";
import { getUserById, getWalletByUserId, getPayoutsByUserId, getStakingByUserId } from "../controllers/userDataController.js";

const router = express.Router();

// User panel routes (based on userId)
router.post("/user", getUserById);
router.post("/wallet", getWalletByUserId);
router.post("/payouts", getPayoutsByUserId);
router.post("/staking", getStakingByUserId);

export default router;