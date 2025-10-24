'use client';
import {useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback} from 'react';
import * as L from 'leaflet';
import {CampingSpot, Route} from '@/types';
import {useDebounce} from '@/hooks/useDebounce';
import CompassWidget from './CompassWidget';

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
  isReadOnly?: boolean; // New prop for read-only mode
  // Toolbar visibility controls
  showRoutes?: boolean;
  showCampSpots?: boolean;
  showFishingSpots?: boolean;
  showViewpointSpots?: boolean;
  onToggleRoutes?: () => void;
  onToggleCampSpots?: () => void;
  onToggleFishingSpots?: () => void;
  onToggleViewpointSpots?: () => void;
  // Compass control
  showCompass?: boolean;
  onToggleCompass?: () => void;
  // Mobile dock control
  isDockVisible?: boolean;
  onToggleDock?: () => void;
  // Add button callbacks
  onStartAddingSpot?: () => void;
  onStartAddingRoute?: () => void;
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
      isReadOnly = false, // New prop with default value
      // Toolbar controls
      showRoutes = true,
      showCampSpots = true,
      showFishingSpots = true,
      showViewpointSpots = true,
      onToggleRoutes,
      onToggleCampSpots,
      onToggleFishingSpots,
      onToggleViewpointSpots,
      // Compass control
      showCompass = false, // Default to hidden
      onToggleCompass,
      // Mobile dock control
      isDockVisible,
      onToggleDock,
      // Add button callbacks
      onStartAddingSpot,
      onStartAddingRoute,
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
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [userLocationMarker, setUserLocationMarker] = useState<L.Marker | null>(null);

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

    // Show user location on map
    const showUserLocation = useCallback(
      (lat: number, lng: number) => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Remove existing location marker if any
        if (userLocationMarker) {
          map.removeLayer(userLocationMarker);
        }

        // Create location marker with a simple blue circle
        const locationIcon = L.divIcon({
          className: 'user-location-marker',
          html: `<div style="
          width: 20px; 
          height: 20px; 
          background-color: var(--bg-accent); 
          outline: 8px solid color-mix(in srgb, var(--bg-accent) 50%, transparent);
          border: 3px solid white; 
          border-radius: 50%; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        // Add new location marker
        const marker = L.marker([lat, lng], {
          icon: locationIcon,
        }).addTo(map);

        setUserLocationMarker(marker);

        // Center map on user location
        map.setView([lat, lng], 15);
      },
      [userLocationMarker],
    );

    // Get user location
    const handleGetLocation = useCallback(() => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
      }

      setIsGettingLocation(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const {latitude, longitude} = position.coords;
          showUserLocation(latitude, longitude);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Unable to get your location.';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }

          alert(errorMessage);
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Accept cached position up to 1 minute old
        },
      );
    }, [showUserLocation]);

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
            // Conservative performance improvements
            updateInterval: 150, // Smooth updates without overwhelming server
            detectRetina: true, // Better quality on high-DPI displays
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
          // Conservative performance improvements
          updateInterval: 150, // Smooth updates
          detectRetina: true, // Better quality on high-DPI displays
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
            // Conservative performance improvements
            updateInterval: 150, // Smooth updates
            detectRetina: true, // Better quality on high-DPI displays
          },
        ),
        OpenStreetMap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          crossOrigin: 'anonymous',
          updateWhenIdle: false,
          updateWhenZooming: true,
          keepBuffer: 3,
          errorTileUrl: '',
          // Multiple subdomains for faster loading
          subdomains: ['a', 'b', 'c'],
          // Conservative performance improvements
          updateInterval: 150, // Smooth updates
          detectRetina: true, // Better quality on high-DPI displays
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
        // Check if map still exists and is initialized
        if (!mapInstanceRef.current) return;

        const currentMap = mapInstanceRef.current;

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
          currentMap.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: 16, // Don't zoom in too much for single points
          });
        } else {
          // Default view for empty trips (center on Norway)
          currentMap.setView([61.5, 9], 6);
        }
      };

      // Fit map after a short delay to ensure all layers are loaded
      const timeoutId = setTimeout(fitMapToContent, 100);

      setIsMapReady(true);

      // Cleanup function
      return () => {
        // Clear the timeout if component unmounts
        clearTimeout(timeoutId);

        if (userLocationMarker && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(userLocationMarker);
        }
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
      let popover: HTMLElement | null = null;

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

          // Create popover outside of Leaflet control (append to body to escape stacking context)
          popover = L.DomUtil.create('div', '');
          document.body.appendChild(popover);
          popover.style.cssText = `
            position: fixed; 
            background: var(--bg-primary); border: 1px solid var(--bg-dimmed); border-radius: 8px;
            padding: 8px; min-width: 120px; display: none; z-index: 1010;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
          `;

          const layerOptions = [
            {key: 'Kartverket Raster', label: 'NO Topo'},
            {key: 'OpenTopoMap', label: 'TopoMap'},
            {key: 'ESRI Satellite', label: 'Satellite'},
            {key: 'OpenStreetMap', label: 'Street'},
          ];

          layerOptions.forEach((option) => {
            const optionBtn = L.DomUtil.create('button', '', popover!);
            optionBtn.textContent = option.label;
            optionBtn.className = `${currentLayer === option.key ? 'button-primary' : 'button-ghost'} !w-full !text-left !text-sm !mb-1 !py-2 !px-3`;
            optionBtn.style.cssText = `
              display: block; border: none; cursor: pointer;
            `;

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

              // Update all button classes to reflect new active state
              if (popover) {
                const buttons = popover.querySelectorAll('button');
                buttons.forEach((btn) => {
                  const isActive = btn.textContent === option.label;
                  btn.className = `${isActive ? 'button-primary' : 'button-ghost'} !w-full !text-left !text-sm !mb-1 !py-2 !px-3`;
                });
              }

              // Hide popover
              if (popover) popover.style.display = 'none';
            });
          });

          // Toggle popover on button click
          L.DomEvent.on(layerBtn, 'click', function (e) {
            L.DomEvent.stopPropagation(e);
            if (!popover) return;

            const isVisible = popover.style.display === 'block';

            if (!isVisible) {
              // Position popover relative to button
              const btnRect = layerBtn.getBoundingClientRect();
              popover.style.top = `${btnRect.top}px`;
              popover.style.left = `${btnRect.left - 130}px`; // 120px width + 10px margin
              popover.style.display = 'block';
            } else {
              popover.style.display = 'none';
            }
          });

          // Hide popover when clicking elsewhere
          document.addEventListener('click', function () {
            if (popover) popover.style.display = 'none';
          });

          // Add button with popover (only show if not in read-only mode)
          if (!isReadOnly) {
            const addBtnContainer = L.DomUtil.create('div', '', div);
            addBtnContainer.style.position = 'relative';
            addBtnContainer.style.marginBottom = '4px';

            const addBtn = L.DomUtil.create('button', '', addBtnContainer);
            addBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM11 11V7H13V11H17V13H13V17H11V13H7V11H11Z" fill="currentColor"/>
</svg>`;
            addBtn.title = 'Add spot or route';
            addBtn.className = 'button-ghost !w-8 !h-8 !p-0 flex items-center justify-center';

            // Create add popover
            const addPopover = L.DomUtil.create('div', '');
            document.body.appendChild(addPopover);
            addPopover.style.cssText = `
              position: fixed; 
              background: var(--bg-primary); border: 1px solid var(--bg-dimmed); border-radius: 8px;
              padding: 8px; min-width: 140px; display: none; z-index: 1010;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            `;

            // Add Spot button
            const addSpotBtn = L.DomUtil.create('button', '', addPopover);
            addSpotBtn.textContent = 'Add Spot';
            addSpotBtn.className = 'button-ghost !w-full !text-left !text-sm !mb-1 !py-2 !px-3';
            addSpotBtn.style.cssText = `
              display: block; border: none; cursor: pointer;
            `;

            L.DomEvent.on(addSpotBtn, 'click', function (e) {
              L.DomEvent.stopPropagation(e);
              // Trigger add spot mode
              if (onStartAddingSpot && !isDrawingRoute) {
                onStartAddingSpot();
                addPopover.style.display = 'none';
              }
            });

            // Add Route button
            const addRouteBtn = L.DomUtil.create('button', '', addPopover);
            addRouteBtn.textContent = 'Add Route';
            addRouteBtn.className = 'button-ghost !w-full !text-left !text-sm !mb-1 !py-2 !px-3';
            addRouteBtn.style.cssText = `
              display: block; border: none; cursor: pointer;
            `;

            L.DomEvent.on(addRouteBtn, 'click', function (e) {
              L.DomEvent.stopPropagation(e);
              // Trigger add route mode
              if (onStartAddingRoute && !isAddingSpot && !isDrawingRoute) {
                onStartAddingRoute();
                addPopover.style.display = 'none';
              }
            });

            // Toggle add popover on button click
            L.DomEvent.on(addBtn, 'click', function (e) {
              L.DomEvent.stopPropagation(e);

              const isVisible = addPopover.style.display === 'block';

              if (!isVisible) {
                // Position popover relative to button
                const btnRect = addBtn.getBoundingClientRect();
                addPopover.style.top = `${btnRect.top}px`;
                addPopover.style.left = `${btnRect.left - 150}px`; // 140px width + 10px margin
                addPopover.style.display = 'block';
              } else {
                addPopover.style.display = 'none';
              }
            });

            // Hide add popover when clicking elsewhere
            document.addEventListener('click', function () {
              if (addPopover) addPopover.style.display = 'none';
            });

            // Store reference for cleanup
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (div as any)._addPopoverCleanup = () => {
              if (addPopover && document.body.contains(addPopover)) {
                document.body.removeChild(addPopover);
              }
            };
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

          // Location button
          const locationBtn = L.DomUtil.create('button', '', div);
          locationBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13 4.06348C16.6169 4.51459 19.4822 7.37888 19.9355 10.9951H22.0049V12.9951H19.9365C19.4872 16.6159 16.6201 19.484 13 19.9355V22H11V19.9355C7.37989 19.484 4.51285 16.6159 4.06348 12.9951H2.00488V10.9951H4.06445C4.51776 7.37888 7.38308 4.51459 11 4.06348V2H13V4.06348ZM12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6ZM12 9C13.6569 9 15 10.3431 15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9Z" fill="currentColor"/>
</svg>`;
          locationBtn.title = 'Show my location';
          locationBtn.className = `${isGettingLocation ? 'button-primary' : 'button-ghost'} !w-8 !h-8 !p-0 flex items-center justify-center`;
          L.DomEvent.on(locationBtn, 'click', function (e) {
            L.DomEvent.stopPropagation(e);
            handleGetLocation();
          });

          // Compass toggle button
          if (onToggleCompass) {
            const compassBtn = L.DomUtil.create('button', '', div);
            compassBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fillRule="evenodd" clipRule="evenodd" d="M20 22L12 17.9062L4 22L12 2L20 22ZM7.83887 17.7881L11.0889 16.126H12.9111L16.1602 17.7881L12 7.38672L7.83887 17.7881Z" fill="currentColor"/>
</svg>`;
            compassBtn.title = 'Toggle compass';
            compassBtn.className = `${showCompass ? 'button-primary-accent' : 'button-ghost'} !w-8 !h-8 !p-0 flex items-center justify-center`;
            L.DomEvent.on(compassBtn, 'click', function (e) {
              L.DomEvent.stopPropagation(e);
              onToggleCompass?.();
            });
          }

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
            routesBtn.className = `${showRoutes ? 'button-primary-accent' : 'button-ghost'} !w-8 !h-8 !p-0 flex items-center justify-center`;
            L.DomEvent.on(routesBtn, 'click', function (e) {
              L.DomEvent.stopPropagation(e);
              onToggleRoutes?.();
            });
          }

          // Check if we have any camping spots
          const hasAnySpots = campingSpots && campingSpots.length > 0;

          // All spots toggle (only show if there are any spots)
          if (hasAnySpots) {
            const spotsBtn = L.DomUtil.create('button', '', div);
            spotsBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2C15.866 2 19 5.41126 19 9.61914L18.9883 10.0996C18.757 15.0265 15.0094 18.7245 12 22C8.99062 18.7245 5.243 15.0265 5.01172 10.0996L5 9.61914C5 5.41126 8.13401 2 12 2ZM12 4C9.39475 4 7 6.3529 7 9.61914C7.00002 11.6723 7.76642 13.5356 8.99512 15.3643C9.86438 16.6579 10.9066 17.8522 12 19.0479C13.0934 17.8522 14.1356 16.6579 15.0049 15.3643C16.2336 13.5356 17 11.6723 17 9.61914C17 6.3529 14.6052 4 12 4ZM12 6C13.6569 6 15 7.34315 15 9C15 10.6569 13.6569 12 12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6Z" fill="currentColor"/>
</svg>
`;
            spotsBtn.title = 'Toggle all spots';
            // Button is active if any spot category is visible
            const anySpotVisible = showCampSpots || showFishingSpots || showViewpointSpots;
            spotsBtn.className = `${anySpotVisible ? 'button-primary-accent' : 'button-ghost'} !w-8 !h-8 !p-0 flex items-center justify-center`;
            L.DomEvent.on(spotsBtn, 'click', function (e) {
              L.DomEvent.stopPropagation(e);
              // Toggle all spot categories together
              onToggleCampSpots?.();
              onToggleFishingSpots?.();
              onToggleViewpointSpots?.();
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
        // Clean up popover from body
        if (popover && document.body.contains(popover)) {
          document.body.removeChild(popover);
        }
        // Clean up add popover if it exists
        const toolbarContainer = toolbar?.getContainer();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (toolbarContainer && (toolbarContainer as any)._addPopoverCleanup) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (toolbarContainer as any)._addPopoverCleanup();
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
      showCompass,
      onToggleCompass,
      isDockVisible,
      onToggleDock,
      isGettingLocation,
      handleGetLocation,
      isAddingSpot,
      isDrawingRoute,
      isReadOnly,
      onStartAddingRoute,
      onStartAddingSpot,
    ]);

    // Handle map click events separately to prevent map recreation
    useEffect(() => {
      if (!mapInstanceRef.current || !isMapReady) return;

      const map = mapInstanceRef.current;

      // Remove existing click handlers
      map.off('click');

      // Add click handler for adding new spots (only when not drawing routes and not read-only)
      if (onMapClick && !isDrawingRoute && !isReadOnly) {
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
    }, [onMapClick, isMapReady, isDrawingRoute, isReadOnly, handleMapClick]);

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
            display: none !important;
          }
        </style>
      `;
        marker.bindPopup(popupContent, {
          closeButton: false,
        });

        // Add click handler (disabled during route drawing and in read-only mode)
        if (onSpotClick && !isDrawingRoute && !isReadOnly) {
          marker.on('click', () => onSpotClick(spot));
        }

        marker.addTo(map);
      });
    }, [
      campingSpots,
      isMapReady,
      onSpotClick,
      isDrawingRoute,
      isReadOnly,
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
            opacity: 1,
            dashArray: '10, 8',
          });

          // Add popup
          const popupContent = `
        <div style="background-color: var(--bg-primary); color: var(--fg-primary); border-radius: 8px; min-width: 200px; margin: 0; padding: 10px 0 6px 0;">
          <h3 class="font-bold text-lg" style="color: var(--fg-accent); margin-bottom: 8px; margin-top: 0;">${route.name}</h3>
          <p class="text-xs" style="color: var(--fg-primary); font-size: 14px; margin-bottom: 8px; margin-top: 0;">Route</p>
          <p class="text-xs" style="color: var(--fg-primary); font-size: 14px; opacity: 0.5; margin-bottom: 8px; margin-top: 0;">${route.waypoints.length} waypoints</p>
        </div>
        <style>
          .leaflet-popup-content-wrapper {
            background-color: var(--bg-primary) !important;
            border-radius: 8px !important;
            padding: 0 !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
          }

          .leaflet-popup-tip {
            display: none !important;
          }
        </style>
      `;
          polyline.bindPopup(popupContent, {
            closeButton: false,
          });

          // Add click handler (disabled during route drawing and in read-only mode)
          if (onRouteClick && !isDrawingRoute && !isReadOnly) {
            polyline.on('click', () => onRouteClick(route));
          }

          polyline.addTo(map);
        });
      }
    }, [routes, isMapReady, onRouteClick, isDrawingRoute, isReadOnly, showRoutes]);

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
      <div className="w-full h-full min-h-[300px] lg:min-h-[600px] border border-white/10">
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
              className="w-full py-2 px-3 pr-10 lg:p-3 lg:pr-10 backdrop-blur-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent shadow-lg text-md lg:text-base"
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
            <div className="absolute top-full left-0 right-0 pr-2 mt-1 pl-2 bg-primary rounded-lg no-scrollbar shadow-xl max-h-80 overflow-y-auto">
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
                      className="w-full text-left mb-2 last:mb-0 rounded-md button-create transition-colors"
                    >
                      <div className="font-medium text-accent truncate">
                        {result.display_name.split(',')[0]}
                      </div>
                      <div className="text-sm text-primary truncate mt-1">
                        {result.display_name.split(',').slice(1, 3).join(', ')}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-4 px-4 text-center text-primary text-sm">
                  No places found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Compass Widget */}
        {showCompass && <CompassWidget className="absolute bottom-4 left-4 z-[1000]" />}

        {/* Status Bar - Only show when there's actual status to display */}
        {(!isMapReady || tilesLoading > 0 || isDrawingRoute || isAddingSpot) && (
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
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

TripMap.displayName = 'TripMap';

export default TripMap;
