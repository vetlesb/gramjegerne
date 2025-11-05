'use client';
import {useState, useCallback, useEffect, useRef} from 'react';
import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {Icon} from '@/components/Icon';
import {useRouter, useParams, useSearchParams} from 'next/navigation';
import dynamicImport from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {TripDocument, CampingSpot, Route, SpotCategory} from '@/types';
import {TripShareButton} from '@/components/TripShareButton';

// Dynamically import TripMap to avoid SSR issues with Leaflet
const TripMap = dynamicImport(() => import('@/components/TripMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white/5 flex items-center justify-center">
      <div className="text-center text-white/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
        <p>Loading map...</p>
      </div>
    </div>
  ),
});

// Import the TripMapRef type separately
import type {TripMapRef} from '@/components/TripMap';

export const dynamic = 'force-dynamic';

interface Coordinates {
  lat: number;
  lng: number;
}

export default function TripViewPage() {
  const [tripPlan, setTripPlan] = useState<TripDocument | null>(null);
  const [isAddingSpot, setIsAddingSpot] = useState(false);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [isEditingRoute, setIsEditingRoute] = useState<boolean>(false);
  const [editingSpot, setEditingSpot] = useState<CampingSpot | null>(null);
  const [isPendingSpot, setIsPendingSpot] = useState(false); // Track if spot is not yet saved
  const mapRef = useRef<TripMapRef>(null);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const tripId = params.id as string;
  const [activeTab, setActiveTab] = useState('locations');
  const [isDockVisible, setIsDockVisible] = useState(false);

  // Map toolbar visibility states
  const [showRoutes, setShowRoutes] = useState(true);
  const [showCamps, setShowCamps] = useState(true);
  const [showFishing, setShowFishing] = useState(true);
  const [showViewpoints, setShowViewpoints] = useState(true);
  const [showCompass, setShowCompass] = useState(false); // Default to hidden

  // Spot category filter for dock
  const [spotCategoryFilter, setSpotCategoryFilter] = useState<
    'all' | 'camp' | 'fishing' | 'viewpoint'
  >('all');

  // Handle context-aware back navigation
  const handleBackNavigation = useCallback(() => {
    const fromList = searchParams.get('from');
    const listSlug = searchParams.get('slug');

    if (fromList === 'list' && listSlug) {
      // Navigate back to the specific packing list
      router.push(`/lists/${listSlug}`);
    } else {
      // Default navigation to gear page
      router.push('/');
    }
  }, [router, searchParams]);

  // Auto-hide dock on mobile when starting creation modes
  const handleStartAddingSpot = useCallback(() => {
    setIsAddingSpot(true);
    // Auto-hide dock on mobile
    if (window.innerWidth < 1024) {
      setIsDockVisible(false);
    }
  }, []);

  // Load trip plan from Sanity on mount
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await fetch(`/api/trips/${tripId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch trip');
        }

        const data = await response.json();
        if (data.success) {
          setTripPlan(data.trip);
        } else {
          throw new Error(data.error || 'Failed to fetch trip');
        }
      } catch (error) {
        console.error('Failed to fetch trip:', error);
        router.push('/maps');
      }
    };

    if (tripId) {
      fetchTrip();
    }
  }, [tripId, router]);

  // Save trip plan to Sanity
  const saveTripPlan = useCallback(
    async (plan: Partial<TripDocument>) => {
      if (!tripPlan?._id) return;

      try {
        const response = await fetch('/api/updateTrip', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tripId: tripPlan._id,
            updates: plan,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update trip');
        }

        const data = await response.json();
        if (data.success) {
          setTripPlan(data.trip);
        } else {
          throw new Error(data.error || 'Failed to update trip');
        }
      } catch (error) {
        console.error('Failed to save trip plan:', error);
      }
    },
    [tripPlan?._id],
  );

  // Add camping spot
  const handleAddSpot = useCallback(
    (coordinates: Coordinates) => {
      if (!tripPlan) return;

      const newSpot: CampingSpot = {
        _key: Date.now().toString(),
        name: `Camping Spot ${(tripPlan.campingSpots?.length || 0) + 1}`,
        coordinates,
        description: '',
        category: 'camp' as SpotCategory,
      };

      // Don't save yet - just show the dialog
      setEditingSpot(newSpot);
      setIsPendingSpot(true); // Mark as pending (not yet saved)
      setIsAddingSpot(false);
    },
    [tripPlan],
  );

  // Update camping spot
  const handleUpdateSpot = useCallback(
    (updatedSpot: CampingSpot) => {
      if (!tripPlan) return;

      const updatedPlan = {
        ...tripPlan,
        campingSpots: (tripPlan.campingSpots || []).map((spot) =>
          spot._key === updatedSpot._key ? updatedSpot : spot,
        ),
      };

      saveTripPlan(updatedPlan);
      setEditingSpot(null);
    },
    [tripPlan, saveTripPlan],
  );

  // Delete camping spot
  const handleDeleteSpot = useCallback(
    (spotKey: string) => {
      if (!tripPlan) return;

      const updatedPlan = {
        ...tripPlan,
        campingSpots: (tripPlan.campingSpots || []).filter((spot) => spot._key !== spotKey),
      };

      saveTripPlan(updatedPlan);
    },
    [tripPlan, saveTripPlan],
  );

  // Start drawing route
  const handleStartRoute = useCallback(() => {
    if (!tripPlan) return;

    // Preserve current map view
    const currentView = mapRef.current?.getCurrentView();

    const newRoute: Route = {
      _key: Date.now().toString(),
      name: `Route ${(tripPlan.routes?.length || 0) + 1}`,
      waypoints: [],
      color: '#FF0000',
    };

    setCurrentRoute(newRoute);
    setIsDrawingRoute(true);

    // Auto-hide dock on mobile
    if (window.innerWidth < 1024) {
      setIsDockVisible(false);
    }

    // Restore map view after starting route
    if (currentView) {
      setTimeout(() => {
        mapRef.current?.restoreView(currentView);
      }, 100);
    }
  }, [tripPlan]);

  // Handle route point addition
  const handleRoutePointAdd = useCallback(
    (coordinates: Coordinates) => {
      if (!currentRoute) return;

      const updatedRoute = {
        ...currentRoute,
        waypoints: [...currentRoute.waypoints, coordinates],
      };
      setCurrentRoute(updatedRoute);
    },
    [currentRoute],
  );

  // Remove route waypoint
  const handleRoutePointRemove = useCallback(
    (waypointIndex: number) => {
      if (!currentRoute) return;

      const updatedRoute = {
        ...currentRoute,
        waypoints: currentRoute.waypoints.filter((_, index) => index !== waypointIndex),
      };

      setCurrentRoute(updatedRoute);
    },
    [currentRoute],
  );

  // Undo last route waypoint
  const handleUndoLastPoint = useCallback(() => {
    if (!currentRoute || currentRoute.waypoints.length <= 1) return;

    const updatedRoute = {
      ...currentRoute,
      waypoints: currentRoute.waypoints.slice(0, -1), // Remove last waypoint
    };

    setCurrentRoute(updatedRoute);
  }, [currentRoute]);

  // Finish route
  const handleFinishRoute = useCallback(async () => {
    if (!currentRoute || !tripPlan || currentRoute.waypoints.length < 2) return;

    // Optimistic update: Show route immediately in UI with calculating placeholder
    const routeWithCalculatingPlaceholder = {
      ...currentRoute,
      elevationGain: -1, // Use -1 as a flag for "calculating"
    };

    const optimisticUpdatedPlan = {
      ...tripPlan,
      routes: [...tripPlan.routes, routeWithCalculatingPlaceholder],
    };
    setTripPlan(optimisticUpdatedPlan);
    setCurrentRoute(null);
    setIsDrawingRoute(false);

    // Calculate elevation in background and update when ready
    try {
      const response = await fetch('/api/calculateElevation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waypoints: currentRoute.waypoints,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // Update the route with elevation data
          const routeWithElevation = {
            ...currentRoute,
            elevationGain: data.elevationProfile.elevationGain,
            elevationProfile: {
              totalAscent: data.elevationProfile.totalAscent,
              totalDescent: data.elevationProfile.totalDescent,
              minElevation: data.elevationProfile.minElevation,
              maxElevation: data.elevationProfile.maxElevation,
            },
          };

          // Update both local state and save to Sanity
          const finalUpdatedPlan = {
            ...tripPlan,
            routes: [...tripPlan.routes, routeWithElevation],
          };

          setTripPlan(finalUpdatedPlan);
          saveTripPlan(finalUpdatedPlan);
        } else {
          console.warn('Failed to calculate elevation:', data.error);
          // Still save the route without elevation data
          saveTripPlan(optimisticUpdatedPlan);
        }
      } else {
        console.warn('Failed to calculate elevation: API request failed');
        // Still save the route without elevation data
        saveTripPlan(optimisticUpdatedPlan);
      }
    } catch (error) {
      console.error('Error calculating elevation:', error);
      // Still save the route without elevation data
      saveTripPlan(optimisticUpdatedPlan);
    }
  }, [currentRoute, tripPlan, saveTripPlan]);

  // Cancel route drawing
  const handleCancelRoute = useCallback(() => {
    setCurrentRoute(null);
    setIsDrawingRoute(false);
  }, []);

  // Edit route
  const handleEditRoute = useCallback((route: Route) => {
    setIsEditingRoute(true);
    setCurrentRoute({...route, waypoints: [...route.waypoints]});
    setIsDrawingRoute(true);
    // Auto-hide dock on mobile
    if (window.innerWidth < 1024) {
      setIsDockVisible(false);
    }
  }, []);

  // Delete route
  const handleDeleteRoute = useCallback(
    (routeKey: string) => {
      if (!tripPlan) return;

      const updatedPlan = {
        ...tripPlan,
        routes: (tripPlan.routes || []).filter((route) => route._key !== routeKey),
      };

      saveTripPlan(updatedPlan);
    },
    [tripPlan, saveTripPlan],
  );

  // Save current route
  const handleSaveRoute = useCallback(async () => {
    if (!tripPlan || !currentRoute) return;

    try {
      // Calculate elevation for the updated route
      const response = await fetch('/api/calculateElevation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waypoints: currentRoute.waypoints,
        }),
      });

      let routeWithElevation = currentRoute;

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          routeWithElevation = {
            ...currentRoute,
            elevationGain: data.elevationProfile.elevationGain,
            elevationProfile: {
              totalAscent: data.elevationProfile.totalAscent,
              totalDescent: data.elevationProfile.totalDescent,
              minElevation: data.elevationProfile.minElevation,
              maxElevation: data.elevationProfile.maxElevation,
            },
          };
        } else {
          console.warn('Failed to calculate elevation:', data.error);
        }
      } else {
        console.warn('Failed to calculate elevation: API request failed');
      }

      const updatedPlan = {
        ...tripPlan,
        routes: (tripPlan.routes || []).map((route) =>
          route._key === currentRoute._key ? routeWithElevation : route,
        ),
      };

      saveTripPlan(updatedPlan);
      setCurrentRoute(null);
      setIsDrawingRoute(false);
      setIsEditingRoute(false);
    } catch (error) {
      console.error('Error calculating elevation:', error);
      // Still save the route without elevation data
      const updatedPlan = {
        ...tripPlan,
        routes: (tripPlan.routes || []).map((route) =>
          route._key === currentRoute._key ? currentRoute : route,
        ),
      };

      saveTripPlan(updatedPlan);
      setCurrentRoute(null);
      setIsDrawingRoute(false);
      setIsEditingRoute(false);
    }
  }, [tripPlan, currentRoute, saveTripPlan]);

  // Cancel route editing
  const handleCancelRouteEdit = useCallback(() => {
    setIsEditingRoute(false);
    setCurrentRoute(null);
  }, []);

  // Handle map click for camping spots only when in adding mode
  const handleMapClick = useCallback(
    (coordinates: Coordinates) => {
      if (isAddingSpot) {
        handleAddSpot(coordinates);
        setIsAddingSpot(false); // Exit adding mode after placing spot
      }
    },
    [handleAddSpot, isAddingSpot],
  );

  // Helper function to calculate route distance
  const calculateRouteDistance = (waypoints: Coordinates[]): number => {
    if (waypoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];

      // Haversine formula for great circle distance
      const R = 6371; // Earth's radius in km
      const dLat = ((curr.lat - prev.lat) * Math.PI) / 180;
      const dLng = ((curr.lng - prev.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((prev.lat * Math.PI) / 180) *
          Math.cos((curr.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }

    return totalDistance;
  };

  // Zoom to camping spot
  const handleZoomToSpot = useCallback((spot: CampingSpot) => {
    if (mapRef.current) {
      mapRef.current.restoreView({
        center: {lat: spot.coordinates.lat, lng: spot.coordinates.lng},
        zoom: 15, // Close zoom to see details
      });
    }
  }, []);

  // Zoom to route
  const handleZoomToRoute = useCallback((route: Route) => {
    if (mapRef.current && route.waypoints.length > 0) {
      // Calculate bounds of the route
      const lats = route.waypoints.map((wp) => wp.lat);
      const lngs = route.waypoints.map((wp) => wp.lng);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // Center on the middle of the route
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;

      // Calculate appropriate zoom level based on route size
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);

      let zoom = 15; // Default close zoom
      if (maxDiff > 0.1)
        zoom = 10; // Large route
      else if (maxDiff > 0.01)
        zoom = 12; // Medium route
      else if (maxDiff > 0.001) zoom = 14; // Small route

      mapRef.current.restoreView({
        center: {lat: centerLat, lng: centerLng},
        zoom,
      });
    }
  }, []);

  if (!tripPlan) {
    return (
      <ProtectedRoute>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p>Loading map...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-ios w-screen flex flex-col lg:flex-row relative">
        {/* Main Content - Full screen on mobile */}
        <div className="flex-1 relative h-full overflow-hidden">
          <TripMap
            ref={mapRef}
            campingSpots={tripPlan.campingSpots || []}
            routes={
              isDrawingRoute && currentRoute
                ? [...(tripPlan.routes || []), currentRoute]
                : tripPlan.routes || []
            }
            isDrawingRoute={isDrawingRoute}
            isAddingSpot={isAddingSpot}
            onMapClick={handleMapClick}
            onRoutePointAdd={handleRoutePointAdd}
            // Toolbar visibility controls
            showRoutes={showRoutes}
            showCampSpots={showCamps}
            showFishingSpots={showFishing}
            showViewpointSpots={showViewpoints}
            onToggleRoutes={() => setShowRoutes(!showRoutes)}
            onToggleCampSpots={() => setShowCamps(!showCamps)}
            onToggleFishingSpots={() => setShowFishing(!showFishing)}
            onToggleViewpointSpots={() => setShowViewpoints(!showViewpoints)}
            // Compass control
            showCompass={showCompass}
            onToggleCompass={() => setShowCompass(!showCompass)}
            isDockVisible={isDockVisible}
            onToggleDock={() => setIsDockVisible(!isDockVisible)}
            onStartAddingSpot={handleStartAddingSpot}
            onStartAddingRoute={handleStartRoute}
          />

          {/* Back Button - Top Left */}
          <button
            onClick={handleBackNavigation}
            className="absolute top-4 left-4 z-[1001] bg-dimmed backdrop-blur-sm rounded-lg p-3 hover:bg-dimmed shadow-lg transition-all duration-200"
            title={searchParams.get('from') === 'list' ? 'Back to packing list' : 'Back to gear'}
          >
            <Icon name="chevrondown" width={20} height={20} className="rotate-90 text-white" />
          </button>
        </div>

        {/* Desktop Right Dock / Mobile Overlay Dock */}
        <div
          className={`
          lg:relative lg:w-96 lg:h-full lg:bg-dimmed lg:flex lg:flex-col lg:overflow-hidden lg:translate-y-0 lg:opacity-100
          ${isDockVisible ? 'fixed inset-x-0 bottom-0 top-1/4 translate-y-0 opacity-100' : 'hidden translate-y-full opacity-0'} lg:flex
          transition-all duration-300 ease-in-out lg:transition-none
          bg-primary backdrop-blur-sm lg:bg-dimmed lg:backdrop-blur-none
          flex flex-col overflow-hidden
          border-t lg:border-t-0 lg:border-l border-white/10
          rounded-t-2xl lg:rounded-none
          z-[1000] lg:z-auto
        `}
        >
          {/* Header Section - Fixed */}
          <div className="px-6 pt-6 flex-shrink-0">
            {/* Back to Maps Button */}
            <button
              onClick={() => router.push('/maps')}
              className="flex items-center gap-2 text-white/70 hover:text-accent transition-colors mb-3"
            >
              <Icon name="chevrondown" width={16} height={16} className="rotate-90" />
              <span className="text-sm">Back to Maps</span>
            </button>

            {/* Trip Header with Share and Close Buttons */}
            <div className="flex items-center bg-primary justify-between mb-2 lg:mb-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="lg:text-2xl text-lg text-accent font-medium">{tripPlan.name}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Share Button */}
                <TripShareButton
                  tripId={tripPlan._id}
                  shareId={tripPlan.shareId}
                  tripName={tripPlan.name}
                />
                {/* Mobile Close Dock Button */}
                <button
                  onClick={() => setIsDockVisible(false)}
                  className="lg:hidden button-ghost p-2"
                  title="Close dock"
                >
                  <Icon name="close" width={16} height={16} />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-4 lg:mb-2 border-b border-white/10">
              <button
                onClick={() => setActiveTab('locations')}
                className={activeTab === 'locations' ? 'tab-active' : 'tab'}
              >
                Spots ({tripPlan.campingSpots.length})
              </button>
              <button
                onClick={() => setActiveTab('routes')}
                className={activeTab === 'routes' ? 'tab-active' : 'tab'}
              >
                Routes ({tripPlan.routes.length})
              </button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-2 lg:p-2 min-h-0">
            {/* Locations Tab */}
            {activeTab === 'locations' && (
              <div>
                {/* Category Filter Tabs */}
                <div className="flex gap-x-2 no-scrollbar my-1 p-2 mb-4">
                  <button
                    onClick={() => setSpotCategoryFilter('all')}
                    className={`menu-category text-sm ${spotCategoryFilter === 'all' ? 'menu-active' : ''}`}
                  >
                    All
                  </button>
                  {/* Only show category tabs if there are spots of that type */}
                  {tripPlan.campingSpots.some((spot) => spot.category === 'camp') && (
                    <button
                      onClick={() => setSpotCategoryFilter('camp')}
                      className={`menu-category text-sm ${spotCategoryFilter === 'camp' ? 'menu-active' : ''}`}
                    >
                      Camps
                    </button>
                  )}
                  {tripPlan.campingSpots.some((spot) => spot.category === 'fishing') && (
                    <button
                      onClick={() => setSpotCategoryFilter('fishing')}
                      className={`menu-category text-sm ${spotCategoryFilter === 'fishing' ? 'menu-active' : ''}`}
                    >
                      Fishing waters
                    </button>
                  )}
                  {tripPlan.campingSpots.some((spot) => spot.category === 'viewpoint') && (
                    <button
                      onClick={() => setSpotCategoryFilter('viewpoint')}
                      className={`menu-category text-sm ${spotCategoryFilter === 'viewpoint' ? 'menu-active' : ''}`}
                    >
                      Viewpoints
                    </button>
                  )}
                </div>

                {tripPlan.campingSpots.length === 0 ? (
                  <p className="text-white/50 text-sm">No camping spots added yet.</p>
                ) : (
                  <div className="space-y-1 lg:space-y-2">
                    {tripPlan.campingSpots
                      .filter(
                        (spot) =>
                          spotCategoryFilter === 'all' || spot.category === spotCategoryFilter,
                      )
                      .map((spot) => (
                        <div key={spot._key} className="map-card p-1 lg:p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={() => handleZoomToSpot(spot)}
                                className="text-left w-full hover:underline"
                              >
                                <h4 className="font-medium text-primary truncate">{spot.name}</h4>
                              </button>
                              {spot.description && (
                                <p className="text-sm text-primary mt-1 line-clamp-2">
                                  {spot.description}
                                </p>
                              )}
                              <div className="flex flex-wrap mt-2">
                                <span className="text-xs bg-white/10 text-primary px-2 py-1 rounded">
                                  {spot.coordinates.lat.toFixed(4)},{' '}
                                  {spot.coordinates.lng.toFixed(4)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setEditingSpot(spot);
                                  setIsPendingSpot(false); // Editing existing spot, not pending
                                }}
                                className="button-ghost p-1.5 min-w-0"
                                title="Edit spot"
                              >
                                <Icon name="edit" width={20} height={20} />
                              </button>
                              <button
                                onClick={() => handleDeleteSpot(spot._key)}
                                className="button-ghost p-1.5 min-w-0"
                                title="Delete spot"
                              >
                                <Icon name="delete" width={20} height={20} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Routes Tab */}
            {activeTab === 'routes' && (
              <div>
                {tripPlan.routes.length === 0 ? (
                  <p className="text-white/50 text-sm">No routes added yet.</p>
                ) : (
                  <div className="space-y-1 lg:space-y-2">
                    {tripPlan.routes.map((route) => (
                      <div key={route._key} className="map-card p-1 lg:p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => handleZoomToRoute(route)}
                              className="text-left w-full hover:underline"
                            >
                              <h4 className="font-medium text-white truncate">{route.name}</h4>
                            </button>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {route.waypoints.length >= 2 && (
                                <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                                  {calculateRouteDistance(route.waypoints).toFixed(1)}km
                                </span>
                              )}
                              {route.elevationGain === -1 ? (
                                <span className="text-xs bg-accent text-secondary px-2 py-1 rounded flex items-center gap-1">
                                  <div className="animate-spin w-3 h-3 border border-secondary border-t-transparent rounded-full"></div>
                                  Calculating...
                                </span>
                              ) : route.elevationGain && route.elevationGain > 0 ? (
                                <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                                  ↗ {route.elevationGain}m
                                </span>
                              ) : null}
                              <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                                {route.waypoints.length} waypoints
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleEditRoute(route)}
                              className="button-ghost p-1.5 min-w-0"
                              title="Edit route"
                            >
                              <Icon name="edit" width={20} height={20} />
                            </button>
                            <button
                              onClick={() => handleDeleteRoute(route._key)}
                              className="button-ghost p-1.5 min-w-0"
                              title="Delete route"
                            >
                              <Icon name="delete" width={20} height={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Route Waypoints Section (only visible when editing) */}
                {isEditingRoute && currentRoute && (
                  <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-sm font-medium text-accent mb-3">Route Waypoints</h4>
                    {currentRoute.waypoints.length === 0 ? (
                      <p className="text-white/50 text-sm">No waypoints added yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {currentRoute.waypoints.map((waypoint, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white/5 rounded text-xs"
                          >
                            <span className="text-white/70">
                              {index + 1}. {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
                            </span>
                            <button
                              onClick={() => handleRoutePointRemove(index)}
                              className=" p-1"
                              title="Remove waypoint"
                            >
                              <Icon name="delete" width={12} height={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Bottom Add Button */}
          <div className="p-4 bg-background border-t border-white/10">
            {activeTab === 'locations' ? (
              <button
                onClick={handleStartAddingSpot}
                disabled={isDrawingRoute}
                className="button-primary-accent w-full text-lg flex items-center justify-center gap-2 py-3"
                title="New location"
              >
                <Icon name="add" width={20} height={20} />
                New Spot
              </button>
            ) : (
              <button
                onClick={handleStartRoute}
                disabled={isAddingSpot || isDrawingRoute}
                className="button-primary-accent w-full text-lg flex items-center justify-center gap-2 py-3"
                title="New route"
              >
                <Icon name="add" width={20} height={20} />
                New Route
              </button>
            )}
          </div>
        </div>

        {/* Camping Spot Editor Dialog */}
        <Dialog
          open={editingSpot !== null}
          onOpenChange={() => {
            setEditingSpot(null);
            setIsPendingSpot(false);
          }}
        >
          <DialogContent className="max-w-md z-[9999] bg-dimmed rounded-lg border-0">
            <DialogHeader>
              <DialogTitle>{isPendingSpot ? 'Add Spot' : 'Edit Spot'}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 bg-dimmed">
              <label className="flex flex-col gap-2">
                <span className="text-primary">Spot Name</span>
                <input
                  type="text"
                  value={editingSpot?.name || ''}
                  onChange={(e) =>
                    editingSpot && setEditingSpot({...editingSpot, name: e.target.value})
                  }
                  className="w-full p-3 bg-white/5 rounded-lg text-white"
                  style={{fontSize: '16px'}}
                  autoFocus
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-white">Description (optional)</span>
                <textarea
                  value={editingSpot?.description || ''}
                  onChange={(e) =>
                    editingSpot && setEditingSpot({...editingSpot, description: e.target.value})
                  }
                  rows={3}
                  className="w-full p-3 bg-white/5 rounded-lg text-white resize-none"
                  style={{fontSize: '16px'}}
                  placeholder="Add notes about this camping spot..."
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-primary">Category</span>
                <select
                  value={editingSpot?.category || 'camp'}
                  onChange={(e) =>
                    editingSpot &&
                    setEditingSpot({...editingSpot, category: e.target.value as SpotCategory})
                  }
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-primary focus:border-accent focus:outline-none"
                >
                  <option value="camp">Camp</option>
                  <option value="fishing">Fishing water</option>
                  <option value="viewpoint">Viewpoint</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-primary">Latitude</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={editingSpot?.coordinates.lat || ''}
                    onChange={(e) =>
                      editingSpot &&
                      setEditingSpot({
                        ...editingSpot,
                        coordinates: {
                          ...editingSpot.coordinates,
                          lat: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-primary focus:border-accent focus:outline-none"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-primary">Longitude</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={editingSpot?.coordinates.lng || ''}
                    onChange={(e) =>
                      editingSpot &&
                      setEditingSpot({
                        ...editingSpot,
                        coordinates: {
                          ...editingSpot.coordinates,
                          lng: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-primary focus:border-accent focus:outline-none"
                  />
                </label>
              </div>
            </div>

            <DialogFooter className="mt-6 flex-row flex gap-x-2">
              <button
                onClick={() => {
                  setEditingSpot(null);
                  setIsPendingSpot(false);
                }}
                className="button-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!editingSpot || !tripPlan) return;

                  if (isPendingSpot) {
                    // This is a new spot - save it to the trip plan
                    const updatedPlan = {
                      ...tripPlan,
                      campingSpots: [...(tripPlan.campingSpots || []), editingSpot],
                    };
                    saveTripPlan(updatedPlan);
                    setIsPendingSpot(false);
                  } else {
                    // This is an existing spot - update it
                    handleUpdateSpot(editingSpot);
                  }
                  setEditingSpot(null);
                }}
                className="button-primary-accent flex-1"
              >
                {isPendingSpot ? 'Save' : 'Save Changes'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Floating Route Drawing Dialog */}
        {isDrawingRoute && currentRoute && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999]">
            <div className="bg-dimmed border border-white/20 rounded-2xl p-6 shadow-2xl min-w-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-accent">
                  {isEditingRoute ? 'Editing Route' : 'Drawing New Route'}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/70">
                    {currentRoute.waypoints.length} waypoint
                    {currentRoute.waypoints.length !== 1 ? 's' : ''}
                  </span>
                  {currentRoute.waypoints.length >= 2 && (
                    <span className="text-sm text-white/50">
                      (~{calculateRouteDistance(currentRoute.waypoints).toFixed(1)}km)
                    </span>
                  )}
                  {/* Undo last point button */}
                  {currentRoute.waypoints.length > 1 && (
                    <button
                      onClick={handleUndoLastPoint}
                      className="ml-2 p-1.5 hover:bg-white/10 rounded-md transition-colors"
                      title="Remove last waypoint"
                    >
                      <Icon
                        name="undo"
                        width={16}
                        height={16}
                        className="text-white/70 hover:text-accent"
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* Route Name Input */}
              <div className="mb-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-primary">Route Name</span>
                  <input
                    type="text"
                    value={currentRoute.name}
                    onChange={(e) => setCurrentRoute({...currentRoute, name: e.target.value})}
                    className="w-full p-3 bg-white/5 rounded-lg text-primary"
                    style={{fontSize: '16px'}}
                    placeholder="Enter route name..."
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 space-x-2">
                {isEditingRoute ? (
                  <>
                    <button
                      onClick={handleCancelRouteEdit}
                      className="button-secondary w-full text-lg flex items-center justify-center gap-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveRoute}
                      disabled={currentRoute.waypoints.length < 2}
                      className="button-primary-accent w-full text-lg flex items-center justify-center gap-2 py-1"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancelRoute}
                      className="button-secondary w-full text-lg flex items-center justify-center gap-2 py-1"
                    >
                      Cancel Route
                    </button>
                    <button
                      onClick={handleFinishRoute}
                      disabled={currentRoute.waypoints.length < 2}
                      className="button-primary-accent w-full text-lg flex items-center justify-center gap-2 py-1"
                    >
                      Finish Route
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
