import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface UserResult {
  id: string;
  username: string;
  name: string;
  profile_image: string;
  location: string;
  followers_count: number;
}

const Search = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<{ [key: string]: boolean }>({});
  const [followLoading, setFollowLoading] = useState<{ [key: string]: boolean }>({});
  
  // Fetch following status for all results
  useEffect(() => {
    const fetchFollowingStatus = async () => {
      if (!user || results.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);
          
        if (error) throw error;
        
        const followingMap = (data || []).reduce((acc: { [key: string]: boolean }, item) => {
          acc[item.following_id] = true;
          return acc;
        }, {});
        
        setFollowingMap(followingMap);
      } catch (error) {
        console.error('Error fetching following status:', error);
      }
    };
    
    fetchFollowingStatus();
  }, [results, user]);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username, name, profile_image, location, followers_count')
        .or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
        .order('followers_count', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      
      setResults(data || []);
      
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      setFollowLoading(prev => ({ ...prev, [userId]: true }));
      
      if (followingMap[userId]) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
          
        if (error) throw error;
        
        setFollowingMap(prev => ({ ...prev, [userId]: false }));
        setResults(prev => 
          prev.map(u => 
            u.id === userId 
              ? { ...u, followers_count: u.followers_count - 1 }
              : u
          )
        );
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
          
        if (error) throw error;
        
        setFollowingMap(prev => ({ ...prev, [userId]: true }));
        setResults(prev => 
          prev.map(u => 
            u.id === userId 
              ? { ...u, followers_count: u.followers_count + 1 }
              : u
          )
        );
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive'
      });
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Button 
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </form>
        
        <div className="space-y-4">
          {results.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
            >
              <div 
                className="flex items-center space-x-4 flex-1 cursor-pointer"
                onClick={() => navigate(`/profile/${user.username}`)}
              >
                <img
                  src={user.profile_image}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-gray-600">@{user.username}</p>
                  {user.location && (
                    <p className="text-sm text-gray-500">{user.location}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium">{user.followers_count}</span>
                <p className="text-xs text-gray-500 mb-2">followers</p>
                {user.id !== user?.id && (
                  <Button
                    variant={followingMap[user.id] ? "outline" : "default"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow(user.id);
                    }}
                    disabled={followLoading[user.id]}
                  >
                    {followLoading[user.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : followingMap[user.id] ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-1" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {results.length === 0 && searchQuery && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-600">No users found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search; 