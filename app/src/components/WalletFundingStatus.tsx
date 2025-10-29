import React, { useEffect, useState, useCallback } from 'react';
import apiService from '../services/apiService';

interface WalletFundingStatusProps {
  showDetails?: boolean;
}

interface FundingStatus {
  isMonitoring: boolean;
  currentBalance: number;
  minimumBalance: number;
  targetBalance: number;
  airdropAmount: number;
  checkInterval: number;
  isLow: boolean;
  isWarning: boolean;
  network: string;
  walletAddress: string;
  lastCheck: string;
  fundingAttempts: number;
  lastFundingAttempt: string | null;
}

const WalletFundingStatus: React.FC<WalletFundingStatusProps> = ({ showDetails = false }) => {
  const [fundingStatus, setFundingStatus] = useState<FundingStatus | null>(null);
  const [loading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFundingStatus = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await apiService.getWalletFundingStatus();
      if (response.success) {
        setFundingStatus(response.funding);
      } else {
        setError('Failed to fetch funding status');
      }
    } catch (err) {
      console.error('Error fetching wallet funding status:', err);
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFundingStatus();
    const interval = setInterval(fetchFundingStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchFundingStatus]);

  const handleForceFund = async () => {
    if (window.confirm('Are you sure you want to force an airdrop to the relayer wallet? This is only for devnet/testnet.')) {
      setRefreshing(true);
      try {
        const response = await apiService.forceFundWallet();
        if (response.success) {
          alert(response.message);
          fetchFundingStatus(); // Refresh status after funding attempt
        } else {
          alert('Failed to fund wallet');
        }
      } catch (err) {
        console.error('Error forcing fund:', err);
        alert(`Error forcing fund: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setRefreshing(false);
      }
    }
  };

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
        <p style={{ margin: 0, fontSize: '16px' }}>Loading relayer wallet status...</p>
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

  if (!fundingStatus) {
    return null;
  }

  const getStatusColor = () => {
    if (fundingStatus.isLow) return 'var(--accent-pink)';
    if (fundingStatus.isWarning) return '#ffa726';
    return 'var(--accent-green)';
  };

  const getStatusText = () => {
    if (fundingStatus.isLow) return 'Critical';
    if (fundingStatus.isWarning) return 'Warning';
    return 'Healthy';
  };

  const getStatusIcon = () => {
    if (fundingStatus.isLow) return '🚨';
    if (fundingStatus.isWarning) return '⚠️';
    return '✅';
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--bg-card) 0%, #1a1a2e 100%)',
      border: `2px solid ${getStatusColor()}`,
      borderRadius: 'var(--radius)',
      padding: '24px',
      boxShadow: fundingStatus.isLow ? 'var(--shadow-pink)' : 'var(--shadow)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: showDetails ? '20px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>{getStatusIcon()}</span>
          <div>
            <h3 style={{
              margin: '0 0 4px 0',
              fontSize: '20px',
              fontWeight: '700',
              color: getStatusColor()
            }}>
              Relayer Wallet Status
            </h3>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-muted)',
              fontWeight: '500'
            }}>
              {getStatusText()} • {fundingStatus.currentBalance.toFixed(4)} SOL
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchFundingStatus}
            disabled={refreshing}
            className="btn-ghost"
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            {refreshing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="loading-dots">
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                  <div className="loading-dot" />
                </div>
                Refreshing...
              </div>
            ) : (
              '🔄 Refresh'
            )}
          </button>
        </div>
      </div>

      {/* Details Section */}
      {showDetails && (
        <div style={{
          paddingTop: '20px',
          borderTop: '1px solid var(--border-grey)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Wallet Address
              </h4>
              <p style={{
                margin: 0,
                fontSize: '16px',
                color: 'var(--text-main)',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {fundingStatus.walletAddress.slice(0, 8)}...{fundingStatus.walletAddress.slice(-8)}
              </p>
            </div>

            <div>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Network
              </h4>
              <p style={{
                margin: 0,
                fontSize: '16px',
                color: 'var(--text-main)',
                fontWeight: '500'
              }}>
                {fundingStatus.network}
              </p>
            </div>

            <div>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Balance Thresholds
              </h4>
              <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                <div>Min: {fundingStatus.minimumBalance} SOL</div>
                <div>Target: {fundingStatus.targetBalance} SOL</div>
              </div>
            </div>

            <div>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Last Check
              </h4>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--text-main)'
              }}>
                {new Date(fundingStatus.lastCheck).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Critical Warning */}
          {fundingStatus.isLow && (
            <div style={{
              background: 'var(--accent-pink)',
              color: 'white',
              padding: '20px',
              borderRadius: 'var(--radius)',
              marginTop: '20px',
              animation: 'shake 0.5s ease-out'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>🚨</span>
                <h4 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  Critical: Low Balance Alert
                </h4>
              </div>
              <p style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                opacity: 0.9
              }}>
                The relayer wallet needs immediate funding to process votes. 
                This may cause vote failures if not addressed.
              </p>
              <button
                onClick={handleForceFund}
                disabled={refreshing}
                style={{
                  background: 'white',
                  color: 'var(--accent-pink)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  opacity: refreshing ? 0.6 : 1,
                  transition: 'var(--transition)'
                }}
              >
                {refreshing ? 'Funding...' : '💰 Fund Wallet Now'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletFundingStatus;