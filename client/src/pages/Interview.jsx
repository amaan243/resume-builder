import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
    evaluateInterviewAnswer,
    generateFollowUp,
    generateFollowUpFromText,
    generateMoreInterviewQuestions,
    generateInterviewQuestions,
    generateInterviewQuestionsFromText,
} from '../services/interviewApi';
import pdfToText from 'react-pdftotext';
import api from '../configs/api';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const emptyGrouped = { technical: [], projectBased: [], hr: [] };
const uploadStorageKey = 'interviewUploadState';
const resumeStoragePrefix = 'interviewResumeState:';
const MORE_QUESTIONS_WINDOW_HOURS = 24;

const safeParse = (value) => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
};

const getTotalFollowUps = (items) =>
    Object.values(items || {}).reduce(
        (total, list) => total + (Array.isArray(list) ? list.length : 0),
        0
    );

const Interview = () => {
    const { resumeId } = useParams();
    const { token } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const [jobRole, setJobRole] = React.useState('');
    const [questions, setQuestions] = React.useState(emptyGrouped);
    const [followUps, setFollowUps] = React.useState({});
    const [loadingFollowUps, setLoadingFollowUps] = React.useState({});
    const [loadingQuestions, setLoadingQuestions] = React.useState(false);
    const [resumeFile, setResumeFile] = React.useState(null);
    const [resumeText, setResumeText] = React.useState('');
    const [sessionId, setSessionId] = React.useState('');
    const [sourceMode, setSourceMode] = React.useState(
        resumeId ? 'saved' : 'upload'
    );
    const [allResumes, setAllResumes] = React.useState([]);
    const [selectedResumeId, setSelectedResumeId] = React.useState('');
    const [showAnswerBoxes, setShowAnswerBoxes] = React.useState({});
    const [answerDrafts, setAnswerDrafts] = React.useState({});
    const [evaluatingAnswers, setEvaluatingAnswers] = React.useState({});
    const [answerEvaluations, setAnswerEvaluations] = React.useState({});
    const [loadingMoreQuestions, setLoadingMoreQuestions] = React.useState(false);
    const [moreQuestionsLockByResume, setMoreQuestionsLockByResume] = React.useState({});

    const buildSessionId = () =>
        `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

    const getAnswerKey = (category, index, question) =>
        `${category}-${index}-${question}`;

    const getActiveResumeId = () => selectedResumeId || resumeId || '';

    const hasAnyQuestions =
        questions.technical.length > 0 ||
        questions.projectBased.length > 0 ||
        questions.hr.length > 0;

    const currentMoreQuestionsLockUntil = moreQuestionsLockByResume[getActiveResumeId()];
    const isMoreQuestionsLocked =
        Boolean(currentMoreQuestionsLockUntil) &&
        Date.now() < new Date(currentMoreQuestionsLockUntil).getTime();

    const handleResumeUpload = async (file) => {
        if (!file) return;
        try {
            const text = await pdfToText(file);
            setResumeFile(file);
            setResumeText(text);
            const newSessionId = buildSessionId();
            setSessionId(newSessionId);
            setSourceMode('upload');
            setSelectedResumeId('');
            setQuestions(emptyGrouped);
            setFollowUps({});
            setShowAnswerBoxes({});
            setAnswerDrafts({});
            setEvaluatingAnswers({});
            setAnswerEvaluations({});
            toast.success('Resume uploaded for interview prep');
        } catch (error) {
            toast.error('Failed to read the PDF file');
        }
    };

    const loadResumes = async () => {
        if (!token) return;
        try {
            const { data } = await api.get('/api/users/resumes', {
                headers: { Authorization: token },
            });
            const resumes = data.resumes || [];
            setAllResumes(resumes);

            const lockMap = resumes.reduce((acc, resume) => {
                if (!resume?.moreQuestionsLastGeneratedAt) return acc;
                const lockedUntil = new Date(
                    new Date(resume.moreQuestionsLastGeneratedAt).getTime() +
                        MORE_QUESTIONS_WINDOW_HOURS * 60 * 60 * 1000
                ).toISOString();
                acc[resume._id] = lockedUntil;
                return acc;
            }, {});

            setMoreQuestionsLockByResume((prev) => ({ ...prev, ...lockMap }));
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const handleGenerateQuestions = async () => {
        if (!token) return;
        if (sourceMode === 'saved') {
            const activeResumeId = getActiveResumeId();
            if (!activeResumeId) {
                toast.error('Select a saved resume or upload a PDF');
                return;
            }
        }
        if (sourceMode === 'upload' && !resumeText) {
            toast.error('Upload a resume PDF first');
            return;
        }
        if (!jobRole || jobRole.trim().length === 0) {
            toast.error('Enter a job role');
            return;
        }
        setLoadingQuestions(true);
        try {
            const activeResumeId = getActiveResumeId();
            const payload = sourceMode === 'upload'
                ? { resumeText, jobRole, sessionId }
                : { resumeId: activeResumeId, jobRole };

            const { data } = sourceMode === 'upload'
                ? await generateInterviewQuestionsFromText(payload, token)
                : await generateInterviewQuestions(payload, token);

            setQuestions(data.questions || emptyGrouped);
            setFollowUps({});
            setShowAnswerBoxes({});
            setAnswerDrafts({});
            setEvaluatingAnswers({});
            setAnswerEvaluations({});
            toast.success('Questions generated');
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
        setLoadingQuestions(false);
    };

    const handleGenerateMoreQuestions = async () => {
        if (!token) return;
        if (sourceMode !== 'saved') {
            toast.error('Generate more questions is available only for saved resumes');
            return;
        }

        const activeResumeId = getActiveResumeId();
        if (!activeResumeId) {
            toast.error('Select a resume first');
            return;
        }

        if (!jobRole || jobRole.trim().length === 0) {
            toast.error('Enter a job role');
            return;
        }

        if (!hasAnyQuestions) {
            toast.error('Generate initial questions first');
            return;
        }

        if (isMoreQuestionsLocked) {
            toast.error('Generate more questions is locked for this resume for 24 hours');
            return;
        }

        const previousQuestions = {
            technical: questions.technical,
            projectBased: questions.projectBased,
            hr: questions.hr,
        };

        try {
            setLoadingMoreQuestions(true);
            const { data } = await generateMoreInterviewQuestions(
                {
                    resumeId: activeResumeId,
                    jobRole,
                    previousQuestions,
                },
                token
            );

            setQuestions((prev) => ({
                technical: [...(prev.technical || []), ...(data?.questions?.technical || [])],
                projectBased: [
                    ...(prev.projectBased || []),
                    ...(data?.questions?.projectBased || []),
                ],
                hr: [...(prev.hr || []), ...(data?.questions?.hr || [])],
            }));

            const lockUntil =
                data?.lockedUntil ||
                new Date(
                    Date.now() + MORE_QUESTIONS_WINDOW_HOURS * 60 * 60 * 1000
                ).toISOString();

            setMoreQuestionsLockByResume((prev) => ({
                ...prev,
                [activeResumeId]: lockUntil,
            }));
            toast.success('More questions generated');
        } catch (error) {
            const lockedUntil = error?.response?.data?.lockedUntil;
            if (lockedUntil) {
                setMoreQuestionsLockByResume((prev) => ({
                    ...prev,
                    [activeResumeId]: lockedUntil,
                }));
            }
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setLoadingMoreQuestions(false);
        }
    };

    const downloadInterviewPDF = async () => {
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const maxWidth = pageWidth - margin * 2;
            let yPosition = margin;

            // Title
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            pdf.text('Interview Questions', margin, yPosition);
            yPosition += 10;

            // Job Role
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.text(`Position: ${jobRole}`, margin, yPosition);
            yPosition += 8;

            // Date
            pdf.setFontSize(9);
            pdf.setFont(undefined, 'normal');
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
            yPosition += 10;

            // Helper function to add text with word wrapping
            const addWrappedText = (text, x, y, maxW, fontSize = 10) => {
                pdf.setFontSize(fontSize);
                const lines = pdf.splitTextToSize(text, maxW);
                const lineHeight = pdf.getLineHeight() / pdf.internal.scaleFactor;
                pdf.text(lines, x, y);
                return y + lines.length * lineHeight + 2;
            };

            // Categories
            const categories = [
                { key: 'technical', label: 'Technical Questions', items: questions.technical },
                { key: 'projectBased', label: 'Project-Based Questions', items: questions.projectBased },
                { key: 'hr', label: 'HR / Behavioral Questions', items: questions.hr }
            ];

            categories.forEach((category) => {
                if (category.items.length === 0) return;

                // Category title
                pdf.setFont(undefined, 'bold');
                pdf.setFontSize(12);
                yPosition += 3;
                yPosition = addWrappedText(category.label, margin, yPosition, maxWidth, 12);

                // Questions and follow-ups
                category.items.forEach((question, index) => {
                    // Check if we need a new page
                    if (yPosition > pageHeight - margin - 20) {
                        pdf.addPage();
                        yPosition = margin;
                    }

                    // Question
                    pdf.setFont(undefined, 'bold');
                    pdf.setFontSize(10);
                    const questionText = `Q${index + 1}. ${question}`;
                    yPosition = addWrappedText(questionText, margin, yPosition, maxWidth, 10);

                    // Follow-ups if they exist
                    if (followUps[question] && followUps[question].length > 0) {
                        pdf.setFont(undefined, 'italic');
                        pdf.setFontSize(9);
                        followUps[question].forEach((followUp, followIndex) => {
                            if (yPosition > pageHeight - margin - 10) {
                                pdf.addPage();
                                yPosition = margin;
                            }
                            const followUpText = `Follow-up ${followIndex + 1}: ${followUp}`;
                            yPosition = addWrappedText(followUpText, margin + 5, yPosition, maxWidth - 5, 9);
                        });
                    }

                    yPosition += 3;
                });

                yPosition += 5;
            });

            // Save the PDF
            pdf.save(`interview_questions_${jobRole.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
            toast.success('PDF downloaded successfully');
        } catch (error) {
            toast.error('Failed to download PDF');
            console.error(error);
        }
    };

    const handleFollowUp = async (category, question) => {
        if (!token) return;
        if (getTotalFollowUps(followUps) >= 3) {
            toast.error('Follow-up limit reached (3 total)');
            return;
        }
        if (sourceMode === 'saved') {
            const activeResumeId = getActiveResumeId();
            if (!activeResumeId) {
                toast.error('Select a saved resume or upload a PDF');
                return;
            }
        }
        if (sourceMode === 'upload' && !resumeText) {
            toast.error('Upload a resume PDF first');
            return;
        }
        try {
            setLoadingFollowUps((prev) => ({ ...prev, [question]: true }));
            const activeResumeId = getActiveResumeId();
            const payload = sourceMode === 'upload'
                ? { resumeText, question, category, jobRole, sessionId }
                : { resumeId: activeResumeId, question, category, jobRole };

            const { data } = sourceMode === 'upload'
                ? await generateFollowUpFromText(payload, token)
                : await generateFollowUp(payload, token);

            const followUpText = data.followUp;
            setFollowUps((prev) => ({
                ...prev,
                [question]: [...(prev[question] || []), followUpText],
            }));
            toast.success('Follow-up generated');
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setLoadingFollowUps((prev) => ({ ...prev, [question]: false }));
        }
    };

    const handleSubmitAnswer = async (category, index, question) => {
        if (!token) return;

        const answerKey = getAnswerKey(category, index, question);
        const answer = answerDrafts[answerKey] || '';

        if (!answer.trim()) {
            toast.error('Write your answer before submitting');
            return;
        }

        try {
            setEvaluatingAnswers((prev) => ({ ...prev, [answerKey]: true }));
            const { data } = await evaluateInterviewAnswer(
                { question, answer: answer.trim() },
                token
            );

            setAnswerEvaluations((prev) => ({ ...prev, [answerKey]: data }));
            toast.success('Answer evaluated');
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setEvaluatingAnswers((prev) => ({ ...prev, [answerKey]: false }));
        }
    };

    React.useEffect(() => {
        setSelectedResumeId(resumeId || '');
    }, [resumeId]);

    React.useEffect(() => {
        if (sourceMode !== 'saved') return;

        const activeSavedResumeId = getActiveResumeId();
        if (!activeSavedResumeId) {
            setJobRole('');
            setQuestions(emptyGrouped);
            setFollowUps({});
            setLoadingFollowUps({});
            setShowAnswerBoxes({});
            setAnswerDrafts({});
            setEvaluatingAnswers({});
            setAnswerEvaluations({});
            return;
        }

        const stored = safeParse(
            localStorage.getItem(`${resumeStoragePrefix}${activeSavedResumeId}`)
        );

        if (!stored) {
            setJobRole('');
            setQuestions(emptyGrouped);
            setFollowUps({});
            setLoadingFollowUps({});
            setShowAnswerBoxes({});
            setAnswerDrafts({});
            setEvaluatingAnswers({});
            setAnswerEvaluations({});
            return;
        }

        setJobRole(stored.jobRole || '');
        setQuestions(stored.questions || emptyGrouped);
        setFollowUps(stored.followUps || {});
        setLoadingFollowUps({});
        setShowAnswerBoxes(stored.showAnswerBoxes || {});
        setAnswerDrafts(stored.answerDrafts || {});
        setEvaluatingAnswers({});
        setAnswerEvaluations(stored.answerEvaluations || {});
    }, [sourceMode, resumeId, selectedResumeId]);

    React.useEffect(() => {
        if (resumeId) return;
        const stored = safeParse(localStorage.getItem(uploadStorageKey));
        if (!stored || stored.sourceMode !== 'upload') return;
        setSourceMode('upload');
        setJobRole(stored.jobRole || '');
        setQuestions(stored.questions || emptyGrouped);
        setFollowUps(stored.followUps || {});
        setLoadingFollowUps({});
        setResumeText(stored.resumeText || '');
        setSessionId(stored.sessionId || '');
        setShowAnswerBoxes(stored.showAnswerBoxes || {});
        setAnswerDrafts(stored.answerDrafts || {});
        setEvaluatingAnswers({});
        setAnswerEvaluations(stored.answerEvaluations || {});
    }, [resumeId]);

    React.useEffect(() => {
        if (sourceMode !== 'upload') return;
        const payload = {
            sourceMode: 'upload',
            jobRole,
            questions,
            followUps,
            resumeText,
            sessionId,
            showAnswerBoxes,
            answerDrafts,
            answerEvaluations,
        };
        localStorage.setItem(uploadStorageKey, JSON.stringify(payload));
    }, [
        sourceMode,
        jobRole,
        questions,
        followUps,
        resumeText,
        sessionId,
        showAnswerBoxes,
        answerDrafts,
        answerEvaluations,
    ]);

    React.useEffect(() => {
        if (sourceMode !== 'saved') return;
        const activeResumeId = getActiveResumeId();
        if (!activeResumeId) return;
        const payload = {
            sourceMode: 'saved',
            jobRole,
            questions,
            followUps,
            showAnswerBoxes,
            answerDrafts,
            answerEvaluations,
        };
        localStorage.setItem(
            `${resumeStoragePrefix}${activeResumeId}`,
            JSON.stringify(payload)
        );
    }, [
        sourceMode,
        resumeId,
        selectedResumeId,
        jobRole,
        questions,
        followUps,
        showAnswerBoxes,
        answerDrafts,
        answerEvaluations,
    ]);

    React.useEffect(() => {
        if (sourceMode !== 'upload') return;
        if (!resumeText || sessionId) return;
        setSessionId(buildSessionId());
    }, [sourceMode, resumeText, sessionId]);

    React.useEffect(() => {
        loadResumes();
    }, [token]);

    const selectedResume = allResumes.find(
        (resume) => resume._id === getActiveResumeId()
    );

    const renderQuestionBlock = (label, items, categoryKey) => (
        <div className='bg-white border border-slate-200 rounded-lg p-5 shadow-sm'>
            <h3 className='text-lg font-semibold text-slate-800 mb-4'>{label}</h3>
            {items.length === 0 ? (
                <p className='text-sm text-slate-500'>No questions yet.</p>
            ) : (
                <div className='space-y-4'>
                    {items.map((question, index) => (
                        <div
                            key={`${categoryKey}-${index}`}
                            className='border border-slate-200 rounded-lg p-4'
                        >
                            {(() => {
                                const answerKey = getAnswerKey(categoryKey, index, question);
                                const evaluation = answerEvaluations[answerKey];

                                return (
                                    <>
                            <p className='text-sm font-semibold text-slate-700'>
                                Q{index + 1}. {question}
                            </p>
                            <div className='mt-4'>
                                <div className='flex flex-wrap items-center gap-2'>
                                    <button
                                        disabled={
                                            loadingFollowUps[question] ||
                                            getTotalFollowUps(followUps) >= 3
                                        }
                                        onClick={() => handleFollowUp(categoryKey, question)}
                                        className='text-xs px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed'
                                    >
                                        {loadingFollowUps[question]
                                            ? 'Generating...'
                                            : 'Generate follow-up'}
                                    </button>
                                    <button
                                        onClick={() =>
                                            setShowAnswerBoxes((prev) => ({
                                                ...prev,
                                                [answerKey]: !prev[answerKey],
                                            }))
                                        }
                                        className='text-xs px-3 py-1.5 rounded-full border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] transition flex items-center gap-1.5'
                                    >
                                        <svg
                                            className={`w-4 h-4 transition-transform ${
                                                showAnswerBoxes[answerKey] ? 'rotate-90' : 'rotate-0'
                                            }`}
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                                        </svg>
                                        Give Answer
                                    </button>
                                </div>
                                {getTotalFollowUps(followUps) >= 3 && (
                                    <p className='mt-2 text-xs text-slate-500'>
                                        Follow-up limit reached (3 total).
                                    </p>
                                )}
                            </div>
                            {showAnswerBoxes[answerKey] && (
                                <div className='mt-3 border border-slate-200 rounded-lg bg-slate-50 max-h-96 overflow-y-auto'>
                                    <div className='p-3 space-y-3'>
                                        <textarea
                                            rows={4}
                                            value={answerDrafts[answerKey] || ''}
                                            onChange={(event) =>
                                                setAnswerDrafts((prev) => ({
                                                    ...prev,
                                                    [answerKey]: event.target.value,
                                                }))
                                            }
                                            placeholder='Write your interview answer...'
                                            className='w-full border border-[#CBD5F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30'
                                        />
                                        <button
                                            onClick={() =>
                                                handleSubmitAnswer(categoryKey, index, question)
                                            }
                                            disabled={evaluatingAnswers[answerKey]}
                                            className='text-xs px-3 py-1.5 rounded-full bg-[#1E3A8A] text-white hover:bg-[#1E40AF] transition disabled:opacity-60 w-full'
                                        >
                                            {evaluatingAnswers[answerKey]
                                                ? 'Evaluating...'
                                                : 'Submit Answer'}
                                        </button>
                                        {followUps[question] && followUps[question].length > 0 && (
                                            <div className='space-y-2 border-t border-slate-200 pt-3'>
                                                <p className='text-xs font-semibold text-slate-700'>Follow-ups:</p>
                                                {followUps[question].map((followUpItem, followIndex) => (
                                                    <p
                                                        key={`${question}-follow-${followIndex}`}
                                                        className='text-xs text-slate-600 bg-white rounded p-2 border border-slate-200'
                                                    >
                                                        {followUpItem}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        {evaluation && (
                                            <div className='border-t border-slate-200 pt-3 space-y-2'>
                                                <p className='text-xs font-semibold text-slate-700'>Evaluation Results:</p>
                                                <div className='bg-white rounded p-2 border border-slate-200 space-y-2'>
                                                    <p className='text-xs text-slate-700'>
                                                        Technical Depth: <span className='font-semibold'>{evaluation.technicalDepth} / 10</span>
                                                    </p>
                                                    <p className='text-xs text-slate-700'>
                                                        Clarity: <span className='font-semibold'>{evaluation.clarity} / 10</span>
                                                    </p>
                                                    <p className='text-xs text-slate-700'>
                                                        Confidence: <span className='font-semibold'>{evaluation.confidence} / 10</span>
                                                    </p>
                                                    <p className='text-xs text-slate-700'>
                                                        Overall Score: <span className='font-semibold'>{evaluation.overallScore} / 10</span>
                                                    </p>
                                                </div>
                                                <div className='bg-white rounded p-2 border border-slate-200'>
                                                    <p className='text-xs font-semibold text-slate-700 mb-1'>Feedback:</p>
                                                    <p className='text-xs text-slate-600'>{evaluation.feedback}</p>
                                                </div>
                                                <div className='bg-white rounded p-2 border border-slate-200'>
                                                    <p className='text-xs font-semibold text-slate-700 mb-1'>Suggestions:</p>
                                                    <ul className='list-disc pl-4 text-xs text-slate-600 space-y-1'>
                                                        {(evaluation.suggestions || []).map((item, suggestionIndex) => (
                                                            <li key={`${answerKey}-suggestion-${suggestionIndex}`}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                                    </>
                                );
                            })()}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className='max-w-7xl mx-auto px-4 py-8 space-y-8'>
            <div className='flex items-center justify-between'>
                <div className='flex flex-col gap-2'>
                    <h1 className='text-2xl font-semibold text-slate-800'>
                        AI Interview Generator
                    </h1>
                    <p className='text-sm text-slate-500'>
                        Generate tailored interview questions, answers, and follow-ups.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/app')}
                    className='px-4 py-2 rounded-xl text-sm border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] transition'
                >
                    Back to Dashboard
                </button>
            </div>

            <div className='bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4'>
                <div className='flex flex-wrap items-center gap-3'>
                    <span className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                        Active source
                    </span>
                    <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            sourceMode === 'upload'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}
                    >
                        {sourceMode === 'upload' ? 'Uploaded PDF' : 'Saved resume'}
                    </span>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={() => setSourceMode('saved')}
                            className={`text-xs px-3 py-1 rounded-full border transition ${
                                sourceMode === 'saved'
                                    ? 'border-blue-400 text-blue-700 bg-blue-50'
                                    : 'border-slate-200 text-slate-600 hover:bg-white'
                            }`}
                        >
                            Use saved resume
                        </button>
                        <button
                            onClick={() => setSourceMode('upload')}
                            className={`text-xs px-3 py-1 rounded-full border transition ${
                                sourceMode === 'upload'
                                    ? 'border-emerald-400 text-emerald-700 bg-emerald-50'
                                    : 'border-slate-200 text-slate-600 hover:bg-white'
                            }`}
                        >
                            Use uploaded PDF
                        </button>
                    </div>
                </div>
                {sourceMode === 'upload' && (
                <div className='border border-slate-200 rounded-lg p-4 bg-white'>
                    <div className='flex items-center justify-between mb-3'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-700'>
                                Upload a resume PDF
                            </h2>
                            <p className='text-xs text-slate-500'>
                                Upload a PDF file for interview prep.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setSourceMode('saved');
                                setResumeFile(null);
                                setResumeText('');
                                setSessionId('');
                                localStorage.removeItem(uploadStorageKey);
                            }}
                            className='text-xs text-slate-600 hover:text-slate-800 underline'
                        >
                            Use existing resume instead
                        </button>
                    </div>
                    <div className='flex flex-col md:flex-row md:items-center gap-3'>
                        <label className='inline-flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] cursor-pointer hover:border-[#CBD5F5]'>
                            <input
                                type='file'
                                accept='.pdf'
                                hidden
                                onChange={(event) =>
                                    handleResumeUpload(event.target.files?.[0])
                                }
                            />
                            Upload PDF
                        </label>
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${resumeFile ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {resumeFile ? resumeFile.name : 'No file selected'}
                        </span>
                        {resumeFile && (
                            <button
                                onClick={() => {
                                    setResumeFile(null);
                                    setResumeText('');
                                    setSessionId('');
                                    localStorage.removeItem(uploadStorageKey);
                                }}
                                className='text-xs text-slate-500 hover:text-slate-700'
                            >
                                Clear PDF
                            </button>
                        )}
                    </div>
                </div>
                )}
                {sourceMode === 'saved' && (
                <div className='border border-slate-200 rounded-lg p-4 bg-slate-50'>
                    <div className='flex items-center justify-between mb-3'>
                        <div>
                            <h2 className='text-sm font-semibold text-slate-700'>
                                Use an existing resume
                            </h2>
                            <p className='text-xs text-slate-500'>
                                Select a saved resume for interview prep.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setSourceMode('upload');
                                setSelectedResumeId('');
                            }}
                            className='text-xs text-slate-600 hover:text-slate-800 underline'
                        >
                            Upload PDF instead
                        </button>
                    </div>
                    <div className='flex flex-col md:flex-row md:items-center gap-3'>
                        <select
                            value={selectedResumeId}
                            onChange={(event) => setSelectedResumeId(event.target.value)}
                            className='w-full md:max-w-sm border border-[#CBD5F5] rounded-lg px-3 py-2 text-sm bg-white'
                        >
                            <option value=''>Choose a resume</option>
                            {allResumes.map((resume) => (
                                <option key={resume._id} value={resume._id}>
                                    {resume.title}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                if (!selectedResumeId) {
                                    toast.error('Select a resume first');
                                    return;
                                }
                                setSourceMode('saved');
                                navigate(`/app/interview/${selectedResumeId}`);
                            }}
                            className='px-4 py-2 rounded-xl text-sm border border-[#E2E8F0] text-[#0F172A] hover:bg-white'
                        >
                            Use selected resume
                        </button>
                        {selectedResume && (
                            <span className='text-xs text-slate-500'>
                                Selected: {selectedResume.title}
                            </span>
                        )}
                    </div>
                </div>
                )}
                <div className='flex flex-col lg:flex-row lg:items-end gap-4'>
                    <div className='flex-1'>
                        <label className='text-sm font-medium text-slate-700'>
                            Job Role
                        </label>
                        <input
                            value={jobRole}
                            onChange={(event) => setJobRole(event.target.value)}
                            type='text'
                            placeholder='e.g. Frontend Engineer'
                            className='mt-2 w-full border border-[#CBD5F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30'
                        />
                    </div>
                    <div className='flex flex-wrap gap-3'>
                        <button
                            onClick={handleGenerateQuestions}
                            disabled={loadingQuestions || !jobRole.trim()}
                            className='px-4 py-2 rounded-xl text-sm bg-[#1E3A8A] text-white hover:bg-[#1E40AF] transition disabled:opacity-60'
                        >
                            {loadingQuestions ? 'Generating...' : 'Generate Questions'}
                        </button>
                        {sourceMode === 'saved' && (
                            <button
                                onClick={handleGenerateMoreQuestions}
                                disabled={
                                    loadingMoreQuestions ||
                                    loadingQuestions ||
                                    !jobRole.trim() ||
                                    !getActiveResumeId() ||
                                    !hasAnyQuestions ||
                                    isMoreQuestionsLocked
                                }
                                className='px-4 py-2 rounded-xl text-sm border border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50 transition disabled:opacity-60 disabled:cursor-not-allowed'
                            >
                                {loadingMoreQuestions ? 'Generating More...' : 'Generate More Questions'}
                            </button>
                        )}
                        {(questions.technical.length > 0 || questions.projectBased.length > 0 || questions.hr.length > 0) && (
                            <button
                                onClick={downloadInterviewPDF}
                                className='px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2'
                            >
                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 0l-4 2m4-2l4 2' />
                                </svg>
                                Download PDF
                            </button>
                        )}
                    </div>
                </div>
                {sourceMode === 'saved' && isMoreQuestionsLocked && (
                    <p className='text-xs text-slate-500'>
                        Generate More Questions is locked for this resume until{' '}
                        {new Date(currentMoreQuestionsLockUntil).toLocaleString()}.
                    </p>
                )}
            </div>

            <div className='grid lg:grid-cols-3 gap-6'>
                {renderQuestionBlock(
                    'Technical',
                    questions.technical,
                    'technical'
                )}
                {renderQuestionBlock(
                    'Project-Based',
                    questions.projectBased,
                    'projectBased'
                )}
                {renderQuestionBlock('HR / Behavioral', questions.hr, 'hr')}
            </div>

        </div>
    );
};

export default Interview;
