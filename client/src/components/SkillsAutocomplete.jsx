import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import api from '../configs/api';

const SkillsAutocomplete = ({ onSelect, placeholder = "Search skills...", existingSkills = [], onInputChange, inputValue }) => {
  const [input, setInput] = useState(inputValue || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync with controlled input
  useEffect(() => {
    if (inputValue !== undefined && inputValue !== input) {
      setInput(inputValue);
    }
  }, [inputValue]);

  // Fetch suggestions with debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't search if input is too short
    if (input.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Set loading state
    setIsLoading(true);
    setError(null);

    // Debounce API call by 300ms
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await api.get(`/api/skills/search?query=${encodeURIComponent(input)}`);
        // Filter out skills that are already added
        const filteredSuggestions = response.data.filter(
          skill => !existingSkills.includes(skill.name)
        );
        setSuggestions(filteredSuggestions);
        setIsOpen(filteredSuggestions.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Error fetching skills:', err);
        setError('Failed to fetch suggestions');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [input, existingSkills]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && input.trim()) {
        e.preventDefault();
        handleAddCustomSkill();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSkill(suggestions[selectedIndex]);
        } else if (input.trim()) {
          handleAddCustomSkill();
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;

      default:
        break;
    }
  };

  // Select a skill from suggestions
  const handleSelectSkill = (skill) => {
    onSelect(skill.name);
    setInput('');
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onInputChange) onInputChange('');
    inputRef.current?.focus();
  };

  // Add custom skill (not in suggestions)
  const handleAddCustomSkill = () => {
    if (input.trim()) {
      onSelect(input.trim());
      setInput('');
      setSuggestions([]);
      setIsOpen(false);
      if (onInputChange) onInputChange('');
    }
  };

  // Clear input
  const handleClear = () => {
    setInput('');
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onInputChange) onInputChange('');
    inputRef.current?.focus();
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    if (onInputChange) onInputChange(value);
  };

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="font-semibold text-blue-600">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative w-full">
      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />

        {/* Loading or Clear Button */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : input ? (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-1 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((skill, index) => (
            <button
              key={skill._id}
              onClick={() => handleSelectSkill(skill)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between
                ${
                  index === selectedIndex
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }
                ${index === 0 ? 'rounded-t-lg' : ''}
                ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}
              `}
            >
              <span className="flex-1">
                {highlightMatch(skill.name, input)}
              </span>
              
              {skill.category && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full 
                  ${
                    index === selectedIndex
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {skill.category}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && input.trim().length >= 2 && suggestions.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
        >
          <p className="text-sm text-gray-600 text-center">
            No skills found. Press <kbd className="px-2 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Enter</kbd> to add "{input}" as a custom skill.
          </p>
        </div>
      )}
    </div>
  );
};

export default SkillsAutocomplete;
