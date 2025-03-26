import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Calendar, MapPin, Check, ChevronsUpDown, Plus, Loader2, ArrowRight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import AppHeader from '@/components/AppHeader';
import { supabase } from '@/lib/supabase';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Combobox } from '@headlessui/react';
import MapboxSearch from '@/components/MapboxSearch';

// Add at the top of the file after imports
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: {
            new(): {
              getPlacePredictions(
                request: {
                  input: string;
                  types?: string[];
                  componentRestrictions?: { country: string };
                },
                callback: (
                  predictions: google.maps.places.AutocompletePrediction[] | null,
                  status: google.maps.places.PlacesServiceStatus
                ) => void
              ): void;
            };
          };
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            OVER_QUERY_LIMIT: string;
            REQUEST_DENIED: string;
            INVALID_REQUEST: string;
          };
        };
      };
    };
  }
}

// Add Google Maps type definitions
declare namespace google.maps.places {
  interface AutocompletePrediction {
    description: string;
    place_id: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    matched_substrings: Array<{
      length: number;
      offset: number;
    }>;
    terms: Array<{
      offset: number;
      value: string;
    }>;
    types: string[];
  }

  enum PlacesServiceStatus {
    OK = 'OK',
    ZERO_RESULTS = 'ZERO_RESULTS',
    OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
    REQUEST_DENIED = 'REQUEST_DENIED',
    INVALID_REQUEST = 'INVALID_REQUEST'
  }
}

// Popular cities for location suggestions
const popularCities = [
  { id: 1, name: 'New York, USA', country: 'USA' },
  { id: 2, name: 'London, UK', country: 'UK' },
  { id: 3, name: 'Paris, France', country: 'France' },
  { id: 4, name: 'Tokyo, Japan', country: 'Japan' },
  { id: 5, name: 'Sydney, Australia', country: 'Australia' },
  { id: 6, name: 'Rome, Italy', country: 'Italy' },
  { id: 7, name: 'Barcelona, Spain', country: 'Spain' },
  { id: 8, name: 'Dubai, UAE', country: 'UAE' },
  { id: 9, name: 'Bangkok, Thailand', country: 'Thailand' },
  { id: 10, name: 'Santorini, Greece', country: 'Greece' },
  { id: 11, name: 'Bali, Indonesia', country: 'Indonesia' },
  { id: 12, name: 'Cape Town, South Africa', country: 'South Africa' },
  { id: 13, name: 'Rio de Janeiro, Brazil', country: 'Brazil' },
  { id: 14, name: 'Amsterdam, Netherlands', country: 'Netherlands' },
  { id: 15, name: 'Istanbul, Turkey', country: 'Turkey' },
];

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

// Remove Google Maps type declarations and add Mapbox types
interface Place {
  id: string;
  place_name: string;
  place_type: string[];
  text: string;
  context?: Array<{
    id: string;
    text: string;
  }>;
}

const CreateTrip = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [spots, setSpots] = useState(1);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, profile_image')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setUserProfile(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  const handleLocationSelect = (locationData: { name: string; coordinates: [number, number]; country: string }) => {
    setLocation(locationData.name);
    setCountry(locationData.country);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !location || !startDate || !endDate || !description || !user) {
      alert('Please fill in all required fields and ensure you are logged in');
      return;
    }
    
    if (selectedActivities.length === 0) {
      alert('Please select at least one activity');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      setLoading(true);
      
      // Get user's profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, profile_image')
        .eq('id', user.id)
        .single();
      
      if (userError) throw userError;
      
      // Create trip
      const tripId = uuidv4();
      
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      const tripData = {
        id: tripId,
        title,
        location,
        description,
        image_url: image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        spots,
        spots_filled: 0,
        creator_id: user.id,
        creator_name: userData.name || user.user_metadata?.name || 'Anonymous',
        creator_image: userData.profile_image || 'https://via.placeholder.com/200',
        created_at: new Date().toISOString(),
        country: country || location.split(',').pop()?.trim() || '',
        activity: selectedActivities.join(', '),
        status: 'active'
      };
      
      const { data: tripInsertData, error: tripError } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();
      
      if (tripError) throw tripError;
      
      // Add creator as participant
      const { error: participantError } = await supabase
        .from('trip_participants')
        .insert({
          trip_id: tripId,
          user_id: user.id,
          status: 'approved'
        });
      
      if (participantError) throw participantError;
      
      toast({
        title: 'Success',
        description: 'Trip created successfully!'
      });
      
      navigate(`/trips/${tripInsertData.id}`);
      
    } catch (error: any) {
      console.error('Error creating trip:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center h-16">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-3 text-gray-600 hover:text-gray-900" 
            onClick={() => navigate('/trips')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Create Event</h1>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Event Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm">
                1
              </div>
              <h3 className="text-lg font-semibold">Event Details</h3>
            </div>

            <div className="space-y-6">
              {/* Event Title */}
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Event Name <span className="text-red-500">*</span>
                </Label>
                <Input 
                  type="text" 
                  id="title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                  placeholder="Give your event a name"
                  required
                />
              </div>

              {/* Event Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share details about your event..."
                  className="min-h-[120px] resize-y w-full p-3 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-100 rounded-lg"
                  required
                />
              </div>

              {/* Event Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white border-gray-200 hover:bg-gray-50",
                          !startDate && "text-gray-400"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                        {startDate ? format(startDate, "PPP") : "Choose date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white border-gray-200 hover:bg-gray-50",
                          !endDate && "text-gray-400"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                        {endDate ? format(endDate, "PPP") : "Choose date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => startDate ? date < startDate : date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Event Location */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm">
                2
              </div>
              <h3 className="text-lg font-semibold">Event Location</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Location <span className="text-red-500">*</span>
                </Label>
                <MapboxSearch 
                  onLocationSelect={handleLocationSelect}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Event Photo */}
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
                    onClick={() => document.getElementById('trip-image')?.click()}
                  >
                    {image ? (
                      <>
                        <img 
                          src={image} 
                          alt="Event cover" 
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
                  <input 
                    type="file" 
                    id="trip-image" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Additional Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm">
                4
              </div>
              <h3 className="text-lg font-semibold">Additional Details</h3>
            </div>

            <div className="space-y-6">
              {/* Number of Spots */}
              <div>
                <Label htmlFor="spots" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Available Spots <span className="text-red-500">*</span>
                </Label>
                <Select value={spots.toString()} onValueChange={(value) => setSpots(parseInt(value))}>
                  <SelectTrigger className="bg-white border-gray-200 w-full">
                    <SelectValue placeholder="Select number of spots" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'spot' : 'spots'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Activities */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Activities <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activities.map((activity) => (
                    <Badge 
                      key={activity}
                      variant="outline"
                      className={`py-2 hover:bg-blue-50 cursor-pointer transition-colors border-gray-200 text-sm font-normal hover:text-blue-700 justify-center ${
                        selectedActivities.includes(activity) 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-white text-gray-700'
                      }`}
                      onClick={() => {
                        if (selectedActivities.includes(activity)) {
                          setSelectedActivities(selectedActivities.filter(item => item !== activity));
                        } else {
                          setSelectedActivities([...selectedActivities, activity]);
                        }
                      }}
                    >
                      {activity}
                      {selectedActivities.includes(activity) && (
                        <Check className="w-3.5 h-3.5 ml-1.5 text-blue-600" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isSubmitting || loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? (
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
          <p className="text-xs text-center text-gray-500 mt-3">
            By creating an event, you agree to our Terms of Service and Community Guidelines
          </p>
        </form>
      </div>
    </div>
  );
};

export default CreateTrip;
