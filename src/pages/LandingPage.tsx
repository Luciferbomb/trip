import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserRound, UsersRound, MapPin, Globe } from 'lucide-react';
import { scrollToTop } from '@/lib/navigation-utils';

const LandingPage = () => {
  // Scroll to top when landing page loads
  useEffect(() => {
    scrollToTop(false);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full opacity-20 filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500 rounded-full opacity-20 filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Logo and App Name */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center relative z-10">
        <div className="flex items-center mb-8">
          <Globe className="h-12 w-12 mr-3 text-white" />
          <h1 className="text-6xl font-bold text-white fade-in-up visible">
            Hireyth
          </h1>
        </div>
        
        <p className="text-xl text-white/90 max-w-md mb-12 fade-in-up visible" style={{ transitionDelay: '150ms' }}>
          Connect with travelers around the world and plan your next adventure together
        </p>
        
        {/* Main Offerings */}
        <div className="grid gap-6 mb-16 w-full max-w-sm fade-in-up visible" style={{ transitionDelay: '300ms' }}>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
              <UsersRound className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-white">
              <h3 className="font-medium text-lg">Find Travel Partners</h3>
              <p className="text-sm text-white/80">Connect with like-minded travelers</p>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-white">
              <h3 className="font-medium text-lg">Discover Trips</h3>
              <p className="text-sm text-white/80">Join existing adventures</p>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
              <UserRound className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-white">
              <h3 className="font-medium text-lg">Share Experiences</h3>
              <p className="text-sm text-white/80">Document your travel stories</p>
            </div>
          </div>
        </div>
        
        {/* Login Button */}
        <div className="mb-20 w-full max-w-xs mx-auto fade-in-up visible" style={{ transitionDelay: '450ms' }}>
          <Button 
            asChild 
            size="lg" 
            className="w-full bg-white text-blue-600 hover:bg-white/90 font-semibold text-lg shadow-lg hover:shadow-xl transition-all shadow-black/20"
          >
            <Link to="/login">
              Get Started
            </Link>
          </Button>
          
          <p className="text-white/80 text-sm mt-4">
            Already have an account? <Link to="/login" className="text-white hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
