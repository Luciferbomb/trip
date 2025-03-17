import React from 'react';
import { Calendar, Users, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TripCardProps {
  id: string;
  title: string;
  location: string;
  image: string;
  startDate: string;
  endDate: string;
  spots: number;
  creatorImage: string;
  creatorName: string;
  creatorId?: string;
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
  creatorId = "user123", // Default creator ID for demo
  featured = false
}: TripCardProps) => {
  // Format dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const start = startDate ? formatDate(startDate) : 'TBD';
  const end = endDate ? formatDate(endDate) : 'TBD';

  return (
    <div className={cn(
      "group rounded-2xl overflow-hidden bg-white card-shadow transition-all duration-500 hover-scale",
      featured && "ring-2 ring-hireyth-blue/30 ring-offset-2"
    )}>
      {/* Card Top - Image */}
      <Link to={`/trips/${id}`} className="block relative h-48 overflow-hidden">
        {featured && (
          <Badge className="absolute top-3 left-3 z-10 bg-gradient-to-r from-hireyth-blue to-hireyth-light-blue text-white">
            Featured Trip
          </Badge>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10"></div>
        
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        <div className="absolute bottom-3 left-3 z-10 flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-white" />
          <span className="text-white font-medium text-sm">{location}</span>
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-5">
        <Link to={`/trips/${id}`} className="block">
          <h3 className="text-lg font-semibold mb-3 line-clamp-1 hover:text-hireyth-blue transition-colors">{title}</h3>
        </Link>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-hireyth-blue" />
            <span>{start} - {end}</span>
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Users className="w-4 h-4 text-hireyth-orange" />
            <span>{spots} spot{spots !== 1 ? 's' : ''} left</span>
          </div>
        </div>
        
        {/* Creator */}
        <div className="flex items-center justify-between">
          <Link to={`/profile/${creatorId}`} className="flex items-center space-x-2 hover:text-hireyth-blue transition-colors">
            <img
              src={creatorImage}
              alt={creatorName}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm text-gray-700">by {creatorName}</span>
          </Link>
          
          <Button asChild variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent group-hover:text-hireyth-blue">
            <Link to={`/trips/${id}`} className="flex items-center space-x-1">
              <span>View</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TripCard;
