import ai from "../configs/ai.js";
import FollowUpTracking from "../models/FollowUpTracking.js";
import {
    buildAnswerGenerationMessages,
    buildFollowUpMessages,
    buildQuestionGenerationMessages,
} from "../utils/interviewPrompts.js";
import {
    buildQuestionCounts,
    calculateDepthScore,
    estimateDepthScoreFromText,
    flattenQuestions,
    resumeToText,
    truncateText,
} from "../utils/interviewUtils.js";

const FOLLOW_UP_LIMIT = 3;
const FOLLOW_UP_WINDOW_HOURS = 12;
const MORE_QUESTIONS_WINDOW_HOURS = 24;
// Compatibility cutoff: ignore follow-up usage tracked before the rolling-window feature rollout.
const FOLLOW_UP_WINDOW_FEATURE_START = new Date("2026-03-12T00:00:00.000Z");

const getFollowUpWindowStart = () =>
    new Date(
        Math.max(
            Date.now() - FOLLOW_UP_WINDOW_HOURS * 60 * 60 * 1000,
            FOLLOW_UP_WINDOW_FEATURE_START.getTime()
        )
    );

const getMoreQuestionsLock = (resume) => {
    const lastGenerated = resume?.moreQuestionsLastGeneratedAt;
    if (!lastGenerated) {
        return { isLocked: false, lockedUntil: null };
    }

    const lockedUntil = new Date(
        new Date(lastGenerated).getTime() + MORE_QUESTIONS_WINDOW_HOURS * 60 * 60 * 1000
    );

    return {
        isLocked: Date.now() < lockedUntil.getTime(),
        lockedUntil,
    };
};

const normalizeQuestionPayload = (payload) => {
    return {
        technical: Array.isArray(payload?.technical) ? payload.technical : [],
        projectBased: Array.isArray(payload?.projectBased) ? payload.projectBased : [],
        hr: Array.isArray(payload?.hr) ? payload.hr : [],
    };
};

export const generateInterviewQuestions = async (req, res) => {
    try {
        const { jobRole } = req.body;
        const resume = req.resume;

        if (!jobRole || jobRole.trim().length === 0) {
            return res.status(400).json({ message: "Job role is required" });
        }

        if (!resume) {
            return res.status(400).json({ message: "Resume not found" });
        }

        const resumeText = truncateText(resumeToText(resume));
        const score = calculateDepthScore(resume);
        const counts = buildQuestionCounts(score);

        const messages = buildQuestionGenerationMessages({
            resumeText,
            jobRole,
            counts,
        });

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages,
            response_format: { type: "json_object" },
            temperature: 0.4,
        });

        const raw = response.choices[0].message.content;
        const parsed = normalizeQuestionPayload(JSON.parse(raw || "{}"));

        const questions = {
            technical: parsed.technical.slice(0, counts.technical),
            projectBased: parsed.projectBased.slice(0, counts.projectBased),
            hr: parsed.hr.slice(0, counts.hr),
        };

        return res.status(200).json({ questions, counts, score });
    } catch (error) {
        console.error("Interview Questions Error:", error);
        
        // Handle rate limit errors
        if (error.status === 429) {
            return res.status(429).json({ 
                message: "Rate limit exceeded. Please wait a moment and try again." 
            });
        }
        
        // Handle auth errors
        if (error.status === 401) {
            return res.status(401).json({ 
                message: "OpenAI API authentication failed. Check your API key." 
            });
        }
        
        return res.status(400).json({ message: error.message });
    }
};

export const generateMoreInterviewQuestions = async (req, res) => {
    try {
        const { jobRole, previousQuestions } = req.body;
        const resume = req.resume;

        if (!jobRole || jobRole.trim().length === 0) {
            return res.status(400).json({ message: "Job role is required" });
        }

        if (!resume) {
            return res.status(400).json({ message: "Resume not found" });
        }

        const { isLocked, lockedUntil } = getMoreQuestionsLock(resume);
        if (isLocked) {
            return res.status(429).json({
                message: `More questions are available after ${MORE_QUESTIONS_WINDOW_HOURS} hours for this resume.`,
                lockedUntil,
            });
        }

        const resumeText = truncateText(resumeToText(resume));
        const score = calculateDepthScore(resume);
        const counts = buildQuestionCounts(score);
        const flattenedPreviousQuestions = flattenQuestions(previousQuestions).map(
            (item) => item.question
        );

        const messages = buildQuestionGenerationMessages({
            resumeText,
            jobRole,
            counts,
            previousQuestions: flattenedPreviousQuestions,
        });

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages,
            response_format: { type: "json_object" },
            temperature: 0.5,
        });

        const raw = response.choices[0].message.content;
        const parsed = normalizeQuestionPayload(JSON.parse(raw || "{}"));

        const questions = {
            technical: parsed.technical.slice(0, counts.technical),
            projectBased: parsed.projectBased.slice(0, counts.projectBased),
            hr: parsed.hr.slice(0, counts.hr),
        };

        resume.moreQuestionsLastGeneratedAt = new Date();
        await resume.save();

        const { lockedUntil: nextLockedUntil } = getMoreQuestionsLock(resume);

        return res.status(200).json({
            questions,
            counts,
            score,
            lockedUntil: nextLockedUntil,
        });
    } catch (error) {
        console.error("More Interview Questions Error:", error);

        if (error.status === 429) {
            return res.status(429).json({
                message: "Rate limit exceeded. Please wait a moment and try again.",
            });
        }

        if (error.status === 401) {
            return res.status(401).json({
                message: "OpenAI API authentication failed. Check your API key.",
            });
        }

        return res.status(400).json({ message: error.message });
    }
};

export const generateInterviewQuestionsFromText = async (req, res) => {
    try {
        const { resumeText, jobRole } = req.body;

        if (!resumeText) {
            return res.status(400).json({ message: "Resume text is required" });
        }

        if (!jobRole || jobRole.trim().length === 0) {
            return res.status(400).json({ message: "Job role is required" });
        }

        const trimmedText = truncateText(resumeText);
        const score = estimateDepthScoreFromText(trimmedText);
        const counts = buildQuestionCounts(score);

        const messages = buildQuestionGenerationMessages({
            resumeText: trimmedText,
            jobRole,
            counts,
        });

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages,
            response_format: { type: "json_object" },
            temperature: 0.4,
        });

        const raw = response.choices[0].message.content;
        const parsed = normalizeQuestionPayload(JSON.parse(raw || "{}"));

        const questions = {
            technical: parsed.technical.slice(0, counts.technical),
            projectBased: parsed.projectBased.slice(0, counts.projectBased),
            hr: parsed.hr.slice(0, counts.hr),
        };

        return res.status(200).json({ questions, counts, score });
    } catch (error) {
        console.error("Interview Questions From Text Error:", error);
        
        if (error.status === 429) {
            return res.status(429).json({ 
                message: "Rate limit exceeded. Please wait a moment and try again." 
            });
        }
        
        if (error.status === 401) {
            return res.status(401).json({ 
                message: "OpenAI API authentication failed. Check your API key." 
            });
        }
        
        return res.status(400).json({ message: error.message });
    }
};

// export const generateAllAnswers = async (req, res) => {
//     try {
//         const { questions, jobRole } = req.body;
//         const resume = req.resume;

//         const resumeText = truncateText(resumeToText(resume));
//         const flattened = flattenQuestions(questions);

//         if (flattened.length === 0) {
//             return res.status(400).json({ message: "Questions are required" });
//         }

//         const answers = {
//             technical: [],
//             projectBased: [],
//             hr: [],
//         };

//         for (const item of flattened) {
//             const messages = buildAnswerGenerationMessages({
//                 resumeText,
//                 jobRole,
//                 question: item.question,
//             });

//             const response = await ai.chat.completions.create({
//                 model: process.env.OPENAI_MODEL,
//                 messages,
//                 temperature: 0.4,
//             });

//             const answer = response.choices[0].message.content?.trim() || "";

//             if (item.category === "technical") {
//                 answers.technical.push(answer);
//             } else if (item.category === "projectBased") {
//                 answers.projectBased.push(answer);
//             } else if (item.category === "hr") {
//                 answers.hr.push(answer);
//             }
//         }

//         return res.status(200).json({ answers });
//     } catch (error) {
//         console.error("Generate All Answers Error:", error);
        
//         if (error.status === 429) {
//             return res.status(429).json({ 
//                 message: "Rate limit exceeded. Please wait a moment and try again." 
//             });
//         }
        
//         if (error.status === 401) {
//             return res.status(401).json({ 
//                 message: "OpenAI API authentication failed. Check your API key." 
//             });
//         }
        
//         return res.status(400).json({ message: error.message });
//     }
// };

// export const generateAllAnswersFromText = async (req, res) => {
//     try {
//         const { questions, jobRole, resumeText } = req.body;

//         if (!resumeText) {
//             return res.status(400).json({ message: "Resume text is required" });
//         }

//         const trimmedText = truncateText(resumeText);
//         const flattened = flattenQuestions(questions);

//         if (flattened.length === 0) {
//             return res.status(400).json({ message: "Questions are required" });
//         }

//         const answers = {
//             technical: [],
//             projectBased: [],
//             hr: [],
//         };

//         for (const item of flattened) {
//             const messages = buildAnswerGenerationMessages({
//                 resumeText: trimmedText,
//                 jobRole,
//                 question: item.question,
//             });

//             const response = await ai.chat.completions.create({
//                 model: process.env.OPENAI_MODEL,
//                 messages,
//                 temperature: 0.4,
//             });

//             const answer = response.choices[0].message.content?.trim() || "";

//             if (item.category === "technical") {
//                 answers.technical.push(answer);
//             } else if (item.category === "projectBased") {
//                 answers.projectBased.push(answer);
//             } else if (item.category === "hr") {
//                 answers.hr.push(answer);
//             }
//         }

//         return res.status(200).json({ answers });
//     } catch (error) {
//         console.error("Generate All Answers From Text Error:", error);
        
//         if (error.status === 429) {
//             return res.status(429).json({ 
//                 message: "Rate limit exceeded. Please wait a moment and try again." 
//             });
//         }
        
//         if (error.status === 401) {
//             return res.status(401).json({ 
//                 message: "OpenAI API authentication failed. Check your API key." 
//             });
//         }
        
//         return res.status(400).json({ message: error.message });
//     }
// };

export const generateFollowUpQuestion = async (req, res) => {
    try {
        const { question, jobRole, category } = req.body;
        const resume = req.resume;
        const userId = req.userId;
        const windowStart = getFollowUpWindowStart();

        if (!question) {
            return res.status(400).json({ message: "Base question is required" });
        }

        const existingTracking = await FollowUpTracking.findOne({
            userId,
            resumeId: resume._id,
            baseQuestion: question,
            updatedAt: { $gte: windowStart },
        });

        const followUpTotals = await FollowUpTracking.aggregate([
            { $match: { userId, resumeId: resume._id, updatedAt: { $gte: windowStart } } },
            { $group: { _id: null, total: { $sum: "$followUpCount" } } },
        ]);
        const totalFollowUps = followUpTotals[0]?.total || 0;

        if (totalFollowUps >= FOLLOW_UP_LIMIT) {
            return res
                .status(400)
                .json({
                    message: `Follow-up limit reached for this resume. Try again after ${FOLLOW_UP_WINDOW_HOURS} hours.`,
                });
        }

        const resumeText = truncateText(resumeToText(resume));
        const messages = buildFollowUpMessages({ resumeText, jobRole, question });

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages,
            temperature: 0.4,
        });

        const followUp = response.choices[0].message.content?.trim() || "";

        if (!followUp) {
            return res.status(400).json({ message: "Failed to generate follow-up" });
        }

        if (existingTracking) {
            existingTracking.followUpCount += 1;
            await existingTracking.save();
        } else {
            await FollowUpTracking.create({
                userId,
                resumeId: resume._id,
                baseQuestion: question,
                followUpCount: 1,
            });
        }

        return res.status(200).json({ followUp });
    } catch (error) {
        console.error("Follow-up Question Error:", error);
        
        if (error.status === 429) {
            return res.status(429).json({ 
                message: "Rate limit exceeded. Please wait a moment and try again." 
            });
        }
        
        if (error.status === 401) {
            return res.status(401).json({ 
                message: "OpenAI API authentication failed. Check your API key." 
            });
        }
        
        return res.status(400).json({ message: error.message });
    }
};

export const generateFollowUpQuestionFromText = async (req, res) => {
    try {
        const { question, jobRole, category, resumeText, sessionId } = req.body;
        const userId = req.userId;
        const windowStart = getFollowUpWindowStart();

        if (!question) {
            return res.status(400).json({ message: "Base question is required" });
        }

        if (!resumeText) {
            return res.status(400).json({ message: "Resume text is required" });
        }

        if (!sessionId) {
            return res.status(400).json({ message: "Session ID is required" });
        }

        const existingTracking = await FollowUpTracking.findOne({
            userId,
            sessionId,
            baseQuestion: question,
            updatedAt: { $gte: windowStart },
        });

        const followUpTotals = await FollowUpTracking.aggregate([
            { $match: { userId, sessionId, updatedAt: { $gte: windowStart } } },
            { $group: { _id: null, total: { $sum: "$followUpCount" } } },
        ]);
        const totalFollowUps = followUpTotals[0]?.total || 0;

        if (totalFollowUps >= FOLLOW_UP_LIMIT) {
            return res
                .status(400)
                .json({
                    message: `Follow-up limit reached for this session. Try again after ${FOLLOW_UP_WINDOW_HOURS} hours.`,
                });
        }

        const trimmedText = truncateText(resumeText);
        const messages = buildFollowUpMessages({
            resumeText: trimmedText,
            jobRole,
            question,
        });

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages,
            temperature: 0.4,
        });

        const followUp = response.choices[0].message.content?.trim() || "";

        if (!followUp) {
            return res.status(400).json({ message: "Failed to generate follow-up" });
        }

        if (existingTracking) {
            existingTracking.followUpCount += 1;
            await existingTracking.save();
        } else {
            await FollowUpTracking.create({
                userId,
                sessionId,
                baseQuestion: question,
                followUpCount: 1,
            });
        }

        return res.status(200).json({ followUp });
    } catch (error) {
        console.error("Follow-up Question From Text Error:", error);
        
        if (error.status === 429) {
            return res.status(429).json({ 
                message: "Rate limit exceeded. Please wait a moment and try again." 
            });
        }
        
        if (error.status === 401) {
            return res.status(401).json({ 
                message: "OpenAI API authentication failed. Check your API key." 
            });
        }
        
        return res.status(400).json({ message: error.message });
    }
};
