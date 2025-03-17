import React, { useState, useEffect } from 'react';
import { SearchIcon, Filter, X, ChevronDown, Plus } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import TripCard from '@/components/TripCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppHeader from '@/components/AppHeader';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { createTripsTable, insertMockTrips } from '@/lib/supabase-setup';

// List of countries and activities for filters
const countries = ["All", "Greece", "Japan", "Norway", "Thailand", "USA", "Italy", "France"];
const activities = ["All", "Beach", "Hiking", "Cultural", "Food", "Sightseeing", "Aurora Viewing"];

const Trips = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    country: "All",
    activity: "All",
    dateRange: "Any",
  });
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch trips from Supabase
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        
        // Fetch trips from Supabase
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching trips:', error);
          setTrips([]);
        } else if (data && data.length > 0) {
          setTrips(data);
        } else {
          // If no trips found, create the trips table and insert sample data
          await createTripsTable();
          await insertMockTrips();
          
          // Fetch again after inserting
          const { data: refreshedData, error: refreshError } = await supabase
            .from('trips')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (refreshError) {
            console.error('Error fetching trips after insert:', refreshError);
            setTrips([]);
          } else {
            setTrips(refreshedData || []);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrips();
  }, []);
  
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
      dateRange: "Any",
    });
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
      creatorImage: trip.creator_image || trip.creatorImage,
      creatorName: trip.creator_name || trip.creatorName,
      creatorId: trip.creator_id || trip.creatorId,
      featured: trip.featured
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <AppHeader />
      
      {/* Search Bar */}
      <div className="bg-white p-4 border-b">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search by city, activity or trip name..."
            className="pl-10 pr-4 py-2 rounded-lg w-full text-gray-800 bg-gray-50"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
            onClick={toggleFilters}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 border-b border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Filters</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={toggleFilters}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Country Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <div className="relative">
              <select 
                className="w-full p-2 border border-gray-300 rounded-md appearance-none bg-white pr-8"
                value={filters.country}
                onChange={(e) => updateFilter('country', e.target.value)}
              >
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          
          {/* Activity Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
            <div className="relative">
              <select 
                className="w-full p-2 border border-gray-300 rounded-md appearance-none bg-white pr-8"
                value={filters.activity}
                onChange={(e) => updateFilter('activity', e.target.value)}
              >
                {activities.map(activity => (
                  <option key={activity} value={activity}>{activity}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="relative">
              <select 
                className="w-full p-2 border border-gray-300 rounded-md appearance-none bg-white pr-8"
                value={filters.dateRange}
                onChange={(e) => updateFilter('dateRange', e.target.value)}
              >
                <option value="Any">Any time</option>
                <option value="NextMonth">Next month</option>
                <option value="Next3Months">Next 3 months</option>
                <option value="Next6Months">Next 6 months</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
      )}
      
      {/* Active Filters */}
      {(filters.country !== "All" || filters.activity !== "All" || filters.dateRange !== "Any") && (
        <div className="bg-white px-4 py-2 border-b border-gray-200 flex flex-wrap gap-2">
          {filters.country !== "All" && (
            <Badge variant="outline" className="flex items-center gap-1">
              {filters.country}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateFilter('country', 'All')}
              />
            </Badge>
          )}
          {filters.activity !== "All" && (
            <Badge variant="outline" className="flex items-center gap-1">
              {filters.activity}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateFilter('activity', 'All')}
              />
            </Badge>
          )}
          {filters.dateRange !== "Any" && (
            <Badge variant="outline" className="flex items-center gap-1">
              {filters.dateRange.replace(/([A-Z])/g, ' $1').trim()}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateFilter('dateRange', 'Any')}
              />
            </Badge>
          )}
        </div>
      )}
      
      {/* Main Content */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {filteredTrips.length > 0 
              ? `Available Trips (${filteredTrips.length})`
              : "No trips found"
            }
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hireyth-main"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <TripCard 
                key={trip.id}
                {...mapTripToCardProps(trip)}
              />
            ))}
          </div>
        )}
        
        {!loading && filteredTrips.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p>No trips match your search criteria.</p>
            <p className="mt-2">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Trips;
