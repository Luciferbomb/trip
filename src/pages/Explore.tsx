import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Search, MapPin, Filter, Loader2, RefreshCw, Users, Compass, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import debounce from 'lodash/debounce';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

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

const Explore = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { ref, inView } = useInView();

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
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      {/* Sub Header */}
      <div className="bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Explore</h1>
        </div>
        
        {/* Refresh button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {/* Search and Filters */}
      <div className="p-4 bg-white border-b sticky top-0 z-10 space-y-4">
        <div className="relative flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 h-10 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="ml-2 flex-shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="space-y-4 mt-3 bg-gray-50 p-3 rounded-lg">
            {/* Location Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Location
              </label>
              <div className="flex flex-wrap gap-2">
                {availableLocations.map((location) => (
                  <Badge
                    key={location}
                    variant={selectedLocation === location ? 'default' : 'outline'}
                    className="cursor-pointer"
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tags & Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
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
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="experiences">Experiences</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500">Loading content...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading content: {(error as Error)?.message || 'Something went wrong'}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Show content counters */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {activeTab === 'all' ? 'Explore All' : 
                 activeTab === 'trips' ? 'Trips' : 
                 activeTab === 'experiences' ? 'Experiences' : 'People'}
              </h2>
              <div className="flex gap-3 text-sm text-gray-500">
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
            
            {/* Display message if no results */}
            {allItems.trips.length === 0 && allItems.experiences.length === 0 && allItems.users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No results found. Try changing your search or filters.</p>
                <Button variant="outline" className="mt-4" onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                  setSelectedLocation(null);
                  setSelectedTags([]);
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Render Trips */}
              {(activeTab === 'all' || activeTab === 'trips') && allItems.trips.map(trip => (
                <Link 
                  key={`trip-${trip.id}`}
                  to={`/trips/${trip.id}`}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48">
                    <img 
                      src={trip.image_url} 
                      alt={trip.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold text-lg mb-1">{trip.title}</h3>
                        <div className="flex items-center text-white/90 text-sm">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{trip.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={trip.creator_image} />
                        <AvatarFallback>{trip.creator_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{trip.creator_name}</p>
                        <p className="text-xs text-gray-500">@{trip.creator_username}</p>
                      </div>
                    </div>
                    {trip.tags && trip.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {trip.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}

              {/* Render Experiences */}
              {(activeTab === 'all' || activeTab === 'experiences') && allItems.experiences.map(experience => (
                <Link
                  key={`experience-${experience.id}`}
                  to={`/experiences/${experience.id}`}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {experience.image_url && (
                    <div className="relative h-48">
                      <img
                        src={experience.image_url}
                        alt={experience.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-semibold text-lg mb-1">{experience.title}</h3>
                          <div className="flex items-center text-white/90 text-sm">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{experience.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={experience.user.profile_image} />
                        <AvatarFallback>{experience.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{experience.user.name}</p>
                        <p className="text-xs text-gray-500">@{experience.user.username}</p>
                      </div>
                    </div>
                    {experience.categories && experience.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {experience.categories.map((category, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}

              {/* Render Users */}
              {(activeTab === 'all' || activeTab === 'people') && allItems.users.map(user => (
                <Link
                  key={`user-${user.id}`}
                  to={`/profile/${user.username}`}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow p-4"
                >
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                      {user.location && (
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{user.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {user.bio && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{user.bio}</p>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Infinite scroll loading indicator */}
        {(!isLoading && !error && hasNextPage) && (
          <div 
            ref={ref} 
            className="flex justify-center items-center py-8"
          >
            {isFetchingNextPage ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-blue-600" />
                <span className="text-gray-500">Loading more...</span>
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