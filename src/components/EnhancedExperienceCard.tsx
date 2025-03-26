/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Heart, MessageCircle, MoreVertical, Trash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EnhancedExperienceCardProps {
  id: string;
  title: string;
  location: string;
  description: string;
  image_url: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    username: string;
    profile_image: string;
  };
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  onLike?: (id: string, isLiked: boolean) => void;
  isOwnProfile?: boolean;
  onDelete?: (id: string) => void;
  categories?: string[];
}

const EnhancedExperienceCard: React.FC<EnhancedExperienceCardProps> = ({
  id,
  title,
  location,
  description,
  image_url,
  created_at,
  user,
  likes = 0,
  comments = 0,
  isLiked = false,
  onLike,
  isOwnProfile = false,
  onDelete,
  categories = []
}) => {
  const [liked, setLiked] = React.useState(isLiked);
  const [likeCount, setLikeCount] = React.useState(likes);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onLike) {
      onLike(id, !liked);
      
      // Optimistically update UI
      if (liked) {
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        setLikeCount(prev => prev + 1);
      }
      
      setLiked(!liked);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onDelete) {
      onDelete(id);
    }
  };

  return (
    <Link to={`/experiences/${id}`} className="block">
      <Card className="overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-lg h-full bg-white">
        <CardHeader className="p-0">
          <div className="relative">
            {image_url ? (
              <img
                src={image_url}
                alt={title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                <span className="text-blue-500 font-medium">No image</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-16"></div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
              <div className="flex items-center text-gray-600 mt-1">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="text-sm truncate">{location}</span>
              </div>
            </div>
            
            {isOwnProfile && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                    onClick={handleDelete}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Experience
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {categories.map(category => (
                <span 
                  key={category}
                  className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
          
          <div className="flex items-center text-gray-500 text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{format(new Date(created_at), 'MMM d, yyyy')}</span>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-2 flex items-center justify-between border-t border-gray-100">
          <Link
            to={`/profile/${user.username}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center"
          >
            <Avatar className="h-8 w-8 mr-2 border border-gray-200">
              <AvatarImage src={user.profile_image} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                {user.name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm font-medium">{user.name}</div>
          </Link>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-1 px-2 ${
                liked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </Button>
            
            <div className="flex items-center text-gray-500 gap-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{comments}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default EnhancedExperienceCard; 