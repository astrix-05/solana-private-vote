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
    { id: 'create', icon: '+', label: 'Create Poll' },
    { id: 'vote', icon: '○', label: 'Vote' },
    { id: 'manage', icon: '⚙', label: 'Manage' },
    { id: 'results', icon: '▣', label: 'Results' }
  ] as const;

  const handleItemClick = (itemId: string) => {
    onViewChange(itemId as 'create' | 'vote' | 'manage' | 'results');
  };

  if (isMobile) {
    // Bottom navigation for mobile
    return (
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-nav)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '16px 0',
        zIndex: 1000,
        borderTop: '1px solid var(--border-light)'
      }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              color: currentView === item.id ? 'var(--accent-primary)' : 'var(--text-lighter)',
              position: 'relative',
              minHeight: '60px',
              minWidth: '60px'
            }}
          >
            <span style={{ marginBottom: '2px' }}>{item.icon}</span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: currentView === item.id ? '600' : '400',
              color: currentView === item.id ? 'var(--accent-primary)' : 'var(--text-lighter)'
            }}>
              {item.label}
            </span>
            {currentView === item.id && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '4px',
                height: '4px',
                background: 'var(--accent-primary)',
                borderRadius: '50%'
              }} />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Sidebar for desktop
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: '60px',
      background: 'var(--bg-nav)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 0',
      zIndex: 1000,
      borderRight: '1px solid var(--border-light)'
    }}>
      {navItems.map((item) => (
        <div key={item.id} style={{ position: 'relative', marginBottom: '20px' }}>
          <button
            onClick={() => handleItemClick(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: currentView === item.id ? 'var(--bg-button)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: currentView === item.id ? 'var(--accent-primary)' : 'var(--text-lighter)'
            }}
          >
            {item.icon}
          </button>
          
          {/* Tooltip */}
          {hoveredItem === item.id && (
            <div style={{
              position: 'absolute',
              left: '50px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--accent-primary)',
              color: 'white',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              zIndex: 1001,
              borderRadius: '4px'
            }}>
              {item.label}
              <div style={{
                position: 'absolute',
                left: '-4px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                borderRight: '4px solid #333'
              }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SimplifiedNavigation;
