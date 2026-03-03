import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000/predict';

export const evaluateWithMLModel = async ({ question, answer }) => {
    const { data } = await axios.post(
        ML_SERVICE_URL,
        { question, answer },
        {
            timeout: 12000,
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    return data;
};
