import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Calendar, MapPin, Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import AppHeader from '@/components/AppHeader';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const activities = [
  "Beach",
  "Hiking",
  "Cultural",
  "Food",
  "Sightseeing",
  "Aurora Viewing",
  "Adventure",
  "Relaxation",
  "Photography",
  "Wildlife"
];

const EditTrip = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [spots, setSpots] = useState(1);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  
  // Fetch trip data
  useEffect(() => {
    const fetchTrip = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        const { data: trip, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (trip.creator_id !== user.id) {
          setError('You do not have permission to edit this trip');
          return;
        }
        
        // Set form data
        setTitle(trip.title);
        setDescription(trip.description);
        setLocation(trip.location);
        setCountry(trip.country);
        setImage(trip.image_url);
        setStartDate(new Date(trip.start_date));
        setEndDate(new Date(trip.end_date));
        setSpots(trip.spots);
        setSelectedActivities(trip.activity ? trip.activity.split(', ') : []);
        
      } catch (error: any) {
        console.error('Error fetching trip:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrip();
  }, [id, user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !user) return;
    
    if (!title || !location || !startDate || !endDate || !description) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (selectedActivities.length === 0) {
      alert('Please select at least one activity');
      return;
    }
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('trips')
        .update({
          title,
          description,
          location,
          country,
          image_url: image,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          spots,
          activity: selectedActivities.join(', '),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('creator_id', user.id);
      
      if (error) throw error;
      
      alert('Trip updated successfully!');
      navigate(`/trips/${id}`);
      
    } catch (error: any) {
      console.error('Error updating trip:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-2xl mx-auto p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Error</h1>
            <p className="text-gray-600 mt-2">{error}</p>
            <Button onClick={() => navigate('/trips')} className="mt-4">
              Back to Trips
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader />
      
      <div className="bg-white p-4 flex items-center border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2" 
          onClick={() => navigate(`/trips/${id}`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Edit Trip</h1>
      </div>
      
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Image */}
          <div>
            <Label htmlFor="trip-image" className="block text-sm font-medium text-gray-700 mb-2">
              Trip Cover Image
            </Label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-48 bg-gray-50 cursor-pointer"
              onClick={() => document.getElementById('trip-image')?.click()}
            >
              {image ? (
                <img 
                  src={image} 
                  alt="Trip cover" 
                  className="h-full w-full object-cover rounded-md"
                />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload image</p>
                </>
              )}
              <input 
                type="file" 
                id="trip-image" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>
          
          {/* Trip Title */}
          <div>
            <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Trip Title
            </Label>
            <Input 
              type="text" 
              id="title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
              placeholder="e.g., Weekend Getaway to Mountains"
              required
            />
          </div>
          
          {/* Location */}
          <div>
            <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </Label>
            <Input 
              type="text" 
              id="location" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full"
              placeholder="e.g., Paris, France"
              required
            />
          </div>
          
          {/* Country */}
          <div>
            <Label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </Label>
            <Input 
              type="text" 
              id="country" 
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full"
              placeholder="e.g., France"
            />
          </div>
          
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Number of Spots */}
          <div>
            <Label htmlFor="spots" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Spots
            </Label>
            <Input 
              type="number" 
              id="spots" 
              value={spots}
              onChange={(e) => setSpots(Math.max(1, parseInt(e.target.value)))}
              min={1}
              className="w-full"
              required
            />
          </div>
          
          {/* Activities */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Activities
            </Label>
            <div className="flex flex-wrap gap-2">
              {activities.map((activity) => (
                <Badge
                  key={activity}
                  variant={selectedActivities.includes(activity) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    if (selectedActivities.includes(activity)) {
                      setSelectedActivities(prev => prev.filter(a => a !== activity));
                    } else {
                      setSelectedActivities(prev => [...prev, activity]);
                    }
                  }}
                >
                  {activity}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Description */}
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Trip Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your trip, activities, what to expect..."
              className="min-h-[120px]"
              required
            />
          </div>
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-hireyth-main hover:bg-hireyth-main/90"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditTrip; 