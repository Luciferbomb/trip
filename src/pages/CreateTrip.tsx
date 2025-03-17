import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Calendar, MapPin, Check, ChevronsUpDown, Plus } from 'lucide-react';
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

const CreateTrip = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [spots, setSpots] = useState(1);
  const [locations, setLocations] = useState(popularCities);
  const [filteredLocations, setFilteredLocations] = useState(popularCities);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openLocationPopover, setOpenLocationPopover] = useState(false);
  
  // Update filtered locations when input changes
  useEffect(() => {
    if (locationInput) {
      const filtered = locations.filter(city => 
        city.name.toLowerCase().includes(locationInput.toLowerCase())
      );
      setFilteredLocations(filtered);
      setOpenLocationPopover(true); // Open the popover when typing
    } else {
      setFilteredLocations(locations);
    }
  }, [locationInput, locations]);
  
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
    if (!locationInput.trim()) return;
    
    // Check if location already exists
    const exists = locations.some(city => 
      city.name.toLowerCase() === locationInput.toLowerCase()
    );
    
    if (exists) {
      setLocation(locationInput);
      setLocationInput("");
      setOpenLocationPopover(false);
      return;
    }
    
    // Create new location
    const newLocation = {
      id: locations.length + 1,
      name: locationInput,
      country: 'Custom'
    };
    
    // Add to local state
    setLocations(prev => [...prev, newLocation]);
    
    // Save to database for future use
    try {
      const { error } = await supabase
        .from('locations')
        .insert([{ name: locationInput, country: 'Custom' }]);
        
      if (error) {
        console.error('Error saving location:', error);
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
    
    // Set as selected
    setLocation(locationInput);
    setLocationInput("");
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !location || !startDate || !endDate || !description) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First, ensure the trips table exists
      try {
        console.log('Checking if trips table exists...');
        const { error: tableCheckError } = await supabase
          .from('trips')
          .select('id')
          .limit(1);
          
        if (tableCheckError && tableCheckError.code === '42P01') {
          console.log('Trips table does not exist, creating it...');
          
          // Import the migrations file and run the trips table creation
          const { createTripsTable } = await import('@/lib/migrations');
          const success = await createTripsTable();
          
          if (!success) {
            throw new Error('Failed to create trips table');
          }
        }
      } catch (tableError) {
        console.error('Error checking/creating trips table:', tableError);
        alert('Error setting up the database. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      // Create a new trip in Supabase
      const tripId = uuidv4();
      console.log('Creating trip with ID:', tripId);
      
      // Ensure dates are properly formatted
      const formattedStartDate = startDate ? new Date(startDate).toISOString() : null;
      const formattedEndDate = endDate ? new Date(endDate).toISOString() : null;
      
      const tripData = {
        id: tripId,
        title,
        location,
        description,
        image_url: image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        spots,
        creator_id: 'user123', // In a real app, this would be the authenticated user's ID
        creator_name: 'Alex J.',
        creator_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        created_at: new Date().toISOString(),
        country: country || location.split(',').pop()?.trim() || '',
        activity: 'Travel, Sightseeing'
      };
      
      console.log('Trip data to be inserted:', tripData);
      
      // Now insert the trip
      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select();
      
      if (error) {
        console.error('Error creating trip:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        
        if (error.code === '23505') { // Unique violation
          alert('A trip with this ID already exists. Please try again.');
        } else if (error.code === '42P01') { // Undefined table
          alert('The trips table does not exist. Please refresh the page and try again.');
        } else {
          alert(`Failed to create trip: ${error.message}. Please try again.`);
        }
      } else {
        console.log('Trip created successfully:', data);
        alert('Trip created successfully!');
        navigate('/trips');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
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
      {/* Header */}
      <AppHeader />
      
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
                <Command>
                  <div className="flex items-center border-b px-3">
                    <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                      placeholder="Search location..."
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0"
                      autoFocus
                    />
                  </div>
                  <CommandEmpty>
                    <div className="p-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-sm" 
                        onClick={addNewLocation}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add "{locationInput}"
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {filteredLocations.map((city) => (
                        <CommandItem
                          key={city.id}
                          value={city.name}
                          onSelect={(currentValue) => {
                            setLocation(currentValue);
                            setLocationInput("");
                            setOpenLocationPopover(false);
                          }}
                        >
                          {city.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
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
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-hireyth-main hover:bg-hireyth-main/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Trip...' : 'Create Trip'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateTrip;
