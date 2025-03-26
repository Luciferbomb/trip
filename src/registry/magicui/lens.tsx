import * as React from "react";
import { cn } from "@/lib/utils";

interface LensProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  zoomFactor?: number;
  lensSize?: number;
  isStatic?: boolean;
  ariaLabel?: string;
}

export function Lens({
  children,
  className,
  zoomFactor = 2,
  lensSize = 150,
  isStatic = false,
  ariaLabel = "Zoom Area",
  ...props
}: LensProps) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [lensPosition, setLensPosition] = React.useState({ x: 0, y: 0 });
  const [showLens, setShowLens] = React.useState(isStatic);
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Calculate the position of the zoomed content
  const calculateZoomPosition = (mouseX: number, mouseY: number) => {
    if (!containerRef.current) return;

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate the relative position in the image
    const relativeX = (mouseX - left) / width;
    const relativeY = (mouseY - top + scrollTop - scrollPosition) / height;
    
    // Set the positions within bounds
    const lensX = Math.max(0, Math.min(mouseX - left - lensSize / 2, width - lensSize));
    const lensY = Math.max(0, Math.min(mouseY - top + scrollTop - scrollPosition - lensSize / 2, height - lensSize));
    
    setPosition({ x: relativeX, y: relativeY });
    setLensPosition({ x: lensX, y: lensY });
  };

  // Track scroll position to adjust calculations
  React.useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.pageYOffset || document.documentElement.scrollTop);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mouse event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isStatic) return;
    calculateZoomPosition(e.clientX, e.clientY);
  };

  const handleMouseEnter = () => {
    if (isStatic) return;
    setShowLens(true);
  };

  const handleMouseLeave = () => {
    if (isStatic) return;
    setShowLens(false);
  };

  // Touch event handlers for mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isStatic) return;
    const touch = e.touches[0];
    calculateZoomPosition(touch.clientX, touch.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isStatic) return;
    setShowLens(true);
    const touch = e.touches[0];
    calculateZoomPosition(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    if (isStatic) return;
    setShowLens(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden cursor-zoom-in", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label={ariaLabel}
      role="presentation"
      {...props}
    >
      {children}
      
      {showLens && (
        <>
          {/* Lens outline */}
          <div
            className="absolute border-2 border-white rounded-full pointer-events-none shadow-lg"
            style={{
              width: `${lensSize}px`,
              height: `${lensSize}px`,
              top: `${lensPosition.y}px`,
              left: `${lensPosition.x}px`,
              zIndex: 20,
            }}
          />
          
          {/* Zoomed content */}
          <div
            className="absolute rounded-full overflow-hidden pointer-events-none"
            style={{
              width: `${lensSize}px`,
              height: `${lensSize}px`,
              top: `${lensPosition.y}px`,
              left: `${lensPosition.x}px`,
              zIndex: 10,
            }}
          >
            <div
              ref={contentRef}
              className="absolute"
              style={{
                transformOrigin: "0 0",
                transform: `scale(${zoomFactor})`,
                width: containerRef.current?.offsetWidth,
                height: containerRef.current?.offsetHeight,
                top: `-${position.y * 100 * zoomFactor}%`,
                left: `-${position.x * 100 * zoomFactor}%`,
              }}
            >
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 