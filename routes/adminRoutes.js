import express from "express";
import {
    getAllUsers,
    getAllWallets,
    getAllPayouts,
    getAllStakings,
    approvePayoutById,
    adminUpdateUser,
    updateryWithdrawalStatus,
    updatepayoutWithdrawalStatus
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
router.post("/approve-ry-withdrawal", updateryWithdrawalStatus);
router.post("/approve-pay-withdrawal", updatepayoutWithdrawalStatus);
router.put("/update-user/:userId", adminUpdateUser);

export default router;