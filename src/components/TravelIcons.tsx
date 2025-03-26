import React, { useMemo } from 'react';

export interface IconProps {
  size?: number;
  className?: string;
  color?: string;
  isActive?: boolean;
}

export function TripIcon({ size = 20, className = "", color = "currentColor", isActive = false }: IconProps) {
  // Generate a unique gradient ID for this instance
  const gradientId = useMemo(() => 
    `trip-gradient-${Math.random().toString(36).substring(2, 11)}`, 
    []
  );

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#8B5CF6" /> {/* Purple */}
          <stop offset="100%" stopColor="#6366F1" /> {/* Indigo */}
        </linearGradient>
      </defs>
      
      <path 
        d="M4 19h16" 
        stroke={isActive ? `url(#${gradientId})` : color} 
        strokeWidth={isActive ? "2.5" : "2"}
      />
      <path 
        d="M4 14h12" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"} 
      />
      <path 
        d="M9 3v2.5a2.5 2.5 0 002.5 2.5h1A2.5 2.5 0 0015 5.5V3" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"}  
      />
      <path 
        d="M10 3h4" 
        stroke={isActive ? `url(#${gradientId})` : color} 
        strokeWidth={isActive ? "2.5" : "2"} 
      />
      <rect 
        x="2" y="9" width="20" height="10" rx="2" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"}  
      />
      <path 
        d="M10 14v3" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"}  
      />
      <path 
        d="M14 14v3" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"}  
      />
      
      {/* Add a subtle glow effect when active */}
      {isActive && (
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          fill="url(#${gradientId})" 
          opacity="0.1"
        />
      )}
    </svg>
  );
}

export function ProfileTravelIcon({ size = 20, className = "", color = "currentColor", isActive = false }: IconProps) {
  // Generate a unique gradient ID for this instance
  const gradientId = useMemo(() => 
    `profile-gradient-${Math.random().toString(36).substring(2, 11)}`, 
    []
  );

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#8B5CF6" /> {/* Purple */}
          <stop offset="100%" stopColor="#6366F1" /> {/* Indigo */}
        </linearGradient>
      </defs>
      
      <circle 
        cx="12" 
        cy="8" 
        r="5" 
        stroke={isActive ? `url(#${gradientId})` : color} 
        strokeWidth={isActive ? "2.5" : "2"}
      />
      <path 
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"} 
      />
      <path 
        d="M16 21h-3.5" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"} 
      />
      <path 
        d="M18 16l-2 4" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"} 
      />
      <path 
        d="M19.5 17.5l-1.5 1.5 1.5 1.5" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"} 
      />
      
      {/* Add a subtle glow effect when active */}
      {isActive && (
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          fill="url(#${gradientId})" 
          opacity="0.1"
        />
      )}
    </svg>
  );
}

export function ExploreIcon({ size = 20, className = "", color = "currentColor", isActive = false }: IconProps) {
  // Generate a unique gradient ID for this instance
  const gradientId = useMemo(() => 
    `explore-gradient-${Math.random().toString(36).substring(2, 11)}`, 
    []
  );

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#8B5CF6" /> {/* Purple */}
          <stop offset="100%" stopColor="#6366F1" /> {/* Indigo */}
        </linearGradient>
      </defs>
      
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"} 
      />
      <path 
        d="M8 12L10 9L15 14L16 12" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"} 
      />
      <path 
        d="M12 2V4" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"} 
      />
      <path 
        d="M12 20V22" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"} 
      />
      <path 
        d="M4 12H2" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"} 
      />
      <path 
        d="M22 12H20" 
        stroke={isActive ? `url(#${gradientId})` : color}
        strokeWidth={isActive ? "2.5" : "2"} 
      />
      
      {/* Add a subtle glow effect when active */}
      {isActive && (
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          fill="url(#${gradientId})" 
          opacity="0.1"
        />
      )}
    </svg>
  );
} 