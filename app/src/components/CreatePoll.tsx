import React, { useState } from 'react';
import { PollFormData } from '../types';
import { Plus, X, AlertCircle } from './Icons';

interface CreatePollProps {
  onSubmit: (pollData: PollFormData) => void;
}

const CreatePoll: React.FC<CreatePollProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<PollFormData>({
    question: '',
    options: ['', '']
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate question
    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    } else if (formData.question.length > 200) {
      newErrors.question = 'Question must be 200 characters or less';
    }

    // Validate options
    const validOptions = formData.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      newErrors.options = 'At least 2 options are required';
    } else if (validOptions.length > 10) {
      newErrors.options = 'Maximum 10 options allowed';
    }

    // Validate each option length
    validOptions.forEach((option, index) => {
      if (option.length > 100) {
        newErrors[`option-${index}`] = 'Option must be 100 characters or less';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const validOptions = formData.options.filter(option => option.trim());
      onSubmit({
        question: formData.question.trim(),
        options: validOptions
      });
    }
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Poll</h2>
          <p className="text-gray-600">
            Create a secure, private poll where votes are encrypted using Arcium technology.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Field */}
          <div>
            <label htmlFor="question" className="label">
              Poll Question *
            </label>
            <textarea
              id="question"
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              className={`input min-h-[100px] resize-none ${errors.question ? 'border-red-500' : ''}`}
              placeholder="What would you like to ask your voters?"
              maxLength={200}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.question && (
                <span className="error flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.question}
                </span>
              )}
              <span className="text-sm text-gray-500 ml-auto">
                {formData.question.length}/200
              </span>
            </div>
          </div>

          {/* Options Field */}
          <div>
            <label className="label">
              Voting Options *
            </label>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className={`input flex-1 ${errors[`option-${index}`] ? 'border-red-500' : ''}`}
                    placeholder={`Option ${index + 1}`}
                    maxLength={100}
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {errors.options && (
              <span className="error flex items-center mt-2">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.options}
              </span>
            )}

            {formData.options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Privacy & Security</h4>
                <p className="text-sm text-blue-700 mt-1">
                  All votes are encrypted using Arcium technology, ensuring complete privacy. 
                  Only the poll creator can close the poll and reveal results.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setFormData({ question: '', options: ['', ''] })}
              className="btn-secondary"
            >
              Clear
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll;
