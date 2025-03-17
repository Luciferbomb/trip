import React, { useState, useEffect } from 'react';
import { Settings, Image, MapPin, Instagram, Linkedin, Mail, Phone, User, ChevronRight, Save, Edit, Camera, Loader2, UserPlus, UserMinus, X } from 'lucide-react';
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

const ProfileComponent: React.FC = () => {
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
  
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
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
        navigate('/login');
        return;
      }
      
      setProfileData(userData);
      
      // Check if current user is following this profile
      if (user && userData && user.id !== userData.id) {
        const { data: followData } = await supabase
          .from('user_follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', userData.id)
          .single();
          
        setIsFollowing(!!followData);
      }
      
      // Fetch experiences
      const { data: experienceData, error: expError } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });
        
      if (expError) throw expError;
      setExperiences(experienceData || []);
      
      // Fetch created trips
      const { data: createdTripsData, error: createdTripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('creator_id', userData.id)
        .order('created_at', { ascending: false });
      
      if (createdTripsError) throw createdTripsError;
      setCreatedTrips(createdTripsData || []);
      
      // Fetch joined trips (including pending requests)
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
      
      if (participationsError) throw participationsError;
      
      const joinedTripsData = (participationsData || [])
        .filter(p => p.trips)
        .map(p => ({
          ...p.trips,
          status: p.status
        }));
      
      setJoinedTrips(joinedTripsData);
      
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile. Please try again.',
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
        setProfileData(prev => prev ? {
          ...prev,
          followers_count: prev.followers_count - 1
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
        setProfileData(prev => prev ? {
          ...prev,
          followers_count: prev.followers_count + 1
        } : null);
      }
      
    } catch (error: any) {
      console.error('Error following/unfollowing:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status. Please try again.',
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
      // Fetch updated experiences
      const { data: experienceData, error: expError } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false });
        
      if (expError) throw expError;
      setExperiences(experienceData || []);
      
      // Update profile data to reflect new experiences count
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('experiences_count')
        .eq('id', profileData.id)
        .single();
        
      if (userError) throw userError;
      
      setProfileData(prev => prev ? {
        ...prev,
        experiences_count: userData.experiences_count
      } : null);
      
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

  const renderTripCard = (trip: Trip) => (
    <div
      key={trip.id}
      className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/trips/${trip.id}`)}
    >
      <img
        src={trip.image_url}
        alt={trip.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg">{trip.title}</h3>
        <p className="text-gray-600">{trip.location}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-gray-500">
            {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
          </div>
          {trip.status && (
            <Badge variant={trip.status === 'approved' ? 'default' : 'secondary'}>
              {trip.status}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  // Update the followers dialog content
  const renderFollowersDialog = () => (
    <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Followers ({followers.length})</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {loadingFollowers ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : followers.length === 0 ? (
            <p className="text-center text-gray-500">No followers yet</p>
          ) : (
            followers.map((follower) => (
              <div key={follower.id} className="flex items-center justify-between">
                <Link 
                  to={`/profile/${follower.username}`}
                  className="flex items-center space-x-3"
                  onClick={() => setShowFollowers(false)}
                >
                  <Avatar>
                    <AvatarImage src={follower.profile_image} alt={follower.name} />
                    <AvatarFallback>{follower.name[0]}</AvatarFallback>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Following ({following.length})</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {loadingFollowing ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Profile not found</h1>
            <p className="text-gray-600 mt-2">The profile you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }
  
  const isOwnProfile = user && profileData && user.id === profileData.id;
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-2xl mx-auto p-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-hireyth-main to-hireyth-main/60" />
          
          {/* Profile Info */}
          <div className="p-6 relative">
            {/* Profile Image */}
            <div className="absolute -top-16 left-6">
              <img
                src={profileData?.profile_image}
                alt={profileData?.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
              />
            </div>
            
            {/* Actions */}
            <div className="flex justify-end mb-12">
              {isOwnProfile ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isEditMode) {
                      handleSaveProfile();
                    } else {
                      setIsEditMode(true);
                    }
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isEditMode ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
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
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
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
            </div>
            
            {/* User Info */}
            <div className="space-y-4">
              <div>
                {isEditMode ? (
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="font-bold text-xl mb-1"
                    placeholder="Your name"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{profileData?.name}</h1>
                )}
                <p className="text-gray-600">@{profileData?.username}</p>
              </div>
              
              {/* Location */}
              {isEditMode ? (
                <Input
                  value={editForm.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="mt-2"
                  placeholder="Add your location"
                />
              ) : profileData?.location && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{profileData.location}</span>
                </div>
              )}
              
              {/* Bio */}
              {isEditMode ? (
                <Textarea
                  value={editForm.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Write something about yourself"
                  className="mt-2"
                />
              ) : profileData?.bio && (
                <p className="text-gray-700">{profileData.bio}</p>
              )}
              
              {/* Stats */}
              <div className="flex items-center space-x-6 pt-4 border-t">
                <button
                  className="text-center hover:bg-gray-50 px-4 py-2 rounded-md transition-colors"
                  onClick={() => {
                    setShowFollowers(true);
                    fetchFollowers();
                  }}
                >
                  <div className="text-xl font-bold">{profileData?.followers_count || 0}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </button>
                
                <button
                  className="text-center hover:bg-gray-50 px-4 py-2 rounded-md transition-colors"
                  onClick={() => {
                    setShowFollowing(true);
                    fetchFollowing();
                  }}
                >
                  <div className="text-xl font-bold">{profileData?.following_count || 0}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs Section */}
        <Tabs defaultValue="experiences" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="experiences">
              Experiences ({experiences.length})
            </TabsTrigger>
            <TabsTrigger value="created">
              Created ({createdTrips.length})
            </TabsTrigger>
            <TabsTrigger value="joined">
              Joined ({joinedTrips.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="experiences" className="mt-6">
            <div className="space-y-6">
              {isOwnProfile && (
                <Button
                  onClick={() => setShowAddExperience(true)}
                  className="bg-hireyth-main hover:bg-hireyth-main/90"
                >
                  Add Experience
                </Button>
              )}
              
              {experiences.length === 0 ? (
                <p className="text-center text-gray-600 py-8">
                  No experiences shared yet
                </p>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {experiences.map((exp: Experience) => (
                    <div key={exp.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      {exp.image_url && (
                        <img
                          src={exp.image_url}
                          alt={exp.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{exp.title}</h3>
                            <p className="text-gray-600">{exp.location}</p>
                          </div>
                          {isOwnProfile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExperience(exp.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div 
                          className="mt-2 text-gray-700 cursor-pointer"
                          onClick={(e) => {
                            const target = e.currentTarget;
                            target.classList.toggle('line-clamp-3');
                          }}
                        >
                          <p className="line-clamp-3">{exp.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="created" className="mt-6">
            {createdTrips.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No trips created yet</p>
                {isOwnProfile && (
                  <Button
                    onClick={() => navigate('/create')}
                    className="mt-4 bg-hireyth-main hover:bg-hireyth-main/90"
                  >
                    Create Your First Trip
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {createdTrips.map(renderTripCard)}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="joined" className="mt-6">
            {joinedTrips.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No trips joined yet</p>
                {isOwnProfile && (
                  <Button
                    onClick={() => navigate('/trips')}
                    className="mt-4 bg-hireyth-main hover:bg-hireyth-main/90"
                  >
                    Explore Trips
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {joinedTrips.map(renderTripCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Add Experience Dialog */}
        {isOwnProfile && (
          <AddExperienceDialog
            open={showAddExperience}
            onOpenChange={setShowAddExperience}
            onExperienceAdded={handleExperienceAdded}
            userId={user?.id || ''}
          />
        )}
        
        {/* Followers Dialog */}
        {renderFollowersDialog()}
        
        {/* Following Dialog */}
        {renderFollowingDialog()}
        
        {!username && (
          <Button 
            variant="destructive" 
            className="w-full mt-4"
            onClick={handleLogout}
          >
            Log Out
          </Button>
        )}
        
        <BottomNav />
      </div>
    </div>
  );
};

export default ProfileComponent;
