import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

const Search = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      const delayDebounceFn = setTimeout(() => {
        searchProfiles();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchProfiles = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('search_profiles', {
          search_term: searchQuery.toLowerCase()
        });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (profileId: string, isFollowing: boolean) => {
    if (!user) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .match({ follower_id: user.id, following_id: profileId });
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: profileId });
      }

      setSearchResults(prev =>
        prev.map(profile =>
          profile.id === profileId
            ? {
                ...profile,
                is_following: !isFollowing,
                followers_count: isFollowing
                  ? profile.followers_count - 1
                  : profile.followers_count + 1
              }
            : profile
        )
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search for users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hireyth-main" />
          </div>
        ) : searchResults.length > 0 ? (
          searchResults.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
            >
              <div
                className="flex items-center space-x-4 flex-1 cursor-pointer"
                onClick={() => navigate(`/profile/${profile.username}`)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{profile.full_name}</h3>
                  <p className="text-sm text-gray-500">@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>
                  )}
                  <div className="flex space-x-4 mt-2">
                    <span className="text-xs text-gray-500">
                      {profile.followers_count} followers
                    </span>
                    <span className="text-xs text-gray-500">
                      {profile.following_count} following
                    </span>
                  </div>
                </div>
              </div>
              {user && user.id !== profile.id && (
                <Button
                  variant={profile.is_following ? "outline" : "default"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollowToggle(profile.id, profile.is_following);
                  }}
                >
                  {profile.is_following ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </div>
          ))
        ) : searchQuery.trim() ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No users found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try searching with a different term
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Search; 