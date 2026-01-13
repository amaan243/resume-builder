import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";


//controller for enhance the summary using AI
//POST /api/ai/enhance-pro-sum

export const enhanceProfessionalSummary = async (req, res) => {
    try {
        const { userContent } = req.body;

        if (!userContent) {
            return res.status(400).json({ message: "Missing Requires Fields" });
        }

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert in resume writing. Your task is to enhance the professional summary of resume.the summary should be 1-2 sentences also highlight key skills,experience and career objectives. make it compelling and ATS-friendly.and only return text no options or anything else."
                },
                {
                    role: "user",
                    content: userContent
                },
            ],
        })
        const enhancedSummary = response.choices[0].message.content;
        return res.status(200).json({ enhancedSummary });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

//controller for enhance job description using AI
//POST /api/ai/enhance-job-desc

export const enhanceJobDescription = async (req, res) => {
    try {
        const { userContent } = req.body;

        if (!userContent) {
            return res.status(400).json({ message: "Missing Requires Fields" });
        }

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert in resume writing. Your task is to enhance the job description of resume. The Job description should be only in 1-2 sentences also   highlighting key responsibilities and achievements.Use action verbs and quantifiable results where possible. Make it ATS-friendly. Only return text no options or anything else."
                },
                {
                    role: "user",
                    content: userContent
                },
            ],
        })
        const enhancedDescription = response.choices[0].message.content;
        return res.status(200).json({ enhancedDescription });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

//upload resume 
//POST /api/ai/upload-resume

export const uploadResume = async (req, res) => {
    try {
        const { resumeText, title } = req.body;
        const userId = req.userId;

        if (!resumeText) {
            return res.status(400).json({ message: "Missing Required Fields" });
        }

        const systemPrompt = "You are an expert AI Agent to extract data from the resume."

        const userPrompt = `extract data from this resume :-${resumeText}.
          Provide data in the following JSON format with no additional text before or after:
          professional_summary:{
        type: String,
        default:""
    },
    skills:[{
        type: String
    }],
    personal_info:{
        image: {
            type: String,
            default:""  
        },
        full_name: {
            type: String,
            default:""
        },
        profession:{
            type: String,
            default:""
        },
        email:{
            type: String,
            default:""
        },
        phone:{
            type: String,
            default:""
        },
        location:{
            type: String,
            default:""
        },
        linkedin:{
            type: String,
            default:""
        },
        website:{
            type: String,
            default:""
        }
      },
      experience:[{
        company:{type: String},
        position:{type: String},
        start_date:{type: String},
        end_date:{type: String},
        description:{type: String},
        is_current:{type: Boolean}
        }
      ],
      project:[{
        name:{type: String},
        type:{type: String},
        description:{type: String},
      }],
      education:[{
        institution:{type: String},
        degree:{type: String},
        field:{type: String},
        graduation_date:{type: String},
        gpa:{type: String},
      }],
        `

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                },
            ],
            response_format: { type: "json_object", }
        })
        const extractedData = response.choices[0].message.content;
        const parsedData = JSON.parse(extractedData);

        const newResume = await Resume.create({
            userId,
            title,
            ...parsedData,
        });
        return res.json({ resumeId: newResume._id });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

//controller for ATS Resume Score & Improvement Suggestions
//POST /api/ai/ats-score

export const getATSScore = async (req, res) => {
    try {
        const { resumeText, targetRole } = req.body;

        // Validation
        if (!resumeText || resumeText.trim().length === 0) {
            return res.status(400).json({ message: "Resume text is required" });
        }

        if (resumeText.length < 100) {
            return res.status(400).json({ message: "Resume text is too short. Please provide a complete resume." });
        }

        if (resumeText.length > 50000) {
            return res.status(400).json({ message: "Resume text is too long. Maximum 50,000 characters allowed." });
        }

        const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. Your task is to evaluate resumes like a real ATS system used by companies like LinkedIn, Indeed, and major corporations.

Analyze the resume strictly and professionally. Consider:
1. Keyword relevance and industry-specific terms
2. Skills match (technical and soft skills)
3. Formatting quality and ATS-readability
4. Use of action verbs and quantifiable achievements
5. Experience clarity and relevance
6. Grammar, spelling, and professional language
7. Contact information completeness
8. Section organization and structure

Provide a detailed analysis in JSON format only. No markdown, no additional text.`;

        const userPrompt = `Analyze this resume${targetRole ? ` for the role of ${targetRole}` : ''} and provide an ATS score:

Resume Text:
${resumeText}

Provide your analysis in this exact JSON format:
{
  "atsScore": <number between 0-100>,
  "strengths": [<array of 3-5 specific strengths>],
  "weaknesses": [<array of 3-5 specific weaknesses>],
  "missingKeywords": [<array of 5-10 important keywords missing from resume>],
  "suggestions": [<array of 5-8 actionable improvement suggestions>],
  "grammarIssues": [<array of grammar or formatting issues, if any>],
  "keywordDensity": "<low/medium/high>",
  "overallFeedback": "<2-3 sentence summary of the resume quality>"
}

Be strict but fair. Most resumes score between 45-75. Only exceptional resumes score above 85.`;

        const response = await ai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3, // Lower temperature for more consistent scoring
        });

        const analysisResult = response.choices[0].message.content;
        const parsedResult = JSON.parse(analysisResult);

        // Validate the response structure
        if (!parsedResult.atsScore || typeof parsedResult.atsScore !== 'number') {
            throw new Error("Invalid AI response format");
        }

        // Ensure score is within bounds
        parsedResult.atsScore = Math.max(0, Math.min(100, parsedResult.atsScore));

        return res.status(200).json(parsedResult);
    } catch (error) {
        console.error("ATS Score Error:", error);
        return res.status(500).json({ 
            message: "Failed to analyze resume. Please try again.", 
            error: error.message 
        });
    }
}