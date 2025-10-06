'use client';
import {useState, useCallback, useEffect, useRef, Suspense} from 'react';
import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {DeleteTripButton} from '@/components/deleteTripButton';
import {EditTripDialog} from '@/components/EditTripDialog';
import {AddTripDialog} from '@/components/AddTripDialog';
import {Icon} from '@/components/Icon';
import {useRouter, useSearchParams} from 'next/navigation';
import {TripListItem, SharedTripReference} from '@/types';
import {useSession} from 'next-auth/react';
import {client} from '@/sanity/client';
import {groq} from 'next-sanity';
import {toast} from 'sonner';

export const dynamic = 'force-dynamic';

function MapsPageContent() {
  const {data: session} = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tripPlans, setTripPlans] = useState<TripListItem[]>([]);
  const [sharedTrips, setSharedTrips] = useState<SharedTripReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<TripListItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'my' | 'shared' | null>(() => {
    // Initialize from URL or localStorage fallback
    const urlFilter = searchParams.get('filter');
    if (urlFilter) {
      // Validate the filter value
      if (['my', 'shared'].includes(urlFilter)) {
        return urlFilter as 'my' | 'shared';
      }
    }

    // Fallback to localStorage if no URL param
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('mapsLastFilter') as 'my' | 'shared' | null) || null;
    }
    return null;
  });
  const isUpdatingURL = useRef(false);
  const [duplicatingTripId, setDuplicatingTripId] = useState<string | null>(null);

  // Fetch user's own trips
  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/getTrips');
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      if (data.success) {
        setTripPlans(data.trips);
      } else {
        throw new Error(data.error || 'Failed to fetch trips');
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch trips');
    }
  }, []);

  // Fetch shared trips
  const fetchSharedTrips = useCallback(async () => {
    if (!session?.user?.id) return;

    // Extract the raw Google ID from session (remove "google_" prefix)
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
          image,
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

  // Load trip plans from Sanity on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await fetchTrips();
        await fetchSharedTrips();
      } catch (error) {
        console.error('Failed to load data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchTrips, fetchSharedTrips]);

  // Sync URL state with component state (only when URL changes externally)
  useEffect(() => {
    // Skip if we're making our own URL update
    if (isUpdatingURL.current) {
      isUpdatingURL.current = false;
      return;
    }

    const urlFilter = searchParams.get('filter');

    if (urlFilter) {
      // Validate the filter value
      if (['my', 'shared'].includes(urlFilter)) {
        const newFilter = urlFilter as 'my' | 'shared';
        if (newFilter !== selectedFilter) {
          setSelectedFilter(newFilter);
          // Update localStorage fallback
          localStorage.setItem('mapsLastFilter', newFilter);
        }
      }
    } else if (selectedFilter !== null) {
      // URL has no filter, clear selection
      setSelectedFilter(null);
      localStorage.removeItem('mapsLastFilter');
    }
  }, [searchParams, selectedFilter]);

  const handleFilterChange = (filter: 'my' | 'shared' | null) => {
    setSelectedFilter(filter);

    // Mark that we're updating the URL ourselves
    isUpdatingURL.current = true;

    if (filter) {
      // Update URL with filter parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('filter', filter);
      router.push(`?${newSearchParams.toString()}`);

      // Save to localStorage as fallback
      localStorage.setItem('mapsLastFilter', filter);
    } else {
      // Remove filter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('filter');
      router.push(newSearchParams.toString() ? `?${newSearchParams.toString()}` : '/maps');

      // Remove from localStorage
      localStorage.removeItem('mapsLastFilter');
    }
  };

  const handleRemoveSharedTrip = async (tripId: string) => {
    try {
      const response = await fetch('/api/removeSharedTrip', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({tripId}),
      });

      if (!response.ok) {
        throw new Error('Failed to remove shared trip');
      }

      await fetchSharedTrips();
    } catch (error) {
      console.error('Error removing shared trip:', error);
      alert('Failed to remove shared trip. Please try again.');
    }
  };

  const handleDuplicateTrip = async (tripId: string, tripName: string) => {
    try {
      setDuplicatingTripId(tripId);
      const response = await fetch('/api/duplicateTrip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({tripId}),
      });

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText);
        let errorData;
        try {
          errorData = await response.json();
          console.error('API Error:', errorData);
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          errorData = {error: response.statusText};
        }
        throw new Error(`Failed to duplicate trip: ${errorData.error || response.statusText}`);
      }

      await response.json();

      // Show success toast and stay on the page
      toast.success(`${tripName} duplicated successfully!`, {
        duration: 3000,
        position: 'bottom-center',
      });

      // Refresh the trips list to show the new duplicate
      await fetchTrips();
    } catch (error) {
      console.error('Error duplicating trip:', error);
      toast.error('Failed to duplicate trip. Please try again.', {
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setDuplicatingTripId(null);
    }
  };

  // Refresh trips list
  const refreshTrips = useCallback(async () => {
    await fetchTrips();
  }, [fetchTrips]);

  // Helper function to calculate route distance using Haversine formula
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

  // Calculate total trip distance from all routes
  const calculateTotalTripDistance = (
    routes: Array<{waypoints: Array<{lat: number; lng: number}>}>,
  ): number => {
    return routes.reduce((total, route) => {
      return total + calculateRouteDistance(route.waypoints);
    }, 0);
  };

  // Calculate total elevation gain from all routes
  const calculateTotalElevationGain = (routes: Array<{elevationGain?: number}>): number => {
    return routes.reduce((total, route) => {
      return total + (route.elevationGain || 0);
    }, 0);
  };

  // Helper function to count spots by category
  const countSpotsByCategory = (campingSpots: Array<{category: string}>) => {
    const counts = {
      camp: 0,
      fishing: 0,
      viewpoint: 0,
    };

    campingSpots.forEach((spot) => {
      if (spot.category === 'camp') counts.camp++;
      else if (spot.category === 'fishing') counts.fishing++;
      else if (spot.category === 'viewpoint') counts.viewpoint++;
    });

    return counts;
  };

  // Open trip for editing
  const handleOpenTrip = useCallback(
    (planId: string) => {
      router.push(`/maps/${planId}`);
    },
    [router],
  );

  if (isLoading && tripPlans.length === 0 && sharedTrips.length === 0) {
    return (
      <ProtectedRoute>
        <main className="container mx-auto min-h-screen p-16">
          <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
            Loading maps...
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen p-16">
        {/* Header */}
        <div className="flex flex-col gap-y-4">
          <div className="flex items-center justify-between">
            <AddTripDialog
              onSuccess={async (newTrip) => {
                // Add the new trip to the list
                setTripPlans((prev) => [newTrip, ...prev]);
              }}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-red-400 text-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              {error}
            </div>
          )}

          {tripPlans.length === 0 && sharedTrips.length === 0 ? (
            <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
              Create your first trip to start planning adventures.
            </div>
          ) : (
            <>
              <div className="flex gap-x-2 no-scrollbar my-1 p-2">
                <button
                  onClick={() => handleFilterChange(null)}
                  className={`menu-category text-md ${selectedFilter === null ? 'menu-active' : ''}`}
                >
                  All
                </button>
                <button
                  onClick={() => handleFilterChange('my')}
                  className={`menu-category text-md ${selectedFilter === 'my' ? 'menu-active' : ''}`}
                >
                  My Maps
                </button>
                <button
                  onClick={() => handleFilterChange('shared')}
                  className={`menu-category text-md ${selectedFilter === 'shared' ? 'menu-active' : ''}`}
                >
                  Shared
                </button>
              </div>

              {selectedFilter === 'shared' ? (
                // Show shared trips with same styling as regular trips
                <div className="space-y-2">
                  {sharedTrips.map((sharedTrip, index) => (
                    <div
                      key={sharedTrip._key || `shared_${sharedTrip.trip._id}_${index}`}
                      className="product-map flex items-center justify-between cursor-pointer"
                      onClick={() => {
                        // Navigate to the shared trip view using shareId if available, otherwise use trip ID
                        if (sharedTrip.trip.shareId) {
                          router.push(`/share/map/${sharedTrip.trip.shareId}`);
                        } else {
                          // Fallback to regular trip view with shared flag
                          router.push(`/maps/${sharedTrip.trip._id}?shared=true`);
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl text-accent mb-2 truncate">
                          {sharedTrip.trip.name}
                        </h3>
                        <div className="flex items-center gap-x-1 mt-1">
                          {/* User */}
                          <span className="tag w-fit items-center gap-x-1 flex flex-wrap">
                            <Icon name="user" width={16} height={16} />
                            {sharedTrip.trip.user.name}
                          </span>

                          {/* Routes */}
                          {sharedTrip.trip.routesCount > 0 && (
                            <span className="tag w-fit items-center gap-x-1 flex flex-wrap">
                              <Icon name="route" width={16} height={16} />
                              {sharedTrip.trip.routesCount}
                            </span>
                          )}

                          {/* Spots */}
                          {sharedTrip.trip.campingSpotsCount > 0 && (
                            <span className="tag w-fit items-center gap-x-1 flex flex-wrap">
                              <Icon name="location" width={16} height={16} />
                              {sharedTrip.trip.campingSpotsCount} spots
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateTrip(sharedTrip.trip._id, sharedTrip.trip.name);
                          }}
                          disabled={duplicatingTripId === sharedTrip.trip._id}
                          className="button-ghost p-2 text-white rounded-md transition-colors"
                          title="Duplicate trip"
                        >
                          {duplicatingTripId === sharedTrip.trip._id ? (
                            <div className="animate-spin w-5 h-5 border border-accent border-t-transparent rounded-full" />
                          ) : (
                            <Icon name="duplicate" width={20} height={20} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSharedTrip(sharedTrip.trip._id);
                          }}
                          className="button-ghost p-2 text-white rounded-md transition-colors"
                          title="Remove from shared trips"
                        >
                          <Icon name="delete" width={20} height={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Show regular trips (filtered by 'my' or show all when null)
                <div className="space-y-2">
                  {tripPlans.map((plan) => (
                    <div
                      key={plan._id}
                      className="product-map flex items-center justify-between cursor-pointer"
                      onClick={() => handleOpenTrip(plan._id)}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl text-accent mb-2 truncate">
                          {plan.name}
                        </h3>
                        <div className="flex items-center gap-x-1 mt-1">
                          {/* Total Distance */}
                          {plan.routes && plan.routes.length > 0 && (
                            <span className="tag w-fit items-center gap-x-1 flex flex-wrap">
                              {calculateTotalTripDistance(plan.routes).toFixed(1)} km
                            </span>
                          )}

                          {/* Total Elevation Gain */}
                          {plan.routes &&
                            plan.routes.length > 0 &&
                            calculateTotalElevationGain(plan.routes) > 0 && (
                              <span className="tag w-fit items-center gap-x-1 flex flex-wrap bg-accent/20 text-accent">
                                ↗ {calculateTotalElevationGain(plan.routes)}m
                              </span>
                            )}

                          {/* Routes */}
                          {plan.routesCount > 0 && (
                            <span className="tag w-fit items-center gap-x-1 flex flex-wrap">
                              <Icon name="route" width={16} height={16} />
                              {plan.routesCount}
                            </span>
                          )}

                          {/* Spots by Category */}
                          {(() => {
                            const spotCounts = countSpotsByCategory(plan.campingSpots || []);
                            return (
                              <>
                                {spotCounts.camp > 0 && (
                                  <span className="tag w-fit items-center gap-x-1 flex flex-wrap">
                                    <Icon name="tent" width={16} height={16} />
                                    {spotCounts.camp}
                                  </span>
                                )}
                                {spotCounts.fishing > 0 && (
                                  <span className="tag w-fit items-center gap-x-1 flex flex-wrap">
                                    <Icon name="fishing" width={16} height={16} />
                                    {spotCounts.fishing}
                                  </span>
                                )}
                                {spotCounts.viewpoint > 0 && (
                                  <span className="tag w-fit items-center gap-x-1 flex flex-wrap">
                                    <Icon name="viewpoint" width={16} height={16} />
                                    {spotCounts.viewpoint}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTrip(plan);
                          }}
                          className="button-ghost p-2 text-white rounded-md transition-colors"
                          title="Edit trip"
                        >
                          <Icon name="edit" width={20} height={20} />
                        </button>
                        <DeleteTripButton
                          tripId={plan._id}
                          tripName={plan.name}
                          onSuccess={() => {
                            // Remove the trip from the list after successful deletion
                            setTripPlans((prev) => prev.filter((p) => p._id !== plan._id));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit Trip Dialog */}
        {editingTrip && (
          <EditTripDialog
            trip={editingTrip}
            open={!!editingTrip}
            onOpenChange={(open) => {
              if (!open) {
                setEditingTrip(null);
              }
            }}
            onSuccess={refreshTrips}
          />
        )}
      </main>
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
