/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { Lens } from '@/registry/magicui/lens';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ZoomableCardProps {
  imageSrc: string;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  headerContent?: React.ReactNode;
  className?: string;
  imageClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  zoomFactor?: number;
  lensSize?: number;
  imageHeight?: string;
  onClick?: () => void;
}

const ZoomableCard: React.FC<ZoomableCardProps> = ({
  imageSrc,
  title,
  description,
  footer,
  headerContent,
  className,
  imageClassName,
  contentClassName,
  footerClassName,
  zoomFactor = 2,
  lensSize = 150,
  imageHeight = 'h-48',
  onClick,
}) => {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg", 
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="p-0">
        <div className="relative">
          <Lens
            zoomFactor={zoomFactor}
            lensSize={lensSize}
            isStatic={false}
            ariaLabel={`Zoom ${title} image`}
          >
            <img
              src={imageSrc}
              alt={title}
              className={cn(`w-full object-cover`, imageHeight, imageClassName)}
            />
          </Lens>
          
          {headerContent && (
            <div className="absolute inset-0 flex flex-col justify-end">
              {headerContent}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={cn("p-4", contentClassName)}>
        <CardTitle className="text-lg mb-2">{title}</CardTitle>
        {description && (
          <CardDescription className="line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardContent>
      
      {footer && (
        <CardFooter className={cn("p-4 pt-0", footerClassName)}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};

export default ZoomableCard; 