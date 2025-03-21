import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import Notifications from './Notifications';

const AppHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={user ? "/explore" : "/"} className="text-2xl font-bold text-hireyth-main">
          Hireyth
        </Link>
        
        <div className="flex items-center space-x-4">
          {user && <Notifications />}
          
          {!user && (
            <Button onClick={() => navigate('/login')} variant="default">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader; 