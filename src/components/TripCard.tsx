import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, ArrowRight, UserPlus, UserMinus, Loader2, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

export interface TripCardProps {
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
  featured?: boolean;
  activity?: string;
  country?: string;
}

const TripCard: React.FC<TripCardProps> = ({
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
  featured = false,
  activity,
  country
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const activities = activity ? activity.split(',').map(a => a.trim()) : [];
  const spotsLeft = Number(spots) - Number(spotsFilled || 0);

  useEffect(() => {
    if (user && creatorId) {
      checkFollowStatus();
    }
  }, [user, creatorId]);

  const checkFollowStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', creatorId)
        .single();
      
      setIsFollowing(!!data);
    } catch (error) {
      setIsFollowing(false);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isFollowing) {
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', creatorId);
        
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${creatorName}`,
        });
      } else {
        await supabase
          .from('followers')
          .insert([
            { follower_id: user.id, following_id: creatorId }
          ]);
        
        setIsFollowing(true);
        toast({
          title: "Following!",
          description: `You are now following ${creatorName}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error updating your follow status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const fallbackImageUrl = "https://images.unsplash.com/photo-1682687218147-9806132dc697?q=80&w=1470&auto=format&fit=crop";

  return (
    <Link 
      to={`/trips/${id}`} 
      className="block group"
    >
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
        {/* Image Container */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {!imageError ? (
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <img 
              src={fallbackImageUrl} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {/* Creator Info - Overlaid on image */}
          <div className="absolute bottom-4 left-4 flex items-center">
            <img
              src={creatorImage}
              alt={creatorName}
              className="w-8 h-8 rounded-full border-2 border-white object-cover"
            />
            <span className="ml-2 text-white text-sm font-medium">{creatorName}</span>
          </div>
          
          {/* Spots Badge - Top Right */}
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-white text-gray-900">
              <Users className="w-3.5 h-3.5 mr-1" />
              {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{title}</h3>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{location}</span>
            </div>
          </div>
          
          {/* Date Range */}
          <div className="flex items-center text-gray-600 mb-3">
            <Calendar className="w-4 h-4 mr-1" />
            <span className="text-sm">
              {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          </div>
          
          {/* Activities */}
          {activities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activities.slice(0, 3).map((activity, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 text-xs"
                >
                  {activity}
                </Badge>
              ))}
              {activities.length > 3 && (
                <Badge 
                  variant="outline"
                  className="bg-blue-50 border-blue-200 text-blue-700 text-xs"
                >
                  +{activities.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          {/* View Details Button */}
          <Button 
            variant="outline" 
            className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 group-hover:border-gray-300 transition-all duration-200"
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default TripCard;
