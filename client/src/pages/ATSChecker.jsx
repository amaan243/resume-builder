import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircle, AlertCircle, TrendingUp, FileText, UploadCloud, LoaderCircleIcon, Sparkles, XIcon } from 'lucide-react';
import api from '../configs/api';
import toast from 'react-hot-toast';
import pdfToText from 'react-pdftotext';
import { useSelector } from 'react-redux';

const ATSChecker = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  
  const [resume, setResume] = React.useState(null);
  const [targetRole, setTargetRole] = React.useState('');
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [atsResult, setAtsResult] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('upload');
  const [sourceMode, setSourceMode] = React.useState('upload');
  const [allResumes, setAllResumes] = React.useState([]);
  const [selectedResumeId, setSelectedResumeId] = React.useState('');

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

  const analyzeResume = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    try {
      if (sourceMode === 'saved') {
        if (!selectedResumeId) {
          toast.error('Select a saved resume');
          setIsAnalyzing(false);
          return;
        }

        const { data } = await api.post(
          '/api/ai/ats-score-resume',
          { resumeId: selectedResumeId, targetRole: targetRole || undefined },
          { headers: { Authorization: token } }
        );

        setAtsResult(data);
        setActiveTab('results');
        toast.success('Resume analyzed successfully!');
        return;
      }

      const resumeText = await pdfToText(resume);

      if (!resumeText || resumeText.trim().length < 100) {
        toast.error('Unable to extract text from PDF. Please ensure it\'s a valid resume.');
        setIsAnalyzing(false);
        return;
      }

      const { data } = await api.post(
        '/api/ai/ats-score',
        { resumeText, targetRole: targetRole || undefined },
        { headers: { Authorization: token } }
      );

      setAtsResult(data);
      setActiveTab('results');
      toast.success('Resume analyzed successfully!');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to analyze resume');
      console.error('ATS Analysis Error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'from-green-100 to-green-200';
    if (score >= 60) return 'from-yellow-100 to-yellow-200';
    return 'from-red-100 to-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  const formatTextOrNA = (value) => {
    if (typeof value !== 'string') return 'N/A';
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : 'N/A';
  };

  const formatPercentOrNA = (value, showPlus = false) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/A';
    return `${showPlus ? '+' : ''}${value}%`;
  };

  const resetForm = () => {
    setResume(null);
    setSelectedResumeId('');
    setTargetRole('');
    setAtsResult(null);
    setActiveTab('upload');
  };

  React.useEffect(() => {
    loadResumes();
  }, [token]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* Header */}
      <div className='bg-gradient-to-r from-green-600 to-green-700 text-white'>
        <div className='max-w-5xl mx-auto px-4 py-8'>
          <div className='flex items-center gap-4 mb-6'>
            <button
              onClick={() => navigate('/app')}
              className='p-2 hover:bg-white/20 rounded-lg transition-colors'
              title='Go back'
            >
              <ArrowLeftIcon className='size-6' />
            </button>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-white/20 rounded-lg'>
                <Sparkles className='size-6' />
              </div>
              <div>
                <h1 className='text-3xl font-bold'>ATS Resume Score</h1>
                <p className='text-green-100 text-sm mt-1'>AI-Powered Resume Analysis</p>
              </div>
            </div>
          </div>
          <p className='text-green-100 text-sm max-w-2xl'>
            Optimize your resume to pass ATS (Applicant Tracking Systems) with our intelligent analysis tool. 
            Get detailed feedback on keywords, formatting, and more.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-5xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
          {/* Tabs */}
          <div className='flex border-b border-gray-200 bg-gray-50 px-6'>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-4 font-medium transition-all ${
                activeTab === 'upload'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload Resume
            </button>
            <button
              onClick={() => setActiveTab('results')}
              disabled={!atsResult}
              className={`px-4 py-4 font-medium transition-all ${
                activeTab === 'results'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              } ${!atsResult && 'opacity-50 cursor-not-allowed'}`}
            >
              Analysis Results
            </button>
          </div>

          {/* Content */}
          <div className='p-8'>
            {activeTab === 'upload' && (
              <form onSubmit={analyzeResume} className='space-y-6'>
                <div className='flex flex-wrap items-center gap-3'>
                  <span className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
                    Active source
                  </span>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      sourceMode === 'upload'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {sourceMode === 'upload' ? 'Uploaded PDF' : 'Saved resume'}
                  </span>
                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => setSourceMode('saved')}
                      className={`text-xs px-3 py-1 rounded-full border transition ${
                        sourceMode === 'saved'
                          ? 'border-blue-400 text-blue-700 bg-blue-50'
                          : 'border-gray-200 text-gray-600 hover:bg-white'
                      }`}
                    >
                      Use saved resume
                    </button>
                    <button
                      type='button'
                      onClick={() => setSourceMode('upload')}
                      className={`text-xs px-3 py-1 rounded-full border transition ${
                        sourceMode === 'upload'
                          ? 'border-green-400 text-green-700 bg-green-50'
                          : 'border-gray-200 text-gray-600 hover:bg-white'
                      }`}
                    >
                      Use uploaded PDF
                    </button>
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Target Role (Optional)
                  </label>
                  <input
                    onChange={(e) => setTargetRole(e.target.value)}
                    value={targetRole}
                    type='text'
                    placeholder='e.g., Software Engineer, Product Manager, Data Scientist'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Specify a role for more targeted feedback and keyword suggestions
                  </p>
                </div>

                {sourceMode === 'saved' ? (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Choose a saved resume
                    </label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className='w-full border border-gray-300 rounded-lg px-3 py-3 text-sm bg-white'
                    >
                      <option value=''>Select a resume</option>
                      {allResumes.map((resumeItem) => (
                        <option key={resumeItem._id} value={resumeItem._id}>
                          {resumeItem.title}
                        </option>
                      ))}
                    </select>
                    {allResumes.length === 0 && (
                      <p className='text-xs text-gray-500 mt-2'>
                        No saved resumes yet. Upload a PDF or create a resume first.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label htmlFor='ats-resume-input' className='block text-sm font-medium text-gray-700 mb-2'>
                      Upload Resume (PDF)
                    </label>
                    <div className='relative'>
                      <input
                        id='ats-resume-input'
                        type='file'
                        accept='.pdf'
                        hidden
                        onChange={(e) => setResume(e.target.files[0])}
                        required={sourceMode === 'upload'}
                      />
                      <label
                        htmlFor='ats-resume-input'
                        className='flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all group'
                      >
                        {resume ? (
                          <div className='flex items-center gap-3'>
                            <FileText className='size-10 text-green-600' />
                            <div className='text-left'>
                              <p className='text-green-600 font-semibold'>{resume.name}</p>
                              <p className='text-sm text-gray-500'>
                                {(resume.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className='size-16 text-gray-400 group-hover:text-green-500 transition-colors' />
                            <div className='text-center'>
                              <p className='text-gray-700 font-semibold'>Click to upload resume</p>
                              <p className='text-sm text-gray-500 mt-1'>PDF format only • Max 10MB</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                <button
                  type='submit'
                  disabled={
                    isAnalyzing ||
                    (sourceMode === 'upload' ? !resume : !selectedResumeId)
                  }
                  className='w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl'
                >
                  {isAnalyzing ? (
                    <>
                      <LoaderCircleIcon className='animate-spin size-5' />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <Sparkles className='size-5' />
                      Analyze Resume
                    </>
                  )}
                </button>

                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3'>
                  <div className='flex-shrink-0'>
                    <AlertCircle className='size-5 text-blue-600 mt-0.5' />
                  </div>
                  <p className='text-sm text-blue-800'>
                    <strong>How it works:</strong> Upload a PDF resume to analyze it against ATS standards. We'll provide a score, identify missing keywords, and suggest improvements.
                  </p>
                </div>
              </form>
            )}

            {activeTab === 'results' && atsResult && (
              <div className='space-y-6'>
                {/* Score Card */}
                <div className={`bg-gradient-to-br ${getScoreBgColor(atsResult.atsScore)} rounded-xl p-8 text-center shadow-lg`}>
                  <p className='text-sm font-medium text-gray-600 mb-3'>Your ATS Score</p>
                  <div className='flex items-center justify-center gap-6 mb-6'>
                    <div className={`text-7xl font-bold ${getScoreColor(atsResult.atsScore)}`}>
                      {atsResult.atsScore}
                    </div>
                    <div className='text-left'>
                      <p className={`text-3xl font-bold ${getScoreColor(atsResult.atsScore)}`}>
                        {getScoreLabel(atsResult.atsScore)}
                      </p>
                      <p className='text-sm text-gray-600 mt-1'>out of 100</p>
                    </div>
                  </div>
                  <div className='w-full bg-white/50 rounded-full h-4 overflow-hidden'>
                    <div
                      className={`h-full bg-gradient-to-r ${
                        atsResult.atsScore >= 80
                          ? 'from-green-500 to-green-600'
                          : atsResult.atsScore >= 60
                          ? 'from-yellow-500 to-yellow-600'
                          : 'from-red-500 to-red-600'
                      } transition-all duration-1000`}
                      style={{ width: `${atsResult.atsScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* Overall Feedback */}
                {atsResult.overallFeedback && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <p className='text-sm text-blue-900'><strong>Summary:</strong> {atsResult.overallFeedback}</p>
                  </div>
                )}

                {/* Keyword Density */}
                {atsResult.keywordDensity && (
                  <div className='flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200'>
                    <span className='text-sm font-medium text-gray-700'>Keyword Density:</span>
                    <span className={`text-sm font-bold uppercase px-3 py-1 rounded-full ${
                      atsResult.keywordDensity === 'high' ? 'bg-green-100 text-green-700' :
                      atsResult.keywordDensity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {atsResult.keywordDensity}
                    </span>
                  </div>
                )}

                {/* Strengths */}
                <div className='border border-green-200 rounded-lg p-6 bg-green-50'>
                  <div className='flex items-center gap-2 mb-4'>
                    <CheckCircle className='size-6 text-green-600' />
                    <h3 className='text-lg font-semibold text-green-900'>Strengths</h3>
                  </div>
                  <ul className='space-y-3'>
                    {atsResult.strengths.map((strength, index) => (
                      <li key={index} className='flex items-start gap-3 text-sm text-green-800'>
                        <span className='text-green-600 font-bold mt-0.5'>✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className='border border-red-200 rounded-lg p-6 bg-red-50'>
                  <div className='flex items-center gap-2 mb-4'>
                    <AlertCircle className='size-6 text-red-600' />
                    <h3 className='text-lg font-semibold text-red-900'>Areas to Improve</h3>
                  </div>
                  <ul className='space-y-3'>
                    {atsResult.weaknesses.map((weakness, index) => (
                      <li key={index} className='flex items-start gap-3 text-sm text-red-800'>
                        <span className='text-red-600 font-bold mt-0.5'>✗</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Keywords */}
                <div className='border border-orange-200 rounded-lg p-6 bg-orange-50'>
                  <div className='flex items-center gap-2 mb-4'>
                    <TrendingUp className='size-6 text-orange-600' />
                    <h3 className='text-lg font-semibold text-orange-900'>Missing Keywords</h3>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {atsResult.missingKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className='px-3 py-1.5 bg-white border border-orange-300 rounded-full text-sm text-orange-800 font-medium hover:bg-orange-100 transition-colors'
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                <div className='border border-green-200 rounded-lg p-6 bg-green-50'>
                  <div className='flex items-center gap-2 mb-4'>
                    <Sparkles className='size-6 text-green-600' />
                    <h3 className='text-lg font-semibold text-green-900'>AI Suggestions</h3>
                  </div>
                  <ul className='space-y-3'>
                    {atsResult.suggestions.map((suggestion, index) => (
                      <li key={index} className='flex items-start gap-3 text-sm text-green-800'>
                        <span className='flex-shrink-0 w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700'>
                          {index + 1}
                        </span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Grammar Issues */}
                {atsResult.grammarIssues && atsResult.grammarIssues.length > 0 && (
                  <div className='border border-yellow-200 rounded-lg p-6 bg-yellow-50'>
                    <div className='flex items-center gap-2 mb-4'>
                      <AlertCircle className='size-6 text-yellow-600' />
                      <h3 className='text-lg font-semibold text-yellow-900'>Grammar & Formatting Issues</h3>
                    </div>
                    <ul className='space-y-3'>
                      {atsResult.grammarIssues.map((issue, index) => (
                        <li key={index} className='flex items-start gap-3 text-sm text-yellow-800'>
                          <span className='text-yellow-600 mt-0.5'>⚠</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Top Improvement Section */}
                {atsResult.topImprovementSection && (
                  <div className='border border-indigo-200 rounded-lg p-6 bg-indigo-50'>
                    <div className='flex items-center gap-2 mb-3'>
                      <TrendingUp className='size-6 text-indigo-600' />
                      <h3 className='text-lg font-semibold text-indigo-900'>Highest Impact Improvement</h3>
                    </div>
                    <div className='space-y-2 text-sm text-indigo-900'>
                      <p>
                        <strong>Section to improve:</strong> {formatTextOrNA(atsResult.topImprovementSection.section)}
                      </p>
                      <p>
                        <strong>Potential ATS score increase:</strong> {formatPercentOrNA(atsResult.topImprovementSection.potentialScoreIncreasePercent, true)}
                      </p>
                      <p>
                        <strong>Why:</strong> {formatTextOrNA(atsResult.topImprovementSection.reason)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Section Impact Analysis */}
                {atsResult.sectionImpactAnalysis && atsResult.sectionImpactAnalysis.length > 0 && (
                  <div className='border border-purple-200 rounded-lg p-6 bg-purple-50'>
                    <div className='flex items-center gap-2 mb-4'>
                      <FileText className='size-6 text-purple-600' />
                      <h3 className='text-lg font-semibold text-purple-900'>Section-wise Impact Analysis</h3>
                    </div>
                    <div className='space-y-3'>
                      {atsResult.sectionImpactAnalysis.map((item, index) => (
                        <div key={`${item.section}-${index}`} className='bg-white border border-purple-100 rounded-lg p-4'>
                          <div className='flex items-center justify-between gap-3 mb-2'>
                            <p className='text-sm font-semibold text-purple-900'>{formatTextOrNA(item.section)}</p>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              item.impactLevel === 'high'
                                ? 'bg-red-100 text-red-700'
                                : item.impactLevel === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : item.impactLevel === 'low'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {formatTextOrNA(item.impactLevel)} impact
                            </span>
                          </div>
                          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-purple-900'>
                            <p><strong>Current contribution:</strong> {formatPercentOrNA(item.currentImpactPercent)}</p>
                            <p><strong>Improvement potential:</strong> {formatPercentOrNA(item.improvementPotentialPercent)}</p>
                          </div>
                          <p className='text-sm text-purple-800 mt-2'>
                            <strong>Reason:</strong> {formatTextOrNA(item.reason)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className='flex gap-3 pt-6 border-t border-gray-200'>
                  <button
                    onClick={resetForm}
                    className='flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl'
                  >
                    Analyze Another Resume
                  </button>
                  <button
                    onClick={() => navigate('/app')}
                    className='px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors'
                  >
                    Back to Dashboard
                  </button>
                </div>

                <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3'>
                  <div className='flex-shrink-0'>
                    <CheckCircle className='size-5 text-green-600 mt-0.5' />
                  </div>
                  <p className='text-sm text-green-800'>
                    <strong>Next Steps:</strong> Apply these suggestions to your resume, then re-upload to verify improvements.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ATSChecker;
