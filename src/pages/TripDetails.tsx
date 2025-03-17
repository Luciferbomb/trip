import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Heart, Edit, Loader2, UserPlus, UserMinus, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface Participant {
  id: string;
  user_id: string;
  status: string;
  role: string;
  user: {
    name: string;
    profile_image: string;
    username: string;
  };
}

interface Trip {
  id: string;
  title: string;
  description: string;
  location: string;
  country: string;
  image_url: string;
  start_date: string;
  end_date: string;
  spots: number;
  creator_id: string;
  creator_name: string;
  creator_image: string;
  activity: string;
}

const TripDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [joining, setJoining] = useState(false);
  const [userParticipation, setUserParticipation] = useState<Participant | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          setError('Trip ID is missing');
          return;
        }
        
        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();
        
        if (tripError) throw tripError;
        setTrip(tripData);
        
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select(`
            id,
            user_id,
            status,
            role,
            user:users (
              name,
              profile_image,
              username
            )
          `)
          .eq('trip_id', id);
        
        if (participantsError) throw participantsError;
        
        // Transform the data to match the Participant interface
        const transformedParticipants = (participantsData || []).map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          status: p.status,
          role: p.role,
          user: {
            name: p.user.name,
            profile_image: p.user.profile_image,
            username: p.user.username
          }
        }));
        
        setParticipants(transformedParticipants);
        
        // Check user's participation
        if (user) {
          const userParticipant = transformedParticipants.find(p => p.user_id === user.id);
          setUserParticipation(userParticipant || null);
          
          // Check if user is following the creator
          if (tripData.creator_id !== user.id) {
            const { data: followData, error: followError } = await supabase
              .from('user_follows')
              .select('*')
              .eq('follower_id', user.id)
              .eq('following_id', tripData.creator_id)
              .single();
              
            if (followError && followError.code !== 'PGRST116') throw followError;
            setIsFollowing(!!followData);
          }
        }
        
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTripDetails();
  }, [id, user]);
  
  const handleJoinTrip = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      setJoining(true);
      
      const { error } = await supabase
        .from('trip_participants')
        .insert({
          trip_id: id,
          user_id: user.id,
          status: 'pending',
          role: 'participant'
        });
      
      if (error) throw error;
      
      // Update local state
      const { data: userData } = await supabase
        .from('users')
        .select('name, profile_image, username')
        .eq('id', user.id)
        .single();
      
      const newParticipant: Participant = {
        id: 'temp', // Will be replaced on next fetch
        user_id: user.id,
        status: 'pending',
        role: 'participant',
        user: userData
      };
      
      setParticipants(prev => [...prev, newParticipant]);
      setUserParticipation(newParticipant);
      
      alert('Request to join trip sent! Waiting for approval.');
      
    } catch (error: any) {
      console.error('Error joining trip:', error);
      alert(error.message);
    } finally {
      setJoining(false);
    }
  };
  
  const handleParticipantAction = async (participantId: string, action: 'approve' | 'reject') => {
    try {
      // First check if there are spots available for approval
      if (action === 'approve' && trip) {
        const approvedCount = participants.filter(p => p.status === 'approved').length;
        if (approvedCount >= trip.spots) {
          toast({
            title: "Error",
            description: "This trip is already full. Cannot approve more participants.",
            variant: "destructive"
          });
          return;
        }
      }

      const { error } = await supabase
        .from('trip_participants')
        .update({ 
          status: action === 'approve' ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', participantId);
      
      if (error) throw error;
      
      // Update local state
      setParticipants(prev => prev.map(p => {
        if (p.id === participantId) {
          return { ...p, status: action === 'approve' ? 'approved' : 'rejected' };
        }
        return p;
      }));

      // Show success message
      toast({
        title: "Success",
        description: `Participant ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });
      
    } catch (error: any) {
      console.error('Error updating participant:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to update participant status',
        variant: "destructive"
      });
    }
  };
  
  const handleShare = () => {
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
  
  const handleDelete = async () => {
    if (!user || !trip) return;
    
    try {
      setIsDeleting(true);
      
      // Delete trip participants first (due to foreign key constraint)
      const { error: participantsError } = await supabase
        .from('trip_participants')
        .delete()
        .eq('trip_id', id);
      
      if (participantsError) throw participantsError;
      
      // Delete the trip
      const { error: tripError } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)
        .eq('creator_id', user.id); // Ensure only creator can delete
      
      if (tripError) throw tripError;
      
      navigate('/trips');
      
    } catch (error: any) {
      console.error('Error deleting trip:', error);
      alert(error.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleFollow = async () => {
    if (!user || !trip) return;
    
    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', trip.creator_id);
          
        if (error) throw error;
        
        setIsFollowing(false);
        toast({
          title: 'Success',
          description: `Unfollowed ${trip.creator_name}`
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: trip.creator_id
          });
          
        if (error) throw error;
        
        setIsFollowing(true);
        toast({
          title: 'Success',
          description: `Now following ${trip.creator_name}`
        });
      }
    } catch (error: any) {
      console.error('Error following/unfollowing:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive'
      });
    } finally {
      setFollowLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AppHeader />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-10 h-10 animate-spin" />
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
  
  // Filter participants by status
  const approvedParticipants = participants.filter(p => p.status === 'approved');
  const pendingParticipants = participants.filter(p => p.status === 'pending');
  const rejectedParticipants = participants.filter(p => p.status === 'rejected');
  const spotsAvailable = trip.spots - approvedParticipants.length;
  const isCreator = user && trip && user.id === trip.creator_id;
  
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
          src={trip.image_url}
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
          {isCreator && (
            <>
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white/80 backdrop-blur-sm"
                onClick={() => navigate(`/trips/${id}/edit`)}
              >
                <Edit className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white/80 backdrop-blur-sm hover:bg-red-100"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </Button>
            </>
          )}
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
              <Link 
                to={`/profile/${trip.creator_id}`}
                className="text-sm font-medium hover:text-hireyth-blue transition-colors"
              >
                {trip.creator_name}
              </Link>
              <p className="text-xs text-gray-500">Trip Organizer</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isCreator && user && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-1" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
            
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowParticipants(true)}
            >
              <Users className="w-4 h-4 mr-2" />
              {approvedParticipants.length}/{trip.spots} joined
            </Button>
          </div>
        </div>
        
        {!isCreator && (
          userParticipation ? (
            <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
              <Badge variant={
                userParticipation.status === 'approved' ? 'default' :
                userParticipation.status === 'pending' ? 'secondary' :
                'destructive'
              }>
                {userParticipation.status === 'approved' ? 'You are part of this trip' :
                 userParticipation.status === 'pending' ? 'Request pending approval' :
                 'Request rejected'}
              </Badge>
            </div>
          ) : (
            <Button 
              className="w-full bg-hireyth-main hover:bg-hireyth-main/90"
              onClick={handleJoinTrip}
              disabled={joining || spotsAvailable <= 0}
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : spotsAvailable <= 0 ? (
                'No spots available'
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Request to Join
                </>
              )}
            </Button>
          )
        )}
      </div>
      
      {/* Trip Description */}
      <div className="p-4 bg-white mt-2">
        <h2 className="text-lg font-semibold mb-2">About this trip</h2>
        <p className="text-gray-700 whitespace-pre-line">{trip.description}</p>
      </div>
      
      {/* Trip Itinerary */}
      <div className="p-4 bg-white mt-2">
        <h2 className="text-lg font-semibold mb-2">Itinerary</h2>
        <p className="text-gray-500 italic">
          {isCreator || userParticipation?.status === 'approved' 
            ? 'Detailed itinerary will be added soon.'
            : 'Detailed itinerary will be shared after joining the trip.'}
        </p>
      </div>
      
      {/* Participants Dialog */}
      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trip Participants</DialogTitle>
            <DialogDescription>
              {spotsAvailable} {spotsAvailable === 1 ? 'spot' : 'spots'} available
            </DialogDescription>
          </DialogHeader>
          
          {/* Approved Participants */}
          <div className="space-y-4">
            <h3 className="font-medium">Joined ({approvedParticipants.length})</h3>
            <div className="space-y-2">
              {approvedParticipants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={participant.user.profile_image} />
                      <AvatarFallback>{participant.user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{participant.user.name}</p>
                      <p className="text-xs text-gray-500">@{participant.user.username}</p>
                    </div>
                  </div>
                  {participant.role === 'creator' && (
                    <Badge>Organizer</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Pending Requests */}
          {isCreator && pendingParticipants.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium">Pending Requests ({pendingParticipants.length})</h3>
              <div className="space-y-2 mt-2">
                {pendingParticipants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={participant.user.profile_image} />
                        <AvatarFallback>{participant.user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{participant.user.name}</p>
                        <p className="text-xs text-gray-500">@{participant.user.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleParticipantAction(participant.id, 'approve')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleParticipantAction(participant.id, 'reject')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Rejected Participants */}
          {isCreator && rejectedParticipants.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium">Rejected ({rejectedParticipants.length})</h3>
              <div className="space-y-2 mt-2">
                {rejectedParticipants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg opacity-60">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={participant.user.profile_image} />
                        <AvatarFallback>{participant.user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{participant.user.name}</p>
                        <p className="text-xs text-gray-500">@{participant.user.username}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Rejected</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <BottomNav />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trip</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this trip? This action cannot be undone and will remove all participants.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Trip'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripDetails; 