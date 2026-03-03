import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { evaluateInterviewAnswer } from '../controllers/interviewEvaluationController.js';

const interviewRouter = express.Router();

interviewRouter.post('/evaluate-answer', protect, evaluateInterviewAnswer);

export default interviewRouter;
