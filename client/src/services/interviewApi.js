import api from '../configs/api';

export const generateInterviewQuestions = (payload, token) =>
    api.post('/api/ai/interview-questions', payload, {
        headers: { Authorization: token },
    });

export const generateInterviewQuestionsFromText = (payload, token) =>
    api.post('/api/ai/interview-questions-text', payload, {
        headers: { Authorization: token },
    });

export const generateAllAnswers = (payload, token) =>
    api.post('/api/ai/generate-all-answers', payload, {
        headers: { Authorization: token },
    });

export const generateAllAnswersFromText = (payload, token) =>
    api.post('/api/ai/generate-all-answers-text', payload, {
        headers: { Authorization: token },
    });

export const generateFollowUp = (payload, token) =>
    api.post('/api/ai/followup-question', payload, {
        headers: { Authorization: token },
    });

export const generateFollowUpFromText = (payload, token) =>
    api.post('/api/ai/followup-question-text', payload, {
        headers: { Authorization: token },
    });

