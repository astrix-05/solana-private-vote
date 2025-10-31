import React, { useState } from 'react';
import apiService, { CreatePollRequest, CreatePollResponse } from '../services/apiService';

interface CreatePollFixedProps {
  onSubmit: (pollData: { question: string; options: string[]; expiryDate?: number; isAnonymous?: boolean; backendPollId?: string }) => Promise<void>;
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
          await onSubmit({ question: question.trim(), options: validOptions, expiryDate, isAnonymous, backendPollId: response.pollId });

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

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      {/* Section heading with bottom border */}
      <h2 style={{
        fontSize: '1.35rem', fontWeight: 900, marginBottom: '22px', color: '#222', textAlign: 'left',
        borderBottom: '1.5px solid #e5e5e5', paddingBottom:'11px', fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        Create New Poll
      </h2>

      {error && (
        <div className="status-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Question input - large/bold */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="question" className="input-label" style={{fontSize:'1.18rem',fontWeight:800,marginBottom:'8px'}}>Poll Question</label>
        <input
          id="question"
          type="text"
          className="input-field"
          placeholder="e.g., What's your favorite Solana project?"
          style={{
            fontSize: '1.13rem', fontWeight: 600,
            padding: '16px', borderRadius: '5px', marginBottom:'8px', background: '#fff', border: '1px solid #d5d5d5', color: '#222', boxShadow:'none', fontFamily:'Inter,system-ui,sans-serif'
          }}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={200}
        />
      </div>

      {/* Poll options as column, no backgrounds */}
      <div style={{ marginBottom: '16px' }}>
        <label className="input-label" style={{fontSize:'1rem',fontWeight:700}}>Poll Options</label>
        {options.map((option, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              className="input-field"
              placeholder={`Option ${index + 1}`}
              style={{ flexGrow: 1, marginRight: 0, marginBottom: '0', fontSize:'1rem', borderRadius:'5px', padding:'14px', background: '#fff', border:'1px solid #d5d5d5', color:'#222', boxShadow:'none' }}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              maxLength={100}
            />
            {options.length > 2 && (
              <button
                onClick={() => handleRemoveOption(index)}
                type="button"
                className="btn-secondary"
                style={{ minWidth: 38, padding: '8px 12px', fontSize: '12px', border:'1px solid #1976d2', color:'#1976d2', background:'#fff', borderRadius:'6px', fontWeight: 700, marginLeft: '2px' }}
              >Remove</button>
            )}
          </div>
        ))}
        {options.length < 10 && (
          <button 
            onClick={handleAddOption} 
            type="button"
            className="btn-secondary" 
            style={{ width: 'auto', padding: '10px 16px', fontSize: '14px', marginTop: '3px', border:'1px solid #1976d2', color:'#1976d2', background:'#fff', borderRadius:'6px', fontWeight:700 }}
          >+ Add Option</button>)
        }
      </div>

      {/* Date/time picker */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="expiryDateTime" className="input-label" style={{fontWeight:700}}>Expiry Date & Time (Optional)</label>
        <input
          id="expiryDateTime"
          type="datetime-local"
          className="input-field"
          style={{ borderRadius: '5px', padding:'12px', fontSize:'1rem', background:'#fff', color:'#222', border:'1px solid #d5d5d5', maxWidth:320 }}
          value={expiryDateTime}
          onChange={e => setExpiryDateTime(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
        />
      </div>

      {/* Checkbox for Anonymous Poll */}
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <input
          type="checkbox"
          id="isAnonymous"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          style={{ width: '19px', height: '19px', accentColor: '#1976d2', borderRadius:'4px' }}
        />
        <label htmlFor="isAnonymous" style={{ color: '#222', fontSize: '1rem', fontWeight: '500', marginLeft:'1px' }}>
          Anonymous Poll
        </label>
      </div>

      {/* Submit Button */}
      <button
        onClick={() => {
          setSubmitting(true);
          setTimeout(() => setSubmitting(false), 550);
          validateAndSubmit();
        }}
        disabled={submitting || loading}
        style={{ 
          width: '100%', marginTop: '18px', borderRadius:6, background:'#1976d2', border:'none', color:'#fff', fontWeight:700, fontSize:'1.08rem', padding:'16px 0', boxShadow:'none', cursor:'pointer', transition:'background .17s', fontFamily:'Inter,system-ui,sans-serif'
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
  );
};

export default CreatePollFixed;