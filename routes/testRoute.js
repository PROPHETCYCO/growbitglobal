import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({ success: true, message: "Test route working fine!" });
});

export default router;