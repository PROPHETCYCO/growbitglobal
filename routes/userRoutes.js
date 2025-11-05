import express from "express";
import { getFullTeamBusiness, getUserAndDirectTeamStaking, loginUser, registerFirstUser, registerUser, requestpayoutWithdrawal, requestryWithdrawal, submitKYC } from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/register-first", registerFirstUser);
router.post("/login", loginUser);
router.post("/team", getUserAndDirectTeamStaking);
router.post("/submit-kyc", submitKYC);
router.post("/withdraw-ry-request", requestryWithdrawal);
router.post("/withdraw-pay-request", requestpayoutWithdrawal);
router.post("/calculate-team-business", getFullTeamBusiness);

export default router;