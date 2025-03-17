import React, { useState } from 'react';
import { ArrowLeft, Search, MapPin, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';

const Explore = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for exploration cards
  const explorationItems = [
    {
      id: 1,
      title: 'Beach Getaways',
      description: 'Discover the most beautiful beaches around the world',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      location: 'Various Locations',
      tags: ['beach', 'relaxation', 'summer']
    },
    {
      id: 2,
      title: 'Mountain Adventures',
      description: 'Explore breathtaking mountain ranges and hiking trails',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      location: 'Global Mountain Ranges',
      tags: ['hiking', 'adventure', 'nature']
    },
    {
      id: 3,
      title: 'Cultural Experiences',
      description: 'Immerse yourself in diverse cultures and traditions',
      image: 'https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      location: 'Worldwide',
      tags: ['culture', 'history', 'arts']
    },
    {
      id: 4,
      title: 'Food Tours',
      description: 'Taste the world through culinary adventures',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      location: 'Global Cuisine Hotspots',
      tags: ['food', 'culinary', 'tasting']
    },
    {
      id: 5,
      title: 'Urban Explorations',
      description: 'Discover hidden gems in the world\'s most vibrant cities',
      image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      location: 'Major Cities',
      tags: ['city', 'urban', 'architecture']
    },
    {
      id: 6,
      title: 'Wildlife Safaris',
      description: 'Encounter amazing wildlife in their natural habitats',
      image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      location: 'Wildlife Reserves',
      tags: ['wildlife', 'nature', 'safari']
    }
  ];
  
  // Filter items based on search query
  const filteredItems = explorationItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader />
      
      {/* Sub Header */}
      <div className="bg-white p-4 flex items-center border-b">
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
      
      {/* Search Bar */}
      <div className="p-4 bg-white border-b sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search destinations, experiences, or interests..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <Filter className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Discover Experiences</h2>
        
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No results found for "{searchQuery}"</p>
            <p className="text-gray-400 text-sm mt-2">Try different keywords or browse our categories</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-48">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 className="text-white font-semibold text-lg">{item.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center text-gray-500 text-sm mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{item.location}</span>
                  </div>
                  <p className="text-gray-600 mb-3">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore; 