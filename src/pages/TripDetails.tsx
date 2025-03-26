import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Share2, Heart, Edit, Loader2, UserPlus, UserMinus, Check, X, Trash2, ChevronLeft, AlertTriangle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Header } from '../components/Header';
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
import { useToast } from '@/components/ui/use-toast';
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
import TripDiscussion from '@/components/TripDiscussion';
import { getUserTripStatus, updateParticipantStatus, checkTripAvailability } from '@/lib/dbFunctions';
import TripParticipants from '@/components/TripParticipants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { runChatTest } from '@/lib/chat-db-test';
import Chat from '@/components/Chat';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  spots_filled: number;
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
  const { toast } = useToast();
  
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [canJoin, setCanJoin] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState(false);
  
  // Function to fetch trip details
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
        .select('*, creator:users!creator_id(username, name, profile_image)')
          .eq('id', id)
        .eq('status', 'active')
          .single();
        
        if (tripError) throw tripError;
      if (!tripData) {
        setError('Trip not found or no longer active');
        return;
      }
      
      // Add the creator username to the trip object
      const tripWithUsername = {
        ...tripData,
        creator_username: tripData.creator?.username || 'unknown',
        creator_name: tripData.creator?.name || 'Unknown user',
        creator_image: tripData.creator?.profile_image || ''
      };
      
      setTrip(tripWithUsername);
      
      console.log("Trip data refreshed:", tripWithUsername);
      
      // Fetch participants with fresh data
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select(`
            id,
            user_id,
            status,
          created_at,
            user:users (
            id,
              name,
              profile_image,
              username
            )
          `)
        .eq('trip_id', id)
        .order('created_at', { ascending: true });
        
        if (participantsError) throw participantsError;
        
        // Transform the data to match the Participant interface
      const transformedParticipants = (participantsData || []).map((p: any): Participant => ({
          id: p.id,
          user_id: p.user_id,
          status: p.status,
          user: {
          name: p.user?.name || 'Unknown',
          profile_image: p.user?.profile_image || '',
          username: p.user?.username || 'unknown'
          }
        }));
        
        setParticipants(transformedParticipants);
        
      // Check if the current user is participating
        if (user) {
        const currentUserParticipation = transformedParticipants.find(
          (p) => p.user_id === user.id
        ) || null;
        
        setUserParticipation(currentUserParticipation);
        
        // If user is not already participating, check trip availability
        if (!currentUserParticipation) {
          const available = await checkTripAvailability(id);
          setCanJoin(available);
        } else {
          setCanJoin(false);
        }
      }
      
      // Get trip status from backend
      if (user) {
        const status = await getUserTripStatus(user.id, id);
        console.log('User trip status:', status);
        setIsApproved(status === 'approved');
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching trip details:', error);
      setError('Failed to load trip details');
      } finally {
        setLoading(false);
      }
    };
    
  // Set up initial data fetch
  useEffect(() => {
    fetchTripDetails();
  }, [id, user]);
  
  // Set up subscriptions
  useEffect(() => {
    if (!id || !user) return;

    console.log('Setting up trip subscriptions');

    // Subscribe to trip updates
    const tripSubscription = supabase
      .channel(`trip-${id}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Trip updated:', payload);
          fetchTripDetails();
        }
      )
      .subscribe();

    // Subscribe to participant status changes for the current user
    const participantSubscription = supabase
      .channel(`user-participation-${id}-${user.id}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'trip_participants',
          filter: `trip_id=eq.${id} AND user_id=eq.${user.id}`
        },
        (payload: any) => {
          console.log('User participation changed:', payload);
          
          // Refresh trip details and get updated participation status
          fetchTripDetails();
          
          // Show notification if status changed to approved
          if (payload.new && payload.new.status === 'approved' && 
              (!payload.old || payload.old.status !== 'approved')) {
            toast({
              title: "Participation Approved",
              description: "You have been approved for this trip!"
            });
          }
        }
      )
      .subscribe();

    return () => {
      tripSubscription.unsubscribe();
      participantSubscription.unsubscribe();
    };
  }, [id, user, toast]);
  
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
  
  const handleParticipantAction = async (participantId: string, action: 'approve' | 'reject' | 'remove') => {
    if (!id) return;
    
    setActionLoading(participantId);
    
    try {
      if (action === 'remove') {
        // Remove the participant
      const { error } = await supabase
        .from('trip_participants')
          .delete()
        .eq('id', participantId);
      
      if (error) throw error;
      
        toast({
          title: 'Participant removed',
          description: 'The participant has been removed from the trip.',
        });
      } else {
        // Update the participant status
        const status = action === 'approve' ? 'approved' : 'rejected';
        
        // Use our dbFunctions helper that handles everything, including chat access
        const { success, error } = await updateParticipantStatus(
          participantId, 
          id,
          status
        );
        
        if (!success) throw error;
        
      toast({
          title: action === 'approve' ? 'Participant approved' : 'Participant rejected',
          description: action === 'approve' 
            ? 'The participant has been approved to join the trip.'
            : 'The participant has been denied access to the trip.',
        });
      }
      
      // We no longer need to call fetchTripDetails here as the real-time
      // subscription will update the UI automatically
      
    } catch (error: any) {
      console.error(`Error ${action}ing participant:`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} participant`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${trip?.title} | Hireyth`,
        text: `Check out this amazing trip to ${trip?.location} on Hireyth!`,
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
          description: `Followed ${trip.creator_name}`
        });
      }
    } catch (error: any) {
      console.error('Error following:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to follow",
        variant: "destructive"
      });
    } finally {
      setFollowLoading(false);
    }
  };
  
    return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin text-hireyth-main mb-4" />
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      ) : error || !trip ? (
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
      ) : (
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Participants</h2>
            <div className="space-y-4">
              {participants.filter(p => p.status === 'approved').map((participant) => (
                <div 
                  key={participant.id} 
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <Link 
                    to={`/profile/${participant.user.username}`}
                    className="flex items-center space-x-3"
                  >
                    <Avatar className="h-10 w-10 border border-gray-200 shadow-sm">
                      <AvatarImage src={participant.user.profile_image} alt={participant.user.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-800">{participant.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{participant.user.name}</p>
                      <p className="text-sm text-blue-600">@{participant.user.username}</p>
                    </div>
                  </Link>
                </div>
              ))}
              
              {participants.filter(p => p.status === 'approved').length === 0 && (
                <div className="text-center py-8 px-4 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-gray-500">No participants yet</p>
                  <p className="text-sm text-gray-400 mt-1">Share this trip with others to get started</p>
                </div>
              )}
              
              {participants.filter(p => p.status === 'approved').length > 0 && (
                <div className="mt-4 text-center">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowParticipants(true)}
            >
                    View All Participants
            </Button>
                </div>
              )}
            </div>
          </div>

          {/* Discussion Section */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-gray-600" />
              Discussion Forum
            </h3>
            
            {!user ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                  You need to be logged in to view the discussion.
                </AlertDescription>
              </Alert>
            ) : !isApproved && !(!!trip && user.id === trip.creator_id) ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Pending Approval</AlertTitle>
                <AlertDescription>
                  You can participate in the discussion once your request to join is approved.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="bg-white rounded-lg border overflow-hidden">
                <Chat tripId={id || ''} tripName={trip?.title} />
              </div>
            )}
          </div>

          {/* Add near the trip action buttons (after Delete Trip button and before TripDiscussion component) */}
          {process.env.NODE_ENV === 'development' && user && (
            <div className="mt-4 mb-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Database Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Running Chat DB Test",
                        description: "Check the console for results"
                      });
                      if (id && user?.id) {
                        runChatTest(id, user.id);
                      }
                    }}
                    className="w-full"
                  >
                    Test Chat Database
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

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

      {/* Participants Management Dialog */}
      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Trip Participants</DialogTitle>
            <DialogDescription>
              Manage participants for this trip. You can approve or reject requests.
            </DialogDescription>
          </DialogHeader>
          
          {trip && (
            <TripParticipants
              tripId={id as string}
              creatorId={trip.creator_id}
              spots={trip.spots}
              onParticipantUpdate={() => {
                // Refresh trip details after participant status change
                fetchTripDetails();
                
                // Show a success toast
                toast({
                  title: "Participants Updated",
                  description: "Changes have been saved",
                });
              }}
              actionLoading={actionLoading}
              onAction={handleParticipantAction}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  );
};

export default TripDetails; 