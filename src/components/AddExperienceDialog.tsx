import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface AddExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExperienceAdded: () => void;
  userId: string;
}

const AddExperienceDialog = ({ open, onOpenChange, onExperienceAdded, userId }: AddExperienceDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [experienceData, setExperienceData] = useState({
    title: '',
    location: '',
    description: '',
    image: ''
  });

  const handleInputChange = (field: string, value: string) => {
    if (field === 'description' && value.length > 500) {
      // Limit description to 500 characters
      return;
    }
    setExperienceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `experience-${userId}-${Date.now()}.${fileExt}`;
      const filePath = `experiences/${fileName}`;
      
      // Upload to experience-images bucket
      const { error: uploadError } = await supabase.storage
        .from('experience-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('experience-images')
        .getPublicUrl(filePath);
      
      // Update form data
      setExperienceData(prev => ({
        ...prev,
        image: publicUrl
      }));
      
      toast({
        title: 'Success',
        description: 'Image uploaded successfully!'
      });
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    if (!experienceData.title || !experienceData.location || !experienceData.description || !experienceData.image) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields and upload an image',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      // Create the experience
      const { error: experienceError } = await supabase
        .from('experiences')
        .insert({
          user_id: userId,
          title: experienceData.title,
          description: experienceData.description,
          location: experienceData.location,
          image_url: experienceData.image,
          created_at: new Date().toISOString()
        });

      if (experienceError) {
        console.error('Experience creation error:', experienceError);
        throw new Error(experienceError.message || 'Failed to create experience');
      }

      // The trigger we created in SQL should automatically update the user's experience count
      // But we'll manually update it just in case the trigger isn't working
      try {
        // First get the current user data to get the current experiences_count
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('experiences_count')
          .eq('id', userId)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Calculate new count (default to 1 if null)
        const currentCount = userData?.experiences_count || 0;
        const newCount = currentCount + 1;
        
        // Update the count
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            experiences_count: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) throw updateError;
      } catch (countError) {
        console.error('Error updating experience count:', countError);
        // Continue anyway as the experience was created successfully
      }

      toast({
        title: 'Success',
        description: 'Experience added successfully!'
      });

      // Reset form and close dialog
      setExperienceData({
        title: '',
        location: '',
        description: '',
        image: ''
      });
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
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Experience</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">Experience Title</Label>
            <Input
              id="title"
              value={experienceData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Hiking in the Alps"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={experienceData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Where did this experience take place?"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={experienceData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Tell us about this experience..."
              className="min-h-[100px] max-h-[200px]"
              maxLength={500}
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              {experienceData.description.length}/500 characters
            </p>
          </div>

          <div>
            <Label>Experience Image</Label>
            <div className="mt-2">
              {experienceData.image ? (
                <div className="relative">
                  <img
                    src={experienceData.image}
                    alt="Experience"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2 bg-white"
                    onClick={() => document.getElementById('experience-image-input')?.click()}
                    disabled={loading}
                  >
                    Change Image
                  </Button>
                </div>
              ) : (
                <div
                  className="w-full h-48 bg-gray-100 rounded-md flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-300"
                  onClick={() => document.getElementById('experience-image-input')?.click()}
                >
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-500">Upload an image</span>
                </div>
              )}
              <input
                id="experience-image-input"
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Experience'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExperienceDialog; 