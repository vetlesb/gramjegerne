'use client';

import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {client} from '@/sanity/client';
import {ListDocument} from '@/types';
import {useSession} from 'next-auth/react';
import {groq} from 'next-sanity';
import {useCallback, useEffect, useState, useMemo} from 'react';
import {AddListDialog} from '../../components/addListDialog';
import {ListItem} from '../../components/ListItem';

export default function Page() {
  const {data: session} = useSession();
  const [lists, setLists] = useState<ListDocument[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'planned' | 'completed' | null>(null);

  const fetchLists = useCallback(async () => {
    if (!session?.user?.id) return;

    const query = groq`*[_type == "list" && user._ref == $userId] | order(completed asc, _createdAt desc) {
      _id,
      name,
      slug,
      image,
      days,
      participants,
      completed,
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

  useEffect(() => {
    fetchLists();

    // Subscribe to real-time updates
    if (!session?.user?.id) return;

    const query = groq`*[_type == "list" && user._ref == $userId]`;
    const subscription = client.listen(query, {userId: session.user.id}).subscribe({
      next: fetchLists,
      error: (error) => {
        console.error('Subscription error:', error);
      },
    });

    return () => subscription.unsubscribe();
  }, [session?.user?.id, fetchLists]);

  // Filter lists based on selection
  const filteredLists = useMemo(() => {
    if (selectedFilter === 'planned') {
      return lists.filter((list) => !list.completed);
    }
    if (selectedFilter === 'completed') {
      return lists.filter((list) => list.completed);
    }
    return lists;
  }, [lists, selectedFilter]);

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen p-16">
        <div className="flex flex-col gap-y-4">
          <AddListDialog onSuccess={fetchLists} />

          {lists.length === 0 ? (
            <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
              Create a list to hunt the lightest backpack for next trip.
            </div>
          ) : (
            <>
              <div className="flex gap-x-2 no-scrollbar my-1 p-2">
                <button
                  onClick={() => setSelectedFilter(null)}
                  className={`menu-category text-md ${selectedFilter === null ? 'menu-active' : ''}`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedFilter('planned')}
                  className={`menu-category text-md ${selectedFilter === 'planned' ? 'menu-active' : ''}`}
                >
                  Planned
                </button>
                <button
                  onClick={() => setSelectedFilter('completed')}
                  className={`menu-category text-md ${selectedFilter === 'completed' ? 'menu-active' : ''}`}
                >
                  Completed
                </button>
              </div>

              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-y-8 gap-x-8">
                {filteredLists.map((list) => (
                  <ListItem key={list._id} list={list} onDelete={fetchLists} />
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
