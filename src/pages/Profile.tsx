import React, { useState, useEffect, useRef } from 'react';
import { Settings, Image as ImageIcon, MapPin, Instagram, Linkedin, Mail, Phone, User, ChevronRight, Save, Edit, Camera, Loader2, UserPlus, UserMinus, X, Heart, MessageCircle, Globe, Grid, Bookmark, MapIcon, AlertTriangle, RefreshCw, Server, UserX, Home, LogOut, Calendar, Trash2, ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BottomNav } from '@/components/BottomNav';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import AddExperienceDialog from '@/components/AddExperienceDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { format } from 'date-fns';
import VerificationBadge from '@/components/VerificationBadge';
import InlineVerifiedBadge from '@/components/InlineVerifiedBadge';
import { BackgroundGradient } from "@/components/ui/background-gradient";

interface UserProfile {
  id: string;
  name: string;
  location: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  profile_image: string;
  bio: string | null;
  instagram: string | null;
  linkedin: string | null;
  experiences_count: number;
  followers_count: number;
  following_count: number;
  username: string;
  is_verified?: boolean;
  verification_reason?: string;
}

interface Follower {
  id: string;
  name: string;
  username: string;
  profile_image: string;
}

interface Trip {
  id: string;
  title: string;
  location: string;
  image_url: string;
  start_date: string;
  end_date: string;
  spots: number;
  creator_name: string;
  creator_image: string;
  creator_id?: string;  // Make creator_id optional
  status?: string;
}

interface DatabaseTripParticipation {
  status: string;
  trips: {
    id: string;
    title: string;
    location: string;
    image_url: string;
    start_date: string;
    end_date: string;
    spots: number;
    creator_name: string;
    creator_image: string;
    creator_id: string;
  };
}

interface Experience {
  id: string;
  title: string;
  location: string;
  description: string;
  image_url: string | null;
  user_id: string;
  created_at: string;
  user: {
    name: string;
    profile_image: string;
    username: string;
  };
}

interface Comment {
  id: string;
  experience_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    name: string;
    profile_image: string;
    username: string;
  };
}

interface DatabaseFollowerResponse {
  follower: {
    id: string;
    name: string;
    username: string;
    profile_image: string;
  };
}

interface DatabaseFollowingResponse {
  following: {
    id: string;
    name: string;
    username: string;
    profile_image: string;
  };
}

// Set Mapbox access token
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 pb-20">
    <BottomNav />
    <div className="flex flex-col items-center justify-center pt-20 h-[60vh]">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full blur-sm opacity-70"></div>
        <Avatar className="h-32 w-32 border-4 border-white relative">
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500">
            <User className="h-12 w-12 text-white" />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="mt-6 text-center">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
        <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mx-auto"></div>
      </div>
    </div>
  </div>
);

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [createdTrips, setCreatedTrips] = useState<Trip[]>([]);
  const [joinedTrips, setJoinedTrips] = useState<Trip[]>([]);
  const [activeTab, setActiveTab] = useState('experiences');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add a computed property for checking if this is the user's own profile
  const isOwnProfile = user !== null && profileData !== null && user.id === profileData.id;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfileData();
  }, [username, user]);

  useEffect(() => {
    if (profileData) {
      setEditForm({
        name: profileData.name,
        location: profileData.location,
        phone: profileData.phone,
        gender: profileData.gender,
        bio: profileData.bio,
        instagram: profileData.instagram,
        linkedin: profileData.linkedin,
      });
    }
  }, [profileData]);
  
  // Add real-time subscription for follower count updates
  useEffect(() => {
    if (!profileData?.id) return;

    // Subscribe to changes in the user_follows table
    const channel = supabase
      .channel('follow-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `following_id=eq.${profileData.id}`
        },
        async () => {
          // Fetch updated counts
          const { data, error } = await supabase
            .from('users')
            .select('followers_count, following_count')
            .eq('id', profileData.id)
            .single();
            
          if (!error && data) {
            setProfileData(prev => prev ? {
              ...prev,
              followers_count: data.followers_count,
              following_count: data.following_count
            } : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileData?.id]);
  
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!username && !user?.id) {
        setError('User not logged in or username not provided');
          toast({
            title: 'Error',
          description: 'Please log in to view profiles',
            variant: 'destructive'
          });
          return;
        }
        
      // Determine query parameter (username or id)
      const queryParam = username ? 'username' : 'id';
      const queryValue = username || user?.id;
      
      // Use a single query to fetch user data with all related counts
      const { data: userData, error: userError } = await supabase
          .from('users')
        .select(`
          id, name, username, email, phone, gender, location, profile_image, 
          bio, instagram, linkedin, experiences_count, followers_count, 
          following_count, is_verified, verification_reason
        `)
        .eq(queryParam, queryValue)
          .single();
          
      if (userError) {
        if (userError.code === 'PGRST116') {
          setError('Profile not found');
          toast({
            title: 'Not Found',
            description: 'The requested profile could not be found.',
            variant: 'destructive'
          });
        } else {
          setError(userError.message);
          toast({
            title: 'Error',
            description: 'Failed to load profile data. Try refreshing the page.',
            variant: 'destructive'
          });
        }
          return;
        }
        
      if (!userData) {
        setError('Could not find profile.');
        toast({
          title: 'Error',
          description: 'Could not find profile.',
          variant: 'destructive'
        });
        return;
      }
      
      // Initialize counts to zero if they're null
      const userDataWithCounts = {
        ...userData,
        followers_count: userData.followers_count || 0,
        following_count: userData.following_count || 0,
        experiences_count: userData.experiences_count || 0
      };
      
      setProfileData(userDataWithCounts);

      // Fetch all related data in parallel for better performance
      try {
        const [experiencesResult, createdTripsResult, participationsResult, followStatusResult] = await Promise.all([
          // Get experiences
          supabase
        .from('experiences')
        .select('*')
        .eq('user_id', userDataWithCounts.id)
            .order('created_at', { ascending: false }),

          // Get created trips
          supabase
        .from('trips')
        .select('*')
        .eq('creator_id', userDataWithCounts.id)
            .order('created_at', { ascending: false }),

          // Get trips the user has joined
          supabase
        .from('trip_participants')
        .select(`
          status,
          trips (
            id,
            title,
            location,
            image_url,
            start_date,
            end_date,
            spots,
            creator_name,
                creator_image,
                creator_id
              )
            `)
            .eq('user_id', userDataWithCounts.id),

          // Check if the current user follows this profile
          user && userDataWithCounts.id !== user.id ? 
            supabase
              .from('user_follows')
              .select('*')
              .eq('follower_id', user.id)
              .eq('following_id', userDataWithCounts.id)
              .maybeSingle() : 
            Promise.resolve({ data: null })
        ]);

        // Handle experiences
        if (experiencesResult.error) throw experiencesResult.error;
        setExperiences(experiencesResult.data || []);

        // Handle created trips
        if (createdTripsResult.error) throw createdTripsResult.error;
        setCreatedTrips(createdTripsResult.data || []);

        // Handle joined trips
        if (participationsResult.error) throw participationsResult.error;
        const participationsData = participationsResult.data as unknown as DatabaseTripParticipation[];
        
        const joinedTripsData = participationsData
          .filter(p => p.trips) // Ensure trips exist
        .map(p => ({
            id: p.trips.id,
            title: p.trips.title,
            location: p.trips.location,
            image_url: p.trips.image_url,
            start_date: p.trips.start_date,
            end_date: p.trips.end_date,
            spots: p.trips.spots,
            creator_name: p.trips.creator_name,
            creator_image: p.trips.creator_image,
            creator_id: p.trips.creator_id,
          status: p.status
        }));
      
      setJoinedTrips(joinedTripsData);

        // Handle follow status
        setIsFollowing(!!followStatusResult.data);
        
      } catch (fetchError: any) {
        // Don't show an error toast here since we already have the basic profile data
        // Just log it to console
      }

    } catch (error: any) {
      setError(error.message || 'Failed to load profile');
      toast({
        title: 'Error',
        description: 'Failed to load profile data. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profileData) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('users')
        .update({
          name: editForm.name,
          location: editForm.location,
          phone: editForm.phone,
          gender: editForm.gender,
          bio: editForm.bio,
          instagram: editForm.instagram?.replace('@', ''),
          linkedin: editForm.linkedin,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setProfileData(prev => prev ? {
        ...prev,
        ...editForm,
        instagram: editForm.instagram?.replace('@', '')
      } : null);
      
      setIsEditMode(false);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully!'
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleFollow = async () => {
    if (!user || !profileData) return;
    
    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id);
          
        if (error) throw error;
        
        setIsFollowing(false);
        // Update local state immediately for better UX
        setProfileData(prev => prev ? {
          ...prev,
          followers_count: Math.max(0, (prev.followers_count || 0) - 1)
        } : null);
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: profileData.id
          });
          
        if (error) throw error;
        
        setIsFollowing(true);
        // Update local state immediately for better UX
        setProfileData(prev => prev ? {
          ...prev,
          followers_count: (prev.followers_count || 0) + 1
        } : null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive'
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExperienceAdded = async () => {
    if (!profileData) return;
    
    try {
      // Fetch basic experience data
      const { data: experienceData, error: expError } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });
        
      if (expError) throw expError;
      
      // Handle no experiences case
      if (!experienceData || experienceData.length === 0) {
        setExperiences([]);
        return;
      }
      
      // Set the experiences state
      setExperiences(experienceData);
      
      // Update profile data with latest experience count
      try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('experiences_count')
        .eq('id', profileData.id)
        .single();
        
        if (!userError && userData) {
          setProfileData(prevData => ({
            ...prevData!,
        experiences_count: userData.experiences_count
          }));
        }
      } catch (userErr) {
        toast({
          title: 'Notice',
          description: 'Unable to update experience count',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh experiences',
        variant: 'destructive'
      });
    }
  };

  const fetchFollowers = async () => {
    if (!profileData) return;
    
    try {
      setLoadingFollowers(true);
      
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          follower:users!user_follows_follower_id_fkey (
            id,
            name,
            username,
            profile_image
          )
        `)
        .eq('following_id', profileData.id)
        .order('created_at', { ascending: false }) as { data: DatabaseFollowerResponse[] | null, error: any };
        
      if (error) throw error;
      
      const followers = (data || []).map(item => ({
        id: item.follower.id,
        name: item.follower.name,
        username: item.follower.username,
        profile_image: item.follower.profile_image
      })) as Follower[];
      
      setFollowers(followers);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load followers',
        variant: 'destructive'
      });
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    if (!profileData) return;
    
    try {
      setLoadingFollowing(true);
      
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          following:users!user_follows_following_id_fkey (
            id,
            name,
            username,
            profile_image
          )
        `)
        .eq('follower_id', profileData.id)
        .order('created_at', { ascending: false }) as { data: DatabaseFollowingResponse[] | null, error: any };
        
      if (error) throw error;
      
      const following = (data || []).map(item => ({
        id: item.following.id,
        name: item.following.name,
        username: item.following.username,
        profile_image: item.following.profile_image
      })) as Follower[];
      
      setFollowing(following);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load following users',
        variant: 'destructive'
      });
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!profileData) return;
    
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', profileData.id);
        
      if (error) throw error;
      
      // Update local state
      setFollowers(prev => prev.filter(f => f.id !== followerId));
      setProfileData(prev => prev ? {
        ...prev,
        followers_count: prev.followers_count - 1
      } : null);
      
      toast({
        title: 'Success',
        description: 'Follower removed'
      });
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove follower',
        variant: 'destructive'
      });
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!user || !profileData) return;
    
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', profileData.id)
        .eq('following_id', userId);
        
      if (error) throw error;
      
      // Update local state
      setFollowing(prev => prev.filter(f => f.id !== userId));
      setProfileData(prev => prev ? {
        ...prev,
        following_count: prev.following_count - 1
      } : null);
      
      toast({
        title: 'Success',
        description: 'Unfollowed successfully'
      });
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unfollow user',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteExperience = async (experienceId: string) => {
    if (!user || !profileData) return;
    
    try {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', experienceId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setExperiences(prev => prev.filter(exp => exp.id !== experienceId));
      
      toast({
        title: 'Success',
        description: 'Experience deleted successfully'
      });
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete experience',
        variant: 'destructive'
      });
    }
  };

  const handleLikeExperience = async (experienceId: string, isLiked: boolean) => {
    if (!user) return;
    
    try {
      if (isLiked) {
        // Unlike the experience
        const { error } = await supabase
          .from('experience_likes')
          .delete()
          .eq('experience_id', experienceId)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        // Update local state
        setExperiences(prev => 
          prev.map(exp => 
            exp.id === experienceId 
              ? { ...exp } 
              : exp
          )
        );
      } else {
        // Like the experience
        const { error } = await supabase
          .from('experience_likes')
          .insert({
            experience_id: experienceId,
            user_id: user.id
          });
          
        if (error) throw error;
        
        // Update local state
        setExperiences(prev => 
          prev.map(exp => 
            exp.id === experienceId 
              ? { ...exp } 
              : exp
          )
        );
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTrip = async (tripId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this trip?')) return;
    
    try {
      // Delete trip participants first (due to foreign key constraint)
      const { error: participantsError } = await supabase
        .from('trip_participants')
        .delete()
        .eq('trip_id', tripId);
      
      if (participantsError) throw participantsError;
      
      // Delete the trip
      const { error: tripError } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
        .eq('creator_id', user?.id); // Ensure only creator can delete
      
      if (tripError) throw tripError;
      
      // Update local state to remove the deleted trip
      setCreatedTrips(trips => trips.filter(t => t.id !== tripId));
      
      toast({
        title: 'Success',
        description: 'Trip deleted successfully',
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete trip',
        variant: 'destructive'
      });
    }
  };

  const renderTripCard = (trip: Trip) => {
    const isOwner = user?.id === trip.creator_id;
    
    return (
      <BackgroundGradient key={trip.id} className="rounded-[22px] bg-white dark:bg-zinc-900">
        <div 
          className="overflow-hidden cursor-pointer relative"
          onClick={() => navigate(`/trips/${trip.id}`)}
        >
          <div className="relative h-48 w-full overflow-hidden rounded-t-[18px]">
            {trip.image_url ? (
              <img 
                src={trip.image_url} 
                alt={trip.title} 
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                <MapPin className="h-12 w-12 text-purple-300" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
              <h3 className="text-lg font-semibold text-white">{trip.title}</h3>
              <div className="flex items-center gap-1 text-white/90">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm">{trip.location}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-gray-200">
                  <AvatarImage 
                    src={trip.creator_image} 
                    alt={trip.creator_name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-600 text-white">
                    {trip.creator_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{trip.creator_name}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(trip.start_date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              
              {trip.status && (
                <Badge variant={trip.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                  {trip.status}
                </Badge>
              )}
            </div>
          </div>
          
          {isOwner && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-500/90 hover:bg-red-600 rounded-full h-8 w-8 p-0"
                onClick={(e) => handleDeleteTrip(trip.id, e)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </BackgroundGradient>
    );
  };

  // Update the followers dialog content
  const renderFollowersDialog = () => (
    <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
      <DialogContent className="glassmorphism-card max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text text-center text-xl">Followers ({followers.length})</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {loadingFollowers ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : followers.length === 0 ? (
            <p className="text-center text-gray-500">No followers yet</p>
          ) : (
            followers.map((follower) => (
            <div key={follower.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 transition-colors">
              <Link 
                to={`/profile/${follower.username}`}
                className="flex items-center space-x-3"
                onClick={() => setShowFollowers(false)}
              >
                  <Avatar className="border-2 border-white shadow-sm">
                    <AvatarImage src={follower.profile_image} alt={follower.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">{follower.name[0]}</AvatarFallback>
                  </Avatar>
                <div>
                  <p className="font-medium">{follower.name}</p>
                  <p className="text-sm text-gray-500">@{follower.username}</p>
                </div>
              </Link>
            </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Update the following dialog content
  const renderFollowingDialog = () => (
    <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
      <DialogContent className="glassmorphism-card max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text text-center text-xl">Following ({following.length})</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {loadingFollowing ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : following.length === 0 ? (
            <p className="text-center text-gray-500">Not following anyone yet</p>
          ) : (
            following.map((follow) => (
            <div key={follow.id} className="flex items-center justify-between">
              <Link 
                to={`/profile/${follow.username}`}
                className="flex items-center space-x-3"
                onClick={() => setShowFollowing(false)}
              >
                  <Avatar>
                    <AvatarImage src={follow.profile_image} alt={follow.name} />
                    <AvatarFallback>{follow.name[0]}</AvatarFallback>
                  </Avatar>
                <div>
                  <p className="font-medium">{follow.name}</p>
                  <p className="text-sm text-gray-500">@{follow.username}</p>
                </div>
              </Link>
            </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive'
      });
    }
  };

  const renderSocialLinks = () => {
    if (!profileData) return null;

    return (
      <div className="flex gap-3 mt-3">
        {profileData.instagram && (
          <a
            href={`https://instagram.com/${profileData.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:text-pink-700 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
            </svg>
            <span>Instagram</span>
          </a>
        )}
        
        {profileData.linkedin && (
          <a
            href={`https://linkedin.com/in/${profileData.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>LinkedIn</span>
          </a>
        )}
      </div>
    );
  };

  // Add a function to render the profile map
  const ProfileMapBackground = ({ userId }: { userId: string }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [locations, setLocations] = useState<[number, number][]>([]);
    const [mapError, setMapError] = useState<boolean>(false);
    const [mapLoading, setMapLoading] = useState<boolean>(true);
    
    // Reset states when userId changes
    useEffect(() => {
      setMapError(false);
      setMapLoading(true);
      setLocations([]);
      
      // Cleanup previous map instance
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    }, [userId]);
    
    useEffect(() => {
      // Fetch locations visited by user
      const fetchUserLocations = async () => {
        try {
          const { data, error } = await supabase
            .from('experiences')
            .select('location')
            .eq('user_id', userId);
            
          if (error) throw error;
          
          // Sample locations for demonstration
          const sampleLocationsMap: Record<string, [number, number]> = {
            'New York': [-74.0060, 40.7128],
            'Los Angeles': [-118.2437, 34.0522],
            'London': [-0.1278, 51.5074],
            'Paris': [2.3522, 48.8566],
            'Tokyo': [139.6503, 35.6762],
            'Sydney': [151.2093, -33.8688],
            'Rio de Janeiro': [-43.1729, -22.9068],
            'Cape Town': [18.4241, -33.9249],
            'Mumbai': [72.8777, 19.0760],
            'Dubai': [55.2708, 25.2048],
            'Berlin': [13.4050, 52.5200],
            'Mexico City': [-99.1332, 19.4326],
            'Singapore': [103.8198, 1.3521],
            'Barcelona': [2.1734, 41.3851],
            'Rome': [12.4964, 41.9028],
            'Amsterdam': [4.9041, 52.3676],
            'Hong Kong': [114.1694, 22.3193],
            'Bali': [115.0920, -8.3405],
            'Santorini': [25.4615, 36.3932],
            'Kyoto': [135.7681, 35.0116]
          };
          
          // Match experiences to sample locations or generate random ones
          const coords: [number, number][] = [];
          
          if (data && data.length > 0) {
            data.forEach(exp => {
              if (exp.location) {
                // Try to match by name
                const locationMatch = Object.keys(sampleLocationsMap).find(
                  loc => exp.location.toLowerCase().includes(loc.toLowerCase())
                );
                
                if (locationMatch) {
                  coords.push(sampleLocationsMap[locationMatch]);
                }
              }
            });
          }
          
          // If we don't have at least 3 points, add some defaults
          if (coords.length < 3) {
            const defaultLocations = Object.values(sampleLocationsMap).slice(0, 5);
            coords.push(...defaultLocations);
          }
          
          setLocations(coords);
        } catch (error) {
          // Set some default locations
          setLocations([
            [-74.0060, 40.7128], // New York
            [2.3522, 48.8566],   // Paris
            [139.6503, 35.6762]  // Tokyo
          ]);
        } finally {
          setMapLoading(false);
        }
      };
      
      // Start fetching locations immediately
      fetchUserLocations();
    }, [userId]);
    
    useEffect(() => {
      if (!mapContainer.current || locations.length === 0 || mapLoading) return;
      
      try {
        // Check if map already exists - cleanup first
        if (map.current) {
          map.current.remove();
          map.current = null;
        }

        // Initialize map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: locations[0],
          zoom: 1.8,
          projection: 'globe',
          interactive: false, // Disable interaction
          attributionControl: false,
          bearing: 30, // Add slight rotation for visual interest
          pitch: 20,  // Add slight tilt for better 3D effect
          fadeDuration: 0 // Prevent fade-in animation
        });
        
        // Add atmosphere and styling
        map.current.on('load', () => {
          if (!map.current) return;
          
          // Add atmosphere layer
          map.current.setFog({
            color: 'rgb(220, 230, 240)',
            'high-color': 'rgb(36, 92, 223)',
            'horizon-blend': 0.1,
            'space-color': 'rgb(11, 11, 25)',
            'star-intensity': 0.6
          });
          
          // Add markers for each location
          locations.forEach((loc) => {
            const el = document.createElement('div');
            el.className = 'location-marker';
            el.style.backgroundColor = '#E63946';
            el.style.width = '12px';
            el.style.height = '12px';
            el.style.borderRadius = '50%';
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
            
            try {
              new mapboxgl.Marker(el).setLngLat(loc).addTo(map.current!);
            } catch (err) {
              // Silently ignore marker errors
            }
          });
          
          // Auto-rotate the camera for a dynamic effect
          let animationFrameId: number;
          const rotateCamera = () => {
            if (!map.current) return;
            
            try {
              const center = map.current.getCenter();
              center.lng -= 0.1; // Rotate speed
              map.current.easeTo({
                center,
                duration: 100,
                easing: (t) => t
              });
              
              // Request next frame
              animationFrameId = requestAnimationFrame(rotateCamera);
            } catch (err) {
              cancelAnimationFrame(animationFrameId);
              setMapError(true);
            }
          };
          
          // Start rotation animation
          rotateCamera();
        });
        
        // Handle map errors
        map.current.on('error', (e) => {
          setMapError(true);
        });
      } catch (err) {
        setMapError(true);
      }
      
      // Cleanup when component unmounts
      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    }, [locations, mapLoading]);
    
    // If there's an error or map is still loading, return a gradient background instead
    if (mapError || mapLoading) {
      return (
        <div className="h-full w-full bg-gradient-to-r from-hireyth-light to-hireyth-main rounded-t-xl overflow-hidden relative">
          {mapLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div 
        ref={mapContainer} 
        className="h-full w-full rounded-t-xl overflow-hidden bg-gray-100"
      />
    );
  };

  const renderExperienceCard = (experience: Experience) => {
    const isOwner = user?.id === experience.user_id;
    
    return (
      <BackgroundGradient key={experience.id} className="rounded-[22px] bg-white dark:bg-zinc-900">
        <div 
          className="overflow-hidden cursor-pointer relative"
          onClick={() => navigate(`/experiences/${experience.id}`)}
        >
          <div className="relative h-48 w-full overflow-hidden rounded-t-[18px]">
            {experience.image_url ? (
              <img 
                src={experience.image_url} 
                alt={experience.title} 
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                <MapPin className="h-12 w-12 text-purple-300" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
              <h3 className="text-lg font-semibold text-white">{experience.title}</h3>
              <div className="flex items-center gap-1 text-white/90">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm">{experience.location}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <p className="mb-3 line-clamp-2 text-sm text-gray-600">{experience.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-gray-200">
                  {experience.user?.profile_image ? (
                    <AvatarImage 
                      src={experience.user.profile_image} 
                      alt={experience.user.name}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-600 text-white">
                      {experience.user?.name ? experience.user.name[0] : '?'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{experience.user?.name || 'Unknown User'}</p>
                  <span className="text-xs text-gray-500">
                    {format(new Date(experience.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteExperience(experience.id);
                }}
              >
                View details
              </Button>
            </div>
          </div>
          
          {isOwner && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-500/90 hover:bg-red-600 rounded-full h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteExperience(experience.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </BackgroundGradient>
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <BottomNav />
        <div className="flex flex-col items-center justify-center pt-20 h-[60vh] px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Could Not Load Profile</h2>
            <p className="text-gray-600 mb-6">{error || 'Profile data not found'}</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => fetchProfileData()} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main profile content
  return (
    <div className="min-h-screen bg-white pb-24">
      <BottomNav />
      
      {/* Updated profile header with brand gradient colors */}
      <div className="relative">
        {/* Gradient header background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/90 to-indigo-600/90 h-48"></div>
        
        {/* Profile info section */}
        <div className="container max-w-4xl mx-auto px-4 relative pt-6">
          <div className="bg-white rounded-xl shadow-md p-6 mt-20">
            <div className="flex flex-col items-center md:flex-row md:items-start relative">
              {/* Avatar with brand border */}
              <div className="absolute -top-20 md:-top-16 md:relative md:mr-6">
                <div className="rounded-full h-32 w-32 relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full blur-sm opacity-70"></div>
                  <Avatar className="h-32 w-32 border-4 border-white relative">
                    {profileData?.profile_image ? (
                      <AvatarImage 
                        src={profileData.profile_image} 
                        alt={profileData.name}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white text-xl">
                        {profileData?.name ? profileData.name[0] : <User className="h-12 w-12 text-white" />}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              </div>
          
              {/* User information */}
              <div className="text-center md:text-left mt-14 md:mt-0 flex-1">
                <div className="flex items-center justify-center md:justify-start">
                  <h1 className="text-2xl font-bold">{profileData?.name}</h1>
                  {profileData?.is_verified && (
                    <InlineVerifiedBadge className="ml-2" />
              )}
            </div>
            
                <div className="flex items-center justify-center md:justify-start mt-1 text-gray-600">
                  <p>@{profileData?.username}</p>
              </div>
                
                {profileData?.location && (
                  <div className="flex items-center justify-center md:justify-start mt-1 text-gray-500">
                    <MapPin className="h-4 w-4 mr-1 text-purple-500" />
                    <p>{profileData.location}</p>
              </div>
                )}
                
                <div className="flex justify-center md:justify-start items-center mt-3 space-x-1">
                {renderSocialLinks()}
              </div>
              </div>
            
              {/* Follow/Edit button */}
              <div className="mt-4 md:mt-0 w-full md:w-auto flex justify-center md:justify-end">
              {isOwnProfile ? (
                <Button
                    variant="brand-outline"
                    className="w-40"
                    onClick={() => setIsEditMode(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                </Button>
              ) : (
                <Button
                    variant={isFollowing ? "brand-outline" : "brand"}
                    className="w-40"
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isFollowing ? (
                      <UserMinus className="mr-2 h-4 w-4" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}
              </div>
                </div>
            
            {/* Bio */}
            {profileData?.bio && (
              <div className="mt-6 px-4 py-2 bg-gray-50 rounded-md">
                <p className="text-gray-600">
                  {profileData.bio}
                </p>
        </div>
            )}
        
            {/* Stats */}
            <div className="mt-6 flex justify-center md:justify-start space-x-8">
                <button
                onClick={() => setShowFollowers(true)}
                className="flex flex-col items-center hover:text-purple-600 transition-colors"
              >
                <span className="text-xl font-semibold">{profileData?.followers_count || 0}</span>
                <span className="text-sm text-gray-500">Followers</span>
                </button>
              
                <button
                onClick={() => setShowFollowing(true)}
                className="flex flex-col items-center hover:text-purple-600 transition-colors"
              >
                <span className="text-xl font-semibold">{profileData?.following_count || 0}</span>
                <span className="text-sm text-gray-500">Following</span>
                </button>
              
              <div className="flex flex-col items-center">
                <span className="text-xl font-semibold">{experiences.length}</span>
                <span className="text-sm text-gray-500">Experiences</span>
              </div>
            </div>
          </div>
        </div>
        </div>
        
      {/* Content tabs with updated styling */}
      <div className="container max-w-4xl mx-auto px-4 mt-6">
        <Tabs 
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-lg p-1">
            <TabsTrigger 
              value="experiences"
              className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Grid className="h-4 w-4 mr-2" /> 
              Experiences
            </TabsTrigger>
            <TabsTrigger 
              value="created"
              className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <MapIcon className="h-4 w-4 mr-2" /> 
              Created Trips
            </TabsTrigger>
            <TabsTrigger 
              value="joined"
              className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Bookmark className="h-4 w-4 mr-2" /> 
              Joined Trips
            </TabsTrigger>
          </TabsList>
          
          {/* Experience tab content */}
          <TabsContent value="experiences" className="mt-6">
              {isOwnProfile && (
              <div className="mb-6">
                <Button
                  variant="brand"
                  onClick={() => setShowAddExperience(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Experience
                </Button>
                  </div>
            )}
            
            {experiences.length === 0 ? (
              <div className="text-center py-10 bg-purple-50 rounded-lg border border-purple-100">
                <Grid className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">No experiences shared yet</h3>
                <p className="text-gray-600">
                  {isOwnProfile
                    ? "Share your travel experiences with others"
                    : `${profileData?.name} hasn't shared any experiences yet`}
                </p>
                {isOwnProfile && (
                  <Button
                    variant="brand"
                    className="mt-4"
                    onClick={() => setShowAddExperience(true)}
                  >
                    Share Your First Experience
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {experiences.map((exp) => renderExperienceCard(exp))}
              </div>
            )}
          </TabsContent>
          
          {/* Created Trips tab content with updated styling */}
          <TabsContent value="created" className="mt-6">
            {createdTrips.length === 0 ? (
              <div className="text-center py-10 bg-purple-50 rounded-lg border border-purple-100">
                <MapIcon className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">No created trips</h3>
                <p className="text-gray-600">
                  {isOwnProfile
                    ? "Create a trip to invite others to join you"
                    : `${profileData?.name} hasn't created any trips yet`}
                </p>
                {isOwnProfile && (
                  <Button
                    variant="brand"
                    className="mt-4"
                    onClick={() => navigate('/create')}
                  >
                    Create Your First Trip
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {createdTrips.map((trip) => renderTripCard(trip))}
              </div>
            )}
          </TabsContent>
          
          {/* Joined Trips tab content with updated styling */}
          <TabsContent value="joined" className="mt-6">
            {joinedTrips.length === 0 ? (
              <div className="text-center py-10 bg-purple-50 rounded-lg border border-purple-100">
                <Bookmark className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-800 mb-1">No joined trips</h3>
                <p className="text-gray-600">
                  {isOwnProfile
                    ? "Join trips created by other travelers"
                    : `${profileData?.name} hasn't joined any trips yet`}
                </p>
                {isOwnProfile && (
                  <Button
                    variant="brand"
                    className="mt-4"
                    onClick={() => navigate('/explore')}
                  >
                    Explore Trips
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {joinedTrips.map((trip) => renderTripCard(trip))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>
        
        {/* Add Experience Dialog */}
          <AddExperienceDialog
        open={showAddExperience}
        onOpenChange={setShowAddExperience}
            onExperienceAdded={handleExperienceAdded}
          />
      
      {/* Edit Profile Dialog - with brand colors */}
      {isEditMode && (
        <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Edit Your Profile
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={editForm.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="form-input border-purple-200 focus:border-purple-500"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={editForm.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="form-textarea min-h-32 border-purple-200 focus:border-purple-500"
                />
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="location"
                    name="location"
                    placeholder="City, Country"
                    value={editForm.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="form-input pl-9 border-purple-200 focus:border-purple-500"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="instagram">Instagram (Optional)</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="instagram"
                    name="instagram"
                    placeholder="Your Instagram username"
                    value={editForm.instagram || ''}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    className="form-input pl-9 border-purple-200 focus:border-purple-500"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="linkedin">LinkedIn (Optional)</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="linkedin"
                    name="linkedin"
                    placeholder="Your LinkedIn profile URL"
                    value={editForm.linkedin || ''}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    className="form-input pl-9 border-purple-200 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditMode(false)}
              >
                Cancel
              </Button>
              <Button
                variant="brand"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
        
        {/* Followers Dialog */}
        {renderFollowersDialog()}
        
        {/* Following Dialog */}
        {renderFollowingDialog()}
    </div>
  );
};

export default Profile;
