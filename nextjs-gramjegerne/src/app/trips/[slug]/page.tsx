'use client';

import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {TripShareButton} from '@/components/TripShareButton';
import {ConnectListDialog} from '@/components/ConnectListDialog';
import {ConnectMapDialog} from '@/components/ConnectMapDialog';
import {ListCard} from '@/components/ListCard/ListCard';
import {MapCard} from '@/components/MapCard/MapCard';
import {Button} from '@/components/Button';
import {Tag} from '@/components/Tag';
import {urlFor as urlForImage} from '@/sanity/images';
import {client} from '@/sanity/client';
import {useSession} from 'next-auth/react';
import {usePathname, useSearchParams} from 'next/navigation';
import {groq} from 'next-sanity';
import {useCallback, useEffect, useState} from 'react';
import {useDelayedLoader} from '@/hooks/useDelayedLoader';
import Image from 'next/image';
import imageUrlBuilder from '@sanity/image-url';
import {SanityImageSource} from '@sanity/image-url/lib/types/types';

const builder = imageUrlBuilder(client);
function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

interface Participant {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface ConnectedListItem {
  _key: string;
  quantity?: number;
  item: {
    _id: string;
    name: string;
    weight?: {weight: number; unit: string};
    calories?: number;
  } | null;
}

interface ConnectedMapRoute {
  _key?: string;
  waypoints?: Array<{lat: number; lng: number}>;
  elevationGain?: number;
}

interface ConnectedMap {
  _id: string;
  name: string;
  image?: {asset: {_ref: string}};
  shareId?: string;
  owner: {_id: string; name: string};
  routes: ConnectedMapRoute[];
  campingSpotsCount: number;
  routesCount: number;
}

interface ConnectedList {
  _id: string;
  name: string;
  slug: {current: string};
  image?: {asset: {_ref: string}};
  days?: number;
  participants?: number;
  completed?: boolean;
  owner: {_id: string; name: string};
  items: ConnectedListItem[];
}

interface TripDetail {
  _id: string;
  name: string;
  slug: {current: string};
  description?: string;
  image?: SanityImageSource;
  startDate?: string;
  endDate?: string;
  shareId?: string;
  isShared?: boolean;
  mapsRestrictedToOwner?: boolean;
  category?: {_id: string; title: string};
  owner: Participant;
  participants: Participant[];
  connectedLists: ConnectedList[];
  connectedMaps: ConnectedMap[];
}

export default function TripDetailPage() {
  const {data: session} = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = pathname.split('/').pop() || '';
  const isSharedMode = searchParams.get('shared') === 'true';

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const showLoader = useDelayedLoader(isLoading, 300);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showConnectMapDialog, setShowConnectMapDialog] = useState(false);

  const getUserId = useCallback(() => {
    if (!session?.user?.id) return null;
    return session.user.id.startsWith('google_') ? session.user.id : `google_${session.user.id}`;
  }, [session?.user?.id]);

  const fetchTrip = useCallback(async () => {
    const userId = getUserId();
    if (!userId && !isSharedMode) return;

    try {
      const query = isSharedMode
        ? groq`*[_type == "trip" && (slug.current == $slug || _id == $slug)][0] {
            _id, name, slug, description, image, startDate, endDate,
            shareId, isShared, mapsRestrictedToOwner,
            "category": category->{_id, title},
            "owner": user->{_id, name, email, image},
            "participants": *[_type == "user" && ^._id in sharedTrips[].trip._ref]{_id, name, email, image},
            "connectedLists": *[_type == "list" && connectedTrip._ref == ^._id]{
              _id, name, slug, image, days, participants, completed,
              "owner": user->{_id, name},
              "items": items[]{
                _key, quantity,
                "item": item->{_id, name, weight, calories}
              }
            },
            "connectedMaps": *[_type == "map" && connectedTrip._ref == ^._id]{
              _id, name, image, shareId,
              "owner": user->{_id, name},
              "routes": routes[]{_key, waypoints, elevationGain},
              "campingSpotsCount": count(campingSpots),
              "routesCount": count(routes)
            }
          }`
        : groq`*[_type == "trip" && (slug.current == $slug || _id == $slug) && user._ref == $userId][0] {
            _id, name, slug, description, image, startDate, endDate,
            shareId, isShared, mapsRestrictedToOwner,
            "category": category->{_id, title},
            "owner": user->{_id, name, email, image},
            "participants": *[_type == "user" && ^._id in sharedTrips[].trip._ref]{_id, name, email, image},
            "connectedLists": *[_type == "list" && connectedTrip._ref == ^._id]{
              _id, name, slug, image, days, participants, completed,
              "owner": user->{_id, name},
              "items": items[]{
                _key, quantity,
                "item": item->{_id, name, weight, calories}
              }
            },
            "connectedMaps": *[_type == "map" && connectedTrip._ref == ^._id]{
              _id, name, image, shareId,
              "owner": user->{_id, name},
              "routes": routes[]{_key, waypoints, elevationGain},
              "campingSpotsCount": count(campingSpots),
              "routesCount": count(routes)
            }
          }`;

      const data = await client.fetch(query, {slug, userId});
      setTrip(data);
    } catch (error) {
      console.error('Error fetching trip:', error);
    } finally {
      setIsLoading(false);
    }
  }, [slug, getUserId, isSharedMode]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const handleDisconnectList = async (listId: string) => {
    try {
      const response = await fetch('/api/connectListToTrip', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({listId}),
      });

      if (!response.ok) throw new Error('Failed to disconnect list');

      await fetchTrip();
    } catch (error) {
      console.error('Error disconnecting list:', error);
    }
  };

  const handleDisconnectMap = async (mapId: string) => {
    try {
      const response = await fetch('/api/connectMapToTrip', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({mapId}),
      });

      if (!response.ok) throw new Error('Failed to disconnect map');

      await fetchTrip();
    } catch (error) {
      console.error('Error disconnecting map:', error);
    }
  };

  const formatDateRange = (): string | null => {
    if (!trip?.startDate && !trip?.endDate) return null;
    const opts: Intl.DateTimeFormatOptions = {day: 'numeric', month: 'long', year: 'numeric'};
    const start = trip.startDate ? new Date(trip.startDate).toLocaleDateString('nb-NO', opts) : '';
    const end = trip.endDate ? new Date(trip.endDate).toLocaleDateString('nb-NO', opts) : '';
    if (start && end) return `${start} - ${end}`;
    return start || end;
  };

  const dateRange = trip ? formatDateRange() : null;
  const isOwner = trip && getUserId() === trip.owner?._id;

  if (showLoader) {
    return (
      <ProtectedRoute>
        <main className="container mx-auto min-h-screen p-16">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (!trip) {
    return (
      <ProtectedRoute>
        <main className="container mx-auto min-h-screen p-16">
          <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
            Trip not found
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen p-16">
        <div className="flex flex-col gap-y-8">
          {/* Trip header */}
          <div className="flex flex-col gap-y-4">
            {trip.image && (
              <div className="w-full aspect-video max-h-[400px] overflow-hidden rounded-2xl">
                <Image
                  src={urlFor(trip.image).url()}
                  alt={trip.name}
                  width={1200}
                  height={600}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-y-2">
                <h1 className="text-4xl text-accent">{trip.name}</h1>
               
                <div className="flex flex-wrap gap-2 mt-2">
                  {dateRange && (
                    <Tag variant="dimmed" iconName="calendar">
                      {dateRange}
                    </Tag>
                  )}
                  <Tag variant="dimmed" iconName="user">
                    {(trip.participants?.length || 0) + 1} participants
                  </Tag>
                  <Tag variant="dimmed" iconName="list">
                    {trip.connectedLists?.length || 0} lists
                  </Tag>
                </div>
                 {trip.description && (
                  <p className="text-lg text-primary">{trip.description}</p>
                )}
              </div>

            </div>
          </div>

          {/* Participants */}
          <section className="flex flex-col gap-y-4">
            <div className="flex items-center gap-x-4">
              <h2 className="text-2xl text-accent">Participants</h2>
              {isOwner && (
                <TripShareButton
                  tripId={trip._id}
                  shareId={trip.shareId}
                  tripName={trip.name}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {/* Owner */}
              {(() => {
                const currentUserId = getUserId();
                const isOwnerMe = currentUserId === trip.owner?._id;
                return (
                  <div className="flex items-center gap-2 bg-dimmed rounded-lg p-3">
                    {trip.owner?.image && (
                      <Image
                        src={trip.owner.image}
                        alt={trip.owner.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-lg">{isOwnerMe ? 'Me' : trip.owner?.name}</span>
                    <span className="text-sm text-white/50">(owner)</span>
                  </div>
                );
              })()}

              {/* Other participants */}
              {trip.participants?.map((participant) => {
                const currentUserId = getUserId();
                const isMe = currentUserId === participant._id;
                return (
                  <div key={participant._id} className="flex items-center gap-2 bg-dimmed rounded-lg p-3">
                    {participant.image && (
                      <Image
                        src={participant.image}
                        alt={participant.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-lg">{isMe ? 'Me' : participant.name}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Connected packing lists */}
          <section className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl text-accent">Lists</h2>
              {session?.user?.id && (
                <Button onClick={() => setShowConnectDialog(true)}>Connect list</Button>
              )}
            </div>

            {trip.connectedLists?.length === 0 ? (
              <p className="text-lg text-white/50">No packing lists connected yet.</p>
            ) : (
              <ul className="flex flex-col gap-y-2">
                {trip.connectedLists?.map((list) => {
                  const isListOwner = getUserId() === list.owner._id;

                  return (
                    <ListCard
                      key={list._id}
                      mode="shared"
                      isSharedList={!isListOwner}
                      fromTrip={trip.slug?.current || trip._id}
                      viewMode="list"
                      listId={list._id}
                      name={list.name}
                      slug={list.slug.current}
                      image={list.image?.asset}
                      days={list.days}
                      participants={list.participants}
                      completed={list.completed}
                      items={list.items}
                      ownerName={isListOwner ? undefined : list.owner.name}
                      onRemove={isListOwner ? () => handleDisconnectList(list._id) : undefined}
                      imageUrlBuilder={(asset) => urlForImage(asset)}
                    />
                  );
                })}
              </ul>
            )}
          </section>

          {/* Connected maps */}
          <section className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl text-accent">Maps</h2>
              {session?.user?.id && (!trip.mapsRestrictedToOwner || isOwner) && (
                <Button onClick={() => setShowConnectMapDialog(true)}>Connect map</Button>
              )}
            </div>

            {trip.connectedMaps?.length === 0 ? (
              <p className="text-lg text-white/50">No maps connected yet.</p>
            ) : (
              <ul className="flex flex-col gap-y-2">
                {trip.connectedMaps?.map((map) => {
                  const isMapOwner = getUserId() === map.owner._id;

                  return (
                    <MapCard
                      key={map._id}
                      mode="shared"
                      viewMode="list"
                      mapId={map._id}
                      name={map.name}
                      image={map.image?.asset}
                      shareId={map.shareId}
                      isSharedMap={!isMapOwner}
                      fromTrip={trip.slug?.current || trip._id}
                      routes={map.routes}
                      campingSpotsCount={map.campingSpotsCount}
                      routesCount={map.routesCount}
                      ownerName={isMapOwner ? undefined : map.owner.name}
                      onRemove={isMapOwner ? () => handleDisconnectMap(map._id) : undefined}
                      imageUrlBuilder={(asset) => urlForImage(asset)}
                    />
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Connect list dialog */}
        <ConnectListDialog
          tripId={trip._id}
          open={showConnectDialog}
          onOpenChange={setShowConnectDialog}
          onSuccess={fetchTrip}
        />

        {/* Connect map dialog */}
        <ConnectMapDialog
          tripId={trip._id}
          open={showConnectMapDialog}
          onOpenChange={setShowConnectMapDialog}
          onSuccess={fetchTrip}
        />
      </main>
    </ProtectedRoute>
  );
}
