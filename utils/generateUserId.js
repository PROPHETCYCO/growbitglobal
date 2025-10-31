import User from "../models/User.js";

export const generateUniqueUserId = async () => {
    let unique = false;
    let userId = "";

    while (!unique) {
        const random = Math.floor(1000 + Math.random() * 9000); // 4-digit number
        userId = `GBG${random}`;
        const existingUser = await User.findOne({ userId });
        if (!existingUser) unique = true;
    }

    return userId;
};