import React, { useState } from 'react';

interface CreatePollFixedProps {
  onSubmit: (pollData: { question: string; options: string[]; expiryDate?: number; isAnonymous?: boolean }) => Promise<void>;
  loading?: boolean;
}

const CreatePollFixed: React.FC<CreatePollFixedProps> = ({ onSubmit, loading }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expiryDateTime, setExpiryDateTime] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
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

    // Parse expiry date
    let expiryDate: number | undefined;
    if (expiryDateTime) {
      const expiry = new Date(expiryDateTime).getTime();
      if (isNaN(expiry)) {
        setError('Invalid date/time format');
        return;
      }
      if (expiry <= Date.now()) {
        setError('Expiry date must be in the future');
        return;
      }
      expiryDate = expiry;
    }

    // Submit if valid
    setSubmitting(true);
    try {
      await onSubmit({ question: question.trim(), options: validOptions, expiryDate, isAnonymous });
      // Clear form on success
      setQuestion('');
      setOptions(['', '']);
      setExpiryDateTime('');
      setIsAnonymous(false);
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
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: '700',
        margin: '0 0 8px 0',
        color: 'var(--text-primary)'
      }}>
        New Poll
      </h2>

      {/* Question Input */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px',
          fontSize: '12px',
          fontWeight: '500',
          color: 'var(--text-muted)'
        }}>
          Question
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question..."
          maxLength={200}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid var(--border-input)',
            fontSize: '14px',
            minHeight: '80px',
            resize: 'vertical',
            fontFamily: 'inherit',
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            borderRadius: '6px'
          }}
        />
        <div style={{ 
          textAlign: 'right', 
          fontSize: '12px', 
          color: 'var(--text-lighter)',
          marginTop: '4px'
        }}>
          {question.length}/200
        </div>
      </div>

      {/* Options */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '12px',
          fontSize: '12px',
          fontWeight: '500',
          color: 'var(--text-muted)'
        }}>
          Options
        </label>
        {options.map((option, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            gap: '8px',
            marginBottom: '8px'
          }}>
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              maxLength={100}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid var(--border-input)',
                fontSize: '14px',
                fontFamily: 'inherit',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                borderRadius: '6px'
              }}
            />
            {options.length > 2 && (
              <button
                onClick={() => removeOption(index)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-button)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-input)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  lineHeight: '1',
                  minHeight: '44px',
                  minWidth: '44px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
              padding: '12px 20px',
              background: 'var(--bg-button)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-input)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              minHeight: '44px',
              borderRadius: '6px'
            }}
          >
            Add option
          </button>
        )}
      </div>

      {/* Advanced Options - Collapsed by default */}
      <details style={{ marginBottom: '24px' }}>
        <summary style={{ 
          fontSize: '12px',
          fontWeight: '500',
          color: '#666',
          cursor: 'pointer',
          marginBottom: '12px'
        }}>
          Advanced Options
        </summary>
        
        {/* Expiry Date */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#666'
          }}>
            Expiry Date (optional)
          </label>
          <input
            type="datetime-local"
            value={expiryDateTime}
            onChange={(e) => setExpiryDateTime(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Anonymous Voting Toggle */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#666',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <span>Anonymous voting</span>
          </label>
        </div>
      </details>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '10px 12px',
          background: '#fff3cd',
          borderLeft: '3px solid #ffa000',
          color: '#1a1a1a',
          marginBottom: '20px',
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={validateAndSubmit}
        disabled={submitting || loading}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '16px',
          fontWeight: '500',
          background: (submitting || loading) ? 'var(--bg-card)' : 'var(--bg-button)',
          color: (submitting || loading) ? 'var(--text-lighter)' : 'var(--text-primary)',
          border: '1px solid var(--border-medium)',
          cursor: (submitting || loading) ? 'not-allowed' : 'pointer',
          minHeight: '48px',
          borderRadius: '6px'
        }}
      >
        {submitting || loading ? 'Creating...' : 'Create poll'}
      </button>
    </div>
  );
};

export default CreatePollFixed;
