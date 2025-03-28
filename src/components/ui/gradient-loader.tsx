import React from 'react';
import { cn } from '@/lib/utils';
import { Compass, Loader2, Plane } from 'lucide-react';

interface GradientLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  icon?: 'compass' | 'spinner' | 'plane';
  className?: string;
  iconClassName?: string;
}

export const GradientLoader = ({
  size = 'md',
  icon = 'spinner',
  className,
  iconClassName
}: GradientLoaderProps) => {
  const sizeClasses = {
    sm: {
      container: 'h-8 w-8',
      icon: 'h-4 w-4',
      border: 'border-2'
    },
    md: {
      container: 'h-12 w-12',
      icon: 'h-6 w-6',
      border: 'border-2'
    },
    lg: {
      container: 'h-32 w-32',
      icon: 'h-16 w-16',
      border: 'border-4'
    }
  };

  const IconComponent = icon === 'compass' ? Compass : icon === 'plane' ? Plane : Loader2;
  const animation = icon === 'compass' || icon === 'plane' ? 'animate-[spin_3s_linear_infinite]' : 'animate-spin';

  return (
    <div className={cn('relative', className)}>
      <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full blur-sm opacity-70"></div>
      <div className={cn(
        sizeClasses[size].container,
        sizeClasses[size].border,
        'rounded-full border-white relative bg-white flex items-center justify-center'
      )}>
        <div className={animation}>
          <IconComponent className={cn('text-purple-500', sizeClasses[size].icon, iconClassName)} />
        </div>
      </div>
    </div>
  );
}; 