import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    let token;

    // Token format: Bearer <token>
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to request object (exclude password)
            req.user = await User.findOne({ userId: decoded.userId }).select("-password");

            if (!req.user) {
                return res.status(401).json({ success: false, message: "User not found" });
            }

            next();
        } catch (error) {
            console.error("Token verification failed:", error.message);
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }
};