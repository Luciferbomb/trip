import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Map, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type IconVariant = 'default' | 'light';

const sizeMap = {
  xs: {
    container: 'h-8 w-8',
    iconSize: 16,
    compassSize: 5,
  },
  sm: {
    container: 'h-10 w-10',
    iconSize: 20,
    compassSize: 6,
  },
  md: {
    container: 'h-12 w-12',
    iconSize: 24,
    compassSize: 7,
  },
  lg: {
    container: 'h-16 w-16',
    iconSize: 32,
    compassSize: 9,
  },
  xl: {
    container: 'h-20 w-20',
    iconSize: 40,
    compassSize: 10,
  },
};

interface TripAnimatedIconProps {
  size?: IconSize;
  variant?: IconVariant;
  animated?: boolean;
  isActive?: boolean;
  className?: string;
}

const TripAnimatedIcon = ({
  size = 'md',
  variant = 'default',
  animated = false,
  isActive = false,
  className,
}: TripAnimatedIconProps) => {
  // Generate a unique gradient ID for this instance
  const gradientId = useMemo(() => 
    `trip-animated-gradient-${Math.random().toString(36).substring(2, 11)}`,
    []
  );

  const { container, iconSize, compassSize } = sizeMap[size];
  
  return (
    <motion.div
      className={cn(
        container,
        "relative flex items-center justify-center rounded-full",
        className
      )}
      whileHover={animated ? { scale: 1.05 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Background with gradient */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full",
          variant === 'default' 
            ? "bg-gradient-to-br from-purple-500 to-indigo-600" 
            : "bg-gradient-to-br from-purple-400 to-indigo-500"
        )}
      />
      
      {/* Glow effect when active */}
      {isActive && (
        <motion.div 
          className="absolute -inset-1 bg-purple-500/20 rounded-full blur-md"
          animate={{ opacity: [0.2, 0.3, 0.2] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}

      {/* Map icon with scaling animation */}
      <motion.div
        className="relative"
        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Map 
          size={iconSize} 
          className="text-white" 
          strokeWidth={2.5}
        />
        
        {/* Compass overlay */}
        <motion.div 
          className="absolute -top-1 right-0"
          animate={isActive ? { rotate: [0, 15, 0, -15, 0] } : {}}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <Compass 
            size={compassSize} 
            className="text-white" 
            strokeWidth={3}
          />
        </motion.div>
      </motion.div>
      
      {/* Sparkle effect */}
      {isActive && (
        <>
          <motion.div 
            className="absolute h-1 w-1 rounded-full bg-white"
            style={{ top: '15%', right: '25%' }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
          />
          <motion.div 
            className="absolute h-1 w-1 rounded-full bg-white"
            style={{ bottom: '25%', left: '15%' }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.7 }}
          />
        </>
      )}
    </motion.div>
  );
};

export default TripAnimatedIcon; 