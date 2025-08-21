'use client';
import {Icon} from '@/components/Icon';
import {client} from '@/sanity/client';
import type {Item} from '@/types/list';
import imageUrlBuilder from '@sanity/image-url';
import {SanityImageSource} from '@sanity/image-url/lib/types/types';
import Image from 'next/image';
import {useMemo, useState, useEffect, useCallback} from 'react';
import {useSession} from 'next-auth/react';

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// Add utility functions since they're not exported from utils
function formatNumber(num: number): string {
  return new Intl.NumberFormat('nb-NO').format(num);
}

function formatWeight(weight: number): string {
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(3)} kg`;
  }
  return `${weight} g`;
}

// Add interface for category totals
interface CategoryTotal {
  id: string;
  title: string;
  count: number;
  weight: number;
  weightOnBody: number;
  calories: number;
  checkedCount: number;
}

interface SharePageClientProps {
  list: {
    _id: string;
    name: string;
    days?: number;
    weight?: number;
    participants?: number;
    image?: SanityImageSource;
    user?: {
      _id: string;
      name: string;
      email: string;
    };
    items: Array<{
      _key: string;
      _type: string;
      onBody?: boolean;
      checked?: boolean;
      quantity?: number;
      item: Item | null;
    }>;
  };
}

export default function SharePageClient({list}: SharePageClientProps) {
  const {data: session} = useSession();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnBodyOnly, setShowOnBodyOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Check if the list is already saved
  const checkIfSaved = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // Extract the raw Google ID from session (remove "google_" prefix)
      const rawGoogleId = session.user.id.replace('google_', '');

      const user = await client.fetch(
        `*[_type == "user" && googleId == $googleId][0] {
          sharedLists[] {
            list {
              _ref
            }
          }
        }`,
        {googleId: rawGoogleId},
      );

      const isAlreadySaved = user?.sharedLists?.some(
        (shared: {list: {_ref: string}}) => shared.list._ref === list._id,
      );

      setIsSaved(isAlreadySaved);
    } catch (error) {
      console.error('Error checking if list is saved:', error);
    }
  }, [session?.user?.id, list._id]);

  // Save list to shared lists
  const handleSaveToList = async () => {
    if (!session?.user?.id) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/addSharedList', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({listId: list._id}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to save list: ${errorData.error || response.statusText}`);
      }

      setIsSaved(true);
    } catch (error) {
      console.error('Error saving list:', error);
      alert(
        `Failed to save list: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Check if saved on mount
  useEffect(() => {
    checkIfSaved();
  }, [session?.user?.id, list._id, checkIfSaved]);

  // Update the type in useMemo
  const {categoryTotals, grandTotal} = useMemo(() => {
    const emptyTotal = {
      count: 0,
      weight: 0,
      weightOnBody: 0,
      calories: 0,
      checkedCount: 0,
    };

    if (!list.items?.length) {
      return {
        categoryTotals: [] as CategoryTotal[],
        grandTotal: emptyTotal,
      };
    }

    const categoryMap = new Map<string, CategoryTotal>();

    // Calculate totals
    list.items.forEach((item) => {
      if (!item.item) return;
      const quantity = item.quantity || 1;
      const effectiveCategory = item.item.category;
      if (!effectiveCategory) return;

      const existing = categoryMap.get(effectiveCategory._id) || {
        id: effectiveCategory._id,
        count: 0,
        weight: 0,
        weightOnBody: 0,
        calories: 0,
        checkedCount: 0,
        title: effectiveCategory.title,
      };

      existing.count += quantity;
      if (item.checked) {
        existing.checkedCount += quantity;
      }

      if (item.item.weight) {
        let packedQuantity = quantity;
        if (item.onBody) {
          packedQuantity = Math.max(packedQuantity - 1, 0);
          existing.weightOnBody += item.item.weight.weight;
        }
        existing.weight += item.item.weight.weight * packedQuantity;
      }

      if (item.item.calories) {
        existing.calories += item.item.calories * quantity;
      }

      categoryMap.set(effectiveCategory._id, existing);
    });

    const categoryTotals = Array.from(categoryMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title, 'nb'),
    );

    const grandTotal = categoryTotals.reduce(
      (acc, total) => ({
        count: acc.count + total.count,
        weight: acc.weight + total.weight,
        weightOnBody: acc.weightOnBody + total.weightOnBody,
        calories: acc.calories + total.calories,
        checkedCount: acc.checkedCount + total.checkedCount,
      }),
      emptyTotal,
    );

    return {categoryTotals, grandTotal};
  }, [list.items]);

  // Filter items based on category selection and onBody filter
  const filteredItemsForList = useMemo(() => {
    if (!list.items) return [];

    return list.items.filter((item) => {
      if (!item.item) return false;

      if (showOnBodyOnly) {
        return item.onBody;
      }

      if (selectedCategory) {
        return item.item.category?._id === selectedCategory;
      }

      return true;
    });
  }, [list.items, selectedCategory, showOnBodyOnly]);

  // Get onBody items for the onBody filter
  const onBodyItems = useMemo(() => {
    if (!list.items) return [];
    return list.items.filter((item) => item.onBody);
  }, [list.items]);

  // Get categories that have items
  const categories = useMemo(() => {
    if (!list.items?.length) return [];

    const activeCategories = new Map<string, {_id: string; title: string}>();

    list.items.forEach((item) => {
      if (!item.item) return;

      const effectiveCategory = item.item.category;
      if (effectiveCategory) {
        activeCategories.set(effectiveCategory._id, effectiveCategory);
      }
    });

    return Array.from(activeCategories.values()).sort((a, b) =>
      a.title.localeCompare(b.title, 'nb'),
    );
  }, [list.items]);

  return (
    <main className="container mx-auto min-h-screen p-16">
      {/* Header */}
      <div className="flex flex-col gap-y-4 mb-8">
        <div className="flex flex-col gap-y-2">
          <h1 className="nav-logo text-4xl md:text-6xl text-accent py-4">{list.name}</h1>
          <div className="flex flex-wrap gap-x-1">
            {list.user?.name && (
              <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                <Icon name="user" width={16} height={16} />
                {list.user.name}
              </p>
            )}
            {list.days && (
              <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                {list.days} {list.days === 1 ? 'day' : 'days'}
              </p>
            )}
            {list.participants && list.participants > 1 && (
              <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                {list.participants} participants
              </p>
            )}
          </div>
        </div>

        {/* Save to My Shared Lists Button */}
        {session?.user?.id && (
          <div className="flex justify-start mt-4">
            {isSaved ? (
              <div className="flex items-center gap-x-2 text-green-400">
                <Icon name="checkmark" width={20} height={20} />
                <span>Saved to My Shared Lists</span>
              </div>
            ) : (
              <button
                onClick={handleSaveToList}
                disabled={isSaving}
                className="button-primary-accent flex items-center gap-x-2"
              >
                <Icon name="link" width={20} height={20} />
                {isSaving ? 'Saving...' : 'Save to My Shared Lists'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Menu */}
      <div className="flex gap-x-2 no-scrollbar my-8 p-2">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setShowOnBodyOnly(false);
          }}
          className={`menu-category text-md ${
            selectedCategory === null && !showOnBodyOnly ? 'menu-active' : ''
          }`}
        >
          Overview
        </button>
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => {
              setSelectedCategory(category._id);
              setShowOnBodyOnly(false);
            }}
            className={`menu-category text-md ${
              selectedCategory === category._id ? 'menu-active' : ''
            }`}
          >
            {category.title}
          </button>
        ))}
        <button
          onClick={() => {
            setSelectedCategory(null);
            setShowOnBodyOnly(true);
          }}
          className={`menu-category text-md ${showOnBodyOnly ? 'menu-active' : ''}`}
        >
          On body
        </button>
      </div>

      {/* Overview Section */}
      {selectedCategory === null && !showOnBodyOnly && (
        <>
          <div className="grid grid-cols-3 gap-x-2">
            <div className="grid product gap-y-4 md:gap-y-4 lg:gap-y-8">
              <p className="flex flex-row gap-x-2 text-md sm:text-xl items-center">
                <span className="border-1 border-accent rounded-full p-1">
                  <Icon name="backpack" width={18} height={18} />
                </span>
                Backpack
              </p>
              <p className="lg:text-8xl md:text-6xl sm:text-4xl text-2xl text-accent font-bold">
                {formatWeight(grandTotal.weight)}
              </p>
            </div>
            <div className="grid product gap-y-4 md:gap-y-4 lg:gap-y-8">
              <p className="flex flex-row gap-x-2 text-md sm:text-xl items-center">
                <span className="border-1 border-accent rounded-full p-1">
                  <Icon name="clothing" width={18} height={18} />
                </span>
                On body
              </p>
              <p className="lg:text-8xl md:text-6xl sm:text-4xl text-2xl text-accent font-bold">
                {formatWeight(grandTotal.weightOnBody)}
              </p>
            </div>
            <div className="grid product gap-y-4 md:gap-y-4 lg:gap-y-8">
              <p className="flex flex-row gap-x-2 text-md sm:text-xl items-center">
                <span className="border-1 border-accent rounded-full p-1">
                  <Icon name="calories" width={18} height={18} />
                </span>
                Calories
              </p>
              <p className="lg:text-8xl md:text-6xl sm:text-4xl text-2xl text-accent font-bold">
                {formatNumber(grandTotal.calories)} kcal
              </p>
            </div>
          </div>

          <ul className="totals flex flex-col w-full">
            <li>
              <div className="flex flex-col">
                <div className="product">
                  <div className="flex flex-col gap-y-2 pt-2">
                    <p className="text-md sm:text-xl pb-8">Detailed overview</p>
                    {categoryTotals.map((total) => (
                      <div
                        key={total.id}
                        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-x-3 border-b border-white/5 pb-2"
                      >
                        <p className="text-md sm:text-xl font-medium font-sans tabular-nums">
                          {total.title}
                        </p>
                        <p className="text-md sm:text-xl font-medium font-sans tabular-nums">
                          {formatWeight(total.weight + total.weightOnBody)}
                        </p>
                        <p className="text-md sm:text-xl font-medium font-sans tabular-nums">
                          {total.calories > 0 ? `${formatNumber(total.calories)} kcal` : ''}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-x-3 border-b border-white/5 pb-2 mt-2">
                    <p className="text-md sm:text-xl font-medium font-sans tabular-nums">On body</p>
                    <p className="text-md sm:text-xl font-medium font-sans tabular-nums">
                      {formatWeight(grandTotal.weightOnBody)}
                    </p>
                  </div>

                  <div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-x-3 mt-2">
                      <p className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
                        Total
                      </p>
                      <p className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
                        {formatWeight(grandTotal.weight + grandTotal.weightOnBody)}
                      </p>
                      <p className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
                        {grandTotal.calories > 0 ? `${formatNumber(grandTotal.calories)} kcal` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </>
      )}

      {/* Items List */}
      {(selectedCategory || showOnBodyOnly) && (
        <>
          <div className="product-category items-center grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-x-3">
            <div className="flex items-center gap-x-1 text-md sm:text-xl fg-accent font-medium font-sans tabular-nums">
              {showOnBodyOnly
                ? `${formatNumber(onBodyItems.length)}`
                : `${formatNumber(filteredItemsForList.length)}`}
            </div>

            <div className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
              {showOnBodyOnly
                ? formatWeight(grandTotal.weightOnBody)
                : formatWeight(categoryTotals.find((c) => c.id === selectedCategory)?.weight || 0)}
            </div>

            <div className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
              {showOnBodyOnly
                ? onBodyItems.reduce((acc, item) => acc + (item.item?.calories || 0), 0) > 0
                  ? `${formatNumber(onBodyItems.reduce((acc, item) => acc + (item.item?.calories || 0), 0))} kcal`
                  : ''
                : (categoryTotals.find((c) => c.id === selectedCategory)?.calories || 0) > 0
                  ? `${formatNumber(categoryTotals.find((c) => c.id === selectedCategory)?.calories || 0)} kcal`
                  : ''}
            </div>
          </div>

          <ul className="flex flex-col divide-y divide-white/5 mt-4">
            {filteredItemsForList.map((listItem) => (
              <li key={listItem._key} className="product py-4">
                <div className="flex flex-wrap gap-y-6 md:gap-y-0 items-center gap-x-4">
                  {/* Image */}
                  <div className="aspect-square h-16 w-16 shrink-0">
                    {listItem.item?.image ? (
                      <Image
                        className="rounded-md h-full w-full object-cover"
                        src={urlFor(listItem.item.image).url()}
                        alt={`Image of ${listItem.item?.name || 'item'}`}
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div className="h-16 w-16 flex items-center justify-center placeholder_image">
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

                  {/* Name and tags container */}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex flex-col gap-y-2 min-w-0">
                      <h2 className="text-xl text-accent truncate" title={listItem.item?.name}>
                        {listItem.item?.name || 'Unnamed Item'}
                      </h2>
                      <div className="flex flex-wrap gap-y-1 shrink-0 gap-x-1">
                        {/* Quantity tag */}
                        {(listItem.quantity ?? 1) > 1 && (
                          <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                            {listItem.quantity} stk
                          </p>
                        )}
                        {listItem.item?.size && (
                          <p className="tag w-fit items-center gap-x-1 fg-primary flex flex-wrap">
                            <Icon name="size" width={16} height={16} />
                            {listItem.item.size}
                          </p>
                        )}
                        {listItem.item?.weight && (
                          <p className="tag w-fit items-center gap-x-1 fg-primary flex flex-wrap">
                            <Icon name="weight" width={16} height={16} />
                            {listItem.item.weight.weight} {listItem.item.weight.unit}
                          </p>
                        )}
                        {listItem.item?.calories && listItem.item.calories > 0 && (
                          <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                            <Icon name="calories" width={16} height={16} />
                            {listItem.item.calories} kcal
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
