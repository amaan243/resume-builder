import mongoose from "mongoose";

const TempSignupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    verificationCode: String,
    verificationExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600, // Auto-delete after 1 hour if not verified
    },
});

const TempSignup = mongoose.model("TempSignup", TempSignupSchema);

export default TempSignup;
