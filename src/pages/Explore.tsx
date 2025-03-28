import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, MapPin, Filter, Loader2, RefreshCw, Users, Compass, BookOpen, Server, AlertCircle, X, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { TravelDestinationCard } from '../components/TravelDestinationCard';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import MapboxSearch from '@/components/MapboxSearch';
import VerificationBadge from '@/components/VerificationBadge';
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { GradientLoader } from '@/components/ui/gradient-loader';

// Common types used across components
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
  creator_is_verified?: boolean;
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
    is_verified?: boolean;
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
  is_verified?: boolean;
}

interface ExploreData {
  trips: Trip[];
  experiences: Experience[];
  users: User[];
}

// Constants
const PAGE_SIZE = 12;
const AUTO_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes

// Available tags/categories for filtering
const AVAILABLE_TAGS = [
  'Adventure', 'Culture', 'Food', 'Nature', 'City', 'Beach',
  'Mountains', 'Photography', 'History', 'Art', 'Music'
];

// Search bar component
const SearchBar = ({
  searchQuery,
  onChange
}: {
  searchQuery: string;
  onChange: (value: string) => void;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative mb-6 shadow-sm focus-within:ring-2 focus-within:ring-purple-400 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-300 transition-colors">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder="Search trips, experiences, or travelers..."
        className="pl-10 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        value={searchQuery}
        onChange={handleChange}
      />
    </div>
  );
};

// Navigation tabs component
const NavigationTabs = ({
  activeTab,
  onChange
}: {
  activeTab: string;
  onChange: (value: string) => void;
}) => {
  return (
    <Tabs 
      defaultValue={activeTab} 
      value={activeTab}
      onValueChange={onChange}
      className="mb-4"
    >
      <TabsList className="grid grid-cols-4 bg-gray-100/80 p-1">
        <TabsTrigger 
          value="all"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
        >
          All
        </TabsTrigger>
        <TabsTrigger 
          value="trips"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
        >
          Trips
        </TabsTrigger>
        <TabsTrigger 
          value="experiences" 
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
        >
          Experiences
        </TabsTrigger>
        <TabsTrigger 
          value="people"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
        >
          Travelers
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

// Filter controls component
const FilterControls = ({
  showFilters,
  toggleFilters,
  selectedLocation,
  onLocationRemove,
  selectedTags,
  onTagRemove,
  onRefresh,
  isRefetching,
}: {
  showFilters: boolean;
  toggleFilters: () => void;
  selectedLocation: string | null;
  onLocationRemove: () => void;
  selectedTags: string[];
  onTagRemove: (tag: string) => void;
  onRefresh: () => void;
  isRefetching: boolean;
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFilters}
          className={showFilters ? "border-purple-500 text-purple-700 bg-purple-50" : ""}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        {selectedLocation && (
          <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200">
            <MapPin className="h-3 w-3" />
            {selectedLocation}
            <button onClick={onLocationRemove} className="ml-1">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {selectedTags.map(tag => (
          <Badge key={tag} variant="outline" className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200">
            {tag}
            <button onClick={() => onTagRemove(tag)} className="ml-1">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        className="text-purple-600"
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${isRefetching ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
};

// Filter panel component
const FilterPanel = ({
  show,
  availableLocations,
  isLoadingLocations,
  onLocationSelect,
  selectedTags,
  onTagToggle,
}: {
  show: boolean;
  availableLocations: string[];
  isLoadingLocations: boolean;
  onLocationSelect: (location: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}) => {
  if (!show) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200 animate-in fade-in duration-300">
      <h3 className="font-medium mb-2 text-gray-700">Filter by:</h3>
      
      {/* Location search */}
      <div className="mb-4">
        <Label className="mb-1.5 block text-sm">Location</Label>
        <div className="relative">
          <MapboxSearch 
            onPlaceSelect={(place) => {
              onLocationSelect(place.place_name);
            }}
            placeholder="Search for a location..."
            inputClassName="w-full border border-gray-300 rounded-md px-3 py-2 pl-8 focus:border-purple-500 focus:ring-purple-500"
          />
          <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        </div>
        
        {availableLocations.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1.5">Popular locations:</div>
            <div className="flex flex-wrap gap-1">
              {availableLocations.slice(0, 5).map(location => (
                <Badge 
                  key={location}
                  variant="outline"
                  className="cursor-pointer hover:bg-purple-50"
                  onClick={() => onLocationSelect(location)}
                >
                  {location}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Tags/Categories selection */}
      <div>
        <Label className="mb-1.5 block text-sm">Tags & Categories</Label>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_TAGS.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className={`cursor-pointer ${selectedTags.includes(tag) ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700' : 'hover:bg-purple-50'}`}
              onClick={() => onTagToggle(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] mt-16">
      <GradientLoader size="lg" icon="compass" />
      <div className="mt-6 text-center">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
        <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mx-auto"></div>
      </div>
    </div>
  </div>
);

// Error state component
const ErrorState = ({ error, onRetry }: { error: Error | null, onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] mt-16">
    <div className="text-center p-8 max-w-md">
      <div className="text-red-500 mb-4">
        <div className="inline-block p-3 bg-red-100 rounded-full">
          <div className="h-10 w-10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-red-800 mt-2">Error Loading Content</h3>
        <p className="text-red-600 mt-1">{error?.message || 'Something went wrong'}</p>
      </div>
      <Button 
        variant="outline" 
        className="border-gray-300 text-gray-700 hover:bg-gray-100 mt-2"
        onClick={onRetry}
      >
        Try Again
      </Button>
    </div>
  </div>
);

// Empty state component
const EmptyState = ({ onResetFilters }: { onResetFilters: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 mt-8 bg-purple-50 rounded-lg border border-purple-100">
    <Server className="h-10 w-10 text-purple-500 mb-2" />
    <h3 className="text-lg font-medium text-gray-800">No results found</h3>
    <p className="text-gray-600 mb-4">Try changing your filters or search query</p>
    <Button 
      variant="outline"
      onClick={onResetFilters}
    >
      Clear Filters
    </Button>
  </div>
);

// Load more component
const LoadMore = ({ 
  hasNextPage, 
  isFetchingNextPage, 
  fetchNextPage,
  loadMoreRef,
}: { 
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  loadMoreRef: React.RefObject<HTMLDivElement>;
}) => {
  if (!hasNextPage) return null;
  
  return (
    <div ref={loadMoreRef} className="flex justify-center mt-8 p-4">
      {isFetchingNextPage ? (
        <GradientLoader size="sm" icon="spinner" />
      ) : (
        <Button 
          variant="outline" 
          onClick={() => fetchNextPage()}
          className="border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          Load More
        </Button>
      )}
    </div>
  );
};

// Content renderer
const ContentRenderer = ({
  activeTab,
  data,
}: {
  activeTab: string;
  data: ExploreData;
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Trip Cards */}
      {(activeTab === 'all' || activeTab === 'trips') && data.trips.map(trip => (
        <BackgroundGradient key={trip.id} className="rounded-[22px] bg-white dark:bg-zinc-900">
          <div 
            className="overflow-hidden cursor-pointer"
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
                  <Link to={`/profile/${trip.creator_username}`} onClick={(e) => e.stopPropagation()} className="block">
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarImage src={trip.creator_image} alt={trip.creator_name} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-600 text-white">
                        {trip.creator_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link 
                      to={`/profile/${trip.creator_username}`} 
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      {trip.creator_name}
                      {trip.creator_is_verified && <VerificationBadge size="sm" />}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {trip.spots} spots available
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/trips/${trip.id}`);
                  }}
                >
                  View details
                </Button>
              </div>
            </div>
          </div>
        </BackgroundGradient>
      ))}
      
      {/* Experience Cards */}
      {(activeTab === 'all' || activeTab === 'experiences') && data.experiences.map(exp => (
        <BackgroundGradient key={exp.id} className="rounded-[22px] bg-white dark:bg-zinc-900">
          <div className="overflow-hidden relative">
            <div className="relative h-48 w-full overflow-hidden rounded-t-[18px]">
              {exp.image_url ? (
                <img 
                  src={exp.image_url} 
                  alt={exp.title} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                  <MapPin className="h-12 w-12 text-purple-300" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                <h3 className="text-lg font-semibold text-white">{exp.title}</h3>
                <div className="flex items-center gap-1 text-white/90">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-sm">{exp.location}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <p className="mb-3 line-clamp-2 text-sm text-gray-600">{exp.description}</p>
              <div className="flex items-center justify-between">
                <Link 
                  to={`/profile/${exp.user?.username}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-8 w-8 border border-gray-200">
                    {exp.user?.profile_image ? (
                      <AvatarImage 
                        src={exp.user.profile_image} 
                        alt={exp.user.name}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-600 text-white">
                        {exp.user?.name ? exp.user.name[0] : '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{exp.user?.name}</p>
                    <span className="text-xs text-gray-500">
                      {format(new Date(exp.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </BackgroundGradient>
      ))}
      
      {/* User Cards */}
      {(activeTab === 'all' || activeTab === 'people') && data.users.map(user => (
        <BackgroundGradient key={user.id} className="rounded-[22px] bg-white dark:bg-zinc-900">
          <div 
            className="overflow-hidden cursor-pointer relative"
            onClick={() => navigate(`/profile/${user.username}`)}
          >
            <div className="h-24 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-[18px]"></div>
            <div className="px-4 pb-4">
              <div className="relative -mt-12 mb-3 flex items-center">
                <div className="rounded-full p-1 bg-white">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={user.profile_image} 
                      alt={user.name}
                      className="object-cover rounded-full"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-600 text-white text-xl">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 ml-3">
                  <div className="flex items-center gap-1">
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    {user.is_verified && <VerificationBadge size="sm" />}
                  </div>
                  <p className="text-sm text-purple-600">@{user.username}</p>
                </div>
              </div>
              {user.bio && (
                <p className="mb-3 line-clamp-2 text-sm text-gray-600">{user.bio}</p>
              )}
              {user.location && (
                <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{user.location}</span>
                </div>
              )}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${user.username}`);
                  }}
                >
                  View profile
                </Button>
              </div>
            </div>
          </div>
        </BackgroundGradient>
      ))}
    </div>
  );
};

// Main Explore component
const Explore = () => {
  // Base state
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(false);
  
  // Refs
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch data based on active tab
  const fetchData = async ({ pageParam = 0 }) => {
    try {
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
        .eq('onboarding_completed', true)
        .not('username', 'is', null)
        .range(from, to);
        
      // Filter out the current logged-in user
      if (user) {
        usersQuery = usersQuery.neq('id', user.id);
      }
        
      if (searchFilter) {
        usersQuery = usersQuery.or(`name.ilike.%${searchFilter}%,username.ilike.%${searchFilter}%,bio.ilike.%${searchFilter}%`);
      }
      
      if (locationFilter) {
        usersQuery = usersQuery.ilike('location', `%${locationFilter}%`);
      }
      
      const results = await Promise.allSettled([
        tripsQuery,
        experiencesQuery,
        usersQuery
      ]);
      
      // Handle results safely
      const tripsResult = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
      const experiencesResult = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
      const usersResult = results[2].status === 'fulfilled' ? results[2].value : { data: [] };
      
      // Apply tag filtering client side if necessary (since it might be JSON array in the DB)
      let filteredTrips = tripsResult.data || [];
      let filteredExperiences = experiencesResult.data || [];
      let filteredUsers = usersResult.data || [];
      
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
        users: (activeTab === 'all' || activeTab === 'people') ? filteredUsers as User[] : [],
        nextPage: (filteredTrips.length === PAGE_SIZE || 
                  filteredExperiences.length === PAGE_SIZE || 
                  filteredUsers.length === PAGE_SIZE) 
          ? pageParam + 1 
          : undefined,
      };
    } catch (error) {
      console.error('Error fetching data:', error);
      return {
        trips: [],
        experiences: [],
        users: [],
        nextPage: undefined
      };
    }
  };

  // Query hook
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
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSetSearch(value);
  };

  // Process data from all pages
  const allItems = useMemo(() => {
    const items = {
      trips: [] as Trip[],
      experiences: [] as Experience[],
      users: [] as User[]
    };
    
    if (!data?.pages) {
      return items;
    }
    
    try {
      data.pages.forEach(page => {
        if (page.trips) items.trips.push(...page.trips);
        if (page.experiences) items.experiences.push(...page.experiences);
        if (page.users) items.users.push(...page.users);
      });
    } catch (error) {
      console.error('Error processing data:', error);
    }
    
    return items;
  }, [data]);

  // Check if we have results
  const hasResults = useMemo(() => {
    return (activeTab === 'all' && (allItems.trips.length > 0 || allItems.experiences.length > 0 || allItems.users.length > 0)) ||
           (activeTab === 'trips' && allItems.trips.length > 0) ||
           (activeTab === 'experiences' && allItems.experiences.length > 0) ||
           (activeTab === 'people' && allItems.users.length > 0);
  }, [activeTab, allItems]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedTags([]);
    setSelectedLocation(null);
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };
  
  // Handle toggling a tag
  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      handleRemoveTag(tag);
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement) return;
    
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage().catch(error => {
            console.error('Error fetching next page:', error);
          });
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(loadMoreElement);
    
    return () => {
      if (loadMoreElement) {
        observer.unobserve(loadMoreElement);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoadingLocations(true);
      try {
        const { data: tripLocations } = await supabase
          .from('trips')
          .select('location')
          .not('location', 'is', null);
        
        const { data: expLocations } = await supabase
          .from('experiences')
          .select('location')
          .not('location', 'is', null);
        
        const tripLocs = tripLocations?.map(t => t.location) || [];
        const expLocs = expLocations?.map(e => e.location) || [];
        const allLocations = [...new Set([...tripLocs, ...expLocs])];
        
        const locationCounts = allLocations.reduce((acc, loc) => {
          acc[loc] = (acc[loc] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const sortedLocations = allLocations
          .sort((a, b) => locationCounts[b] - locationCounts[a])
          .slice(0, 20);
        
        setAvailableLocations(sortedLocations);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setIsLoadingLocations(false);
      }
    };
    
    fetchLocations();
  }, []);
  
  // Auto-refresh data
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [refetch]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="container max-w-screen-xl mx-auto px-4 pb-24 md:pb-12">
      <div className="min-h-screen">
        {/* Hero section */}
        <div className="relative -mx-4 px-4 py-8 md:py-12 mb-8 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-b-3xl">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-semibold mb-4 text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Explore the world with travelers like you
            </h1>
            <p className="text-center text-gray-600 mb-6">
              Discover trips, experiences, and travelers to connect with
            </p>
            
            {/* Search bar */}
            <SearchBar 
              searchQuery={searchQuery} 
                  onChange={handleSearchChange}
                />
            
            {/* Navigation tabs */}
            <NavigationTabs 
              activeTab={activeTab} 
              onChange={setActiveTab}
            />
            
            {/* Filter controls */}
            <FilterControls 
              showFilters={showFilters}
              toggleFilters={() => setShowFilters(!showFilters)}
              selectedLocation={selectedLocation}
              onLocationRemove={() => setSelectedLocation(null)}
              selectedTags={selectedTags}
              onTagRemove={handleRemoveTag}
              onRefresh={() => refetch()}
              isRefetching={isRefetching}
            />
            
            {/* Filter panel */}
            <FilterPanel 
              show={showFilters}
              availableLocations={availableLocations}
              isLoadingLocations={isLoadingLocations}
              onLocationSelect={(location) => setSelectedLocation(location)}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
            />
          </div>
        </div>

        {/* Content area */}
        {error ? (
          <ErrorState error={error as Error} onRetry={() => refetch()} />
        ) : !hasResults ? (
          <EmptyState onResetFilters={handleResetFilters} />
        ) : (
          <>
            <ContentRenderer 
              activeTab={activeTab}
              data={allItems}
            />
            
            <LoadMore 
              hasNextPage={!!hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={() => fetchNextPage()}
              loadMoreRef={loadMoreRef}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Explore; 