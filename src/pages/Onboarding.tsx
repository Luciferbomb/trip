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
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Prepare data for update
      const updateData = {
        name: profileData.name,
        username: profileData.username,
        location: profileData.location || null,
        gender: profileData.gender || null,
        bio: profileData.bio || null,
        profile_image: profileData.profileImage,
        instagram: profileData.instagram || null,
        linkedin: profileData.linkedin || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };
      
      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Only add experience if all required fields are filled
      if (profileData.experience.title && 
          profileData.experience.description && 
          profileData.experience.location) {
        
        // Add experience
        const { error: experienceError } = await supabase
          .from('experiences')
          .insert({
            user_id: user.id,
            title: profileData.experience.title,
            description: profileData.experience.description,
            location: profileData.experience.location,
            image_url: profileData.experience.image || null,
            created_at: new Date().toISOString()
          });
          
        if (experienceError) {
          console.error('Error adding experience:', experienceError);
          // Continue anyway since the profile was updated successfully
        }
      }
      
      // All done!
      toast({
        title: 'Setup Complete!',
        description: 'Your profile has been set up successfully.',
      });
      
      // Redirect to trips page
      navigate('/trips');
      
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save your profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>
            <p className="text-gray-600">Let's start with some basic information about you.</p>
            
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profileData.username}
                onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                placeholder="Choose a unique username"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Username must be 3-20 characters long and can only contain letters, numbers, and underscores.
              </p>
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, Country"
                required
              />
            </div>
            
            <div>
              <Label>Gender</Label>
              <RadioGroup
                value={profileData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                className="min-h-[100px]"
                required
              />
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Profile Picture</h2>
            <p className="text-gray-600">Upload a profile picture so other travelers can recognize you.</p>
            
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
                    className="w-32 h-32 rounded-full object-cover border-2 border-hireyth-main"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
                
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
              </div>
              
              <Button
                variant="outline"
                onClick={handleProfileImageClick}
                disabled={uploadingImage}
                className="mt-2"
              >
                {profileData.profileImage ? 'Change Picture' : 'Upload Picture'}
              </Button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Social Media</h2>
            <p className="text-gray-600">Add your social media handles to connect with other travelers.</p>
            
            <div>
              <Label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">Instagram</Label>
              <div className="flex items-center border rounded-md overflow-hidden">
                <div className="bg-gray-100 p-2 border-r">
                  <Instagram className="w-5 h-5 text-[#E1306C]" />
                </div>
                <Input
                  id="instagram"
                  value={profileData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  className="border-0"
                  placeholder="Your Instagram username"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</Label>
              <div className="flex items-center border rounded-md overflow-hidden">
                <div className="bg-gray-100 p-2 border-r">
                  <Linkedin className="w-5 h-5 text-[#0077B5]" />
                </div>
                <Input
                  id="linkedin"
                  value={profileData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className="border-0"
                  placeholder="Your LinkedIn username"
                />
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>At least one social media handle is required to help verify your identity and connect with other travelers.</p>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Add an Experience</h2>
            <p className="text-gray-600">Share a travel experience you've had to help others get to know you.</p>
            
            <div>
              <Label htmlFor="exp-title">Experience Title</Label>
              <Input
                id="exp-title"
                value={profileData.experience.title}
                onChange={(e) => handleInputChange('experience.title', e.target.value)}
                placeholder="e.g., Hiking in the Alps"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="exp-location">Location</Label>
              <Input
                id="exp-location"
                value={profileData.experience.location}
                onChange={(e) => handleInputChange('experience.location', e.target.value)}
                placeholder="Where did this experience take place?"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="exp-description">Description</Label>
              <Textarea
                id="exp-description"
                value={profileData.experience.description}
                onChange={(e) => handleInputChange('experience.description', e.target.value)}
                placeholder="Tell us about this experience..."
                className="min-h-[100px]"
                required
              />
            </div>
            
            <div>
              <Label>Experience Image</Label>
              <div className="mt-2">
                {profileData.experience.image ? (
                  <div className="relative">
                    <img
                      src={profileData.experience.image}
                      alt="Experience"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute bottom-2 right-2 bg-white"
                      onClick={() => document.getElementById('exp-image-input')?.click()}
                      disabled={loading}
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div
                    className="w-full h-48 bg-gray-200 rounded-md flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => document.getElementById('exp-image-input')?.click()}
                  >
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-500">Upload an image</span>
                  </div>
                )}
                <input
                  id="exp-image-input"
                  type="file"
                  onChange={(e) => handleInputChange('experience.image', e.target.files?.[0]?.name || '')}
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
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center">Complete Your Profile</h1>
            <p className="text-gray-600 text-center mt-2">
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
                      ? 'bg-hireyth-main text-white'
                      : completedSteps[step as keyof typeof completedSteps]
                      ? 'bg-green-100 text-green-600 border border-green-600'
                      : 'bg-gray-100 text-gray-400'
                  } ${completedSteps[step as keyof typeof completedSteps] ? 'cursor-pointer' : ''}`}
                >
                  {completedSteps[step as keyof typeof completedSteps] ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                <span className="text-xs mt-1">
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
            >
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={loading || uploadingImage}
              className="bg-hireyth-main hover:bg-hireyth-main/90"
            >
              {loading || uploadingImage ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {currentStep < 4 ? 'Next' : 'Complete'}
              {!(loading || uploadingImage) && currentStep < 4 && <ChevronRight className="ml-1 w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 