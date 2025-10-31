import User from "../models/User.js";

const LEVEL_PERCENTAGES = {
    2: 0.10,
    3: 0.07,
    4: 0.05,
    5: 0.03,
    6: 0.01,
    7: 0.008,
    8: 0.008,
    9: 0.008,
    10: 0.008,
};

/**
 * Optimized recursive commission calculator.
 * Traverses up to 10 levels of referrals and computes total commission.
 * 
 * @param {string} userId - The root user's userId for whom to calculate commissions.
 * @param {number} currentLevel - The current referral depth level (default = 1).
 * @param {Set} visited - Prevents revisiting the same user to avoid infinite recursion.
 * @param {Map} userMap - Preloaded map of all users for O(1) lookup.
 * @returns {Promise<{ totalUsers: number, commission: number }>}
 */
export const calculateTreeCommission = async (
    userId,
    currentLevel = 1,
    visited = new Set(),
    userMap = null
) => {
    try {
        // ✅ Base condition: only go up to level 10
        if (currentLevel > 10) {
            return { totalUsers: 0, commission: 0 };
        }

        // ✅ Load all users once into memory (optimization)
        if (!userMap) {
            const allUsers = await User.find({}, { userId: 1, referredIds: 1, myStaking: 1 });
            userMap = new Map(allUsers.map((u) => [u.userId, u]));
        }

        // ✅ Prevent circular recursion
        if (visited.has(userId)) {
            return { totalUsers: 0, commission: 0 };
        }
        visited.add(userId);

        const user = userMap.get(userId);
        if (!user || !user.referredIds?.length) {
            return { totalUsers: 0, commission: 0 };
        }

        let totalUsers = 0;
        let totalCommission = 0;

        // 🔁 Traverse all direct children
        for (const childId of user.referredIds) {
            const child = userMap.get(childId);
            if (!child) continue;

            totalUsers += 1;

            // ✅ Apply commission if the current level has a percentage defined
            const levelPercentage = LEVEL_PERCENTAGES[currentLevel + 1];
            if (levelPercentage) {
                const commission = (child.myStaking || 0) * levelPercentage;
                totalCommission += commission;
            }

            // 🔁 Recursive call for next levels
            const subTree = await calculateTreeCommission(
                childId,
                currentLevel + 1,
                visited,
                userMap
            );

            totalUsers += subTree.totalUsers;
            totalCommission += subTree.commission;
        }

        return { totalUsers, commission: totalCommission };
    } catch (error) {
        console.error("❌ Error calculating tree commission:", error);
        return { totalUsers: 0, commission: 0 };
    }
};