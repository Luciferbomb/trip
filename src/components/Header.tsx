import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, LogOut, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { useAuth } from '../lib/auth-context';
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { supabase } from '../lib/supabase';
import { HireythLogoFull } from './HireythLogo';
import { motion } from 'framer-motion';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [online, setOnline] = useState(true);

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
    { name: 'Home', path: '/' },
    { name: 'Trips', path: '/trips' },
    { name: 'Create', path: '/create' },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300",
      isScrolled 
        ? "bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-lg" 
        : "bg-white"
    )}>
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link 
            to="/"
            className="hover:opacity-80 transition-opacity"
          >
            <HireythLogoFull size="sm" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "relative text-sm font-medium transition-colors py-1",
                  location.pathname === link.path
                    ? "text-purple-600 font-semibold"
                    : "text-gray-600 hover:text-purple-600"
                )}
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div 
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full"
                  onClick={() => navigate('/notifications')}
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-full"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white rounded-full px-5 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Sign Up
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-lg">
          <nav className="container mx-auto px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "block py-3 font-medium rounded-xl transition-all px-4",
                  location.pathname === link.path
                    ? "text-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-purple-600 hover:bg-purple-50/50"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            
            {user ? (
              <Button
                variant="outline"
                className="w-full mt-4 border-red-200 text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/signup')}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white rounded-xl shadow-md"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
