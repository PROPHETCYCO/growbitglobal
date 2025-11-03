import express from "express";
import { addCoinStaking, approveCoinTransfer, calculateDailyStakingRewards } from "../controllers/stakingController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/add", protect, upload.single("screenshot"), addCoinStaking);
router.post("/approve", approveCoinTransfer);
router.post("/rewards/calculate", calculateDailyStakingRewards);

export default router;