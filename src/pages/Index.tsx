import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Link, useNavigate } from 'react-router-dom';
import TripCard from '@/components/TripCard';
import ExperienceCard from '@/components/ExperienceCard';
import Footer from '@/components/Footer';
import { ArrowRight, Search, Filter, Users, MapPin, Calendar, Compass, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import Feed from '@/components/Feed';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Profile {
  id: string;
  username: string;
  name: string;
  profile_image: string;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
}

// Sample data - real data will come from API
const featuredTrips = [
  {
    id: "trip1",
    title: "Exploring the Greek Islands",
    location: "Santorini, Greece",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    startDate: "2023-08-15",
    endDate: "2023-08-25",
    spots: 3,
    creatorImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    creatorName: "Sarah J.",
    creatorId: "user123",
    featured: true
  },
  {
    id: "trip2",
    title: "Japanese Culture Tour",
    location: "Tokyo, Japan",
    image: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    startDate: "2023-09-10",
    endDate: "2023-09-22",
    spots: 2,
    creatorImage: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    creatorName: "Mike T.",
    creatorId: "user456"
  },
  {
    id: "trip3",
    title: "Northern Lights Adventure",
    location: "Tromsø, Norway",
    image: "https://images.unsplash.com/photo-1483127140521-b816a161ae22?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    startDate: "2023-11-05",
    endDate: "2023-11-12",
    spots: 4,
    creatorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    creatorName: "Emma L.",
    creatorId: "user789"
  }
];

const recentExperiences = [
  {
    id: "exp1",
    images: ["https://images.unsplash.com/photo-1506929562872-bb421503ef21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"],
    caption: "Watching the sunset from Oia Castle was absolutely magical. The colors reflecting off the white buildings created a scene I'll never forget.",
    location: "Santorini, Greece",
    date: "2023-07-20",
    userName: "Alex Morgan",
    userImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    experienceType: "Sightseeing"
  },
  {
    id: "exp2",
    images: [
      "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
    ],
    caption: "Exploring Tokyo's vibrant street food scene in Shinjuku. The blend of flavors and aromas made for an unforgettable culinary adventure.",
    location: "Tokyo, Japan",
    date: "2023-06-15",
    userName: "Jamie Lee",
    userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    experienceType: "Food"
  },
  {
    id: "exp3",
    images: ["https://images.unsplash.com/photo-1682687980961-78fa83781777?q=80&w=1287&auto=format&fit=crop"],
    caption: "Hiking through the mountains in Switzerland was breathtaking. The crisp air and stunning views made every step worth it.",
    location: "Interlaken, Switzerland",
    date: "2023-08-05", 
    userName: "Chris Parker",
    userImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    experienceType: "Adventure"
  },
  {
    id: "exp4",
    images: ["https://images.unsplash.com/photo-1583244532610-2a4438a941ea?q=80&w=1335&auto=format&fit=crop"],
    caption: "Spending the day at this hidden beach in Bali was perfect. Crystal clear water and not another tourist in sight!",
    location: "Bali, Indonesia",
    date: "2023-07-28",
    userName: "Sophia Chen",
    userImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    experienceType: "Beach"
  }
];

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch suggested users to follow
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!user) return;
      
      try {
        // This would be replaced with a real API call to get suggested users
        // For now, simulating with a timeout
        setTimeout(() => {
          setSuggestedUsers([
            {
              id: "user1",
              username: "traveler_jane",
              name: "Jane Walker",
              profile_image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
              followers_count: 1230,
              following_count: 345
            },
            {
              id: "user2",
              username: "adventure_mark",
              name: "Mark Johnson",
              profile_image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
              followers_count: 890,
              following_count: 421
            },
            {
              id: "user3",
              username: "wanderlust_amy",
              name: "Amy Chen",
              profile_image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
              followers_count: 1540,
              following_count: 278
            }
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
        setLoading(false);
      }
    };

    fetchSuggestedUsers();
  }, [user]);

  const handleFollow = async (userId: string) => {
    // In a real app, this would make an API call to follow the user
    console.log(`Following user ${userId}`);
    
    // Update local state to show followed
    setSuggestedUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, is_following: true } : user
      )
    );
  };

  const handleUnfollow = async (userId: string) => {
    // In a real app, this would make an API call to unfollow the user
    console.log(`Unfollowing user ${userId}`);
    
    // Update local state to show unfollowed
    setSuggestedUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, is_following: false } : user
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 pb-20">
        {/* Search bar */}
        <div className="bg-white sticky top-16 z-10 border-b border-gray-200 p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search trips, experiences, or users..."
                className="w-full pl-9 pr-4 py-2 h-10 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/search?q=${searchQuery}`);
                  }
                }}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-10 w-10 flex items-center justify-center"
              onClick={() => navigate('/search/filters')}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="max-w-3xl mx-auto px-4 pt-6">
          {/* Feed tabs */}
          <Tabs 
            defaultValue="all" 
            value={activeTab} 
            onValueChange={(value) => {
              setActiveTab(value);
              // Scroll to top when changing tabs
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mb-6"
          >
            <TabsList className="grid grid-cols-4 mb-2">
              <TabsTrigger value="all" className="flex items-center gap-1.5">
                <Compass className="h-4 w-4" />
                <span>All</span>
              </TabsTrigger>
              <TabsTrigger value="trips" className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>Trips</span>
              </TabsTrigger>
              <TabsTrigger value="people" className="flex items-center gap-1.5">
                <UserIcon className="h-4 w-4" />
                <span>People</span>
              </TabsTrigger>
              <TabsTrigger value="experiences" className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Experiences</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {/* Social feed */}
              <div className="space-y-6">
                <Feed />
                
                {/* Suggested people to follow */}
                <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
                  <h3 className="font-medium text-lg mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary/80" />
                    Suggested People to Follow
                  </h3>
                  <div className="space-y-4">
                    {loading ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-32 mb-2" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          <Skeleton className="h-9 w-20 rounded-md" />
                        </div>
                      ))
                    ) : (
                      suggestedUsers.map((profile) => (
                        <div key={profile.id} className="flex items-center justify-between">
                          <div 
                            className="flex items-center gap-3 cursor-pointer" 
                            onClick={() => navigate(`/profile/${profile.username}`)}
                          >
                            <Avatar className="h-12 w-12 border">
                              <AvatarImage src={profile.profile_image} alt={profile.name} />
                              <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{profile.name}</p>
                              <p className="text-sm text-gray-500">@{profile.username}</p>
                            </div>
                          </div>
                          <Button
                            variant={profile.is_following ? "outline" : "default"}
                            size="sm"
                            onClick={() => profile.is_following 
                              ? handleUnfollow(profile.id) 
                              : handleFollow(profile.id)
                            }
                          >
                            {profile.is_following ? 'Following' : 'Follow'}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4"
                    onClick={() => navigate('/search')}
                  >
                    See More
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="trips">
              <div className="space-y-6">
                {featuredTrips.map((trip) => (
                  <TripCard 
                    key={trip.id}
                    {...trip}
                  />
                ))}
                <div className="flex justify-center">
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/trips')}
                    className="flex items-center gap-2"
                  >
                    View All Trips
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="people">
              <div className="space-y-4">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-14 w-14 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-9 w-20 rounded-md" />
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {suggestedUsers.map((profile) => (
                      <div key={profile.id} className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-center gap-3 cursor-pointer" 
                            onClick={() => navigate(`/profile/${profile.username}`)}
                          >
                            <Avatar className="h-14 w-14 border">
                              <AvatarImage src={profile.profile_image} alt={profile.name} />
                              <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{profile.name}</p>
                              <p className="text-sm text-gray-500 mb-1">@{profile.username}</p>
                              <div className="flex gap-3 text-xs text-gray-600">
                                <span>{profile.followers_count} followers</span>
                                <span>{profile.following_count} following</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant={profile.is_following ? "outline" : "default"}
                            onClick={() => profile.is_following 
                              ? handleUnfollow(profile.id) 
                              : handleFollow(profile.id)
                            }
                          >
                            {profile.is_following ? 'Following' : 'Follow'}
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center mt-4">
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/search')}
                        className="flex items-center gap-2"
                      >
                        Find More People
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="experiences">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentExperiences.map((experience) => (
                  <ExperienceCard 
                    key={experience.id}
                    {...experience}
                  />
                ))}
                <div className="col-span-1 sm:col-span-2 flex justify-center mt-4">
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/experiences')}
                    className="flex items-center gap-2"
                  >
                    View More Experiences
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
