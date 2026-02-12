import mongoose from "mongoose";
import Resume from "../models/Resume.js";

const validateResumeOwnership = async (req, res, next) => {
    try {
        const resumeId = req.body?.resumeId || req.params?.resumeId;
        const userId = req.userId;

        if (!resumeId) {
            return res.status(400).json({ message: "Resume ID is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(resumeId)) {
            return res.status(400).json({ message: "Invalid resume ID" });
        }

        const resume = await Resume.findOne({ _id: resumeId, userId });
        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        req.resume = resume;
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

export default validateResumeOwnership;
