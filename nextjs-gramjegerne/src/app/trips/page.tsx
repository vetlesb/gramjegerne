'use client';

import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {client} from '@/sanity/client';
import {TripOverviewItem, TripCategory, SharedTripReference} from '@/types';
import {useSession} from 'next-auth/react';
import {groq} from 'next-sanity';
import {useCallback, useEffect, useState, useMemo, useRef, Suspense} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {useDelayedLoader} from '@/hooks/useDelayedLoader';
import {AddTripDialog} from '@/components/AddTripDialog';
import {ManageTripCategoriesDialog} from '@/components/ManageTripCategoriesDialog';
import {TripCard} from '@/components/TripCard/TripCard';
import {CategoryFilter} from '@/components/CategoryFilter';
import {CategoryCombobox} from '@/components/CategoryCombobox';
import {ActionBar} from '@/components/ActionBar';
import {Tag} from '@/components/Tag';
import {urlFor} from '@/sanity/images';
import Image from 'next/image';
import imageUrlBuilder from '@sanity/image-url';
import {SanityImageSource} from '@sanity/image-url/lib/types/types';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {useLanguage} from '@/i18n/LanguageProvider';

const builder = imageUrlBuilder(client);
function urlForSource(source: SanityImageSource) {
  return builder.image(source);
}

// Unified item for the trip list (owned or shared)
interface MainMapRoute {
  waypoints?: Array<{lat: number; lng: number}>;
  elevationGain?: number;
}

function calculateTotalDistance(routes?: MainMapRoute[]): number {
  if (!routes) return 0;
  let total = 0;
  for (const route of routes) {
    if (!route.waypoints || route.waypoints.length < 2) continue;
    for (let i = 1; i < route.waypoints.length; i++) {
      const prev = route.waypoints[i - 1];
      const curr = route.waypoints[i];
      const R = 6371;
      const dLat = ((curr.lat - prev.lat) * Math.PI) / 180;
      const dLng = ((curr.lng - prev.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((prev.lat * Math.PI) / 180) *
          Math.cos((curr.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
  }
  return total;
}

function calculateTotalElevation(routes?: MainMapRoute[]): number {
  if (!routes) return 0;
  return routes.reduce(
    (total, route) => total + (route.elevationGain && route.elevationGain > 0 ? route.elevationGain : 0),
    0,
  );
}

interface TripListEntry {
  id: string;
  tripId: string;
  name: string;
  slug: string;
  image?: {_ref: string};
  startDate?: string;
  endDate?: string;
  category?: {_id: string; title: string};
  participantCount?: number;
  distance?: number;
  elevation?: number;
  ownerName?: string;
  isShared: boolean;
  _createdAt?: string;
  // For edit/delete on owned trips
  originalTrip?: TripOverviewItem;
  // For remove on shared trips
  sharedTripId?: string;
}

interface SharedTripInfo {
  _id: string;
  name: string;
  slug: {current: string};
  description?: string;
  image?: SanityImageSource;
  startDate?: string;
  endDate?: string;
  category?: {_id: string; title: string};
  owner: {_id: string; name: string};
}

function TripsPageContent() {
  const {t} = useLanguage();
  const {data: session} = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [trips, setTrips] = useState<TripOverviewItem[]>([]);
  const [sharedTrips, setSharedTrips] = useState<SharedTripReference[]>([]);
  const [tripCategories, setTripCategories] = useState<TripCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showLoader = useDelayedLoader(isLoading, 300);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tripsViewMode');
      if (stored === 'list' || stored === 'grid') return stored;
    }
    return 'list';
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory) return urlCategory;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tripsLastCategory') || null;
    }
    return null;
  });
  const isUpdatingURL = useRef(false);

  const [showEditDialog, setShowEditDialog] = useState<TripOverviewItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit shared trip category state
  const [editSharedTrip, setEditSharedTrip] = useState<{tripId: string; name: string; categoryId: string} | null>(null);
  const [editSharedCategory, setEditSharedCategory] = useState('');
  const [isSavingSharedCategory, setIsSavingSharedCategory] = useState(false);

  // Share modal state
  const shareId = searchParams.get('share');
  const [sharedTripInfo, setSharedTripInfo] = useState<SharedTripInfo | null>(null);
  const [shareCategory, setShareCategory] = useState('');
  const [isSavingShared, setIsSavingShared] = useState(false);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);

  const fetchTrips = useCallback(async () => {
    if (!session?.user?.id) return;

    const query = groq`*[_type == "trip" && user._ref == $userId] | order(startDate desc) {
      _id,
      name,
      slug,
      description,
      image,
      startDate,
      endDate,
      shareId,
      isShared,
      "category": category->{_id, title},
      "participantCount": count(*[_type == "user" && ^._id in sharedTrips[].trip._ref]) + 1,
      "mainMapRoutes": mainMap->{routes[]{waypoints, elevationGain}}.routes,
      _createdAt,
      _updatedAt
    }`;

    const data = await client.fetch(query, {userId: session.user.id});
    setTrips(data);
  }, [session?.user?.id]);

  const fetchSharedTrips = useCallback(async () => {
    if (!session?.user?.id) return;

    const rawGoogleId = session.user.id.replace('google_', '');

    const query = groq`*[_type == "user" && googleId == $googleId][0] {
      sharedTrips[] {
        _key,
        addedAt,
        "category": category->{_id, title},
        "trip": trip->{
          _id,
          name,
          slug,
          shareId,
          image,
          startDate,
          endDate,
          "user": user->{
            _id,
            name,
            email
          },
          "participantCount": count(*[_type == "user" && ^._id in sharedTrips[].trip._ref]) + 1,
          "mainMapRoutes": mainMap->{routes[]{waypoints, elevationGain}}.routes
        }
      }
    }`;

    const user = await client.fetch(query, {googleId: rawGoogleId});
    setSharedTrips(user?.sharedTrips || []);
  }, [session?.user?.id]);

  const fetchCategories = useCallback(async () => {
    if (!session?.user?.id) return;

    const query = groq`*[_type == "tripCategory" && user._ref == $userId] | order(title asc) {
      _id,
      title,
      slug
    }`;

    const data = await client.fetch(query, {userId: session.user.id});
    setTripCategories(data);
  }, [session?.user?.id]);

  // Fetch shared trip info when share param is present
  useEffect(() => {
    if (!shareId) {
      setSharedTripInfo(null);
      return;
    }

    const fetchSharedTripInfo = async () => {
      const query = groq`*[_type == "trip" && shareId == $shareId && isShared == true][0] {
        _id, name, slug, description, image, startDate, endDate,
        "category": category->{_id, title},
        "owner": user->{_id, name}
      }`;
      const data = await client.fetch(query, {shareId});
      setSharedTripInfo(data);

      // Check if already saved
      if (data && session?.user?.id) {
        const rawGoogleId = session.user.id.replace('google_', '');
        const user = await client.fetch(
          groq`*[_type == "user" && googleId == $googleId][0]{
            sharedTrips[]{trip{_ref}}
          }`,
          {googleId: rawGoogleId},
        );
        const saved = user?.sharedTrips?.some(
          (s: {trip: {_ref: string}}) => s.trip._ref === data._id,
        );
        setIsAlreadySaved(!!saved);
      }
    };

    fetchSharedTripInfo();
  }, [shareId, session?.user?.id]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTrips(), fetchSharedTrips(), fetchCategories()]);
      setIsLoading(false);
    };

    loadData();

    if (!session?.user?.id) return;

    const query = groq`*[_type == "trip" && user._ref == $userId]`;
    const subscription = client.listen(query, {userId: session.user.id}).subscribe({
      next: () => {
        fetchTrips();
        fetchCategories();
      },
      error: (error) => {
        console.error('Subscription error:', error);
      },
    });

    return () => subscription.unsubscribe();
  }, [session?.user?.id, fetchTrips, fetchSharedTrips, fetchCategories]);

  // Sync URL state (ignore share param for category)
  useEffect(() => {
    if (isUpdatingURL.current) {
      isUpdatingURL.current = false;
      return;
    }

    const urlCategory = searchParams.get('category');
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
      if (urlCategory) {
        localStorage.setItem('tripsLastCategory', urlCategory);
      } else {
        localStorage.removeItem('tripsLastCategory');
      }
    }
  }, [searchParams, selectedCategory]);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    isUpdatingURL.current = true;

    const newSearchParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newSearchParams.set('category', categoryId);
      localStorage.setItem('tripsLastCategory', categoryId);
    } else {
      newSearchParams.delete('category');
      localStorage.removeItem('tripsLastCategory');
    }
    // Preserve share param if present
    newSearchParams.delete('share');
    router.push(newSearchParams.toString() ? `/trips?${newSearchParams.toString()}` : '/trips');
  };

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('tripsViewMode', mode);
  };

  const handleRemoveSharedTrip = async (tripId: string) => {
    try {
      const response = await fetch('/api/removeSharedTrip', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({tripId}),
      });

      if (!response.ok) throw new Error('Failed to remove shared trip');

      await fetchSharedTrips();
    } catch (error) {
      console.error('Error removing shared trip:', error);
    }
  };

  const handleDeleteTrip = async () => {
    if (!showDeleteDialog) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/deleteTrip?tripId=${encodeURIComponent(showDeleteDialog)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Delete failed:', data);
        throw new Error(data.error || 'Failed to delete trip');
      }

      await fetchTrips();
      await fetchSharedTrips();
      setShowDeleteDialog(null);
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete trip');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveSharedTrip = async () => {
    if (!sharedTripInfo) return;
    setIsSavingShared(true);
    try {
      const response = await fetch('/api/addSharedTrip', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          tripId: sharedTripInfo._id,
          categoryId: shareCategory || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to save trip');

      await fetchSharedTrips();
      await fetchCategories();
      setSharedTripInfo(null);
      setShareCategory('');
      router.replace('/trips');
    } catch (error) {
      console.error('Error saving shared trip:', error);
    } finally {
      setIsSavingShared(false);
    }
  };

  const handleCreateCategory = async (title: string) => {
    try {
      const response = await fetch('/api/tripCategories', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title}),
      });

      if (!response.ok) throw new Error('Failed to create category');

      const newCategory = await response.json();
      setTripCategories((prev) =>
        [...prev, newCategory].sort((a, b) => a.title.localeCompare(b.title, 'nb')),
      );
      setShareCategory(newCategory._id);
    } catch (error) {
      console.error('Error creating trip category:', error);
    }
  };

  const handleSaveSharedCategory = async () => {
    if (!editSharedTrip) return;
    setIsSavingSharedCategory(true);
    try {
      const response = await fetch('/api/updateSharedTripCategory', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          tripId: editSharedTrip.tripId,
          categoryId: editSharedCategory || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update category');

      await fetchSharedTrips();
      setEditSharedTrip(null);
      setEditSharedCategory('');
    } catch (error) {
      console.error('Error updating shared trip category:', error);
    } finally {
      setIsSavingSharedCategory(false);
    }
  };

  // Merge owned and shared trips into a unified list
  const allTrips = useMemo((): TripListEntry[] => {
    const owned: TripListEntry[] = trips.map((trip) => ({
      id: trip._id,
      tripId: trip._id,
      name: trip.name,
      slug: trip.slug?.current || trip._id,
      image: trip.image?.asset,
      startDate: trip.startDate,
      endDate: trip.endDate,
      category: trip.category,
      participantCount: trip.participantCount,
      distance: calculateTotalDistance(trip.mainMapRoutes),
      elevation: calculateTotalElevation(trip.mainMapRoutes),
      isShared: false,
      _createdAt: trip._createdAt,
      originalTrip: trip,
    }));

    const shared: TripListEntry[] = sharedTrips
      .filter((st) => st.trip) // safety check
      .map((st) => ({
        id: `shared_${st.trip._id}`,
        tripId: st.trip._id,
        name: st.trip.name,
        slug: st.trip.slug?.current || st.trip._id,
        image: st.trip.image?.asset,
        startDate: st.trip.startDate,
        endDate: st.trip.endDate,
        category: st.category,
        participantCount: st.trip.participantCount,
        distance: calculateTotalDistance(st.trip.mainMapRoutes),
        elevation: calculateTotalElevation(st.trip.mainMapRoutes),
        ownerName: st.trip.user?.name,
        isShared: true,
        sharedTripId: st.trip._id,
      }));

    return [...owned, ...shared];
  }, [trips, sharedTrips]);

  const filteredTrips = useMemo(() => {
    if (!selectedCategory) return allTrips;
    return allTrips.filter((trip) => trip.category?._id === selectedCategory);
  }, [allTrips, selectedCategory]);

  // Only show categories that have at least one trip
  const filterCategories = useMemo(() => {
    const usedCategoryIds = new Set(
      allTrips.map((trip) => trip.category?._id).filter(Boolean),
    );
    return tripCategories
      .filter((c) => usedCategoryIds.has(c._id))
      .map((c) => ({_id: c._id, title: c.title}));
  }, [tripCategories, allTrips]);

  // Format date range for the share modal
  const formatDateRange = (start?: string, end?: string): string | null => {
    if (!start && !end) return null;
    const opts: Intl.DateTimeFormatOptions = {day: 'numeric', month: 'long', year: 'numeric'};
    const s = start ? new Date(start).toLocaleDateString('nb-NO', opts) : '';
    const e = end ? new Date(end).toLocaleDateString('nb-NO', opts) : '';
    if (s && e) return `${s} - ${e}`;
    return s || e;
  };

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen p-16">
        <div className="flex flex-col gap-y-2">
          <ActionBar
            mode="trips-overview"
            onAddTrip={() => setIsAddDialogOpen(true)}
            onManageCategories={() => setIsManageCategoriesOpen(true)}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />

          {showLoader ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : isLoading ? null : allTrips.length === 0 && !shareId ? (
            <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
              {t.trips.createTripToStart}
            </div>
          ) : (
            <>
              {filterCategories.length > 0 && (
                <CategoryFilter
                  categories={filterCategories}
                  selectedCategory={selectedCategory}
                  onCategorySelect={handleCategoryChange}
                />
              )}

              <ul
                className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-y-2'
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-y-4 gap-x-4'
                }
              >
                {filteredTrips.map((entry) => (
                  <TripCard
                    key={entry.id}
                    mode="owned"
                    isSharedTrip={entry.isShared}
                    viewMode={viewMode}
                    tripId={entry.tripId}
                    name={entry.name}
                    slug={entry.slug}
                    image={entry.image}
                    startDate={entry.startDate}
                    endDate={entry.endDate}
                    participantCount={entry.participantCount}
                    distance={entry.distance}
                    elevation={entry.elevation}
                    ownerName={entry.ownerName}
                    onEdit={
                      entry.originalTrip
                        ? () => setShowEditDialog(entry.originalTrip!)
                        : entry.isShared
                          ? () => {
                              setEditSharedTrip({
                                tripId: entry.tripId,
                                name: entry.name,
                                categoryId: entry.category?._id || '',
                              });
                              setEditSharedCategory(entry.category?._id || '');
                            }
                          : undefined
                    }
                    onDelete={
                      entry.originalTrip
                        ? () => setShowDeleteDialog(entry.tripId)
                        : entry.isShared
                          ? () => handleRemoveSharedTrip(entry.tripId)
                          : undefined
                    }
                    imageUrlBuilder={(asset) => urlFor(asset)}
                  />
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Add Trip Dialog */}
        <AddTripDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={async () => {
            await fetchTrips();
            await fetchCategories();
          }}
        />

        {/* Manage Trip Categories Dialog */}
        <ManageTripCategoriesDialog
          open={isManageCategoriesOpen}
          onOpenChange={setIsManageCategoriesOpen}
          categories={tripCategories}
          onChange={async () => {
            await fetchCategories();
            await fetchTrips();
            await fetchSharedTrips();
          }}
        />

        {/* Edit Trip Dialog */}
        {showEditDialog && (
          <AddTripDialog
            open={!!showEditDialog}
            onOpenChange={(open) => !open && setShowEditDialog(null)}
            onSuccess={async () => {
              await fetchTrips();
              setShowEditDialog(null);
            }}
            editTrip={showEditDialog}
          />
        )}

        {/* Edit Shared Trip Category Dialog */}
        <Dialog
          open={!!editSharedTrip}
          onOpenChange={(open) => {
            if (!open) {
              setEditSharedTrip(null);
              setEditSharedCategory('');
            }
          }}
        >
          <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-2xl text-accent font-normal pb-4">
                {t.trips.editTrip}
              </DialogTitle>
            </DialogHeader>

            {editSharedTrip && (
              <>
                <p className="text-lg mb-4">{editSharedTrip.name}</p>

                <div className="mb-6">
                  <CategoryCombobox
                    categories={tripCategories}
                    selectedCategory={editSharedCategory}
                    onSelect={setEditSharedCategory}
                    onCreateNew={handleCreateCategory}
                    label={t.labels.category}
                  />
                </div>

                <DialogFooter className="flex gap-y-4 gap-x-2">
                  <button
                    onClick={handleSaveSharedCategory}
                    className="button-primary-accent"
                    disabled={isSavingSharedCategory}
                  >
                    {isSavingSharedCategory ? t.actions.saving : t.actions.save}
                  </button>
                  <button
                    onClick={() => {
                      setEditSharedTrip(null);
                      setEditSharedCategory('');
                    }}
                    className="button-secondary"
                  >
                    {t.actions.cancel}
                  </button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          open={!!showDeleteDialog}
          onOpenChange={(open) => {
            if (!open) setShowDeleteDialog(null);
          }}
        >
          <DialogContent className="dialog p-4 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-accent font-normal">
                {t.trips.deleteTrip}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <span className="text-xl p-4 bg-dimmed-hover rounded-md">
                {trips.find((t) => t._id === showDeleteDialog)?.name || ''}
              </span>
            </div>
            <DialogFooter>
              <button
                onClick={handleDeleteTrip}
                className="button-primary-accent"
                disabled={isDeleting}
              >
                {isDeleting ? t.actions.deleting : t.actions.delete}
              </button>
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="button-secondary"
              >
                {t.actions.cancel}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Trip Modal */}
        <Dialog
          open={!!sharedTripInfo}
          onOpenChange={(open) => {
            if (!open) {
              setSharedTripInfo(null);
              setShareCategory('');
              router.replace('/trips');
            }
          }}
        >
          <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            {sharedTripInfo && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl text-accent font-normal pb-4">
                    {t.trips.saveTrip}
                  </DialogTitle>
                </DialogHeader>

                {sharedTripInfo.image && (
                  <div className="w-full aspect-video overflow-hidden rounded-xl mb-4">
                    <Image
                      src={urlForSource(sharedTripInfo.image).url()}
                      alt={sharedTripInfo.name}
                      width={600}
                      height={340}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-y-2 mb-6">
                  <h3 className="text-2xl text-accent">{sharedTripInfo.name}</h3>
                  {sharedTripInfo.description && (
                    <p className="text-lg text-white/70">{sharedTripInfo.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {formatDateRange(sharedTripInfo.startDate, sharedTripInfo.endDate) && (
                      <Tag iconName="calendar">
                        {formatDateRange(sharedTripInfo.startDate, sharedTripInfo.endDate)}
                      </Tag>
                    )}
                    {sharedTripInfo.owner && (
                      <Tag iconName="user">by {sharedTripInfo.owner.name}</Tag>
                    )}
                  </div>
                </div>

                {!isAlreadySaved && (
                  <div className="mb-6">
                    <CategoryCombobox
                      categories={tripCategories}
                      selectedCategory={shareCategory}
                      onSelect={setShareCategory}
                      onCreateNew={handleCreateCategory}
                      label="Choose a category"
                    />
                  </div>
                )}

                <DialogFooter className="flex gap-y-4 gap-x-2">
                  {isAlreadySaved ? (
                    <button
                      onClick={() => {
                        router.replace(`/trips/${sharedTripInfo.slug.current}?shared=true`);
                      }}
                      className="button-primary-accent"
                    >
                      {t.trips.savedToMyTrips}
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveSharedTrip}
                      className="button-primary-accent"
                      disabled={isSavingShared}
                    >
                      {isSavingShared ? t.actions.saving : t.trips.saveToMyTrips}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSharedTripInfo(null);
                      setShareCategory('');
                      router.replace('/trips');
                    }}
                    className="button-secondary"
                  >
                    {t.actions.cancel}
                  </button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </ProtectedRoute>
  );
}

export default function Page() {
  return (
    <Suspense>
      <TripsPageContent />
    </Suspense>
  );
}
