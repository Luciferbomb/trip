import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Check, X, RefreshCw, UserCheck, UserX, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { updateParticipantStatus, checkTripAvailability } from '@/lib/dbFunctions';

interface UserInfo {
  name?: string;
  profile_image?: string;
  username?: string;
  email?: string;
  id?: string;
}

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

interface TripParticipantsProps {
  tripId: string;
  creatorId: string;
  spots: number;
  onParticipantUpdate?: () => void;
  actionLoading?: string | null;
  onAction: (participantId: string, action: 'approve' | 'reject' | 'remove') => void;
}

const TripParticipants = ({ 
  tripId, 
  creatorId, 
  spots, 
  onParticipantUpdate,
  actionLoading,
  onAction
}: TripParticipantsProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [spotsAvailable, setSpotsAvailable] = useState(spots);
  const { toast } = useToast();
  
  // Ref to store subscription
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  // Ref to track if component is mounted
  const isMounted = useRef(true);

  // Set up and clean up subscriptions
  useEffect(() => {
    // Set up subscription for trip participants
    setupSubscription();
    
    // Fetch initial data
    fetchParticipants();
    
    // Clean up on unmount
    return () => {
      isMounted.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [tripId]);
  
  // Setup real-time subscription for participants
  const setupSubscription = () => {
    // Clean up any existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    
    // Create new subscription
    const channel = supabase
      .channel(`trip-participants-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'trip_participants',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          console.log('Participant change detected:', payload);
          fetchParticipants();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
      
    subscriptionRef.current = channel;
    
    // Also subscribe to trip changes to update spots_filled
    const tripChannel = supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`
        },
        (payload) => {
          console.log('Trip data updated:', payload);
          if (payload.new && payload.new.spots) {
            setSpotsAvailable(payload.new.spots - (payload.new.spots_filled || 0));
          }
        }
      )
      .subscribe();
  };

  const fetchParticipants = async () => {
    try {
      if (!isMounted.current) return;
      
      setLoading(true);
      // First check if trip exists and get current spots
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('spots, spots_filled')
        .eq('id', tripId)
        .single();
        
      if (tripError) {
        console.error('Error fetching trip data:', tripError);
        toast({
          title: 'Error',
          description: 'Could not verify trip data',
          variant: 'destructive'
        });
      } else if (tripData) {
        // Update spots available from the latest data
        setSpotsAvailable(tripData.spots - (tripData.spots_filled || 0));
      }
      
      // Now fetch participants with detailed information
      const { data, error } = await supabase
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
            username,
            email
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (!data) {
        setParticipants([]);
        return;
      }
      
      // Transform the data to match the Participant interface
      const transformedParticipants = data.map((p): Participant => {
        // Safely access nested user properties with type assertion
        const userData = (p.user || {}) as UserInfo;
        
        return {
          id: p.id,
          user_id: p.user_id,
          status: p.status,
          user: {
            name: userData.name || 'Unknown User',
            profile_image: userData.profile_image || '',
            username: userData.username || 'unknown'
          }
        };
      });
      
      if (isMounted.current) {
        setParticipants(transformedParticipants);
        
        // Calculate available spots again from the participants data
        const approvedCount = transformedParticipants.filter(p => p.status === 'approved').length;
        setSpotsAvailable(spots - approvedCount);
        
        // Call the update callback if provided
        if (onParticipantUpdate) {
          onParticipantUpdate();
        }
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      if (isMounted.current) {
        toast({
          title: 'Error',
          description: 'Failed to load participants',
          variant: 'destructive'
        });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };
  
  const refreshParticipants = () => {
    setRefreshing(true);
    fetchParticipants();
  };

  const handleUpdateStatus = (participantId: string, newStatus: string) => {
    // Validate before approving
    if (newStatus === 'approve') {
      // Check if there are spots available
      if (spotsAvailable <= 0) {
        toast({
          title: "No Spots Available",
          description: "This trip is already full. Cannot approve more participants.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Call the parent action handler
    onAction(participantId, newStatus as 'approve' | 'reject' | 'remove');
  };

  const testApprovalSystem = async () => {
    if (!tripId) {
      toast({
        title: "Error",
        description: "No trip ID provided",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Testing Approval System",
        description: "Checking database connections..."
      });

      // Test database connection first
      const { data: testData, error: testError } = await supabase
        .from('trip_participants')
        .select('id, status, user_id')
        .eq('trip_id', tripId)
        .limit(5);

      if (testError) {
        console.error('Error testing trip_participants:', testError);
        toast({
          title: "Database Error",
          description: testError.message || "Could not access participants table",
          variant: "destructive"
        });
        return;
      }

      // Log what we found
      console.log(`Found ${testData.length} participants for trip ${tripId}:`, testData);
      
      toast({
        title: "Approval System OK",
        description: `Found ${testData.length} participants for this trip`
      });
      
      if (testData.length > 0) {
        // Log the first participant's status
        console.log('Participant status example:', {
          participant_id: testData[0].id,
          status: testData[0].status,
          user_id: testData[0].user_id
        });
      }
    } catch (error) {
      console.error('Error testing approval system:', error);
      toast({
        title: "Test Failed",
        description: "Could not test approval system. See console for details.",
        variant: "destructive"
      });
    }
  };

  if (loading && participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading participants...</p>
      </div>
    );
  }

  const approvedParticipants = participants.filter(p => p.status === 'approved');
  const pendingParticipants = participants.filter(p => p.status === 'pending');
  const rejectedParticipants = participants.filter(p => p.status === 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Participants</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshParticipants}
          disabled={refreshing}
          className="flex items-center gap-1"
        >
          {refreshing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          <span>Refresh</span>
        </Button>
      </div>
      
      {/* Status summary */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="default" className="flex items-center gap-1">
          <UserCheck className="h-3 w-3" />
          <span>Approved: {approvedParticipants.length}/{spots}</span>
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Pending: {pendingParticipants.length}</span>
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <UserX className="h-3 w-3" />
          <span>Rejected: {rejectedParticipants.length}</span>
        </Badge>
      </div>

      {/* Approved Participants */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
          <UserCheck className="w-4 h-4 mr-1 text-green-500" />
          Approved ({approvedParticipants.length}/{spots})
        </h3>
        <div className="space-y-3">
          {approvedParticipants.map((participant) => (
            <div key={participant.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-green-100">
              <Link to={`/profile/${participant.user.username}`} className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={participant.user.profile_image} alt={participant.user.name} />
                  <AvatarFallback>{participant.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{participant.user.name}</p>
                  <p className="text-sm text-gray-500">@{participant.user.username}</p>
                </div>
              </Link>
              
              {/* Allow creator to remove an approved participant */}
              {participant.user_id !== creatorId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleUpdateStatus(participant.id, 'rejected')}
                  disabled={actionLoading === participant.id}
                >
                  {actionLoading === participant.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
          
          {approvedParticipants.length === 0 && (
            <p className="text-center text-gray-500 py-3 text-sm">No approved participants yet</p>
          )}
        </div>
      </div>

      {/* Pending Participants */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
          <Clock className="w-4 h-4 mr-1 text-amber-500" />
          Pending ({pendingParticipants.length})
        </h3>
        <div className="space-y-3">
          {pendingParticipants.map((participant) => (
            <div key={participant.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-amber-100">
              <Link to={`/profile/${participant.user.username}`} className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={participant.user.profile_image} alt={participant.user.name} />
                  <AvatarFallback>{participant.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{participant.user.name}</p>
                  <p className="text-sm text-gray-500">@{participant.user.username}</p>
                </div>
              </Link>
              {participant.user_id !== creatorId && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleUpdateStatus(participant.id, 'approved')}
                    disabled={actionLoading === participant.id || spotsAvailable <= 0}
                  >
                    {actionLoading === participant.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleUpdateStatus(participant.id, 'rejected')}
                    disabled={actionLoading === participant.id}
                  >
                    {actionLoading === participant.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          {pendingParticipants.length === 0 && (
            <p className="text-center text-gray-500 py-3 text-sm">No pending requests</p>
          )}
        </div>
      </div>

      {/* Rejected Participants */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
          <UserX className="w-4 h-4 mr-1 text-red-500" />
          Rejected ({rejectedParticipants.length})
        </h3>
        <div className="space-y-3">
          {rejectedParticipants.map((participant) => (
            <div key={participant.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-red-50 opacity-75">
              <Link to={`/profile/${participant.user.username}`} className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={participant.user.profile_image} alt={participant.user.name} />
                  <AvatarFallback>{participant.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{participant.user.name}</p>
                  <p className="text-sm text-gray-500">@{participant.user.username}</p>
                </div>
              </Link>
              
              {/* Add option to reconsider rejected participants */}
              {participant.user_id !== creatorId && spotsAvailable > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleUpdateStatus(participant.id, 'approved')}
                  disabled={actionLoading === participant.id}
                >
                  {actionLoading === participant.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
          
          {rejectedParticipants.length === 0 && (
            <p className="text-center text-gray-500 py-3 text-sm">No rejected participants</p>
          )}
        </div>
      </div>

      {participants.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No participants yet</p>
          <p className="text-sm text-gray-400">Share your trip to get people to join!</p>
        </div>
      )}

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 mb-2">Debug Tools</p>
          <Button
            variant="outline"
            size="sm"
            onClick={testApprovalSystem}
            className="w-full text-xs"
          >
            Test Approval System
          </Button>
        </div>
      )}
    </div>
  );
};

export default TripParticipants; 