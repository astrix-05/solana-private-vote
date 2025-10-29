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
    if (fundingStatus.isLow) return '#f44336'; // Red
    if (fundingStatus.isWarning) return '#ff9800'; // Orange
    return '#4caf50'; // Green
  };

  const getStatusText = () => {
    if (fundingStatus.isLow) return 'CRITICAL';
    if (fundingStatus.isWarning) return 'WARNING';
    return 'HEALTHY';
  };

  const getStatusIcon = () => {
    if (fundingStatus.isLow) return '🚨';
    if (fundingStatus.isWarning) return '⚠️';
    return '✅';
  };

  return (
    <div style={{
      padding: '12px',
      background: 'var(--bg-section)',
      border: `1px solid ${getStatusColor()}`,
      borderRadius: '6px',
      fontSize: '14px'
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
              background: 'var(--bg-button)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
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
              padding: '8px',
              background: '#ffebee',
              border: '1px solid #f44336',
              borderRadius: '4px',
              marginTop: '8px'
            }}>
              <div style={{ color: '#c62828', fontWeight: '600', marginBottom: '4px' }}>
                ⚠️ Low Balance Alert
              </div>
              <div style={{ color: '#c62828', fontSize: '11px', marginBottom: '8px' }}>
                The relayer wallet is critically low on SOL. This may cause vote failures.
              </div>
              <button
                onClick={handleForceFund}
                disabled={refreshing}
                style={{
                  padding: '6px 12px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  opacity: refreshing ? 0.6 : 1
                }}
              >
                {refreshing ? 'Funding...' : 'Fund Wallet Now'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletFundingStatus;

