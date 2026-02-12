export const buildQuestionGenerationMessages = ({ resumeText, jobRole, counts }) => {
    const roleLine = jobRole ? `Target role: ${jobRole}` : "Target role: not provided";

    return [
        {
            role: "system",
            content:
                "You are an expert interview coach. Generate high-quality interview questions based on the resume. " +
                "Return JSON only with keys: technical, projectBased, hr. Each value must be an array of questions. " +
                "Do not include any extra text.",
        },
        {
            role: "user",
            content: `Create interview questions. ${roleLine}

Resume Text:
${resumeText}

Requirements:
- Technical questions: ${counts.technical}
- Project-based questions: ${counts.projectBased}
- HR/Behavioral questions: ${counts.hr}
- Each item must be a single question.
- Keep questions concise and role-relevant.

Return JSON only in this format:
{
  "technical": ["..."],
  "projectBased": ["..."],
  "hr": ["..."]
}`,
        },
    ];
};

export const buildAnswerGenerationMessages = ({ resumeText, jobRole, question }) => {
    const roleLine = jobRole ? `Target role: ${jobRole}` : "Target role: not provided";

    return [
        {
            role: "system",
            content:
                "You are an interview coach. Answer the question using the resume context. " +
                "Keep answers concise, specific, and professional. Return only the answer text.",
        },
        {
            role: "user",
            content: `Question: ${question}
${roleLine}

Resume Text:
${resumeText}

Answer in 3-6 sentences. Use resume details when possible.`,
        },
    ];
};

export const buildFollowUpMessages = ({ resumeText, jobRole, question }) => {
    const roleLine = jobRole ? `Target role: ${jobRole}` : "Target role: not provided";

    return [
        {
            role: "system",
            content:
                "You generate a single follow-up interview question based on the base question and resume. " +
                "Return only the follow-up question.",
        },
        {
            role: "user",
            content: `Base Question: ${question}
${roleLine}

Resume Text:
${resumeText}

Generate one follow-up question that goes deeper.`,
        },
    ];
};
