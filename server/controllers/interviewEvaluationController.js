import { evaluateWithMLModel } from '../services/interviewEvaluator.js';

export const evaluateInterviewAnswer = async (req, res) => {
    try {
        const { question, answer } = req.body;

        if (!question || question.trim().length < 3) {
            return res.status(400).json({ message: 'Valid question is required' });
        }

        if (!answer || answer.trim().length < 5) {
            return res.status(400).json({ message: 'Valid answer is required' });
        }

        const evaluation = await evaluateWithMLModel({
            question: question.trim(),
            answer: answer.trim(),
        });

        return res.status(200).json(evaluation);
    } catch (error) {
        const upstreamStatus = error?.response?.status;
        const networkCode = error?.code;

        const isServiceUnavailable =
            !upstreamStatus &&
            ['ECONNREFUSED', 'ECONNABORTED', 'ENOTFOUND', 'ETIMEDOUT'].includes(
                networkCode
            );

        const statusCode = isServiceUnavailable
            ? 503
            : upstreamStatus || 500;

        const message = isServiceUnavailable
            ? 'Interview evaluation service is unavailable. Start ML service at http://localhost:8000.'
            : error?.response?.data?.detail ||
              error?.response?.data?.message ||
              'Failed to evaluate answer';

        console.error('Interview Evaluation Error:', {
            message: error?.message,
            code: networkCode,
            status: upstreamStatus,
        });
        return res.status(statusCode).json({ message });
    }
};
