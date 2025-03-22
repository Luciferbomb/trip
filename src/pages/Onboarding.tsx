import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle, ChevronRight, Instagram, Linkedin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useToast } from '../components/ui/use-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import AppHeader from '../components/AppHeader';

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    location: '',
    gender: '',
    bio: '',
    profileImage: '',
    instagram: '',
    linkedin: '',
    experience: {
      title: '',
      description: '',
      location: '',
      image: ''
    }
  });
  
  const [completedSteps, setCompletedSteps] = useState({
    1: false, // Basic info
    2: false, // Profile picture
    3: false, // Social media
    4: false  // Experience
  });

  // Fetch user data if available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (userError) {
          // Handle case where user doesn't exist yet in the database
          if (userError.code === 'PGRST116') {
            console.log('User profile not found, creating default profile...');
            
            // Pre-populate with data from auth
            const defaultName = user.user_metadata?.name || user.email?.split('@')[0] || '';
            const defaultUsername = user.user_metadata?.username || `user${Math.floor(Math.random() * 10000)}`;
            
            setProfileData({
              ...profileData,
              name: defaultName,
              username: defaultUsername,
              profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80'
            });
            
            // Create a basic profile so we have something to work with
            await supabase
              .from('users')
              .insert({
                id: user.id,
                name: defaultName,
                username: defaultUsername,
                email: user.email,
                profile_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
                onboarding_completed: false
              })
              .select();
              
          } else {
            console.error('Error fetching user data:', userError);
            toast({
              title: 'Error',
              description: 'Failed to load your profile data. Please try again.',
              variant: 'destructive'
            });
          }
        } else if (userData) {
          // Check if user has already completed onboarding
          if (userData.onboarding_completed) {
            toast({
              title: 'Welcome back!',
              description: 'You have already completed onboarding.',
            });
            // Redirect to trips page if onboarding is already done
            navigate('/trips');
            return;
          }
          
          // Pre-populate form with existing data
          setProfileData({
            name: userData.name || '',
            username: userData.username || '',
            location: userData.location || '',
            gender: userData.gender || '',
            bio: userData.bio || '',
            profileImage: userData.profile_image || '',
            instagram: userData.instagram || '',
            linkedin: userData.linkedin || '',
            experience: {
              title: '',
              description: '',
              location: '',
              image: ''
            }
          });
          
          // Check which steps are already filled
          const steps = { ...completedSteps };
          
          // Step 1: Basic info
          if (userData.name && userData.username) {
            steps[1] = true;
          }
          
          // Step 2: Profile picture
          if (userData.profile_image && userData.profile_image !== 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80') {
            steps[2] = true;
          }
          
          // Step 3: Social media (optional)
          if (userData.instagram || userData.linkedin) {
            steps[3] = true;
          }
          
          setCompletedSteps(steps);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData({
        ...profileData,
        [parent]: {
          ...profileData[parent as keyof typeof profileData],
          [child]: value
        }
      });
    } else {
      setProfileData({
        ...profileData,
        [field]: value
      });
    }
  };

  const handleProfileImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setUploadingImage(true);
      
      // Use profile-images bucket if available, otherwise fallback
      let bucketName = 'profile-images';
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload the file
      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        
      const publicUrl = urlData.publicUrl;
      
      // Update the profile data
      setProfileData({
        ...profileData,
        profileImage: publicUrl
      });
      
      // Update the completed steps
      setCompletedSteps({
        ...completedSteps,
        2: true
      });
      
      toast({
        title: 'Success',
        description: 'Profile picture uploaded successfully!',
      });
      
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload profile picture. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // New function to handle experience image uploads
  const handleExperienceImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setLoading(true);
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Please upload a JPEG, PNG, GIF, or WebP image');
      }
      
      // Use experience-images bucket
      const bucketName = 'experience-images';
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `experience-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `experiences/${fileName}`;
      
      // Upload to experience-images bucket
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      // Update experience data
      setProfileData(prev => ({
        ...prev,
        experience: {
          ...prev.experience,
          image: publicUrl
        }
      }));
      
      toast({
        title: 'Success',
        description: 'Experience image uploaded successfully!'
      });
      
    } catch (error: any) {
      console.error('Error uploading experience image:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Basic info
        if (!profileData.name.trim()) {
          toast({
            title: 'Required Field',
            description: 'Please enter your name',
            variant: 'destructive'
          });
          return false;
        }
        
        if (!profileData.username.trim()) {
          toast({
            title: 'Required Field',
            description: 'Please choose a username',
            variant: 'destructive'
          });
          return false;
        }
        
        const usernameRegex = /^[a-z0-9_]{3,20}$/;
        if (!usernameRegex.test(profileData.username)) {
          toast({
            title: 'Invalid Username',
            description: 'Username must be 3-20 characters and can only contain lowercase letters, numbers, and underscores',
            variant: 'destructive'
          });
          return false;
        }
        
        return true;
        
      case 2: // Profile picture - optional but encouraged
        return true;
        
      case 3: // Social media - optional
        return true;
        
      case 4: // Experience - can skip
        return true;
        
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep === 4) {
        saveProfileAndContinue();
      } else {
        setCompletedSteps({
          ...completedSteps,
          [currentStep]: true
        });
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    // Skip current step if allowed
    if (currentStep === 4) {
      saveProfileAndContinue();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const saveProfileAndContinue = async () => {
    if (currentStep === 4) {
      // Save the complete profile including experience
      try {
        setLoading(true);
        
        // Update user profile first
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: profileData.name,
            username: profileData.username,
            location: profileData.location,
            gender: profileData.gender,
            bio: profileData.bio,
            profile_image: profileData.profileImage,
            instagram: profileData.instagram,
            linkedin: profileData.linkedin,
            onboarding_completed: true // Mark onboarding as completed
          })
          .eq('id', user.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // Save experience if fields are filled
        if (profileData.experience.title && profileData.experience.description) {
          const { error: experienceError } = await supabase
            .from('experiences')
            .insert({
              title: profileData.experience.title,
              description: profileData.experience.description,
              location: profileData.experience.location,
              user_id: user.id,
              image_url: profileData.experience.image || null
            });
          
          if (experienceError) {
            throw experienceError;
          }
        }
        
        // Show success message
        toast({
          title: 'Profile completed!',
          description: 'Your profile has been set up successfully.',
        });
        
        // Redirect to profile page
        navigate('/profile');
      } catch (error) {
        console.error('Error saving profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to save your profile. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Mark current step as completed and move to next step
      setCompletedSteps(prevState => ({
        ...prevState,
        [currentStep]: true
      }));
      
      setCurrentStep(prevStep => prevStep + 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Basic Information</h2>
            <p className="text-white/80 mb-4">Let's start with some basic information about you.</p>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white text-sm font-medium">Full Name</Label>
              <div className="relative">
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your full name"
                  required
                  className="glass-button pl-3 h-12 text-white placeholder:text-white/40 focus:border-white/40 focus-visible:ring-1 focus-visible:ring-white/50 rounded-lg"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white text-sm font-medium">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                  placeholder="Choose a unique username"
                  required
                  className="glass-button pl-3 h-12 text-white placeholder:text-white/40 focus:border-white/40 focus-visible:ring-1 focus-visible:ring-white/50 rounded-lg"
                />
              </div>
              <p className="text-sm text-white/60 mt-1">
                Username must be 3-20 characters long and can only contain letters, numbers, and underscores.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="text-white text-sm font-medium">Location</Label>
              <div className="relative">
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, Country"
                  className="glass-button pl-3 h-12 text-white placeholder:text-white/40 focus:border-white/40 focus-visible:ring-1 focus-visible:ring-white/50 rounded-lg"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-white text-sm font-medium">Gender</Label>
              <RadioGroup
                value={profileData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" className="text-white border-white/50" />
                  <Label htmlFor="male" className="text-white">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" className="text-white border-white/50" />
                  <Label htmlFor="female" className="text-white">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Other" id="other" className="text-white border-white/50" />
                  <Label htmlFor="other" className="text-white">Other</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-white text-sm font-medium">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                className="glass-button min-h-[100px] text-white placeholder:text-white/40 focus:border-white/40 focus-visible:ring-1 focus-visible:ring-white/50 rounded-lg"
              />
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Profile Picture</h2>
            <p className="text-white/80 mb-4">Upload a profile picture so other travelers can recognize you.</p>
            
            <div className="flex flex-col items-center justify-center py-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfileImageChange}
                accept="image/*"
                className="hidden"
              />
              
              <div className="relative mb-4">
                {profileData.profileImage ? (
                  <img
                    src={profileData.profileImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center text-white/50">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                
                <Button
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-blue-500 hover:bg-blue-600 shadow-md"
                  onClick={handleProfileImageClick}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-white/70 text-center">
                Upload a clear photo of your face to help others recognize you.
              </p>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Social Media</h2>
            <p className="text-white/80 mb-4">Connect your social media accounts (optional).</p>
            
            <div className="space-y-2">
              <Label htmlFor="instagram" className="text-white text-sm font-medium">Instagram</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">
                  <Instagram className="h-5 w-5" />
                </div>
                <Input
                  id="instagram"
                  value={profileData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  placeholder="Your Instagram username"
                  className="glass-button pl-10 h-12 text-white placeholder:text-white/40 focus:border-white/40 focus-visible:ring-1 focus-visible:ring-white/50 rounded-lg"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="text-white text-sm font-medium">LinkedIn</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">
                  <Linkedin className="h-5 w-5" />
                </div>
                <Input
                  id="linkedin"
                  value={profileData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  placeholder="Your LinkedIn username"
                  className="glass-button pl-10 h-12 text-white placeholder:text-white/40 focus:border-white/40 focus-visible:ring-1 focus-visible:ring-white/50 rounded-lg"
                />
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Add an Experience</h2>
            <p className="text-white/80 mb-4">Share a travel experience you've had to help others get to know you.</p>
            
            <div className="space-y-2">
              <Label htmlFor="exp-title" className="text-white text-sm font-medium">Experience Title</Label>
              <Input
                id="exp-title"
                value={profileData.experience.title}
                onChange={(e) => handleInputChange('experience.title', e.target.value)}
                placeholder="e.g., Hiking in the Alps"
                className="glass-button pl-3 h-12 text-white placeholder:text-white/40 focus:border-white/40 focus-visible:ring-1 focus-visible:ring-white/50 rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="exp-location" className="text-white text-sm font-medium">Location</Label>
              <Input
                id="exp-location"
                value={profileData.experience.location}
                onChange={(e) => handleInputChange('experience.location', e.target.value)}
                placeholder="Where did this experience take place?"
                className="glass-button pl-3 h-12 text-white placeholder:text-white/40 focus:border-white/40 focus-visible:ring-1 focus-visible:ring-white/50 rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="exp-description" className="text-white text-sm font-medium">Description</Label>
              <Textarea
                id="exp-description"
                value={profileData.experience.description}
                onChange={(e) => handleInputChange('experience.description', e.target.value)}
                placeholder="Tell us about this experience..."
                className="glass-button min-h-[100px] text-white placeholder:text-white/40 focus:border-white/40 focus-visible:ring-1 focus-visible:ring-white/50 rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white text-sm font-medium">Experience Image</Label>
              <div className="mt-2">
                {profileData.experience.image ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={profileData.experience.image}
                      alt="Experience"
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute bottom-2 right-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20"
                      onClick={() => document.getElementById('exp-image-input')?.click()}
                      disabled={loading}
                    >
                      <Camera className="w-4 h-4 mr-2" /> Change Image
                    </Button>
                  </div>
                ) : (
                  <div
                    className="w-full h-48 glassmorphism-card rounded-lg flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => document.getElementById('exp-image-input')?.click()}
                  >
                    <Camera className="w-8 h-8 text-white/70 mb-2" />
                    <span className="text-white/70">Upload an image</span>
                  </div>
                )}
                <input
                  id="exp-image-input"
                  type="file"
                  onChange={handleExperienceImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full opacity-20 filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full opacity-20 filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-purple-500 rounded-full opacity-10 filter blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-60 h-60 bg-blue-400 rounded-full opacity-10 filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <AppHeader />
      
      <div className="relative z-10 max-w-md mx-auto p-4 pt-20">
        <div className="glassmorphism-card p-6 rounded-xl border border-white/20">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white text-center">Complete Your Profile</h1>
            <p className="text-white/80 text-center mt-2">
              Let's set up your profile so you can start connecting with other travelers.
            </p>
          </div>
          
          {/* Progress indicator */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className="flex flex-col items-center"
                onClick={() => completedSteps[step as keyof typeof completedSteps] && setCurrentStep(step)}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === step
                      ? 'bg-white text-blue-600'
                      : completedSteps[step as keyof typeof completedSteps]
                      ? 'bg-green-100 text-green-600 border border-green-600'
                      : 'bg-white/10 text-white/60'
                  } ${completedSteps[step as keyof typeof completedSteps] ? 'cursor-pointer' : ''}`}
                >
                  {completedSteps[step as keyof typeof completedSteps] ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                <span className={`text-xs mt-1 ${currentStep === step ? 'text-white' : 'text-white/70'}`}>
                  {step === 1 ? 'Basics' : step === 2 ? 'Photo' : step === 3 ? 'Social' : 'Experience'}
                </span>
              </div>
            ))}
          </div>
          
          {/* Step content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
              className="text-white border-white/30 hover:bg-white/10"
            >
              Back
            </Button>
            
            {currentStep < 4 && (
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={loading || uploadingImage || currentStep === 1}
                className="text-white border-white/30 hover:bg-white/10"
              >
                Skip
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={loading || uploadingImage}
              className="bg-white text-blue-600 hover:bg-white/90"
            >
              {loading || uploadingImage ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {currentStep === 4 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 