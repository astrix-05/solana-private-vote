import React, { useEffect, useState } from 'react';
import apiService from '../services/apiService';

interface VoterStatsProps {
  voterAddress: string;
  showDetails?: boolean;
}

interface VoterStatsData {
  voterAddress: string;
  identity: {
    address: string;
    firstSeen: string;
    verifiedAt: string;
    verificationMethod: string;
  } | null;
  rateLimit: {
    votesInLastHour: number;
    maxVotesPerHour: number;
    remainingVotes: number;
    resetTime: string | null;
  };
  feeInfo: {
    paidBy: string;
    description: string;
  };
}

const VoterStats: React.FC<VoterStatsProps> = ({ voterAddress, showDetails = false }) => {
  const [stats, setStats] = useState<VoterStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!voterAddress) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiService.getVoterStats(voterAddress);
        if (response.success) {
          setStats(response);
        } else {
          setError(response.error || 'Failed to fetch voter stats');
        }
      } catch (err) {
        console.error('Error fetching voter stats:', err);
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [voterAddress]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
        Loading voter information...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '16px', color: 'var(--error-color)' }}>
        Error: {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { rateLimit, feeInfo, identity } = stats;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-grey)',
      borderRadius: 'var(--radius-card)',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: 'var(--shadow-card)'
    }}>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '1rem', 
        color: 'var(--text-main)',
        fontWeight: '600'
      }}>
        Voter Information
      </h4>
      
      {/* Fee Transparency */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '4px'
        }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>💰</span>
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>
            Fee paid by: {feeInfo.paidBy}
          </span>
        </div>
        <p style={{ 
          fontSize: '12px', 
          color: 'var(--text-muted)', 
          margin: '0 0 0 24px',
          fontStyle: 'italic'
        }}>
          {feeInfo.description}
        </p>
      </div>

      {/* Rate Limiting Info */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '4px'
        }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>⏱️</span>
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>
            Rate Limit: {rateLimit.remainingVotes} votes remaining
          </span>
        </div>
        <p style={{ 
          fontSize: '12px', 
          color: 'var(--text-muted)', 
          margin: '0 0 0 24px'
        }}>
          {rateLimit.votesInLastHour}/{rateLimit.maxVotesPerHour} votes used in the last hour
        </p>
        {rateLimit.resetTime && (
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--text-muted)', 
            margin: '4px 0 0 24px'
          }}>
            Resets at: {new Date(rateLimit.resetTime).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Identity Verification */}
      {showDetails && identity && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '4px'
          }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>✅</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>
              Identity Verified
            </span>
          </div>
          <p style={{ 
            fontSize: '12px', 
            color: 'var(--text-muted)', 
            margin: '0 0 0 24px'
          }}>
            Method: {identity.verificationMethod} | 
            First seen: {new Date(identity.firstSeen).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Warning for low remaining votes */}
      {rateLimit.remainingVotes <= 2 && rateLimit.remainingVotes > 0 && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          padding: '8px',
          marginTop: '8px'
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#856404', 
            margin: 0,
            fontWeight: '500'
          }}>
            ⚠️ You have {rateLimit.remainingVotes} votes remaining this hour
          </p>
        </div>
      )}

      {/* Rate limit exceeded warning */}
      {rateLimit.remainingVotes === 0 && (
        <div style={{
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          padding: '8px',
          marginTop: '8px'
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#721c24', 
            margin: 0,
            fontWeight: '500'
          }}>
            🚫 Rate limit exceeded. Please wait before voting again.
          </p>
        </div>
      )}
    </div>
  );
};

export default VoterStats;
