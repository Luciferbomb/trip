import React, { useMemo } from 'react';

interface InlineVerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

export const InlineVerifiedBadge = ({ size = 'md' }: InlineVerifiedBadgeProps) => {
  // Generate a random ID for the gradient to avoid conflicts with multiple instances
  const gradientId = useMemo(() => `badge-gradient-${Math.random().toString(36).substr(2, 9)}`, []);
  
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <div className="relative inline-block">
      {/* Add a subtle glow effect */}
      <div className="absolute inset-0 rounded-full bg-purple-500 blur-sm opacity-30"></div>
      <svg 
        className={`${sizeMap[size]} relative z-10`} 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 512 512"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#cc00ff" }} />
            <stop offset="100%" style={{ stopColor: "#9900ff" }} />
          </linearGradient>
        </defs>
        <path 
          fill={`url(#${gradientId})`} 
          d="M512 256c0 36.9-7.7 72.3-22.9 104.8-15.2 32.5-37 61.4-64.3 85.8-27.3 24.3-59.1 43.4-94.1 56-35 12.7-72 19.1-109.1 19.1s-74.1-6.4-109.1-19.1c-35-12.7-66.8-31.7-94.1-56-27.3-24.3-49.1-53.2-64.3-85.8C-7.7 328.3 0 292.9 0 256c0-36.9 7.7-72.3 22.9-104.8 15.2-32.5 37-61.4 64.3-85.8 27.3-24.3 59.1-43.4 94.1-56C216.3 6.7 253.3 0 290.4 0s74.1 6.4 109.1 19.1c35 12.7 66.8 31.7 94.1 56 27.3 24.3 49.1 53.2 64.3 85.8C504.3 183.7 512 219.1 512 256z"
        />
        <path 
          fill="white" 
          d="M382.6 215.4L208 390l-78.6-78.6c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l101.3 101.3c12.5 12.5 32.8 12.5 45.3 0l197.3-197.3c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0z"
        />
      </svg>
    </div>
  );
};

export default InlineVerifiedBadge; 