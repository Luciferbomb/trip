import React, { useState, useEffect } from 'react';
import ExperiencesLayout from '@/components/ExperiencesLayout';
import ExperienceCard from '@/components/ExperienceCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import AddExperienceDialog from '@/components/AddExperienceDialog';
import MapboxGlobe from '@/components/GlobeVisualization';

interface ExperienceUser {
  name: string;
  profile_image: string;
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
  likes_count: number;
  comments_count: number;
  categories: string[];
}

const Experiences = () => {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  useEffect(() => {
    if (user) {
      fetchExperiences();
    }
  }, [user]);

  useEffect(() => {
    filterExperiences();
  }, [experiences, searchQuery, activeTab]);

  const fetchExperiences = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select(`
          id,
          title,
          description,
          location,
          image_url,
          user_id,
          created_at,
          users:user_id (name, profile_image),
          likes_count,
          comments_count,
          categories
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Manually transform the data to match our expected shape
      const formattedData = data?.map(item => ({
        ...item,
        // Ensure users is an object, not an array
        users: Array.isArray(item.users) && item.users.length > 0 
          ? item.users[0] 
          : { name: 'Anonymous', profile_image: '' }
      })) || [];
      
      setExperiences(formattedData as Experience[]);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    
    // Apply tab filter
    switch (activeTab) {
      case 'following':
        // In a full implementation, this would filter based on followed users
        // For now, let's simulate by showing a subset of experiences
        filtered = filtered.slice(0, Math.ceil(filtered.length / 2));
        break;
      
      case 'popular':
        // Sort by likes count for popular tab
        filtered = filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        break;
      
      // 'all' tab shows everything, so no additional filtering needed
    }
    
    setFilteredExperiences(filtered);
  };

  const handleAddExperience = () => {
    setShowAddExperience(true);
  };

  const handleExperienceAdded = () => {
    fetchExperiences();
    setShowAddExperience(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const renderExperienceCards = () => {
    if (isLoading) {
      return Array(8).fill(0).map((_, index) => (
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
      if (searchQuery) {
        return (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
            <p className="text-gray-500 mb-4 max-w-md">
              Try a different search term or clear your search
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </div>
        );
      }
      
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <MapPin className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No experiences found</h3>
          <p className="text-gray-500 mb-4 max-w-md">
            Be the first to share an experience!
          </p>
          <Button onClick={handleAddExperience} variant="outline">
            Get Started
          </Button>
        </div>
      );
    }

    return filteredExperiences.map(exp => (
      <ExperienceCard 
        key={exp.id}
        id={exp.id}
        images={exp.image_url ? [exp.image_url] : []}
        caption={exp.description || exp.title}
        location={exp.location}
        date={exp.created_at}
        userName={exp.users?.name || 'Anonymous'}
        userImage={exp.users?.profile_image}
        likes={exp.likes_count || 0}
        comments={exp.comments_count || 0}
        experienceType={exp.categories?.[0] || "Travel"}
      />
    ));
  };

  return (
    <ExperiencesLayout>
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Experiences</h1>
          <Button 
            onClick={handleAddExperience} 
            className="sm:ml-auto"
            variant="primary"
            size="lg"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Share Experience
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search experiences..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="flex flex-col gap-4">
            <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="w-full bg-gray-100">
                <TabsTrigger value="all" className="flex-1">All Experiences</TabsTrigger>
                <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
                <TabsTrigger value="popular" className="flex-1">Popular</TabsTrigger>
              </TabsList>
            </Tabs>
            
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

        {viewMode === 'map' ? (
          <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
            <MapboxGlobe />
            <h3 className="text-lg font-semibold mt-6 mb-3">Recent Experiences</h3>
          </div>
        ) : null}

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${viewMode === 'map' ? 'max-h-[800px] overflow-y-auto pb-20' : ''}`}>
          {renderExperienceCards()}
        </div>
      </div>

      {user && (
        <AddExperienceDialog
          open={showAddExperience}
          onOpenChange={setShowAddExperience}
          onExperienceAdded={handleExperienceAdded}
          userId={user.id}
        />
      )}
    </ExperiencesLayout>
  );
};

export default Experiences; 