'use client';
import {useState, useCallback, useEffect, useRef, Suspense} from 'react';
import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {useDelayedLoader} from '@/hooks/useDelayedLoader';
import {DeleteTripButton} from '@/components/deleteTripButton';
import {EditTripDialog} from '@/components/EditTripDialog';
import {AddTripDialog} from '@/components/AddTripDialog';
import {Icon} from '@/components/Icon';
import {useRouter, useSearchParams} from 'next/navigation';
import {TripListItem, SharedTripReference, TripDocument, CampingSpot, Route} from '@/types';
import {useSession} from 'next-auth/react';
import {client} from '@/sanity/client';
import {groq} from 'next-sanity';
import {toast} from 'sonner';
import dynamicImport from 'next/dynamic';
import {TripShareButton} from '@/components/TripShareButton';
import type {TripMapRef} from '@/components/TripMap';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog';

// Dynamically import TripMap to avoid SSR issues with Leaflet
const TripMap = dynamicImport(() => import('@/components/TripMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-white/5 flex items-center justify-center">
      <div className="text-white/50">Loading map...</div>
    </div>
  ),
});

export const dynamic = 'force-dynamic';

function MapsPageContent() {
  const {data: session} = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tripPlans, setTripPlans] = useState<TripListItem[]>([]);
  const [sharedTrips, setSharedTrips] = useState<SharedTripReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showLoader = useDelayedLoader(isLoading, 300); // Only show loader after 300ms
  const [editingTrip, setEditingTrip] = useState<TripListItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'my' | 'shared'>('my');
  const [duplicatingTripId, setDuplicatingTripId] = useState<string | null>(null);
  const [isDockVisible, setIsDockVisible] = useState(false);
  
  // Selected trip from query params or shareId
  const selectedTripId = searchParams.get('trip');
  const shareId = searchParams.get('share');
  const [selectedTripData, setSelectedTripData] = useState<TripDocument | null>(null);
  const [isSharedMode, setIsSharedMode] = useState(false);

  // Full trips with spots/routes for map display
  const [allTripsData, setAllTripsData] = useState<TripDocument[]>([]);

  // Fetch user's own trips (list view)
  const fetchTrips = useCallback(async () => {
    try {
      const response = await fetch('/api/getTrips');
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      if (data.success) {
        setTripPlans(data.trips);
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      toast.error('Failed to load trips');
    }
  }, []);

  // Fetch all trips with full details (for map display)
  const fetchAllTripsData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const query = groq`*[_type == "trip" && user._ref == $userId] {
        _id,
        _type,
        name,
        slug,
        defaultTileLayer,
        campingSpots[] {
          _key,
          name,
          description,
          category,
          coordinates {
            lat,
            lng
          }
        },
        routes[] {
          _key,
          name,
          color,
          waypoints[] {
            lat,
            lng
          },
          elevationGain
        },
        user {
          _ref
        }
      }`;

      const trips = await client.fetch(query, {userId: session.user.id});
      setAllTripsData(trips || []);
    } catch (error) {
      console.error('Failed to fetch all trips data:', error);
      setAllTripsData([]);
    }
  }, [session?.user?.id]);

  // Fetch shared trips
  const fetchSharedTrips = useCallback(async () => {
    if (!session?.user?.id) return;

    const rawGoogleId = session.user.id.replace('google_', '');

    const query = groq`*[_type == "user" && googleId == $googleId][0] {
      sharedTrips[] {
        _key,
        addedAt,
        trip-> {
          _id,
          name,
          slug,
          shareId,
          "user": user->{
            _id,
            name,
            email
          },
          "campingSpotsCount": count(campingSpots),
          "routesCount": count(routes)
        }
      }
    }`;

    const user = await client.fetch(query, {googleId: rawGoogleId});
    setSharedTrips(user?.sharedTrips || []);
  }, [session?.user?.id]);

  // Fetch full trip details for editing
  const fetchTripDetails = useCallback(async (tripId: string) => {
    if (!session?.user?.id) return;

    try {
      const query = groq`*[_type == "trip" && _id == $tripId && user._ref == $userId][0] {
        _id,
        _type,
        name,
        slug,
        shareId,
        defaultTileLayer,
        campingSpots[] {
          _key,
          name,
          description,
          category,
          coordinates {
            lat,
            lng
          }
        },
        routes[] {
          _key,
          name,
          color,
          waypoints[] {
            lat,
            lng
          },
          elevationGain
        },
        user {
          _ref
        }
      }`;

      const trip = await client.fetch(query, {tripId, userId: session.user.id});
      setSelectedTripData(trip);
      setIsSharedMode(false);
    } catch (error) {
      console.error('Failed to fetch trip details:', error);
      toast.error('Failed to load trip details');
      setSelectedTripData(null);
    }
  }, [session?.user?.id]);

  // Fetch shared trip by shareId
  const fetchSharedTrip = useCallback(async (shareId: string) => {
    try {
      const query = groq`*[_type == "trip" && shareId == $shareId && isShared == true][0] {
        _id,
        _type,
        name,
        slug,
        shareId,
        defaultTileLayer,
        campingSpots[] {
          _key,
          name,
          description,
          category,
          coordinates {
            lat,
            lng
          }
        },
        routes[] {
          _key,
          name,
          color,
          waypoints[] {
            lat,
            lng
          },
          elevationGain
        },
        user->{
          name
        }
      }`;

      const trip = await client.fetch(query, {shareId});

      if (trip) {
        setSelectedTripData(trip);
        setIsSharedMode(true);
      } else {
        toast.error('Shared trip not found');
        router.push('/maps');
      }
    } catch (error) {
      console.error('Failed to fetch shared trip:', error);
      toast.error('Failed to load shared trip');
    }
  }, [router]);

  // Load trip plans on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTrips(), fetchSharedTrips(), fetchAllTripsData()]);
      setIsLoading(false);
    };

    loadData();
  }, [fetchTrips, fetchSharedTrips, fetchAllTripsData]);

  // Load selected trip details or shared trip when query param changes
  useEffect(() => {
    if (shareId) {
      // Shared mode - fetch by shareId
      fetchSharedTrip(shareId);
    } else if (selectedTripId) {
      // Edit mode - fetch by tripId
      fetchTripDetails(selectedTripId);
    } else {
      // Overview mode
      setSelectedTripData(null);
      setIsSharedMode(false);
    }
  }, [selectedTripId, shareId, fetchTripDetails, fetchSharedTrip]);

  const handleRemoveSharedTrip = async (tripId: string) => {
    try {
      const response = await fetch('/api/removeSharedTrip', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({tripId}),
      });

      if (!response.ok) throw new Error('Failed to remove shared trip');

      await fetchSharedTrips();
      toast.success('Shared trip removed');
    } catch (error) {
      console.error('Error removing shared trip:', error);
      toast.error('Failed to remove shared trip');
    }
  };

  const handleDuplicateTrip = async (tripId: string, tripName: string) => {
    try {
      setDuplicatingTripId(tripId);
      const response = await fetch('/api/duplicateTrip', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({tripId}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate trip');
      }

      toast.success(`${tripName} duplicated successfully!`);
      await fetchTrips();
    } catch (error) {
      console.error('Error duplicating trip:', error);
      toast.error('Failed to duplicate trip');
    } finally {
      setDuplicatingTripId(null);
    }
  };

  const refreshTrips = useCallback(async () => {
    await fetchTrips();
    await fetchAllTripsData();
  }, [fetchTrips, fetchAllTripsData]);

  // Handle trip selection via query params
  const handleSelectTrip = useCallback((tripId: string | null) => {
    if (tripId) {
      router.push(`/maps?trip=${tripId}`);
    } else {
      router.push('/maps');
    }
  }, [router]);

  // Visibility toggles for overview mode
  const [showAllSpots, setShowAllSpots] = useState(true);
  const [showAllRoutes, setShowAllRoutes] = useState(true);

  // Visibility toggles for edit mode (by category)
  const [showCamps, setShowCamps] = useState(true);
  const [showFishing, setShowFishing] = useState(true);
  const [showViewpoints, setShowViewpoints] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Compass toggle (shared between both modes)
  const [showCompass, setShowCompass] = useState(false);

  // Distance grid toggle (shared between both modes)
  const [showGrid, setShowGrid] = useState(false);

  // Edit mode - active tab and category filter
  const [activeTab, setActiveTab] = useState<'locations' | 'routes'>('locations');
  const [spotCategoryFilter, setSpotCategoryFilter] = useState<'all' | 'camp' | 'fishing' | 'viewpoint'>('all');

  // CRUD state for spots and routes
  const [editingSpot, setEditingSpot] = useState<CampingSpot | null>(null);
  const [isPendingSpot, setIsPendingSpot] = useState(false);
  const [isAddingSpot, setIsAddingSpot] = useState(false);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [isEditingRoute, setIsEditingRoute] = useState(false);

  // Map ref for zoom functions
  const mapRef = useRef<TripMapRef>(null);

  // Helper function to calculate route distance
  const calculateRouteDistance = (waypoints: Array<{lat: number; lng: number}>): number => {
    if (waypoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      // Haversine formula
      const R = 6371; // Radius of Earth in kilometers
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

  // Calculate total distance for a trip (sum of all routes)
  const calculateTripDistance = (routes: TripListItem['routes']): number => {
    if (!routes || routes.length === 0) return 0;
    return routes.reduce((total, route) => {
      return total + calculateRouteDistance(route.waypoints);
    }, 0);
  };

  // Calculate total elevation gain for a trip (sum of all routes)
  const calculateTripElevation = (routes: TripListItem['routes']): number => {
    if (!routes || routes.length === 0) return 0;
    return routes.reduce((total, route) => {
      return total + (route.elevationGain || 0);
    }, 0);
  };

  // Zoom to spot on map
  const handleZoomToSpot = (spot: CampingSpot) => {
    if (mapRef.current && spot?.coordinates?.lat && spot?.coordinates?.lng) {
      mapRef.current.zoomToCoordinates(spot.coordinates.lat, spot.coordinates.lng, 14);
    }
  };

  // Zoom to route on map
  const handleZoomToRoute = (route: Route) => {
    if (mapRef.current && route?.waypoints && route.waypoints.length > 0) {
      mapRef.current.zoomToBounds(route.waypoints);
    }
  };

  // Save trip plan to Sanity
  const saveTripPlan = useCallback(
    async (plan: Partial<TripDocument>) => {
      if (!selectedTripData?._id) return;

      try {
        const response = await fetch('/api/updateTrip', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tripId: selectedTripData._id,
            updates: plan,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update trip');
        }

        const data = await response.json();
        if (data.success) {
          setSelectedTripData(data.trip);
          
          // Also update this trip in allTripsData so overview reflects changes
          setAllTripsData((prev) =>
            prev.map((trip) =>
              trip._id === selectedTripData._id
                ? data.trip
                : trip
            )
          );
        } else {
          throw new Error(data.error || 'Failed to update trip');
        }
      } catch (error) {
        console.error('Failed to save trip plan:', error);
        toast.error('Failed to save changes');
      }
    },
    [selectedTripData?._id],
  );

  // Add camping spot
  const handleAddSpot = useCallback(
    (coordinates: {lat: number; lng: number}) => {
      if (!selectedTripData) return;

      const newSpot: CampingSpot = {
        _key: Date.now().toString(),
        name: `Camping Spot ${(selectedTripData.campingSpots?.length || 0) + 1}`,
        coordinates,
        description: '',
        category: 'camp',
      };

      // Don't save yet - just show the dialog
      setEditingSpot(newSpot);
      setIsPendingSpot(true);
      setIsAddingSpot(false);
    },
    [selectedTripData],
  );

  // Update camping spot
  const handleUpdateSpot = useCallback(
    (updatedSpot: CampingSpot) => {
      if (!selectedTripData) return;

      const updatedPlan = {
        ...selectedTripData,
        campingSpots: (selectedTripData.campingSpots || []).map((spot) =>
          spot._key === updatedSpot._key ? updatedSpot : spot,
        ),
      };

      // Update selectedTripData immediately for responsiveness
      setSelectedTripData(updatedPlan);
      
      // Also update in allTripsData for overview
      setAllTripsData((prev) =>
        prev.map((trip) =>
          trip._id === selectedTripData._id
            ? updatedPlan
            : trip
        )
      );

      saveTripPlan(updatedPlan);
      setEditingSpot(null);
    },
    [selectedTripData, saveTripPlan],
  );

  // Delete camping spot
  const handleDeleteSpot = useCallback(
    (spotKey: string) => {
      if (!selectedTripData) return;

      const updatedPlan = {
        ...selectedTripData,
        campingSpots: (selectedTripData.campingSpots || []).filter((spot) => spot._key !== spotKey),
      };

      // Update selectedTripData immediately for responsiveness
      setSelectedTripData(updatedPlan);
      
      // Also update in allTripsData for overview
      setAllTripsData((prev) =>
        prev.map((trip) =>
          trip._id === selectedTripData._id
            ? updatedPlan
            : trip
        )
      );

      saveTripPlan(updatedPlan);
      toast.success('Spot deleted');
    },
    [selectedTripData, saveTripPlan],
  );

  // Start adding spot
  const handleStartAddingSpot = useCallback(() => {
    setIsAddingSpot(true);
    // Auto-hide dock on mobile
    if (window.innerWidth < 1024) {
      setIsDockVisible(false);
    }
  }, []);

  // Start drawing route
  const handleStartRoute = useCallback(() => {
    if (!selectedTripData) return;

    // Preserve current map view
    const currentView = mapRef.current?.getCurrentView();

    const newRoute: Route = {
      _key: Date.now().toString(),
      name: `Route ${(selectedTripData.routes?.length || 0) + 1}`,
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
  }, [selectedTripData]);

  // Handle route point addition
  const handleRoutePointAdd = useCallback(
    (coordinates: {lat: number; lng: number}) => {
      if (!currentRoute) return;

      const updatedRoute = {
        ...currentRoute,
        waypoints: [...currentRoute.waypoints, coordinates],
      };

      setCurrentRoute(updatedRoute);
    },
    [currentRoute],
  );

  // Save route (with elevation calculation)
  const handleSaveRoute = useCallback(async () => {
    if (!currentRoute || !selectedTripData) return;

    // Optimistic update: Show route immediately in UI
    const optimisticUpdatedPlan = {
      ...selectedTripData,
      routes: [...(selectedTripData.routes || []), {...currentRoute, elevationGain: -1}],
    };
    setSelectedTripData(optimisticUpdatedPlan);
    
    // Also update in allTripsData for overview
    setAllTripsData((prev) =>
      prev.map((trip) =>
        trip._id === selectedTripData._id
          ? optimisticUpdatedPlan
          : trip
      )
    );
    
    setCurrentRoute(null);
    setIsDrawingRoute(false);

    // Calculate elevation in background
    try {
      const response = await fetch('/api/calculateElevation', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({waypoints: currentRoute.waypoints}),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
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
          const finalUpdatedPlan = {
            ...selectedTripData,
            routes: [...(selectedTripData.routes || []), routeWithElevation],
          };
          saveTripPlan(finalUpdatedPlan);
        } else {
          saveTripPlan(optimisticUpdatedPlan);
        }
      } else {
        saveTripPlan(optimisticUpdatedPlan);
      }
    } catch (error) {
      console.error('Error calculating elevation:', error);
      saveTripPlan(optimisticUpdatedPlan);
    }
  }, [currentRoute, selectedTripData, saveTripPlan]);

  // Edit existing route
  const handleEditRoute = useCallback((route: Route) => {
    // Preserve current map view
    const currentView = mapRef.current?.getCurrentView();

    setCurrentRoute(route);
    setIsDrawingRoute(true);
    setIsEditingRoute(true);

    // Auto-hide dock on mobile
    if (window.innerWidth < 1024) {
      setIsDockVisible(false);
    }

    // Restore map view
    if (currentView) {
      setTimeout(() => {
        mapRef.current?.restoreView(currentView);
      }, 100);
    }
  }, []);

  // Save edited route
  const handleUpdateRoute = useCallback(async () => {
    if (!currentRoute || !selectedTripData) return;

    // Find and update the existing route
    const updatedRoutes = (selectedTripData.routes || []).map((route) =>
      route._key === currentRoute._key ? currentRoute : route
    );

    // Optimistic update
    const optimisticUpdatedPlan = {
      ...selectedTripData,
      routes: updatedRoutes.map((r) => (r._key === currentRoute._key ? {...r, elevationGain: -1} : r)),
    };
    setSelectedTripData(optimisticUpdatedPlan);
    
    // Also update in allTripsData for overview
    setAllTripsData((prev) =>
      prev.map((trip) =>
        trip._id === selectedTripData._id
          ? optimisticUpdatedPlan
          : trip
      )
    );
    
    setCurrentRoute(null);
    setIsDrawingRoute(false);
    setIsEditingRoute(false);

    // Calculate elevation in background
    try {
      const response = await fetch('/api/calculateElevation', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({waypoints: currentRoute.waypoints}),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
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
          const finalUpdatedPlan = {
            ...selectedTripData,
            routes: updatedRoutes.map((r) => (r._key === currentRoute._key ? routeWithElevation : r)),
          };
          saveTripPlan(finalUpdatedPlan);
        } else {
          const finalUpdatedPlan = {
            ...selectedTripData,
            routes: updatedRoutes,
          };
          saveTripPlan(finalUpdatedPlan);
        }
      } else {
        const finalUpdatedPlan = {
          ...selectedTripData,
          routes: updatedRoutes,
        };
        saveTripPlan(finalUpdatedPlan);
      }
    } catch (error) {
      console.error('Error calculating elevation:', error);
      const finalUpdatedPlan = {
        ...selectedTripData,
        routes: updatedRoutes,
      };
      saveTripPlan(finalUpdatedPlan);
    }
  }, [currentRoute, selectedTripData, saveTripPlan]);

  // Cancel route drawing
  const handleCancelRoute = useCallback(() => {
    setCurrentRoute(null);
    setIsDrawingRoute(false);
    setIsEditingRoute(false);
  }, []);

  // Undo last route point
  const handleUndoRoutePoint = useCallback(() => {
    if (!currentRoute || currentRoute.waypoints.length === 0) return;
    
    const updatedRoute = {
      ...currentRoute,
      waypoints: currentRoute.waypoints.slice(0, -1),
    };
    
    setCurrentRoute(updatedRoute);
  }, [currentRoute]);

  // Delete route
  const handleDeleteRoute = useCallback(
    (routeKey: string) => {
      if (!selectedTripData) return;

      const updatedPlan = {
        ...selectedTripData,
        routes: (selectedTripData.routes || []).filter((route) => route._key !== routeKey),
      };

      // Update selectedTripData immediately for responsiveness
      setSelectedTripData(updatedPlan);
      
      // Also update in allTripsData for overview
      setAllTripsData((prev) =>
        prev.map((trip) =>
          trip._id === selectedTripData._id
            ? updatedPlan
            : trip
        )
      );

      saveTripPlan(updatedPlan);
      toast.success('Route deleted');
    },
    [selectedTripData, saveTripPlan],
  );

  // Determine what data to show on map
  const mapData = (() => {
    if ((selectedTripId || shareId) && selectedTripData) {
      // Edit or shared mode - show selected trip only
      return {
        campingSpots: selectedTripData.campingSpots || [],
        routes: selectedTripData.routes || [],
      };
    } else {
      // Overview mode - combine all trips
      const allSpots = allTripsData.flatMap((trip) =>
        (trip.campingSpots || [])
          .filter((spot) => spot?.coordinates?.lat && spot?.coordinates?.lng)
          .map((spot) => ({
            ...spot,
            tripName: trip.name,
            tripId: trip._id,
          }))
      );

      const allRoutes = allTripsData.flatMap((trip) =>
        (trip.routes || [])
          .filter((route) => route?.waypoints && route.waypoints.length > 0)
          .map((route) => ({
            ...route,
            tripName: trip.name,
            tripId: trip._id,
          }))
      );

      return {
        campingSpots: allSpots,
        routes: allRoutes,
      };
    }
  })();

  // Determine if we're in edit mode, shared mode, or overview mode
  const isEditMode = Boolean(selectedTripId && selectedTripData && !isSharedMode);
  const isViewMode = Boolean((selectedTripId || shareId) && selectedTripData); // Edit or shared

  if (showLoader && tripPlans.length === 0 && sharedTrips.length === 0) {
    return (
      <ProtectedRoute>
        <main className="w-full h-screen flex items-center justify-center bg-primary">
          <div className="text-center text-accent text-3xl">Loading maps...</div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-ios w-screen flex flex-col lg:flex-row relative">
        {/* Main Content - Map Container */}
        <div className="flex-1 relative h-full overflow-hidden">
          <TripMap
            ref={mapRef}
            campingSpots={mapData.campingSpots}
            routes={currentRoute ? [...mapData.routes, currentRoute] : mapData.routes}
            defaultTileLayer={isViewMode && selectedTripData ? (selectedTripData.defaultTileLayer || 'Kartverket Raster') : 'Kartverket Raster'}
            onSpotClick={() => {
              // Just show the popup - no zoom (handled by TripMap component)
            }}
            onMapClick={isEditMode && !isSharedMode && isAddingSpot ? handleAddSpot : undefined}
            onRoutePointAdd={isEditMode && !isSharedMode && isDrawingRoute ? handleRoutePointAdd : undefined}
            onRouteClick={() => {
              // Just show the popup - no zoom (handled by TripMap component)
            }}
            isAddingSpot={isAddingSpot && !isSharedMode}
            isDrawingRoute={isDrawingRoute && !isSharedMode}
            isReadOnly={!isEditMode || isSharedMode}
            autoFitBounds={isViewMode} // Auto-fit only on initial trip load
            showRoutes={isEditMode ? showRoutes : showAllRoutes}
            showCampSpots={isEditMode ? showCamps : showAllSpots}
            showFishingSpots={isEditMode ? showFishing : showAllSpots}
            showViewpointSpots={isEditMode ? showViewpoints : showAllSpots}
            onToggleRoutes={isEditMode ? () => setShowRoutes(!showRoutes) : () => setShowAllRoutes(!showAllRoutes)}
            onToggleCampSpots={isEditMode ? () => setShowCamps(!showCamps) : () => setShowAllSpots(!showAllSpots)}
            onToggleFishingSpots={isEditMode ? () => setShowFishing(!showFishing) : () => setShowAllSpots(!showAllSpots)}
            onToggleViewpointSpots={isEditMode ? () => setShowViewpoints(!showViewpoints) : () => setShowAllSpots(!showAllSpots)}
            showCompass={showCompass}
            onToggleCompass={() => setShowCompass(!showCompass)}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            isDockVisible={isDockVisible}
            onToggleDock={() => setIsDockVisible(!isDockVisible)}
            onStartAddingSpot={isEditMode ? handleStartAddingSpot : undefined}
            onStartAddingRoute={isEditMode ? handleStartRoute : undefined}
          />

          {/* Back Button - Top Left */}
          <button
            onClick={() => router.push('/')}
            className="absolute top-4 left-4 z-[1001] bg-dimmed backdrop-blur-sm rounded-lg p-3 hover:bg-dimmed-hover shadow-lg transition-all duration-200"
            title="Back to gear"
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
          {/* EDIT/SHARED MODE - Trip Selected */}
          {isViewMode && selectedTripData && (
            <>
              {/* Header Section - Fixed */}
              <div className="px-6 pt-6 flex-shrink-0">
                {/* Trip Header */}
                <div className="flex items-center justify-between mb-2 lg:mb-4 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Back to Maps Button */}
                    <button
                      onClick={() => router.push('/maps')}
                      className="text-white/70 hover:text-accent transition-colors"
                      title="Back to Maps"
                    >
                      <Icon name="chevrondown" width={20} height={20} className="rotate-90" />
                    </button>
                    <div className="flex flex-col">
                      <h2 className="lg:text-2xl text-lg text-accent font-medium">{selectedTripData.name}</h2>
                      {isSharedMode && selectedTripData.user && typeof selectedTripData.user === 'object' && 'name' in selectedTripData.user && (
                        <span className="text-xs text-white/50">Shared by {(selectedTripData.user as {name: string}).name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Share Button - only in edit mode */}
                    {!isSharedMode && (
                      <TripShareButton
                        tripId={selectedTripData._id}
                        shareId={selectedTripData.shareId}
                        tripName={selectedTripData.name}
                      />
                    )}
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
                    Spots ({(selectedTripData.campingSpots || []).length})
                  </button>
                  <button
                    onClick={() => setActiveTab('routes')}
                    className={activeTab === 'routes' ? 'tab-active' : 'tab'}
                  >
                    Routes ({(selectedTripData.routes || []).length})
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
                      {selectedTripData.campingSpots?.some((spot) => spot.category === 'camp') && (
                        <button
                          onClick={() => setSpotCategoryFilter('camp')}
                          className={`menu-category text-sm ${spotCategoryFilter === 'camp' ? 'menu-active' : ''}`}
                        >
                          Camps
                        </button>
                      )}
                      {selectedTripData.campingSpots?.some((spot) => spot.category === 'fishing') && (
                        <button
                          onClick={() => setSpotCategoryFilter('fishing')}
                          className={`menu-category text-sm ${spotCategoryFilter === 'fishing' ? 'menu-active' : ''}`}
                        >
                          Fishing waters
                        </button>
                      )}
                      {selectedTripData.campingSpots?.some((spot) => spot.category === 'viewpoint') && (
                        <button
                          onClick={() => setSpotCategoryFilter('viewpoint')}
                          className={`menu-category text-sm ${spotCategoryFilter === 'viewpoint' ? 'menu-active' : ''}`}
                        >
                          Viewpoints
                        </button>
                      )}
                    </div>

                    {(selectedTripData.campingSpots || []).length === 0 ? (
                      <p className="text-white/50 text-sm">No camping spots added yet.</p>
                    ) : (
                      <div className="space-y-1 lg:space-y-2">
                        {(selectedTripData.campingSpots || [])
                          .filter(
                            (spot) =>
                              spotCategoryFilter === 'all' || spot.category === spotCategoryFilter
                          )
                          .map((spot) => (
                            <div key={spot._key} className="map-card p-1 lg:p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleZoomToSpot(spot)}>
                                  <h4 className="font-medium text-primary truncate hover:underline">{spot.name}</h4>
                                  {spot.description && (
                                    <p className="text-sm text-white/70 mt-1 line-clamp-2">{spot.description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    <span className="text-xs bg-white/10 text-white px-2 py-1 rounded capitalize">
                                      {spot.category}
                                    </span>
                                    <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                                      {spot.coordinates.lat.toFixed(4)}, {spot.coordinates.lng.toFixed(4)}
                                    </span>
                                  </div>
                                </div>
                              {!isSharedMode && (
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingSpot(spot);
                                      setIsPendingSpot(false);
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
                              )}
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
                    {(selectedTripData.routes || []).length === 0 ? (
                      <p className="text-white/50 text-sm">No routes added yet.</p>
                    ) : (
                      <div className="space-y-1 lg:space-y-2">
                        {(selectedTripData.routes || []).map((route) => (
                          <div key={route._key} className="map-card p-1 lg:p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleZoomToRoute(route)}>
                                <h4 className="font-medium text-primary truncate hover:underline">{route.name}</h4>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {route.waypoints && route.waypoints.length >= 2 && (
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
                                  {route.waypoints && route.waypoints.length > 0 && (
                                    <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                                      {route.waypoints.length} waypoints
                                    </span>
                                  )}
                                </div>
                              </div>
                              {!isSharedMode && (
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
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sticky Bottom Add Buttons - only in edit mode */}
              {!isSharedMode && (
                <div className="p-4 bg-background border-t border-white/10 flex-shrink-0">
                  {activeTab === 'locations' ? (
                    <button
                      onClick={handleStartAddingSpot}
                      className="button-primary-accent w-full text-lg flex items-center justify-center gap-2 py-3"
                      title="Add new spot"
                    >
                      <Icon name="add" width={20} height={20} />
                      New Spot
                    </button>
                  ) : (
                    <button
                      onClick={handleStartRoute}
                      className="button-primary-accent w-full text-lg flex items-center justify-center gap-2 py-3"
                      title="Add new route"
                    >
                      <Icon name="add" width={20} height={20} />
                      New Route
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* LIST MODE - No Trip Selected */}
          {!isViewMode && (
            <>
              {/* Header Section - Fixed */}
              <div className="px-6 pt-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-2 lg:mb-4">
                  <h1 className="text-2xl lg:text-3xl text-accent font-medium">Maps</h1>
                  {/* Mobile Close Dock Button */}
                  <button
                    onClick={() => setIsDockVisible(false)}
                    className="lg:hidden button-ghost p-2"
                    title="Close dock"
                  >
                    <Icon name="close" width={16} height={16} />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex mb-4 lg:mb-2 border-b border-white/10">
                  <button
                    onClick={() => setSelectedFilter('my')}
                    className={selectedFilter === 'my' ? 'tab-active' : 'tab'}
                  >
                    My Maps
                  </button>
                  <button
                    onClick={() => setSelectedFilter('shared')}
                    className={selectedFilter === 'shared' ? 'tab-active' : 'tab'}
                  >
                    Shared Maps
                  </button>
                </div>
              </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-2 lg:p-2 min-h-0">
            {selectedFilter === 'my' && tripPlans.length === 0 && (
              <p className="text-white/50 text-sm">No maps yet. Create your first map!</p>
            )}

            {selectedFilter === 'shared' && sharedTrips.length === 0 && (
              <p className="text-white/50 text-sm">No shared maps yet.</p>
            )}

            <div className="space-y-1 lg:space-y-2">
              {/* My Maps */}
              {selectedFilter === 'my' &&
                tripPlans.map((plan) => {
                  const totalDistance = calculateTripDistance(plan.routes);
                  const totalElevation = calculateTripElevation(plan.routes);
                  
                  return (
                    <div
                      key={plan._id}
                      onClick={() => handleSelectTrip(plan._id)}
                      className="map-card p-1 lg:p-3 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-primary truncate">{plan.name}</h4>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {plan.routesCount > 0 && (
                              <span className="text-xs bg-white/10 text-white px-2 py-1 rounded flex items-center gap-1">
                                <Icon name="route" width={12} height={12} />
                                {plan.routesCount}
                              </span>
                            )}
                            {plan.campingSpotsCount > 0 && (
                              <span className="text-xs bg-white/10 text-white px-2 py-1 rounded flex items-center gap-1">
                                <Icon name="viewpoint" width={12} height={12} />
                                {plan.campingSpotsCount}
                              </span>
                            )}
                            {totalDistance > 0 && (
                              <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                                {totalDistance.toFixed(1)}km
                              </span>
                            )}
                            {totalElevation > 0 && (
                              <span className="text-xs bg-white/10 text-white px-2 py-1 rounded">
                                ↗ {totalElevation}m
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTrip(plan);
                            }}
                            className="button-ghost p-1.5 min-w-0"
                            title="Edit map"
                          >
                            <Icon name="edit" width={20} height={20} />
                          </button>
                          <DeleteTripButton
                            tripId={plan._id}
                            tripName={plan.name}
                            onSuccess={() => {
                              setTripPlans((prev) => prev.filter((p) => p._id !== plan._id));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Shared Maps */}
              {selectedFilter === 'shared' &&
                sharedTrips.map((sharedTrip, index) => (
                  <div
                    key={sharedTrip._key || `shared_${sharedTrip.trip._id}_${index}`}
                    onClick={() => {
                      if (sharedTrip.trip.shareId) {
                        router.push(`/maps?share=${sharedTrip.trip.shareId}`);
                      }
                    }}
                    className="map-card p-1 lg:p-3 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-primary truncate">{sharedTrip.trip.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs bg-white/10 text-white px-2 py-1 rounded flex items-center gap-1">
                            <Icon name="user" width={12} height={12} />
                            {sharedTrip.trip.user.name}
                          </span>
                          {sharedTrip.trip.routesCount > 0 && (
                            <span className="text-xs bg-white/10 text-white px-2 py-1 rounded flex items-center gap-1">
                              <Icon name="route" width={12} height={12} />
                              {sharedTrip.trip.routesCount}
                            </span>
                          )}
                          {sharedTrip.trip.campingSpotsCount > 0 && (
                            <span className="text-xs bg-white/10 text-white px-2 py-1 rounded flex items-center gap-1">
                              <Icon name="viewpoint" width={12} height={12} />
                              {sharedTrip.trip.campingSpotsCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateTrip(sharedTrip.trip._id, sharedTrip.trip.name);
                          }}
                          disabled={duplicatingTripId === sharedTrip.trip._id}
                          className="button-ghost p-1.5 min-w-0"
                          title="Duplicate map"
                        >
                          {duplicatingTripId === sharedTrip.trip._id ? (
                            <div className="animate-spin w-4 h-4 border border-accent border-t-transparent rounded-full" />
                          ) : (
                            <Icon name="duplicate" width={20} height={20} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSharedTrip(sharedTrip.trip._id);
                          }}
                          className="button-ghost p-1.5 min-w-0"
                          title="Remove shared map"
                        >
                          <Icon name="delete" width={20} height={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Sticky Bottom Add Button */}
          <div className="p-4 bg-background border-t border-white/10 flex-shrink-0">
            <AddTripDialog
              onSuccess={async (newTrip) => {
                setTripPlans((prev) => [newTrip, ...prev]);
              }}
            />
          </div>
            </>
          )}
        </div>

        {/* Edit Trip Dialog */}
        {editingTrip && (
          <EditTripDialog
            trip={editingTrip}
            open={!!editingTrip}
            onOpenChange={(open) => {
              if (!open) setEditingTrip(null);
            }}
            onSuccess={refreshTrips}
          />
        )}

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
                    setEditingSpot({...editingSpot, category: e.target.value as 'camp' | 'fishing' | 'viewpoint'})
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
                  if (!editingSpot || !selectedTripData) return;

                  if (isPendingSpot) {
                    // This is a new spot - save it to the trip plan
                    const updatedPlan = {
                      ...selectedTripData,
                      campingSpots: [...(selectedTripData.campingSpots || []), editingSpot],
                    };
                    
                    // Update selectedTripData immediately for responsiveness
                    setSelectedTripData(updatedPlan);
                    
                    // Also update in allTripsData for overview
                    setAllTripsData((prev) =>
                      prev.map((trip) =>
                        trip._id === selectedTripData._id
                          ? updatedPlan
                          : trip
                      )
                    );
                    
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
                  <span className="text-sm text-white/50">
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
                      onClick={handleUndoRoutePoint}
                      className="button-ghost p-2"
                      title="Undo last point"
                    >
                      <Icon name="undo" width={16} height={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-2">
                  <span className="text-white">Route Name</span>
                  <input
                    type="text"
                    value={currentRoute.name}
                    onChange={(e) => setCurrentRoute({...currentRoute, name: e.target.value})}
                    className="w-full p-3 bg-white/5 rounded-lg text-white border border-white/10 focus:border-accent focus:outline-none"
                    style={{fontSize: '16px'}}
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={handleCancelRoute}
                    className="button-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={isEditingRoute ? handleUpdateRoute : handleSaveRoute}
                    disabled={currentRoute.waypoints.length < 2}
                    className="button-primary-accent flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEditingRoute ? 'Update Route' : 'Save Route'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function MapsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapsPageContent />
    </Suspense>
  );
}
