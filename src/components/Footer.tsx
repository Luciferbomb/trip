import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  Github, 
  Facebook, 
  Twitter, 
  Instagram, 
  Mail, 
  MapPin, 
  Phone
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-5">
              <Globe className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-blue-600">Hireyth</span>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              Connecting travelers around the world for unforgettable adventures and authentic experiences.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                aria-label="Github"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-gray-900">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/explore" className="text-gray-600 hover:text-blue-600 transition-colors">Explore</Link>
              </li>
              <li>
                <Link to="/trips" className="text-gray-600 hover:text-blue-600 transition-colors">Trips</Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors">Sign In</Link>
              </li>
              <li>
                <Link to="/signup" className="text-gray-600 hover:text-blue-600 transition-colors">Create Account</Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-gray-900">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Help Center</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Safety Tips</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Community Guidelines</a>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-gray-900">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <span className="text-gray-600">
                  123 Travel Avenue, <br />
                  San Francisco, CA 94158
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-blue-600 mr-3" />
                <a href="tel:+1234567890" className="text-gray-600 hover:text-blue-600 transition-colors">
                  (123) 456-7890
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-blue-600 mr-3" />
                <a href="mailto:info@hireyth.com" className="text-gray-600 hover:text-blue-600 transition-colors">
                  info@hireyth.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {currentYear} Hireyth. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-blue-600 text-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
