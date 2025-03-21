import React, { useState, useEffect } from 'react';
import { SearchIcon, Filter, X, ChevronDown, Plus, Calendar } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import TripCard from '@/components/TripCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

// List of countries and activities for filters
const countries = ["All", "Greece", "Japan", "Norway", "Thailand", "USA", "Italy", "France"];
const activities = ["All", "Beach", "Hiking", "Cultural", "Food", "Sightseeing", "Aurora Viewing"];

const Trips = () => {
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
  
  // Fetch trips from Supabase
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('trips')
          .select('*')
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
        
        if (error) {
          console.error('Error fetching trips:', error);
          setTrips([]);
        } else {
          setTrips(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
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
  
  // Transform Supabase data to match TripCard props
  const mapTripToCardProps = (trip: any) => {
    return {
      id: trip.id,
      title: trip.title,
      location: trip.location,
      image: trip.image_url || trip.image,
      startDate: trip.start_date || trip.startDate,
      endDate: trip.end_date || trip.endDate,
      spots: trip.spots,
      spotsFilled: trip.spots_filled || 0,
      creatorImage: trip.creator_image || trip.creatorImage,
      creatorName: trip.creator_name || trip.creatorName,
      creatorId: trip.creator_id || trip.creatorId,
      activity: trip.activity,
      country: trip.country,
      featured: trip.featured
    };
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search and Filter Header */}
      <div className="sticky top-0 bg-white border-b z-40">
        <div className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search trips..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          
          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
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
            </div>
            
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
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="space-y-4 pt-2 border-t">
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
      </div>
      
      {/* Trip List */}
      <div className="max-w-2xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No trips found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTrips.map((trip) => (
              <TripCard 
                key={trip.id}
                {...mapTripToCardProps(trip)}
              />
            ))}
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Trips;
