import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, MapPin, Filter, Loader2, RefreshCw, Users, Compass, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { TravelDestinationCard } from '@/components/TravelDestinationCard';

// Safe import of useInView with fallback
let useInViewImported;
try {
  // Dynamically import useInView to prevent build errors if import fails
  const reactIntersectionObserver = require('react-intersection-observer');
  useInViewImported = reactIntersectionObserver.useInView;
  
  // Additional safety check
  if (typeof useInViewImported !== 'function') {
    throw new Error('useInView is not a function');
  }
} catch (error) {
  // Provide a fallback implementation if import fails
  console.warn('Could not import useInView, using fallback', error);
  useInViewImported = () => {
    const ref = useRef(null);
    return { ref, inView: true };  // Always trigger loading by default
  };
}

interface Trip {
  id: string;
  title: string;
  description: string;
  location: string;
  image_url: string;
  start_date: string;
  end_date: string;
  spots: number;
  creator_id: string;
  creator_name: string;
  creator_image: string;
  creator_username: string;
  status: string;
  participants_count?: number;
  tags?: string[];
}

interface Experience {
  id: string;
  title: string;
  description: string;
  location: string;
  image_url: string;
  user_id: string;
  created_at: string;
  user: {
    name: string;
    profile_image: string;
    username: string;
  };
  categories?: string[];
}

interface User {
  id: string;
  name: string;
  username: string;
  profile_image: string;
  bio?: string;
  location?: string;
}

const PAGE_SIZE = 12;
const AUTO_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes

const Explore = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Create manual fallback in case the hook fails inside the component
  const fallbackRef = useRef(null);
  const [manualInView, setManualInView] = useState(true);
  
  // Try to use the intersection observer with fallback
  let observerHook;
  try {
    observerHook = useInViewImported();
  } catch (error) {
    console.warn('Failed to use useInView in component, using manual fallback');
    observerHook = { ref: fallbackRef, inView: manualInView };
  }
  
  // Destructure safely with defaults
  const { ref = fallbackRef, inView = true } = observerHook || {};

  // Available tags/categories for filtering
  const availableTags = [
    'Adventure', 'Culture', 'Food', 'Nature', 'City', 'Beach',
    'Mountains', 'Photography', 'History', 'Art', 'Music'
  ];

  // Available locations for filtering
  const availableLocations = [
    'New York', 'London', 'Tokyo', 'Paris', 'Sydney',
    'Dubai', 'Singapore', 'Mumbai', 'Berlin', 'Toronto'
  ];
  
  // Fetch data based on active tab
  const fetchData = async ({ pageParam = 0 }) => {
    const from = pageParam * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    
    const searchFilter = debouncedSearchQuery.toLowerCase();
    const locationFilter = selectedLocation?.toLowerCase();
    
    // Always fetch trips regardless of tab (for 'all' or 'trips' tabs)
    let tripsQuery = supabase
      .from('trips')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (searchFilter) {
      tripsQuery = tripsQuery.or(`title.ilike.%${searchFilter}%,description.ilike.%${searchFilter}%,location.ilike.%${searchFilter}%`);
    }
    
    if (locationFilter) {
      tripsQuery = tripsQuery.ilike('location', `%${locationFilter}%`);
    }
    
    // Always fetch experiences regardless of tab (for 'all' or 'experiences' tabs)
    let experiencesQuery = supabase
      .from('experiences')
      .select('*, user:users(name, profile_image, username)')
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (searchFilter) {
      experiencesQuery = experiencesQuery.or(`title.ilike.%${searchFilter}%,description.ilike.%${searchFilter}%,location.ilike.%${searchFilter}%`);
    }
    
    if (locationFilter) {
      experiencesQuery = experiencesQuery.ilike('location', `%${locationFilter}%`);
    }
    
    // Always fetch users regardless of tab (for 'all' or 'people' tabs)
    let usersQuery = supabase
      .from('users')
      .select('*')
      .range(from, to);
      
    if (searchFilter) {
      usersQuery = usersQuery.or(`name.ilike.%${searchFilter}%,username.ilike.%${searchFilter}%,bio.ilike.%${searchFilter}%`);
    }
    
    if (locationFilter) {
      usersQuery = usersQuery.ilike('location', `%${locationFilter}%`);
    }
    
    const [tripsResult, experiencesResult, usersResult] = await Promise.all([
      tripsQuery,
      experiencesQuery,
      usersQuery
    ]);
    
    // Apply tag filtering client side if necessary (since it might be JSON array in the DB)
    let filteredTrips = tripsResult.data || [];
    let filteredExperiences = experiencesResult.data || [];
    
    if (selectedTags.length > 0) {
      filteredTrips = filteredTrips.filter(trip => 
        trip.tags && selectedTags.some(tag => trip.tags.includes(tag))
      );
      
      filteredExperiences = filteredExperiences.filter(exp => 
        exp.categories && selectedTags.some(tag => exp.categories.includes(tag))
      );
    }
    
    return {
      trips: (activeTab === 'all' || activeTab === 'trips') ? filteredTrips as Trip[] : [],
      experiences: (activeTab === 'all' || activeTab === 'experiences') ? filteredExperiences as Experience[] : [],
      users: (activeTab === 'all' || activeTab === 'people') ? usersResult.data as User[] : [],
      nextPage: (filteredTrips.length === PAGE_SIZE || 
                filteredExperiences.length === PAGE_SIZE || 
                usersResult.data.length === PAGE_SIZE) 
        ? pageParam + 1 
        : undefined,
    };
  };

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching
  } = useInfiniteQuery({
    queryKey: ['explore', activeTab, debouncedSearchQuery, selectedLocation, selectedTags],
    queryFn: fetchData,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-refresh data
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [refetch]);

  // Debounce search input changes
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchQuery(value);
    }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSetSearch(value);
  };

  // Load more data when bottom of list is in view
  useEffect(() => {
    // Add extra safety check for inView
    if ((inView === true) && hasNextPage && !isFetchingNextPage) {
      try {
        fetchNextPage();
      } catch (error) {
        console.error('Error fetching next page:', error);
      }
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Get all items from all pages
  const allItems = useMemo(() => {
    const items = {
      trips: [] as Trip[],
      experiences: [] as Experience[],
      users: [] as User[]
    };
    
    data?.pages.forEach(page => {
      items.trips.push(...page.trips);
      items.experiences.push(...page.experiences);
      items.users.push(...page.users);
    });
    
    return items;
  }, [data]);

  // Calculate the height of the fixed header based on filters and tabs visibility
  const headerHeight = useMemo(() => {
    let height = 64; // Base height for search bar
    if (showFilters) {
      height += 200; // Height for filters panel
    }
    height += 48; // Height for tabs
    return height;
  }, [showFilters]);

  // Show consistent loader during initial loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] mt-16">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse blur-md opacity-75"></div>
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 relative" />
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading content...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry button
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] mt-16">
          <div className="text-center p-8 max-w-md">
            <div className="text-red-500 mb-4">
              <div className="inline-block p-3 bg-red-100 rounded-full">
                <div className="h-10 w-10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-red-800 mt-2">Error Loading Content</h3>
              <p className="text-red-600 mt-1">{(error as Error)?.message || 'Something went wrong'}</p>
            </div>
            <Button 
              variant="outline" 
              className="border-gray-300 text-gray-700 hover:bg-gray-100 mt-2"
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Fixed Filters - positioned below the global AppHeader */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search trips, experiences, and people..."
                  className="pl-10 pr-4 h-10 w-full bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="flex-shrink-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="flex-shrink-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => refetch()}
                disabled={isRefetching}
              >
                <RefreshCw className={`h-5 w-5 ${isRefetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="space-y-6 mt-3 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              {/* Location Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Location
                </label>
                <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto pb-2 px-1">
                  {availableLocations.map((location) => (
                    <Badge
                      key={location}
                      variant={selectedLocation === location ? 'default' : 'outline'}
                      className={`cursor-pointer py-1.5 px-3 ${selectedLocation === location ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'}`}
                      onClick={() => setSelectedLocation(
                        selectedLocation === location ? null : location
                      )}
                    >
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tags/Categories Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Tags & Categories
                </label>
                <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto pb-2 px-1">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className={`cursor-pointer py-1.5 px-3 ${selectedTags.includes(tag) ? 'bg-purple-600 hover:bg-purple-700' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'}`}
                      onClick={() => setSelectedTags(
                        selectedTags.includes(tag)
                          ? selectedTags.filter(t => t !== tag)
                          : [...selectedTags, tag]
                      )}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Reset button for all filters */}
              {(selectedTags.length > 0 || selectedLocation || searchQuery) && (
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-gray-600 hover:bg-gray-100"
                    onClick={() => {
                      setSearchQuery('');
                      setDebouncedSearchQuery('');
                      setSelectedLocation(null);
                      setSelectedTags([]);
                    }}
                  >
                    Reset All Filters
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 text-gray-600">
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="trips"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Trips
              </TabsTrigger>
              <TabsTrigger 
                value="experiences"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Experiences
              </TabsTrigger>
              <TabsTrigger 
                value="people"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                People
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Main content with proper spacing */}
      <div style={{ paddingTop: `${headerHeight + 64}px` }} className="container mx-auto px-4">
        {/* Grid container for content */}
        <div className="py-4">
          {/* Show content counters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3 text-sm text-gray-600">
              {activeTab === 'all' && (
                <>
                  <span className="flex items-center">
                    <Compass className="h-4 w-4 mr-1" />
                    {allItems.trips.length}
                  </span>
                  <span className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {allItems.experiences.length}
                  </span>
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {allItems.users.length}
                  </span>
                </>
              )}
              {activeTab === 'trips' && (
                <span className="flex items-center">
                  <Compass className="h-4 w-4 mr-1" />
                  {allItems.trips.length}
                </span>
              )}
              {activeTab === 'experiences' && (
                <span className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {allItems.experiences.length}
                </span>
              )}
              {activeTab === 'people' && (
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {allItems.users.length}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Render Trips */}
            {(activeTab === 'all' || activeTab === 'trips') && allItems.trips.map(trip => (
              <TravelDestinationCard
                key={`trip-${trip.id}`}
                imageSrc={trip.image_url}
                location={trip.location}
                description={trip.title}
                rating={4.5}
                creatorName={trip.creator_name}
                creatorImage={trip.creator_image} 
                creatorId={trip.creator_id}
                creatorUsername={trip.creator_username}
                itemType="trip"
                onClick={() => navigate(`/trips/${trip.id}`)}
              />
            ))}

            {/* Render Experiences */}
            {(activeTab === 'all' || activeTab === 'experiences') && allItems.experiences.map(experience => (
              <TravelDestinationCard
                key={`experience-${experience.id}`}
                imageSrc={experience.image_url || 'https://via.placeholder.com/400x250'}
                location={experience.location}
                description={experience.title}
                creatorName={experience.user.name}
                creatorImage={experience.user.profile_image}
                creatorUsername={experience.user.username}
                itemType="experience" 
                onClick={() => navigate(`/experiences/${experience.id}`)}
              />
            ))}

            {/* Render Users - Improved card design */}
            {(activeTab === 'all' || activeTab === 'people') && allItems.users.map(user => (
              <Link
                key={`user-${user.id}`}
                to={`/profile/${user.username}`}
                className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md p-5 hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center mb-3">
                  <Avatar className="h-16 w-16 mb-3 border-2 border-gray-200 ring-2 ring-blue-100">
                    <AvatarImage src={user.profile_image} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{user.name}</h3>
                    <p className="text-sm text-blue-600">@{user.username}</p>
                    {user.location && (
                      <div className="flex items-center justify-center text-gray-500 text-sm mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{user.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {user.bio && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-700 line-clamp-2 text-center">{user.bio}</p>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    View Profile
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Infinite scroll loading indicator */}
        {(!isLoading && !error && hasNextPage) && (
          <div 
            ref={ref || undefined} 
            className="flex justify-center items-center py-8"
          >
            {isFetchingNextPage ? (
              <div className="flex items-center">
                <div className="relative mr-3">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 animate-pulse blur-sm opacity-50"></div>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 relative" />
                </div>
                <span className="text-gray-600">Loading more...</span>
              </div>
            ) : (
              <div className="h-10" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore; 