'use client';
import {useState, useCallback, useEffect, useRef} from 'react';
import {Icon} from '@/components/Icon';
import {useRouter} from 'next/navigation';
import dynamicImport from 'next/dynamic';
import {useSession} from 'next-auth/react';
import {client} from '@/sanity/client';
import {CampingSpot, Route, SpotCategory} from '@/types';
import {SanityImageSource} from '@sanity/image-url/lib/types/types';

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

interface ShareMapClientProps {
  trip: {
    _id: string;
    name: string;
    description?: string;
    image?: SanityImageSource;
    startDate?: string;
    endDate?: string;
    shareId?: string;
    user?: {
      _id: string;
      name: string;
      email: string;
    };
    campingSpots: CampingSpot[];
    routes: Route[];
  };
}

export default function ShareMapClient({trip}: ShareMapClientProps) {
  const {data: session} = useSession();
  const router = useRouter();
  const mapRef = useRef<TripMapRef>(null);
  const [activeTab, setActiveTab] = useState('locations');
  const [isDockVisible, setIsDockVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Map toolbar visibility states
  const [showRoutes, setShowRoutes] = useState(true);
  const [showCamps, setShowCamps] = useState(true);
  const [showFishing, setShowFishing] = useState(true);
  const [showViewpoints, setShowViewpoints] = useState(true);

  // Spot category filter for dock
  const [spotCategoryFilter, setSpotCategoryFilter] = useState<
    'all' | 'camp' | 'fishing' | 'viewpoint'
  >('all');

  // Check if the trip is already saved
  const checkIfSaved = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // Extract the raw Google ID from session (remove "google_" prefix)
      const rawGoogleId = session.user.id.replace('google_', '');

      const user = await client.fetch(
        `*[_type == "user" && googleId == $googleId][0] {
          sharedTrips[] {
            trip {
              _ref
            }
          }
        }`,
        {googleId: rawGoogleId},
      );

      const isAlreadySaved = user?.sharedTrips?.some(
        (shared: {trip: {_ref: string}}) => shared.trip._ref === trip._id,
      );

      setIsSaved(isAlreadySaved);
    } catch (error) {
      console.error('Error checking if trip is saved:', error);
    }
  }, [session?.user?.id, trip._id]);

  // Save trip to shared trips
  const handleSaveToTrips = async () => {
    if (!session?.user?.id) {
      // Redirect to sign in if not authenticated
      router.push('/auth/signin');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/addSharedTrip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({tripId: trip._id}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to save trip: ${errorData.error || response.statusText}`);
      }

      setIsSaved(true);
    } catch (error) {
      console.error('Error saving trip:', error);
      alert(
        `Failed to save trip: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate trip to user's own trips
  const handleDuplicateTrip = async () => {
    if (!session?.user?.id) {
      // Redirect to sign in if not authenticated
      router.push('/auth/signin');
      return;
    }

    try {
      setIsDuplicating(true);
      const response = await fetch('/api/duplicateTrip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({tripId: trip._id}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to duplicate trip: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();

      // Navigate to the new duplicated trip
      router.push(`/maps/${data.trip._id}`);
    } catch (error) {
      console.error('Error duplicating trip:', error);
      alert(
        `Failed to duplicate trip: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      );
    } finally {
      setIsDuplicating(false);
    }
  };

  // Check if saved on mount
  useEffect(() => {
    checkIfSaved();
  }, [session?.user?.id, trip._id, checkIfSaved]);

  // Zoom to camping spot
  const handleZoomToSpot = useCallback((spot: CampingSpot) => {
    if (mapRef.current) {
      mapRef.current.restoreView({
        center: {lat: spot.coordinates.lat, lng: spot.coordinates.lng},
        zoom: 15,
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

      let zoom = 15;
      if (maxDiff > 0.1) zoom = 10;
      else if (maxDiff > 0.01) zoom = 12;
      else if (maxDiff > 0.001) zoom = 14;

      mapRef.current.restoreView({
        center: {lat: centerLat, lng: centerLng},
        zoom,
      });
    }
  }, []);

  // Helper function to calculate route distance
  const calculateRouteDistance = (waypoints: Array<{lat: number; lng: number}>): number => {
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

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row">
      {/* Main Content - Full screen on mobile */}
      <div className="flex-1 relative">
        <TripMap
          ref={mapRef}
          campingSpots={trip.campingSpots || []}
          routes={trip.routes || []}
          isDrawingRoute={false}
          isAddingSpot={false}
          isReadOnly={true} // This is a read-only shared view
          // Toolbar visibility controls
          showRoutes={showRoutes}
          showCampSpots={showCamps}
          showFishingSpots={showFishing}
          showViewpointSpots={showViewpoints}
          onToggleRoutes={() => setShowRoutes(!showRoutes)}
          onToggleCampSpots={() => setShowCamps(!showCamps)}
          onToggleFishingSpots={() => setShowFishing(!showFishing)}
          onToggleViewpointSpots={() => setShowViewpoints(!showViewpoints)}
          isDockVisible={isDockVisible}
          onToggleDock={() => setIsDockVisible(!isDockVisible)}
        />

        {/* Back Button - Top Left */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-[1001] bg-dimmed backdrop-blur-sm rounded-lg p-3 hover:bg-dimmed shadow-lg transition-all duration-200"
          title="Go back"
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
          {/* Trip Header */}
          <div className="flex items-center bg-primary justify-between mb-2 lg:mb-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="lg:text-2xl text-lg text-accent font-medium">{trip.name}</h2>
                {trip.user && <p className="text-sm text-white/70">by {trip.user.name}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
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
              Spots ({trip.campingSpots?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={activeTab === 'routes' ? 'tab-active' : 'tab'}
            >
              Routes ({trip.routes?.length || 0})
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
                {trip.campingSpots?.some((spot) => spot.category === 'camp') && (
                  <button
                    onClick={() => setSpotCategoryFilter('camp')}
                    className={`menu-category text-sm ${spotCategoryFilter === 'camp' ? 'menu-active' : ''}`}
                  >
                    Camps
                  </button>
                )}
                {trip.campingSpots?.some((spot) => spot.category === 'fishing') && (
                  <button
                    onClick={() => setSpotCategoryFilter('fishing')}
                    className={`menu-category text-sm ${spotCategoryFilter === 'fishing' ? 'menu-active' : ''}`}
                  >
                    Fishing waters
                  </button>
                )}
                {trip.campingSpots?.some((spot) => spot.category === 'viewpoint') && (
                  <button
                    onClick={() => setSpotCategoryFilter('viewpoint')}
                    className={`menu-category text-sm ${spotCategoryFilter === 'viewpoint' ? 'menu-active' : ''}`}
                  >
                    Viewpoints
                  </button>
                )}
              </div>

              {!trip.campingSpots || trip.campingSpots.length === 0 ? (
                <p className="text-white/50 text-sm">No camping spots in this trip.</p>
              ) : (
                <div className="space-y-1 lg:space-y-2">
                  {trip.campingSpots
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
                              <h4 className="font-medium text-white truncate">{spot.name}</h4>
                            </button>
                            {spot.description && (
                              <p className="text-sm text-white mt-1 line-clamp-2">
                                {spot.description}
                              </p>
                            )}
                            <div className="flex flex-wrap mt-2">
                              <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                                {spot.coordinates.lat.toFixed(4)}, {spot.coordinates.lng.toFixed(4)}
                              </span>
                            </div>
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
              {!trip.routes || trip.routes.length === 0 ? (
                <p className="text-white/50 text-sm">No routes in this trip.</p>
              ) : (
                <div className="space-y-1 lg:space-y-2">
                  {trip.routes.map((route) => (
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
                            <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                              {route.waypoints.length} waypoints
                            </span>
                            {route.waypoints.length >= 2 && (
                              <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                                {calculateRouteDistance(route.waypoints).toFixed(1)}km
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Bottom Action Buttons */}
        <div className="p-6 bg-background border-t border-white/10">
          {session?.user?.id ? (
            <div className="flex gap-3">
              <button
                onClick={handleSaveToTrips}
                disabled={isSaving || isSaved}
                className={`flex-1 text-lg flex items-center justify-center gap-2 py-3 ${
                  isSaved ? 'button-secondary' : 'button-primary'
                }`}
              >
                <Icon name={isSaved ? 'checkmark' : 'add'} width={20} height={20} />
                {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={handleDuplicateTrip}
                disabled={isDuplicating}
                className="flex-1 button-secondary text-lg flex items-center justify-center gap-2 py-3"
              >
                <Icon name="duplicate" width={20} height={20} />
                {isDuplicating ? 'Duplicating...' : 'Duplicate'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/auth/signin')}
              className="button-primary w-full text-lg flex items-center justify-center gap-2 py-3"
            >
              <Icon name="user" width={20} height={20} />
              Sign In to Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
