import React, { useState } from 'react';
import apiService, { CreatePollRequest, CreatePollResponse } from '../services/apiService';

interface CreatePollFixedProps {
  onSubmit: (pollData: { question: string; options: string[]; expiryDate?: number; isAnonymous?: boolean }) => Promise<void>;
  loading?: boolean;
  creatorPublicKey?: string;
  isDemoMode?: boolean;
}

const CreatePollFixed: React.FC<CreatePollFixedProps> = ({ onSubmit, loading, creatorPublicKey, isDemoMode = false }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expiryDateTime, setExpiryDateTime] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pollCreationResult, setPollCreationResult] = useState<CreatePollResponse | null>(null);

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

    // Validate expiry date
    let expiryDate: number | undefined;
    if (expiryDateTime) {
      const expiry = new Date(expiryDateTime);
      if (isNaN(expiry.getTime())) {
        setError('Invalid expiry date');
        return;
      }
      if (expiry <= new Date()) {
        setError('Expiry date must be in the future');
        return;
      }
      expiryDate = expiry.getTime();
    }

    setSubmitting(true);
    setPollCreationResult(null);

    try {
      if (isDemoMode || !creatorPublicKey) {
        // Demo mode - just call the local onSubmit
        await onSubmit({ question: question.trim(), options: validOptions, expiryDate, isAnonymous });

        setPollCreationResult({
          success: true,
          pollId: Date.now().toString(),
          poll: {
            id: Date.now().toString(),
            question: question.trim(),
            options: validOptions,
            creator: creatorPublicKey || 'demo',
            isActive: true,
            isAnonymous,
            expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
            createdAt: new Date().toISOString(),
            voteCounts: new Array(validOptions.length).fill(0)
          },
          message: 'Demo poll created locally',
          blockchainConfirmed: false
        });
      } else {
        // Real poll creation - use relayer
        const pollRequest: CreatePollRequest = {
          question: question.trim(),
          options: validOptions,
          creator: creatorPublicKey,
          isAnonymous,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined
        };

        const response = await apiService.createPoll(pollRequest);

        if (response.success) {
          // Also call local onSubmit for UI state management
          await onSubmit({ question: question.trim(), options: validOptions, expiryDate, isAnonymous });

          setPollCreationResult(response);
        } else {
          throw new Error(response.error || 'Failed to create poll');
        }
      }

      // Clear form on success
      setQuestion('');
      setOptions(['', '']);
      setExpiryDateTime('');
      setIsAnonymous(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create poll. Please try again.');
      setPollCreationResult({
        success: false,
        pollId: '',
        poll: null,
        message: error instanceof Error ? error.message : 'Failed to create poll',
        blockchainConfirmed: false
      });
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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{
        fontSize: '2.5rem',
        fontWeight: '800',
        margin: '0 0 32px 0',
        textAlign: 'center',
        background: 'var(--button-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        Create New Poll
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Question Input */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-main)',
            marginBottom: '12px'
          }}>
            Poll Question *
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to ask voters?"
            className="input-field"
            style={{ fontSize: '16px' }}
            maxLength={200}
          />
          <div style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginTop: '8px',
            textAlign: 'right'
          }}>
            {question.length}/200 characters
          </div>
        </div>

        {/* Options */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-main)',
            marginBottom: '12px'
          }}>
            Poll Options *
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {options.map((option, index) => (
              <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="input-field"
                  style={{ flex: 1 }}
                  maxLength={100}
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="btn-ghost"
                    style={{
                      padding: '12px',
                      color: 'var(--accent-pink)',
                      borderColor: 'var(--accent-pink)'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 10 && (
            <button
              onClick={addOption}
              className="btn-secondary"
              style={{ marginTop: '12px' }}
            >
              + Add Option
            </button>
          )}
          <div style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginTop: '8px'
          }}>
            {options.length}/10 options (minimum 2)
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-main)',
            marginBottom: '12px'
          }}>
            Expiry Date (Optional)
          </label>
          <input
            type="datetime-local"
            value={expiryDateTime}
            onChange={(e) => setExpiryDateTime(e.target.value)}
            className="input-field"
            style={{ fontSize: '16px' }}
          />
          <div style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginTop: '8px'
          }}>
            Leave empty for no expiry
          </div>
        </div>

        {/* Anonymous Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          background: 'var(--btn-bg)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-grey)'
        }}>
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            style={{
              width: '20px',
              height: '20px',
              accentColor: 'var(--accent-blue)'
            }}
          />
          <label htmlFor="anonymous" style={{
            fontSize: '16px',
            fontWeight: '500',
            color: 'var(--text-main)',
            cursor: 'pointer'
          }}>
            Anonymous voting (hide voter addresses in results)
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="status-error">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={validateAndSubmit}
          disabled={submitting || loading}
          className="btn-primary"
          style={{
            fontSize: '18px',
            padding: '20px 40px',
            width: '100%',
            opacity: submitting || loading ? 0.7 : 1,
            cursor: submitting || loading ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div className="loading-dots">
                <div className="loading-dot" />
                <div className="loading-dot" />
                <div className="loading-dot" />
              </div>
              Creating Poll...
            </div>
          ) : (
            '🚀 Create Poll'
          )}
        </button>

        {/* Poll Creation Confirmation */}
        {pollCreationResult && (
          <div style={{
            padding: '24px',
            background: pollCreationResult.success ? 'var(--accent-green)' : 'var(--accent-pink)',
            color: 'white',
            borderRadius: 'var(--radius)',
            fontSize: '16px',
            animation: pollCreationResult.success ? 'slideInFromTop 0.5s ease-out' : 'shake 0.5s ease-out'
          }}>
            <div style={{ marginBottom: '16px', fontWeight: '700', fontSize: '18px' }}>
              {pollCreationResult.success ? '✅ Poll Created Successfully!' : '❌ Poll Creation Failed'}
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <strong>Message:</strong> {pollCreationResult.message}
            </div>
            
            {pollCreationResult.pollId && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Poll ID:</strong> {pollCreationResult.pollId}
              </div>
            )}
            
            {pollCreationResult.transactionSignature && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Transaction:</strong> {pollCreationResult.transactionSignature.slice(0, 12)}...{pollCreationResult.transactionSignature.slice(-12)}
              </div>
            )}
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px'
            }}>
              <span>{pollCreationResult.blockchainConfirmed ? '✅' : '⚠️'}</span>
              <span>
                {pollCreationResult.blockchainConfirmed ? 'Blockchain Confirmed' : 'Local Only (Demo Mode)'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePollFixed;