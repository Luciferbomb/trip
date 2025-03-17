
import React from 'react';
import { Calendar, Heart, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExperienceCardProps {
  id: string;
  images: string[];
  caption: string;
  location: string;
  date: string;
  userName: string;
  userImage: string;
  likes: number;
  comments: number;
  liked?: boolean;
}

const ExperienceCard = ({
  id,
  images,
  caption,
  location,
  date,
  userName,
  userImage,
  likes,
  comments,
  liked = false
}: ExperienceCardProps) => {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover-scale">
      {/* User info */}
      <div className="flex items-center p-4">
        <img 
          src={userImage}
          alt={userName}
          className="w-10 h-10 rounded-full object-cover mr-3"
        />
        <div>
          <h3 className="font-medium">{userName}</h3>
          <div className="flex items-center text-sm text-gray-500">
            <span>{location}</span>
            <span className="mx-1">•</span>
            <span>{formatDate(date)}</span>
          </div>
        </div>
      </div>
      
      {/* Images */}
      <div className={cn(
        "relative overflow-hidden transition-all duration-500",
        images.length === 1 ? "h-80" : "h-60"
      )}>
        {images.length === 1 ? (
          <img 
            src={images[0]} 
            alt="Experience" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="grid grid-cols-2 gap-1 h-full">
            <img 
              src={images[0]} 
              alt="Experience" 
              className="w-full h-full object-cover"
            />
            <div className="relative h-full">
              <img 
                src={images[1]} 
                alt="Experience" 
                className="w-full h-full object-cover"
              />
              {images.length > 2 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-lg font-medium">+{images.length - 2}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Caption and interactions */}
      <div className="p-4">
        <p className="text-gray-700 mb-4 line-clamp-2">{caption}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <button className="flex items-center text-gray-600 hover:text-hireyth-blue transition-colors">
              <Heart className={cn(
                "w-5 h-5 mr-1",
                liked ? "fill-hireyth-orange text-hireyth-orange" : ""
              )} />
              <span>{likes}</span>
            </button>
            
            <button className="flex items-center text-gray-600 hover:text-hireyth-blue transition-colors">
              <MessageCircle className="w-5 h-5 mr-1" />
              <span>{comments}</span>
            </button>
          </div>
          
          <button className="text-sm text-hireyth-blue hover:text-hireyth-blue/80 font-medium">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExperienceCard;
