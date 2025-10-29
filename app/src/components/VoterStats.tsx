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
      <div style={{ 
        textAlign: 'center', 
        padding: '24px', 
        color: 'var(--text-muted)',
        background: 'var(--btn-bg)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-grey)'
      }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ margin: 0, fontSize: '16px' }}>Loading voter information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-error">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { rateLimit, feeInfo, identity } = stats;

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--bg-card) 0%, #1a1a2e 100%)',
      border: '1px solid var(--border-grey)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: 'var(--shadow)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '20px', 
          color: 'var(--text-main)',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>👤</span>
          Voter Information
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'var(--btn-bg)',
          borderRadius: '20px',
          border: '1px solid var(--border-grey)',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: 'var(--accent-green)',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }} />
          Active
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        {/* Fee Transparency */}
        <div style={{
          padding: '16px',
          background: 'var(--btn-bg)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-grey)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>💰</span>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: 'var(--text-main)'
            }}>
              Fee Information
            </span>
          </div>
          <div style={{ color: 'var(--accent-green)', fontWeight: '600', marginBottom: '8px' }}>
            Paid by: {feeInfo.paidBy}
          </div>
          <p style={{ 
            fontSize: '14px', 
            color: 'var(--text-muted)', 
            margin: 0,
            lineHeight: '1.4'
          }}>
            {feeInfo.description}
          </p>
        </div>

        {/* Rate Limiting */}
        <div style={{
          padding: '16px',
          background: 'var(--btn-bg)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-grey)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>⏱️</span>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: 'var(--text-main)'
            }}>
              Rate Limit
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '8px'
          }}>
            <span style={{ 
              fontSize: '24px', 
              fontWeight: '700',
              color: rateLimit.remainingVotes > 5 ? 'var(--accent-green)' : 
                     rateLimit.remainingVotes > 2 ? '#ffa726' : 'var(--accent-pink)'
            }}>
              {rateLimit.remainingVotes}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              votes remaining
            </span>
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: 'var(--text-muted)',
            marginBottom: '4px'
          }}>
            {rateLimit.votesInLastHour}/{rateLimit.maxVotesPerHour} used this hour
          </div>
          {rateLimit.resetTime && (
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)'
            }}>
              Resets: {new Date(rateLimit.resetTime).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Identity Verification */}
        {showDetails && identity && (
          <div style={{
            padding: '16px',
            background: 'var(--btn-bg)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-grey)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: 'var(--text-main)'
              }}>
                Identity Verified
              </span>
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--text-muted)',
              marginBottom: '8px'
            }}>
              <strong>Method:</strong> {identity.verificationMethod}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--text-muted)'
            }}>
              <strong>First seen:</strong> {new Date(identity.firstSeen).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Warning Messages */}
      {rateLimit.remainingVotes <= 2 && rateLimit.remainingVotes > 0 && (
        <div style={{
          background: '#fff3e0',
          border: '1px solid #ffb74d',
          borderRadius: 'var(--radius)',
          padding: '16px',
          marginTop: '20px',
          animation: 'slideInFromTop 0.5s ease-out'
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#e65100',
            fontWeight: '600',
            fontSize: '16px'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span>Low Vote Count Warning</span>
          </div>
          <p style={{ 
            color: '#e65100',
            margin: '8px 0 0 0',
            fontSize: '14px'
          }}>
            You have {rateLimit.remainingVotes} votes remaining this hour. Use them wisely!
          </p>
        </div>
      )}

      {rateLimit.remainingVotes === 0 && (
        <div style={{
          background: 'var(--accent-pink)',
          color: 'white',
          borderRadius: 'var(--radius)',
          padding: '16px',
          marginTop: '20px',
          animation: 'shake 0.5s ease-out'
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: '600',
            fontSize: '16px',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>🚫</span>
            <span>Rate Limit Exceeded</span>
          </div>
          <p style={{ 
            margin: 0,
            fontSize: '14px',
            opacity: 0.9
          }}>
            You've reached the maximum number of votes for this hour. Please wait before voting again.
          </p>
        </div>
      )}
    </div>
  );
};

export default VoterStats;