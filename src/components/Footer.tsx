import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-hireyth-main to-hireyth-light rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-white">H</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Hireyth</span>
            </div>
            <p className="text-gray-600 mb-4">
              Connecting travelers worldwide to share experiences and adventures.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-hireyth-main transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-hireyth-main transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-hireyth-main transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-500 hover:text-hireyth-main transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-hireyth-main transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-600 hover:text-hireyth-main transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/press" className="text-gray-600 hover:text-hireyth-main transition-colors">
                  Press
                </Link>
              </li>
              <li>
                <Link to="/partners" className="text-gray-600 hover:text-hireyth-main transition-colors">
                  Partners
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/help" className="text-gray-600 hover:text-hireyth-main transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-gray-600 hover:text-hireyth-main transition-colors">
                  Safety Center
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-hireyth-main transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-hireyth-main transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 mb-4">
              Stay Connected
            </h3>
            <p className="text-gray-600 mb-4">Subscribe to our newsletter for travel tips and new features.</p>
            <div className="flex gap-2">
              <Input placeholder="Your email" className="bg-white" />
              <Button>Subscribe</Button>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={16} />
                <span>support@hireyth.com</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm text-center md:text-left mb-4 md:mb-0">
            © {new Date().getFullYear()} Hireyth. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link to="/terms" className="text-gray-500 hover:text-hireyth-main text-sm">
              Terms
            </Link>
            <Link to="/privacy" className="text-gray-500 hover:text-hireyth-main text-sm">
              Privacy
            </Link>
            <Link to="/cookies" className="text-gray-500 hover:text-hireyth-main text-sm">
              Cookies
            </Link>
            <Link to="/sitemap" className="text-gray-500 hover:text-hireyth-main text-sm">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
