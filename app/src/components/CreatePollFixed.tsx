import React, { useState } from 'react';

interface CreatePollFixedProps {
  onSubmit: (pollData: { question: string; options: string[] }) => Promise<void>;
  loading?: boolean;
}

const CreatePollFixed: React.FC<CreatePollFixedProps> = ({ onSubmit, loading }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateAndSubmit = async () => {
    setError('');

    // Validate question
    if (!question.trim()) {
      setError('Question is required');
      return;
    }
    if (question.length > 200) {
      setError('Question must be 200 characters or less');
      return;
    }

    // Validate options
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }
    if (validOptions.length > 10) {
      setError('Maximum 10 options allowed');
      return;
    }

    // Validate each option length
    for (const option of validOptions) {
      if (option.length > 100) {
        setError('Each option must be 100 characters or less');
        return;
      }
    }

    // Submit if valid
    setSubmitting(true);
    try {
      await onSubmit({ question: question.trim(), options: validOptions });
      // Clear form on success
      setQuestion('');
      setOptions(['', '']);
    } catch (error) {
      setError('Failed to create poll. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '40px auto',
      padding: '30px',
      background: 'white',
      borderRadius: '15px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ 
        fontSize: '28px', 
        marginBottom: '20px',
        color: '#333'
      }}>
        Create New Poll
      </h2>

      {/* Question Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontWeight: '600',
          color: '#555'
        }}>
          Poll Question *
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would you like to ask your voters?"
          maxLength={200}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '16px',
            minHeight: '100px',
            resize: 'vertical'
          }}
        />
        <div style={{ 
          textAlign: 'right', 
          fontSize: '14px', 
          color: '#999',
          marginTop: '4px'
        }}>
          {question.length}/200
        </div>
      </div>

      {/* Options */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '12px',
          fontWeight: '600',
          color: '#555'
        }}>
          Voting Options *
        </label>
        {options.map((option, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            gap: '10px',
            marginBottom: '10px'
          }}>
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              maxLength={100}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px'
              }}
            />
            {options.length > 2 && (
              <button
                onClick={() => removeOption(index)}
                style={{
                  padding: '10px 15px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {options.length < 10 && (
          <button
            onClick={addOption}
            style={{
              padding: '8px 16px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + Add Option
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '12px',
          background: '#ffe6e6',
          color: '#cc0000',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={validateAndSubmit}
        disabled={submitting || loading}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '18px',
          fontWeight: 'bold',
          background: (submitting || loading) ? '#ccc' : '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: (submitting || loading) ? 'not-allowed' : 'pointer',
          opacity: (submitting || loading) ? 0.7 : 1
        }}
      >
        {submitting || loading ? 'Creating Poll...' : 'Create Poll'}
      </button>

      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f0f4ff',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#555'
      }}>
        <strong>💡 Tips:</strong>
        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
          <li>Question: 200 characters max</li>
          <li>Options: 2-10 options required</li>
          <li>Each option: 100 characters max</li>
        </ul>
      </div>
    </div>
  );
};

export default CreatePollFixed;
