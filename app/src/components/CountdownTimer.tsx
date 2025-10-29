import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiryDate: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiryDate }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Quick check if already expired
    const now = Date.now();
    if (now >= expiryDate) {
      setIsExpired(true);
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = expiryDate - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        return null;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    const update = () => {
      const newTimeLeft = calculateTimeLeft();
      if (newTimeLeft) {
        setTimeLeft(newTimeLeft);
      }
    };

    // Initial update
    update();
    
    // Set up interval only if not expired
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [expiryDate]);

  if (isExpired) {
    return (
      <span style={{ fontSize: '12px', color: 'var(--accent-secondary)', fontWeight: '500' }}>
        Expired
      </span>
    );
  }

  if (!timeLeft) {
    return null;
  }

  const { days, hours, minutes, seconds } = timeLeft;

  // Optimized display: only show relevant units
  let displayText = '';
  if (days > 0) {
    displayText = `${days}d ${hours}h`;
  } else if (hours > 0) {
    displayText = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    displayText = `${minutes}m ${seconds}s`;
  } else {
    displayText = `${seconds}s`;
  }

  return (
    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
      {displayText} left
    </span>
  );
};

export default CountdownTimer;

