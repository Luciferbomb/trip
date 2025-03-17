import React, { useState, useEffect } from 'react';
import { Bell, UserPlus, Check, X, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Notification {
  id: string;
  user_id: string;
  type: 'join_request' | 'request_approved' | 'request_rejected' | 'trip_update' | 'follow';
  message: string;
  read: boolean;
  created_at: string;
  metadata?: {
    participant_id?: string;
    trip_id?: string;
    status?: string;
  };
}

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  
  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);
        
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    fetchNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  // Mark notifications as read
  const markAsRead = async (notificationId?: string) => {
    if (!user) return;
    
    try {
      if (notificationId) {
        // Mark single notification as read
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
      } else {
        // Mark all notifications as read
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);
          
        if (error) throw error;
        
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'join_request':
        return <UserPlus className="h-4 w-4" />;
      case 'request_approved':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'request_rejected':
        return <X className="h-4 w-4 text-red-500" />;
      case 'trip_update':
        return <Calendar className="h-4 w-4" />;
      case 'follow':
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type and metadata
    if (notification.metadata?.trip_id) {
      navigate(`/trips/${notification.metadata.trip_id}`);
    } else if (notification.type === 'follow' && notification.metadata?.participant_id) {
      navigate(`/profile/${notification.metadata.participant_id}`);
    }
    
    setOpen(false);
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAsRead()}>
                Mark all as read
              </Button>
            )}
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-5rem)] mt-4">
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No notifications yet</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    notification.read ? 'bg-gray-50' : 'bg-blue-50'
                  } hover:bg-gray-100`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default Notifications; 