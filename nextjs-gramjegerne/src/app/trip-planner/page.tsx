'use client';
import {useState, useCallback, useEffect} from 'react';
import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {Icon} from '@/components/Icon';
import {useRouter} from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Coordinates {
  lat: number;
  lng: number;
}

interface CampingSpot {
  id: string;
  name: string;
  coordinates: Coordinates;
  description?: string;
  elevation?: number;
}

interface Route {
  id: string;
  name: string;
  waypoints: Coordinates[];
  color?: string;
}

interface TripPlan {
  id: string;
  name: string;
  description?: string;
  campingSpots: CampingSpot[];
  routes: Route[];
  createdAt: Date;
  updatedAt: Date;
}

export default function TripPlannerPage() {
  const [tripPlans, setTripPlans] = useState<TripPlan[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const router = useRouter();

  // Load trip plans from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tripPlans');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTripPlans(
          parsed.map((plan: any) => ({
            ...plan,
            createdAt: new Date(plan.createdAt),
            updatedAt: new Date(plan.updatedAt),
          })),
        );
      } catch (error) {
        console.error('Failed to parse saved trip plans:', error);
      }
    }
  }, []);

  // Save trip plans to localStorage
  const saveTripPlans = useCallback((plans: TripPlan[]) => {
    localStorage.setItem('tripPlans', JSON.stringify(plans));
    setTripPlans(plans);
  }, []);

  // Create new trip plan
  const handleCreatePlan = useCallback(() => {
    if (!newPlanName.trim()) return;

    const newPlan: TripPlan = {
      id: Date.now().toString(),
      name: newPlanName.trim(),
      campingSpots: [],
      routes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedPlans = [...tripPlans, newPlan];
    saveTripPlans(updatedPlans);
    setIsCreatingNew(false);
    setNewPlanName('');
  }, [newPlanName, tripPlans, saveTripPlans]);

  // Delete trip plan
  const handleDeletePlan = useCallback(
    (planId: string) => {
      const updatedPlans = tripPlans.filter((plan) => plan.id !== planId);
      saveTripPlans(updatedPlans);
    },
    [tripPlans, saveTripPlans],
  );

  // Open trip for editing
  const handleOpenTrip = useCallback(
    (planId: string) => {
      router.push(`/trip-planner/${planId}`);
    },
    [router],
  );

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen p-16">
        {/* Header */}
        <div className="flex flex-col gap-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsCreatingNew(true)}
              className="button-create text-md flex items-center gap-2"
            >
              Create New Trip
            </button>
          </div>

          {tripPlans.length === 0 ? (
            <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
              Create your first trip to start planning adventures.
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-y-8 gap-x-8">
              {tripPlans.map((plan) => (
                <li key={plan.id} className="product-list flex flex-col basis-full">
                  <div className="flex flex-col gap-y-4">
                    <div className="relative">
                      <div className="flex flex-col gap-y-1 p-2 absolute top-0 right-0">
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="button-trans"
                          title="Delete trip"
                        >
                          <div className="flex items-center justify-center gap-x-1 w-full text-lg">
                            <Icon name="delete" width={24} height={24} />
                          </div>
                        </button>
                      </div>
                      <div
                        className="h-full w-full aspect-video flex items-center justify-center placeholder_image cursor-pointer bg-white/5 border border-white/10 rounded-md"
                        onClick={() => handleOpenTrip(plan.id)}
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
                        onClick={() => handleOpenTrip(plan.id)}
                      >
                        {plan.name}
                      </h2>

                      <ul className="flex flex-wrap gap-x-1 gap-y-1 pt-2">
                        <li className="gap-x-3">
                          <p className="tag w-fit items-center gap-x-1 text-lg flex flex-wrap">
                            <Icon name="category" width={16} height={16} />
                            {plan.campingSpots.length} spots
                          </p>
                        </li>
                        <li className="gap-x-3">
                          <p className="tag w-fit items-center gap-x-1 text-lg flex flex-wrap">
                            <Icon name="tree" width={16} height={16} />
                            {plan.routes.length} routes
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
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
            <div className="bg-background border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
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
                  />
                </label>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreatePlan}
                    disabled={!newPlanName.trim()}
                    className="button-primary flex-1"
                  >
                    Create Trip
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewPlanName('');
                    }}
                    className="button-secondary flex-1"
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
