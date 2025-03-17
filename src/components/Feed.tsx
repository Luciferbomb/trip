import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, User, Compass } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { format } from 'date-fns';

interface FeedItem {
  id: string;
  user_id: string;
  type: 'trip_created' | 'trip_joined' | 'experience_shared';
  content: string;
  metadata: {
    trip_id?: string;
    trip_title?: string;
    trip_image?: string;
    trip_location?: string;
    experience_id?: string;
    experience_title?: string;
    experience_image?: string;
    experience_location?: string;
    username?: string;
  };
  created_at: string;
}

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('feed_items')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setFeedItems(data || []);
      } catch (error) {
        console.error('Error fetching feed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();

    // Subscribe to new feed items
    const channel = supabase
      .channel('feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_items'
        },
        (payload) => {
          setFeedItems(prev => [payload.new as FeedItem, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleItemClick = (item: FeedItem) => {
    if (item.metadata.trip_id) {
      navigate(`/trips/${item.metadata.trip_id}`);
    } else if (item.metadata.username) {
      navigate(`/profile/${item.metadata.username}`);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'trip_created':
        return <Compass className="h-5 w-5" />;
      case 'trip_joined':
        return <User className="h-5 w-5" />;
      case 'experience_shared':
        return <Calendar className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hireyth-main" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No updates yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Follow more people to see their updates here
          </p>
          <Button
            onClick={() => navigate('/search')}
            className="mt-4"
          >
            Find People to Follow
          </Button>
        </div>
      ) : (
        feedItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleItemClick(item)}
          >
            {(item.metadata.trip_image || item.metadata.experience_image) && (
              <img
                src={item.metadata.trip_image || item.metadata.experience_image}
                alt={item.metadata.trip_title || item.metadata.experience_title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getItemIcon(item.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{item.content}</p>
                  {item.metadata.trip_location || item.metadata.experience_location ? (
                    <div className="flex items-center text-gray-600 text-sm mt-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{item.metadata.trip_location || item.metadata.experience_location}</span>
                    </div>
                  ) : null}
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(item.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Feed; 