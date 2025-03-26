import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { MapPin, Upload, Loader2, ArrowLeft, X, Camera, ArrowRight } from 'lucide-react';
import MapboxSearch from '@/components/MapboxSearch';

interface AddExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExperienceAdded: () => void;
}

const AddExperienceDialog: React.FC<AddExperienceDialogProps> = ({ 
  open, 
  onOpenChange, 
  onExperienceAdded 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Experience data state
  const [experienceData, setExperienceData] = useState({
    title: '',
    description: '',
    location: '',
    coordinates: null as { lat: number; lng: number } | null,
    country: '',
    photo_url: ''
  });
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExperienceData({ ...experienceData, [name]: value });
  };
  
  // Handle location selection from Mapbox
  const handleLocationSelect = (location: {
    name: string;
    coordinates: [number, number];
    country: string;
  }) => {
    setExperienceData({
      ...experienceData,
      location: location.name,
      coordinates: {
        lat: location.coordinates[1],
        lng: location.coordinates[0]
      },
      country: location.country
    });
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    
    const file = e.target.files[0];
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Not authorized',
        description: 'You must be logged in to add an experience',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      let photoUrl = '';
      
      // Upload photo if selected
      if (selectedFile) {
        const fileName = `${Date.now()}-${selectedFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('experience-images')
          .upload(fileName, selectedFile);
          
        if (uploadError) {
          throw new Error(`Error uploading photo: ${uploadError.message}`);
        }
        
        // Get public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from('experience-images')
          .getPublicUrl(fileName);
          
        photoUrl = publicUrlData?.publicUrl || '';
      }
      
      // Insert experience into database
      const { data: newExperience, error: experienceError } = await supabase
        .from('experiences')
        .insert({
          user_id: user.id,
          title: experienceData.title,
          description: experienceData.description,
          location: experienceData.location,
          image_url: photoUrl,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (experienceError) {
        throw new Error(`Error adding experience: ${experienceError.message}`);
      }
      
      toast({
        title: 'Experience added!',
        description: 'Your experience has been successfully added',
      });
      
      // Reset form and close dialog
      setExperienceData({
        title: '',
        description: '',
        location: '',
        coordinates: null,
        country: '',
        photo_url: ''
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Notify parent component
      onExperienceAdded();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Error adding experience:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add experience',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white sticky top-0 z-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center h-16 px-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-3 text-gray-600 hover:text-gray-900" 
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">Add Experience</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-8 p-6">
            {/* Step 1: Event Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm">
                  1
                </div>
                <h3 className="text-lg font-semibold">Event Details</h3>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Event Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={experienceData.title}
                    onChange={handleInputChange}
                    placeholder="Give your event a name"
                    className="w-full bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={experienceData.description}
                    onChange={handleInputChange}
                    placeholder="Share details about your event..."
                    className="min-h-[120px] resize-y w-full p-3 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-100 rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Location */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm">
                  2
                </div>
                <h3 className="text-lg font-semibold">Event Location</h3>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Location <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapboxSearch
                    onLocationSelect={handleLocationSelect}
                    className="w-full"
                  />
                  {experienceData.location && (
                    <div className="text-sm text-green-600 mt-2 flex items-center">
                      <MapPin size={16} className="mr-1" />
                      <span>{experienceData.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Photo Upload */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm">
                  3
                </div>
                <h3 className="text-lg font-semibold">Event Photo</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Upload Photo
                  </Label>
                  <div className="mt-2">
                    <div 
                      className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      {previewUrl ? (
                        <>
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Click to upload a photo</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                        </div>
                      )}
                    </div>
                    <Input
                      id="photo-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Creating event...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span>Create Event</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExperienceDialog; 