import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { enhanceJobDescription, enhanceProfessionalSummary, uploadResume, getATSScore } from '../controllers/aiController.js';
import validateResumeOwnership from '../middlewares/validateResumeOwnership.js';
import {
	generateAllAnswers,
	generateAllAnswersFromText,
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
aiRouter.post('/interview-questions', protect, validateResumeOwnership, generateInterviewQuestions);
aiRouter.post('/generate-all-answers', protect, validateResumeOwnership, generateAllAnswers);
aiRouter.post('/followup-question', protect, validateResumeOwnership, generateFollowUpQuestion);
aiRouter.post('/interview-questions-text', protect, generateInterviewQuestionsFromText);
aiRouter.post('/generate-all-answers-text', protect, generateAllAnswersFromText);
aiRouter.post('/followup-question-text', protect, generateFollowUpQuestionFromText);

export default aiRouter;