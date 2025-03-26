/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export interface EnhancedTripCardProps {
  id: string;
  title: string;
  location: string;
  image: string;
  startDate: string;
  endDate: string;
  spots: number;
  spotsFilled: number;
  creatorImage: string;
  creatorName: string;
  creatorId: string;
  creatorUsername?: string;
  featured?: boolean;
  activity?: string;
  country?: string;
}

const EnhancedTripCard: React.FC<EnhancedTripCardProps> = ({
  id,
  title,
  location,
  image,
  startDate,
  endDate,
  spots,
  spotsFilled,
  creatorImage,
  creatorName,
  creatorId,
  creatorUsername = '',
  featured = false,
  activity,
  country
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);

  React.useEffect(() => {
    if (user && creatorId && user.id !== creatorId) {
      checkFollowStatus();
    }
  }, [user, creatorId]);

  const checkFollowStatus = async () => {
    if (!user || !creatorId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', creatorId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
      } else {
        setIsFollowing(!!data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow others",
        variant: "destructive"
      });
      return;
    }
    
    if (user.id === creatorId) return;
    
    setFollowLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', creatorId);
        
        if (error) throw error;
        
        setIsFollowing(false);
        toast({
          title: 'Success',
          description: `Unfollowed ${creatorName}`
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: creatorId
          });
        
        if (error) throw error;
        
        setIsFollowing(true);
        toast({
          title: 'Success',
          description: `Followed ${creatorName}`
        });
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive"
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Invalid date', dateString);
      return dateString;
    }
  };

  return (
    <Link to={`/trips/${id}`} className="block">
      <Card className="overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-lg h-full">
        <CardHeader className="p-0">
          <div className="relative">
            <img
              src={image}
              alt={title}
              className="w-full h-48 object-cover"
            />
            {featured && (
              <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                Featured
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-16"></div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
            {activity && (
              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                {activity}
              </span>
            )}
          </div>
          
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="text-sm truncate">{location}</span>
            {country && (
              <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                {country}
              </span>
            )}
          </div>
          
          <div className="flex items-center text-gray-600 mb-2">
            <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="text-sm">
              {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="text-sm">
              {spotsFilled}/{spots} spots filled
            </span>
            
            <div className="ml-auto">
              <div className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {new Date(startDate) > new Date() ? 'Upcoming' : 'Active'}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-gray-100 mt-2">
          <Link
            to={`/profile/${creatorUsername}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center"
          >
            <Avatar className="h-8 w-8 mr-2 border border-gray-200">
              <AvatarImage src={creatorImage} alt={creatorName} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                {creatorName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm font-medium">{creatorName}</div>
          </Link>
          
          {user && user.id !== creatorId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFollow}
              disabled={followLoading}
              className={isFollowing ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default EnhancedTripCard; 