import express from "express";
import { getUserAndDirectTeamStaking, loginUser, registerFirstUser, registerUser, requestWithdrawal, submitKYC } from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/register-first", registerFirstUser);
router.post("/login", loginUser);
router.post("/team", getUserAndDirectTeamStaking);
router.post("/submit-kyc", submitKYC);
router.post("/withdraw-request", requestWithdrawal);

export default router;