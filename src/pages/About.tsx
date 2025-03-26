import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '../components/Header';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header is now managed globally in App.tsx */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">About Hireyth</h1>
        {/* Rest of the content */}
      </main>
    </div>
  );
};

export default About; 