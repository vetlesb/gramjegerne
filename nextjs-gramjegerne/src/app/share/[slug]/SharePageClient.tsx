'use client';
import {Icon} from '@/components/Icon';
import {client} from '@/sanity/client';
import type {ListItem} from '@/types/list';
import imageUrlBuilder from '@sanity/image-url';
import {SanityImageSource} from '@sanity/image-url/lib/types/types';
import Image from 'next/image';
import {useMemo, useState} from 'react';

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

// Update ListItem type to include the missing properties
interface ExtendedListItem extends ListItem {
  checked?: boolean;
  onBody?: boolean;
  quantity?: number;
}

// Update the interface to use proper typing for image
interface SharePageClientProps {
  list: {
    _id: string;
    name: string;
    days?: number;
    weight?: number;
    participants?: number;
    image?: SanityImageSource;
    items: ExtendedListItem[];
  };
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

export default function SharePageClient({list}: SharePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnBodyOnly, setShowOnBodyOnly] = useState(false);

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
      (acc, cat) => ({
        count: acc.count + cat.count,
        weight: acc.weight + cat.weight,
        weightOnBody: acc.weightOnBody + cat.weightOnBody,
        calories: acc.calories + cat.calories,
        checkedCount: acc.checkedCount + cat.checkedCount,
      }),
      {...emptyTotal},
    );

    return {categoryTotals, grandTotal};
  }, [list.items]);

  // Add onBody items calculation
  const onBodyItems = useMemo(() => {
    return list.items.filter((item) => item.onBody === true);
  }, [list.items]);

  // Add filtered items calculation
  const filteredItemsForList = useMemo(() => {
    let items = list.items;

    // If showOnBodyOnly is true, show all onBody items regardless of category
    if (showOnBodyOnly) {
      return items.filter((item) => item.onBody === true);
    }

    // Otherwise, apply category filter as normal
    if (selectedCategory) {
      items = items.filter((item) => item.item?.category?._id === selectedCategory);
    }

    return items;
  }, [list.items, selectedCategory, showOnBodyOnly]);

  return (
    <main className="container mx-auto min-h-screen p-16">
      <h1 className="text-4xl md:text-6xl text-accent py-4">i {list.name}</h1>

      {/* Category filters */}
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
        {categoryTotals.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              setShowOnBodyOnly(false);
            }}
            className={`menu-category text-md ${
              selectedCategory === category.id ? 'menu-active' : ''
            }`}
          >
            {category.title}
          </button>
        ))}
        <button
          onClick={() => {
            setShowOnBodyOnly(!showOnBodyOnly);
            setSelectedCategory(null);
          }}
          className={`menu-category text-md ${showOnBodyOnly ? 'menu-active' : ''}`}
        >
          On body
        </button>
      </div>

      {/* Show totals and detailed overview in overview */}
      {selectedCategory === null && !showOnBodyOnly && (
        <>
          <div className="grid grid-cols-3 gap-x-2">
            <div className="grid product gap-y-2">
              <p className="text-md sm:text-xl">Backpack</p>
              <p className="lg:text-6xl md:text-4xl sm:text-4xl text-lg text-accent font-bold">
                {formatWeight(grandTotal.weight)}
              </p>
            </div>
            <div className="grid product gap-y-2">
              <p className="text-md sm:text-xl">On body</p>
              <p className="lg:text-6xl md:text-4xl sm:text-4xl text-lg text-accent font-bold">
                {formatWeight(grandTotal.weightOnBody)}
              </p>
            </div>
            <div className="grid product gap-y-2">
              <p className="text-md sm:text-xl font-medium font-sans tabular-nums">Calories</p>
              <p className="lg:text-6xl md:text-4xl sm:text-4xl text-lg text-accent font-bold">
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

      {/* Show filtered items when category or onBody is selected */}
      {(selectedCategory || showOnBodyOnly) && (
        <>
          <div className="product items-center grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-6 gap-x-3">
            <div className="flex items-center gap-x-1 text-md sm:text-xl fg-accent font-medium font-sans tabular-nums">
              <Icon name="backpack" width={24} height={24} />
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
            {filteredItemsForList.map((item) => (
              <li key={item._key} className="product py-4">
                <div className="flex flex-wrap gap-y-6 md:gap-y-0 items-center gap-x-4">
                  {/* Image */}
                  <div className="aspect-square h-16 w-16 shrink-0">
                    {item.item?.image ? (
                      <Image
                        className="rounded-md h-full w-full object-cover"
                        src={urlFor(item.item.image).url()}
                        alt={`Bilde av ${item.item?.name || 'item'}`}
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div className="h-16 w-16 flex items-center justify-center placeholder_image">
                        <Icon name="document" width={16} height={16} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-y-2">
                    <h3 className="text-xl text-accent">{item.item?.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {(item.quantity ?? 1) > 1 && (
                        <span className="tag">{item.quantity ?? 1} stk</span>
                      )}
                      {item.item?.size && <span className="tag">{item.item.size}</span>}
                      {item.item?.weight && (
                        <span className="tag">
                          {item.item.weight.weight} {item.item.weight.unit}
                        </span>
                      )}
                      {item.onBody && <span className="tag">On body</span>}
                      {item.item?.calories && item.item.calories > 0 && (
                        <span className="tag">{item.item.calories} kcal</span>
                      )}
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
