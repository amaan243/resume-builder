import mongoose from "mongoose";

const FollowUpTrackingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        resumeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resume",
            index: true,
        },
        sessionId: {
            type: String,
            index: true,
            default: "",
        },
        baseQuestion: {
            type: String,
            required: true,
        },
        followUpCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

FollowUpTrackingSchema.index({ userId: 1, resumeId: 1, sessionId: 1, baseQuestion: 1 });

const FollowUpTracking = mongoose.model("FollowUpTracking", FollowUpTrackingSchema);

export default FollowUpTracking;
