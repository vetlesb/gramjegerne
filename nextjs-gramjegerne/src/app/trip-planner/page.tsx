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
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-y-8 gap-x-8">
              {tripPlans.map((plan) => (
                <li key={plan._id} className="product-list flex flex-col basis-full">
                  <div className="flex flex-col gap-y-4">
                    <div className="relative">
                      <div className="flex flex-col gap-y-1 p-2 absolute top-0 right-0">
                        <button
                          onClick={() => handleDeletePlan(plan._id)}
                          className="button-trans"
                          title="Delete trip"
                          disabled={isLoading}
                        >
                          <div className="flex items-center justify-center gap-x-1 w-full text-lg">
                            <Icon name="delete" width={24} height={24} />
                          </div>
                        </button>
                      </div>
                      <div
                        className="h-full w-full aspect-video flex items-center justify-center placeholder_image cursor-pointer bg-white/5 border border-white/10 rounded-md"
                        onClick={() => handleOpenTrip(plan._id)}
                      >
                        <div className="text-center text-white/50">
                          <Icon name="tree" width={48} height={48} className="mx-auto mb-2" />
                          <p className="text-sm">Trip Preview</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-y-1 gap-x-4 pb-4 pl-4 pr-4 pt-2">
                      <h2
                        className="nav-logo text-3xl text-accent cursor-pointer"
                        onClick={() => handleOpenTrip(plan._id)}
                      >
                        {plan.name}
                      </h2>

                      <ul className="flex flex-wrap gap-x-1 gap-y-1 pt-2">
                        <li className="gap-x-3">
                          <p className="tag w-fit items-center gap-x-1 text-lg flex flex-wrap">
                            <Icon name="category" width={16} height={16} />
                            {plan.campingSpotsCount || 0} spots
                          </p>
                        </li>
                        <li className="gap-x-3">
                          <p className="tag w-fit items-center gap-x-1 text-lg flex flex-wrap">
                            <Icon name="tree" width={16} height={16} />
                            {plan.routesCount || 0} routes
                          </p>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
