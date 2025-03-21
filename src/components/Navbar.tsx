import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search as SearchIcon, PlusCircle, User, Map } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-md z-50 md:hidden">
      <div className="max-w-md mx-auto px-2">
        <div className="flex justify-around items-center h-16">
          <Link 
            to="/" 
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              location.pathname === '/' 
                ? 'text-hireyth-main bg-hireyth-lightest-blue' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>
          
          <Link 
            to="/trips" 
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              location.pathname === '/trips' 
                ? 'text-hireyth-main bg-hireyth-lightest-blue' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Trips</span>
          </Link>
          
          <Link 
            to="/create" 
            className="flex flex-col items-center justify-center p-1"
          >
            <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-hireyth-main to-hireyth-light-orange text-white shadow-lg -mt-6`}>
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-xs mt-1 font-medium text-gray-700">Create</span>
          </Link>
          
          <Link 
            to="/profile" 
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              location.pathname === '/profile' 
                ? 'text-hireyth-main bg-hireyth-lightest-blue' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 