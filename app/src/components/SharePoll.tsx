import React, { useState, useRef } from 'react';
import QRCode from 'qrcode';

interface SharePollProps {
  pollId: number;
  pollQuestion: string;
  onClose: () => void;
}

const SharePoll: React.FC<SharePollProps> = ({ pollId, pollQuestion, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const pollLinkRef = useRef<HTMLInputElement>(null);

  // Generate poll link
  const pollLink = `${window.location.origin}${window.location.pathname}#poll=${pollId}`;

  // Generate QR code on component mount
  React.useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrDataUrl = await QRCode.toDataURL(pollLink, {
          width: 200,
          margin: 2,
          color: {
            dark: '#1a1a1a',
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [pollLink]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pollLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      if (pollLinkRef.current) {
        pollLinkRef.current.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-subtle)',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Share Poll
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Poll Question */}
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            margin: '0 0 8px 0',
            fontWeight: '500'
          }}>
            Poll Question:
          </p>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: '1.4'
          }}>
            {pollQuestion}
          </p>
        </div>

        {/* Share Link Section */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-muted)',
            marginBottom: '8px'
          }}>
            Poll Link:
          </label>
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              ref={pollLinkRef}
              type="text"
              value={pollLink}
              readOnly
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                background: '#f8f9fa'
              }}
            />
            <button
              onClick={copyToClipboard}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              style={{
                padding: '10px 16px',
                background: copied ? '#28a745' : '#1a1a1a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                position: 'relative',
                transition: 'background-color 0.2s'
              }}
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
          {showTooltip && !copied && (
            <div style={{
              position: 'absolute',
              top: '-35px',
              right: '8px',
              background: '#333',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              zIndex: 1001
            }}>
              Click to copy poll link
            </div>
          )}
        </div>

        {/* QR Code Section */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-muted)',
            margin: '0 0 16px 0'
          }}>
            Scan QR Code to join on mobile:
          </p>
          {qrCodeDataUrl ? (
            <div style={{
              display: 'inline-block',
              padding: '16px',
              background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-subtle)',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <img
                src={qrCodeDataUrl}
                alt="Poll QR Code"
                style={{
                  width: '200px',
                  height: '200px',
                  display: 'block'
                }}
              />
            </div>
          ) : (
            <div style={{
              width: '200px',
              height: '200px',
              background: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              color: 'var(--text-muted)',
              fontSize: '14px'
            }}>
              Generating QR code...
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #bbdefb'
        }}>
          <p style={{
            fontSize: '13px',
            color: '#1976d2',
            margin: 0,
            lineHeight: '1.4'
          }}>
            <strong>How to share:</strong><br/>
            • Copy the link above and send it to others<br/>
            • Mobile users can scan the QR code to join instantly<br/>
            • Anyone with the link can view and vote on your poll
          </p>
        </div>

        {/* Close Button */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePoll;
