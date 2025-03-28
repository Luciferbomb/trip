import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HireythLogo } from './HireythLogo';

export function GenerateFavicon() {
  useEffect(() => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;

    // Render the logo to the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a temporary div to render the logo
    const div = document.createElement('div');
    div.style.width = '32px';
    div.style.height = '32px';
    document.body.appendChild(div);

    // Render the logo component to the div
    const root = createRoot(div);
    root.render(
      <HireythLogo size="xs" variant="default" className="!w-8 !h-8" />
    );

    // Wait for the logo to render
    setTimeout(() => {
      // Convert the rendered logo to a data URL
      const svgElement = div.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 32, 32);
          const faviconUrl = canvas.toDataURL('image/png');
          
          // Create or update favicon link
          let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = faviconUrl;
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }

      // Clean up
      document.body.removeChild(div);
      root.unmount();
    }, 100);
  }, []);

  return null;
} 