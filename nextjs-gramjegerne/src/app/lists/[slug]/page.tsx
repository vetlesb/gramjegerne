"use client";
import { useState, useEffect, useMemo } from "react";
import imageUrlBuilder from "@sanity/image-url";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/sanity/client";
import Icon from "@/components/Icon";
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
  // State variables and Hooks
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [list, setList] = useState<List | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // State for loading
  const [searchQuery, setSearchQuery] = useState(""); // For search functionality
  const [tempSelectedItems, setTempSelectedItems] = useState<Item[]>([]); // Temporary selection state
  const pathname = usePathname();
  const listSlug = pathname?.split("/")[2];

  // Data fetching useEffect
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
        setList(null); // Ensure list is set to null on error
      } finally {
        setIsLoading(false); // Set loading to false after data is fetched or on error
      }
    };

    fetchData();
  }, [listSlug]);

  // Log selected items
  useEffect(() => {
    console.log("Selected Items:", selectedItems);
  }, [selectedItems]);

  // Handle category selection
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
  const filteredItemsForList = useMemo(() => {
    return selectedCategory
      ? selectedItems.filter((item) =>
          item.categories?.some(
            (category) => category._id === selectedCategory,
          ),
        )
      : selectedItems; // When selectedCategory is null, show all items
  }, [selectedItems, selectedCategory]);

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

  // Calculate total weight and calories when 'All Categories' is selected
  const totalWeight = useMemo(() => {
    return filteredItemsForList.reduce((acc, item) => {
      let weight = 0;
      if (item.weight && item.weight.weight) {
        weight = item.weight.weight;
        if (item.weight.unit === "g") {
          weight = weight / 1000; // Convert grams to kilograms
        }
        // Handle other units if necessary
      }
      return acc + weight;
    }, 0);
  }, [filteredItemsForList]);

  // Calculate total calories based on filtered items
  const totalCalories = useMemo(() => {
    return filteredItemsForList.reduce((acc, item) => {
      return acc + (item.calories || 0);
    }, 0);
  }, [filteredItemsForList]);

  // Calculate total items based on filtered items
  const totalItems = useMemo(() => {
    return filteredItemsForList.length;
  }, [filteredItemsForList]);

  // Handle loading state
  if (isLoading) {
    return (
      <main className="container mx-auto min-h-screen p-16">
        <div>Loading...</div>
      </main>
    );
  }

  // Handle list not found
  if (!list) {
    return (
      <main className="container mx-auto min-h-screen p-16">
        <h1 className="text-2xl font-bold mb-4">List Not Found</h1>
      </main>
    );
  }

  return (
    <main className="container mx-auto min-h-screen p-16">
      <h1 className="text-4xl md:text-6xl text-accent py-4 pb-12">
        i {list.name}
      </h1>
      <div className="flex gap-y-4 gap-x-4 pb-8">
        {/* Button to open the Add Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <button className="button-create flex flex-row items-center gap-x-2 text-md">
              Legg til utstyr
              <span className="icon-wrapper">
                <svg
                  className="tag-icon"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M-0.0078125 7.35938C-0.0078125 6.88281 0.390625 6.48438 0.867188 6.48438H5.65625V1.69531C5.65625 1.21875 6.05469 0.820312 6.53125 0.820312C7.00781 0.820312 7.40625 1.21875 7.40625 1.69531V6.48438H12.1953C12.6719 6.48438 13.0703 6.88281 13.0703 7.35938C13.0703 7.84375 12.6719 8.23438 12.1953 8.23438H7.40625V13.0234C7.40625 13.5 7.00781 13.8984 6.53125 13.8984C6.05469 13.8984 5.65625 13.5 5.65625 13.0234V8.23438H0.867188C0.390625 8.23438 -0.0078125 7.84375 -0.0078125 7.35938Z"
                    fill="#EAFFE2"
                  />
                </svg>
              </span>
            </button>
          </DialogTrigger>
          {/* Updated DialogContent */}
          <DialogContent className="dialog p-10 rounded-2xl h-[80vh] no-scrollbar flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl text-accent font-normal">
                Legg til utstyr
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
                        <div className="h-16 w-16">
                          {item.image ? (
                            <img
                              className="rounded-md h-full w-full object-cover"
                              src={urlFor(item.image).url()}
                            />
                          ) : (
                            <div className="h-16 w-16 flex items-center placeholder_image">
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
                        <div className="flex flex-col gap-y-2">
                          <h2 className="text-xl text-accent">{item.name}</h2>
                          <div className="flex flex-wrap gap-x-1">
                            {item.size ? (
                              <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                                <svg
                                  className="tag-icon"
                                  viewBox="0 0 16 8"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M15.3184 2.13477V5.41602C15.3184 6.48242 14.7383 7.05664 13.6602 7.05664H2.33398C1.25586 7.05664 0.675781 6.48242 0.675781 5.41602V2.13477C0.675781 1.0625 1.25 0.488281 2.32812 0.488281H13.6543C14.7324 0.488281 15.3184 1.0625 15.3184 2.13477ZM14.2109 2.31641C14.2109 1.8418 13.9531 1.58398 13.502 1.58398H13.4727V4.24414C13.4727 4.39648 13.3672 4.50781 13.2148 4.50781C13.0684 4.50781 12.9512 4.40234 12.9512 4.25V1.58398H12.4238V3.26562C12.4238 3.41797 12.3242 3.5293 12.1719 3.5293C12.0254 3.5293 11.9082 3.42383 11.9082 3.27148V1.58398H11.3809V3.26562C11.3809 3.41797 11.2754 3.5293 11.123 3.5293C10.9824 3.5293 10.8652 3.42383 10.8652 3.27148V1.58398H10.3379V3.26562C10.3379 3.41797 10.2383 3.5293 10.0801 3.5293C9.93945 3.5293 9.82227 3.42383 9.82227 3.27148V1.58398H9.29492V3.26562C9.29492 3.41797 9.18945 3.5293 9.03711 3.5293C8.89648 3.5293 8.77344 3.42383 8.77344 3.27148V1.58398H8.25195V4.24414C8.25195 4.39648 8.14648 4.50781 7.99414 4.50781C7.85352 4.50781 7.73633 4.40234 7.73633 4.25V1.58398H7.20312V3.26562C7.20312 3.41797 7.10352 3.5293 6.95117 3.5293C6.80469 3.5293 6.6875 3.42383 6.6875 3.27148V1.58398H6.16016V3.26562C6.16016 3.41797 6.05469 3.5293 5.90234 3.5293C5.76172 3.5293 5.64453 3.42383 5.64453 3.27148V1.58398H5.11719V3.26562C5.11719 3.41797 5.01758 3.5293 4.85938 3.5293C4.71875 3.5293 4.60156 3.42383 4.60156 3.27148V1.58398H4.08008V3.26562C4.08008 3.41797 3.97461 3.5293 3.82227 3.5293C3.67578 3.5293 3.55859 3.42383 3.55859 3.27148V1.58398H3.03125V4.24414C3.03125 4.39648 2.92578 4.50781 2.77344 4.50781C2.63281 4.50781 2.51562 4.40234 2.51562 4.25V1.58398H2.48633C2.03516 1.58398 1.77148 1.8418 1.77148 2.31641V5.23438C1.77148 5.70312 2.03516 5.96094 2.48047 5.96094H13.502C13.9531 5.96094 14.2109 5.70312 14.2109 5.23438V2.31641Z"
                                    fill="#EAFFE2"
                                  />
                                </svg>
                                {item.size}
                              </p>
                            ) : null}
                            {item.weight ? (
                              <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                                <svg
                                  className="tag-icon"
                                  viewBox="0 0 13 14"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M0.693374 11.0117L1.98244 5.79102C2.21095 4.86523 2.87892 4.34375 3.82228 4.34375H5.9258V3.79883C5.24025 3.55859 4.73634 2.90234 4.73634 2.14648C4.73634 1.17969 5.53908 0.376953 6.50001 0.376953C7.46095 0.376953 8.26955 1.17969 8.26955 2.14648C8.26955 2.90234 7.76564 3.55859 7.07423 3.79883V4.34375H9.17775C10.127 4.34375 10.7891 4.86523 11.0176 5.79102L12.3067 11.0117C12.6289 12.3066 12.0723 13.0625 10.8184 13.0625H2.18751C0.927749 13.0625 0.376968 12.3066 0.693374 11.0117ZM6.50001 2.9375C6.93947 2.9375 7.30275 2.57422 7.30275 2.14648C7.30275 1.70703 6.93361 1.33789 6.50001 1.33789C6.06642 1.33789 5.70314 1.71289 5.70314 2.14648C5.70314 2.57422 6.06642 2.9375 6.50001 2.9375ZM1.81251 11.0879C1.67189 11.6328 1.88283 11.9141 2.35158 11.9141H10.6543C11.1172 11.9141 11.3281 11.6328 11.1875 11.0879L9.93947 6.14844C9.82228 5.70898 9.56447 5.49219 9.12501 5.49219H3.87501C3.44142 5.49219 3.17775 5.70898 3.06642 6.14844L1.81251 11.0879Z"
                                    fill="#EAFFE2"
                                  />
                                </svg>
                                {item.weight.weight} {item.weight.unit}
                              </p>
                            ) : null}
                            {item.calories ? (
                              <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                                <svg
                                  className="tag-icon"
                                  viewBox="0 0 11 10"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M2.10157 9.70702C1.72266 9.9453 1.37501 9.8242 1.15626 9.60545C0.910162 9.35936 0.824224 9.0078 1.05079 8.64842L4.33594 3.41795C5.08985 2.22264 6.23047 1.87889 7.19141 2.50389C7.11329 1.67967 7.39454 0.574204 7.98047 0.714829C8.30079 0.79686 8.36329 1.17186 8.28126 1.61327C8.75391 1.08592 9.31641 0.761704 9.66407 1.10936C10.0117 1.46092 9.68751 2.02733 9.16407 2.49999C9.60547 2.41405 9.98438 2.47655 10.0664 2.80467C10.207 3.39061 9.08204 3.67186 8.26172 3.58592C8.86719 4.54686 8.52344 5.67577 7.33985 6.41795L2.10157 9.70702ZM3.42579 7.39452C3.53907 7.28124 3.71094 7.27733 3.82813 7.39061L4.08594 7.64842L4.4961 7.39061L4.15235 7.05467C4.03516 6.93749 4.03516 6.76561 4.14844 6.65233C4.26563 6.53514 4.4336 6.53514 4.55079 6.64842L4.99219 7.08202L6.98438 5.83202C8.00782 5.18358 8.15235 4.37108 7.4336 3.64452L7.11329 3.3242C6.4961 2.6992 5.80469 2.71874 5.21094 3.3867L5.94922 4.11717C6.06641 4.23436 6.06641 4.40233 5.95313 4.51952C5.83985 4.6328 5.66797 4.6367 5.55079 4.52342L4.8711 3.85155L4.61719 4.2617L5.04297 4.67967C5.16016 4.79686 5.16016 4.97264 5.04688 5.08592C4.92579 5.1992 4.76172 5.20311 4.64454 5.08592L4.30469 4.75389L1.69922 8.89452C1.62501 9.0117 1.74219 9.12108 1.85938 9.05077L3.58985 7.96092L3.42969 7.79686C3.31251 7.67967 3.31251 7.5078 3.42579 7.39452Z"
                                    fill="#EAFFE2"
                                  />
                                </svg>
                                {item.calories} kcal
                              </p>
                            ) : null}
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

      <div className="flex gap-x-2 no-scrollbar mb-4 p-2s">
        {/* Show categories with items and include "All Categories" button */}
        {filteredCategoriesForList.length > 0 && (
          <>
            <button
              onClick={() => handleCategorySelect(null)} // Set selectedCategory to null for "All Categories"
              className={`menu-category text-md ${
                selectedCategory === null ? "menu-active" : ""
              }`}
            >
              Oversikt
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
      </div>
      {/* Totalt for weight and calories */}

      <ul className="product flex flex-wrap items-center gap-4 py-2">
        <li>
          {" "}
          <div className="flex flex-wrap gap-x-4 items-center">
            <p className="text-lg">Totalt</p>
            <p className="text-xl text-accent">{totalItems} stk</p>
            <p className="text-xl text-accent">{totalWeight.toFixed(3)} kg</p>
            {totalCalories ? (
              <p className="text-xl text-accent">{totalCalories} kcal</p>
            ) : null}
          </div>
        </li>
      </ul>

      {/* Display selected items */}
      <ul className="flex flex-col">
        {filteredItemsForList.map((item) => (
          <li key={item._id} className="product flex items-center gap-4 py-2">
            <div className="flex flex-grow items-center gap-x-4">
              <div className="h-16 w-16">
                {item.image ? (
                  <img
                    className="rounded-md h-full w-full object-cover"
                    src={urlFor(item.image).url()}
                  />
                ) : (
                  <div className="h-16 w-16 flex items-center placeholder_image">
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
              <div className="flex flex-col gap-y-2">
                <h2 className="text-xl text-accent">{item.name}</h2>
                <div className="flex flex-wrap gap-x-1">
                  {item.size ? (
                    <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                      <svg
                        className="tag-icon"
                        viewBox="0 0 16 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15.3184 2.13477V5.41602C15.3184 6.48242 14.7383 7.05664 13.6602 7.05664H2.33398C1.25586 7.05664 0.675781 6.48242 0.675781 5.41602V2.13477C0.675781 1.0625 1.25 0.488281 2.32812 0.488281H13.6543C14.7324 0.488281 15.3184 1.0625 15.3184 2.13477ZM14.2109 2.31641C14.2109 1.8418 13.9531 1.58398 13.502 1.58398H13.4727V4.24414C13.4727 4.39648 13.3672 4.50781 13.2148 4.50781C13.0684 4.50781 12.9512 4.40234 12.9512 4.25V1.58398H12.4238V3.26562C12.4238 3.41797 12.3242 3.5293 12.1719 3.5293C12.0254 3.5293 11.9082 3.42383 11.9082 3.27148V1.58398H11.3809V3.26562C11.3809 3.41797 11.2754 3.5293 11.123 3.5293C10.9824 3.5293 10.8652 3.42383 10.8652 3.27148V1.58398H10.3379V3.26562C10.3379 3.41797 10.2383 3.5293 10.0801 3.5293C9.93945 3.5293 9.82227 3.42383 9.82227 3.27148V1.58398H9.29492V3.26562C9.29492 3.41797 9.18945 3.5293 9.03711 3.5293C8.89648 3.5293 8.77344 3.42383 8.77344 3.27148V1.58398H8.25195V4.24414C8.25195 4.39648 8.14648 4.50781 7.99414 4.50781C7.85352 4.50781 7.73633 4.40234 7.73633 4.25V1.58398H7.20312V3.26562C7.20312 3.41797 7.10352 3.5293 6.95117 3.5293C6.80469 3.5293 6.6875 3.42383 6.6875 3.27148V1.58398H6.16016V3.26562C6.16016 3.41797 6.05469 3.5293 5.90234 3.5293C5.76172 3.5293 5.64453 3.42383 5.64453 3.27148V1.58398H5.11719V3.26562C5.11719 3.41797 5.01758 3.5293 4.85938 3.5293C4.71875 3.5293 4.60156 3.42383 4.60156 3.27148V1.58398H4.08008V3.26562C4.08008 3.41797 3.97461 3.5293 3.82227 3.5293C3.67578 3.5293 3.55859 3.42383 3.55859 3.27148V1.58398H3.03125V4.24414C3.03125 4.39648 2.92578 4.50781 2.77344 4.50781C2.63281 4.50781 2.51562 4.40234 2.51562 4.25V1.58398H2.48633C2.03516 1.58398 1.77148 1.8418 1.77148 2.31641V5.23438C1.77148 5.70312 2.03516 5.96094 2.48047 5.96094H13.502C13.9531 5.96094 14.2109 5.70312 14.2109 5.23438V2.31641Z"
                          fill="#EAFFE2"
                        />
                      </svg>
                      {item.size}
                    </p>
                  ) : null}
                  {item.weight ? (
                    <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                      <svg
                        className="tag-icon"
                        viewBox="0 0 13 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M0.693374 11.0117L1.98244 5.79102C2.21095 4.86523 2.87892 4.34375 3.82228 4.34375H5.9258V3.79883C5.24025 3.55859 4.73634 2.90234 4.73634 2.14648C4.73634 1.17969 5.53908 0.376953 6.50001 0.376953C7.46095 0.376953 8.26955 1.17969 8.26955 2.14648C8.26955 2.90234 7.76564 3.55859 7.07423 3.79883V4.34375H9.17775C10.127 4.34375 10.7891 4.86523 11.0176 5.79102L12.3067 11.0117C12.6289 12.3066 12.0723 13.0625 10.8184 13.0625H2.18751C0.927749 13.0625 0.376968 12.3066 0.693374 11.0117ZM6.50001 2.9375C6.93947 2.9375 7.30275 2.57422 7.30275 2.14648C7.30275 1.70703 6.93361 1.33789 6.50001 1.33789C6.06642 1.33789 5.70314 1.71289 5.70314 2.14648C5.70314 2.57422 6.06642 2.9375 6.50001 2.9375ZM1.81251 11.0879C1.67189 11.6328 1.88283 11.9141 2.35158 11.9141H10.6543C11.1172 11.9141 11.3281 11.6328 11.1875 11.0879L9.93947 6.14844C9.82228 5.70898 9.56447 5.49219 9.12501 5.49219H3.87501C3.44142 5.49219 3.17775 5.70898 3.06642 6.14844L1.81251 11.0879Z"
                          fill="#EAFFE2"
                        />
                      </svg>
                      {item.weight.weight} {item.weight.unit}
                    </p>
                  ) : null}
                  {item.calories ? (
                    <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                      <svg
                        className="tag-icon"
                        viewBox="0 0 11 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2.10157 9.70702C1.72266 9.9453 1.37501 9.8242 1.15626 9.60545C0.910162 9.35936 0.824224 9.0078 1.05079 8.64842L4.33594 3.41795C5.08985 2.22264 6.23047 1.87889 7.19141 2.50389C7.11329 1.67967 7.39454 0.574204 7.98047 0.714829C8.30079 0.79686 8.36329 1.17186 8.28126 1.61327C8.75391 1.08592 9.31641 0.761704 9.66407 1.10936C10.0117 1.46092 9.68751 2.02733 9.16407 2.49999C9.60547 2.41405 9.98438 2.47655 10.0664 2.80467C10.207 3.39061 9.08204 3.67186 8.26172 3.58592C8.86719 4.54686 8.52344 5.67577 7.33985 6.41795L2.10157 9.70702ZM3.42579 7.39452C3.53907 7.28124 3.71094 7.27733 3.82813 7.39061L4.08594 7.64842L4.4961 7.39061L4.15235 7.05467C4.03516 6.93749 4.03516 6.76561 4.14844 6.65233C4.26563 6.53514 4.4336 6.53514 4.55079 6.64842L4.99219 7.08202L6.98438 5.83202C8.00782 5.18358 8.15235 4.37108 7.4336 3.64452L7.11329 3.3242C6.4961 2.6992 5.80469 2.71874 5.21094 3.3867L5.94922 4.11717C6.06641 4.23436 6.06641 4.40233 5.95313 4.51952C5.83985 4.6328 5.66797 4.6367 5.55079 4.52342L4.8711 3.85155L4.61719 4.2617L5.04297 4.67967C5.16016 4.79686 5.16016 4.97264 5.04688 5.08592C4.92579 5.1992 4.76172 5.20311 4.64454 5.08592L4.30469 4.75389L1.69922 8.89452C1.62501 9.0117 1.74219 9.12108 1.85938 9.05077L3.58985 7.96092L3.42969 7.79686C3.31251 7.67967 3.31251 7.5078 3.42579 7.39452Z"
                          fill="#EAFFE2"
                        />
                      </svg>
                      {item.calories} kcal
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                onClick={() => handleRemoveFromList(item)}
                className="button-ghost flex gap-x-2 h-fit ml-auto align-middle"
              >
                <Icon name="delete" width={24} height={24} fill="#EAFFE2" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
