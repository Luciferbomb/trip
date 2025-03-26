import React, { useState, useEffect, useCallback } from 'react';
import ExperiencesLayout from '@/components/ExperiencesLayout';
import ExperienceCard from '@/components/ExperienceCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MapPin, Loader2, LogOut, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import AddExperienceDialog from '@/components/AddExperienceDialog';
import MapboxGlobe from '@/components/GlobeVisualization';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import EnhancedExperienceCard from '@/components/EnhancedExperienceCard';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';

interface ExperienceUser {
  name: string;
  profile_image: string;
  username?: string;
}

interface Experience {
  id: string;
  title: string;
  description: string;
  location: string;
  image_url: string;
  user_id: string;
  created_at: string;
  users: ExperienceUser;
  categories: string[];
}

const Experiences = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const PAGE_SIZE = 12;
  
  // Implement a debounce function for search
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchExperiences(1);
      fetchCategories();
    }
  }, [user]);

  // Filter experiences when search, tab, or category changes
  useEffect(() => {
    filterExperiences();
  }, [experiences, searchQuery, activeTab, selectedCategory]);

  // Fetch categories for filtering
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select('categories')
        .not('categories', 'is', null);
      
      if (error) throw error;
      
      // Extract unique categories
      const allCategories = data
        .flatMap(item => item.categories || [])
        .filter(Boolean);
      
      const uniqueCategories = [...new Set(allCategories)];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch experiences with pagination for scalability
  const fetchExperiences = async (page: number, append: boolean = false) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      // Calculate pagination values
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      // Fetch paginated experiences
      const { data, error, count } = await supabase
        .from('experiences')
        .select(`
          id,
          title,
          description,
          location,
          image_url,
          user_id,
          created_at,
          categories
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        if (page === 1) {
          setExperiences([]);
          setFilteredExperiences([]);
        }
        setHasMore(false);
        return;
      }
      
      // Get user information for each experience
      const userIds = [...new Set(data.map(exp => exp.user_id))];
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, profile_image')
        .in('id', userIds);
        
      if (usersError) {
        console.error('Error fetching users data:', usersError);
      }
      
      // Create a map of user data for quick lookup
      const usersMap = new Map();
      if (usersData) {
        usersData.forEach(user => {
          usersMap.set(user.id, { name: user.name, profile_image: user.profile_image });
        });
      }
      
      // Format experiences with user data
      const formattedData = data.map(item => ({
        ...item,
        users: usersMap.get(item.user_id) || { name: 'Anonymous', profile_image: '' }
      }));
      
      // Update state based on whether we're appending or replacing
      if (append) {
        setExperiences(prev => [...prev, ...formattedData]);
      } else {
        setExperiences(formattedData);
      }
      
      // Determine if there are more results
      setHasMore(count !== null ? from + data.length < count : data.length === PAGE_SIZE);
      
      // Update current page
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching experiences:', error);
      toast({
        title: "Error",
        description: "Failed to load experiences. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Handle load more button click
  const handleLoadMore = () => {
    fetchExperiences(currentPage + 1, true);
  };

  // Filter experiences based on search, tab, and category
  const filterExperiences = () => {
    let filtered = [...experiences];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exp => 
        exp.title.toLowerCase().includes(query) || 
        exp.description.toLowerCase().includes(query) || 
        exp.location.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(exp => 
        exp.categories && exp.categories.includes(selectedCategory)
      );
    }
    
    // Apply tab filter - for future implementation of personalized feeds
    switch (activeTab) {
      case 'following':
        // This would filter based on followed users in a full implementation
        // For now, let's simulate by showing a subset of experiences
        filtered = filtered.slice(0, Math.ceil(filtered.length / 2));
        break;
      
      case 'popular':
        // For now, we'll use created_at as a proxy for popularity
        // In a full implementation, this could use view counts or other metrics
        filtered = filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      
      // 'all' tab shows everything, so no additional filtering needed
    }
    
    setFilteredExperiences(filtered);
  };

  // Debounced search handler for better performance
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleAddExperience = () => {
    setShowAddExperience(true);
  };

  const handleExperienceAdded = () => {
    fetchExperiences(1);
    setShowAddExperience(false);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      await supabase
        .from('experiences')
        .delete()
        .eq('id', id);
      fetchExperiences(1);
    } catch (error) {
      console.error('Error deleting experience:', error);
      toast({
        title: "Error",
        description: "Failed to delete experience. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderExperienceCards = () => {
    if (isLoading) {
      return Array(6).fill(0).map((_, index) => (
        <div key={index} className="flex flex-col space-y-3">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ));
    }

    if (filteredExperiences.length === 0) {
      // Different message if there's a search query with no results
      if (searchQuery || selectedCategory) {
        return (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
            <p className="text-gray-500 mb-4 max-w-md">
              Try different search terms or filters
            </p>
            <div className="flex gap-2">
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
              {selectedCategory && (
                <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                  Clear Category
                </Button>
              )}
            </div>
          </div>
        );
      }
      
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-blue-100 p-6 mb-4">
            <MapPin className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No experiences yet</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Share your travel adventures and inspire others. Be the first to add an experience!
          </p>
          <Button onClick={handleAddExperience} variant="default" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Experience
          </Button>
        </div>
      );
    }

    return filteredExperiences.map(exp => (
      <EnhancedExperienceCard 
        key={exp.id}
        id={exp.id}
        title={exp.title}
        description={exp.description}
        location={exp.location}
        image_url={exp.image_url}
        created_at={exp.created_at}
        user={{
          id: exp.user_id,
          name: exp.users?.name || 'Unknown User',
          username: exp.users?.username || 'unknown',
          profile_image: exp.users?.profile_image || ''
        }}
        categories={exp.categories || []}
        isOwnProfile={exp.user_id === user?.id}
        onDelete={handleDeleteExperience}
      />
    ));
  };

  return (
    <ExperiencesLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {/* Header with title, add button, and logout button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Experiences</h1>
          <div className="flex gap-2 sm:ml-auto">
            <Button 
              onClick={handleAddExperience} 
              variant="primary"
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Share Experience
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline"
              size="lg"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search experiences..."
              className="pl-10 bg-white"
              onChange={handleSearch}
            />
          </div>

          {/* Tabs for different views */}
          <div className="flex flex-col gap-4">
            <Tabs 
              defaultValue="all" 
              value={activeTab} 
              onValueChange={(value) => {
                handleTabChange(value);
                // Scroll to top when changing tabs
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <TabsList className="w-full bg-gray-100">
                <TabsTrigger value="all" className="flex-1">All Experiences</TabsTrigger>
                <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
                <TabsTrigger value="popular" className="flex-1">Popular</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Categories filtering */}
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                <Button 
                  variant={selectedCategory === null ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => handleCategorySelect(null)}
                  className="whitespace-nowrap"
                >
                  All Categories
                </Button>
                {categories.map(category => (
                  <Button 
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => handleCategorySelect(category)}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
            
            {/* View toggle buttons */}
            <div className="flex gap-2">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setViewMode('grid')}
                className="flex-1 sm:flex-none"
              >
                Grid View
              </Button>
              <Button 
                variant={viewMode === 'map' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setViewMode('map')}
                className="flex-1 sm:flex-none"
              >
                Map View
              </Button>
            </div>
          </div>
        </div>

        {/* Map view */}
        {viewMode === 'map' ? (
          <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
            <MapboxGlobe />
            <h3 className="text-lg font-semibold mt-6 mb-3">Recent Experiences</h3>
          </div>
        ) : null}

        {/* Experiences grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${viewMode === 'map' ? 'max-h-[800px] overflow-y-auto pb-20' : ''}`}>
          {renderExperienceCards()}
        </div>
        
        {/* Load more button */}
        {hasMore && filteredExperiences.length > 0 && !isLoading && (
          <div className="flex justify-center mt-8">
            <Button 
              variant="outline" 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="min-w-[150px]"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      {/* Add experience dialog */}
      {user && (
        <AddExperienceDialog
          isOpen={showAddExperience}
          onClose={() => setShowAddExperience(false)}
          onExperienceAdded={handleExperienceAdded}
        />
      )}
      
      {/* Floating action button for adding experience */}
      <div className="fixed bottom-20 right-4 z-30">
        <Button
          onClick={handleAddExperience}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </ExperiencesLayout>
  );
};

export default Experiences;