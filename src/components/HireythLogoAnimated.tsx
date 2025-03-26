import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Compass, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LogoVariant = 'default' | 'light';

interface HireythLogoAnimatedProps {
  size?: LogoSize;
  variant?: LogoVariant;
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  xs: {
    container: 'h-7 w-7',
    fontSize: 'text-xs',
    heading: 'text-sm',
    iconSize: 14,
    pinSize: 4
  },
  sm: {
    container: 'h-9 w-9',
    fontSize: 'text-sm',
    heading: 'text-base',
    iconSize: 18,
    pinSize: 5
  },
  md: {
    container: 'h-12 w-12',
    fontSize: 'text-base',
    heading: 'text-lg',
    iconSize: 24,
    pinSize: 6
  },
  lg: {
    container: 'h-16 w-16',
    fontSize: 'text-lg',
    heading: 'text-xl',
    iconSize: 32,
    pinSize: 8
  },
  xl: {
    container: 'h-20 w-20',
    fontSize: 'text-xl',
    heading: 'text-2xl',
    iconSize: 40,
    pinSize: 10
  }
};

export function HireythLogoAnimated({ 
  size = 'md', 
  variant = 'default',
  animated = true,
  className 
}: HireythLogoAnimatedProps) {
  // Generate a unique gradient ID for this instance
  const gradientId = useMemo(() => 
    `logo-animated-gradient-${Math.random().toString(36).substring(2, 11)}`, 
    []
  );

  const { container, iconSize } = sizeMap[size];

  return (
    <motion.div 
      className={cn(
        container, 
        "relative flex items-center justify-center rounded-full overflow-hidden shadow-lg",
        className
      )}
      initial={{ scale: 1 }}
      animate={animated ? { 
        scale: [1, 1.02, 1],
      } : {}}
      transition={{
        repeat: animated ? Infinity : 0,
        duration: 3,
        ease: "easeInOut"
      }}
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        variant === 'default' ? "from-purple-500 to-indigo-500" : "from-purple-400 to-indigo-400"
      )} />
      
      {/* Subtle animated glow */}
      <motion.div
        className="absolute inset-0 bg-white/10 rounded-full"
        animate={animated ? { 
          opacity: [0, 0.2, 0], 
          scale: [0.8, 1.1, 0.8]
        } : {}}
        transition={{ 
          repeat: animated ? Infinity : 0, 
          duration: 3, 
          ease: "easeInOut" 
        }}
      />
      
      {/* Globe icon with animation */}
      <motion.div className="absolute">
        <motion.div
          animate={animated ? { scale: [1, 1.1, 1] } : {}}
          transition={{ 
            repeat: animated ? Infinity : 0, 
            duration: 3, 
            ease: "easeInOut" 
          }}
        >
          <Globe 
            size={iconSize} 
            className="text-white/90" 
          />
        </motion.div>
      </motion.div>
      
      {/* Compass icon (overlay) with rotation animation */}
      <motion.div className="absolute">
        <motion.div
          animate={animated ? { 
            rotate: [0, 15, 0, -15, 0],
            scale: [1, 1.05, 1],
          } : {}}
          transition={{ 
            repeat: animated ? Infinity : 0, 
            duration: 5,
            ease: "easeInOut" 
          }}
        >
          <Compass 
            size={iconSize * 0.75} 
            className="text-white stroke-[2.5px]" 
          />
        </motion.div>
      </motion.div>
      
      {/* Sparkle effects */}
      {animated && (
        <>
          <motion.div 
            className="absolute w-1.5 h-1.5 rounded-full bg-white/80"
            initial={{ x: -10, y: -10, opacity: 0 }}
            animate={{ 
              x: [-10, -5], 
              y: [-10, -5], 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              delay: 0.5,
              repeatDelay: 2
            }}
          />
          <motion.div 
            className="absolute w-1.5 h-1.5 rounded-full bg-white/80"
            initial={{ x: 10, y: 10, opacity: 0 }}
            animate={{ 
              x: [10, 5], 
              y: [10, 5], 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              delay: 1.5,
              repeatDelay: 2
            }}
          />
        </>
      )}
    </motion.div>
  );
}

// Animated particles that float around the logo
function AnimatedParticles({ count, size }: { count: number, size: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full bg-white opacity-70"
          style={{
            width: size === 'sm' ? 2 : size === 'md' ? 3 : 4,
            height: size === 'sm' ? 2 : size === 'md' ? 3 : 4,
          }}
          initial={{ 
            x: 0, 
            y: 0, 
            opacity: 0 
          }}
          animate={{
            x: [0, (Math.random() * 20 - 10) * (index % 2 ? 1 : -1)],
            y: [0, (Math.random() * 20 - 10) * (index % 3 ? 1 : -1)],
            opacity: [0, 0.7, 0]
          }}
          transition={{
            duration: 1.5 + Math.random(),
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </>
  );
}

export function HireythFullLogoAnimated({
  size = 'md',
  variant = 'default',
  animated = true,
  className = '',
}: HireythLogoAnimatedProps) {
  const dimensions = sizeMap[size];
  
  // Generate unique gradient IDs
  const textGradientId = useMemo(() => 
    `hireyth-text-gradient-${Math.random().toString(36).substring(2, 11)}`, 
    []
  );
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <HireythLogoAnimated size={size} variant={variant} animated={animated} />
      <div className="flex flex-col">
        {/* Logo text with gradient */}
        <svg width="100" height="30" viewBox="0 0 100 30" className={dimensions.heading}>
          <defs>
            <linearGradient id={textGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" /> {/* Purple */}
              <stop offset="100%" stopColor="#3B82F6" /> {/* Blue */}
            </linearGradient>
          </defs>
          <text 
            x="0" 
            y="20" 
            fill={`url(#${textGradientId})`} 
            className="font-bold"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            Hireyth
          </text>
        </svg>
        
        <motion.span 
          className={`${dimensions.fontSize} text-gray-500 dark:text-gray-400`}
          initial={{ opacity: 0.7 }}
          animate={animated ? { opacity: [0.7, 0.9, 0.7] } : {}}
          transition={{ duration: 2, repeat: animated ? Infinity : 0 }}
        >
          Travel Social Network
        </motion.span>
      </div>
    </div>
  );
}

// Usage example:
// <HireythLogoAnimated size="md" />
// <HireythFullLogoAnimated size="lg" /> 