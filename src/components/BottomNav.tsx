import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, User } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();

  // Hide bottom nav on form pages
  const hideOnPaths = ['/create'];
  if (hideOnPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 print:hidden">
      <div className="max-w-md mx-auto px-2 pb-2">
        <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-lg mx-2 mb-2">
          <div className="grid grid-cols-3 w-full relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-10">
              <Link to="/create" className="flex flex-col items-center group">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white shadow-lg group-hover:scale-105 transition-all duration-200">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <span className="text-xs text-center mt-1 font-medium text-gray-700">Create</span>
              </Link>
            </div>
            
            <Link 
              to="/" 
              className={`flex flex-col items-center justify-center py-4 rounded-lg transition-all duration-200 group ${
                location.pathname === '/' 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/' 
                  ? 'bg-blue-50' 
                  : 'group-hover:bg-gray-100'
              }`}>
                <Home className="w-5 h-5" />
              </div>
              <span className="text-xs mt-1 font-medium">Explore</span>
            </Link>
            
            <div className="flex items-center justify-center h-16">
              <div className="invisible">
                <PlusCircle className="w-5 h-5" />
                <span className="text-xs mt-1 font-medium">Create</span>
              </div>
            </div>
            
            <Link 
              to="/profile" 
              className={`flex flex-col items-center justify-center py-4 rounded-lg transition-all duration-200 group ${
                location.pathname === '/profile' 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/profile' 
                  ? 'bg-blue-50' 
                  : 'group-hover:bg-gray-100'
              }`}>
                <User className="w-5 h-5" />
              </div>
              <span className="text-xs mt-1 font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
