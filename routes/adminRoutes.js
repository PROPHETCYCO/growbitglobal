import express from "express";
import {
    getAllUsers,
    getAllWallets,
    getAllPayouts,
    getAllStakings
} from "../controllers/adminController.js";

const router = express.Router();

// Example: You can later add middleware like `verifyAdmin` for access control

router.get("/users", getAllUsers);
router.get("/wallets", getAllWallets);
router.get("/payouts", getAllPayouts);
router.get("/stakings", getAllStakings);

export default router;