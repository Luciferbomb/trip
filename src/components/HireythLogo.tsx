import React, { useMemo } from 'react';
import { Compass, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg';
export type LogoVariant = 'default' | 'light';

interface HireythLogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  animate?: boolean;
  className?: string;
}

const sizeMap = {
  xs: {
    container: 'h-6 w-6',
    fontSize: 'text-xs',
    heading: 'text-sm',
    iconSize: 14,
    pinSize: 3.5
  },
  sm: {
    container: 'h-8 w-8',
    fontSize: 'text-sm',
    heading: 'text-base',
    iconSize: 16,
    pinSize: 4
  },
  md: {
    container: 'h-10 w-10',
    fontSize: 'text-base',
    heading: 'text-lg',
    iconSize: 20,
    pinSize: 5
  },
  lg: {
    container: 'h-12 w-12',
    fontSize: 'text-lg',
    heading: 'text-xl',
    iconSize: 24,
    pinSize: 6
  }
};

export function HireythLogo({ 
  size = 'md', 
  variant = 'default',
  animate = false,
  className 
}: HireythLogoProps) {
  // Generate a unique gradient ID for this instance
  const gradientId = useMemo(() => 
    `logo-gradient-${Math.random().toString(36).substring(2, 11)}`, 
    []
  );

  const { container, iconSize, pinSize } = sizeMap[size];
  
  const hoverClassName = animate 
    ? 'group hover:scale-105 transition-transform duration-300' 
    : '';

  return (
    <div className={cn(
      container, 
      "relative flex items-center justify-center rounded-full overflow-hidden shadow-md",
      hoverClassName,
      className
    )}>
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        variant === 'default' ? "from-purple-500 to-indigo-500" : "from-purple-400 to-indigo-400"
      )} />
      
      {/* Globe icon */}
      <Globe 
        size={iconSize} 
        className={cn(
          "text-white/90 absolute",
          animate && "group-hover:scale-110 transition-transform duration-300"
        )} 
      />
      
      {/* Compass icon (overlay) */}
      <Compass 
        size={iconSize * 0.75} 
        className={cn(
          "text-white absolute stroke-[2.5px]",
          animate && "group-hover:rotate-45 transition-transform duration-300"
        )}
      />
    </div>
  );
}

export function HireythLogoFull({ 
  size = 'md', 
  variant = 'default',
  animate = false,
  className 
}: HireythLogoProps) {
  const { heading } = sizeMap[size];
  
  return (
    <div className={cn(
      "flex items-center gap-2",
      className
    )}>
      <HireythLogo 
        size={size} 
        variant={variant} 
        animate={animate} 
      />
      <div className="flex flex-col">
        <span className={cn(
          heading,
          "font-semibold tracking-tight",
          variant === 'default' ? "text-gray-900 dark:text-white" : "text-white"
        )}>
          Hireyth
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Travel Social Network
        </span>
      </div>
    </div>
  );
}

// Usage example:
// <HireythLogo size="md" variant="default" />
// <HireythLogoFull size="lg" variant="light" /> 