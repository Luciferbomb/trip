import React from 'react';
import { format } from 'date-fns';
import { MapPin, Calendar, MoreVertical, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExperienceCardProps {
  id: string;
  title: string;
  location: string;
  description: string;
  image_url: string | null;
  created_at: string;
  isOwnProfile?: boolean;
  onDelete?: (id: string) => void;
}

const ExperienceCard: React.FC<ExperienceCardProps> = ({
  id,
  title,
  location,
  description,
  image_url,
  created_at,
  isOwnProfile = false,
  onDelete
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      {/* Image */}
      {image_url && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            <div className="flex items-center text-white/60">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{location}</span>
            </div>
          </div>
          
          {isOwnProfile && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white/10 backdrop-blur-md border-white/20">
                <DropdownMenuItem 
                  className="text-red-300 focus:text-red-200 focus:bg-red-500/10"
                  onClick={() => onDelete(id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Experience
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <p className="text-white/80 text-sm mb-3 line-clamp-3">{description}</p>
        
        <div className="flex items-center text-white/60">
          <Calendar className="w-4 h-4 mr-1" />
          <span className="text-sm">
            {format(new Date(created_at), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExperienceCard;
