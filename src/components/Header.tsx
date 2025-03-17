
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, MapPin, Image, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Find Trips', path: '/trips', icon: <MapPin className="w-4 h-4" /> },
    { name: 'Experiences', path: '/experiences', icon: <Image className="w-4 h-4" /> },
    { name: 'Profile', path: '/profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-apple py-4 backdrop-blur-md",
        isScrolled 
          ? "bg-white/90 shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="relative z-10 flex items-center space-x-2">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-hireyth-blue to-hireyth-orange opacity-30 rounded-full blur-sm"></div>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center relative">
                <span className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-hireyth-blue to-hireyth-orange">H</span>
              </div>
            </div>
            <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-hireyth-blue to-hireyth-orange">Hireyth</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-all py-2 px-1",
                  location.pathname === link.path
                    ? "text-hireyth-blue"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Login Button - Desktop */}
          <div className="hidden md:block">
            <Button className="bg-gradient-to-r from-hireyth-blue to-hireyth-light-blue hover:from-hireyth-blue/90 hover:to-hireyth-light-blue/90 text-white">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden relative z-10 p-2 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>

          {/* Mobile Menu */}
          <div
            className={cn(
              "fixed inset-0 bg-white/95 backdrop-blur-md z-0 transition-all duration-500 md:hidden overflow-hidden flex flex-col",
              isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
            )}
          >
            <div className="container h-full flex flex-col items-center justify-center space-y-8 pt-20">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "flex items-center justify-center gap-2 text-lg font-medium py-3 px-4 w-64 rounded-xl transition-all",
                    location.pathname === link.path
                      ? "bg-hireyth-lightest-blue text-hireyth-blue"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              
              <Button className="bg-gradient-to-r from-hireyth-blue to-hireyth-light-blue hover:from-hireyth-blue/90 hover:to-hireyth-light-blue/90 text-white w-64 mt-4">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
