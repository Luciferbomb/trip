import React from 'react';
import { Search, ChevronRight, Globe, Compass, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();
  
  return (
    <div className="relative bg-gradient-to-b from-hireyth-lightest-blue to-white py-20 md:py-32 overflow-hidden">
      {/* Background gradient circles */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-100 rounded-full opacity-50 blur-3xl"></div>
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-indigo-100 rounded-full opacity-50 blur-3xl"></div>
      
      <div className="container mx-auto px-4 z-10 relative">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 md:pr-12 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Find Travel <span className="text-hireyth-main">Companions</span> for Your Next Adventure
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              Connect with like-minded travelers, join exciting trips, and share unforgettable experiences around the world.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                size="lg" 
                variant="primary"
                onClick={() => navigate('/trips')}
                className="w-full sm:w-auto"
              >
                Explore Trips
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/create')}
                className="w-full sm:w-auto"
              >
                Create a Trip
              </Button>
            </div>
            
            <div className="relative max-w-md">
              <Input 
                placeholder="Search destinations, trips, or people..." 
                className="pl-10 pr-4 py-3 h-12 rounded-full border border-gray-300 shadow-sm w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>
          
          <div className="w-full md:w-1/2 relative">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                alt="Travel group enjoying view of mountains" 
                className="rounded-xl shadow-xl w-full object-cover"
                style={{ maxHeight: '550px' }}
              />
              
              {/* Stats cards */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg hidden md:flex items-center space-x-3">
                <div className="bg-hireyth-lightest-blue p-2 rounded-full">
                  <Globe className="text-hireyth-main h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active in</p>
                  <p className="font-bold text-gray-900">25+ Countries</p>
                </div>
              </div>
              
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-lg shadow-lg hidden md:flex items-center space-x-3">
                <div className="bg-hireyth-lightest-blue p-2 rounded-full">
                  <Users className="text-hireyth-main h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Community of</p>
                  <p className="font-bold text-gray-900">10k+ Travelers</p>
                </div>
              </div>
              
              <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg hidden lg:flex items-center space-x-3">
                <div className="bg-hireyth-lightest-blue p-2 rounded-full">
                  <Compass className="text-hireyth-main h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="font-bold text-gray-900">500+ Trips</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
