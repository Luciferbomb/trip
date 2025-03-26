import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapboxSearchProps {
  onLocationSelect?: (location: {
    name: string;
    coordinates: [number, number];
    country: string;
  }) => void;
  onPlaceSelect?: (place: {
    place_name: string;
    center: [number, number];
  }) => void;
  className?: string;
  placeholder?: string;
  inputClassName?: string;
}

const MapboxSearch: React.FC<MapboxSearchProps> = ({ 
  onLocationSelect, 
  onPlaceSelect,
  className,
  placeholder = "Search for a city...",
  inputClassName
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const showMap = !!onLocationSelect; // Only show map if onLocationSelect is provided

  useEffect(() => {
    if (!mapContainer.current || !showMap) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [0, 20], // Default center
      zoom: 1.5
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create marker
    marker.current = new mapboxgl.Marker({
      color: '#0EA5E9',
      draggable: true
    });

    // Handle marker dragend
    marker.current.on('dragend', () => {
      if (!marker.current) return;
      const lngLat = marker.current.getLngLat();
      reverseGeocode(lngLat.lng, lngLat.lat);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [showMap]);

  const searchLocation = async () => {
    if (!searchQuery.trim()) {
      setPredictions([]);
      return;
    }

    try {
      setLoading(true);
      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json`;
      const params = new URLSearchParams({
        access_token: accessToken,
        types: 'place',
        limit: '5'
      });

      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();

      if (data.features) {
        setPredictions(data.features);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`;
      const params = new URLSearchParams({
        access_token: accessToken,
        types: 'place',
        limit: '1'
      });

      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const country = place.context?.find((ctx: any) => ctx.id.startsWith('country'))?.text || '';
        handleLocationSelect(place, country);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(searchLocation, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleLocationSelect = (place: any, country?: string) => {
    if (onPlaceSelect) {
      onPlaceSelect(place);
      setSearchQuery('');
      setPredictions([]);
      return;
    }

    if (!onLocationSelect || !map.current || !marker.current) return;

    const coordinates = place.center as [number, number];
    const locationName = place.text;
    const locationCountry = country || place.context?.find((ctx: any) => ctx.id.startsWith('country'))?.text || '';

    // Update map
    map.current.flyTo({
      center: coordinates,
      zoom: 12,
      essential: true
    });

    // Update marker
    marker.current.setLngLat(coordinates).addTo(map.current);

    // Clear search
    setSearchQuery('');
    setPredictions([]);

    // Callback
    onLocationSelect({
      name: locationName,
      coordinates,
      country: locationCountry
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("pl-10", inputClassName)}
          />
        </div>

        {/* Predictions dropdown */}
        {predictions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
            {predictions.map((place) => (
              <Button
                key={place.id}
                variant="ghost"
                className="w-full justify-start px-3 py-2 text-sm hover:bg-gray-100"
                onClick={() => handleLocationSelect(place)}
              >
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                {place.place_name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Map container - only show if onLocationSelect is provided */}
      {showMap && (
        <div 
          ref={mapContainer} 
          className="w-full h-[300px] rounded-lg border border-gray-200 overflow-hidden"
        />
      )}
    </div>
  );
};

export default MapboxSearch; 