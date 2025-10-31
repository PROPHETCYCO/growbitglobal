import express from "express";
import { calculateCurrentPayout } from "../controllers/payoutController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/calculate", calculateCurrentPayout);
//router.post("/finalize", finalizeAllPayouts);

export default router;