"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import Icon from "@/components/Icon";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import imageUrlBuilder from "@sanity/image-url";
import type { List, ListItem, Category } from "@/types/list";
import { client } from "@/sanity/client";

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

interface SharePageClientProps {
  list: List;
}

export default function SharePageClient({ list }: SharePageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories from items
  const categories = useMemo(() => {
    if (!list?.items) return [];

    const uniqueCategories = new Map<string, Category>();
    list.items.forEach((listItem: ListItem) => {
      if (listItem.item?.category) {
        const cat = listItem.item.category;
        uniqueCategories.set(cat._id, cat);
      }
    });

    return Array.from(uniqueCategories.values()).sort((a, b) =>
      a.title.localeCompare(b.title, "nb"),
    );
  }, [list?.items]);

  // Filter items by selected category
  const filteredItems = useMemo(() => {
    if (!list?.items) return [];

    return list.items.filter(
      (listItem: ListItem) =>
        !selectedCategory || listItem.item?.category?._id === selectedCategory,
    );
  }, [list?.items, selectedCategory]);

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

        {/* Totals */}
        <ul className="product flex flex-wrap items-center gap-4 mt-8">
          <li>
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-x-4 pb-3 sm:pb-0 m-4">
              <p className="text-md sm:text-xl text-accent">Totalt</p>
              <p className="text-md sm:text-xl text-accent">
                {filteredItems.reduce(
                  (total, item) => total + (item.quantity || 1),
                  0,
                )}{" "}
                stk
              </p>
              <p className="text-md sm:text-xl text-accent">
                {filteredItems
                  .reduce((total, item) => {
                    if (!item.item?.weight) return total;
                    const weight = item.item.weight.weight;
                    const multiplier =
                      item.item.weight.unit === "kg" ? 1 : 0.001;
                    return total + weight * multiplier * (item.quantity || 1);
                  }, 0)
                  .toFixed(3)}{" "}
                kg
              </p>
              {filteredItems.some(
                (item) => item.item?.calories && item.item.calories > 0,
              ) && (
                <p className="text-md sm:text-xl text-accent">
                  {filteredItems.reduce((total, item) => {
                    if (!item.item?.calories) return total;
                    return total + item.item.calories * (item.quantity || 1);
                  }, 0)}{" "}
                  kcal
                </p>
              )}
            </div>
          </li>
        </ul>
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
                  <span className="text-sm text-gray-400">
                    {listItem.quantity || 1}x
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
