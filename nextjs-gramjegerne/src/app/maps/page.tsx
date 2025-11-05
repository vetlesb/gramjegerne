'use client';
import {useState, useCallback, useEffect, Suspense} from 'react';
import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {DeleteTripButton} from '@/components/deleteTripButton';
import {EditTripDialog} from '@/components/EditTripDialog';
import {AddTripDialog} from '@/components/AddTripDialog';
import {Icon} from '@/components/Icon';
import {useRouter} from 'next/navigation';
import {TripListItem, SharedTripReference} from '@/types';
import {useSession} from 'next-auth/react';
import {client} from '@/sanity/client';
import {groq} from 'next-sanity';
import {toast} from 'sonner';
import dynamicImport from 'next/dynamic';

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
  const [tripPlans, setTripPlans] = useState<TripListItem[]>([]);
  const [sharedTrips, setSharedTrips] = useState<SharedTripReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTrip, setEditingTrip] = useState<TripListItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'my' | 'shared'>('my');
  const [duplicatingTripId, setDuplicatingTripId] = useState<string | null>(null);
  const [isDockVisible, setIsDockVisible] = useState(false);

  // Fetch user's own trips
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

  // Load trip plans on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchTrips();
      await fetchSharedTrips();
      setIsLoading(false);
    };

    loadData();
  }, [fetchTrips, fetchSharedTrips]);

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
  }, [fetchTrips]);

  if (isLoading && tripPlans.length === 0 && sharedTrips.length === 0) {
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
            campingSpots={[]}
            routes={[]}
            onSpotClick={() => {}}
            onMapClick={() => {}}
            onRouteClick={() => {}}
            isAddingSpot={false}
            isDrawingRoute={false}
            isReadOnly={true}
            showRoutes={false}
            showCampSpots={false}
            showFishingSpots={false}
            showViewpointSpots={false}
            showCompass={false}
            isDockVisible={isDockVisible}
            onToggleDock={() => setIsDockVisible(!isDockVisible)}
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
                tripPlans.map((plan) => (
                  <div
                    key={plan._id}
                    onClick={() => router.push(`/maps/${plan._id}`)}
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
                ))}

              {/* Shared Maps */}
              {selectedFilter === 'shared' &&
                sharedTrips.map((sharedTrip, index) => (
                  <div
                    key={sharedTrip._key || `shared_${sharedTrip.trip._id}_${index}`}
                    onClick={() => {
                      if (sharedTrip.trip.shareId) {
                        router.push(`/share/map/${sharedTrip.trip.shareId}`);
                      } else {
                        router.push(`/maps/${sharedTrip.trip._id}?shared=true`);
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
