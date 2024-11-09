"use client";
import { useState, useEffect } from "react";
import imageUrlBuilder from "@sanity/image-url";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/sanity/client";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "../../../components/ui/dialog";

// Define Category and Item types
interface Category {
  _id: string;
  title: string;
  slug: { current: string };
}
interface Item {
  _id: string;
  name: string;
  categories?: { _id: string; title: string }[];
  image?: SanityImageSource;
  size?: string;
  weight?: { weight: number; unit: string };
  calories?: number;
}
interface List {
  _id: string;
  name: string;
  items: Item[];
}

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

const ITEMS_QUERY = `*[_type == "item"]{
  _id, name, slug, image,
  "categories": categories[]-> {_id, title},
  size, weight, quantity, calories
}`;

const CATEGORIES_QUERY = `*[_type == "category"]{_id, title, slug}`;

const LIST_QUERY = (
  listSlug: string,
) => `*[_type == "list" && slug.current == "${listSlug}"]{
  _id,
  name,
  "items": items[]->{
    _id,
    name,
    "categories": categories[]->{_id, title},
    image,
    size,
    weight,
    calories
  }
}`;

export default function ListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [list, setList] = useState<List | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // For search functionality
  const [tempSelectedItems, setTempSelectedItems] = useState<Item[]>([]); // Temporary selection state

  const pathname = usePathname();
  const listSlug = pathname?.split("/")[2];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories and items
        const fetchedItems: Item[] = await client.fetch(ITEMS_QUERY);
        const fetchedCategories: Category[] =
          await client.fetch(CATEGORIES_QUERY);

        setItems(fetchedItems);
        setCategories(fetchedCategories);

        // Fetch the current list if the slug exists
        if (listSlug) {
          const fetchedList: List[] = await client.fetch(LIST_QUERY(listSlug));
          if (fetchedList[0]) {
            setList(fetchedList[0]);
            setSelectedItems(fetchedList[0].items || []);
          } else {
            setList(null);
            setSelectedItems([]);
          }
        } else {
          setList(null);
          setSelectedItems([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setSelectedItems([]);
      }
    };

    fetchData();
  }, [listSlug]);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  // Handle item selection in the dialog
  const handleTempItemToggle = (item: Item) => {
    setTempSelectedItems((prevItems) => {
      const itemExists = prevItems.some(
        (selectedItem) => selectedItem._id === item._id,
      );
      if (itemExists) {
        // Remove item
        return prevItems.filter((i) => i._id !== item._id);
      } else {
        // Add item
        return [...prevItems, item];
      }
    });
  };

  const handleRemoveFromList = async (item: Item) => {
    try {
      // Update the list in the backend
      const response = await fetch("/api/updateList", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: list?._id,
          items: selectedItems
            .filter((i) => i._id !== item._id)
            .map((i) => i._id),
        }),
      });

      if (!response.ok) throw new Error("Failed to remove item from list");

      // Update the list's selected items by removing the item
      setSelectedItems((prevItems) =>
        prevItems.filter((i) => i._id !== item._id),
      );
    } catch (error) {
      console.error("Error removing item from list:", error);
    }
  };

  // Filter items for the category selection
  const filteredItemsForList = selectedCategory
    ? selectedItems.filter((item) =>
        item.categories?.some((category) => category._id === selectedCategory),
      )
    : selectedItems; // When selectedCategory is null, show all items

  // Filter categories to only those with items in the selectedItems
  const filteredCategoriesForList = categories.filter((category) =>
    selectedItems.some((item) =>
      item.categories?.some((cat) => cat._id === category._id),
    ),
  );

  // Filter items based on the search query in the dialog
  const filteredItemsForDialog = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // When the dialog opens, initialize tempSelectedItems with current selectedItems
  const handleDialogOpenChange = (isOpen: boolean) => {
    setIsDialogOpen(isOpen);
    if (isOpen) {
      setTempSelectedItems(selectedItems);
      setSearchQuery(""); // Clear search query when dialog opens
    }
  };

  if (!categories || !items) {
    return <div>Loading...</div>;
  }

  return (
    <main className="container mx-auto min-h-screen p-16">
      <div className="flex gap-x-2 no-scrollbar mb-4 p-2">
        {/* Show categories with items and include "All Categories" button */}
        {filteredCategoriesForList.length > 0 && (
          <>
            <button
              onClick={() => handleCategorySelect(null)} // Set selectedCategory to null for "All Categories"
              className={`menu-category text-md ${
                selectedCategory === null ? "menu-active" : ""
              }`}
            >
              All Categories
            </button>
            {filteredCategoriesForList.map((category) => (
              <button
                key={category._id}
                onClick={() => handleCategorySelect(category._id)}
                className={`menu-category text-md ${
                  selectedCategory === category._id ? "menu-active" : ""
                }`}
              >
                {category.title}
              </button>
            ))}
          </>
        )}

        {/* Button to open the Add Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <button className="menu-category">Legg til</button>
          </DialogTrigger>
          {/* Updated DialogContent */}
          <DialogContent className="dialog p-10 rounded-2xl h-[80vh] no-scrollbar flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-normal">
                Legg til produkter
              </DialogTitle>
            </DialogHeader>
            {/* Search Bar */}
            <label className="flex flex-col pt-4 gap-y-2">
              Søk
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-full p-4 mb-2"
              />
            </label>
            {/* Container for the list of items */}
            <div className="flex-grow overflow-y-auto no-scrollbar">
              <ul className="flex flex-col">
                {filteredItemsForDialog.map((item) => {
                  const isSelected = tempSelectedItems.some(
                    (selectedItem) => selectedItem._id === item._id,
                  );
                  return (
                    <li
                      key={item._id}
                      className={`product-search flex items-center gap-4 py-2 cursor-pointer ${
                        isSelected ? "active" : ""
                      }`}
                      onClick={() => handleTempItemToggle(item)}
                    >
                      <div className="flex flex-grow items-center gap-x-4">
                        <div className="h-24 w-24">
                          {item.image ? (
                            <img
                              className="rounded-md h-full w-full object-cover"
                              src={urlFor(item.image).url()}
                            />
                          ) : (
                            <div className="h-24 w-24 flex items-center placeholder_image">
                              {/* Placeholder SVG */}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-y-2">
                          <h2 className="text-xl truncate">{item.name}</h2>
                          <div className="flex flex-wrap gap-x-1">
                            {item.size && (
                              <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                                {/* SVG Icon */}
                                {item.size}
                              </p>
                            )}
                            {item.weight && (
                              <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                                {/* SVG Icon */}
                                {item.weight.weight} {item.weight.unit}
                              </p>
                            )}
                            {item.calories && (
                              <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                                {/* SVG Icon */}
                                {item.calories} kcal
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <DialogFooter>
              <button
                onClick={async () => {
                  try {
                    // Update the list in the backend
                    const response = await fetch("/api/updateList", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        listId: list?._id,
                        items: tempSelectedItems.map((i) => i._id),
                      }),
                    });

                    if (!response.ok) throw new Error("Failed to update list");

                    // Update the selectedItems state with tempSelectedItems
                    setSelectedItems(tempSelectedItems);
                    setIsDialogOpen(false);
                  } catch (error) {
                    console.error("Error updating list:", error);
                  }
                }}
                className="button-primary-accent"
              >
                Lagre endringer
              </button>
              <DialogClose asChild>
                <button type="button" className="button-secondary">
                  Lukk
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Display selected items */}
      <ul className="flex flex-col">
        {filteredItemsForList.map((item) => (
          <li key={item._id} className="product flex items-center gap-4 py-2">
            <div className="flex flex-grow items-center gap-x-4">
              <div className="h-24 w-24">
                {item.image ? (
                  <img
                    className="rounded-md h-full w-full object-cover"
                    src={urlFor(item.image).url()}
                  />
                ) : (
                  <div className="h-24 w-24 flex items-center placeholder_image">
                    {/* Placeholder SVG */}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-y-2">
                <h2 className="text-xl truncate">{item.name}</h2>
                <div className="flex flex-wrap gap-x-1">
                  {item.size && (
                    <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                      {/* SVG Icon */}
                      {item.size}
                    </p>
                  )}
                  {item.weight && (
                    <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                      {/* SVG Icon */}
                      {item.weight.weight} {item.weight.unit}
                    </p>
                  )}
                  {item.calories && (
                    <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                      {/* SVG Icon */}
                      {item.calories} kcal
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemoveFromList(item)}
                className="button-primary-accent ml-auto"
              >
                Fjern fra liste
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
