import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';

interface TripDetailsProps {}

const TripDetails: React.FC<TripDetailsProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  
  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          setError('Trip ID is missing');
          return;
        }
        
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching trip details:', error);
          setError('Failed to load trip details');
        } else if (data) {
          setTrip(data);
        } else {
          setError('Trip not found');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTripDetails();
  }, [id]);
  
  const handleJoinTrip = () => {
    // In a real app, this would send a request to join the trip
    alert('Request to join trip sent!');
  };
  
  const toggleLike = () => {
    setLiked(!liked);
  };
  
  const handleShare = () => {
    // In a real app, this would open a share dialog
    if (navigator.share) {
      navigator.share({
        title: trip?.title,
        text: `Check out this trip: ${trip?.title}`,
        url: window.location.href,
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      alert('Share link copied to clipboard!');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AppHeader />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hireyth-main"></div>
        </div>
        <BottomNav />
      </div>
    );
  }
  
  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AppHeader />
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-4">{error || 'Trip not found'}</p>
          <Button onClick={() => navigate('/trips')}>
            Back to Trips
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }
  
  // Format dates
  const startDate = trip.start_date ? new Date(trip.start_date) : null;
  const endDate = trip.end_date ? new Date(trip.end_date) : null;
  
  // Calculate trip duration
  const tripDuration = startDate && endDate 
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader />
      
      {/* Trip Image */}
      <div className="relative h-64 w-full">
        <img 
          src={trip.image_url || trip.image} 
          alt={trip.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="bg-white/80 backdrop-blur-sm" 
            onClick={() => navigate('/trips')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="bg-white/80 backdrop-blur-sm"
            onClick={toggleLike}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="bg-white/80 backdrop-blur-sm"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Trip Details */}
      <div className="p-4 bg-white border-b">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{trip.title}</h1>
        
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{trip.location}</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {trip.country && (
            <Badge variant="outline" className="bg-gray-100">
              {trip.country}
            </Badge>
          )}
          {trip.activity && trip.activity.split(',').map((activity: string, index: number) => (
            <Badge key={index} variant="outline" className="bg-gray-100">
              {activity.trim()}
            </Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600 mb-1" />
            <span className="text-xs text-gray-500">Start</span>
            <span className="text-sm font-medium">
              {startDate ? format(startDate, 'MMM d, yyyy') : 'N/A'}
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600 mb-1" />
            <span className="text-xs text-gray-500">End</span>
            <span className="text-sm font-medium">
              {endDate ? format(endDate, 'MMM d, yyyy') : 'N/A'}
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-gray-600 mb-1" />
            <span className="text-xs text-gray-500">Duration</span>
            <span className="text-sm font-medium">
              {tripDuration ? `${tripDuration} days` : 'N/A'}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={trip.creator_image} alt={trip.creator_name} />
              <AvatarFallback>{trip.creator_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{trip.creator_name}</p>
              <p className="text-xs text-gray-500">Trip Organizer</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-600 mr-1" />
            <span className="text-sm text-gray-600">
              {trip.spots} {trip.spots === 1 ? 'spot' : 'spots'} available
            </span>
          </div>
        </div>
        
        <Button 
          className="w-full bg-hireyth-main hover:bg-hireyth-main/90"
          onClick={handleJoinTrip}
        >
          Request to Join
        </Button>
      </div>
      
      {/* Trip Description */}
      <div className="p-4 bg-white mt-2">
        <h2 className="text-lg font-semibold mb-2">About this trip</h2>
        <p className="text-gray-700 whitespace-pre-line">{trip.description}</p>
      </div>
      
      {/* Trip Itinerary - Placeholder for future implementation */}
      <div className="p-4 bg-white mt-2">
        <h2 className="text-lg font-semibold mb-2">Itinerary</h2>
        <p className="text-gray-500 italic">Detailed itinerary will be shared after joining the trip.</p>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default TripDetails; 