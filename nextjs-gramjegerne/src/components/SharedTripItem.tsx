'use client';

import {SharedTripReference} from '@/types';
import {useRouter} from 'next/navigation';
import {Icon} from './Icon';
import {client} from '@/sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import {SanityImageSource} from '@sanity/image-url/lib/types/types';
import Image from 'next/image';

const builder = imageUrlBuilder(client);
function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

interface SharedTripItemProps {
  sharedTrip: SharedTripReference;
  onRemove: (tripId: string) => Promise<void>;
}

export function SharedTripItem({sharedTrip, onRemove}: SharedTripItemProps) {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to the shared trip view using shareId if available, otherwise use trip ID
    if (sharedTrip.trip.shareId) {
      router.push(`/share/map/${sharedTrip.trip.shareId}`);
    } else {
      // Fallback to regular trip view with shared flag
      router.push(`/maps/${sharedTrip.trip._id}?shared=true`);
    }
  };

  const handleRemove = async () => {
    await onRemove(sharedTrip.trip._id);
  };

  return (
    <li className="product-list flex flex-col basis-full">
      <div className="flex flex-col gap-y-4">
        <div className="relative">
          <div className="flex flex-col gap-y-1 p-2 absolute top-0 right-0">
            <button
              onClick={handleRemove}
              className="button-trans"
              title="Remove from shared trips"
            >
              <div className="flex items-center justify-center gap-x-1 w-full text-lg">
                <Icon name="delete" width={24} height={24} />
              </div>
            </button>
          </div>
          {sharedTrip.trip.image ? (
            <Image
              className="rounded-md h-full w-full aspect-video object-cover cursor-pointer"
              src={urlFor(sharedTrip.trip.image).url()}
              alt={`Image of ${sharedTrip.trip.name}`}
              width={800}
              height={800}
              onClick={handleClick}
            />
          ) : (
            <div
              className="h-full w-full aspect-video flex items-center placeholder_image cursor-pointer"
              onClick={handleClick}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C15.866 2 19 5.41126 19 9.61914L18.9883 10.0996C18.757 15.0265 15.0094 18.7245 12 22C8.99062 18.7245 5.243 15.0265 5.01172 10.0996L5 9.61914C5 5.41126 8.13401 2 12 2ZM12 4C9.39475 4 7 6.3529 7 9.61914C7.00002 11.6723 7.76642 13.5356 8.99512 15.3643C9.86438 16.6579 10.9066 17.8522 12 19.0479C13.0934 17.8522 14.1356 16.6579 15.0049 15.3643C16.2336 13.5356 17 11.6723 17 9.61914C17 6.3529 14.6052 4 12 4ZM12 6C13.6569 6 15 7.34315 15 9C15 10.6569 13.6569 12 12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6Z"
                  className="icon-fill"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-y-1 gap-x-4 pb-4 pl-4 pr-4 pt-2">
          <h2 className="nav-logo text-3xl text-accent cursor-pointer" onClick={handleClick}>
            {sharedTrip.trip.name}
          </h2>

          <ul className="flex flex-wrap gap-x-1 gap-y-1 pt-2">
            <li className="gap-x-3">
              <p className="tag w-fit items-center gap-x-1 text-lg flex flex-wrap">
                <Icon name="user" width={16} height={16} />
                {sharedTrip.trip.user.name}
              </p>
            </li>
            {sharedTrip.trip.campingSpotsCount > 0 && (
              <li className="gap-x-3">
                <p className="tag w-fit items-center gap-x-1 text-lg flex flex-wrap">
                  <Icon name="location" width={16} height={16} />
                  {sharedTrip.trip.campingSpotsCount} spots
                </p>
              </li>
            )}
            {sharedTrip.trip.routesCount > 0 && (
              <li className="gap-x-3">
                <p className="tag w-fit items-center gap-x-1 text-lg flex flex-wrap">
                  <Icon name="route" width={16} height={16} />
                  {sharedTrip.trip.routesCount} routes
                </p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </li>
  );
}
