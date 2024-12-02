"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import imageUrlBuilder from "@sanity/image-url";
import Image from "next/image";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "@/sanity/client";
import { ShareButton } from "@/components/ShareButton";
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
  DialogDescription,
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
  categoryOverride?: Category;
}

interface List {
  _id: string;
  name: string;
  participants: number;
  days: number;
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
    categoryOverride->{
      _id,
      title
    },
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

const CATEGORIES_QUERY = `*[_type == "category" && user._ref == $userId] {
  _id,
  title
} | order(title asc)`;

// Add this interface for category totals
interface CategoryTotal {
  id: string;
  count: number;
  weight: number;
  calories: number;
  title: string;
}

// Add this interface for override totals
interface OverrideTotal {
  categoryId: string;
  categoryTitle: string;
  count: number;
  weight: number;
  calories: number;
}

// Update the formatWeight function
const formatWeight = (weightInGrams: number): string => {
  const weightInKg = weightInGrams / 1000;
  // Always use 3 decimals for precision
  return `${weightInKg.toFixed(3)} kg`;
};

// Add this sorting function at component level
const sortListItems = (items: ListItem[]): ListItem[] => {
  return [...items].sort((a, b) => {
    const nameA = a.item?.name || "";
    const nameB = b.item?.name || "";
    return nameA.localeCompare(nameB, "nb");
  });
};

export default function ListPage() {
  const { data: session } = useSession();

  // Move getUserId into useCallback
  const getUserId = useCallback(() => {
    if (!session?.user?.id) return null;
    return session.user.id.startsWith("google_")
      ? session.user.id
      : `google_${session.user.id}`;
  }, [session?.user?.id]);

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };
  // Move getEffectiveCategory inside the component
  const getEffectiveCategory = useCallback(
    (listItem: ListItem): Category | undefined => {
      return listItem.categoryOverride || listItem.item?.category;
    },
    [],
  );

  // State variables and Hooks
  const [items, setItems] = useState<Item[]>([]);
  const [list, setList] = useState<List | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<ListItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery] = useState("");
  const [tempSelectedItems, setTempSelectedItems] = useState<Item[]>([]);
  const pathname = usePathname();
  const listSlug = pathname?.split("/")[2];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add state for optimistic updates
  const [pendingQuantities, setPendingQuantities] = useState<{
    [key: string]: number;
  }>({});

  // Add these new state variables
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);

  // Add a new state for dialog search
  const [dialogSearchQuery, setDialogSearchQuery] = useState("");

  // Keep this as our single source of truth for categories
  const categories = useMemo((): Category[] => {
    if (!selectedItems?.length) return [];

    // Get categories that actually have items
    const activeCategories = new Map<string, Category>();

    selectedItems.forEach((listItem) => {
      if (!listItem.item) return;

      // Get the effective category (override or original)
      const effectiveCategory =
        listItem.categoryOverride || listItem.item?.category;
      if (effectiveCategory) {
        activeCategories.set(effectiveCategory._id, effectiveCategory);
      }
    });

    return Array.from(activeCategories.values()).sort(
      (a: Category, b: Category) => a.title.localeCompare(b.title, "nb"),
    );
  }, [selectedItems]);

  // Add initial data fetch useEffect
  useEffect(() => {
    const fetchData = async () => {
      const userId = getUserId();
      if (!listSlug || !userId) return;

      try {
        const [fetchedList, fetchedCategories] = await Promise.all([
          client.fetch(LIST_QUERY(listSlug), { userId }),
          client.fetch(CATEGORIES_QUERY, { userId }),
        ]);

        if (fetchedList) {
          setList(fetchedList);
          setSelectedItems(fetchedList.items);
        }
        setAllCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data");
      }
    };

    fetchData();
  }, [listSlug, getUserId]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  // Update handleTempItemToggle to track existing overrides
  const handleTempItemToggle = useCallback((item: Item) => {
    setTempSelectedItems((prev) => {
      const isSelected = prev.some((selected) => selected._id === item._id);
      if (isSelected) {
        return prev.filter((selected) => selected._id !== item._id);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const handleRemoveFromList = async (itemToRemove: Item) => {
    if (!list) return;

    try {
      const updatedItems = selectedItems.filter(
        (listItem) => listItem.item?._id !== itemToRemove._id,
      );

      // Prepare the data for the API
      const sanityItems = updatedItems.map((item) => ({
        _key: item._key,
        _type: item._type,
        quantity: item.quantity,
        item: item.item ? { _ref: item.item._id, _type: "reference" } : null,
        ...(item.categoryOverride
          ? {
              categoryOverride: {
                _ref: item.categoryOverride._id,
                _type: "reference",
              },
            }
          : {}),
      }));

      // Update through API route
      const response = await fetch("/api/updateList", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listId: list._id,
          items: sanityItems,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update list");
      }

      setSelectedItems(updatedItems);
    } catch (error) {
      console.error("Failed to remove item:", error);
      alert("Failed to remove item. Please try again.");
    }
  };

  // Update the filteredItemsForList useMemo
  const filteredItemsForList = useMemo(() => {
    let items = selectedItems;

    if (selectedCategory) {
      items = items.filter((item) => {
        const effectiveCategory = getEffectiveCategory(item);
        return effectiveCategory?._id === selectedCategory;
      });
    }

    if (searchQuery) {
      items = items.filter((item) =>
        item.item?.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return sortListItems(items);
  }, [selectedItems, selectedCategory, searchQuery, getEffectiveCategory]);

  // Update the filteredItemsForDialog to use dialogSearchQuery instead
  const filteredItemsForDialog = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch = dialogSearchQuery
          ? item.name.toLowerCase().includes(dialogSearchQuery.toLowerCase()) ||
            item.category.title
              .toLowerCase()
              .includes(dialogSearchQuery.toLowerCase())
          : true;
        const notAlreadyInList = !selectedItems.some(
          (selectedItem) => selectedItem.item?._id === item._id,
        );
        return matchesSearch && notAlreadyInList;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "nb"));
  }, [items, dialogSearchQuery, selectedItems]);

  // Update the dialog open handler to clear the dialog search
  const handleDialogOpenChange = (isOpen: boolean) => {
    setIsDialogOpen(isOpen);
    if (isOpen) {
      setTempSelectedItems(
        selectedItems
          .map((item) => item.item)
          .filter((item): item is Item => item !== null),
      );
      setDialogSearchQuery(""); // Clear dialog search query when dialog opens
    }
  };

  // Update the categoryTotals calculation
  const { categoryTotals, grandTotal, overrideTotals, totalWithoutOverrides } =
    useMemo(() => {
      if (!selectedItems?.length) {
        const emptyTotal = {
          id: "total",
          count: 0,
          weight: 0,
          calories: 0,
          title: "Totalt",
        };
        return {
          categoryTotals: [],
          grandTotal: emptyTotal,
          overrideTotals: [],
          totalWithoutOverrides: emptyTotal,
        };
      }

      // Create maps for both regular and override totals
      const categoryMap = new Map<string, CategoryTotal>();
      const overrideMap = new Map<string, OverrideTotal>();

      // Calculate totals
      selectedItems.forEach((item) => {
        if (!item.item) return;
        const quantity = item.quantity || 1;
        const effectiveCategory = getEffectiveCategory(item);
        if (!effectiveCategory) return;

        // If this item has a category override, add it to overrides
        if (item.categoryOverride) {
          const existing = overrideMap.get(item.categoryOverride._id) || {
            categoryId: item.categoryOverride._id,
            categoryTitle: item.categoryOverride.title,
            count: 0,
            weight: 0,
            calories: 0,
          };

          existing.count += quantity;
          if (item.item.weight) {
            existing.weight += item.item.weight.weight * quantity;
          }
          if (item.item.calories) {
            existing.calories += item.item.calories * quantity;
          }

          overrideMap.set(item.categoryOverride._id, existing);
        }

        // Regular category totals calculation (unchanged)
        const existing = categoryMap.get(effectiveCategory._id) || {
          id: effectiveCategory._id,
          count: 0,
          weight: 0,
          calories: 0,
          title: effectiveCategory.title,
        };

        existing.count += quantity;
        if (item.item.weight) {
          existing.weight += item.item.weight.weight * quantity;
        }
        if (item.item.calories) {
          existing.calories += item.item.calories * quantity;
        }

        categoryMap.set(effectiveCategory._id, existing);
      });

      const categoryTotals = Array.from(categoryMap.values()).sort((a, b) =>
        a.title.localeCompare(b.title, "nb"),
      );

      const overrideTotals = Array.from(overrideMap.values()).sort((a, b) =>
        a.categoryTitle.localeCompare(b.categoryTitle, "nb"),
      );

      // Calculate grand total
      const grandTotal = categoryTotals.reduce(
        (acc, cat) => ({
          id: "total",
          title: "Totalt",
          count: acc.count + cat.count,
          weight: acc.weight + cat.weight,
          calories: acc.calories + cat.calories,
        }),
        { id: "total", title: "Totalt", count: 0, weight: 0, calories: 0 },
      );

      // Calculate total without overrides
      const totalWithoutOverrides = {
        id: "total-no-override",
        title: "Totalt uten overkjøringer",
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
    }, [selectedItems, getEffectiveCategory]);

  // Update the handleSaveChanges function
  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      const userId = getUserId();

      if (!list || !listSlug || !userId) {
        throw new Error("Missing required data");
      }

      // Keep existing items with their current quantities AND category overrides
      const existingItems = selectedItems.map((item) => ({
        _key: item._key,
        _type: "listItem",
        item: {
          _type: "reference",
          _ref: item.item?._id,
        },
        quantity: item.quantity || 1,
        // Preserve category override if it exists
        categoryOverride: item.categoryOverride
          ? {
              _type: "reference",
              _ref: item.categoryOverride._id,
            }
          : undefined,
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

      console.log("Saving items with overrides:", existingItems);

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

      // Fetch fresh data
      const fetchedList = await client.fetch(LIST_QUERY(listSlug), {
        userId,
      });

      if (fetchedList) {
        setList(fetchedList);
        setSelectedItems(fetchedList.items);
      }

      // Close the dialog after saving
      setIsDialogOpen(false); // Close the dialog here
    } catch (err) {
      console.error("Error saving changes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = async (itemKey: string, newQuantity: number) => {
    if (!list || !session?.user?.id || newQuantity < 1) return;

    // Update pending quantities immediately for optimistic UI
    setPendingQuantities((prev) => ({
      ...prev,
      [itemKey]: newQuantity,
    }));

    // Update selectedItems to reflect the new quantity while preserving category overrides
    setSelectedItems((prev) => {
      const updatedItems = prev.map((item) =>
        item._key === itemKey
          ? {
              ...item,
              quantity: newQuantity, // Update quantity
              categoryOverride: item.categoryOverride, // Ensure categoryOverride is preserved
            }
          : item,
      );

      console.log("Updated selectedItems:", updatedItems); // Log updated items
      return updatedItems;
    });

    try {
      // Prepare items for server update
      const itemsForUpdate = selectedItems.map((item) => ({
        _key: item._key,
        _type: "listItem",
        item: {
          _type: "reference",
          _ref: item.item?._id,
        },
        quantity: item._key === itemKey ? newQuantity : item.quantity,
        categoryOverride: item.categoryOverride // Preserve category override
          ? {
              _type: "reference",
              _ref: item.categoryOverride._id,
            }
          : undefined,
      }));

      console.log("Items for update:", itemsForUpdate); // Log items being sent to the API

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

  // Add the category update handler
  const handleCategoryUpdate = async (categoryId: string | null) => {
    if (!editingItemKey || !list) return;

    try {
      const updatedItems = selectedItems.map((item: ListItem) => {
        if (item._key !== editingItemKey) return item;

        // If categoryId is null, remove the override
        if (categoryId === null) {
          return {
            ...item,
            categoryOverride: undefined, // Remove override
          };
        }

        // Find the new category
        const newCategory = allCategories.find((cat) => cat._id === categoryId);
        if (!newCategory) return item;

        // Return updated item with new category override
        return {
          ...item,
          categoryOverride: newCategory,
        };
      });

      // Prepare the data for the API
      const sanityItems = updatedItems.map((item) => ({
        _key: item._key,
        _type: "listItem",
        quantity: item.quantity || 1,
        item: item.item ? { _ref: item.item._id, _type: "reference" } : null,
        ...(item.categoryOverride
          ? {
              categoryOverride: {
                _ref: item.categoryOverride._id,
                _type: "reference",
              },
            }
          : {}),
      }));

      // Update through API route
      const response = await fetch("/api/updateList", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listId: list._id,
          items: sanityItems,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update list");
      }

      // Update local state
      setSelectedItems(updatedItems);
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Failed to update category. Please try again.");
    }
  };

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
        <h1 className="text-4xl md:text-6xl text-accent py-4">i {list.name}</h1>
        <div className="flex flex-wrap gap-x-1 gap-y-1 pb-12">
          <p className="tag-list w-fit items-center gap-x-1 flex flex-wrap">
            <svg
              className="tag-icon"
              viewBox="0 0 14 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.00781 7.32812C5.1875 7.32812 3.72656 5.73438 3.72656 3.74219C3.72656 1.80469 5.20312 0.234375 7.00781 0.234375C8.82031 0.234375 10.2891 1.78906 10.2891 3.73438C10.2891 5.73438 8.82812 7.32812 7.00781 7.32812ZM7.00781 6.41406C8.28906 6.41406 9.32031 5.24219 9.32031 3.73438C9.32031 2.28125 8.28125 1.14844 7.00781 1.14844C5.73438 1.14844 4.69531 2.29688 4.69531 3.74219C4.69531 5.25 5.73438 6.41406 7.00781 6.41406ZM1.95312 14.4922C0.8125 14.4922 0.265625 14.125 0.265625 13.3359C0.265625 11.3047 2.82812 8.39844 7 8.39844C11.1641 8.39844 13.7266 11.3047 13.7266 13.3359C13.7266 14.125 13.1875 14.4922 12.0391 14.4922H1.95312ZM1.71094 13.5781H12.2891C12.6406 13.5781 12.7656 13.4844 12.7656 13.2422C12.7656 11.7578 10.6719 9.3125 7 9.3125C3.32031 9.3125 1.23438 11.7578 1.23438 13.2422C1.23438 13.4844 1.35156 13.5781 1.71094 13.5781Z"
                fill="#EAFFE2"
              />
            </svg>

            {list.participants}
          </p>
          <p className="tag-list w-fit items-center gap-x-1 flex flex-wrap">
            <svg
              className="tag-icon"
              viewBox="0 0 16 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.29688 14.4453C0.773438 14.4453 -0.0078125 13.6719 -0.0078125 12.1641V2.58594C-0.0078125 1.07031 0.773438 0.296875 2.29688 0.296875H13.1641C14.6875 0.296875 15.4688 1.07812 15.4688 2.58594V12.1641C15.4688 13.6641 14.6875 14.4453 13.1641 14.4453H2.29688ZM2.22656 13.4766H13.2266C14.0312 13.4766 14.5 13.0469 14.5 12.2031V5.05469C14.5 4.21094 14.0312 3.77344 13.2266 3.77344H2.22656C1.40625 3.77344 0.960938 4.21094 0.960938 5.05469V12.2031C0.960938 13.0469 1.40625 13.4766 2.22656 13.4766ZM6.17969 6.55469C5.92969 6.55469 5.86719 6.49219 5.86719 6.25V5.78906C5.86719 5.54688 5.92969 5.48438 6.17969 5.48438H6.64062C6.88281 5.48438 6.95312 5.54688 6.95312 5.78906V6.25C6.95312 6.49219 6.88281 6.55469 6.64062 6.55469H6.17969ZM8.82812 6.55469C8.58594 6.55469 8.51562 6.49219 8.51562 6.25V5.78906C8.51562 5.54688 8.58594 5.48438 8.82812 5.48438H9.28906C9.53125 5.48438 9.60156 5.54688 9.60156 5.78906V6.25C9.60156 6.49219 9.53125 6.55469 9.28906 6.55469H8.82812ZM11.4766 6.55469C11.2344 6.55469 11.1641 6.49219 11.1641 6.25V5.78906C11.1641 5.54688 11.2344 5.48438 11.4766 5.48438H11.9375C12.1797 5.48438 12.25 5.54688 12.25 5.78906V6.25C12.25 6.49219 12.1797 6.55469 11.9375 6.55469H11.4766ZM3.53125 9.15625C3.28125 9.15625 3.21875 9.10156 3.21875 8.85938V8.39844C3.21875 8.15625 3.28125 8.09375 3.53125 8.09375H3.99219C4.23438 8.09375 4.30469 8.15625 4.30469 8.39844V8.85938C4.30469 9.10156 4.23438 9.15625 3.99219 9.15625H3.53125ZM6.17969 9.15625C5.92969 9.15625 5.86719 9.10156 5.86719 8.85938V8.39844C5.86719 8.15625 5.92969 8.09375 6.17969 8.09375H6.64062C6.88281 8.09375 6.95312 8.15625 6.95312 8.39844V8.85938C6.95312 9.10156 6.88281 9.15625 6.64062 9.15625H6.17969ZM8.82812 9.15625C8.58594 9.15625 8.51562 9.10156 8.51562 8.85938V8.39844C8.51562 8.15625 8.58594 8.09375 8.82812 8.09375H9.28906C9.53125 8.09375 9.60156 8.15625 9.60156 8.39844V8.85938C9.60156 9.10156 9.53125 9.15625 9.28906 9.15625H8.82812ZM11.4766 9.15625C11.2344 9.15625 11.1641 9.10156 11.1641 8.85938V8.39844C11.1641 8.15625 11.2344 8.09375 11.4766 8.09375H11.9375C12.1797 8.09375 12.25 8.15625 12.25 8.39844V8.85938C12.25 9.10156 12.1797 9.15625 11.9375 9.15625H11.4766ZM3.53125 11.7656C3.28125 11.7656 3.21875 11.7109 3.21875 11.4688V11.0078C3.21875 10.7656 3.28125 10.7031 3.53125 10.7031H3.99219C4.23438 10.7031 4.30469 10.7656 4.30469 11.0078V11.4688C4.30469 11.7109 4.23438 11.7656 3.99219 11.7656H3.53125ZM6.17969 11.7656C5.92969 11.7656 5.86719 11.7109 5.86719 11.4688V11.0078C5.86719 10.7656 5.92969 10.7031 6.17969 10.7031H6.64062C6.88281 10.7031 6.95312 10.7656 6.95312 11.0078V11.4688C6.95312 11.7109 6.88281 11.7656 6.64062 11.7656H6.17969ZM8.82812 11.7656C8.58594 11.7656 8.51562 11.7109 8.51562 11.4688V11.0078C8.51562 10.7656 8.58594 10.7031 8.82812 10.7031H9.28906C9.53125 10.7031 9.60156 10.7656 9.60156 11.0078V11.4688C9.60156 11.7109 9.53125 11.7656 9.28906 11.7656H8.82812Z"
                fill="#EAFFE2"
              />
            </svg>
            {list.days} dager
          </p>
        </div>
        <div className="flex gap-y-4 gap-x-2 pb-8">
          {/* Button to open the Add Item Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <button className="button-create text-lg flex flex-row items-center gap-x-1 text-md">
                <Icon name="add" width={24} height={24} />
                Legg til utstyr
              </button>
            </DialogTrigger>
            {/* Updated DialogContent */}
            <DialogContent className="dialog p-4 max-w-lg md:p-10 rounded-2xl h-[80vh] no-scrollbar flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-2xl text-accent font-normal">
                  Legg til utstyr
                </DialogTitle>
                <DialogDescription className="text-lg pt-4">
                  Marker utstyret du vil legge til i listen.
                </DialogDescription>
              </DialogHeader>
              {/* Search Bar */}
              <label className="flex flex-col pt-4 gap-y-2 text-lg">
                Søk
                <input
                  type="text"
                  value={dialogSearchQuery}
                  onChange={(e) => setDialogSearchQuery(e.target.value)}
                  className="w-full max-w-full p-4 mb-2"
                  placeholder="Søk etter utstyr"
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
                          <div className="flex flex-col gap-y-1">
                            <h2 className="text-lg">{item?.name}</h2>
                            <div className="flex flex-wrap gap-x-1">
                              {item?.size && (
                                <p className="tag-search w-fit items-center gap-x-1 flex flex-wrap">
                                  <Icon name="size" width={16} height={16} />
                                  {item.size}
                                </p>
                              )}
                              {item?.weight && (
                                <p className="tag-search w-fit items-center gap-x-1 flex flex-wrap">
                                  <Icon name="weight" width={16} height={16} />
                                  {item.weight.weight} {item.weight.unit}
                                </p>
                              )}
                              {item?.calories && item.calories > 0 && (
                                <p className="tag-search w-fit items-center gap-x-1 flex flex-wrap">
                                  <Icon
                                    name="calories"
                                    width={16}
                                    height={16}
                                  />
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
                  Lagre
                </button>
                <DialogClose asChild>
                  <button type="button" className="button-secondary">
                    Lukk
                  </button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ShareButton slug={listSlug} />
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
                Alle
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

        {selectedItems.length > 0 ? (
          <ul className="totals flex flex-col w-full mt-8 gap-y-4">
            <li>
              {selectedCategory === null ? (
                // "Alle" view with overrides and category totals
                <div className="flex flex-col gap-y-8">
                  {/* Override totals section */}
                  {overrideTotals.length > 0 && (
                    <div className="flex flex-col gap-y-8 pt-4">
                      {overrideTotals.map((override) => (
                        <div
                          key={override.categoryId}
                          className="grid grid-cols-1 gap-x-3 gap-y-2"
                        >
                          <p className="text-md sm:text-xl">
                            {override.categoryTitle}
                          </p>
                          <p className="text-6xl sm:text-8xl text-accent font-bold">
                            {formatWeight(override.weight)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total without overrides section */}
                  {overrideTotals.length > 0 && (
                    <div className="flex flex-col gap-y-2 pb-8">
                      <div className="grid grid-cols-1 gap-x-3 gap-y-2">
                        <p className="text-md sm:text-xl">Sekk</p>
                        <p className="text-6xl sm:text-8xl text-accent font-bold">
                          {formatWeight(totalWithoutOverrides.weight)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Category totals section */}
                  <div className="flex flex-col gap-y-2 pt-4">
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
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-x-3">
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
              ) : (
                // Category-specific view
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-6 gap-x-3">
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

        {/* Display selected items */}
        <ul className="flex flex-col divide-y divide-white/5">
          {filteredItemsForList.map((listItem) => {
            console.log("Rendering item:", listItem);
            return (
              <li key={listItem._key} className="product py-4">
                <div className="flex flex-wrap gap-y-6 md:gap-y-0 items-center gap-x-4">
                  <div className="aspect-square h-16 w-16">
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
                            d="M3.85938 23.4961C1.32812 23.4961 0.015625 22.1836 0.015625 19.6875V7.39453C0.015625 4.89844 1.32812 3.58594 3.85938 3.58594H7.01172C7.92578 3.58594 8.23047 3.42188 8.78125 2.83594L9.71875 1.82812C10.3281 1.19531 10.9375 0.867188 12.1328 0.867188H16.7969C17.9922 0.867188 18.6016 1.19531 19.2109 1.82812L20.1484 2.83594C20.7109 3.43359 21.0039 3.58594 21.918 3.58594H25.1289C27.6602 3.58594 28.9727 4.89844 28.9727 7.39453V19.6875C28.9727 22.1836 27.6602 23.4961 25.1289 23.4961H3.85938ZM4 21.1992H25C26.0781 21.1992 26.6758 20.625 26.6758 19.4883V7.59375C26.6758 6.45703 26.0781 5.88281 25 5.88281H21.25C20.207 5.88281 19.6562 5.69531 19.0703 5.05078L18.168 4.05469C17.5117 3.35156 17.1602 3.16406 16.1289 3.16406H12.8008C11.7695 3.16406 11.418 3.35156 10.7617 4.06641L9.85938 5.05078C9.27344 5.70703 8.72266 5.88281 7.67969 5.88281H4C2.92188 5.88281 2.3125 6.45703 2.3125 7.59375V19.4883C2.3125 20.625 2.92188 21.1992 4 21.1992ZM14.5 19.6406C10.9844 19.6406 8.17188 16.8281 8.17188 13.3008C8.17188 9.77344 10.9844 6.94922 14.5 6.94922C18.0156 6.94922 20.8281 9.77344 20.8281 13.3008C20.8281 16.8281 18.0039 19.6406 14.5 19.6406ZM21.2266 9.08203C21.2266 8.27344 21.9297 7.57031 22.7617 7.57031C23.5703 7.57031 24.2734 8.27344 24.2734 9.08203C24.2734 9.92578 23.5703 10.5938 22.7617 10.5938C21.918 10.5938 21.2266 9.9375 21.2266 9.08203ZM14.5 17.543C16.8438 17.543 18.7422 15.6562 18.7422 13.3008C18.7422 10.9336 16.8438 9.04688 14.5 9.04688C12.1562 9.04688 10.2578 10.9336 10.2578 13.3008C10.2578 15.6562 12.1562 17.543 14.5 17.543Z"
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
                      {listItem.item?.calories &&
                        listItem.item.calories > 0 && (
                          <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                            <Icon name="calories" width={16} height={16} />
                            {listItem.item.calories} kcal
                          </p>
                        )}
                    </div>
                  </div>
                  <div className="flex ml-auto"></div>

                  <div className="flex items-center w-full md:w-auto gap-x-2 ml-auto">
                    <div className="flex w-full">
                      <div className="flex items-center gap-x-2 bg-dimmed-hover rounded px-2 py-1">
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              listItem._key,
                              (listItem.quantity || 1) - 1,
                            )
                          }
                          disabled={(listItem.quantity || 1) <= 1}
                          className="p-1 hover:bg-dimmed rounded disabled:opacity-50"
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
                          className="p-1 hover:bg-dimmed rounded disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Add category edit button */}
                    <button
                      onClick={() => setEditingItemKey(listItem._key)}
                      className="button-ghost flex gap-x-2 h-fit align-middle"
                      aria-label="Edit category"
                    >
                      <Icon
                        name="category"
                        width={24}
                        height={24}
                        fill="#EAFFE2"
                      />
                    </button>

                    {/* Existing delete button */}
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

        {/* Category Edit Dialog */}
        <Dialog
          open={!!editingItemKey}
          onOpenChange={() => setEditingItemKey(null)}
        >
          <DialogContent className="dialog">
            <DialogHeader className="gap-y-4">
              <DialogTitle className="text-2xl font-normal text-accent">
                Overstyr kategori
              </DialogTitle>
              <DialogDescription className="text-lg">
                Velg en ny kategori for dette utstyret kun for denne pakklisten.
                Et tips er å lage en kategori for På kropp så du kan skille
                mellom det du har på og det som er i sekken.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-y-4 pt-4 pb-4">
              <select
                className="w-full max-w-full p-4"
                value={
                  selectedItems.find((item) => item._key === editingItemKey)
                    ?.categoryOverride?._id || ""
                }
                onChange={(e) =>
                  handleCategoryUpdate(
                    e.target.value === "original" ? null : e.target.value,
                  )
                }
              >
                {/* Original category option */}
                <option value="original">
                  {selectedItems.find((item) => item._key === editingItemKey)
                    ?.item?.category.title || "Unknown"}{" "}
                  (original)
                </option>

                {/* Available categories */}
                {allCategories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <button
                  className="button-secondary"
                  onClick={() => setEditingItemKey(null)}
                >
                  Avbryt
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </ProtectedRoute>
  );
}
