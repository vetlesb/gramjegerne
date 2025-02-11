"use client";
import { Icon } from "@/components/Icon";
import { client } from "@/sanity/client";
import type { Category, List, ListItem } from "@/types/list";
import imageUrlBuilder from "@sanity/image-url";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import Image from "next/image";
import { useMemo, useState } from "react";

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

interface SharePageClientProps {
  list: List;
}

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const formatWeight = (weightInGrams: number): string => {
  const weightInKg = weightInGrams / 1000;
  return `${weightInKg.toFixed(3)} kg`;
};

export default function SharePageClient({ list }: SharePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get effective category helper
  const getEffectiveCategory = (listItem: ListItem): Category | undefined => {
    return listItem.categoryOverride || listItem.item?.category;
  };

  // Update categories memo to include overrides
  const categories = useMemo(() => {
    if (!list?.items) return [];

    const uniqueCategories = new Map<string, Category>();
    list.items.forEach((listItem) => {
      const effectiveCategory = getEffectiveCategory(listItem);
      if (effectiveCategory) {
        uniqueCategories.set(effectiveCategory._id, effectiveCategory);
      }
    });

    return Array.from(uniqueCategories.values()).sort((a, b) =>
      a.title.localeCompare(b.title, "nb"),
    );
  }, [list?.items]);

  // Update filtered items to use effective category
  const filteredItems = useMemo(() => {
    if (!list?.items) return [];

    return list.items.filter((listItem) => {
      if (!selectedCategory) return true;
      const effectiveCategory = getEffectiveCategory(listItem);
      return effectiveCategory?._id === selectedCategory;
    });
  }, [list?.items, selectedCategory]);

  // Calculate totals including overrides
  const { categoryTotals, grandTotal, overrideTotals, totalWithoutOverrides } =
    useMemo(() => {
      if (!filteredItems?.length) {
        const emptyTotal = { count: 0, weight: 0, calories: 0 };
        return {
          categoryTotals: [],
          grandTotal: emptyTotal,
          overrideTotals: [],
          totalWithoutOverrides: emptyTotal,
        };
      }

      const categoryMap = new Map();
      const overrideMap = new Map();

      filteredItems.forEach((item) => {
        if (!item.item) return;
        const quantity = item.quantity || 1;
        const effectiveCategory = getEffectiveCategory(item);
        if (!effectiveCategory) return;

        // Handle overrides
        if (item.categoryOverride) {
          const existing = overrideMap.get(item.categoryOverride._id) || {
            categoryId: item.categoryOverride._id,
            categoryTitle: item.categoryOverride.title,
            count: 0,
            weight: 0,
            calories: 0,
          };

          if (item.item.weight) {
            const multiplier = item.item.weight.unit === "kg" ? 1000 : 1;
            existing.weight += item.item.weight.weight * multiplier * quantity;
          }
          if (item.item.calories) {
            existing.calories += item.item.calories * quantity;
          }
          existing.count += quantity;

          overrideMap.set(item.categoryOverride._id, existing);
        }

        // Regular category totals
        const existing = categoryMap.get(effectiveCategory._id) || {
          id: effectiveCategory._id,
          title: effectiveCategory.title,
          count: 0,
          weight: 0,
          calories: 0,
        };

        existing.count += quantity;
        if (item.item.weight) {
          const multiplier = item.item.weight.unit === "kg" ? 1000 : 1;
          existing.weight += item.item.weight.weight * multiplier * quantity;
        }
        if (item.item.calories) {
          existing.calories += item.item.calories * quantity;
        }

        categoryMap.set(effectiveCategory._id, existing);
      });

      const categoryTotals = Array.from(categoryMap.values());
      const overrideTotals = Array.from(overrideMap.values());

      // Calculate grand total
      const grandTotal = categoryTotals.reduce(
        (acc, cat) => ({
          count: acc.count + cat.count,
          weight: acc.weight + cat.weight,
          calories: acc.calories + cat.calories,
        }),
        { count: 0, weight: 0, calories: 0 },
      );

      // Calculate total without overrides
      const totalWithoutOverrides = {
        count: grandTotal.count,
        weight: grandTotal.weight,
        calories: grandTotal.calories,
      };

      // Subtract override totals
      overrideTotals.forEach((override) => {
        totalWithoutOverrides.count -= override.count;
        totalWithoutOverrides.weight -= override.weight;
        totalWithoutOverrides.calories -= override.calories;
      });

      return {
        categoryTotals,
        grandTotal,
        overrideTotals,
        totalWithoutOverrides,
      };
    }, [filteredItems]);

  return (
    <>
      <main className="container mx-auto min-h-screen p-16">
        <h1 className="text-4xl md:text-6xl text-accent py-4 pb-12">
          i {list.name}
        </h1>

        {/* Category filters */}
        <div className="flex gap-x-2 no-scrollbar mb-4 p-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-md ${
              selectedCategory === null ? "menu-active" : "menu-category"
            }`}
          >
            Alle
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => setSelectedCategory(category._id)}
              className={`px-4 py-2 rounded-md ${
                selectedCategory === category._id
                  ? "menu-active text-md"
                  : "menu-category"
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>

        {/* Totalt for weight and calories */}

        {filteredItems.length > 0 ? (
          <ul className="totals flex flex-col w-full mt-8 gap-y-4">
            <li>
              {selectedCategory === null ? (
                // "Alle" view with overrides and category totals
                <div className="flex flex-col gap-y-2">
                  {/* Override totals section */}
                  <div className="flex flex-row w-full gap-x-4">
                    {overrideTotals.length > 0 && (
                      <div className="product gap-y-16 flex flex-col w-full bg-dimmed">
                        {overrideTotals.map((override) => (
                          <div
                            key={override.categoryId}
                            className="flex flex-col gap-x-3 gap-y-2"
                          >
                            <p className="text-md sm:text-xl">
                              {override.categoryTitle}
                            </p>
                            <p className="text-2xl sm:text-4xl lg:text-8xl text-accent font-bold">
                              {formatWeight(override.weight)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Total without overrides section */}
                    {overrideTotals.length > 0 && (
                      <div className="product flex w-full flex-col gap-y-2 pb-8">
                        <div className="flex flex-col gap-x-3 gap-y-2">
                          <p className="text-md sm:text-xl">Sekk</p>
                          <p className="text-2xl sm:text-4xl lg:text-8xl text-accent font-bold">
                            {formatWeight(totalWithoutOverrides.weight)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Category totals section */}
                  <div className="product">
                    <div className="flex flex-col gap-y-2 pt-4">
                      <p className="text-xl pb-8">Kategorier</p>
                      {categoryTotals.map((total) => (
                        <div
                          key={total.id}
                          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-x-3 border-b border-white/5 pb-2"
                        >
                          <p className="text-md sm:text-xl font-medium font-sans tabular-nums">
                            {total.title}
                          </p>
                          {/*  <p className="text-md sm:text-xl">
                          {formatNumber(total.count)} stk
                        </p>*/}
                          <p className="text-md sm:text-xl font-medium font-sans tabular-nums">
                            {formatWeight(total.weight)}
                          </p>
                          <p className="text-md sm:text-xl font-medium font-sans tabular-nums">
                            {total.calories > 0
                              ? `${formatNumber(total.calories)} kcal`
                              : ""}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Grand total section */}
                    <div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-x-3 mt-2">
                        <p className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
                          Totalt
                        </p>
                        {/* <p className="text-md sm:text-xl">
                        {formatNumber(grandTotal.count)} stk
                      </p> */}
                        <p className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
                          {formatWeight(grandTotal.weight)}
                        </p>
                        <p className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
                          {grandTotal.calories > 0
                            ? `${formatNumber(grandTotal.calories)} kcal`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Category-specific view
                <div className="product grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-6 gap-x-3">
                  <p className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
                    {formatNumber(
                      categoryTotals.find((cat) => cat.id === selectedCategory)
                        ?.count || 0,
                    )}{" "}
                    stk
                  </p>
                  <p className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
                    {formatWeight(
                      categoryTotals.find((cat) => cat.id === selectedCategory)
                        ?.weight || 0,
                    )}
                  </p>
                  <p className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
                    {(categoryTotals.find((cat) => cat.id === selectedCategory)
                      ?.calories || 0) > 0
                      ? `${formatNumber(categoryTotals.find((cat) => cat.id === selectedCategory)?.calories || 0)} kcal`
                      : ""}
                  </p>
                </div>
              )}
            </li>
          </ul>
        ) : (
          <div className="text-center text-accent text-2xl min-h-[50vh] flex items-center justify-center">
            Fordelen med en tom liste er at den veier 0 gram. Ulempen er at du
            har 0 kalorier å gå på
          </div>
        )}

        {/* Items list */}
        <ul className="flex flex-col divide-y divide-white/5">
          {filteredItems.map((listItem) => (
            <li key={listItem._key} className="product py-4">
              <div className="flex items-center gap-x-4">
                <div className="h-16 w-16">
                  {listItem.item?.image ? (
                    <Image
                      className="rounded-md h-full w-full object-cover"
                      src={urlFor(listItem.item.image).url()}
                      alt={`Bilde av ${listItem.item?.name || "item"}`}
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
                          d="M3.85938 23.4961C1.32812 23.4961 0.015625 22.1836 0.015625 19.6875V7.39453C0.015625 4.89844 1.32812 3.58594 3.85938 3.58594H7.01172C7.92578 3.58594 8.23047 3.42188 8.78125 2.83594L9.71875 1.82812C10.3281 1.19531 10.9375 0.867188 12.1328 0.867188H16.7969C17.9922 0.867188 18.6016 1.19531 19.2109 1.82812L20.1484 2.83594C20.7109 3.43359 21.0039 3.58594 21.918 3.58594H25.1289C27.6602 3.58594 28.9727 4.89844 28.9727 7.39453V19.6875C28.9727 22.1836 27.6602 23.4961 25.1289 23.4961H3.85938Z"
                          fill="#EAFFE2"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-y-2">
                  <h2 className="text-xl text-accent">{listItem.item?.name}</h2>
                  <div className="flex flex-wrap gap-x-1">
                    <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                      {listItem.quantity || 1} stk
                    </p>
                    {listItem.item?.size && (
                      <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                        <Icon name="size" width={16} height={16} />
                        {listItem.item.size}
                      </p>
                    )}
                    {listItem.item?.weight && (
                      <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                        <Icon name="weight" width={16} height={16} />
                        {listItem.item.weight.weight}{" "}
                        {listItem.item.weight.unit}
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

                {/* Quantity display */}
                <div className="ml-auto">
                  <span className="text-sm text-gray-400"></span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
