import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, ArrowRight, UserPlus, UserMinus, Loader2, Clock } from 'lucide-react';
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
  creatorImage: string;
  creatorName: string;
  creatorId: string;
  featured?: boolean;
}

const TripCard = ({
  id,
  title,
  location,
  image,
  startDate,
  endDate,
  spots,
  creatorImage,
  creatorName,
  creatorId,
  featured = false
}: TripCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

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
      // Not following
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
        // Unfollow
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
        // Follow
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
    <div className={cn(
      "bg-white rounded-xl overflow-hidden border border-gray-100 transition-all duration-200",
      "hover:shadow-md hover:border-gray-200",
      featured && "ring-2 ring-hireyth-main ring-offset-2"
    )}>
      <Link to={`/trips/${id}`} className="block h-full">
        {/* Image */}
        <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
          {!imageError ? (
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <img 
              src={fallbackImageUrl} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          )}
          
          {featured && (
            <Badge variant="secondary" className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm">
              Featured
            </Badge>
          )}
          
          <Badge variant="secondary" className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm">
            {spots} {spots === 1 ? 'spot' : 'spots'} left
          </Badge>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
            <span>{location}</span>
          </div>
          
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{title}</h3>
          
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Clock className="w-4 h-4 mr-1 text-gray-400" />
            <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
          </div>
          
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={creatorImage} alt={creatorName} />
                <AvatarFallback>{creatorName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{creatorName}</span>
            </div>
            
            {user && user.id !== creatorId && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-xs px-2 py-1",
                  isFollowing && "bg-gray-100"
                )}
                onClick={handleFollow}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : isFollowing ? (
                  <UserMinus className="w-3 h-3 mr-1" />
                ) : (
                  <UserPlus className="w-3 h-3 mr-1" />
                )}
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default TripCard;
