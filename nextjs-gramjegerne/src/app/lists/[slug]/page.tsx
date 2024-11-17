"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import imageUrlBuilder from "@sanity/image-url";
import Image from "next/image";
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
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { nanoid } from "nanoid";
import { useSession } from "next-auth/react";

// Define Category and Item types
interface Category {
  _id: string;
  title: string;
}

interface Item {
  _id: string;
  name: string;
  category: Category;
  image?: {
    _type: string;
    asset: {
      _ref: string;
      _type: string;
    };
  };
  size?: string;
  weight?: {
    weight: number;
    unit: string;
  };
  calories?: number;
}

interface ListItem {
  _key: string;
  _type: string;
  quantity?: number;
  item: Item | null;
}

interface List {
  _id: string;
  name: string;
  items: ListItem[];
}

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

const ITEMS_QUERY = `*[_type == "item" && user._ref == $userId] {
  _id,
  name,
  "category": category->{
    _id,
    title
  },
  image,
  size,
  weight{
    weight,
    unit
  },
  calories
} | order(name asc)`;

const LIST_QUERY = (
  slug: string,
) => `*[_type == "list" && slug.current == "${slug}" && user._ref == $userId][0] {
  _id,
  name,
  days,
  weight,
  participants,
  image,
  "items": items[] {
    _key,
    _type,
    quantity,
    "item": item->{
      _id,
      name,
      weight,
      image,
      calories,
      size,
      "category": category->{
        _id,
        title
      }
    }
  }
}`;

// First, let's create a more specific type for our filtered items
interface ValidListItem extends ListItem {
  item: Item; // This removes the null possibility
  quantity: number; // This makes quantity required
}

export default function ListPage() {
  const { data: session } = useSession();

  // Move getUserId into useCallback
  const getUserId = useCallback(() => {
    if (!session?.user?.id) return null;
    return session.user.id.startsWith("google_")
      ? session.user.id
      : `google_${session.user.id}`;
  }, [session?.user?.id]);

  // State variables and Hooks
  const [items, setItems] = useState<Item[]>([]);
  const [list, setList] = useState<List | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<ListItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelectedItems, setTempSelectedItems] = useState<Item[]>([]);
  const pathname = usePathname();
  const listSlug = pathname?.split("/")[2];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add state for optimistic updates
  const [pendingQuantities, setPendingQuantities] = useState<{
    [key: string]: number;
  }>({});

  // Keep this as our single source of truth for categories
  const categories = useMemo(() => {
    if (!selectedItems?.length) return [];

    // Get unique categories from selected items
    const uniqueCategories = new Map<string, Category>();

    selectedItems.forEach((listItem) => {
      if (listItem.item?.category) {
        const cat = listItem.item.category;
        uniqueCategories.set(cat._id, cat);
      }
    });

    return Array.from(uniqueCategories.values()).sort((a, b) =>
      a.title.localeCompare(b.title, "nb"),
    );
  }, [selectedItems]);

  // Add initial data fetch useEffect
  useEffect(() => {
    const fetchData = async () => {
      const userId = getUserId();
      if (!listSlug || !userId) return;

      try {
        const fetchedList = await client.fetch(LIST_QUERY(listSlug), {
          userId,
        });
        if (fetchedList) {
          setList(fetchedList);
          setSelectedItems(fetchedList.items);
        }
      } catch (error) {
        console.error("Error fetching list:", error);
        setError("Failed to load list");
      }
    };

    fetchData();
  }, [listSlug, session?.user?.id, getUserId]);

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

  const handleRemoveFromList = async (itemToRemove: Item) => {
    try {
      if (!list || !session?.user?.id) return;
      const userId = getUserId();
      if (!userId) return;

      // Optimistically update the UI first
      const updatedItems = currentItems.filter(
        (item) => item.item?._id !== itemToRemove._id,
      );

      // Update local state immediately
      setPendingQuantities((prev) => {
        const newPending = { ...prev };
        // Remove any pending quantities for the removed item
        const itemKey = currentItems.find(
          (item) => item.item?._id === itemToRemove._id,
        )?._key;
        if (itemKey) {
          delete newPending[itemKey];
        }
        return newPending;
      });

      // Prepare the items for Sanity update
      const itemsForUpdate = updatedItems.map((item) => ({
        _key: item._key,
        _type: "listItem",
        item: {
          _type: "reference",
          _ref: item.item?._id,
        },
        quantity: item.quantity || 1,
      }));

      // First verify the list belongs to the user
      const userList = await client.fetch(
        `*[_type == "list" && _id == $listId && user._ref == $userId][0]._id`,
        {
          listId: list._id,
          userId,
        },
      );

      if (!userList) {
        throw new Error("Unauthorized to modify this list");
      }

      // Update in Sanity
      const response = await fetch("/api/updateList", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: list._id,
          items: itemsForUpdate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update list");
      }

      // Only after successful server update, update the actual state
      setSelectedItems(updatedItems);
    } catch (error) {
      console.error("Error removing item:", error);
      // Revert optimistic update on error by refetching
      const userId = getUserId();
      if (!userId) return;

      const fetchedList = await client.fetch(LIST_QUERY(listSlug), {
        userId,
      });
      if (fetchedList) {
        setList(fetchedList);
        setSelectedItems(fetchedList.items);
      }
    }
  };

  // Create a single source of truth for current items
  const currentItems = useMemo(() => {
    return selectedItems.map((item) => ({
      ...item,
      quantity:
        pendingQuantities[item._key] !== undefined
          ? pendingQuantities[item._key]
          : item.quantity || 1,
    }));
  }, [selectedItems, pendingQuantities]);

  // Single definition of filteredItemsForList
  const filteredItemsForList = useMemo(() => {
    if (!currentItems) return [];

    // Create a Map to deduplicate items by _id
    const uniqueItems = new Map();

    currentItems.forEach((item) => {
      if (item?.item?._id) {
        uniqueItems.set(item.item._id, item);
      }
    });

    return Array.from(uniqueItems.values())
      .filter((item) => {
        const isValidItem =
          item?.item?._id && item?.item?.name && item?.item?.category?._id;
        const matchesCategory =
          selectedCategory === null ||
          item?.item?.category?._id === selectedCategory;
        return isValidItem && matchesCategory;
      })
      .sort((a, b) => {
        const nameA = a.item?.name || "";
        const nameB = b.item?.name || "";
        return nameA.localeCompare(nameB, "nb");
      });
  }, [currentItems, selectedCategory]);

  // Filter items based on the search query in the dialog
  const filteredItemsForDialog = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch = searchQuery
          ? item.name.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        const notAlreadyInList = !selectedItems.some(
          (selectedItem) => selectedItem.item?._id === item._id,
        );
        return matchesSearch && notAlreadyInList;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "nb"));
  }, [items, searchQuery, selectedItems]);

  // When the dialog opens, initialize tempSelectedItems with current selectedItems
  const handleDialogOpenChange = (isOpen: boolean) => {
    setIsDialogOpen(isOpen);
    if (isOpen) {
      setTempSelectedItems(
        selectedItems
          .map((item) => item.item)
          .filter((item): item is Item => item !== null),
      );
      setSearchQuery(""); // Clear search query when dialog opens
    }
  };

  // Calculate total weight and calories when 'All Categories' is selected
  const calculateTotalWeight = () => {
    const itemsToCalculate =
      selectedCategory === null
        ? currentItems
        : currentItems.filter(
            (item) => item.item?.category?._id === selectedCategory,
          );

    return itemsToCalculate.reduce((total, listItem) => {
      if (!listItem.item?.weight) return total;
      const quantity = listItem.quantity || 1;
      const weight = listItem.item.weight.weight;
      const weightMultiplier = listItem.item.weight.unit === "kg" ? 1 : 0.001;
      return total + weight * quantity * weightMultiplier;
    }, 0);
  };

  // Calculate total calories based on filtered items
  const totalCalories = useMemo(() => {
    const itemsToCalculate =
      selectedCategory === null
        ? currentItems
        : currentItems.filter(
            (item) => item.item?.category?._id === selectedCategory,
          );

    return itemsToCalculate.reduce(
      (total, listItem) =>
        total + (listItem.item?.calories || 0) * (listItem.quantity || 1),
      0,
    );
  }, [currentItems, selectedCategory]);

  // Calculate total items based on filtered items
  const totalItems = useMemo(() => {
    const itemsToCalculate =
      selectedCategory === null
        ? currentItems
        : currentItems.filter(
            (item) => item.item?.category?._id === selectedCategory,
          );

    return itemsToCalculate.reduce(
      (total, item) => total + (item.quantity || 1),
      0,
    );
  }, [currentItems, selectedCategory]);

  // Update calculateCategoryTotals to use currentItems
  const calculateCategoryTotals = (items: Item[]) => {
    const categoryTotals: {
      [key: string]: {
        title: string;
        weight: number;
        items: number;
        calories: number;
      };
    } = {};

    items.forEach((item) => {
      if (!item?.category) return;

      const categoryTitle = item.category.title;
      const categoryId = item.category._id;

      if (selectedCategory === null || categoryId === selectedCategory) {
        if (!categoryTotals[categoryTitle]) {
          categoryTotals[categoryTitle] = {
            title: categoryTitle,
            weight: 0,
            items: 0,
            calories: 0,
          };
        }

        // Find the current quantity using currentItems instead of selectedItems
        const listItem = currentItems.find((si) => si.item?._id === item._id);
        const quantity = listItem?.quantity || 1;

        const itemWeight = item.weight?.weight || 0;
        const weightMultiplier = item.weight?.unit === "kg" ? 1 : 0.001;
        const weightInKg = itemWeight * weightMultiplier;

        categoryTotals[categoryTitle].weight += weightInKg * quantity;
        categoryTotals[categoryTitle].items += quantity;

        if (item.calories && item.calories > 0) {
          categoryTotals[categoryTitle].calories += item.calories * quantity;
        }
      }
    });

    return Object.values(categoryTotals);
  };

  // Update the handleSaveChanges function
  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      const userId = getUserId();

      if (!list || !listSlug || !userId) {
        throw new Error("Missing required data");
      }

      // Keep existing items with their current quantities
      const existingItems = selectedItems.map((item) => ({
        _key: item._key,
        _type: "listItem",
        item: {
          _type: "reference",
          _ref: item.item?._id,
        },
        quantity: item.quantity || 1,
      }));

      // Add only truly new items
      const newItems = tempSelectedItems
        .filter(
          (newItem) =>
            !selectedItems.some(
              (existing) => existing.item?._id === newItem._id,
            ),
        )
        .map((item) => ({
          _key: nanoid(),
          _type: "listItem",
          item: {
            _type: "reference",
            _ref: item._id,
          },
          quantity: 1,
        }));

      // Update in Sanity
      const response = await fetch("/api/updateList", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: list._id,
          items: [...existingItems, ...newItems],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update list");
      }

      // Fetch fresh data instead of updating state directly
      const fetchedList = await client.fetch(LIST_QUERY(listSlug), {
        userId,
      });

      if (fetchedList) {
        setList(fetchedList);
        setSelectedItems(fetchedList.items);
      }

      setTempSelectedItems([]);
      setIsDialogOpen(false);
      setIsLoading(false);
    } catch (err) {
      console.error("Error saving changes:", err);
      setIsLoading(false);
    }
  };

  // Update quantity change handler
  const handleQuantityChange = async (itemKey: string, newQuantity: number) => {
    if (!list || !session?.user?.id || newQuantity < 1) return;

    // Update pending quantities immediately for optimistic UI
    setPendingQuantities((prev) => ({
      ...prev,
      [itemKey]: newQuantity,
    }));

    // Also update selectedItems for persistence
    setSelectedItems((prev) =>
      prev.map((item) =>
        item._key === itemKey ? { ...item, quantity: newQuantity } : item,
      ),
    );

    try {
      // Prepare items for server update
      const itemsForUpdate = currentItems
        .filter((item): item is ValidListItem => {
          return (
            item.item !== null &&
            typeof item.item._id === "string" &&
            typeof item.quantity === "number"
          );
        })
        .map((item) => ({
          _key: item._key,
          _type: "listItem",
          item: {
            _type: "reference",
            _ref: item.item._id,
          },
          quantity: item._key === itemKey ? newQuantity : item.quantity,
        }));

      if (itemsForUpdate.length === 0) return;

      const response = await fetch("/api/updateList", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: list._id,
          items: itemsForUpdate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update quantity");
      }

      // Clear pending after successful update
      setPendingQuantities((prev) => {
        const newPending = { ...prev };
        delete newPending[itemKey];
        return newPending;
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      // Revert both optimistic updates on error
      setPendingQuantities((prev) => {
        const newPending = { ...prev };
        delete newPending[itemKey];
        return newPending;
      });
      setSelectedItems((prev) =>
        prev.map((item) =>
          item._key === itemKey
            ? { ...item, quantity: item.quantity || 1 }
            : item,
        ),
      );
    }
  };

  // Update the useEffect for dialog items
  useEffect(() => {
    const fetchItems = async () => {
      if (isDialogOpen && session?.user?.id) {
        // Add session check
        try {
          console.log("Fetching items...");
          const fetchedItems = await client.fetch(ITEMS_QUERY, {
            userId: session.user.id, // Add userId parameter
          });
          console.log("Fetched items:", fetchedItems);
          setItems(fetchedItems);
        } catch (error) {
          console.error("Error fetching items:", error);
        }
      }
    };

    fetchItems();
  }, [isDialogOpen, session?.user?.id]); // Add session?.user?.id to dependencies

  // First, let's add a loading and error state check at the start of the component render
  if (error) {
    return (
      <ProtectedRoute>
        <main className="container mx-auto min-h-screen p-16">
          <div className="text-red-500">{error}</div>
        </main>
      </ProtectedRoute>
    );
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <main className="container mx-auto min-h-screen p-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-accent"></div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (!list) {
    // Add !list check here
    return (
      <ProtectedRoute>
        <main className="container mx-auto min-h-screen p-16">
          <div className="text-accent text-xl">List not found</div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
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
            <DialogContent className="dialog p-4 md:p-10 rounded-2xl h-[80vh] no-scrollbar flex flex-col">
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
              <div className="flex-grow overflow-y-auto max-h-[60vh] no-scrollbar">
                {items.length === 0 ? (
                  <p>Laster utstyr...</p>
                ) : filteredItemsForDialog.length === 0 ? (
                  <p>Ingen treff</p>
                ) : (
                  <ul className="flex flex-col">
                    {filteredItemsForDialog.map((item) => (
                      <li
                        key={item._id}
                        className={`product-search flex items-center gap-4 py-2 cursor-pointer ${
                          tempSelectedItems.some(
                            (selected) => selected._id === item._id,
                          )
                            ? "active"
                            : ""
                        }`}
                        onClick={() => handleTempItemToggle(item)}
                      >
                        <div className="flex flex-grow items-center gap-x-4">
                          <div className="h-16 w-16">
                            {item?.image ? (
                              <Image
                                className="rounded-md h-full w-full object-cover"
                                src={urlFor(item.image).url()}
                                alt={`Bilde av ${item?.name || "item"}`}
                                width={64}
                                height={64}
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
                            <h2 className="text-xl">{item?.name}</h2>
                            <div className="flex flex-wrap gap-x-1">
                              {item?.size && (
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
                              )}
                              {item?.weight && (
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
                              )}
                              {item?.calories && item.calories > 0 && (
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
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DialogFooter>
                <button
                  onClick={handleSaveChanges}
                  disabled={tempSelectedItems.length === 0}
                  className="button-primary"
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
          {categories.length > 0 && (
            <>
              <button
                onClick={() => handleCategorySelect(null)}
                className={`menu-category text-md ${
                  selectedCategory === null ? "menu-active" : ""
                }`}
              >
                Oversikt
              </button>
              {categories.map((category) => (
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

        <ul className="product flex flex-wrap items-center gap-4">
          <li>
            {selectedCategory === null && ( // Only show in overview
              <div className="flex flex-col gap-y-4 py-4">
                {calculateCategoryTotals(
                  selectedItems
                    .map((item) => item.item)
                    .filter((item): item is Item => item !== null),
                )
                  .sort((a, b) => a.title.localeCompare(b.title, "nb"))
                  .map((categoryTotal) => (
                    <div
                      key={categoryTotal.title}
                      className="flex items-center gap-x-4 border-b border-white/5 pb-4"
                    >
                      <h3 className="text-xl w-32">{categoryTotal.title}</h3>
                      <div className="flex gap-x-4">
                        <p className="text-xl w-32">
                          {categoryTotal.weight.toFixed(3)} kg
                        </p>
                        <p className="text-xl w-32">
                          {categoryTotal.items} stk
                        </p>
                        {categoryTotal.calories > 0 && (
                          <p className="text-xl w-32">
                            {categoryTotal.calories} kcal
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 items-center">
              <p className="text-xl text-accent w-32">Totalt</p>
              <p className="text-xl text-accent w-32">
                {calculateTotalWeight().toFixed(3)} kg
              </p>
              <p className="text-xl text-accent w-32">{totalItems} stk</p>
              {totalCalories > 0 && (
                <p className="text-xl text-accent w-32">{totalCalories} kcal</p>
              )}
            </div>
          </li>
        </ul>

        {/* Display selected items */}
        <ul className="flex flex-col divide-y divide-white/5">
          {filteredItemsForList.map((listItem) => {
            console.log("Rendering item:", listItem);
            return (
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
                      <div className="h-16 w-16 flex items-center placeholder_image">
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
                    <h2 className="text-xl text-accent">
                      {listItem.item?.name || "Unnamed Item"}
                    </h2>
                    <div className="flex flex-wrap gap-x-1">
                      {listItem.item?.size && (
                        <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                          {listItem.item.size}
                        </p>
                      )}
                      {listItem.item?.weight && (
                        <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                          {listItem.item.weight.weight}{" "}
                          {listItem.item.weight.unit}
                        </p>
                      )}
                      {listItem.item?.calories &&
                        listItem.item.calories > 0 && (
                          <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                            {listItem.item.calories} kcal
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-x-2 ml-auto">
                    <div className="flex items-center gap-x-2 bg-white/5 rounded px-2 py-1">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            listItem._key,
                            (listItem.quantity || 1) - 1,
                          )
                        }
                        disabled={(listItem.quantity || 1) <= 1}
                        className="p-1 hover:bg-gray-700 rounded disabled:opacity-50"
                      >
                        –
                      </button>
                      <span className="text-sm min-w-[2rem] text-center">
                        {pendingQuantities[listItem._key] !== undefined
                          ? pendingQuantities[listItem._key]
                          : listItem.quantity || 1}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            listItem._key,
                            (listItem.quantity || 1) + 1,
                          )
                        }
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        listItem.item && handleRemoveFromList(listItem.item)
                      }
                      className="button-ghost flex gap-x-2 h-fit align-middle"
                    >
                      <Icon
                        name="delete"
                        width={24}
                        height={24}
                        fill="#EAFFE2"
                      />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </ProtectedRoute>
  );
}
