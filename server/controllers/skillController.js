import Skill from '../models/Skill.js';

// Search skills with autocomplete
export const searchSkills = async (req, res) => {
  try {
    const { query } = req.query;

    // Return empty array if query is too short
    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    // Case-insensitive regex search for partial matching
    const searchRegex = new RegExp(query.trim(), 'i');

    const skills = await Skill.find({
      name: { $regex: searchRegex }
    })
      .select('name category') // Only return needed fields
      .sort({ popularity: -1 }) // Sort by popularity DESC
      .limit(10) // Limit to 10 results
      .lean(); // Convert to plain JS objects for better performance

    res.json(skills);
  } catch (error) {
    console.error('Error searching skills:', error);
    res.status(500).json({ 
      message: 'Error searching skills', 
      error: error.message 
    });
  }
};

// Get all skills (optional - for testing)
export const getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find()
      .select('name category popularity')
      .sort({ popularity: -1 })
      .lean();

    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ 
      message: 'Error fetching skills', 
      error: error.message 
    });
  }
};

// Add a new skill (optional - for admin use)
export const addSkill = async (req, res) => {
  try {
    const { name, category, popularity } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    const skill = new Skill({
      name: name.trim(),
      category: category || 'General',
      popularity: popularity || 0
    });

    await skill.save();

    res.status(201).json({
      message: 'Skill added successfully',
      skill
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Skill already exists' });
    }
    console.error('Error adding skill:', error);
    res.status(500).json({ 
      message: 'Error adding skill', 
      error: error.message 
    });
  }
};

// Get popular skills (optional - for suggestions)
export const getPopularSkills = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const skills = await Skill.find()
      .select('name category popularity')
      .sort({ popularity: -1 })
      .limit(limit)
      .lean();

    res.json(skills);
  } catch (error) {
    console.error('Error fetching popular skills:', error);
    res.status(500).json({ 
      message: 'Error fetching popular skills', 
      error: error.message 
    });
  }
};
