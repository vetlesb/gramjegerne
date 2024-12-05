// src/components/ListItem.tsx

"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import DeleteListButton from "./deleteListButton";
import { client } from "@/sanity/client";
import { ListDocument } from "@/types"; // Import the interface
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { useMemo, useState } from "react";
import AddListDialog from "./addListDialog"; // Import AddListDialog
import Icon from "./Icon"; // Import Icon if not already imported

interface ListItemProps {
  list: ListDocument;
  onDelete?: () => Promise<void>;
}

interface ListItem {
  _key: string;
  quantity?: number;
  item: {
    _id: string;
    name: string;
    weight?: {
      weight: number;
      unit: string;
    };
    calories?: number;
  } | null;
}

const builder = imageUrlBuilder(client);
function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export default function ListItem({ list, onDelete }: ListItemProps) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false); // Add state for edit dialog

  const handleClick = () => {
    router.push(`/lists/${list.slug?.current}`);
  };

  // Add handleSuccess function for edit dialog
  const handleSuccess = async (): Promise<void> => {
    if (onDelete) {
      await onDelete();
    }
  };

  // Format functions
  const formatWeight = (weightInGrams: number): string => {
    const weightInKg = weightInGrams / 1000;
    return `${weightInKg.toFixed(3)} kg`;
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Calculate totals
  const { totalWeight, totalCalories } = useMemo(() => {
    let weight = 0;
    let calories = 0;

    list.items?.forEach((item: ListItem) => {
      if (!item.item) return;
      const quantity = item.quantity || 1;

      if (item.item.weight?.weight) {
        weight += item.item.weight.weight * quantity;
      }

      if (item.item.calories) {
        calories += item.item.calories * quantity;
      }
    });

    return { totalWeight: weight, totalCalories: calories };
  }, [list.items]);

  return (
    <>
      <li className="product flex flex-col basis-full">
        <div className="flex flex-col gap-y-4">
          <div>
            {list.image ? (
              <Image
                className="rounded-md h-full w-full aspect-video object-cover cursor-pointer"
                src={urlFor(list.image).url()}
                alt={`Bilde av ${list.name}`}
                width={400}
                height={300}
                onClick={handleClick}
              />
            ) : (
              <div className="h-full w-full aspect-video flex items-center placeholder_image">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 29 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.85938 23.4961C1.32812 23.4961 0.015625 22.1836 0.015625 19.6875V7.39453C0.015625 4.89844 1.32812 3.58594 3.85938 3.58594H7.01172C7.92578 3.58594 8.23047 3.42188 8.78125 2.83594L9.71875 1.82812C10.3281 1.19531 10.9375 0.867188 12.1328 0.867188H16.7969C17.9922 0.867188 18.6016 1.19531 19.2109 1.82812L20.1484 2.83594C20.7109 3.43359 21.0039 3.58594 21.918 3.58594H25.1289C27.6602 3.58594 28.9727 4.89844 28.9727 7.39453V19.6875C28.9727 22.1836 27.6602 23.4961 25.1289 23.4961H3.85938ZM4 21.1992H25C26.0781 21.1992 26.6758 20.625 26.6758 19.4883V7.59375C26.6758 6.45703 26.0781 5.88281 25 5.88281H21.25C20.207 5.88281 19.6562 5.69531 19.0703 5.05078L18.168 4.05469C17.5117 3.35156 17.1602 3.16406 16.1289 3.16406H12.8008C11.7695 3.16406 11.418 3.35156 10.7617 4.06641L9.85938 5.05078C9.27344 5.70703 8.72266 5.88281 7.67969 5.88281H4C2.92188 5.88281 2.3125 6.45703 2.3125 7.59375V19.4883C2.3125 20.625 2.92188 21.1992 4 21.1992ZM14.5 19.6406C10.9844 19.6406 8.17188 16.8281 8.17188 13.3008C8.17188 9.77344 10.9844 6.94922 14.5 6.94922C18.0156 6.94922 20.8281 9.77344 20.8281 13.3008C20.8281 16.8281 18.0039 19.6406 14.5 19.6406ZM21.2266 9.08203C21.2266 8.27344 21.9297 7.57031 22.7617 7.57031C23.5703 7.57031 24.2734 8.27344 24.2734 9.08203C24.2734 9.92578 23.5703 10.5938 22.7617 10.5938C21.918 10.5938 21.2266 9.9375 21.2266 9.08203ZM14.5 17.543C16.8438 17.543 18.7422 15.6562 18.7422 13.3008C18.7422 10.9336 16.8438 9.04688 14.5 9.04688C12.1562 9.04688 10.2578 10.9336 10.2578 13.3008C10.2578 15.6562 12.1562 17.543 14.5 17.543Z"
                    fill="#EAFFE2"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-y-2 gap-x-4 p-2">
            <h2
              className="text-3xl text-accent cursor-pointer"
              onClick={handleClick}
            >
              {list.name}
            </h2>

            <ul className="flex flex-col gap-y-1 pt-2">
              <li className="grid grid-cols-2 gap-x-3 text-lg border-b border-white/5 pb-2">
                <p>Deltagere</p>
                {list.participants && <p>{list.participants}</p>}
              </li>
              <li className="grid grid-cols-2 gap-x-3 text-lg border-b border-white/5 pb-2">
                <p>Varighet</p>
                {list.days && <p>{list.days} dager</p>}
              </li>
              <li className="grid grid-cols-2 gap-x-3 text-lg border-b border-white/5 pb-2">
                <p>Vekt</p>
                {totalWeight > 0 && <p>{formatWeight(totalWeight)}</p>}
              </li>
              <li className="grid grid-cols-2 gap-x-3 text-lg">
                <p>Kalorier</p>
                {totalCalories > 0 && <p>{formatNumber(totalCalories)} kcal</p>}
              </li>
            </ul>
          </div>
          <div className="flex flex-col pt-4 gap-x-4 gap-y-4">
            <div className="flex gap-x-2">
              <button
                onClick={() => setShowEditDialog(true)}
                className="button-secondary w-full"
              >
                <div className="flex items-center justify-center gap-x-1 w-full text-lg">
                  <Icon name="edit" width={24} height={24} />
                  Rediger
                </div>
              </button>
              <DeleteListButton
                listId={list._id}
                listName={list.name}
                redirectTo="/lists"
                onSuccess={onDelete}
              />
            </div>
          </div>
        </div>
      </li>

      <AddListDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleSuccess}
        editList={list}
      />
    </>
  );
}
