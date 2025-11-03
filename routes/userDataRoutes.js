import express from "express";
import { getUserById, getWalletByUserId, getPayoutsByUserId, getStakingByUserId } from "../controllers/userDataController.js";

const router = express.Router();

// User panel routes (based on userId)
router.get("/user", getUserById);
router.get("/wallet", getWalletByUserId);
router.get("/payouts", getPayoutsByUserId);
router.get("/staking", getStakingByUserId);

export default router;