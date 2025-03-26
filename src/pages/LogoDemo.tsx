import React from 'react';
import { HireythLogo, HireythLogoFull } from '../components/HireythLogo';
import { HireythLogoAnimated, HireythFullLogoAnimated } from '../components/HireythLogoAnimated';
import { HireythLogoShowcase } from '../components/HireythLogoShowcase';
import BottomNav from '../components/BottomNav';

export default function LogoDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with logo */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <HireythFullLogoAnimated size="md" />
          
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium">
              Sign Up
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <section className="mb-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Hireyth Logo Design System
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              A complete set of logo options for the Hireyth travel social network app, featuring
              beautiful gradients and subtle animations.
            </p>
          </div>
          
          <HireythLogoShowcase />
        </section>
        
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Implementation Examples</h2>
          
          {/* Example cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Navbar example */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-medium text-gray-800 dark:text-white">Navbar</h3>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <HireythLogoFull size="sm" />
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-500"></div>
                  <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-500"></div>
                </div>
              </div>
            </div>
            
            {/* Mobile app example */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-medium text-gray-800 dark:text-white">Mobile App</h3>
              </div>
              <div className="w-40 mx-auto p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl h-72 flex flex-col">
                <div className="flex justify-center mb-auto pt-4">
                  <HireythLogoAnimated size="sm" />
                </div>
                <div className="bg-gray-200 dark:bg-gray-600 h-32 rounded-lg mb-3"></div>
                <div className="bg-gray-300 dark:bg-gray-500 h-6 rounded-lg mb-2"></div>
                <div className="bg-gray-300 dark:bg-gray-500 h-6 rounded-lg w-3/4"></div>
              </div>
            </div>
            
            {/* Branding example */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-medium text-gray-800 dark:text-white">Branding</h3>
              </div>
              <div className="flex items-center justify-center p-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <HireythFullLogoAnimated size="lg" />
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Bottom nav for mobile */}
      <div className="mt-20 pb-20">
        <BottomNav />
      </div>
    </div>
  );
} 