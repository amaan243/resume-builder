import React from 'react'
import { Sparkles, X, Plus, Trash2 } from 'lucide-react'
import SkillsAutocomplete from './SkillsAutocomplete'

const SkillsForm = ({data,onChange,isSweTemplate}) => {

  const [currentInput, setCurrentInput] = React.useState('');
  const [selectedCategoryIndex, setSelectedCategoryIndex] = React.useState(0);
  
  // Handle both old format (single object) and new format (array of objects)
  const rawSkillsArray = Array.isArray(data) ? data : (data?.items ? [data] : []);
  const skillsArray = rawSkillsArray.map((cat) => ({
    category: cat?.category || '',
    items: Array.isArray(cat?.items) ? cat.items : []
  }));
  const flatSkills = skillsArray.flatMap((cat) => cat.items || []);

  const updateFlatSkills = (items) => {
    if (isSweTemplate) {
      return;
    }
    if (items.length === 0) {
      onChange([]);
    } else {
      onChange([{ category: '', items }]);
    }
  };

  React.useEffect(() => {
    if (isSweTemplate && skillsArray.length === 0) {
      onChange([{ category: '', items: [] }]);
    }
  }, [isSweTemplate, skillsArray.length, onChange]);

  // Add skill to selected category
  const addSkillToCategory = (skillName, categoryIndex) => {
    if (skillName && skillsArray[categoryIndex]) {
      const updatedSkills = [...skillsArray];
      if (!updatedSkills[categoryIndex].items.includes(skillName)) {
        updatedSkills[categoryIndex].items = [...updatedSkills[categoryIndex].items, skillName];
        onChange(updatedSkills);
        setCurrentInput('');
      }
    }
  }

  const addFlatSkill = (skillName) => {
    if (skillName && !flatSkills.includes(skillName)) {
      updateFlatSkills([...flatSkills, skillName]);
      setCurrentInput('');
    }
  };

  const removeFlatSkill = (skillIndex) => {
    updateFlatSkills(flatSkills.filter((_, idx) => idx !== skillIndex));
  };

  // Remove skill from category
  const removeSkill = (categoryIndex, skillIndex) => {
    const updatedSkills = [...skillsArray];
    updatedSkills[categoryIndex].items = updatedSkills[categoryIndex].items.filter((_, idx) => idx !== skillIndex);
    onChange(updatedSkills);
  }

  // Add new category
  const addCategory = () => {
    const newSkills = [...skillsArray, { category: '', items: [] }];
    onChange(newSkills);
    setSelectedCategoryIndex(newSkills.length - 1);
  }

  // Remove category
  const removeCategory = (categoryIndex) => {
    const updatedSkills = skillsArray.filter((_, idx) => idx !== categoryIndex);
    onChange(updatedSkills);
    setSelectedCategoryIndex(Math.max(0, categoryIndex - 1));
  }

  // Update category name
  const updateCategoryName = (categoryIndex, newName) => {
    const updatedSkills = [...skillsArray];
    updatedSkills[categoryIndex].category = newName;
    onChange(updatedSkills);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className='flex items-center gap-2 text-lg font-semibold  text-gray-900'>Skills</h3>
        <p className='text-sm text-gray-500'>Add skill categories with related skills (for SWE template)</p>
      </div>

      {!isSweTemplate && (
        <>
          <div className="flex gap-2">
            <div className="flex-1">
              <SkillsAutocomplete 
                onSelect={addFlatSkill}
                existingSkills={flatSkills}
                placeholder="Type to search skills (e.g., React, Python, Leadership)..."
                onInputChange={setCurrentInput}
                inputValue={currentInput}
              />
            </div>
            <button 
              className='flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              onClick={() => {
                if (currentInput.trim()) {
                  addFlatSkill(currentInput.trim());
                }
              }}
              disabled={!currentInput.trim()}
            >
              <Plus className="size-4"/> Add
            </button>
          </div>

          {flatSkills.length > 0 ? (
            <div className='flex flex-wrap gap-2'> 
              {flatSkills.map((skill,index)=>(
                <span key={index} className='flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'>
                  {skill}
                  <button onClick={()=>removeFlatSkill(index)} className='ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors'>
                    <X className='w-3 h-3'/>
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className='text-center py-6 text-gray-500'>
              <Sparkles className='w-10 h-10 mx-auto mb-2 text-gray-300'/>
              <p>No skills added yet</p>
              <p className='text-sm'>Add Your technical and soft skills above</p>
            </div>
          )}
        </>
      )}

      {isSweTemplate && skillsArray.map((skillCategory, categoryIndex) => (
        <div key={categoryIndex} className='border border-gray-300 rounded-lg p-4 bg-gray-50'>
          {/* Category Header */}
          <div className='flex gap-2 items-end mb-4'>
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Category Name
              </label>
              <input
                type='text'
                value={skillCategory.category}
                onChange={(e) => updateCategoryName(categoryIndex, e.target.value)}
                placeholder='e.g., Web Development, AI/ML, DevOps'
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
              />
            </div>
            {skillsArray.length > 1 && (
              <button
                onClick={() => removeCategory(categoryIndex)}
                className='p-2 hover:bg-red-100 text-red-600 rounded transition-colors'
                title='Remove category'
              >
                <Trash2 className='size-5' />
              </button>
            )}
          </div>

          {/* Skills for this category */}
          <div className='space-y-3'>
            <label className='block text-sm font-medium text-gray-700'>
              Skills in this category
            </label>
            
            {/* Skill Input */}
            <div className='flex gap-2'>
              <div className='flex-1'>
                <SkillsAutocomplete 
                  onSelect={(skill) => addSkillToCategory(skill, categoryIndex)}
                  existingSkills={skillCategory.items}
                  placeholder='Type skill name...'
                  onInputChange={setCurrentInput}
                  inputValue={selectedCategoryIndex === categoryIndex ? currentInput : ''}
                />
              </div>
              <button 
                className='flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                onClick={() => {
                  if (currentInput.trim()) {
                    addSkillToCategory(currentInput.trim(), categoryIndex);
                  }
                }}
                disabled={!currentInput.trim()}
              >
                <Plus className="size-4"/> Add
              </button>
            </div>

            {/* Display skills */}
            {skillCategory.items.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {skillCategory.items.map((skill, skillIndex) => (
                  <span key={skillIndex} className='flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'>
                    {skill}
                    <button 
                      onClick={() => removeSkill(categoryIndex, skillIndex)} 
                      className='ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors'
                    >
                      <X className='w-3 h-3'/>
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className='text-sm text-gray-400 italic'>No skills added yet</p>
            )}
          </div>
        </div>
      ))}

      {/* Add More Categories Button */}
      {isSweTemplate && skillsArray.length > 0 && (
        <button
          onClick={addCategory}
          className='w-full px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2'
        >
          <Plus className='size-4' /> Add Another Category
        </button>
      )}

      {isSweTemplate && (
        <div className='bg-blue-50 p-3 rounded-lg'>
          <p className='text-sm text-blue-800'><strong>Tip:</strong> Create multiple skill categories for a better organized resume. For example: Web Development, AI/ML, DevOps, etc.</p>
        </div>
      )}
    </div>
  )
}

export default SkillsForm

