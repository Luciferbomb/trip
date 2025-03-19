import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Get Mapbox access token from environment variable
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Set access token for Mapbox
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface LocationPoint {
  id: string;
  name: string;
  count: number;
  color: string;
  coordinates: [number, number]; // [longitude, latitude]
}

const MapboxGlobe = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationData, setLocationData] = useState<LocationPoint[]>([]);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  
  // Array of colors for different markers with proper opacity for mapbox
  const markerColors = [
    'rgba(255, 65, 108, 0.8)',   // Vibrant pink
    'rgba(64, 164, 241, 0.8)',   // Light blue
    'rgba(255, 177, 27, 0.8)',   // Amber
    'rgba(65, 234, 212, 0.8)',   // Turquoise
    'rgba(145, 95, 255, 0.8)'    // Purple
  ];
  
  // Function to get a random color from the array
  const getRandomColor = () => {
    return markerColors[Math.floor(Math.random() * markerColors.length)];
  };
  
  // Fetch location data from experiences
  useEffect(() => {
    const fetchLocationData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('experiences')
          .select('id, location, title');
        
        if (error) throw error;
        
        // Group by location and count occurrences
        const locationMap = new Map<string, { count: number, titles: string[] }>();
        
        data?.forEach(item => {
          if (!item.location) return;
          
          if (!locationMap.has(item.location)) {
            locationMap.set(item.location, { count: 0, titles: [] });
          }
          
          const locationData = locationMap.get(item.location)!;
          locationData.count += 1;
          locationData.titles.push(item.title);
        });
        
        // Sample location coordinates for real locations (longitude, latitude)
        const sampleLocations: Record<string, [number, number]> = {
          'New York': [-74.0060, 40.7128],
          'Los Angeles': [-118.2437, 34.0522],
          'London': [-0.1278, 51.5074],
          'Paris': [2.3522, 48.8566],
          'Tokyo': [139.6503, 35.6762],
          'Sydney': [151.2093, -33.8688],
          'Rio de Janeiro': [-43.1729, -22.9068],
          'Cape Town': [18.4241, -33.9249],
          'Mumbai': [72.8777, 19.0760],
          'Dubai': [55.2708, 25.2048],
          'Berlin': [13.4050, 52.5200],
          'Mexico City': [-99.1332, 19.4326],
          'Singapore': [103.8198, 1.3521],
          'Barcelona': [2.1734, 41.3851],
          'Rome': [12.4964, 41.9028],
          'Amsterdam': [4.9041, 52.3676],
          'Hong Kong': [114.1694, 22.3193],
          'Bali': [115.0920, -8.3405],
          'Santorini': [25.4615, 36.3932],
          'Kyoto': [135.7681, 35.0116]
        };
        
        // Convert to map data format with real coordinates
        const points: LocationPoint[] = [];
        
        locationMap.forEach((value, key) => {
          // Try to match the location name or use a random sample location
          let matchedLocation = Object.keys(sampleLocations).find(
            location => key.toLowerCase().includes(location.toLowerCase())
          );
          
          let coords = matchedLocation 
            ? sampleLocations[matchedLocation] 
            : sampleLocations[Object.keys(sampleLocations)[Math.floor(Math.random() * Object.keys(sampleLocations).length)]];
          
          // Add a small random offset to prevent overlapping but keep within realistic bounds
          const latOffset = (Math.random() - 0.5) * 1.5;
          const lngOffset = (Math.random() - 0.5) * 1.5;
          
          points.push({
            id: key,
            coordinates: [coords[0] + lngOffset, coords[1] + latOffset], // longitude, latitude
            name: key,
            count: value.count,
            color: getRandomColor()
          });
        });
        
        // Add some fallback points if we don't have enough data
        if (points.length < 5) {
          const fallbackLocations = Object.entries(sampleLocations).slice(0, 10 - points.length);
          fallbackLocations.forEach(([name, coords], index) => {
            points.push({
              id: `fallback-${index}`,
              coordinates: coords,
              name,
              count: Math.floor(Math.random() * 5) + 1,
              color: getRandomColor()
            });
          });
        }
        
        setLocationData(points);
      } catch (error) {
        console.error("Error fetching location data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLocationData();
  }, []);
  
  // Add CSS for mapbox styling
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .mapboxgl-popup {
        z-index: 10;
      }
      
      .mapboxgl-popup-content {
        padding: 0;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      .mapboxgl-ctrl-bottom-right {
        display: none;
      }
    `;
    
    // Append the style element to the document head
    document.head.appendChild(styleElement);
    
    // Clean up function to remove the style element when the component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Initialize map when data is loaded
  useEffect(() => {
    if (!mapContainer.current || isLoading || locationData.length === 0) return;
    
    // Clean up any previous map instance
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    // Create reusable popup
    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'custom-popup'
    });
    
    // Initialize map with light style for daytime appearance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11', // Light daytime style
      center: [0, 20], // Center on the Atlantic for a balanced world view
      zoom: 1.5,
      projection: viewMode === '3d' ? 'globe' : 'mercator',
      attributionControl: false,
      dragRotate: viewMode === '3d', // Enable drag to rotate in 3D mode
      pitchWithRotate: true,
      interactive: true // Ensure the map is interactive
    });
    
    // Add navigation control (zoom buttons)
    map.current.addControl(new mapboxgl.NavigationControl({
      showCompass: true // Show compass to help with orientation
    }), 'top-right');
    
    // When the map is loaded, add markers
    map.current.on('load', () => {
      // Add atmosphere effect (only works in globe mode)
      if (viewMode === '3d') {
        map.current?.setFog({
          color: 'rgb(186, 228, 255)', // Lighter blue atmosphere color
          'high-color': 'rgb(145, 205, 242)', // Brighter sky blue for upper atmosphere
          'horizon-blend': 0.2, // More visible atmosphere blend
          'space-color': 'rgb(200, 230, 255)', // Much lighter blue space color for better daytime look
          'star-intensity': 0 // No stars in daytime
        });
        
        // Set proper lighting for 3D terrain
        map.current.setLight({
          anchor: 'viewport',
          color: '#ffffff',
          intensity: 0.6,
          position: [1, 0, 30]
        });
        
        // Enable user to rotate the globe with mouse
        map.current.touchZoomRotate.enableRotation();
        map.current.dragRotate.enable();
        
        // Show an initial hint to the user
        const hint = document.createElement('div');
        hint.className = 'globe-hint';
        hint.style.position = 'absolute';
        hint.style.bottom = '20px';
        hint.style.left = '50%';
        hint.style.transform = 'translateX(-50%)';
        hint.style.backgroundColor = 'rgba(0,0,0,0.6)';
        hint.style.color = 'white';
        hint.style.padding = '8px 16px';
        hint.style.borderRadius = '16px';
        hint.style.fontSize = '12px';
        hint.style.pointerEvents = 'none';
        hint.style.opacity = '1';
        hint.style.transition = 'opacity 0.5s';
        hint.textContent = 'Drag to rotate the globe';
        
        const mapEl = map.current.getContainer();
        mapEl.appendChild(hint);
        
        // Fade out hint after 5 seconds
        setTimeout(() => {
          hint.style.opacity = '0';
          setTimeout(() => {
            mapEl.removeChild(hint);
          }, 500);
        }, 5000);
      }
      
      // Add points as a custom layer for better performance
      map.current?.addSource('locations', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: locationData.map(point => ({
            type: 'Feature',
            properties: {
              id: point.id,
              name: point.name,
              count: point.count,
              color: point.color
            },
            geometry: {
              type: 'Point',
              coordinates: point.coordinates
            }
          }))
        }
      });
      
      // Add the circle layer to represent locations
      map.current?.addLayer({
        id: 'location-circles',
        type: 'circle',
        source: 'locations',
        paint: {
          // Size based on count
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'count'],
            1, 8,
            5, 12,
            10, 16,
            20, 20
          ],
          // Color from property
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': 'white',
          'circle-stroke-opacity': 0.5
        }
      });
      
      // Add pulsing effect layer
      map.current?.addLayer({
        id: 'location-pulse',
        type: 'circle',
        source: 'locations',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'count'],
            1, 16,
            5, 24,
            10, 32,
            20, 40
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.2,
          'circle-blur': 0.5
        }
      });
      
      // Handle mouse enter events for locations
      map.current?.on('mouseenter', 'location-circles', (e) => {
        if (!map.current || !popup.current || !e.features || e.features.length === 0) return;
        
        map.current.getCanvas().style.cursor = 'pointer';
        
        const feature = e.features[0];
        const coordinates = (feature.geometry as any).coordinates.slice();
        const name = feature.properties?.name;
        const count = feature.properties?.count;
        
        // Create the popup content
        const popupHTML = `
          <div class="p-2">
            <div class="font-bold text-gray-900">${name}</div>
            <div class="text-sm text-gray-600">${count} experience${count !== 1 ? 's' : ''}</div>
          </div>
        `;
        
        // Populate the popup and set its coordinates
        popup.current
          .setLngLat(coordinates)
          .setHTML(popupHTML)
          .addTo(map.current);
      });
      
      // Handle mouse leave events
      map.current?.on('mouseleave', 'location-circles', () => {
        if (!map.current) return;
        
        map.current.getCanvas().style.cursor = '';
        popup.current?.remove();
      });
      
      // Handle click events
      map.current?.on('click', 'location-circles', (e) => {
        if (!map.current || !e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const name = feature.properties?.name;
        
        // In a full implementation, this would navigate to a filtered view
        console.log(`Clicked on ${name}`);
      });
      
      // Auto-rotate in globe mode with smooth animation
      if (viewMode === '3d') {
        // Start with a slight animation to ensure users notice it's 3D
        map.current?.flyTo({
          center: [0, 20],
          zoom: 2,
          pitch: 40,
          duration: 3000,
          essential: true
        });
        
        const rotateCamera = () => {
          if (!map.current) return;
          
          map.current.rotateTo((map.current.getBearing() + 0.1) % 360, { 
            duration: 200, // Smoother rotation with longer duration
            easing: (t) => t // Linear easing for continuous rotation
          });
          requestAnimationFrame(rotateCamera);
        };
        
        // Start rotation after initial animation
        setTimeout(() => {
          requestAnimationFrame(rotateCamera);
        }, 1000);
      }
    });
    
    // Clean up
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (popup.current) {
        popup.current.remove();
        popup.current = null;
      }
    };
  }, [locationData, isLoading, viewMode]);
  
  // Handle view mode toggle with smooth transition
  const toggleViewMode = () => {
    const newMode = viewMode === '3d' ? '2d' : '3d';
    setViewMode(newMode);
    
    // Update map projection if the map exists
    if (map.current) {
      // Add a smooth transition by using flyTo
      map.current.flyTo({
        center: [0, 20],
        zoom: 1.8,
        duration: 2500,
        pitch: newMode === '3d' ? 45 : 0, // Add more pitch for 3D mode for better visualization
      });
      
      // Only update projection after starting the animation
      setTimeout(() => {
        if (map.current) {
          map.current.setProjection(newMode === '3d' ? 'globe' : 'mercator');
          
          // Reset fog settings with appropriate day time appearance
          if (newMode === '3d') {
            map.current.setFog({
              color: 'rgb(186, 228, 255)', // Lighter blue atmosphere color
              'high-color': 'rgb(145, 205, 242)', // Brighter sky blue for upper atmosphere
              'horizon-blend': 0.1, // More visible atmosphere blend
              'space-color': 'rgb(200, 230, 255)', // Much lighter blue space color for better daytime look
              'star-intensity': 0 // No stars in daytime
            });
            
            // Start rotation again for 3D mode with smoother animation
            const rotateCamera = () => {
              if (!map.current || viewMode !== '3d') return;
              
              map.current.rotateTo((map.current.getBearing() + 0.1) % 360, { 
                duration: 200,
                easing: (t) => t
              });
              requestAnimationFrame(rotateCamera);
            };
            
            requestAnimationFrame(rotateCamera);
          } else {
            map.current.setFog({});
          }
        }
      }, 500); // Longer delay to make the transition smoother
    }
  };
  
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex flex-row justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Explore Experiences Worldwide</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleViewMode}
          className="ml-2"
        >
          <Filter className="w-4 h-4 mr-2" />
          {viewMode === '3d' ? '2D Map' : '3D Globe'}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="w-full h-[350px] md:h-[450px] flex items-center justify-center">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      ) : (
        <div className="w-full relative">
          <div 
            ref={mapContainer} 
            className="w-full h-[350px] md:h-[450px] rounded-lg overflow-hidden border border-gray-200 shadow-sm"
          />
          
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {locationData.slice(0, 5).map(location => (
              <Button 
                key={location.id}
                variant="outline" 
                size="sm"
                className="flex items-center space-x-1 text-xs"
              >
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: location.color }}
                />
                <span className="ml-1">{location.name}</span>
                <span className="ml-1 bg-gray-100 rounded-full px-1.5 py-0.5 text-xs">
                  {location.count}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-sm text-gray-500 text-center mt-2">
        Explore {locationData.length} destinations from our community's travel experiences
      </p>
    </div>
  );
};

export default MapboxGlobe; 