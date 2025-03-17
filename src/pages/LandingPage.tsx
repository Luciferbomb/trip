
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserRound, UsersRound, MapPin } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-hireyth-main">
      {/* Logo and App Name */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-['Dancing_Script'] text-6xl font-bold text-white mb-12">
          Hireyth
        </h1>
        
        {/* Main Offerings */}
        <div className="grid gap-6 mb-16 w-full max-w-xs">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-4">
              <UsersRound className="w-5 h-5 text-hireyth-main" />
            </div>
            <div className="text-white">
              <h3 className="font-medium text-lg">Find Travel Partners</h3>
              <p className="text-sm text-white/80">Connect with like-minded travelers</p>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-4">
              <MapPin className="w-5 h-5 text-hireyth-main" />
            </div>
            <div className="text-white">
              <h3 className="font-medium text-lg">Discover Trips</h3>
              <p className="text-sm text-white/80">Join existing adventures</p>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex items-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-4">
              <UserRound className="w-5 h-5 text-hireyth-main" />
            </div>
            <div className="text-white">
              <h3 className="font-medium text-lg">Share Experiences</h3>
              <p className="text-sm text-white/80">Document your travel stories</p>
            </div>
          </div>
        </div>
        
        {/* Login Button */}
        <div className="mb-20 w-full max-w-xs mx-auto">
          <Button 
            asChild 
            size="lg" 
            className="w-full bg-white text-hireyth-main hover:bg-white/90 font-semibold text-lg shadow-lg hover:shadow-xl transition-all shadow-black/20"
          >
            <Link to="/login">
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
