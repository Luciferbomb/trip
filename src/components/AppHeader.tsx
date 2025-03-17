import React, { useState, useEffect } from 'react';
import { Bell, X, User, LogOut } from 'lucide-react';
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
          .select('id, name, profile_image')
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
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="bg-hireyth-main text-white p-4 flex justify-between items-center">
      <Link to="/trips" className="font-['Dancing_Script'] text-2xl font-bold">
        Hireyth
      </Link>
      
      <div className="flex items-center space-x-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader className="border-b pb-4">
              <div className="flex justify-between items-center">
                <SheetTitle>Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-3 rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                  >
                    <div className="flex justify-between">
                      <p className={`text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-gray-400"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-6">No notifications</p>
              )}
            </div>
          </SheetContent>
        </Sheet>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white rounded-full p-0 h-8 w-8 overflow-hidden">
              {userProfile ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile.profile_image} alt={userProfile.name} />
                  <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
                </Avatar>
              ) : (
                <User className="w-5 h-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/trips')}>
              My Trips
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default AppHeader; 