import mongoose from "mongoose";

const stakingSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            ref: "User",
        },
        name: {
            type: String,
            required: true,
        },
        walletAddress: {
            type: String,
            required: true,
        },
        myStaking: {
            type: Number,
            default: 0,
        },
        stakingRewards: {
            type: Number,
            default: 0,
        },
        stakingAdded: [
            {
                coins: { type: Number, required: true },
                hash: { type: String, required: true },
                screenshot: { type: String, required: true }, // S3 URL
                dateTime: { type: String, required: true },
                status: {
                    type: String,
                    enum: ["pending", "approved", "cancelled"],
                    default: "pending",
                },
            },
        ],
    },
    { timestamps: true }
);

const Staking = mongoose.model("Staking", stakingSchema);
export default Staking;