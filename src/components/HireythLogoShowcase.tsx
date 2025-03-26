import React from 'react';
import { HireythLogo, HireythLogoFull } from './HireythLogo';
import { HireythLogoAnimated, HireythFullLogoAnimated } from './HireythLogoAnimated';

export function HireythLogoShowcase() {
  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Hireyth Logo Options</h2>
      
      <div className="space-y-10">
        {/* Basic logos */}
        <div>
          <h3 className="text-xl font-medium mb-4 text-gray-700 dark:text-gray-300">Basic Logos</h3>
          
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col items-center">
              <HireythLogo size="sm" />
              <span className="mt-2 text-sm text-gray-500">Small</span>
            </div>
            
            <div className="flex flex-col items-center">
              <HireythLogo size="md" />
              <span className="mt-2 text-sm text-gray-500">Medium</span>
            </div>
            
            <div className="flex flex-col items-center">
              <HireythLogo size="lg" />
              <span className="mt-2 text-sm text-gray-500">Large</span>
            </div>
            
            <div className="flex flex-col items-center">
              <HireythLogo size="md" variant="light" />
              <span className="mt-2 text-sm text-gray-500">Light Variant</span>
            </div>
          </div>
        </div>
        
        {/* Full logos */}
        <div>
          <h3 className="text-xl font-medium mb-4 text-gray-700 dark:text-gray-300">Full Logos with Text</h3>
          
          <div className="flex flex-col gap-6">
            <HireythLogoFull size="sm" />
            <HireythLogoFull size="md" />
            <HireythLogoFull size="lg" />
          </div>
        </div>
        
        {/* Enhanced animated logos */}
        <div>
          <h3 className="text-xl font-medium mb-4 text-gray-700 dark:text-gray-300">Enhanced Animated Logos</h3>
          
          <div className="flex flex-wrap gap-10">
            <div className="flex flex-col items-center">
              <HireythLogoAnimated size="sm" />
              <span className="mt-2 text-sm text-gray-500">Small</span>
            </div>
            
            <div className="flex flex-col items-center">
              <HireythLogoAnimated size="md" />
              <span className="mt-2 text-sm text-gray-500">Medium</span>
            </div>
            
            <div className="flex flex-col items-center">
              <HireythLogoAnimated size="lg" />
              <span className="mt-2 text-sm text-gray-500">Large</span>
            </div>
            
            <div className="flex flex-col items-center">
              <HireythLogoAnimated size="xl" />
              <span className="mt-2 text-sm text-gray-500">Extra Large</span>
            </div>
          </div>
        </div>
        
        {/* Full enhanced animated logos */}
        <div>
          <h3 className="text-xl font-medium mb-4 text-gray-700 dark:text-gray-300">Full Enhanced Logos</h3>
          
          <div className="flex flex-col gap-8">
            <HireythFullLogoAnimated size="sm" />
            <HireythFullLogoAnimated size="md" />
            <HireythFullLogoAnimated size="lg" />
            <HireythFullLogoAnimated size="xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Usage example:
// <HireythLogoShowcase /> 