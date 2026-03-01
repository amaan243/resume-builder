import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { enhanceJobDescription, enhanceProfessionalSummary, uploadResume, getATSScore, getATSScoreFromResume } from '../controllers/aiController.js';
import validateResumeOwnership from '../middlewares/validateResumeOwnership.js';
import {
	
	
	generateFollowUpQuestion,
	generateFollowUpQuestionFromText,
	generateInterviewQuestions,
	generateInterviewQuestionsFromText,
} from '../controllers/interviewController.js';

const aiRouter = express.Router();

aiRouter.post('/enhance-pro-sum',protect,enhanceProfessionalSummary);
aiRouter.post('/enhance-job-desc',protect,enhanceJobDescription);
aiRouter.post('/upload-resume',protect,uploadResume);
aiRouter.post('/ats-score',protect,getATSScore);
aiRouter.post('/ats-score-resume', protect, validateResumeOwnership, getATSScoreFromResume);
aiRouter.post('/interview-questions', protect, validateResumeOwnership, generateInterviewQuestions);

aiRouter.post('/followup-question', protect, validateResumeOwnership, generateFollowUpQuestion);
aiRouter.post('/interview-questions-text', protect, generateInterviewQuestionsFromText);

aiRouter.post('/followup-question-text', protect, generateFollowUpQuestionFromText);

export default aiRouter;