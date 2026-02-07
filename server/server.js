import express from 'express';
import cors from 'cors';
import  'dotenv/config';
import connectDB from './configs/db.js';
import userRouter from './routes/userRoutes.js';
import resumeRouter from './routes/resumeRoutes.js';
import aiRouter from './routes/aiRouter.js';
import skillRouter from './routes/skillRoutes.js';

await connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});
app.use('/api/users',userRouter);
app.use('/api/resumes',resumeRouter);
app.use('/api/ai',aiRouter);
app.use('/api/skills',skillRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});