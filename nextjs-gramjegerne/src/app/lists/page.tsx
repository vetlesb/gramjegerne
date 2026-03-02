'use client';

import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {client} from '@/sanity/client';
import {ListDocument, SharedListReference} from '@/types';
import {useSession} from 'next-auth/react';
import {groq} from 'next-sanity';
import {useCallback, useEffect, useState, useMemo, useRef, Suspense} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {useDelayedLoader} from '@/hooks/useDelayedLoader';
import {AddListDialog} from '../../components/addListDialog';
import {ListCard} from '@/components/ListCard';
import {CategoryFilter} from '@/components/CategoryFilter';
import {ActionBar} from '@/components/ActionBar';
import {DeleteListButton} from '../../components/deleteListButton';
import {urlFor} from '@/sanity/images';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type FilterType = 'planned' | 'completed' | 'shared' | null;
const VALID_FILTERS = ['planned', 'completed', 'shared'] as const;

function isValidFilter(value: string | null): value is 'planned' | 'completed' | 'shared' {
  return value !== null && VALID_FILTERS.includes(value as (typeof VALID_FILTERS)[number]);
}

function ListsPageContent() {
  const {data: session} = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [lists, setLists] = useState<ListDocument[]>([]);
  const [sharedLists, setSharedLists] = useState<SharedListReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showLoader = useDelayedLoader(isLoading, 300);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('listsViewMode');
      if (stored === 'list' || stored === 'grid') return stored;
    }
    return 'list'; // Default to list view
  });
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(() => {
    const urlFilter = searchParams.get('filter');
    if (isValidFilter(urlFilter)) return urlFilter;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('listsLastFilter');
      if (isValidFilter(stored)) return stored;
    }
    return null;
  });
  const isUpdatingURL = useRef(false);

  const fetchLists = useCallback(async () => {
    if (!session?.user?.id) return;

    const query = groq`*[_type == "list" && user._ref == $userId] | order(completed asc, _updatedAt desc, _createdAt desc) {
      _id,
      name,
      slug,
      image,
      days,
      participants,
      completed,
      _updatedAt,
      _createdAt,
      "connectedTrip": connectedTrip->{
        _id,
        name,
        slug
      },
      "items": items[] {
        _key,
        quantity,
        "item": item->{
          _id,
          name,
          weight,
          calories
        }
      }
    }`;

    const data = await client.fetch(query, {userId: session.user.id});
    setLists(data);
  }, [session?.user?.id]);

  const fetchSharedLists = useCallback(async () => {
    if (!session?.user?.id) return;

    // Extract the raw Google ID from session (remove "google_" prefix)
    const rawGoogleId = session.user.id.replace('google_', '');

    const query = groq`*[_type == "user" && googleId == $googleId][0] {
      sharedLists[] {
        _key,
        addedAt,
        "list": list->{
          _id,
          name,
          slug,
          image,
          "user": user->{
            _id,
            name,
            email
          }
        }
      }
    }`;

    const user = await client.fetch(query, {googleId: rawGoogleId});
    setSharedLists(user?.sharedLists || []);
  }, [session?.user?.id]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchLists(), fetchSharedLists()]);
      setIsLoading(false);
    };

    loadData();

    // Subscribe to real-time updates
    if (!session?.user?.id) return;

    const query = groq`*[_type == "list" && user._ref == $userId] | order(completed asc, _updatedAt desc, _createdAt desc)`;
    const subscription = client.listen(query, {userId: session.user.id}).subscribe({
      next: fetchLists,
      error: (error) => {
        console.error('Subscription error:', error);
      },
    });

    return () => subscription.unsubscribe();
  }, [session?.user?.id, fetchLists, fetchSharedLists]);

  // Sync URL state with component state (only when URL changes externally)
  useEffect(() => {
    if (isUpdatingURL.current) {
      isUpdatingURL.current = false;
      return;
    }

    const urlFilter = searchParams.get('filter');
    if (isValidFilter(urlFilter)) {
      if (urlFilter !== selectedFilter) {
        setSelectedFilter(urlFilter);
        localStorage.setItem('listsLastFilter', urlFilter);
      }
    } else if (selectedFilter !== null) {
      setSelectedFilter(null);
      localStorage.removeItem('listsLastFilter');
    }
  }, [searchParams, selectedFilter]);

  const handleFilterChange = (filter: FilterType) => {
    setSelectedFilter(filter);
    isUpdatingURL.current = true;

    const newSearchParams = new URLSearchParams(searchParams);
    if (filter) {
      newSearchParams.set('filter', filter);
      localStorage.setItem('listsLastFilter', filter);
    } else {
      newSearchParams.delete('filter');
      localStorage.removeItem('listsLastFilter');
    }
    router.push(newSearchParams.toString() ? `?${newSearchParams.toString()}` : '/lists');
  };

  const [showEditDialog, setShowEditDialog] = useState<ListDocument | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState<ListDocument | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('listsViewMode', mode);
  };

  const handleRemoveSharedList = async (listId: string) => {
    try {
      const response = await fetch('/api/removeSharedList', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({listId}),
      });

      if (!response.ok) {
        throw new Error('Failed to remove shared list');
      }

      await fetchSharedLists();
    } catch (error) {
      console.error('Error removing shared list:', error);
      alert('Failed to remove shared list. Please try again.');
    }
  };

  const filteredLists = useMemo(() => {
    let filtered: ListDocument[];
    if (selectedFilter === 'planned') {
      filtered = lists.filter((list) => !list.completed);
    } else if (selectedFilter === 'completed') {
      filtered = lists.filter((list) => list.completed);
    } else {
      filtered = [...lists];
    }

    // Always sort: planned first, then by update time (most recent first)
    return filtered.sort((a, b) => {
      // First, sort by completion status (planned before completed)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Then sort by update time (most recent first)
      const aTime = new Date(a._updatedAt || a._createdAt).getTime();
      const bTime = new Date(b._updatedAt || b._createdAt).getTime();
      return bTime - aTime;
    });
  }, [lists, selectedFilter]);

  const handleDuplicate = async (list: ListDocument) => {
    const name = `${list.name} (kopi)`;
    setDuplicateName(name);
    setShowDuplicateDialog(list);
  };

  const confirmDuplicate = async () => {
    if (!showDuplicateDialog || !duplicateName.trim()) return;

    try {
      setIsDuplicating(true);
      const response = await fetch('/api/duplicateList', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listId: showDuplicateDialog._id,
          name: duplicateName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate list');
      }

      setShowDuplicateDialog(null);
      setDuplicateName('');
      await fetchLists();
    } catch (error) {
      console.error('Error duplicating list:', error);
      alert('Failed to duplicate list. Please try again.');
    } finally {
      setIsDuplicating(false);
    }
  };

  // Create filter data (CategoryFilter will add "All" button automatically)
  const filterCategories = useMemo(
    () => [
      {_id: 'planned', title: 'Planned'},
      {_id: 'completed', title: 'Completed'},
      {_id: 'shared', title: 'Shared'},
    ],
    [],
  );

  const selectedCategoryId = selectedFilter;

  const handleCategoryChange = (categoryId: string | null) => {
    const filter = categoryId as FilterType;
    handleFilterChange(filter);
  };

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen p-16">
        <div className="flex flex-col gap-y-4">
          <ActionBar
            mode="lists-overview"
            onAddList={() => setIsAddDialogOpen(true)}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />

          {showLoader ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : isLoading ? null : lists.length === 0 && sharedLists.length === 0 ? (
            <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
              Create a list to hunt the lightest backpack for next trip.
            </div>
          ) : (
            <>
              <CategoryFilter
                categories={filterCategories}
                selectedCategory={selectedCategoryId}
                onCategorySelect={handleCategoryChange}
              />

              <ul
                className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-y-2'
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-y-4 gap-x-4'
                }
              >
                {selectedFilter === 'shared'
                  ? sharedLists.map((sharedList, index) => (
                      <ListCard
                        key={sharedList._key || `shared_${sharedList.list._id}_${index}`}
                        mode="shared"
                        viewMode={viewMode}
                        listId={sharedList.list._id}
                        name={sharedList.list.name}
                        slug={sharedList.list.slug.current}
                        image={sharedList.list.image?.asset}
                        ownerName={sharedList.list.user.name}
                        onRemove={() => handleRemoveSharedList(sharedList.list._id)}
                        imageUrlBuilder={(asset) => urlFor(asset)}
                      />
                    ))
                  : filteredLists.map((list) => (
                      <ListCard
                        key={list._id}
                        mode="owned"
                        viewMode={viewMode}
                        listId={list._id}
                        name={list.name}
                        slug={list.slug.current}
                        image={list.image?.asset}
                        completed={list.completed}
                        participants={list.participants}
                        days={list.days}
                        items={list.items}
                        onEdit={() => setShowEditDialog(list)}
                        onDuplicate={() => handleDuplicate(list)}
                        onDelete={() => setShowDeleteDialog(list._id)}
                        imageUrlBuilder={(asset) => urlFor(asset)}
                      />
                    ))}
              </ul>
            </>
          )}
        </div>

        {/* Add List Dialog - controlled by ActionBar button */}
        <AddListDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={fetchLists}
        />

        {/* Edit List Dialog */}
        {showEditDialog && (
          <AddListDialog
            open={!!showEditDialog}
            onOpenChange={(open) => !open && setShowEditDialog(null)}
            onSuccess={async () => {
              await fetchLists();
              setShowEditDialog(null);
            }}
            editList={showEditDialog}
          />
        )}

        {/* Duplicate Dialog */}
        <Dialog
          open={!!showDuplicateDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowDuplicateDialog(null);
              setDuplicateName('');
            }
          }}
        >
          <DialogContent className="dialog p-4 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-accent font-normal">Duplicate list</DialogTitle>
            </DialogHeader>

            <div className="py-4 flex flex-col gap-y-4">
              <label className="flex flex-col gap-y-2 text-lg">
                Title
                <input
                  className="w-full max-w-full p-4"
                  type="text"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  placeholder={`${showDuplicateDialog?.name || ''} (kopi)`}
                  required
                  autoFocus
                />
              </label>
            </div>

            <DialogFooter>
              <button
                onClick={confirmDuplicate}
                className="button-primary-accent"
                disabled={isDuplicating || !duplicateName.trim()}
              >
                {isDuplicating ? 'Duplicating...' : 'Duplicate'}
              </button>
              <button
                onClick={() => {
                  setShowDuplicateDialog(null);
                  setDuplicateName('');
                }}
                className="button-secondary"
              >
                Cancel
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog - DeleteListButton with controlled dialog */}
        {showDeleteDialog && (
          <DeleteListButton
            listId={showDeleteDialog}
            listName={lists.find((l) => l._id === showDeleteDialog)?.name || ''}
            redirectTo="/lists"
            open={!!showDeleteDialog}
            onOpenChange={(open) => {
              if (!open) setShowDeleteDialog(null);
            }}
            showButton={false}
            onSuccess={async () => {
              await fetchLists();
              setShowDeleteDialog(null);
            }}
          />
        )}
      </main>
    </ProtectedRoute>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListsPageContent />
    </Suspense>
  );
}
