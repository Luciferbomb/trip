import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Hireyth</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
              Home
            </Link>
            <Link to="/trips" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/trips' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
              Trips
            </Link>
            <Link to="/create" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/create' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
              Create Trip
            </Link>
            <Link to="/profile" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/profile' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
              Profile
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-500 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
              Home
            </Link>
            <Link to="/trips" className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/trips' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
              Trips
            </Link>
            <Link to="/create" className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/create' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
              Create Trip
            </Link>
            <Link to="/profile" className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/profile' ? 'bg-blue-700' : 'hover:bg-blue-500'}`}>
              Profile
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 