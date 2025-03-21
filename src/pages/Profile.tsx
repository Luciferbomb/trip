import React, { useState, useEffect, useRef } from 'react';
import { Settings, Image as ImageIcon, MapPin, Instagram, Linkedin, Mail, Phone, User, ChevronRight, Save, Edit, Camera, Loader2, UserPlus, UserMinus, X, Heart, MessageCircle, Globe, Grid, Bookmark, MapIcon, AlertTriangle, RefreshCw, Server, UserX, Home, LogOut, Calendar, Trash2, ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
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

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
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
      setError(null); // Reset error state
      
      let userData;
      
      if (!username && user) {
        // If no username in URL, fetch current user's profile by ID
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        if (!data) {
          setError('Could not find your profile.');
          toast({
            title: 'Error',
            description: 'Could not find your profile.',
            variant: 'destructive'
          });
          return;
        }
        
        userData = data;
      } else if (username) {
        // Fetch profile by username
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single();
          
        if (error) throw error;
        if (!data) {
          setError('Profile not found');
          navigate('/404');
          return;
        }
        
        // If viewing own profile, redirect to /profile
        if (user && data.id === user.id) {
          navigate('/profile');
          return;
        }
        
        userData = data;
      } else {
        // No username and no user - should not happen
        setError('You must be logged in to view profiles');
        navigate('/login');
        return;
      }
      
      // Ensure followers_count and following_count are initialized
      userData = {
        ...userData,
        followers_count: userData.followers_count || 0,
        following_count: userData.following_count || 0
      };
      
      setProfileData(userData);
      
      // Check if current user is following this profile
      if (user && userData && user.id !== userData.id) {
        try {
        const { data: followData } = await supabase
          .from('user_follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', userData.id)
          .single();
          
        setIsFollowing(!!followData);
        } catch (followError) {
          console.error('Error checking follow status:', followError);
          // Failing to check follow status is not critical, continue
        }
      }
      
      // Fetch experiences
      try {
        // First fetch basic experience data without nested counts
      const { data: experienceData, error: expError } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });
        
        if (expError) {
          if (expError.code === '42P01') {
            // Table does not exist error, try to run migrations
            console.error('Experiences table does not exist:', expError);
            // Set empty experiences array to avoid breaking the UI
            setExperiences([]);
            setError('Database setup needed. Please wait while we set up your profile or click "Run Setup" below.');
            
            // Try to run migrations to create the table
            try {
              const { createExperiencesTable, createExperienceLikesTable, createExperienceCommentsTable } = await import('@/lib/migrations');
              
              // Run the functions in sequence
              const experiencesCreated = await createExperiencesTable();
              if (experiencesCreated) {
                console.log('Experiences table created successfully');
                
                // Now try to create the dependent tables
                await createExperienceLikesTable();
                await createExperienceCommentsTable();
                
                // Show success message
                toast({
                  title: 'Setup completed',
                  description: 'Your profile is now ready. Please refresh the page.',
                  duration: 5000,
                });
              } else {
                // Show error message
                toast({
                  title: 'Setup failed',
                  description: 'Could not set up your profile. Please try again later.',
                  variant: 'destructive',
                  duration: 5000,
                });
              }
            } catch (migrationError) {
              console.error('Failed to run migrations:', migrationError);
              setError('Failed to set up your profile. Please try again later.');
            }
          } else {
            console.error('Error fetching experiences:', expError);
            // Just set empty experiences instead of showing an error
            setExperiences([]);
            console.log('Setting experiences to empty array due to fetch error');
          }
        } else {
          // Initialize experiences with zero counts
          let processedExperiences = (experienceData || []).map(exp => ({
            ...exp,
            likes_count: 0,
            comments_count: 0,
            is_liked: false
          }));
          
          // If we have experiences, fetch their likes and comments counts separately
          if (processedExperiences.length > 0) {
            const experienceIds = processedExperiences.map(exp => exp.id);
            
            // Fetch likes counts
            try {
              const { data: likesData, error: likesError } = await supabase
                .from('experience_likes')
                .select('experience_id')
                .in('experience_id', experienceIds);
                
              if (!likesError && likesData) {
                // Count likes per experience
                const likesCountMap = new Map();
                likesData.forEach(like => {
                  const count = likesCountMap.get(like.experience_id) || 0;
                  likesCountMap.set(like.experience_id, count + 1);
                });
                
                // Update likes count
                processedExperiences = processedExperiences.map(exp => ({
                  ...exp,
                  likes_count: likesCountMap.get(exp.id) || 0
                }));
              }
            } catch (likesErr) {
              console.error('Error fetching likes counts:', likesErr);
            }
            
            // Fetch comments counts
            try {
              const { data: commentsData, error: commentsError } = await supabase
                .from('experience_comments')
                .select('experience_id')
                .in('experience_id', experienceIds);
                
              if (!commentsError && commentsData) {
                // Count comments per experience
                const commentsCountMap = new Map();
                commentsData.forEach(comment => {
                  const count = commentsCountMap.get(comment.experience_id) || 0;
                  commentsCountMap.set(comment.experience_id, count + 1);
                });
                
                // Update comments count
                processedExperiences = processedExperiences.map(exp => ({
                  ...exp,
                  comments_count: commentsCountMap.get(exp.id) || 0
                }));
              }
            } catch (commentsErr) {
              console.error('Error fetching comments counts:', commentsErr);
            }
            
            // Check if user has liked any experiences
            if (user) {
              try {
                const { data: userLikes, error: likesError } = await supabase
                  .from('experience_likes')
                  .select('experience_id')
                  .eq('user_id', user.id)
                  .in('experience_id', experienceIds);
                  
                if (!likesError && userLikes) {
                  // Create a set of liked experience IDs for efficient lookup
                  const likedExperienceIds = new Set(userLikes.map(like => like.experience_id));
                  
                  // Mark experiences as liked or not
                  processedExperiences = processedExperiences.map(exp => ({
                    ...exp,
                    is_liked: likedExperienceIds.has(exp.id)
                  }));
                }
              } catch (likesError) {
                console.error('Error fetching user likes:', likesError);
              }
            }
          }
          
          setExperiences(processedExperiences);
        }
      } catch (err) {
        console.error('Unexpected error fetching experiences:', err);
        setExperiences([]);
        // Toast to inform the user
        toast({
          title: 'Error loading experiences',
          description: 'There was an issue loading experiences. Please try refreshing the page.',
          variant: 'destructive',
        });
      }
      
      // Fetch created trips
      try {
      const { data: createdTripsData, error: createdTripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('creator_id', userData.id)
        .order('created_at', { ascending: false });
      
        if (createdTripsError) {
          console.error('Error fetching created trips:', createdTripsError);
          setCreatedTrips([]);
        } else {
      setCreatedTrips(createdTripsData || []);
        }
      } catch (tripsError) {
        console.error('Error fetching created trips:', tripsError);
        setCreatedTrips([]);
      }
      
      // Fetch joined trips (including pending requests)
      try {
      const { data: participationsData, error: participationsError } = await supabase
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
            creator_image
          )
        `)
        .eq('user_id', userData.id) as { data: DatabaseTripParticipation[] | null, error: any };
      
        if (participationsError) {
          console.error('Error fetching joined trips:', participationsError);
          setJoinedTrips([]);
        } else {
      const joinedTripsData = (participationsData || [])
        .filter(p => p.trips)
        .map(p => ({
          ...p.trips,
          status: p.status
        }));
      
      setJoinedTrips(joinedTripsData);
        }
      } catch (joinedTripsError) {
        console.error('Error fetching joined trips:', joinedTripsError);
        setJoinedTrips([]);
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Could not load profile data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load profile data.',
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
      console.error('Error updating profile:', error);
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
        console.error('Error updating profile data:', userErr);
      }
    } catch (error) {
      console.error('Error refreshing experiences:', error);
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
      console.error('Error fetching followers:', error);
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
      console.error('Error fetching following:', error);
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
      console.error('Error removing follower:', error);
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
      console.error('Error unfollowing user:', error);
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
      console.error('Error deleting experience:', error);
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
      console.error('Error liking/unliking experience:', error);
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
      console.error('Error deleting trip:', error);
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
      <div key={trip.id} className="relative group">
        <Link to={`/trips/${trip.id}`} className="block">
          <div className="modern-card bg-white overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
            <div className="relative aspect-[16/9] overflow-hidden gradient-overlay">
              <img
                src={trip.image_url}
                alt={trip.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Creator Info - Overlaid on image */}
              <div className="absolute bottom-4 left-4 flex items-center z-10">
                <img
                  src={trip.creator_image}
                  alt={trip.creator_name}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-md"
                />
                <span className="ml-2 text-white text-sm font-medium">{trip.creator_name}</span>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{trip.title}</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1 text-blue-500" />
                <span>{trip.location}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                <span className="text-sm">
                  {format(new Date(trip.start_date), 'MMM d, yyyy')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                </span>
              </div>
              
              {trip.status && (
                <div className="mt-2">
                  <Badge variant={trip.status === 'approved' ? 'default' : 'secondary'} className="pill-badge">
                    {trip.status}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </Link>
        
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
      console.error('Error logging out:', error);
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
          console.error('Error fetching user locations:', error);
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
              console.error('Failed to add marker:', err);
              // Continue with other markers
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
              console.error('Error in rotation animation:', err);
              cancelAnimationFrame(animationFrameId);
              setMapError(true);
            }
          };
          
          // Start rotation animation
          rotateCamera();
        });
        
        // Handle map errors
        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
          setMapError(true);
        });
      } catch (err) {
        console.error('Error initializing map:', err);
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
        <div className="h-full w-full bg-gradient-to-r from-hireyth-light to-hireyth-main rounded-t-xl overflow-hidden"></div>
      );
    }
    
    return (
      <div 
        ref={mapContainer} 
        className="h-full w-full rounded-t-xl overflow-hidden bg-gray-100"
      />
    );
  };

  // If there's an error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="glassmorphism-card max-w-lg w-full bg-white/95">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-800 mb-2">Error</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 modern-focus"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
            
            {error.includes('Database setup') && (
              <Button 
                variant="sleek"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { createExperiencesTable, createExperienceLikesTable, createExperienceCommentsTable } = await import('@/lib/migrations');
                    
                    await createExperiencesTable();
                    await createExperienceLikesTable();
                    await createExperienceCommentsTable();
                    
                    toast({
                      title: 'Setup completed',
                      description: 'Please refresh the page to see your profile.',
                      duration: 5000,
                    });
                    
                    // Refresh the page after a short delay
                    setTimeout(() => window.location.reload(), 2000);
                  } catch (e) {
                    console.error('Failed to run setup:', e);
                    toast({
                      title: 'Setup failed',
                      description: 'Please try again later.',
                      variant: 'destructive',
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="flex items-center gap-2"
              >
                <Server className="h-4 w-4" />
                Run Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // If profile not found
  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="glassmorphism-card max-w-lg w-full bg-white/95">
          <UserX className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">Profile not found</h3>
          <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist.</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 sleek-button rounded-md hover:shadow-lg transition-all duration-300"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse blur-md opacity-75"></div>
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 relative" />
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  const isOwnProfile = user && profileData && user.id === profileData.id;
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="relative mb-20 sm:mb-24">
            {/* Cover Image with Map Background */}
            <div className="h-48 sm:h-64 rounded-xl overflow-hidden shadow-md relative">
              {profileData && (
                <div className="absolute inset-0 w-full h-full">
                  <ProfileMapBackground userId={profileData.id} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
              )}
            </div>
            
            {/* Profile Image */}
            <div className="absolute -bottom-16 sm:-bottom-20 left-1/2 -translate-x-1/2 shadow-xl rounded-full border-4 border-white bg-white z-10 transition-transform duration-500 hover:scale-105">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-white">
              <img
                src={profileData?.profile_image}
                alt={profileData?.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
              />
              </div>
            </div>
            </div>
          
          {/* User Info */}
          <div className="text-center mb-6">
            {isEditMode ? (
              <Input
                value={editForm.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="font-bold text-xl mb-1 text-center modern-focus"
                placeholder="Your name"
              />
            ) : (
              <h1 className="text-2xl font-bold mb-1 gradient-text">{profileData?.name}</h1>
            )}
            
            <p className="text-gray-500 mb-3">@{profileData?.username}</p>
            
            <div className="flex justify-center space-x-3 text-sm text-gray-500 mb-4">
              {isEditMode ? (
                <Input
                  value={editForm.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="mt-2 max-w-xs mx-auto modern-focus"
                  placeholder="Add your location"
                />
              ) : profileData?.location && (
                <div className="flex items-center">
                  <MapPin size={14} className="mr-1 text-blue-500" />
                  <span>{profileData.location}</span>
                </div>
              )}
            </div>
            
            {/* Bio */}
            {isEditMode ? (
              <div className="mt-4 mb-6 max-w-lg mx-auto">
                <label className="text-sm font-medium text-gray-700 mb-1 block">About</label>
                <Textarea
                  value={editForm.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Write something about yourself..."
                  className="resize-none h-24 modern-focus"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Share a little about yourself, your interests, and your travel style.
                </p>
              </div>
            ) : profileData?.bio ? (
              <div className="max-w-lg mx-auto mb-6 mt-3">
                <div className="glassmorphism-card bg-white hover:shadow-lg transition-all duration-300">
                  <div className="absolute -top-3 left-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full p-1.5 shadow-md">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 pl-1">About</h4>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line pl-1">{profileData.bio}</p>
                </div>
              </div>
            ) : isOwnProfile ? (
              <div className="max-w-lg mx-auto mb-6 mt-3">
                <Button 
                  variant="modern-outline" 
                  className="text-gray-500 hover:text-blue-600 flex items-center text-sm"
                  onClick={() => setIsEditMode(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add bio
                </Button>
              </div>
            ) : null}
            
            {/* Stats */}
            <div className="flex justify-center space-x-6 mb-6">
              <div className="text-center stat-counter">
                <div className="font-bold text-blue-600">{experiences.length}</div>
                <div className="text-xs text-gray-500">Experiences</div>
              </div>
              <button
                className="text-center stat-counter"
                onClick={() => {
                  setShowFollowers(true);
                  fetchFollowers();
                }}
              >
                <div className="font-bold text-blue-600">{profileData?.followers_count ?? 0}</div>
                <div className="text-xs text-gray-500">Followers</div>
              </button>
              <button
                className="text-center stat-counter"
                onClick={() => {
                  setShowFollowing(true);
                  fetchFollowing();
                }}
              >
                <div className="font-bold text-blue-600">{profileData?.following_count ?? 0}</div>
                <div className="text-xs text-gray-500">Following</div>
              </button>
            </div>
            
            {/* Social Links */}
            {isEditMode ? (
              <div className="space-y-2 max-w-md mx-auto mb-6">
                <div className="flex items-center">
                  <span className="text-pink-600 w-6 h-6 mr-2">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                    </svg>
                  </span>
                  <Input
                    value={editForm.instagram || ''}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    placeholder="Instagram username (without @)"
                    className="modern-focus"
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-blue-600 w-6 h-6 mr-2">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
                    </svg>
                  </span>
                  <Input
                    value={editForm.linkedin || ''}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    placeholder="LinkedIn username"
                    className="modern-focus"
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center mb-6">
                {renderSocialLinks()}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-center space-x-3 mb-8">
              {isOwnProfile ? (
                <Button
                  variant={isEditMode ? "modern" : "modern-outline"}
                  size="sm"
                  onClick={() => {
                    if (isEditMode) {
                      handleSaveProfile();
                    } else {
                      setIsEditMode(true);
                    }
                  }}
                  disabled={isSaving}
                  className="flex items-center"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : isEditMode ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant={isFollowing ? "modern-outline" : "modern"}
                  size="sm"
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="flex items-center"
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
              
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              )}
              </div>
            </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="modern-tabs bg-white rounded-lg shadow-sm mb-6 border border-gray-100 p-0.5">
            <button
              className={`modern-tab flex items-center px-4 py-3 text-sm font-medium ${
                activeTab === 'experiences' 
                  ? 'modern-tab-active bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('experiences')}
            >
              <Grid className={`w-4 h-4 mr-2 ${activeTab === 'experiences' ? 'text-blue-500' : ''}`} />
              <span>Experiences</span>
            </button>
            <button
              className={`modern-tab flex items-center px-4 py-3 text-sm font-medium ${
                activeTab === 'created' 
                  ? 'modern-tab-active bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('created')}
            >
              <MapIcon className={`w-4 h-4 mr-2 ${activeTab === 'created' ? 'text-blue-500' : ''}`} />
              <span>Created</span>
            </button>
            <button
              className={`modern-tab flex items-center px-4 py-3 text-sm font-medium ${
                activeTab === 'joined' 
                  ? 'modern-tab-active bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('joined')}
            >
              <Bookmark className={`w-4 h-4 mr-2 ${activeTab === 'joined' ? 'text-blue-500' : ''}`} />
              <span>Joined</span>
            </button>
          </div>
        
          {/* Tab Content */}
          <div>
            {activeTab === 'experiences' && (
              <div className="space-y-6 relative">
                {experiences.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No experiences shared yet</p>
                    {isOwnProfile && (
                      <Button
                        onClick={() => setShowAddExperience(true)}
                        className="mt-4 sleek-button"
                      >
                        Add Your First Experience
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {isOwnProfile && (
                      <div className="flex justify-end mb-6">
                        <Button
                          onClick={() => setShowAddExperience(true)}
                          variant="sleek"
                        >
                          Share Experience
                        </Button>
                      </div>
                    )}
                    <div className="space-y-6">
                  {experiences.map((exp: Experience) => (
                       <div key={exp.id} className="modern-card bg-white">
                          <div className="relative gradient-overlay">
                            {exp.image_url ? (
                        <img
                          src={exp.image_url}
                          alt={exp.title}
                                className="w-full h-56 object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
                                }}
                              />
                            ) : (
                              <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-gray-300" />
                          </div>
                            )}
                            
                            <Badge className="absolute top-3 right-3 pill-badge bg-white/80 text-gray-800 hover:bg-white/90 z-10">
                              Travel
                            </Badge>
                            
                          {isOwnProfile && (
                            <Button
                              variant="ghost"
                                size="icon"
                                className="absolute top-3 left-3 h-8 w-8 rounded-full bg-white/80 hover:bg-white/90 z-10"
                              onClick={() => handleDeleteExperience(exp.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                          <div className="p-4">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{exp.title}</h3>
                              <p className="text-gray-600 flex items-center mt-1">
                                <MapPin className="h-4 w-4 mr-1 text-blue-500" /> {exp.location}
                              </p>
                            </div>
                            <div 
                              className="mt-3 text-gray-700 cursor-pointer"
                              onClick={(e) => {
                                const target = e.currentTarget;
                                target.classList.toggle('line-clamp-3');
                              }}
                            >
                              <p className="line-clamp-3">{exp.description}</p>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                              <div className="flex space-x-2">
                                <p className="text-xs text-gray-500">
                                  {new Date(exp.created_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </p>
                              </div>
                            </div>
                      </div>
                    </div>
                  ))}
                </div>
                  </>
              )}
            </div>
            )}
          
            {activeTab === 'created' && (
              <div>
            {createdTrips.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No trips created yet</p>
                {isOwnProfile && (
                  <Button
                    onClick={() => navigate('/create')}
                    className="mt-4 sleek-button"
                  >
                    Create Your First Trip
                  </Button>
                )}
              </div>
            ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {createdTrips.map(renderTripCard)}
              </div>
            )}
              </div>
            )}
          
            {activeTab === 'joined' && (
              <div>
            {joinedTrips.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No trips joined yet</p>
                {isOwnProfile && (
                  <Button
                    onClick={() => navigate('/trips')}
                    className="mt-4 sleek-button"
                  >
                    Explore Trips
                  </Button>
                )}
              </div>
            ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {joinedTrips.map(renderTripCard)}
              </div>
            )}
              </div>
            )}
          </div>
        </div>
        
        {/* Add Experience Dialog */}
        {isOwnProfile && (
          <AddExperienceDialog
            isOpen={showAddExperience}
            onClose={() => setShowAddExperience(false)}
            onExperienceAdded={handleExperienceAdded}
          />
        )}
        
        {/* Followers Dialog */}
        {renderFollowersDialog()}
        
        {/* Following Dialog */}
        {renderFollowingDialog()}
        
        <BottomNav />
      </div>
    </div>
  );
};

export default Profile;
