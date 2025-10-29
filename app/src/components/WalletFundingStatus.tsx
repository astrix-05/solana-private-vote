import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

interface WalletFundingStatusProps {
  showDetails?: boolean;
}

interface FundingStatus {
  isMonitoring: boolean;
  currentBalance: number;
  minimumBalance: number;
  targetBalance: number;
  isLow: boolean;
  isWarning: boolean;
  network: string;
  walletAddress: string;
  lastCheck: string;
  fundingAttempts: number;
}

const WalletFundingStatus: React.FC<WalletFundingStatusProps> = ({ showDetails = false }) => {
  const [fundingStatus, setFundingStatus] = useState<FundingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFundingStatus = async () => {
    try {
      setError(null);
      const response = await apiService.getWalletFundingStatus();
      if (response.success) {
        setFundingStatus(response.funding);
      } else {
        setError('Failed to fetch funding status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch funding status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleForceFund = async () => {
    try {
      setRefreshing(true);
      const response = await apiService.forceFundWallet();
      if (response.success) {
        // Refresh status after funding
        await fetchFundingStatus();
      } else {
        setError('Failed to fund wallet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fund wallet');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFundingStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchFundingStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{
        padding: '12px',
        background: 'var(--bg-section)',
        border: '1px solid var(--border-light)',
        borderRadius: '6px',
        fontSize: '14px',
        color: 'var(--text-muted)'
      }}>
        Loading wallet status...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '12px',
        background: '#ffebee',
        border: '1px solid #f44336',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#c62828'
      }}>
        Error: {error}
      </div>
    );
  }

  if (!fundingStatus) {
    return null;
  }

  const getStatusColor = () => {
    if (fundingStatus.isLow) return '#dc3545'; // Subtle red
    if (fundingStatus.isWarning) return '#ffc107'; // Subtle yellow
    return '#28a745'; // Subtle green
  };

  const getStatusText = () => {
    if (fundingStatus.isLow) return 'Low Balance';
    if (fundingStatus.isWarning) return 'Low Balance';
    return 'Ready';
  };

  const getStatusIcon = () => {
    if (fundingStatus.isLow) return '●';
    if (fundingStatus.isWarning) return '●';
    return '●';
  };

  return (
    <div style={{
      padding: 'var(--space-card)',
      background: 'var(--bg-card)',
      border: `1px solid ${getStatusColor()}`,
      borderRadius: 'var(--radius-card)',
      fontSize: '14px',
      boxShadow: 'var(--shadow-card)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: showDetails ? '8px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{getStatusIcon()}</span>
          <span style={{ 
            fontWeight: '600', 
            color: getStatusColor(),
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {getStatusText()}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {fundingStatus.currentBalance.toFixed(4)} SOL
          </span>
          <button
            onClick={fetchFundingStatus}
            disabled={refreshing}
            style={{
              padding: '4px 8px',
              background: 'var(--button-bg)',
              color: 'var(--text-main)',
              border: '1px solid var(--button-border)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            {refreshing ? '...' : '↻'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: '4px' }}>
            Min: {fundingStatus.minimumBalance} SOL | Target: {fundingStatus.targetBalance} SOL
          </div>
          <div style={{ marginBottom: '4px' }}>
            Network: {fundingStatus.network} | Monitoring: {fundingStatus.isMonitoring ? 'ON' : 'OFF'}
          </div>
          <div style={{ marginBottom: '4px' }}>
            Wallet: {fundingStatus.walletAddress.slice(0, 8)}...{fundingStatus.walletAddress.slice(-8)}
          </div>
          <div style={{ marginBottom: '8px' }}>
            Last check: {new Date(fundingStatus.lastCheck).toLocaleTimeString()}
          </div>
          
          {fundingStatus.isLow && (
            <div style={{
              padding: '12px',
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '6px',
              marginTop: '12px'
            }}>
              <div style={{ color: '#856404', fontWeight: '500', marginBottom: '6px' }}>
                Low Balance
              </div>
              <div style={{ color: '#856404', fontSize: '12px', marginBottom: '10px' }}>
                The relayer wallet needs funding to process votes.
              </div>
              <button
                onClick={handleForceFund}
                disabled={refreshing}
                style={{
                  padding: '8px 16px',
                  background: 'var(--button-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--button-border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  opacity: refreshing ? 0.6 : 1
                }}
              >
                {refreshing ? 'Funding...' : 'Fund Wallet'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletFundingStatus;

