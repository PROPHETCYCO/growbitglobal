import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Define schema
const userSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        referralLink: {
            type: String,
            unique: true,
        },
        parentId: {
            type: String,
            default: null,
        },
        referredIds: {
            type: [String],
            default: [],
        },
        walletAddress: {
            type: String,
            default: "",
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        myStaking: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Encrypt password before save
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});


userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


userSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        { userId: this.userId, email: this.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );
};

const User = mongoose.model("User", userSchema);

export default User;