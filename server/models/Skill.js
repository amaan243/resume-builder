import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  popularity: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Single index: unique + case-insensitive for fast regex search
skillSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const Skill = mongoose.model('Skill', skillSchema);

export default Skill;
