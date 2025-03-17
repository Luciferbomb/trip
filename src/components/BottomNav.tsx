
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRound, MapPin, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    {
      name: 'Profile',
      path: '/profile',
      icon: <UserRound className="w-6 h-6" />,
    },
    {
      name: 'Trips',
      path: '/trips',
      icon: <MapPin className="w-6 h-6" />,
    },
    {
      name: 'Create',
      path: '/create',
      icon: <PlusCircle className="w-6 h-6" />,
    },
  ];
  
  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-8 transition-all",
                isActive 
                  ? "text-hireyth-main" 
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
