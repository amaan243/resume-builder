import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
    generateFollowUp,
    generateFollowUpFromText,
    generateInterviewQuestions,
    generateInterviewQuestionsFromText,
} from '../services/interviewApi';
import pdfToText from 'react-pdftotext';
import api from '../configs/api';

const emptyGrouped = { technical: [], projectBased: [], hr: [] };
const uploadStorageKey = 'interviewUploadState';
const resumeStoragePrefix = 'interviewResumeState:';

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

    const buildSessionId = () =>
        `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

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
            setAllResumes(data.resumes || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const handleGenerateQuestions = async () => {
        if (!token) return;
        if (sourceMode === 'saved') {
            const activeResumeId = resumeId || selectedResumeId;
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
            const activeResumeId = resumeId || selectedResumeId;
            const payload = sourceMode === 'upload'
                ? { resumeText, jobRole, sessionId }
                : { resumeId: activeResumeId, jobRole };

            const { data } = sourceMode === 'upload'
                ? await generateInterviewQuestionsFromText(payload, token)
                : await generateInterviewQuestions(payload, token);

            setQuestions(data.questions || emptyGrouped);
            setFollowUps({});
            toast.success('Questions generated');
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
        setLoadingQuestions(false);
    };

    const handleFollowUp = async (category, question) => {
        if (!token) return;
        if (getTotalFollowUps(followUps) >= 3) {
            toast.error('Follow-up limit reached (3 total)');
            return;
        }
        if (sourceMode === 'saved') {
            const activeResumeId = resumeId || selectedResumeId;
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
            const activeResumeId = resumeId || selectedResumeId;
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

    React.useEffect(() => {
        setSelectedResumeId(resumeId || '');
    }, [resumeId]);

    React.useEffect(() => {
        if (!resumeId) return;
        const stored = safeParse(
            localStorage.getItem(`${resumeStoragePrefix}${resumeId}`)
        );
        setSourceMode('saved');
        setSelectedResumeId(resumeId);
        if (!stored) {
            setJobRole('');
            setQuestions(emptyGrouped);
            setFollowUps({});
            setLoadingFollowUps({});
            return;
        }
        setJobRole(stored.jobRole || '');
        setQuestions(stored.questions || emptyGrouped);
        setFollowUps(stored.followUps || {});
        setLoadingFollowUps({});
    }, [resumeId]);

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
        };
        localStorage.setItem(uploadStorageKey, JSON.stringify(payload));
    }, [sourceMode, jobRole, questions, followUps, resumeText, sessionId]);

    React.useEffect(() => {
        if (sourceMode !== 'saved') return;
        const activeResumeId = resumeId || selectedResumeId;
        if (!activeResumeId) return;
        const payload = {
            sourceMode: 'saved',
            jobRole,
            questions,
            followUps,
        };
        localStorage.setItem(
            `${resumeStoragePrefix}${activeResumeId}`,
            JSON.stringify(payload)
        );
    }, [sourceMode, resumeId, selectedResumeId, jobRole, questions, followUps]);

    React.useEffect(() => {
        if (sourceMode !== 'upload') return;
        if (!resumeText || sessionId) return;
        setSessionId(buildSessionId());
    }, [sourceMode, resumeText, sessionId]);

    React.useEffect(() => {
        loadResumes();
    }, [token]);

    const selectedResume = allResumes.find((resume) => resume._id === resumeId);

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
                            <p className='text-sm font-semibold text-slate-700'>
                                Q{index + 1}. {question}
                            </p>
                            <div className='mt-4'>
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
                                {getTotalFollowUps(followUps) >= 3 && (
                                    <p className='mt-2 text-xs text-slate-500'>
                                        Follow-up limit reached (3 total).
                                    </p>
                                )}
                            </div>
                            {followUps[question] && followUps[question].length > 0 && (
                                <div className='mt-3 space-y-2 border-l-2 border-slate-200 pl-4'>
                                    {followUps[question].map((followUpItem, followIndex) => (
                                        <p
                                            key={`${question}-follow-${followIndex}`}
                                            className='text-sm text-slate-600'
                                        >
                                            Follow-up: {followUpItem}
                                        </p>
                                    ))}
                                </div>
                            )}
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
                    className='px-4 py-2 rounded-lg text-sm border border-slate-300 text-slate-700 hover:bg-slate-50 transition'
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
                        <label className='inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 cursor-pointer hover:border-slate-300'>
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
                            className='w-full md:max-w-sm border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white'
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
                            className='px-4 py-2 rounded-lg text-sm border border-slate-300 text-slate-700 hover:bg-white'
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
                            className='mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200'
                        />
                    </div>
                    <div className='flex flex-wrap gap-3'>
                        <button
                            onClick={handleGenerateQuestions}
                            disabled={loadingQuestions || !jobRole.trim()}
                            className='px-4 py-2 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-60'
                        >
                            {loadingQuestions ? 'Generating...' : 'Generate Questions'}
                        </button>
                    </div>
                </div>
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
