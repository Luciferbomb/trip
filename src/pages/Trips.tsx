import React, { useState, useEffect } from 'react';
import { SearchIcon, Filter, X, ChevronDown, Plus, Calendar, Loader2, MapPin, Plane } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BackgroundGradient } from "@/components/ui/background-gradient";

// List of countries and activities for filters
const countries = ["All", "Greece", "Japan", "Norway", "Thailand", "USA", "Italy", "France"];
const activities = ["All", "Beach", "Hiking", "Cultural", "Food", "Sightseeing", "Aurora Viewing"];

const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] mt-16">
      <div className="relative">
        <div className="h-32 w-32 rounded-full border-4 border-white relative bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <Plane className="h-16 w-16 text-white" strokeWidth={0.5} fill="currentColor" />
        </div>
      </div>
      <div className="mt-6 text-center">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
        <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mx-auto"></div>
      </div>
    </div>
  </div>
);

const Trips = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    country: "All",
    activity: "All",
  });
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Fetch trips from Supabase
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        setTrips([]); // Clear existing trips while loading
        
        let query = supabase
          .from('trips')
          .select(`
            *,
            creator:users!creator_id (
              id,
              name,
              profile_image
            )
          `)
          .eq('status', 'active');
        
        // Apply date filters if set
        if (startDate) {
          query = query.gte('start_date', startDate.toISOString());
        }
        if (endDate) {
          query = query.lte('end_date', endDate.toISOString());
        }
        
        // Order by start date
        query = query.order('start_date', { ascending: true });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Transform the data to include creator information
        const transformedTrips = (data || []).map(trip => ({
          ...trip,
          creator_name: trip.creator?.name || 'Unknown',
          creator_image: trip.creator?.profile_image || '',
          creator_id: trip.creator?.id
        }));
        
        setTrips(transformedTrips);
      } catch (error: any) {
        console.error('Error fetching trips:', error);
        toast({
          title: 'Error',
          description: 'Failed to load trips. Please try again.',
          variant: 'destructive'
        });
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrips();
  }, [startDate, endDate]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Toggle filters panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Update filters
  const updateFilter = (key: string, value: string) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      country: "All",
      activity: "All",
    });
    setStartDate(undefined);
    setEndDate(undefined);
  };
  
  // Filter trips based on search term and filters
  const filteredTrips = trips.filter(trip => {
    // Search term filter
    const searchMatch = 
      trip.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.activity && typeof trip.activity === 'string' && trip.activity.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Country filter
    const countryMatch = filters.country === "All" || trip.country === filters.country;
    
    // Activity filter
    const activityMatch = 
      filters.activity === "All" || 
      (trip.activity && typeof trip.activity === 'string' && trip.activity.includes(filters.activity));
    
    return searchMatch && countryMatch && activityMatch;
  });
  
  // Calculate header height based on filter visibility
  const headerHeight = showFilters ? 270 : 140;
  
  // Update the loading state
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Filters Section - positioned below the global AppHeader */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white shadow-sm">
        <div className="p-4">
          {/* Search and Create Trip */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search trips by location, activity, or title..."
                className="pl-10 pr-4 h-10 bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <Button 
              onClick={() => navigate('/create')} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Trip
            </Button>
          </div>
          
          {/* Filter Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFilters}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(filters.country !== "All" || filters.activity !== "All" || startDate || endDate) && (
                <Badge variant="secondary" className="ml-2">
                  {[
                    filters.country !== "All" && "Country",
                    filters.activity !== "All" && "Activity",
                    (startDate || endDate) && "Dates"
                  ].filter(Boolean).length}
                </Badge>
              )}
            </Button>
            
            {/* Date Range Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    (startDate || endDate) && "bg-gray-100"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? (
                    endDate ? (
                      <>
                        {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
                      </>
                    ) : (
                      format(startDate, "MMM d")
                    )
                  ) : (
                    "Select dates"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Trip dates</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setStartDate(undefined);
                          setEndDate(undefined);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
                <CalendarComponent
                  mode="range"
                  selected={{
                    from: startDate || undefined,
                    to: endDate || undefined,
                  }}
                  onSelect={(range) => {
                    setStartDate(range?.from);
                    setEndDate(range?.to);
                  }}
                  numberOfMonths={2}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            
            {(filters.country !== "All" || filters.activity !== "All" || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            {/* Country Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Country
              </label>
              <div className="flex flex-wrap gap-2">
                {countries.map((country) => (
                  <Badge
                    key={country}
                    variant={filters.country === country ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => updateFilter('country', country)}
                  >
                    {country}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Activity Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Activity
              </label>
              <div className="flex flex-wrap gap-2">
                {activities.map((activity) => (
                  <Badge
                    key={activity}
                    variant={filters.activity === activity ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => updateFilter('activity', activity)}
                  >
                    {activity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating Action Button for Create Trip */}
      <div className="fixed right-6 bottom-24 z-50">
        <Button
          onClick={() => navigate('/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Content with proper spacing */}
      <div style={{ paddingTop: `${headerHeight + 64}px` }}>
        {/* Trip List */}
        <div className="max-w-2xl mx-auto p-4">
          {filteredTrips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No trips found matching your criteria.</p>
              {(filters.country !== "All" || filters.activity !== "All" || startDate || endDate || searchTerm) && (
                <Button 
                  variant="outline" 
                  className="mt-4 border-gray-300 text-gray-700 hover:bg-gray-100" 
                  onClick={resetFilters}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTrips.map((trip) => (
                <BackgroundGradient key={trip.id} className="rounded-[22px] bg-white dark:bg-zinc-900">
                  <div 
                    className="overflow-hidden cursor-pointer relative"
                    onClick={() => navigate(`/trips/${trip.id}`)}
                  >
                    <div className="relative h-48 w-full overflow-hidden rounded-t-[18px]">
                      {trip.image_url ? (
                        <img 
                          src={trip.image_url} 
                          alt={trip.title} 
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                          <MapPin className="h-12 w-12 text-purple-300" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                        <h3 className="text-lg font-semibold text-white">{trip.title}</h3>
                        <div className="flex items-center gap-1 text-white/90">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-sm">{trip.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-gray-200">
                            <AvatarImage 
                              src={trip.creator_image} 
                              alt={trip.creator_name}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-600 text-white">
                              {trip.creator_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{trip.creator_name}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(trip.start_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        
                        {trip.status && (
                          <Badge variant={trip.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                            {trip.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </BackgroundGradient>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Trips;
