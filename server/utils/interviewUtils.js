export const countSkills = (skills = []) => {
    if (!Array.isArray(skills)) {
        return 0;
    }

    if (skills.length > 0 && typeof skills[0] === "string") {
        return skills.length;
    }

    return skills.reduce((total, category) => {
        const items = Array.isArray(category?.items) ? category.items.length : 0;
        return total + items;
    }, 0);
};

export const calculateDepthScore = (resume) => {
    const skillsCount = countSkills(resume?.skills || []);
    const projectsCount = Array.isArray(resume?.project) ? resume.project.length : 0;
    const experienceCount = Array.isArray(resume?.experience) ? resume.experience.length : 0;

    return skillsCount * 2 + projectsCount * 3 + experienceCount * 4;
};

const extractSectionLines = (text, heading) => {
    if (!text) return [];
    const lower = text.toLowerCase();
    const headingIndex = lower.indexOf(heading);
    if (headingIndex === -1) return [];

    const afterHeading = text.slice(headingIndex + heading.length);
    const nextHeadingMatch = afterHeading.match(
        /\n\s*(education|experience|projects?|skills?|summary|certifications|languages)\b/i
    );
    const sectionText = nextHeadingMatch
        ? afterHeading.slice(0, nextHeadingMatch.index)
        : afterHeading;

    return sectionText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(0, 12);
};

export const estimateDepthScoreFromText = (resumeText) => {
    const skillsLines = extractSectionLines(resumeText, "skills");
    const projectsLines = extractSectionLines(resumeText, "project");
    const experienceLines = extractSectionLines(resumeText, "experience");

    const skillsCount = skillsLines
        .join(" ")
        .split(/[,|;•\u2022]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 1).length;

    const projectsCount = Math.min(projectsLines.length, 8);
    const experienceCount = Math.min(experienceLines.length, 8);

    return skillsCount * 2 + projectsCount * 3 + experienceCount * 4;
};

export const mapScoreToQuestionCount = (score) => {
    if (score <= 10) return 5;
    if (score <= 20) return 7;
    if (score <= 30) return 9;
    if (score <= 40) return 11;
    return 13;
};

export const buildQuestionCounts = (score) => {
    const count = mapScoreToQuestionCount(score);
    const bounded = Math.min(13, Math.max(5, count));

    return {
        technical: bounded,
        projectBased: bounded,
        hr: bounded,
    };
};

export const resumeToText = (resume) => {
    if (!resume) return "";

    const personal = resume.personal_info || {};
    const personalParts = [
        personal.full_name,
        personal.profession,
        personal.email,
        personal.phone,
        personal.location,
        personal.linkedin,
        personal.website,
    ].filter(Boolean);

    const summary = resume.professional_summary || "";

    const skills = Array.isArray(resume.skills) ? resume.skills : [];
    const skillsText = skills
        .map((category) => {
            const label = category?.category ? `${category.category}: ` : "";
            const items = Array.isArray(category?.items) ? category.items.join(", ") : "";
            return `${label}${items}`.trim();
        })
        .filter(Boolean)
        .join(" | ");

    const experienceText = Array.isArray(resume.experience)
        ? resume.experience
              .map((exp) => {
                  const title = [exp?.position, exp?.company].filter(Boolean).join(" at ");
                  const dates = [exp?.start_date, exp?.end_date]
                      .filter(Boolean)
                      .join(" - ");
                  const details = exp?.description || "";
                  return [title, dates, details].filter(Boolean).join(". ");
              })
              .filter(Boolean)
              .join(" | ")
        : "";

    const projectText = Array.isArray(resume.project)
        ? resume.project
              .map((proj) => {
                  const title = [proj?.name, proj?.type].filter(Boolean).join(" - ");
                  const details = proj?.description || "";
                  return [title, details].filter(Boolean).join(": ");
              })
              .filter(Boolean)
              .join(" | ")
        : "";

    const educationText = Array.isArray(resume.education)
        ? resume.education
              .map((edu) => {
                  const title = [edu?.degree, edu?.field].filter(Boolean).join(" in ");
                  const school = edu?.institution || "";
                  const date = edu?.graduation_date || "";
                  return [title, school, date].filter(Boolean).join(", ");
              })
              .filter(Boolean)
              .join(" | ")
        : "";

    return [
        personalParts.join(" | "),
        summary,
        skillsText,
        experienceText,
        projectText,
        educationText,
    ]
        .filter(Boolean)
        .join("\n");
};

export const flattenQuestions = (questions) => {
    if (!questions) return [];

    if (Array.isArray(questions)) {
        if (questions.length === 0) return [];

        if (typeof questions[0] === "string") {
            return questions.map((question) => ({ category: "", question }));
        }

        return questions
            .map((item) => ({
                category: item?.category || "",
                question: item?.question || "",
            }))
            .filter((item) => item.question);
    }

    const technical = Array.isArray(questions.technical) ? questions.technical : [];
    const projectBased = Array.isArray(questions.projectBased)
        ? questions.projectBased
        : [];
    const hr = Array.isArray(questions.hr) ? questions.hr : [];

    return [
        ...technical.map((question) => ({ category: "technical", question })),
        ...projectBased.map((question) => ({ category: "projectBased", question })),
        ...hr.map((question) => ({ category: "hr", question })),
    ].filter((item) => item.question);
};

export const truncateText = (text, maxLength = 9000) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength);
};
