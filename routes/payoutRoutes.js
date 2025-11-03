import express from "express";
import { calculateCurrentPayout, finalizeAllPayouts } from "../controllers/payoutController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/calculate", protect, calculateCurrentPayout);
router.post("/finalize", finalizeAllPayouts);

export default router;