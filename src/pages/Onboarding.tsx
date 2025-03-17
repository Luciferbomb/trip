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
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }
        
        if (data) {
          // Update profile data with existing user data
          setProfileData({
            name: data.name || '',
            location: data.location || '',
            gender: data.gender || '',
            bio: data.bio || '',
            profileImage: data.profile_image || '',
            instagram: data.instagram || '',
            linkedin: data.linkedin || '',
            experience: {
              title: '',
              description: '',
              location: '',
              image: ''
            }
          });
          
          // Check which steps are already completed
          const steps = { ...completedSteps };
          
          // Step 1: Basic info
          if (data.name && data.location && data.gender && data.bio) {
            steps[1] = true;
          }
          
          // Step 2: Profile picture
          if (data.profile_image) {
            steps[2] = true;
          }
          
          // Step 3: Social media
          if (data.instagram || data.linkedin) {
            steps[3] = true;
          }
          
          setCompletedSteps(steps);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    fetchUserData();
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as Record<string, any>,
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
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
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;
      
      // Try to upload to the user-images bucket
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
      
      // Get the public URL from the appropriate bucket
      const bucketName = uploadResult.error ? 'public' : 'user-images';
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`profile-images/${fileName}`);
        
      const publicUrl = data.publicUrl;
      
      // Update profile data
      setProfileData(prev => ({
        ...prev,
        profileImage: publicUrl
      }));
      
      // Mark step as completed
      setCompletedSteps(prev => ({
        ...prev,
        2: true
      }));
      
      toast({
        title: 'Success',
        description: 'Profile picture uploaded successfully!'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload profile picture. Please try again.',
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

  const handleExperienceImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);
      
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
      const fileName = `experience-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `experience-images/${fileName}`;
      
      // Try to upload to the experience-images bucket
      let uploadResult = await supabase.storage
        .from('experience-images')
        .upload(filePath, file);
      
      // If the first upload fails, try creating the bucket and uploading again
      if (uploadResult.error) {
        console.error('Upload error details:', uploadResult.error);
        
        // Check if the error is due to bucket not existing
        if (uploadResult.error.message.includes('bucket') || uploadResult.error.message.includes('not found')) {
          console.log('Bucket might not exist, trying to create it');
          
          // Try to create the bucket
          const { error: createError } = await supabase.storage.createBucket('experience-images', {
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
              .from('experience-images')
              .upload(filePath, file);
          }
        }
        
        // If still error, try uploading to a different bucket as fallback
        if (uploadResult.error) {
          console.log('Trying fallback upload to public bucket');
          uploadResult = await supabase.storage
            .from('public')
            .upload(`experience-images/${fileName}`, file);
            
          if (uploadResult.error) {
            console.error('Fallback upload failed:', uploadResult.error);
            throw new Error('Failed to upload image after multiple attempts');
          }
        }
      }
      
      // Get the public URL from the appropriate bucket
      const bucketName = uploadResult.error ? 'public' : 'experience-images';
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`experience-images/${fileName}`);
        
      const publicUrl = data.publicUrl;
      
      // Update profile data
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
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Basic info
        if (!profileData.name || !profileData.location || !profileData.gender || !profileData.bio) {
          toast({
            title: 'Missing Information',
            description: 'Please fill in all required fields.',
            variant: 'destructive'
          });
          return false;
        }
        setCompletedSteps(prev => ({ ...prev, 1: true }));
        return true;
        
      case 2: // Profile picture
        if (!profileData.profileImage) {
          toast({
            title: 'Missing Profile Picture',
            description: 'Please upload a profile picture.',
            variant: 'destructive'
          });
          return false;
        }
        setCompletedSteps(prev => ({ ...prev, 2: true }));
        return true;
        
      case 3: // Social media
        if (!profileData.instagram && !profileData.linkedin) {
          toast({
            title: 'Missing Social Media',
            description: 'Please add at least one social media handle.',
            variant: 'destructive'
          });
          return false;
        }
        setCompletedSteps(prev => ({ ...prev, 3: true }));
        return true;
        
      case 4: // Experience
        if (!profileData.experience.title || !profileData.experience.description || !profileData.experience.location || !profileData.experience.image) {
          toast({
            title: 'Missing Experience Details',
            description: 'Please fill in all experience fields and upload an image.',
            variant: 'destructive'
          });
          return false;
        }
        setCompletedSteps(prev => ({ ...prev, 4: true }));
        return true;
        
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step - save everything and redirect
        saveProfileAndContinue();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveProfileAndContinue = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First, update the user profile
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          location: profileData.location,
          gender: profileData.gender,
          bio: profileData.bio,
          profile_image: profileData.profileImage,
          instagram: profileData.instagram,
          linkedin: profileData.linkedin,
          onboarding_completed: true
        })
        .eq('id', user.id);
        
      if (profileError) {
        throw profileError;
      }
      
      // Then, create the experience
      const { error: experienceError } = await supabase
        .from('experiences')
        .insert({
          user_id: user.id,
          title: profileData.experience.title,
          description: profileData.experience.description,
          location: profileData.experience.location,
          image_url: profileData.experience.image,
          created_at: new Date().toISOString()
        });
        
      if (experienceError) {
        throw experienceError;
      }
      
      toast({
        title: 'Profile Completed',
        description: 'Your profile has been set up successfully!'
      });
      
      // Redirect to trips page
      navigate('/trips');
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