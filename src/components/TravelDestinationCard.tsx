import * as React from "react"
import { cn } from "@/lib/utils"
import { MapPin, Calendar, ArrowRight, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link } from "react-router-dom"

interface TravelDestinationCardProps {
  imageSrc: string
  location: string
  description: string
  price?: string
  rating?: number
  creatorName?: string
  creatorImage?: string
  creatorId?: string
  creatorUsername?: string
  itemType?: 'trip' | 'experience'
  className?: string
  onClick?: () => void
}

export function TravelDestinationCard({
  imageSrc,
  location,
  description,
  price,
  rating,
  creatorName,
  creatorImage,
  creatorId,
  creatorUsername,
  itemType = 'trip',
  className,
  onClick,
}: TravelDestinationCardProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg border border-gray-200",
        "bg-white/80 backdrop-blur-md hover:scale-[1.02]",
        "transition-all duration-300 hover:shadow-lg",
        className
      )}
      onClick={onClick}
    >
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={imageSrc} 
          alt={location} 
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
        />
        {rating && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/80 backdrop-blur-md px-2 py-1 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#f59e0b]"></div>
            <span className="text-xs font-medium text-gray-800">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      <div className="p-5">
        {/* Location and creator info */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={14} className="text-gray-400" />
            <span>{location}</span>
          </div>
          
          {creatorName && creatorUsername && (
            <Link 
              to={`/profile/${creatorUsername}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600"
            >
              <Avatar className="h-5 w-5 border border-gray-200">
                <AvatarImage src={creatorImage} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                  {creatorName[0]}
                </AvatarFallback>
              </Avatar>
              <span>{creatorName}</span>
            </Link>
          )}
        </div>
        
        <h3 className="mt-2 text-xl font-bold text-gray-800">{description}</h3>
        
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {itemType === 'trip' ? 'Trip to ' : 'Experience in '}{location}
        </p>
        
        <div className="mt-4 flex items-center justify-between">
          {price && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Starting from</span>
              <span className="text-lg font-bold text-gray-800">{price}</span>
            </div>
          )}
          
          <Button variant="primary" className="group flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white">
            {itemType === 'trip' ? 'View Trip' : 'View Experience'}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
      
      <div 
        className="absolute inset-0 border border-gray-200 rounded-lg pointer-events-none"
      />
    </div>
  )
} 