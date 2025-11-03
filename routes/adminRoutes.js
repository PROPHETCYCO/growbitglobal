import express from "express";
import {
    getAllUsers,
    getAllWallets,
    getAllPayouts,
    getAllStakings,
    approvePayoutById
} from "../controllers/adminController.js";
import { getAdminDashboard } from "../controllers/userDataController.js";

const router = express.Router();

// Example: You can later add middleware like `verifyAdmin` for access control

router.get("/users", getAllUsers);
router.get("/wallets", getAllWallets);
router.get("/payouts", getAllPayouts);
router.get("/stakings", getAllStakings);
router.get("/dashboard", getAdminDashboard);
router.post("/approve-payout", approvePayoutById);

export default router;