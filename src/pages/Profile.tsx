import React, { useState, useEffect, useRef } from 'react';
import { Settings, Image, MapPin, Instagram, Linkedin, Mail, Phone, User, ChevronRight, Save, Edit, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AppHeader from '@/components/AppHeader';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface UserProfile {
  id: string;
  name: string;
  location: string;
  email: string;
  phone: string;
  gender: string;
  profileImage: string;
  tripsCount: number;
  experiencesCount: number;
  bio: string;
  social: {
    instagram: string;
    linkedin: string;
  };
  trips: any[];
}

const Profile = () => {
  const { userId } = useParams();
  const [isOwnProfile] = useState(!userId);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        // Check if the users table exists
        const { data: tableExists } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        if (tableExists && tableExists.length > 0) {
          // Fetch user data from Supabase
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId || 'user123')
            .single();
          
          if (error) {
            console.error('Error fetching user:', error);
            setUserProfile(mockUser);
          } else if (data) {
            // Transform Supabase data to match our UserProfile interface
            const userTrips = await fetchUserTrips(data.id);
            
            setUserProfile({
              id: data.id,
              name: data.name,
              location: data.location,
              email: data.email,
              phone: data.phone,
              gender: data.gender,
              profileImage: data.profile_image,
              tripsCount: userTrips.length,
              experiencesCount: data.experiences_count || 0,
              bio: data.bio,
              social: {
                instagram: data.instagram || '',
                linkedin: data.linkedin || ''
              },
              trips: userTrips
            });
          } else {
            setUserProfile(mockUser);
          }
        } else {
          // Create users table and insert mock data
          await createUsersTable();
          await insertMockUsers();
          setUserProfile(mockUser);
        }
      } catch (error) {
        console.error('Error:', error);
        setUserProfile(mockUser);
      } finally {
        setLoading(false);
      }
    };
    
    // Check and create storage bucket if needed
    const checkAndCreateStorageBucket = async () => {
      try {
        // List buckets to check if user-images exists
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error('Error listing buckets:', error);
          return;
        }
        
        const userImagesBucketExists = buckets.some(bucket => bucket.name === 'user-images');
        
        if (!userImagesBucketExists) {
          console.log('Creating user-images bucket');
          const { error: createError } = await supabase.storage.createBucket('user-images', {
            public: true,
            fileSizeLimit: 1024 * 1024 * 2, // 2MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
          });
          
          if (createError) {
            console.error('Error creating bucket:', createError);
          } else {
            console.log('user-images bucket created successfully');
          }
        } else {
          console.log('user-images bucket already exists');
        }
      } catch (error) {
        console.error('Error checking/creating storage bucket:', error);
      }
    };

    fetchUserProfile();
    checkAndCreateStorageBucket();
  }, [userId]);
  
  const fetchUserTrips = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('creator_id', userId)
        .limit(2);
      
      if (error) {
        console.error('Error fetching user trips:', error);
        return mockUser.trips;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching trips:', error);
      return mockUser.trips;
    }
  };
  
  const createUsersTable = async () => {
    try {
      // This is a simplified version - in a real app, you would use migrations
      const { error } = await supabase.rpc('create_users_table');
      
      if (error && error.message !== 'relation "users" already exists') {
        console.error('Error creating users table:', error);
      }
    } catch (error) {
      console.error('Error creating table:', error);
    }
  };
  
  const insertMockUsers = async () => {
    try {
      const usersToInsert = [
        {
          id: 'user123',
          name: 'Alex Johnson',
          location: 'San Francisco, CA',
          email: 'alex.j@example.com',
          phone: '+1 (555) 123-4567',
          gender: 'Male',
          profile_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
          bio: 'Travel enthusiast and adventure seeker. Always looking for the next exciting destination!',
          instagram: 'travel_alex',
          linkedin: 'alex-johnson-travel',
          experiences_count: 24
        },
        {
          id: 'user456',
          name: 'Sarah J.',
          location: 'New York, NY',
          email: 'sarah.j@example.com',
          phone: '+1 (555) 987-6543',
          gender: 'Female',
          profile_image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
          bio: 'Food lover and cultural explorer. I travel to taste the world!',
          instagram: 'sarahj_travels',
          linkedin: 'sarah-j-explorer',
          experiences_count: 18
        },
        {
          id: 'user789',
          name: 'Mike T.',
          location: 'London, UK',
          email: 'mike.t@example.com',
          phone: '+44 20 1234 5678',
          gender: 'Male',
          profile_image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
          bio: 'Photographer and hiker. I capture the beauty of nature through my lens.',
          instagram: 'mike_captures',
          linkedin: 'mike-t-photo',
          experiences_count: 32
        },
        {
          id: 'user321',
          name: 'Emma L.',
          location: 'Sydney, Australia',
          email: 'emma.l@example.com',
          phone: '+61 2 9876 5432',
          gender: 'Female',
          profile_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
          bio: 'Ocean lover and diving enthusiast. The underwater world is my second home.',
          instagram: 'emma_dives',
          linkedin: 'emma-l-diver',
          experiences_count: 15
        }
      ];
      
      const { error } = await supabase
        .from('users')
        .insert(usersToInsert);
      
      if (error) {
        console.error('Error inserting mock users:', error);
      }
    } catch (error) {
      console.error('Error inserting mock data:', error);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      saveProfileChanges();
    } else {
      // Start editing - initialize edited profile with current values
      setEditedProfile({
        name: userProfile?.name || '',
        location: userProfile?.location || '',
        email: userProfile?.email || '',
        phone: userProfile?.phone || '',
        gender: userProfile?.gender || '',
        bio: userProfile?.bio || '',
        profileImage: userProfile?.profileImage || '',
        social: {
          instagram: userProfile?.social.instagram || '',
          linkedin: userProfile?.social.linkedin || ''
        }
      });
    }
    setIsEditing(!isEditing);
  };
  
  const handleInputChange = (field: string, value: string) => {
    if (field === 'instagram' || field === 'linkedin') {
      setEditedProfile(prev => ({
        ...prev,
        social: {
          ...prev.social,
          [field]: value
        }
      }));
    } else {
      setEditedProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  const handleProfileImageClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    try {
      setUploadingImage(true);
      console.log('Starting profile image upload process');
      
      // Validate file size
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        throw new Error('File size exceeds 2MB limit');
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image');
      }
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;
      console.log('File path for upload:', filePath);
      
      // Try to upload to the user-images bucket
      console.log('Attempting to upload to Supabase storage bucket: user-images');
      let uploadResult = await supabase.storage
        .from('user-images')
        .upload(filePath, file);
      
      // If the first upload fails, try creating the bucket and uploading again
      if (uploadResult.error) {
        console.error('Upload error details:', uploadResult.error);
        
        // Check if the error is due to bucket not existing
        if (uploadResult.error.message.includes('bucket') || uploadResult.error.message.includes('not found')) {
          console.log('Bucket might not exist, trying to create it');
          
          // Try to create the bucket
          const { error: createError } = await supabase.storage.createBucket('user-images', {
            public: true,
            fileSizeLimit: 1024 * 1024 * 2, // 2MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
          });
          
          if (createError) {
            console.error('Error creating bucket:', createError);
          } else {
            console.log('Bucket created, trying upload again');
            
            // Try upload again
            uploadResult = await supabase.storage
              .from('user-images')
              .upload(filePath, file);
          }
        }
        
        // If still error, try uploading to a different bucket as fallback
        if (uploadResult.error) {
          console.log('Trying fallback upload to public bucket');
          uploadResult = await supabase.storage
            .from('public')
            .upload(`profile-images/${fileName}`, file);
            
          if (uploadResult.error) {
            console.error('Fallback upload failed:', uploadResult.error);
            throw new Error('Failed to upload image after multiple attempts');
          }
        }
      }
      
      console.log('Upload successful:', uploadResult.data);
      
      // Get the public URL from the appropriate bucket
      const bucketName = uploadResult.error ? 'public' : 'user-images';
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`profile-images/${fileName}`);
        
      const publicUrl = data.publicUrl;
      console.log('Generated public URL:', publicUrl);
      
      // Update the user's profile in the database
      console.log('Updating user profile with new image URL');
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ profile_image: publicUrl })
        .eq('id', userProfile.id);
        
      if (updateError) {
        console.error('Database update error details:', updateError);
        throw updateError;
      }
      
      console.log('Database update successful:', updateData);
      
      // Update local state
      setUserProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          profileImage: publicUrl
        };
      });
      
      setEditedProfile(prev => ({
        ...prev,
        profileImage: publicUrl
      }));
      
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully!'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile picture. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploadingImage(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const saveProfileChanges = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      
      // Prepare data for update
      const updateData = {
        name: editedProfile.name,
        location: editedProfile.location,
        email: editedProfile.email,
        phone: editedProfile.phone,
        gender: editedProfile.gender,
        bio: editedProfile.bio,
        instagram: editedProfile.social?.instagram,
        linkedin: editedProfile.social?.linkedin,
        profile_image: editedProfile.profileImage
      };
      
      console.log('Updating profile with data:', updateData);
      
      // Update in Supabase
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userProfile.id);
        
      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to update profile. Please try again.',
          variant: 'destructive'
        });
      } else {
        // Update local state
        setUserProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            name: editedProfile.name || prev.name,
            location: editedProfile.location || prev.location,
            email: editedProfile.email || prev.email,
            phone: editedProfile.phone || prev.phone,
            gender: editedProfile.gender || prev.gender,
            bio: editedProfile.bio || prev.bio,
            social: {
              instagram: editedProfile.social?.instagram || prev.social.instagram,
              linkedin: editedProfile.social?.linkedin || prev.social.linkedin
            },
            profileImage: editedProfile.profileImage || prev.profileImage
          };
        });
        
        toast({
          title: 'Success',
          description: 'Profile updated successfully!'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setIsEditing(false); // Close edit mode after save attempt
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hireyth-main"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center p-6">
          <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">The user profile you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/trips">Back to Trips</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hidden file input for profile image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleProfileImageChange}
        accept="image/*"
        className="hidden"
      />
      
      {/* Header */}
      <AppHeader />
      
      {/* Sub Header - only shown when viewing other profiles */}
      {userId && (
        <div className="bg-white p-4 flex items-center border-b">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            asChild
          >
            <Link to="/profile">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">User Profile</h1>
        </div>
      )}
      
      {/* Profile Header */}
      <div className="bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative mr-4">
              <img 
                src={userProfile.profileImage} 
                alt={userProfile.name} 
                className="w-20 h-20 rounded-full object-cover border-2 border-hireyth-main"
              />
              {isOwnProfile && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white"
                  onClick={handleProfileImageClick}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-hireyth-main border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{userProfile.name}</h2>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{userProfile.location}</span>
              </div>
            </div>
          </div>
          
          {isOwnProfile && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEditToggle}
              className="flex items-center gap-1"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Edit
                </>
              )}
            </Button>
          )}
        </div>
        
        {isEditing ? (
          <div className="mt-4">
            <Label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</Label>
            <Textarea
              id="bio"
              value={editedProfile.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              className="min-h-[80px]"
            />
          </div>
        ) : (
          <p className="mt-4 text-gray-600">
            {userProfile.bio}
          </p>
        )}
        
        <div className="flex mt-6">
          <div className="flex-1 text-center">
            <div className="text-xl font-semibold">{userProfile.tripsCount}</div>
            <div className="text-sm text-gray-500">Trips</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-xl font-semibold">{userProfile.experiencesCount}</div>
            <div className="text-sm text-gray-500">Experiences</div>
          </div>
        </div>
        
        {!isOwnProfile && (
          <div className="mt-4 flex gap-2">
            <Button className="flex-1 bg-hireyth-main hover:bg-hireyth-main/90">Connect</Button>
            <Button variant="outline" className="flex-1">Message</Button>
          </div>
        )}
      </div>
      
      {/* Demographics Section - Now Collapsible */}
      <div className="mt-4 bg-white shadow-sm">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="personal-info" className="border-0">
            <AccordionTrigger className="px-6 py-3">
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2 text-hireyth-main" />
                <span className="text-lg font-semibold">Personal Information</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  {isEditing ? (
                    <Input 
                      value={editedProfile.name} 
                      onChange={(e) => handleInputChange('name', e.target.value)} 
                    />
                  ) : (
                    <Input value={userProfile.name} readOnly className="bg-gray-50" />
                  )}
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-500 mr-2" />
                      {isEditing ? (
                        <Input 
                          value={editedProfile.email} 
                          onChange={(e) => handleInputChange('email', e.target.value)} 
                        />
                      ) : (
                        <Input value={userProfile.email} readOnly className="bg-gray-50" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-500 mr-2" />
                      {isEditing ? (
                        <Input 
                          value={editedProfile.phone} 
                          onChange={(e) => handleInputChange('phone', e.target.value)} 
                        />
                      ) : (
                        <Input value={userProfile.phone} readOnly className="bg-gray-50" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  {isEditing ? (
                    <Input 
                      value={editedProfile.gender} 
                      onChange={(e) => handleInputChange('gender', e.target.value)} 
                    />
                  ) : (
                    <Input value={userProfile.gender} readOnly className="bg-gray-50" />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  {isEditing ? (
                    <Input 
                      value={editedProfile.location} 
                      onChange={(e) => handleInputChange('location', e.target.value)} 
                    />
                  ) : (
                    <Input value={userProfile.location} readOnly className="bg-gray-50" />
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      {/* Social Media Section - Now Collapsible */}
      <div className="mt-4 bg-white shadow-sm">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="social-media" className="border-0">
            <AccordionTrigger className="px-6 py-3">
              <div className="flex items-center">
                <Instagram className="w-5 h-5 mr-2 text-[#E1306C]" />
                <span className="text-lg font-semibold">Social Media</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <div className="bg-gray-100 p-2 border-r">
                      <Instagram className="w-5 h-5 text-[#E1306C]" />
                    </div>
                    {isEditing ? (
                      <Input 
                        value={editedProfile.social?.instagram} 
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        className="border-0" 
                        placeholder="Your Instagram username"
                      />
                    ) : (
                      <Input 
                        value={userProfile.social.instagram} 
                        readOnly 
                        className="border-0 bg-transparent" 
                      />
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <div className="bg-gray-100 p-2 border-r">
                      <Linkedin className="w-5 h-5 text-[#0077B5]" />
                    </div>
                    {isEditing ? (
                      <Input 
                        value={editedProfile.social?.linkedin} 
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        className="border-0" 
                        placeholder="Your LinkedIn username"
                      />
                    ) : (
                      <Input 
                        value={userProfile.social.linkedin} 
                        readOnly 
                        className="border-0 bg-transparent" 
                      />
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      {/* Trips Section */}
      <div className="mt-4 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{isOwnProfile ? 'My Trips' : 'User Trips'}</h3>
          <Button variant="ghost" size="sm" className="text-hireyth-main" asChild>
            <Link to="/trips">View All</Link>
          </Button>
        </div>
        
        {userProfile.trips.length > 0 ? (
          <div className="space-y-4">
            {userProfile.trips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="h-32 relative">
                  <img 
                    src={trip.image_url || trip.image} 
                    alt={trip.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-2 left-3 text-white">
                    <h4 className="font-semibold">{trip.title}</h4>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{trip.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No trips yet</p>
            {isOwnProfile && (
              <Button asChild className="mt-2 bg-hireyth-main hover:bg-hireyth-main/90">
                <Link to="/create">Create a Trip</Link>
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Experiences */}
      <div className="mt-4 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{isOwnProfile ? 'My Experiences' : 'User Experiences'}</h3>
          <Button variant="ghost" size="sm" className="text-hireyth-main">
            View All
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              className="aspect-square bg-gray-200 rounded-md overflow-hidden relative"
            >
              <img 
                src={`https://source.unsplash.com/random/300x300?travel&sig=${i}`} 
                alt="Travel experience" 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

// Mock user data for fallback
const mockUser: UserProfile = {
  id: "user123",
  name: "Alex Johnson",
  location: "San Francisco, CA",
  email: "alex.j@example.com",
  phone: "+1 (555) 123-4567",
  gender: "Male",
  profileImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
  tripsCount: 12,
  experiencesCount: 24,
  bio: "Travel enthusiast and adventure seeker. Always looking for the next exciting destination!",
  social: {
    instagram: "travel_alex",
    linkedin: "alex-johnson-travel"
  },
  trips: [
    {
      id: "trip1",
      title: "Exploring the Greek Islands",
      location: "Santorini, Greece",
      image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      startDate: "2023-08-15",
      endDate: "2023-08-25",
      spots: 3,
    },
    {
      id: "trip2",
      title: "Japanese Culture Tour",
      location: "Tokyo, Japan",
      image: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      startDate: "2023-09-10",
      endDate: "2023-09-22",
      spots: 2,
    }
  ]
};

export default Profile;
