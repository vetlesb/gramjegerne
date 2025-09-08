'use client';
import {useState, useCallback, useEffect} from 'react';
import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {DeleteTripButton} from '@/components/deleteTripButton';
import {EditTripDialog} from '@/components/EditTripDialog';
import {AddTripDialog} from '@/components/AddTripDialog';
import {Icon} from '@/components/Icon';
import {useRouter} from 'next/navigation';
import {TripListItem} from '@/types';

export const dynamic = 'force-dynamic';

export default function MapsPage() {
  const [tripPlans, setTripPlans] = useState<TripListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<TripListItem | null>(null);
  const router = useRouter();

  // Load trip plans from Sanity on mount
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // Refresh trips list
  const refreshTrips = useCallback(async () => {
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
      console.error('Failed to refresh trips:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh trips');
    }
  }, []);

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

  if (isLoading && tripPlans.length === 0) {
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

          {tripPlans.length === 0 ? (
            <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
              Create your first trip to start planning adventures.
            </div>
          ) : (
            <div className="space-y-2">
              {tripPlans.map((plan) => (
                <div
                  key={plan._id}
                  className="product-map flex items-center justify-between cursor-pointer"
                  onClick={() => handleOpenTrip(plan._id)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl text-accent mb-2 truncate">{plan.name}</h3>
                    <div className="flex items-center gap-x-1 mt-1">
                      {/* Total Distance */}
                      {plan.routes && plan.routes.length > 0 && (
                        <span className="tag w-fit items-center gap-x-1 flex flex-wrap">
                          {calculateTotalTripDistance(plan.routes).toFixed(1)} km
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
