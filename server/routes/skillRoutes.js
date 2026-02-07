import express from 'express';
import { 
  searchSkills, 
  getAllSkills, 
  addSkill, 
  getPopularSkills 
} from '../controllers/skillController.js';

const skillRouter = express.Router();

// Search skills with autocomplete
skillRouter.get('/search', searchSkills);

// Get all skills
skillRouter.get('/', getAllSkills);

// Get popular skills
skillRouter.get('/popular', getPopularSkills);

// Add new skill (you can add auth middleware if needed)
skillRouter.post('/', addSkill);

export default skillRouter;
