'use client';

import {SharedListReference} from '@/types';
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

interface SharedListItemProps {
  sharedList: SharedListReference;
  onRemove: (listId: string) => Promise<void>;
}

export function SharedListItem({sharedList, onRemove}: SharedListItemProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/lists/${sharedList.list.slug.current}?shared=true`);
  };

  const handleRemove = async () => {
    await onRemove(sharedList.list._id);
  };

  return (
    <li className="product-list flex flex-col basis-full">
      <div className="flex flex-col gap-y-4">
        <div className="relative">
          <div className="flex flex-col gap-y-1 p-2 absolute top-0 right-0">
            <button
              onClick={handleRemove}
              className="button-trans"
              title="Remove from shared lists"
            >
              <div className="flex items-center justify-center gap-x-1 w-full text-lg">
                <Icon name="delete" width={24} height={24} />
              </div>
            </button>
          </div>
          {sharedList.list.image ? (
            <Image
              className="rounded-md h-full w-full aspect-video object-cover cursor-pointer"
              src={urlFor(sharedList.list.image).url()}
              alt={`Image of ${sharedList.list.name}`}
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
                width="16"
                height="16"
                viewBox="0 0 29 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.85938 23.4961C1.32812 23.4961 0.015625 22.1836 0.015625 19.6875V7.39453C0.015625 4.89844 1.32812 3.58594 3.85938 3.58594H7.01172C7.92578 3.58594 8.23047 3.42188 8.78125 2.83594L9.71875 1.82812C10.3281 1.19531 10.9375 0.867188 12.1328 0.867188H16.7969C17.9922 0.867188 18.6016 1.19531 19.2109 1.82812L20.1484 2.83594C20.7109 3.43359 21.0039 3.58594 21.918 3.58594H25.1289C27.6602 3.58594 28.9727 4.89844 28.9727 7.39453V19.6875C28.9727 22.1836 27.6602 23.4961 25.1289 23.4961H3.85938ZM4 21.1992H25C26.0781 21.1992 26.6758 20.625 26.6758 19.4883V7.59375C26.6758 6.45703 26.0781 5.88281 25 5.88281H21.25C20.207 5.88281 19.6562 5.69531 19.0703 5.05078L18.168 4.05469C17.5117 3.35156 17.1602 3.16406 16.1289 3.16406H12.8008C11.7695 3.16406 11.418 3.35156 10.7617 4.06641L9.85938 5.05078C9.27344 5.70703 8.72266 5.88281 7.67969 5.88281H4C2.92188 5.88281 2.3125 6.45703 2.3125 7.59375V19.4883C2.3125 20.625 2.92188 21.1992 4 21.1992ZM14.5 19.6406C10.9844 19.6406 8.17188 16.8281 8.17188 13.3008C8.17188 9.77344 10.9844 6.94922 14.5 6.94922C18.0156 6.94922 20.8281 9.77344 20.8281 13.3008C20.8281 16.8281 18.0039 19.6406 14.5 19.6406ZM21.2266 9.08203C21.2266 8.27344 21.9297 7.57031 22.7617 7.57031C23.5703 7.57031 24.2734 8.27344 24.2734 9.08203C24.2734 9.92578 23.5703 10.5938 22.7617 10.5938C21.918 10.5938 21.2266 9.9375 21.2266 9.08203ZM14.5 17.543C16.8438 17.543 18.7422 15.6562 18.7422 13.3008C18.7422 10.9336 16.8438 9.04688 14.5 9.04688C12.1562 9.04688 10.2578 10.9336 10.2578 13.3008C10.2578 15.6562 16.1562 17.543 14.5 17.543Z"
                  className="icon-fill"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-y-1 gap-x-4 pb-4 pl-4 pr-4 pt-2">
          <h2 className="nav-logo text-3xl text-accent cursor-pointer" onClick={handleClick}>
            {sharedList.list.name}
          </h2>

          <ul className="flex flex-wrap gap-x-1 gap-y-1 pt-2">
            <li className="gap-x-3">
              <p className="tag w-fit items-center gap-x-1 text-lg flex flex-wrap">
                <Icon name="user" width={16} height={16} />
                {sharedList.list.user.name}
              </p>
            </li>
          </ul>
        </div>
      </div>
    </li>
  );
}
