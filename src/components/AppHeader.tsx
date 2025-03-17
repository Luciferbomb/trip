import React, { useState, useEffect } from 'react';
import { Bell, X, User, LogOut, Search, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import Notifications from './Notifications';

interface Notification {
  id: string;
  type: 'join_request' | 'comment' | 'trip_update';
  message: string;
  timestamp: string;
  read: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  profile_image: string;
  username: string;
}

const AppHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'join_request',
      message: 'Sarah J. wants to join your Greek Islands trip',
      timestamp: '2023-08-10T14:30:00Z',
      read: false
    },
    {
      id: '2',
      type: 'comment',
      message: 'Mike T. commented on your Japan trip',
      timestamp: '2023-08-09T10:15:00Z',
      read: false
    },
    {
      id: '3',
      type: 'trip_update',
      message: 'Your Norway trip is starting in 3 days',
      timestamp: '2023-08-08T09:45:00Z',
      read: true
    }
  ]);

  // Fetch user profile data when user changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, profile_image, username')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }
        
        setUserProfile(data);
      } catch (error) {
        console.error('Unexpected error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Fetch notifications when user changes
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching notifications:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const formattedNotifications = data.map(notification => ({
            id: notification.id,
            type: notification.type as 'join_request' | 'comment' | 'trip_update',
            message: notification.message,
            timestamp: notification.created_at,
            read: notification.read
          }));
          
          setNotifications(formattedNotifications);
        }
      } catch (error) {
        console.error('Unexpected error fetching notifications:', error);
      }
    };
    
    fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }
      
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Unexpected error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }
      
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Unexpected error marking all notifications as read:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={user ? "/trips" : "/"} className="text-2xl font-bold text-hireyth-main">
          Hireyth
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/search')}
                className="text-gray-600 hover:text-gray-900"
              >
                <Search className="w-5 h-5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile?.profile_image} alt={userProfile?.name || ''} />
                      <AvatarFallback>{userProfile?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {userProfile?.name && (
                        <p className="font-medium">{userProfile.name}</p>
                      )}
                      {userProfile?.username && (
                        <p className="text-sm text-muted-foreground">
                          @{userProfile.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
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