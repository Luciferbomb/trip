import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Avatar } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { PremiumCard } from './ui/premium-card';

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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const fallbackImageUrl = "https://images.unsplash.com/photo-1682687218147-9806132dc697?q=80&w=1470&auto=format&fit=crop";

  return (
    <Link to={`/trips/${id}`} className="block group">
      <PremiumCard 
        variant={featured ? "gradient" : "default"}
        className="overflow-hidden"
      >
        {/* Image Container with Premium Overlay */}
        <div className="relative -mt-6 -mx-6 mb-6 aspect-[16/9] overflow-hidden rounded-t-xl">
          {!imageError ? (
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <img 
              src={fallbackImageUrl} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          
          {/* Creator Info - Premium Style */}
          <div className="absolute bottom-4 left-4 flex items-center">
            <Avatar className="h-8 w-8 border-2 border-white/50 shadow-lg">
              <img src={creatorImage} alt={creatorName} className="object-cover" />
            </Avatar>
            <div className="ml-2">
              <span className="text-white text-sm font-medium">{creatorName}</span>
              <Badge 
                variant="outline" 
                className="ml-2 bg-white/10 backdrop-blur-sm border-white/20 text-white"
              >
                Host
              </Badge>
            </div>
          </div>
          
          {/* Spots Badge - Premium Style */}
          <div className="absolute top-4 right-4">
            <Badge 
              variant="outline" 
              className={cn(
                "bg-white/90 backdrop-blur-sm border-white/50 text-gray-900",
                "shadow-[0_2px_10px_rgba(0,0,0,0.1)]",
                spotsLeft <= 2 && "bg-red-50 text-red-600 border-red-200"
              )}
            >
              <Users className="w-3.5 h-3.5 mr-1" />
              {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">{title}</h3>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">{location}</span>
            </div>
          </div>
          
          {/* Date Range - Premium Style */}
          <div className="flex items-center text-gray-600 bg-gray-50/50 rounded-lg p-2">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm font-medium">
              {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          </div>
          
          {/* Activities - Premium Style */}
          {activities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activities.slice(0, 3).map((activity, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="bg-blue-50/50 border-blue-200/50 text-blue-700 text-xs backdrop-blur-sm"
                >
                  {activity}
                </Badge>
              ))}
              {activities.length > 3 && (
                <Badge 
                  variant="outline"
                  className="bg-gray-50/50 border-gray-200/50 text-gray-600 text-xs backdrop-blur-sm"
                >
                  +{activities.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          {/* View Details Button - Premium Style */}
          <Button 
            variant="outline" 
            className={cn(
              "w-full border-gray-200 bg-white/50 backdrop-blur-sm",
              "hover:bg-white hover:border-gray-300 transition-all duration-300",
              "text-gray-900 font-medium"
            )}
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>
      </PremiumCard>
    </Link>
  );
};

export default TripCard;
