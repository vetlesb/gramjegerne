'use client';
import {useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback} from 'react';
import * as L from 'leaflet';
import {CampingSpot, Route} from '@/types';
import {useDebounce} from '@/hooks/useDebounce';

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

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
  place_id: string;
}

interface TripMapProps {
  campingSpots: CampingSpot[];
  routes: Route[];
  onSpotClick?: (spot: CampingSpot) => void;
  onMapClick?: (coordinates: Coordinates) => void;
  onRouteClick?: (route: Route) => void;
  isDrawingRoute?: boolean;
  isAddingSpot?: boolean;
  onRoutePointAdd?: (coordinates: Coordinates) => void;
  // Toolbar visibility controls
  showRoutes?: boolean;
  showCampSpots?: boolean;
  showFishingSpots?: boolean;
  showViewpointSpots?: boolean;
  onToggleRoutes?: () => void;
  onToggleCampSpots?: () => void;
  onToggleFishingSpots?: () => void;
  onToggleViewpointSpots?: () => void;
  // Mobile dock control
  isDockVisible?: boolean;
  onToggleDock?: () => void;
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
      isAddingSpot = false,
      onRoutePointAdd,
      // Toolbar controls
      showRoutes = true,
      showCampSpots = true,
      showFishingSpots = true,
      showViewpointSpots = true,
      onToggleRoutes,
      onToggleCampSpots,
      onToggleFishingSpots,
      onToggleViewpointSpots,
      // Mobile dock control
      isDockVisible,
      onToggleDock,
    },
    ref,
  ) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [mapError] = useState<string | null>(null);

    const [tilesLoading, setTilesLoading] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [currentLayer, setCurrentLayer] = useState('Kartverket Raster');

    // Search for places using OpenStreetMap Nominatim API
    const searchPlaces = useCallback(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        // Use OpenStreetMap Nominatim for geocoding (free, no API key)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&countrycodes=no&viewbox=3.0,57.0,32.0,71.0&bounded=1&addressdetails=1`,
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

    // Debounced search function
    const debouncedSearch = useDebounce((...args: unknown[]) => {
      const query = args[0] as string;
      searchPlaces(query);
    }, 300);

    // Zoom to search result
    const zoomToSearchResult = useCallback((result: SearchResult) => {
      if (mapInstanceRef.current) {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        mapInstanceRef.current.setView([lat, lon], 15);
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
          setIsSearching(true);
          debouncedSearch(query);
        } else {
          setSearchResults([]);
          setIsSearching(false);
        }
      },
      [debouncedSearch],
    );

    // Clear search results when clicking on map
    const handleMapClick = useCallback(() => {
      if (searchResults.length > 0) {
        setSearchResults([]);
      }
    }, [searchResults.length]);

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

      // Create map instance with optimized settings
      const map = L.map(mapRef.current, {
        center: [62.5, 10.5], // Center of Norway
        zoom: 6,
        zoomControl: false,
        // Performance optimizations
        preferCanvas: false, // SVG is better for detailed topo maps
        maxBoundsViscosity: 0.8, // Smooth boundary handling
      });

      // Define base maps with optimized tile loading
      const baseMaps = {
        'Kartverket Raster': L.tileLayer(
          'https://cache.kartverket.no/v1/wmts/1.0.0/toporaster/default/webmercator/{z}/{y}/{x}.png',
          {
            attribution: '© Kartverket',
            maxZoom: 18,
            crossOrigin: 'anonymous',
            updateWhenIdle: false,
            updateWhenZooming: true,
            keepBuffer: 3,
            errorTileUrl: '',
          },
        ),
        OpenTopoMap: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenTopoMap contributors',
          maxZoom: 17, // OpenTopoMap's actual max zoom
          crossOrigin: 'anonymous', // Better caching
          updateWhenIdle: false, // Load tiles while panning
          updateWhenZooming: true, // Load tiles while zooming
          keepBuffer: 3, // Keep more tiles in memory for smoother experience
          // Tile loading optimizations
          errorTileUrl: '', // Don't show error tiles
          // Multiple subdomains for faster loading
          subdomains: ['a', 'b', 'c'],
        }),
        'ESRI Satellite': L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: '© ESRI',
            maxZoom: 19, // ESRI supports higher zoom
            crossOrigin: 'anonymous',
            updateWhenIdle: false,
            updateWhenZooming: true,
            keepBuffer: 3,
            errorTileUrl: '',
          },
        ),
        OpenStreetMap: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          crossOrigin: 'anonymous',
          updateWhenIdle: false,
          updateWhenZooming: true,
          keepBuffer: 3,
          errorTileUrl: '',
        }),
      };

      // Add default layer (Kartverket Raster)
      baseMaps['Kartverket Raster'].addTo(map);

      // Add layer control (but hide it - we'll use our custom toolbar)
      const layerControl = L.control.layers(baseMaps);
      layerControl.addTo(map);

      // Hide the default layer control
      const layerControlContainer = layerControl.getContainer();
      if (layerControlContainer) {
        layerControlContainer.style.display = 'none';
      }

      // Add tile loading progress tracking
      const currentLayer = baseMaps['OpenTopoMap'];

      currentLayer.on('loading', () => {
        setTilesLoading((prev) => prev + 1);
      });

      currentLayer.on('load', () => {
        setTilesLoading((prev) => Math.max(0, prev - 1));
      });

      currentLayer.on('tileerror', () => {
        setTilesLoading((prev) => Math.max(0, prev - 1));
      });

      // Reset loading state when layer changes
      map.on('baselayerchange', (e: L.LayersControlEvent) => {
        setTilesLoading(0);

        // Add loading events to new layer
        e.layer.on('loading', () => {
          setTilesLoading((prev) => prev + 1);
        });

        e.layer.on('load', () => {
          setTilesLoading((prev) => Math.max(0, prev - 1));
        });

        e.layer.on('tileerror', () => {
          setTilesLoading((prev) => Math.max(0, prev - 1));
        });
      });

      // Store map instance
      mapInstanceRef.current = map;

      // Auto-fit map to show all content
      const fitMapToContent = () => {
        // Collect all coordinates from spots and routes
        const spotCoordinates = campingSpots.map((spot) => [
          spot.coordinates.lat,
          spot.coordinates.lng,
        ]);
        const routeCoordinates = routes.flatMap((route) =>
          route.waypoints.map((wp) => [wp.lat, wp.lng]),
        );
        const allCoordinates = [...spotCoordinates, ...routeCoordinates];

        if (allCoordinates.length > 0) {
          // Fit map to show all content with padding
          const bounds = L.latLngBounds(allCoordinates as [number, number][]);
          map.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: 16, // Don't zoom in too much for single points
          });
        } else {
          // Default view for empty trips (center on Norway)
          map.setView([61.5, 9], 6);
        }
      };

      // Fit map after a short delay to ensure all layers are loaded
      setTimeout(fitMapToContent, 100);

      setIsMapReady(true);

      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    // ^ Intentionally empty - we only want auto-fit on initial load, not when content changes

    // Create toolbar after map is ready (separate from map initialization)
    useEffect(() => {
      if (!mapInstanceRef.current || !isMapReady) return;

      const map = mapInstanceRef.current;

      // Create custom toolbar control
      const CustomToolbar = L.Control.extend({
        onAdd: function () {
          const div = L.DomUtil.create('div', 'custom-toolbar');
          div.style.backgroundColor = '#1a1a1a';
          div.style.border = '1px solid #333';
          div.style.borderRadius = '8px';
          div.style.padding = '8px';
          div.style.display = 'flex';
          div.style.flexDirection = 'column';
          div.style.gap = '4px';

          // Map Layer Button with Popover
          const layerBtnContainer = L.DomUtil.create('div', '', div);
          layerBtnContainer.style.position = 'relative';
          layerBtnContainer.style.marginBottom = '4px';

          const layerBtn = L.DomUtil.create('button', '', layerBtnContainer);
          layerBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 3L21 3L21 17L8 17L8 3ZM19 5L10 5L10 15L19 15L19 5ZM4 8L6 8L6 19L17 19L17 21L4 21L4 8Z" fill="currentColor"/>
</svg>
`;
          layerBtn.title = 'Select map layer';
          layerBtn.className = 'button-ghost !w-8 !h-8 !p-0 flex items-center justify-center';

          // Create popover
          const popover = L.DomUtil.create('div', '', layerBtnContainer);
          popover.style.cssText = `
            position: absolute; top: 0; right: 100%; margin-right: 4px;
            background: #1a1a1a; border: 1px solid #333; border-radius: 8px;
            padding: 8px; min-width: 120px; display: none; z-index: 1000;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          `;

          const layerOptions = [
            {key: 'Kartverket Raster', label: 'Kartverket'},
            {key: 'OpenTopoMap', label: 'TopoMap'},
            {key: 'ESRI Satellite', label: 'Satellite'},
            {key: 'OpenStreetMap', label: 'Street'},
          ];

          layerOptions.forEach((option) => {
            const optionBtn = L.DomUtil.create('button', '', popover);
            optionBtn.textContent = option.label;
            optionBtn.style.cssText = `
              display: block; width: 100%; text-align: left; padding: 4px 8px;
              background: ${currentLayer === option.key ? '#10b981' : 'transparent'};
              color: white; border: none; border-radius: 4px; cursor: pointer;
              font-size: 12px; margin-bottom: 2px;
            `;
            optionBtn.style.setProperty('hover:background-color', '#333', 'important');

            L.DomEvent.on(optionBtn, 'click', function (e) {
              L.DomEvent.stopPropagation(e);
              setCurrentLayer(option.key);

              // Switch the map layer
              const map = mapInstanceRef.current;
              if (map) {
                // Remove current layer
                map.eachLayer((layer) => {
                  if (layer instanceof L.TileLayer) {
                    map.removeLayer(layer);
                  }
                });
                // Add new layer
                const baseMaps = {
                  'Kartverket Raster': L.tileLayer(
                    'https://cache.kartverket.no/v1/wmts/1.0.0/toporaster/default/webmercator/{z}/{y}/{x}.png',
                    {
                      attribution: '© Kartverket',
                      maxZoom: 18,
                    },
                  ),
                  OpenTopoMap: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenTopoMap contributors',
                    maxZoom: 18,
                  }),
                  'ESRI Satellite': L.tileLayer(
                    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    {
                      attribution: '© Esri',
                      maxZoom: 18,
                    },
                  ),
                  OpenStreetMap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19,
                  }),
                };
                baseMaps[option.key as keyof typeof baseMaps].addTo(map);
              }

              // Hide popover
              popover.style.display = 'none';
            });

            // Add hover effect
            L.DomEvent.on(optionBtn, 'mouseenter', function () {
              if (currentLayer !== option.key) {
                optionBtn.style.backgroundColor = '#333';
              }
            });
            L.DomEvent.on(optionBtn, 'mouseleave', function () {
              if (currentLayer !== option.key) {
                optionBtn.style.backgroundColor = 'transparent';
              }
            });
          });

          // Toggle popover on button click
          L.DomEvent.on(layerBtn, 'click', function (e) {
            L.DomEvent.stopPropagation(e);
            const isVisible = popover.style.display === 'block';
            popover.style.display = isVisible ? 'none' : 'block';
          });

          // Hide popover when clicking elsewhere
          document.addEventListener('click', function () {
            popover.style.display = 'none';
          });

          // Check if we have any routes
          const hasRoutes = routes && routes.length > 0;

          // Routes toggle (only show if there are routes)
          if (hasRoutes) {
            const routesBtn = L.DomUtil.create('button', '', div);
            routesBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.5 2C7.52488 2 8.4041 2.61743 8.79004 3.5H15.75C18.3734 3.5 20.5 5.62665 20.5 8.25C20.5 10.8734 18.3734 13 15.75 13H7.75C6.23122 13 5 14.2312 5 15.75C5 17.2688 6.23122 18.5 7.75 18.5H15.21C15.5959 17.6174 16.4751 17 17.5 17C18.8807 17 20 18.1193 20 19.5C20 20.8807 18.8807 22 17.5 22C16.4751 22 15.5959 21.3826 15.21 20.5H7.75C5.12665 20.5 3 18.3734 3 15.75C3 13.1266 5.12665 11 7.75 11H15.75C17.2688 11 18.5 9.76878 18.5 8.25C18.5 6.73122 17.2688 5.5 15.75 5.5H8.79004C8.4041 6.38257 7.52488 7 6.5 7C5.11929 7 4 5.88071 4 4.5C4 3.11929 5.11929 2 6.5 2Z" fill="currentColor"/>
</svg>
`;
            routesBtn.title = 'Toggle routes';
            routesBtn.className = `${showRoutes ? 'button-primary' : 'button-ghost'} !w-8 !h-8 !p-0 flex items-center justify-center`;
            L.DomEvent.on(routesBtn, 'click', function (e) {
              L.DomEvent.stopPropagation(e);
              onToggleRoutes?.();
            });
          }

          // Check if we have camping spots
          const hasCampSpots =
            campingSpots && campingSpots.some((spot) => spot.category === 'camp');

          // Camp spots toggle (only show if there are camp spots)
          if (hasCampSpots) {
            const campBtn = L.DomUtil.create('button', '', div);
            campBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.8359 2.5L12.8818 5.88379L21.3203 20.5L19.5879 21.5L11.7266 7.88379L3.86621 21.5L2.13379 20.5L10.5723 5.88281L8.61914 2.5L10.3506 1.5L11.7266 3.88379L13.1035 1.5L14.8359 2.5Z" fill="currentColor"/>
</svg>
`;
            campBtn.title = 'Toggle camp spots';
            campBtn.className = `${showCampSpots ? 'button-primary' : 'button-ghost'} !w-8 !h-8 !p-0 flex items-center justify-center`;
            L.DomEvent.on(campBtn, 'click', function (e) {
              L.DomEvent.stopPropagation(e);
              onToggleCampSpots?.();
            });
          }

          // Check if we have fishing spots
          const hasFishingSpots =
            campingSpots && campingSpots.some((spot) => spot.category === 'fishing');

          // Fishing spots toggle (only show if there are fishing spots)
          if (hasFishingSpots) {
            const fishingBtn = L.DomUtil.create('button', '', div);
            fishingBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.88477 6.00977C12.3125 6.17206 15.0403 8.35368 17.4443 10.5547L21.6572 6.34277V17.6572L17.4443 13.4443C15.0402 15.6455 12.3127 17.8279 8.88477 17.9902L8.47656 18C4.89986 18 2 15.3137 2 12C2 8.68629 4.89986 6 8.47656 6L8.88477 6.00977ZM8.47656 8C5.85785 8 4 9.93195 4 12C4 14.068 5.85785 16 8.47656 16C10.1373 15.9999 11.6607 15.3759 13.1855 14.3428C14.1784 13.67 15.101 12.8738 16.0273 12.0273L16 12L16.0273 11.9717C15.1012 11.1254 14.1782 10.3298 13.1855 9.65723C11.6607 8.62406 10.1373 8.00009 8.47656 8Z" fill="currentColor"/>
</svg>
`;
            fishingBtn.title = 'Toggle fishing spots';
            fishingBtn.className = `${showFishingSpots ? 'button-primary' : 'button-ghost'} !w-8 !h-8 !p-0 flex items-center justify-center`;
            L.DomEvent.on(fishingBtn, 'click', function (e) {
              L.DomEvent.stopPropagation(e);
              onToggleFishingSpots?.();
            });
          }

          // Check if we have viewpoint spots
          const hasViewpointSpots =
            campingSpots && campingSpots.some((spot) => spot.category === 'viewpoint');

          // Viewpoint spots toggle (only show if there are viewpoint spots)
          if (hasViewpointSpots) {
            const viewpointBtn = L.DomUtil.create('button', '', div);
            viewpointBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2C15.866 2 19 5.41126 19 9.61914L18.9883 10.0996C18.757 15.0265 15.0094 18.7245 12 22C8.99062 18.7245 5.243 15.0265 5.01172 10.0996L5 9.61914C5 5.41126 8.13401 2 12 2ZM12 4C9.39475 4 7 6.3529 7 9.61914C7.00002 11.6723 7.76642 13.5356 8.99512 15.3643C9.86438 16.6579 10.9066 17.8522 12 19.0479C13.0934 17.8522 14.1356 16.6579 15.0049 15.3643C16.2336 13.5356 17 11.6723 17 9.61914C17 6.3529 14.6052 4 12 4ZM12 6C13.6569 6 15 7.34315 15 9C15 10.6569 13.6569 12 12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6Z" fill="currentColor"/>
</svg>
`;
            viewpointBtn.title = 'Toggle viewpoint spots';
            viewpointBtn.className = `${showViewpointSpots ? 'button-primary' : 'button-ghost'} !w-8 !h-8 !p-0 flex items-center justify-center`;
            L.DomEvent.on(viewpointBtn, 'click', function (e) {
              L.DomEvent.stopPropagation(e);
              onToggleViewpointSpots?.();
            });
          }

          // Mobile dock toggle button (only show on mobile and if onToggleDock is provided)
          if (onToggleDock) {
            const dockBtn = L.DomUtil.create('button', '', div);
            dockBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" fill="currentColor"/>
</svg>
`;
            dockBtn.title = isDockVisible ? 'Hide trip details' : 'Show trip details';
            dockBtn.className = `${isDockVisible ? 'button-primary' : 'button-ghost'} !w-8 !h-8 !p-0 flex items-center justify-center lg:hidden`;
            L.DomEvent.on(dockBtn, 'click', function (e) {
              L.DomEvent.stopPropagation(e);
              onToggleDock();
            });
          }

          return div;
        },
      });

      // Add custom toolbar
      const toolbar = new CustomToolbar({position: 'topright'});
      toolbar.addTo(map);

      // Store toolbar reference for cleanup
      return () => {
        if (toolbar && map) {
          map.removeControl(toolbar);
        }
      };
    }, [
      isMapReady,
      showRoutes,
      showCampSpots,
      showFishingSpots,
      showViewpointSpots,
      currentLayer,
      campingSpots,
      routes,
      onToggleRoutes,
      onToggleCampSpots,
      onToggleFishingSpots,
      onToggleViewpointSpots,
      isDockVisible,
      onToggleDock,
    ]);

    // Handle map click events separately to prevent map recreation
    useEffect(() => {
      if (!mapInstanceRef.current || !isMapReady) return;

      const map = mapInstanceRef.current;

      // Remove existing click handlers
      map.off('click');

      // Add click handler for adding new spots (only when not drawing routes)
      if (onMapClick && !isDrawingRoute) {
        map.on('click', (e) => {
          // Clear search results when clicking on map
          handleMapClick();

          const coordinates: Coordinates = {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          };
          onMapClick(coordinates);
        });
      } else {
        // Still clear search results even when not adding spots
        map.on('click', () => {
          handleMapClick();
        });
      }
    }, [onMapClick, isMapReady, isDrawingRoute, handleMapClick]);

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

      // Add camping spot markers (filtered by category visibility)
      campingSpots.forEach((spot) => {
        // Check if this category should be visible
        const shouldShow =
          (spot.category === 'camp' && showCampSpots) ||
          (spot.category === 'fishing' && showFishingSpots) ||
          (spot.category === 'viewpoint' && showViewpointSpots);

        if (!shouldShow) return;

        // Use theme variables instead of category-specific colors

        // Get the appropriate icon SVG based on category
        const getCategoryIcon = (category: string) => {
          switch (category) {
            case 'camp':
              return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.8359 2.5L12.8818 5.88379L21.3203 20.5L19.5879 21.5L11.7266 7.88379L3.86621 21.5L2.13379 20.5L10.5723 5.88281L8.61914 2.5L10.3506 1.5L11.7266 3.88379L13.1035 1.5L14.8359 2.5Z" fill="currentColor"/>
              </svg>`;
            case 'fishing':
              return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.88477 6.00977C12.3125 6.17206 15.0403 8.35368 17.4443 10.5547L21.6572 6.34277V17.6572L17.4443 13.4443C15.0402 15.6455 12.3127 17.8279 8.88477 17.9902L8.47656 18C4.89986 18 2 15.3137 2 12C2 8.68629 4.89986 6 8.47656 6L8.88477 6.00977ZM8.47656 8C5.85785 8 4 9.93195 4 12C4 14.068 5.85785 16 8.47656 16C10.1373 15.9999 11.6607 15.3759 13.1855 14.3428C14.1784 13.67 15.101 12.8738 16.0273 12.0273L16 12L16.0273 11.9717C15.1012 11.1254 14.1782 10.3298 13.1855 9.65723C11.6607 8.62406 10.1373 8.00009 8.47656 8Z" fill="currentColor"/>
              </svg>`;
            case 'viewpoint':
              return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C15.866 2 19 5.41126 19 9.61914L18.9883 10.0996C18.757 15.0265 15.0094 18.7245 12 22C8.99062 18.7245 5.243 15.0265 5.01172 10.0996L5 9.61914C5 5.41126 8.13401 2 12 2ZM12 4C9.39475 4 7 6.3529 7 9.61914C7.00002 11.6723 7.76642 13.5356 8.99512 15.3643C9.86438 16.6579 10.9066 17.8522 12 19.0479C13.0934 17.8522 14.1356 16.6579 15.0049 15.3643C16.2336 13.5356 17 11.6723 17 9.61914C17 6.3529 14.6052 4 12 4ZM12 6C13.6569 6 15 7.34315 15 9C15 10.6569 13.6569 12 12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6Z" fill="currentColor"/>
              </svg>`;
            default:
              return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C15.866 2 19 5.41126 19 9.61914L18.9883 10.0996C18.757 15.0265 15.0094 18.7245 12 22C8.99062 18.7245 5.243 15.0265 5.01172 10.0996L5 9.61914C5 5.41126 8.13401 2 12 2ZM12 4C9.39475 4 7 6.3529 7 9.61914C7.00002 11.6723 7.76642 13.5356 8.99512 15.3643C9.86438 16.6579 10.9066 17.8522 12 19.0479C13.0934 17.8522 14.1356 16.6579 15.0049 15.3643C16.2336 13.5356 17 11.6723 17 9.61914C17 6.3529 14.6052 4 12 4ZM12 6C13.6569 6 15 7.34315 15 9C15 10.6569 13.6569 12 12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6Z" fill="currentColor"/>
              </svg>`;
          }
        };

        const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], {
          title: spot.name,
          icon: L.divIcon({
            className: 'custom-marker',
            html: `
            <div class="rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold border-2 border-white shadow-lg" style="background-color: var(--bg-primary); color: var(--fg-accent);">
              ${getCategoryIcon(spot.category)}
            </div>
          `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        });

        // Get category display name
        const getCategoryDisplayName = (category: string) => {
          switch (category) {
            case 'camp':
              return 'Camp';
            case 'fishing':
              return 'Fishing water';
            case 'viewpoint':
              return 'Viewpoint';
            default:
              return 'Spot';
          }
        };

        // Add popup with theme variables
        const popupContent = `
        <div style="background-color: var(--bg-primary); color: var(--fg-primary); border-radius: 8px; min-width: 200px; margin: 0; padding: 10px 0 6px 0;">
          <h3 class="font-bold text-lg" style="color: var(--fg-accent); margin-bottom: 8px; margin-top: 0;">${spot.name}</h3>

          ${spot.description ? `<p class="text-md" style="color: var(--fg-primary); margin-bottom: 16px; font-size: 14px; margin-top: 0;">${spot.description}</p>` : ''}
                    <p class="text-xs" style="color: var(--fg-primary); font-size: 14px; margin-bottom: 8px; margin-top: 0;">${getCategoryDisplayName(spot.category)}</p>
          <p class="text-xs" style="color: var(--fg-primary); font-size: 14px; opacity: 0.5; margin-bottom: 8px; margin-top: 0;">${spot.coordinates.lat.toFixed(6)}, ${spot.coordinates.lng.toFixed(6)}</p>
        </div>
        <style>
          .leaflet-popup-content-wrapper {
            background-color: var(--bg-primary) !important;
            border-radius: 8px !important;
            padding: 0 !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
          }

          .leaflet-popup-tip {
            background-color: var(--bg-primary) !important;
            margin: 0 !important;
          }
        </style>
      `;
        marker.bindPopup(popupContent, {
          closeButton: false,
        });

        // Add click handler (disabled during route drawing)
        if (onSpotClick && !isDrawingRoute) {
          marker.on('click', () => onSpotClick(spot));
        }

        marker.addTo(map);
      });
    }, [
      campingSpots,
      isMapReady,
      onSpotClick,
      isDrawingRoute,
      showCampSpots,
      showFishingSpots,
      showViewpointSpots,
    ]);

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

      // Add route polylines (only if routes are visible)
      if (showRoutes) {
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
          <h3 class="font-bold text-lg mb-2 text-secondary">${route.name}</h3>
          <p class="text-sm text-secondary">${route.waypoints.length} waypoints</p>
        </div>
      `;
          polyline.bindPopup(popupContent);

          // Add click handler (disabled during route drawing)
          if (onRouteClick && !isDrawingRoute) {
            polyline.on('click', () => onRouteClick(route));
          }

          polyline.addTo(map);
        });
      }
    }, [routes, isMapReady, onRouteClick, isDrawingRoute, showRoutes]);

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
      <div className="w-full h-full min-h-[300px] lg:min-h-[600px] overflow-hidden border border-white/10 relative">
        <div ref={mapRef} className="w-full h-full min-h-[300px] lg:min-h-[600px]" />

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
        {/* Search - Top Center */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-xs sm:max-w-sm lg:max-w-md px-16 lg:px-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Search"
              className="w-full py-2 px-3 pr-10 lg:p-3 lg:pr-10 backdrop-blur-sm placeholder-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent shadow-lg text-sm lg:text-base"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent border-b-transparent"></div>
              </div>
            )}
          </div>

          {/* Search Results */}
          {(searchResults.length > 0 ||
            (searchQuery && searchResults.length === 0 && !isSearching)) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 shadow-xl max-h-80 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        zoomToSearchResult(result);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 truncate">
                        {result.display_name.split(',')[0]}
                      </div>
                      <div className="text-sm text-gray-600 truncate mt-1">
                        {result.display_name.split(',').slice(1, 3).join(', ')}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-4 px-4 text-center text-gray-500 text-sm">
                  No places found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-4 left-4 z-[1000]">
          <div className="bg-dimmed backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
            <div className="text-xs text-white/70">
              {!isMapReady ? (
                <span className="text-yellow-400">Loading map...</span>
              ) : tilesLoading > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-3 h-3 border border-accent border-t-transparent rounded-full"></div>
                  <span className="text-accent">Loading tiles... ({tilesLoading} remaining)</span>
                </div>
              ) : isDrawingRoute ? (
                <span className="text-accent">Click to add route waypoints</span>
              ) : isAddingSpot ? (
                <span className="text-accent">Click to place camping spot</span>
              ) : (
                <span>Press &quot;New Spot&quot; or &quot;New Route&quot; to start</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

TripMap.displayName = 'TripMap';

export default TripMap;
