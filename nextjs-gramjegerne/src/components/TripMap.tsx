'use client';
import {useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback} from 'react';
import * as L from 'leaflet';
import {Icon} from '@/components/Icon';
import {CampingSpot, Route} from '@/types';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as {_getIconUrl?: string})._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Coordinates {
  lat: number;
  lng: number;
}

interface TripMapProps {
  campingSpots: CampingSpot[];
  routes: Route[];
  onSpotClick?: (spot: CampingSpot) => void;
  onMapClick?: (coordinates: Coordinates) => void;
  onRouteClick?: (route: Route) => void;
  isDrawingRoute?: boolean;
  onRoutePointAdd?: (coordinates: Coordinates) => void;
}

export interface TripMapRef {
  getCurrentView: () => {center: {lat: number; lng: number}; zoom: number} | null;
  restoreView: (view: {center: {lat: number; lng: number}; zoom: number}) => void;
}

const TripMap = forwardRef<TripMapRef, TripMapProps>(
  (
    {
      campingSpots,
      routes,
      onSpotClick,
      onMapClick,
      onRouteClick,
      isDrawingRoute = false,
      onRoutePointAdd,
    },
    ref,
  ) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [showLayerInfo, setShowLayerInfo] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    // Search for places using OpenStreetMap Nominatim API
    const searchPlaces = useCallback(async (query: string) => {
      if (!query.trim()) return;

      setIsSearching(true);
      try {
        // Use OpenStreetMap Nominatim for geocoding (free, no API key)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=no&viewbox=3.0,57.0,32.0,71.0&bounded=1`,
        );

        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, []);

    // Zoom to search result
    const zoomToSearchResult = useCallback((result: any) => {
      if (mapInstanceRef.current) {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        mapInstanceRef.current.setView([lat, lon], 15);
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    }, []);

    // Handle search input
    const handleSearchInput = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim()) {
          searchPlaces(query);
        } else {
          setSearchResults([]);
        }
      },
      [searchPlaces],
    );

    // Function to get current map view state
    const getCurrentMapView = () => {
      if (!mapInstanceRef.current) return null;
      const map = mapInstanceRef.current;
      return {
        center: map.getCenter(),
        zoom: map.getZoom(),
      };
    };

    // Function to restore map view state
    const restoreMapView = (view: {center: L.LatLng; zoom: number}) => {
      if (!mapInstanceRef.current) return;
      const map = mapInstanceRef.current;
      map.setView(view.center, view.zoom);
    };

    // Expose map functions to parent component
    useImperativeHandle(
      ref,
      () => ({
        getCurrentView: () => {
          if (!mapInstanceRef.current) return null;
          const map = mapInstanceRef.current;
          const center = map.getCenter();
          return {
            center: {lat: center.lat, lng: center.lng},
            zoom: map.getZoom(),
          };
        },
        restoreView: (view: {center: {lat: number; lng: number}; zoom: number}) => {
          if (!mapInstanceRef.current) return;
          const map = mapInstanceRef.current;
          map.setView([view.center.lat, view.center.lng], view.zoom);
        },
      }),
      [],
    );

    // Initialize map
    useEffect(() => {
      if (!mapRef.current) return;

      // Create map instance
      const map = L.map(mapRef.current, {
        center: [62.5, 10.5], // Center of Norway
        zoom: 6,
        zoomControl: false,
      });

      // Define base maps
      const baseMaps = {
        OpenTopoMap: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenTopoMap contributors',
          maxZoom: 18,
        }),
        'ESRI Satellite': L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: '© ESRI',
            maxZoom: 18,
          },
        ),
      };

      // Add default layer (OpenTopoMap)
      baseMaps['OpenTopoMap'].addTo(map);

      // Add layer control
      const layerControl = L.control.layers(baseMaps).addTo(map);

      // Customize layer control styling
      const layerControlContainer = layerControl.getContainer();
      if (layerControlContainer) {
        layerControlContainer.style.backgroundColor = '#1a1a1a';
        layerControlContainer.style.border = '1px solid #333';
        layerControlContainer.style.borderRadius = '8px';
        layerControlContainer.style.padding = '8px';
        layerControlContainer.style.color = 'white';
        layerControlContainer.style.fontSize = '12px';
        layerControlContainer.style.fontFamily = 'system-ui, sans-serif';

        // Style the radio buttons and labels
        const labels = layerControlContainer.querySelectorAll('label');
        labels.forEach((label) => {
          label.style.color = 'white';
          label.style.marginBottom = '4px';
          label.style.cursor = 'pointer';
          label.style.display = 'block';
          label.style.padding = '2px 0';
        });

        const inputs = layerControlContainer.querySelectorAll('input[type="radio"]');
        inputs.forEach((input) => {
          (input as HTMLElement).style.accentColor = '#3b82f6';
          (input as HTMLElement).style.marginRight = '6px';
        });

        // Add hover effects
        labels.forEach((label) => {
          label.addEventListener('mouseenter', () => {
            label.style.backgroundColor = '#333';
            label.style.borderRadius = '4px';
            label.style.padding = '2px 4px';
          });
          label.addEventListener('mouseleave', () => {
            label.style.backgroundColor = 'transparent';
            label.style.padding = '2px 0';
          });
        });
      }

      // Store map instance
      mapInstanceRef.current = map;
      setIsMapReady(true);

      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, []);

    // Handle map click events separately to prevent map recreation
    useEffect(() => {
      if (!mapInstanceRef.current || !isMapReady) return;

      const map = mapInstanceRef.current;

      // Remove existing click handlers
      map.off('click');

      // Add click handler for adding new spots (only when not drawing routes)
      if (onMapClick && !isDrawingRoute) {
        map.on('click', (e) => {
          const coordinates: Coordinates = {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          };
          onMapClick(coordinates);
        });
      }
    }, [onMapClick, isMapReady, isDrawingRoute]);

    // Add camping spots to map
    useEffect(() => {
      if (!mapInstanceRef.current || !isMapReady) return;

      const map = mapInstanceRef.current;

      // Clear existing markers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      // Add camping spot markers
      campingSpots.forEach((spot) => {
        const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], {
          title: spot.name,
          icon: L.divIcon({
            className: 'custom-marker',
            html: `
            <div class="bg-accent text-secondary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border-2 border-secondary shadow-lg">
              ⛺︎
            </div>
          `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        });

        // Add popup
        const popupContent = `
        <div class="p-2">
          <h3 class="font-bold text-lg mb-2">${spot.name}</h3>
          ${spot.description ? `<p class="text-sm text-gray-700">${spot.description}</p>` : ''}
          <p class="text-xs text-gray-600">
            ${spot.coordinates.lat.toFixed(6)}, ${spot.coordinates.lng.toFixed(6)}
          </p>
        </div>
      `;
        marker.bindPopup(popupContent);

        // Add click handler
        if (onSpotClick) {
          marker.on('click', () => onSpotClick(spot));
        }

        marker.addTo(map);
      });
    }, [campingSpots, isMapReady, onSpotClick]);

    // Add routes to map
    useEffect(() => {
      if (!mapInstanceRef.current || !isMapReady) return;

      const map = mapInstanceRef.current;

      // Clear existing polylines
      map.eachLayer((layer) => {
        if (layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      // Add route polylines
      routes.forEach((route) => {
        if (route.waypoints.length < 2) return;

        const latlngs = route.waypoints.map((wp) => [wp.lat, wp.lng]);
        const polyline = L.polyline(latlngs as [number, number][], {
          color: route.color || '#10B981',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 5',
        });

        // Add popup
        const popupContent = `
        <div class="p-2">
          <h3 class="font-bold text-lg mb-2">${route.name}</h3>
          <p class="text-sm">${route.waypoints.length} waypoints</p>
        </div>
      `;
        polyline.bindPopup(popupContent);

        // Add click handler
        if (onRouteClick) {
          polyline.on('click', () => onRouteClick(route));
        }

        polyline.addTo(map);
      });
    }, [routes, isMapReady, onRouteClick]);

    // Handle route drawing mode
    useEffect(() => {
      if (!mapInstanceRef.current || !isMapReady) return;

      const map = mapInstanceRef.current;

      if (isDrawingRoute && onRoutePointAdd) {
        // Change cursor to indicate drawing mode
        map.getContainer().style.cursor = 'crosshair';

        const handleMapClick = (e: L.LeafletMouseEvent) => {
          const coordinates: Coordinates = {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          };
          onRoutePointAdd(coordinates);
        };

        map.on('click', handleMapClick);

        return () => {
          map.off('click', handleMapClick);
          map.getContainer().style.cursor = '';
        };
      }
    }, [isDrawingRoute, isMapReady, onRoutePointAdd]);

    return (
      <div className="w-full h-full min-h-[600px] rounded-2xl overflow-hidden border border-white/10 relative">
        <div ref={mapRef} className="w-full h-full min-h-[600px]" />

        {/* Error Display */}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95 z-[1001]">
            <div className="text-center p-6">
              <h3 className="text-lg font-medium text-red-400 mb-2">Map Error</h3>
              <p className="text-white/70 mb-4">{mapError}</p>
              <button onClick={() => window.location.reload()} className="button-primary">
                Reload Page
              </button>
            </div>
          </div>
        )}

        {/* Map Controls Overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
          {/* Search Toggle Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="bg-background/90 backdrop-blur-sm rounded-lg p-2 border border-white/10 hover:bg-background/95 transition-colors"
            title="Toggle search"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-xs text-accent">🔍</span>
            </div>
          </button>

          {/* Search Panel */}
          {showSearch && (
            <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-white/10 max-w-64">
              <h3 className="text-sm font-medium text-accent mb-2">Search Places</h3>

              {/* Search Input */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  placeholder="Search for places in Norway..."
                  className="w-full p-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 text-sm focus:border-accent focus:outline-none"
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-2 top-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => zoomToSearchResult(result)}
                      className="w-full text-left p-2 hover:bg-white/10 rounded text-sm text-white/90 hover:text-white transition-colors"
                    >
                      <div className="font-medium">{result.display_name.split(',')[0]}</div>
                      <div className="text-xs text-white/60 truncate">
                        {result.display_name.split(',').slice(1, 3).join(',')}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {searchQuery && searchResults.length === 0 && !isSearching && (
                <p className="text-xs text-white/50 text-center py-2">No places found</p>
              )}

              <p className="text-xs text-white/50 mt-2">
                Search for cities, mountains, lakes, etc.
              </p>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setShowLayerInfo(!showLayerInfo)}
            className="bg-background/90 backdrop-blur-sm rounded-lg p-2 border border-white/10 hover:bg-background/95 transition-colors"
            title="Toggle layer information"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-xs text-accent">ℹ️</span>
            </div>
          </button>

          {/* Layer Information Panel */}
          {showLayerInfo && (
            <div className="absolute bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs max-w-48">
              <h3 className="font-medium mb-2">Map Layers</h3>
              <ul className="space-y-1">
                <li>
                  • <strong>OpenTopoMap</strong> - Terrain with contours
                </li>
                <li>
                  • <strong>ESRI Satellite</strong> - High-quality aerial imagery
                </li>
              </ul>
              <p className="text-white/70 mt-2 text-xs">
                Use the layer control (top-right of map) to switch
              </p>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-4 left-4 z-[1000]">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
            <div className="text-xs text-white/70">
              {!isMapReady ? (
                <span className="text-yellow-400">Loading map...</span>
              ) : isDrawingRoute ? (
                <span className="text-accent">Click to add route waypoints</span>
              ) : (
                <span>Click to add camping spots</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default TripMap;
