import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";

const SoftwareEngineerOnePage = ({ data, accentColor }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const [year, month] = dateStr.split("-");
        return new Date(year, month - 1).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short"
        });
    };

    // Get skills - handle array of category objects
    const skillsArray = Array.isArray(data.skills) ? data.skills : [];

    return (
        <div className="resume-page max-w-4xl mx-auto p-6 bg-white text-gray-900 leading-tight text-sm">
            {/* Header */}
            <header className="text-center mb-4 pb-3 border-b" style={{ borderColor: accentColor }}>
                <h1 className="text-2xl font-bold mb-1" style={{ color: accentColor }}>
                    {data.personal_info?.full_name || "Your Name"}
                </h1>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-600 mt-2">
                    {data.personal_info?.email && (
                        <span className="break-all">{data.personal_info.email}</span>
                    )}
                    {data.personal_info?.phone && (
                        <span>•</span>
                    )}
                    {data.personal_info?.phone && (
                        <span className="break-all">{data.personal_info.phone}</span>
                    )}
                    {data.personal_info?.location && (
                        <span>•</span>
                    )}
                    {data.personal_info?.location && (
                        <span className="break-all">{data.personal_info.location}</span>
                    )}
                </div>
                {(data.personal_info?.linkedin || data.personal_info?.website) && (
                    <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-600 mt-1">
                        {data.personal_info?.linkedin && (
                            <span className="break-all truncate">{data.personal_info.linkedin}</span>
                        )}
                        {data.personal_info?.website && (
                            <span>•</span>
                        )}
                        {data.personal_info?.website && (
                            <span className="break-all truncate">{data.personal_info.website}</span>
                        )}
                    </div>
                )}
            </header>

            {/* Professional Summary */}
            {data.professional_summary && (
                <section className="mb-3">
                    <h2 className="text-xs font-bold uppercase mb-1" style={{ color: accentColor }}>
                        PROFESSIONAL SUMMARY
                    </h2>
                    <p className="text-gray-700 leading-tight text-xs">{data.professional_summary}</p>
                </section>
            )}

            {/* Education */}
            {data.education && data.education.length > 0 && (
                <section className="mb-3">
                    <h2 className="text-xs font-bold uppercase mb-2 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                        EDUCATION
                    </h2>
                        {data.education.map((edu, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-xs">{edu.degree}</h3>
                                        <p className="text-gray-700 text-xs">{edu.institution}</p>
                                        {edu.field && <p className="text-gray-600 text-xs">{edu.field}</p>}
                                    </div>
                                    {edu.graduation_date && (
                                        <div className="text-right text-xs text-gray-600 whitespace-nowrap">
                                            <p>{formatDate(edu.graduation_date)}</p>
                                        </div>
                                    )}
                                </div>
                                {edu.gpa && <p className="text-gray-600 text-xs mt-0.5">GPA: {edu.gpa}</p>}
                            </div>
                        ))}
                </section>
            )}

            {/* Experience */}
            {data.experience && data.experience.length > 0 && (
                <section className="mb-3">
                    <h2 className="text-xs font-bold uppercase mb-2 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                        PROFESSIONAL EXPERIENCE
                    </h2>
                        {data.experience.slice(0, 4).map((exp, index) => (
                            <div key={index} className="border-l-2 pl-2" style={{ borderColor: accentColor }}>
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-xs">{exp.position}</h3>
                                        <p className="text-gray-700 text-xs font-medium">{exp.company}</p>
                                    </div>
                                    <div className="text-right text-xs text-gray-600 whitespace-nowrap">
                                        <p>{formatDate(exp.start_date)} - {exp.is_current ? "Present" : formatDate(exp.end_date)}</p>
                                    </div>
                                </div>
                                {exp.description && (
                                    <div className="text-gray-700 text-xs leading-tight mt-0.5 whitespace-pre-wrap">
                                        {exp.description.slice(0, 150)}...
                                    </div>
                                )}
                            </div>
                        ))}
                </section>
            )}

            {/* Projects */}
            {data.project && data.project.length > 0 && (
                <section className="mb-3">
                    <h2 className="text-xs font-bold uppercase mb-2 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                        PROJECTS
                    </h2>
                        {data.project.map((proj, index) => (
                            <div key={index}>
                                <h3 className="font-semibold text-gray-900 text-xs">{proj.name}</h3>
                                <p className="text-gray-700 text-xs leading-tight">{proj.description}</p>
                            </div>
                        ))}
                </section>
            )}

            {/* Skills */}
            {skillsArray && skillsArray.length > 0 && (
                <section className="mb-3">
                    <h2 className="text-xs font-bold uppercase mb-2 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                        SKILLS
                    </h2>
                    <div className="space-y-1">
                        {skillsArray.map((skillCat, index) => (
                            <p key={index} className="text-gray-700 text-xs leading-tight">
                                <span className="font-semibold">{skillCat.category}:</span> {skillCat.items.join(", ")}
                            </p>
                        ))}
                    </div>
                </section>
            )}

            {/* Print Styles */}
            <style>{`
                @media print {
                    .resume-page {
                        page-break-after: avoid;
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 12pt;
                        line-height: 1.2;
                        margin: 0;
                        padding: 0.45in;
                        max-width: 8.5in;
                        color: #000;
                    }

                    .resume-page * {
                        page-break-inside: avoid;
                    }

                    .resume-page header {
                        margin-bottom: 10px;
                        padding-bottom: 4px;
                        text-align: center;
                    }

                    .resume-page header h1 {
                        font-size: 18pt;
                        margin: 0 0 3px 0;
                        font-weight: bold;
                    }

                    .resume-page header div {
                        font-size: 11pt;
                        margin: 0;
                        line-height: 1.15;
                    }

                    .resume-page section {
                        page-break-inside: avoid;
                        margin-bottom: 10px;
                    }

                    .resume-page h2 {
                        font-size: 12pt;
                        margin: 0 0 4px 0;
                        font-weight: bold;
                        text-transform: uppercase;
                        padding-bottom: 1px;
                    }

                    .resume-page h3 {
                        font-size: 12pt;
                        margin: 3px 0 1px 0;
                        font-weight: bold;
                    }

                    .resume-page p {
                        font-size: 11.5pt;
                        line-height: 1.15;
                        margin: 2px 0;
                    }

                    .resume-page div {
                        margin-bottom: 3px;
                    }

                    .resume-page .space-y-1 {
                        margin-top: 2px;
                    }

                    .resume-page .space-y-1 p {
                        margin: 2px 0;
                    }

                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Times New Roman', Times, serif;
                    }
                }
            `}</style>
        </div>
    );
};

export default SoftwareEngineerOnePage;
