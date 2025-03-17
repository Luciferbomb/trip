import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Calendar, MapPin, Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
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
  const [locationQuery, setLocationQuery] = useState('');
  const [predictions, setPredictions] = useState<Place[]>([]);
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [spots, setSpots] = useState(1);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [locations, setLocations] = useState(popularCities);
  const [filteredLocations, setFilteredLocations] = useState(popularCities);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openLocationPopover, setOpenLocationPopover] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

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
  
  // Update filtered locations when input changes
  useEffect(() => {
    if (locationQuery) {
      const filtered = locations.filter(city => 
        city.name.toLowerCase().includes(locationQuery.toLowerCase())
      );
      setFilteredLocations(filtered);
      setOpenLocationPopover(true); // Open the popover when typing
    } else {
      setFilteredLocations(locations);
    }
  }, [locationQuery, locations]);
  
  // Update country when location changes
  useEffect(() => {
    if (location) {
      const selectedCity = popularCities.find(city => city.name === location);
      if (selectedCity) {
        setCountry(selectedCity.country);
      }
    }
  }, [location]);
  
  // Function to add a new location
  const addNewLocation = async () => {
    if (!locationQuery.trim()) return;
    
    // Check if location already exists
    const exists = locations.some(city => 
      city.name.toLowerCase() === locationQuery.toLowerCase()
    );
    
    if (exists) {
      setLocation(locationQuery);
      setLocationQuery("");
      setOpenLocationPopover(false);
      return;
    }
    
    // Create new location
    const newLocation = {
      id: locations.length + 1,
      name: locationQuery,
      country: 'Custom'
    };
    
    // Add to local state
    setLocations(prev => [...prev, newLocation]);
    
    // Save to database for future use
    try {
      const { error } = await supabase
        .from('locations')
        .insert([{ name: locationQuery, country: 'Custom' }]);
        
      if (error) {
        console.error('Error saving location:', error);
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
    
    // Set as selected
    setLocation(locationQuery);
    setLocationQuery("");
    setOpenLocationPopover(false);
  };
  
  // Fetch saved locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*');
          
        if (error) {
          console.error('Error fetching locations:', error);
          return;
        }
        
        if (data && data.length > 0) {
          // Convert to the format we need
          const dbLocations = data.map((loc, index) => ({
            id: popularCities.length + index + 1,
            name: loc.name,
            country: loc.country || 'Custom'
          }));
          
          // Combine with popular cities, avoiding duplicates
          const combinedLocations = [...popularCities];
          
          dbLocations.forEach(loc => {
            if (!combinedLocations.some(city => city.name.toLowerCase() === loc.name.toLowerCase())) {
              combinedLocations.push(loc);
            }
          });
          
          setLocations(combinedLocations);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    
    fetchLocations();
  }, []);
  
  // Fetch predictions when user types
  useEffect(() => {
    const fetchPredictions = async () => {
      if (!locationQuery.trim()) {
        setPredictions([]);
        return;
      }

      try {
        setLoadingPlaces(true);
        const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationQuery)}.json`;
        const params = new URLSearchParams({
          access_token: accessToken,
          types: 'place',
          limit: '5'
        });

        const response = await fetch(`${endpoint}?${params}`);
        const data = await response.json();

        if (data.features) {
          setPredictions(data.features.map((feature: any) => ({
            id: feature.id,
            place_name: feature.place_name,
            place_type: feature.place_type,
            text: feature.text,
            context: feature.context
          })));
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch location suggestions',
          variant: 'destructive'
        });
      } finally {
        setLoadingPlaces(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(timeoutId);
  }, [locationQuery]);

  const handleLocationSelect = async (place: Place) => {
    setLocation(place.text);
    setCountry(place.context?.find(ctx => ctx.id.startsWith('country'))?.text || '');
    setLocationQuery('');
    setPredictions([]);
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
          status: 'approved',
          role: 'creator'
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sub Header */}
      <div className="bg-white p-4 flex items-center border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2" 
          onClick={() => navigate('/trips')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Create New Trip</h1>
      </div>
      
      {/* Form */}
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
          
          {/* Location with Dropdown */}
          <div>
            <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </Label>
            <Popover open={openLocationPopover} onOpenChange={setOpenLocationPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openLocationPopover}
                  className="w-full justify-between"
                  onClick={() => setOpenLocationPopover(true)}
                >
                  {location ? location : "Select location..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <div className="relative">
                  <Combobox value={location} onChange={setLocation} as="div">
                    <Combobox.Input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onChange={(e) => setLocationQuery(e.target.value)}
                      value={locationQuery}
                      placeholder="Search for a city"
                      displayValue={(value: any) => value || ''}
                    />
                    <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {predictions.length === 0 && locationQuery !== '' ? (
                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                          No results found
                        </div>
                      ) : (
                        predictions.map((place) => (
                          <Combobox.Option
                            key={place.id}
                            value={place.text}
                            onClick={() => handleLocationSelect(place)}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                                active ? 'bg-hireyth-blue text-white' : 'text-gray-900'
                              }`
                            }
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {place.text}
                                </span>
                                <span className={`block truncate text-sm ${active ? 'text-white/75' : 'text-gray-500'}`}>
                                  {place.context?.find(ctx => ctx.id.startsWith('country'))?.text || ''}
                                </span>
                              </>
                            )}
                          </Combobox.Option>
                        ))
                      )}
                    </Combobox.Options>
                  </Combobox>
                  {loadingPlaces && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
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
                    disabled={(date) => date < new Date()}
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
                    disabled={(date) => startDate ? date < startDate : date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Number of Spots */}
          <div>
            <Label htmlFor="spots" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Spots Available
            </Label>
            <Select value={spots.toString()} onValueChange={(value) => setSpots(parseInt(value))}>
              <SelectTrigger>
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
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-hireyth-main hover:bg-hireyth-main/90"
            disabled={isSubmitting || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Trip...
              </>
            ) : (
              'Create Trip'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateTrip;
