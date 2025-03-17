import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search as SearchIcon, PlusCircle, User, Map } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around py-2">
          <Link 
            to="/" 
            className={`flex flex-col items-center p-2 ${
              location.pathname === '/' ? 'text-hireyth-main' : 'text-gray-500'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link 
            to="/trips" 
            className={`flex flex-col items-center p-2 ${
              location.pathname === '/trips' ? 'text-hireyth-main' : 'text-gray-500'
            }`}
          >
            <Map className="w-6 h-6" />
            <span className="text-xs mt-1">Trips</span>
          </Link>
          
          <Link 
            to="/create" 
            className={`flex flex-col items-center p-2 ${
              location.pathname === '/create' ? 'text-hireyth-main' : 'text-gray-500'
            }`}
          >
            <PlusCircle className="w-6 h-6" />
            <span className="text-xs mt-1">Create</span>
          </Link>
          
          <Link 
            to="/search" 
            className={`flex flex-col items-center p-2 ${
              location.pathname === '/search' ? 'text-hireyth-main' : 'text-gray-500'
            }`}
          >
            <SearchIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Search</span>
          </Link>
          
          <Link 
            to="/profile" 
            className={`flex flex-col items-center p-2 ${
              location.pathname === '/profile' ? 'text-hireyth-main' : 'text-gray-500'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 