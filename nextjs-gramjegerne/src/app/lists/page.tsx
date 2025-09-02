'use client';

import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {client} from '@/sanity/client';
import {ListDocument, SharedListReference} from '@/types';
import {useSession} from 'next-auth/react';
import {groq} from 'next-sanity';
import {useCallback, useEffect, useState, useMemo, useRef, Suspense} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {AddListDialog} from '../../components/addListDialog';
import {ListItem} from '../../components/ListItem';
import {SharedListItem} from '../../components/SharedListItem';

function ListsPageContent() {
  const {data: session} = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [lists, setLists] = useState<ListDocument[]>([]);
  const [sharedLists, setSharedLists] = useState<SharedListReference[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'planned' | 'completed' | 'shared' | null>(
    () => {
      // Initialize from URL or localStorage fallback
      const urlFilter = searchParams.get('filter');
      if (urlFilter) {
        // Validate the filter value
        if (['planned', 'completed', 'shared'].includes(urlFilter)) {
          return urlFilter as 'planned' | 'completed' | 'shared';
        }
      }

      // Fallback to localStorage if no URL param
      if (typeof window !== 'undefined') {
        return (
          (localStorage.getItem('listsLastFilter') as 'planned' | 'completed' | 'shared' | null) ||
          null
        );
      }
      return null;
    },
  );
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
    console.log(
      'Fetched lists with sorting:',
      data.map((list: ListDocument) => ({
        name: list.name,
        completed: list.completed,
        updatedAt: list._updatedAt,
        createdAt: list._createdAt,
      })),
    );
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
    fetchLists();
    fetchSharedLists();

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
    // Skip if we're making our own URL update
    if (isUpdatingURL.current) {
      isUpdatingURL.current = false;
      return;
    }

    const urlFilter = searchParams.get('filter');

    if (urlFilter) {
      // Validate the filter value
      if (['planned', 'completed', 'shared'].includes(urlFilter)) {
        const newFilter = urlFilter as 'planned' | 'completed' | 'shared';
        if (newFilter !== selectedFilter) {
          setSelectedFilter(newFilter);
          // Update localStorage fallback
          localStorage.setItem('listsLastFilter', newFilter);
        }
      }
    } else if (selectedFilter !== null) {
      // URL has no filter, clear selection
      setSelectedFilter(null);
      localStorage.removeItem('listsLastFilter');
    }
  }, [searchParams, selectedFilter]);

  const handleFilterChange = (filter: 'planned' | 'completed' | 'shared' | null) => {
    setSelectedFilter(filter);

    // Mark that we're updating the URL ourselves
    isUpdatingURL.current = true;

    if (filter) {
      // Update URL with filter parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('filter', filter);
      router.push(`?${newSearchParams.toString()}`);

      // Save to localStorage as fallback
      localStorage.setItem('listsLastFilter', filter);
    } else {
      // Remove filter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('filter');
      router.push(newSearchParams.toString() ? `?${newSearchParams.toString()}` : '/lists');

      // Remove from localStorage
      localStorage.removeItem('listsLastFilter');
    }
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

  // Filter lists based on selection
  const filteredLists = useMemo(() => {
    let result = lists;

    // Apply client-side sorting as backup to ensure proper order
    result = [...result].sort((a, b) => {
      // First priority: planned (completed = false) before completed (completed = true)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // Second priority: most recently updated first
      const aDate = a._updatedAt || a._createdAt;
      const bDate = b._updatedAt || b._createdAt;

      if (aDate && bDate) {
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      }

      return 0;
    });

    // Apply filters
    if (selectedFilter === 'planned') {
      return result.filter((list) => !list.completed);
    }
    if (selectedFilter === 'completed') {
      return result.filter((list) => list.completed);
    }
    return result;
  }, [lists, selectedFilter]);

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen p-16">
        <div className="flex flex-col gap-y-4">
          <AddListDialog onSuccess={fetchLists} />

          {lists.length === 0 && sharedLists.length === 0 ? (
            <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
              Create a list to hunt the lightest backpack for next trip.
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
                  onClick={() => handleFilterChange('planned')}
                  className={`menu-category text-md ${selectedFilter === 'planned' ? 'menu-active' : ''}`}
                >
                  Planned
                </button>
                <button
                  onClick={() => handleFilterChange('completed')}
                  className={`menu-category text-md ${selectedFilter === 'completed' ? 'menu-active' : ''}`}
                >
                  Completed
                </button>
                <button
                  onClick={() => handleFilterChange('shared')}
                  className={`menu-category text-md ${selectedFilter === 'shared' ? 'menu-active' : ''}`}
                >
                  Shared
                </button>
              </div>

              {selectedFilter === 'shared' ? (
                // Show shared lists
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-y-8 gap-x-8">
                  {sharedLists.map((sharedList, index) => (
                    <SharedListItem
                      key={sharedList._key || `shared_${sharedList.list._id}_${index}`}
                      sharedList={sharedList}
                      onRemove={handleRemoveSharedList}
                    />
                  ))}
                </ul>
              ) : (
                // Show regular lists
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-y-8 gap-x-8">
                  {filteredLists.map((list) => (
                    <ListItem key={list._id} list={list} onDelete={fetchLists} />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
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
