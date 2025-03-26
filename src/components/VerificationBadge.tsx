import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerificationBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  reason?: string;
  withTooltip?: boolean;
}

export const VerificationBadge = ({
  size = 'md',
  className,
  reason = 'Verified Account',
  withTooltip = true
}: VerificationBadgeProps) => {
  const [imageError, setImageError] = useState(false);
  
  const sizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6'
  };

  // Fallback badge using inline SVG
  const fallbackBadge = (
    <span 
      className={cn(
        sizes[size],
        'rounded-full bg-purple-600 flex items-center justify-center',
        className
      )}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        width="70%" 
        height="70%" 
        fill="none" 
        stroke="white" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </span>
  );

  const badge = imageError ? fallbackBadge : (
    <img 
      src="/verification-badge.svg" 
      alt="Verified"
      className={cn(
        sizes[size],
        'flex-shrink-0',
        className
      )}
      onError={() => {
        console.log('Verification badge image failed to load');
        setImageError(true);
      }}
    />
  );

  if (!withTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span>{badge}</span>
        </TooltipTrigger>
        <TooltipContent className="bg-purple-600 text-white text-xs">
          <p>{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerificationBadge; 