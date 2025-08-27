'use client';
import {useState, useCallback, useEffect} from 'react';
import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {Icon} from '@/components/Icon';
import {useRouter} from 'next/navigation';
import {TripListItem} from '@/types';

export const dynamic = 'force-dynamic';

export default function TripPlannerPage() {
  const [tripPlans, setTripPlans] = useState<TripListItem[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Create new trip plan
  const handleCreatePlan = useCallback(async () => {
    if (!newPlanName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/createTrip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPlanName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create trip');
      }

      const data = await response.json();
      if (data.success) {
        // Add the new trip to the list
        setTripPlans((prev) => [data.trip, ...prev]);
        setIsCreatingNew(false);
        setNewPlanName('');
      } else {
        throw new Error(data.error || 'Failed to create trip');
      }
    } catch (error) {
      console.error('Failed to create trip:', error);
      setError(error instanceof Error ? error.message : 'Failed to create trip');
    } finally {
      setIsLoading(false);
    }
  }, [newPlanName]);

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

  // Delete trip plan
  const handleDeletePlan = useCallback(async (planId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/deleteTrip?tripId=${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }

      const data = await response.json();
      if (data.success) {
        // Remove the trip from the list
        setTripPlans((prev) => prev.filter((plan) => plan._id !== planId));
      } else {
        throw new Error(data.error || 'Failed to delete trip');
      }
    } catch (error) {
      console.error('Failed to delete trip:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete trip');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Open trip for editing
  const handleOpenTrip = useCallback(
    (planId: string) => {
      router.push(`/trip-planner/${planId}`);
    },
    [router],
  );

  if (isLoading && tripPlans.length === 0) {
    return (
      <ProtectedRoute>
        <main className="container mx-auto min-h-screen p-16">
          <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
            Loading trips...
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
            <button
              onClick={() => setIsCreatingNew(true)}
              className="button-create text-md flex items-center gap-2"
              disabled={isLoading}
            >
              Create New Trip
            </button>
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
                      <span className="tag w-fit items-center gap-x-1 flex flex-wrap">
                        {plan.campingSpotsCount || 0} spots
                      </span>
                      <span className="tag w-fit items-center gap-x-1 flex flex-wrap">
                        {plan.routesCount || 0} routes
                      </span>
                      {plan.routes && plan.routes.length > 0 && (
                        <span className="tag w-fit items-center gap-x-1 flex flex-wrap">
                          {calculateTotalTripDistance(plan.routes).toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlan(plan._id);
                    }}
                    className="button-ghost p-2 text-white rounded-md transition-colors"
                    title="Delete trip"
                    disabled={isLoading}
                  >
                    <Icon name="delete" width={20} height={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create New Plan Dialog */}
        {isCreatingNew && (
          <div className="fixed inset-0 bg-dimmed/80 flex items-center justify-center z-[9999]">
            <div className="bg-dimmed border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <h2 className="text-2xl text-accent mb-6">Create New Trip</h2>

              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-white/70">Trip Name</span>
                  <input
                    type="text"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="e.g., Jotunheimen Summer 2024"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-accent focus:outline-none"
                    autoFocus
                    disabled={isLoading}
                  />
                </label>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreatePlan}
                    disabled={!newPlanName.trim() || isLoading}
                    className="button-primary flex-1"
                  >
                    {isLoading ? 'Creating...' : 'Create Trip'}
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewPlanName('');
                    }}
                    className="button-secondary flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
