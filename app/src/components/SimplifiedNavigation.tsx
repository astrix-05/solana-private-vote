import React, { useState } from 'react';

interface SimplifiedNavigationProps {
  currentView: 'create' | 'vote' | 'manage' | 'results';
  onViewChange: (view: 'create' | 'vote' | 'manage' | 'results') => void;
  isMobile: boolean;
}

const SimplifiedNavigation: React.FC<SimplifiedNavigationProps> = ({ 
  currentView, 
  onViewChange, 
  isMobile 
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems = [
    { id: 'create', icon: '✏️', label: 'Create' },
    { id: 'vote', icon: '🗳️', label: 'Vote' },
    { id: 'manage', icon: '⚙️', label: 'Manage' },
    { id: 'results', icon: '📊', label: 'Results' }
  ];

  const handleItemClick = (itemId: string) => {
    onViewChange(itemId as 'create' | 'vote' | 'manage' | 'results');
  };

  if (isMobile) {
    // Mobile bottom navigation
    return (
      <div className="mobile-nav">
        <div className="mobile-nav-content">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`mobile-nav-icon ${currentView === item.id ? 'active' : ''}`}
              style={{
                transform: currentView === item.id ? 'scale(1.05)' : 'scale(1)',
                transition: 'var(--transition)'
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Desktop sidebar navigation
  return (
    <div style={{
      position: 'fixed',
      left: '0',
      top: '100px',
      bottom: '0',
      width: '80px',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border-grey)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 0',
      zIndex: '100',
      boxShadow: 'var(--shadow)'
    }}>
      {navItems.map((item) => (
        <div key={item.id} style={{ position: 'relative', marginBottom: '32px' }}>
          <button
            onClick={() => handleItemClick(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`nav-icon ${currentView === item.id ? 'active' : ''}`}
            style={{
              transform: currentView === item.id ? 'scale(1.1)' : 'scale(1)',
              transition: 'var(--transition)'
            }}
          >
            <span style={{ fontSize: '24px' }}>{item.icon}</span>
          </button>

          {/* Tooltip */}
          {hoveredItem === item.id && (
            <div style={{
              position: 'absolute',
              left: '90px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-grey)',
              zIndex: '1000',
              animation: 'fadeInUp 0.3s ease-out'
            }}>
              {item.label}
              <div style={{
                position: 'absolute',
                left: '-6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '0',
                height: '0',
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderRight: '6px solid var(--bg-card)'
              }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SimplifiedNavigation;