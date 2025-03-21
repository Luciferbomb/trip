import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Heart, Edit, Loader2, UserPlus, UserMinus, Check, X, Trash2, ChevronLeft, AlertTriangle } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Participant {
  id: string;
  user_id: string;
  status: string;
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
  image_url: string;
  start_date: string;
  end_date: string;
  spots: number;
  creator_id: string;
  creator_name: string;
  creator_image: string;
  creator_username: string;
  status: string;
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
          .eq('status', 'active')
          .single();
        
        if (tripError) throw tripError;
        if (!tripData) {
          setError('Trip not found or no longer active');
          return;
        }
        setTrip(tripData);
        
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select(`
            id,
            user_id,
            status,
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
      
      // Check if there are spots available
      if (trip) {
        const approvedParticipants = participants.filter(p => p.status === 'approved').length;
        if (approvedParticipants >= trip.spots) {
          toast({
            title: "Trip Full",
            description: "Sorry, this trip is already full.",
            variant: "destructive"
          });
          return;
        }
      }

      const { error } = await supabase
        .from('trip_participants')
        .insert({
          trip_id: id,
          user_id: user.id,
          status: 'pending'
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
        user: userData
      };
      
      setParticipants(prev => [...prev, newParticipant]);
      setUserParticipation(newParticipant);
      
      toast({
        title: "Request Sent",
        description: "Your request to join this trip has been sent!",
      });
      
    } catch (error: any) {
      console.error('Error joining trip:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join trip",
        variant: "destructive"
      });
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
        title: `${trip?.title} - Hireyth`,
        text: `Join me on this amazing trip to ${trip?.location}!`,
        url: window.location.href,
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Trip link has been copied to your clipboard"
      });
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
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin text-hireyth-main mb-4" />
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !trip) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-screen bg-gray-50 pt-16">
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm max-w-lg w-full">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">Trip Not Found</h3>
          <p className="text-gray-600 mb-6">This trip may have been deleted or is no longer active.</p>
          <Link 
            to="/trips" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-hireyth-main text-white rounded-md hover:bg-hireyth-dark transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            View All Trips
          </Link>
        </div>
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
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Trip Image */}
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden shadow-lg mb-6">
          <img
            src={trip.image_url}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {/* Creator Info - Overlaid on image */}
          <div className="absolute bottom-4 left-4 flex items-center">
            <Link to={`/profile/${trip.creator_username}`} className="flex items-center">
              <img
                src={trip.creator_image}
                alt={trip.creator_name}
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
              <span className="ml-2 text-white text-sm font-medium">{trip.creator_name}</span>
            </Link>
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {user?.id === trip.creator_id && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{trip.location}</span>
              </div>
              
              <div className="flex items-center text-gray-600 mb-4">
                <Calendar className="w-5 h-5 mr-2" />
                <span>
                  {format(new Date(trip.start_date), 'MMM d, yyyy')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                </span>
              </div>

              <div className="flex items-center text-gray-600">
                <Users className="w-5 h-5 mr-2" />
                <span>
                  {participants.filter(p => p.status === 'approved').length} / {trip.spots} spots filled
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{trip.description}</p>
            </div>
          </div>

          {/* Join/Status Button */}
          <div className="mt-6 flex justify-center">
            {user?.id === trip.creator_id ? (
              <Button
                variant="outline"
                onClick={() => setShowParticipants(true)}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Participants
              </Button>
            ) : userParticipation ? (
              <Button
                variant="outline"
                disabled
              >
                {userParticipation.status === 'approved' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Joined
                  </>
                ) : userParticipation.status === 'pending' ? (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Request Pending
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Request Rejected
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleJoinTrip}
                disabled={joining}
              >
                {joining ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Join Trip
              </Button>
            )}
          </div>
        </div>

        {/* Participants Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Participants</h2>
          <div className="space-y-4">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between">
                <Link 
                  to={`/profile/${participant.user.username}`}
                  className="flex items-center space-x-3"
                >
                  <Avatar>
                    <AvatarImage src={participant.user.profile_image} alt={participant.user.name} />
                    <AvatarFallback>{participant.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{participant.user.name}</p>
                    <p className="text-sm text-gray-500">@{participant.user.username}</p>
                  </div>
                </Link>
                
                {user?.id === trip.creator_id && participant.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleParticipantAction(participant.id, 'approve')}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleParticipantAction(participant.id, 'reject')}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
                
                {participant.status !== 'pending' && (
                  <Badge variant={participant.status === 'approved' ? 'default' : 'secondary'}>
                    {participant.status}
                  </Badge>
                )}
              </div>
            ))}
            
            {participants.length === 0 && (
              <p className="text-center text-gray-500 py-4">No participants yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your trip
              and remove all participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default TripDetails; 