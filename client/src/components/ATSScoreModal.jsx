import React from 'react';
import { XIcon, CheckCircle, AlertCircle, TrendingUp, FileText, UploadCloud, LoaderCircleIcon, Sparkles } from 'lucide-react';
import api from '../configs/api';
import toast from 'react-hot-toast';
import pdfToText from 'react-pdfToText';

const ATSScoreModal = ({ isOpen, onClose, token }) => {
  const [resume, setResume] = React.useState(null);
  const [targetRole, setTargetRole] = React.useState('');
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [atsResult, setAtsResult] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('upload');

  const analyzeResume = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    try {
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

  const resetModal = () => {
    setResume(null);
    setTargetRole('');
    setAtsResult(null);
    setActiveTab('upload');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto'
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='relative bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto'
      >
        {/* Header */}
        <div className='sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-white/20 rounded-lg'>
                <Sparkles className='size-6' />
              </div>
              <div>
                <h2 className='text-2xl font-bold'>ATS Resume Score</h2>
                <p className='text-green-100 text-sm'>AI-Powered Resume Analysis</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className='p-2 hover:bg-white/20 rounded-lg transition-colors'
            >
              <XIcon className='size-6' />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className='flex border-b border-gray-200 bg-gray-50 px-6'>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-3 font-medium transition-all ${
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
            className={`px-4 py-3 font-medium transition-all ${
              activeTab === 'results'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            } ${!atsResult && 'opacity-50 cursor-not-allowed'}`}
          >
            Analysis Results
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          {activeTab === 'upload' && (
            <form onSubmit={analyzeResume} className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Target Role (Optional)
                </label>
                <input
                  onChange={(e) => setTargetRole(e.target.value)}
                  value={targetRole}
                  type='text'
                  placeholder='e.g., Software Engineer, Product Manager'
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Specify a role for more targeted feedback
                </p>
              </div>

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
                    required
                  />
                  <label
                    htmlFor='ats-resume-input'
                    className='flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all group'
                  >
                    {resume ? (
                      <div className='flex items-center gap-3'>
                        <FileText className='size-8 text-green-600' />
                        <div className='text-left'>
                          <p className='text-green-600 font-medium'>{resume.name}</p>
                          <p className='text-sm text-gray-500'>
                            {(resume.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className='size-12 text-gray-400 group-hover:text-green-500 transition-colors' />
                        <div className='text-center'>
                          <p className='text-gray-600 font-medium'>Click to upload resume</p>
                          <p className='text-sm text-gray-400'>PDF format only</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <button
                type='submit'
                disabled={isAnalyzing || !resume}
                className='w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl'
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

              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <p className='text-sm text-blue-800'>
                  <strong>Note:</strong> This analysis evaluates your resume against ATS standards.
                  Processing time: 10-30 seconds.
                </p>
              </div>
            </form>
          )}

          {activeTab === 'results' && atsResult && (
            <div className='space-y-6'>
              {/* Score Card */}
              <div className={`bg-gradient-to-br ${getScoreBgColor(atsResult.atsScore)} rounded-xl p-6 text-center shadow-lg`}>
                <p className='text-sm font-medium text-gray-600 mb-2'>Your ATS Score</p>
                <div className='flex items-center justify-center gap-4'>
                  <div className={`text-6xl font-bold ${getScoreColor(atsResult.atsScore)}`}>
                    {atsResult.atsScore}
                  </div>
                  <div className='text-left'>
                    <p className={`text-2xl font-bold ${getScoreColor(atsResult.atsScore)}`}>
                      {getScoreLabel(atsResult.atsScore)}
                    </p>
                    <p className='text-sm text-gray-600'>out of 100</p>
                  </div>
                </div>
                <div className='mt-4 w-full bg-white/50 rounded-full h-3 overflow-hidden'>
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
                  <p className='text-sm text-blue-900'>{atsResult.overallFeedback}</p>
                </div>
              )}

              {/* Keyword Density */}
              {atsResult.keywordDensity && (
                <div className='flex items-center justify-between bg-gray-50 rounded-lg p-4'>
                  <span className='text-sm font-medium text-gray-700'>Keyword Density:</span>
                  <span className={`text-sm font-bold uppercase ${
                    atsResult.keywordDensity === 'high' ? 'text-green-600' :
                    atsResult.keywordDensity === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {atsResult.keywordDensity}
                  </span>
                </div>
              )}

              {/* Strengths */}
              <div className='border border-green-200 rounded-lg p-5 bg-green-50'>
                <div className='flex items-center gap-2 mb-3'>
                  <CheckCircle className='size-5 text-green-600' />
                  <h3 className='text-lg font-semibold text-green-900'>Strengths</h3>
                </div>
                <ul className='space-y-2'>
                  {atsResult.strengths.map((strength, index) => (
                    <li key={index} className='flex items-start gap-2 text-sm text-green-800'>
                      <span className='text-green-600 mt-0.5'>✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className='border border-red-200 rounded-lg p-5 bg-red-50'>
                <div className='flex items-center gap-2 mb-3'>
                  <AlertCircle className='size-5 text-red-600' />
                  <h3 className='text-lg font-semibold text-red-900'>Areas to Improve</h3>
                </div>
                <ul className='space-y-2'>
                  {atsResult.weaknesses.map((weakness, index) => (
                    <li key={index} className='flex items-start gap-2 text-sm text-red-800'>
                      <span className='text-red-600 mt-0.5'>✗</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing Keywords */}
              <div className='border border-orange-200 rounded-lg p-5 bg-orange-50'>
                <div className='flex items-center gap-2 mb-3'>
                  <TrendingUp className='size-5 text-orange-600' />
                  <h3 className='text-lg font-semibold text-orange-900'>Missing Keywords</h3>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {atsResult.missingKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className='px-3 py-1.5 bg-white border border-orange-300 rounded-full text-sm text-orange-800 font-medium'
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className='border border-green-200 rounded-lg p-5 bg-green-50'>
                <div className='flex items-center gap-2 mb-3'>
                  <Sparkles className='size-5 text-green-600' />
                  <h3 className='text-lg font-semibold text-green-900'>AI Suggestions</h3>
                </div>
                <ul className='space-y-3'>
                  {atsResult.suggestions.map((suggestion, index) => (
                    <li key={index} className='flex items-start gap-2 text-sm text-green-800'>
                      <span className='flex-shrink-0 w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700 mt-0.5'>
                        {index + 1}
                      </span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Grammar Issues */}
              {atsResult.grammarIssues && atsResult.grammarIssues.length > 0 && (
                <div className='border border-yellow-200 rounded-lg p-5 bg-yellow-50'>
                  <div className='flex items-center gap-2 mb-3'>
                    <AlertCircle className='size-5 text-yellow-600' />
                    <h3 className='text-lg font-semibold text-yellow-900'>Grammar & Formatting Issues</h3>
                  </div>
                  <ul className='space-y-2'>
                    {atsResult.grammarIssues.map((issue, index) => (
                      <li key={index} className='flex items-start gap-2 text-sm text-yellow-800'>
                        <span className='text-yellow-600 mt-0.5'>⚠</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className='flex gap-3 pt-4'>
                <button
                  onClick={() => {
                    resetModal();
                  }}
                  className='flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl'
                >
                  Analyze Another Resume
                </button>
                <button
                  onClick={handleClose}
                  className='px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors'
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ATSScoreModal;
