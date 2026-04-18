'use client';
import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {Icon} from '@/components/Icon';
import {ActionBar} from '@/components/ActionBar';
import {CategoryFilter} from '@/components/CategoryFilter';
import {CategoryCombobox} from '@/components/CategoryCombobox';
import {Button} from '@/components/Button/Button';
import {OverviewStats} from '@/components/OverviewStats';
import {PackingListItem} from '@/components/PackingListItem';
import {client} from '@/sanity/client';
import {nanoid} from 'nanoid';
import {useSession} from 'next-auth/react';
import Image from 'next/image';
import {usePathname, useSearchParams, useRouter} from 'next/navigation';
import {useCallback, useEffect, useMemo, useState, useRef} from 'react';
import {toast} from 'sonner';
import {useDelayedLoader} from '@/hooks/useDelayedLoader';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  ITEMS_QUERY,
  LIST_QUERY,
  SHARED_LIST_QUERY,
  prepareItems,
  sortListItems,
  urlFor,
  type Category,
  type CategoryTotal,
  type Item,
  type List,
  type ListItem,
} from './utils';
import {useLanguage} from '@/i18n/LanguageProvider';
import styles from './page.module.scss';

export default function ListPage() {
  const {t} = useLanguage();
  const {data: session} = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Detect if this is a shared list (read-only mode)
  const isSharedMode = searchParams.get('shared') === 'true';
  const fromTrip = searchParams.get('fromTrip');

  // Move getUserId into useCallback
  const getUserId = useCallback(() => {
    if (!session?.user?.id) return null;
    return session.user.id.startsWith('google_') ? session.user.id : `google_${session.user.id}`;
  }, [session?.user?.id]);

  // State variables and Hooks
  const [items, setItems] = useState<Item[]>([]);
  const [list, setList] = useState<List | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    // Initialize from URL or localStorage fallback
    const urlCategory = searchParams.get('category');
    if (urlCategory) {
      // Convert slug back to category ID
      if (typeof window !== 'undefined') {
        const storedCategoryId = localStorage.getItem('packingListLastCategory');
        if (storedCategoryId) {
          return storedCategoryId;
        }
      }
      return null; // Will be set properly once categories are loaded
    }

    // Fallback to localStorage if no URL param
    if (typeof window !== 'undefined') {
      return localStorage.getItem('packingListLastCategory') || null;
    }
    return null;
  });
  const [selectedItems, setSelectedItems] = useState<ListItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery] = useState('');
  const [tempSelectedItems, setTempSelectedItems] = useState<Item[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'weight-low' | 'weight-high' | 'calories'>('name');
  const pathname = usePathname();
  const listSlug = pathname?.split('/')[2];
  const [isLoading, setIsLoading] = useState(false);
  const showLoader = useDelayedLoader(isLoading, 300); // Only show loader after 300ms
  const [error, setError] = useState<string | null>(null);

  // State for saving shared lists
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Add state for optimistic updates
  const [pendingQuantities, setPendingQuantities] = useState<{
    [key: string]: number;
  }>({});

  // Add state for temporary input values (allows empty/invalid states)
  const [tempQuantityInputs, setTempQuantityInputs] = useState<{
    [key: string]: string;
  }>({});

  // Add a new state for dialog search
  const [dialogSearchQuery, setDialogSearchQuery] = useState('');

  // Add to gear dialog state (shared mode)
  const [addToGearItem, setAddToGearItem] = useState<{
    _id: string;
    name: string;
    size?: string;
    weight?: {weight: number; unit: string};
    calories?: number;
    image?: {asset: {_ref: string}};
  } | null>(null);
  const [addToGearCategory, setAddToGearCategory] = useState('');
  const [addToGearCategories, setAddToGearCategories] = useState<{_id: string; title: string}[]>([]);
  const [isAddingToGear, setIsAddingToGear] = useState(false);

  // Add new state for onBody filter
  const [showOnBodyOnly, setShowOnBodyOnly] = useState<boolean>(() => {
    // Initialize from URL or localStorage fallback
    const urlOnBody = searchParams.get('onBody');
    if (urlOnBody === 'true') {
      return true;
    }

    // Fallback to localStorage if no URL param
    if (typeof window !== 'undefined') {
      return localStorage.getItem('packingListLastOnBody') === 'true' || false;
    }
    return false;
  });
  const isUpdatingURL = useRef(false);

  // Utility function to convert category title to URL-safe slug
  function categoryToSlug(categoryName: string): string {
    return categoryName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Keep this as our single source of truth for categories
  const categories = useMemo((): Category[] => {
    if (!selectedItems?.length) return [];

    // Get categories that actually have items
    const activeCategories = new Map<string, Category>();

    selectedItems.forEach((listItem) => {
      if (!listItem.item) return;

      // Get the effective category
      const effectiveCategory = listItem.item?.category;
      if (effectiveCategory) {
        activeCategories.set(effectiveCategory._id, effectiveCategory);
      }
    });

    return Array.from(activeCategories.values()).sort((a: Category, b: Category) =>
      a.title.localeCompare(b.title, 'nb'),
    );
  }, [selectedItems]);

  // Utility function to convert slug back to category ID
  const slugToCategoryId = useCallback(
    (slug: string): string | null => {
      const foundCategory = categories.find((cat) => categoryToSlug(cat.title) === slug);
      return foundCategory?._id || null;
    },
    [categories],
  );

  // Add initial data fetch useEffect
  useEffect(() => {
    async function fetchData() {
      const userId = getUserId();
      const decodedSlug = decodeURIComponent(listSlug || '');

      if (!listSlug) return;

      // For shared mode, we don't need userId
      if (!isSharedMode && !userId) return;

      setIsLoading(true); // Set loading state
      try {
        // Use appropriate query based on mode
        const query = isSharedMode ? SHARED_LIST_QUERY(listSlug) : LIST_QUERY(listSlug);
        const fetchedList = await client.fetch(query, isSharedMode ? {} : {userId});

        if (fetchedList) {
          setList(fetchedList);
          setSelectedItems(fetchedList.items);
        } else {
          console.log('No list found with slug:', decodedSlug);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setIsLoading(false); // Clear loading state
      }
    }

    fetchData();
  }, [listSlug, getUserId, isSharedMode]);

  // Add this useEffect after your existing useEffect for fetching the list
  useEffect(() => {
    // Skip fetching items in shared mode (no need for add gear dialog)
    if (isSharedMode) return;

    async function fetchItems() {
      const userId = getUserId();
      if (!userId) return;

      try {
        const fetchedItems = await client.fetch(ITEMS_QUERY, {userId});
        setItems(fetchedItems);
      } catch (error) {
        console.error('Error fetching items:', error);
        setError('Failed to load items');
      }
    }

    fetchItems();
  }, [getUserId, isSharedMode]);

  // Check if the list is already saved (for shared mode)
  const checkIfSaved = useCallback(async () => {
    if (!session?.user?.id || !isSharedMode || !list) return;

    try {
      // Extract the raw Google ID from session (remove "google_" prefix if present)
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
  }, [session?.user?.id, isSharedMode, list]);

  // Save list to shared lists
  const handleSaveToList = async () => {
    if (!session?.user?.id || !list) return;

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

  // Check if saved on mount and when list changes
  useEffect(() => {
    checkIfSaved();
  }, [checkIfSaved]);

  // Add to gear: open dialog with category selection
  const handleOpenAddToGear = async (item: {
    _id: string;
    name: string;
    size?: string;
    weight?: {weight: number; unit: string};
    calories?: number;
    image?: {asset: {_ref: string; url?: string}};
  }) => {
    setAddToGearItem(item);
    setAddToGearCategory('');

    // Fetch user's categories
    try {
      const response = await fetch('/api/getCategories');
      if (response.ok) {
        const data = await response.json();
        setAddToGearCategories(
          [...data].sort((a: {title: string}, b: {title: string}) =>
            a.title.localeCompare(b.title),
          ),
        );
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleConfirmAddToGear = async () => {
    if (!addToGearItem || !addToGearCategory) return;

    setIsAddingToGear(true);
    try {
      const formData = new FormData();
      formData.append('name', addToGearItem.name);
      formData.append('slug', addToGearItem.name.toLowerCase().replace(/\s+/g, '-').slice(0, 200));
      formData.append('category', addToGearCategory);

      if (addToGearItem.image?.asset?._ref) {
        formData.append('imageRef', addToGearItem.image.asset._ref);
      }
      if (addToGearItem.weight) {
        formData.append('weight.weight', addToGearItem.weight.weight.toString());
        formData.append('weight.unit', addToGearItem.weight.unit);
      }
      if (addToGearItem.size) {
        formData.append('size', addToGearItem.size);
      }
      if (addToGearItem.calories && addToGearItem.calories > 0) {
        formData.append('calories', addToGearItem.calories.toString());
      }

      const response = await fetch('/api/items', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to add gear');

      toast.success(`"${addToGearItem.name}" added to your gear`, {
        duration: 3000,
        position: 'bottom-center',
      });
      setAddToGearItem(null);
    } catch (error) {
      console.error('Error adding to gear:', error);
      toast.error('Failed to add to gear. Please try again.', {
        duration: 3000,
        position: 'bottom-center',
      });
    } finally {
      setIsAddingToGear(false);
    }
  };

  const updateUrlAndStorage = (params: {set?: Record<string, string>; remove?: string[]}) => {
    isUpdatingURL.current = true;
    const newSearchParams = new URLSearchParams(searchParams);
    params.remove?.forEach((key) => {
      newSearchParams.delete(key);
      localStorage.removeItem(
        key === 'category' ? 'packingListLastCategory' : 'packingListLastOnBody',
      );
    });
    Object.entries(params.set || {}).forEach(([key, value]) => {
      newSearchParams.set(key, value);
      localStorage.setItem(
        key === 'category' ? 'packingListLastCategory' : 'packingListLastOnBody',
        value,
      );
    });
    router.push(
      newSearchParams.toString() ? `?${newSearchParams.toString()}` : window.location.pathname,
    );
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setShowOnBodyOnly(false);

    if (categoryId) {
      const category = categories.find((cat) => cat._id === categoryId);
      if (category) {
        updateUrlAndStorage({set: {category: categoryToSlug(category.title)}, remove: ['onBody']});
        localStorage.setItem('packingListLastCategory', categoryId);
      }
    } else {
      updateUrlAndStorage({remove: ['category']});
    }
  };

  const handleOnBodyChange = (onBody: boolean) => {
    setShowOnBodyOnly(onBody);
    setSelectedCategory(null);

    if (onBody) {
      updateUrlAndStorage({set: {onBody: 'true'}, remove: ['category']});
    } else {
      updateUrlAndStorage({remove: ['onBody']});
    }
  };

  // Sync URL state with component state (only when URL changes externally)
  useEffect(() => {
    // Skip if we're making our own URL update
    if (isUpdatingURL.current) {
      isUpdatingURL.current = false;
      return;
    }

    const urlCategory = searchParams.get('category');
    const urlOnBody = searchParams.get('onBody');

    // Handle category changes - convert slug to category ID
    if (urlCategory && categories.length > 0) {
      const categoryId = slugToCategoryId(urlCategory);
      if (categoryId && categoryId !== selectedCategory) {
        setSelectedCategory(categoryId);
        localStorage.setItem('packingListLastCategory', categoryId);
      }
    } else if (!urlCategory && selectedCategory !== null) {
      setSelectedCategory(null);
      localStorage.removeItem('packingListLastCategory');
    }

    // Handle onBody changes
    const newOnBodyValue = urlOnBody === 'true';
    if (newOnBodyValue !== showOnBodyOnly) {
      setShowOnBodyOnly(newOnBodyValue);
      if (newOnBodyValue) {
        localStorage.setItem('packingListLastOnBody', 'true');
      } else {
        localStorage.removeItem('packingListLastOnBody');
      }
    }
  }, [searchParams, categories, selectedCategory, showOnBodyOnly, slugToCategoryId]);

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

  async function handleRemoveFromList(itemToRemove: Item) {
    if (!list) return;

    // Store previous state for rollback
    const previousItems = selectedItems;

    try {
      const updatedItems = selectedItems.filter(
        (listItem) => listItem.item?._id !== itemToRemove._id,
      );

      // Optimistic update: Update UI immediately
      setSelectedItems(updatedItems);

      // Show toast notification
      toast.success('Item removed from list', {
        duration: 3000,
        position: 'bottom-center',
      });

      // Update through API route in background
      const response = await fetch('/api/updateList', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listId: list._id,
          items: prepareItems(updatedItems),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update list');
      }
    } catch (error) {
      // Rollback on failure
      setSelectedItems(previousItems);
      console.error('Failed to remove item:', error);
      toast.error('Failed to remove item. Please try again.', {
        duration: 3000,
        position: 'bottom-center',
      });
    }
  }

  // Update the filteredItemsForList useMemo
  const filteredItemsForList = useMemo(() => {
    let items = selectedItems;

    // If showOnBodyOnly is true, show all onBody items regardless of category
    if (showOnBodyOnly) {
      return sortListItems(items.filter((item) => item.onBody === true), sortBy);
    }

    // Otherwise, apply category filter as normal, but exclude on-body items from their original categories
    if (selectedCategory) {
      items = items.filter((item) => {
        // If item is on body, only show it in the "On body" category
        if (item.onBody) return false;
        return item.item?.category?._id === selectedCategory;
      });
    }

    // Existing search filter
    if (searchQuery) {
      items = items.filter((item) =>
        item.item?.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return sortListItems(items, sortBy);
  }, [selectedItems, selectedCategory, searchQuery, showOnBodyOnly, sortBy]);

  // Update the filteredItemsForDialog to use dialogSearchQuery instead
  const filteredItemsForDialog = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch = dialogSearchQuery
          ? item.name.toLowerCase().includes(dialogSearchQuery.toLowerCase()) ||
            item.category.title.toLowerCase().includes(dialogSearchQuery.toLowerCase())
          : true;
        const notAlreadyInList = !selectedItems.some(
          (selectedItem) => selectedItem.item?._id === item._id,
        );
        return matchesSearch && notAlreadyInList;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'nb'));
  }, [items, dialogSearchQuery, selectedItems]);

  // Update the dialog open handler to clear the dialog search
  function handleDialogOpenChange(isOpen: boolean) {
    setIsDialogOpen(isOpen);
    if (isOpen) {
      setTempSelectedItems([]); // Clear temp selection when dialog opens
      setDialogSearchQuery(''); // Clear dialog search query when dialog opens
    } else {
      setTempSelectedItems([]); // Clear temp selection when dialog closes
    }
  }

  // Update the categoryTotals calculation
  const {categoryTotals, grandTotal, categoryTotalsMap} = useMemo(() => {
    const emptyTotal = {
      count: 0,
      weight: 0,
      weightOnBody: 0,
      calories: 0,
      checkedCount: 0,
    };

    if (!selectedItems?.length) {
      return {
        categoryTotals: [],
        categoryTotalsMap: new Map<string, CategoryTotal>(),
        grandTotal: emptyTotal,
      };
    }

    const categoryMap = new Map<string, CategoryTotal>();

    // Calculate totals
    selectedItems.forEach((item) => {
      if (!item.item) return;
      const quantity = item.quantity || 1;
      const effectiveCategory = item.item.category;
      if (!effectiveCategory) return;

      if (item.onBody) {
        // Only add to "On body" category
        const onBodyCategory = categoryMap.get('on-body') || {
          id: 'on-body',
          count: 0,
          weight: 0,
          weightOnBody: 0,
          calories: 0,
          checkedCount: 0,
          title: t.lists.onBody,
        };

        onBodyCategory.count += quantity;
        if (item.checked) {
          onBodyCategory.checkedCount += quantity;
        }
        if (item.item.weight) {
          onBodyCategory.weightOnBody += item.item.weight.weight * quantity;
        }
        if (item.item.calories) {
          onBodyCategory.calories += item.item.calories * quantity;
        }

        categoryMap.set('on-body', onBodyCategory);
      } else {
        // Regular category totals calculation (for non-on-body items)
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
          existing.weight += item.item.weight.weight * quantity;
        }
        if (item.item.calories) {
          existing.calories += item.item.calories * quantity;
        }

        categoryMap.set(effectiveCategory._id, existing);
      }
    });

    const categoryTotals = Array.from(categoryMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title, 'nb'),
    );

    // Calculate grand total (excluding on-body items)
    const grandTotal = categoryTotals.reduce(
      (acc, category) => {
        // For "On body" category, add to weightOnBody
        if (category.id === 'on-body') {
          return {
            ...acc,
            weightOnBody: category.weightOnBody || 0,
          };
        }

        // For other categories, add to regular weight
        return {
          count: acc.count + category.count,
          weight: acc.weight + category.weight,
          weightOnBody: acc.weightOnBody,
          calories: acc.calories + category.calories,
          checkedCount: acc.checkedCount + category.checkedCount,
        };
      },
      {
        count: 0,
        weight: 0,
        weightOnBody: 0,
        calories: 0,
        checkedCount: 0,
      },
    );

    return {
      categoryTotals,
      categoryTotalsMap: categoryMap,
      grandTotal,
    };
  }, [selectedItems]);

  const selectedCategoryTotals = categoryTotalsMap.get(selectedCategory ?? '');
  const selectedCategoryWeight = selectedCategoryTotals
    ? selectedCategoryTotals.weight + selectedCategoryTotals.weightOnBody
    : 0;

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

  if (showLoader) {
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

  // Add these handler functions
  const handleSaveChanges = async () => {
    if (!list) return;

    // Store previous state for rollback
    const previousItems = selectedItems;
    const itemsToAdd = tempSelectedItems.length;

    try {
      // Create a Map to store unique items by their item._id
      const uniqueItems = new Map();

      // First add all existing items to the Map
      selectedItems.forEach((listItem) => {
        if (listItem.item?._id) {
          uniqueItems.set(listItem.item._id, listItem);
        }
      });

      // Then add new items, but only if they don't already exist
      tempSelectedItems.forEach((item) => {
        if (!uniqueItems.has(item._id)) {
          uniqueItems.set(item._id, {
            _key: nanoid(),
            _type: 'listItem',
            item,
            quantity: 1,
            checked: false,
            onBody: false,
          });
        }
      });

      // Convert Map back to array
      const cleanedItems = Array.from(uniqueItems.values());

      // Optimistic update: Update UI immediately
      setSelectedItems(cleanedItems);
      setTempSelectedItems([]);
      setIsDialogOpen(false);

      // Show toast notification
      toast.success(
        itemsToAdd === 1 ? '1 item added to the list' : `${itemsToAdd} items added to the list`,
        {
          duration: 3000,
          position: 'bottom-center',
        },
      );

      // Update through API in background
      const response = await fetch('/api/updateList', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          listId: list._id,
          items: prepareItems(cleanedItems),
        }),
      });

      if (!response.ok) throw new Error('Failed to update list');
    } catch (error) {
      // Rollback on failure
      setSelectedItems(previousItems);
      setIsDialogOpen(true); // Reopen dialog so user can try again
      console.error('Failed to save changes:', error);
      toast.error('Failed to add items. Please try again.', {
        duration: 3000,
        position: 'bottom-center',
      });
    }
  };

  // Update the handleCheckboxChange function
  const handleCheckboxChange = async (itemKey: string, checked: boolean) => {
    if (!list) return;

    // Store previous state for rollback
    const previousItems = selectedItems;

    // Create a new array with the updated item
    const updatedItems = selectedItems.map((item) =>
      item._key === itemKey ? {...item, checked} : item,
    );

    // Optimistic update: Update UI immediately
    setSelectedItems(updatedItems);

    try {
      const response = await fetch('/api/updateList', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          listId: list._id,
          items: prepareItems(updatedItems),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update list');
      }
    } catch (error) {
      // Rollback on failure
      setSelectedItems(previousItems);
      console.error('Failed to update item:', error);
      alert('Failed to update item. Please try again.');
    }
  };

  const handleQuantityChange = async (itemKey: string, newQuantity: number) => {
    if (!list || newQuantity < 0.1) return;

    // Store previous state for rollback
    const previousItems = selectedItems;
    const previousPendingQuantities = {...pendingQuantities};

    // Update selectedItems immediately for weight calculations
    const updatedItems = selectedItems.map((item) =>
      item._key === itemKey ? {...item, quantity: newQuantity} : item,
    );

    // Optimistic update: Update UI immediately
    setSelectedItems(updatedItems);
    setPendingQuantities((prev) => ({
      ...prev,
      [itemKey]: newQuantity,
    }));

    // Clear the temporary input state since we have a valid value
    setTempQuantityInputs((prev) => {
      const newState = {...prev};
      delete newState[itemKey];
      return newState;
    });

    try {
      const response = await fetch('/api/updateList', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          listId: list._id,
          items: prepareItems(updatedItems),
        }),
      });

      if (!response.ok) throw new Error('Failed to update list');
    } catch (error) {
      // Rollback on failure
      setSelectedItems(previousItems);
      setPendingQuantities(previousPendingQuantities);
      console.error('Failed to update quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  // Handle updating item onBody status
  const handleItemOnBodyChange = async (itemKey: string, onBody: boolean) => {
    if (!list) return;

    // Store previous state for rollback
    const previousItems = selectedItems;

    // Create updated items
    const updatedItems = selectedItems.map((item) =>
      item._key === itemKey ? {...item, onBody} : item,
    );

    // Optimistic update: Update UI immediately
    setSelectedItems(updatedItems);

    // Show toast notification
    toast.success(onBody ? t.lists.itemSetOnBody : t.lists.itemRemovedOnBody, {
      duration: 3000,
      position: 'bottom-center',
    });

    try {
      const response = await fetch('/api/updateList', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          listId: list._id,
          items: prepareItems(updatedItems),
        }),
      });

      if (!response.ok) throw new Error('Failed to update list');
    } catch (error) {
      // Rollback on failure
      setSelectedItems(previousItems);
      console.error('Failed to update onBody status:', error);
      toast.error(t.lists.failedUpdateOnBody, {
        duration: 3000,
        position: 'bottom-center',
      });
    }
  };

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen p-16">
        <h1 className="nav-logo text-4xl md:text-6xl text-accent py-4">{list.name}</h1>

        {/* Shared by badge - only in shared mode */}
        {isSharedMode && list.user?.name && (
          <div className="flex flex-wrap gap-x-2 gap-y-2 mb-4">
            <div className={styles.sharedBadge}>
              <Icon name="user" width={16} height={16} />
              Shared by {list.user.name}
            </div>
          </div>
        )}

        {/* ActionBar */}
        <ActionBar
          mode={isSharedMode ? 'shared-list' : 'list'}
          onAddToList={() => setIsDialogOpen(true)}
          onShare={async () => {
            const shareUrl = `${window.location.origin}/lists/${listSlug}?shared=true`;
            try {
              await navigator.clipboard.writeText(shareUrl);
              toast.success(t.clipboard.copied, {
                duration: 3000,
                position: 'bottom-center',
              });
            } catch (err) {
              toast.error(t.clipboard.failed, {
                duration: 3000,
                position: 'bottom-center',
              });
              console.error('Copy failed:', err);
            }
          }}
          onViewMap={
            list?.connectedMap
              ? () => router.push(`/maps/${list.connectedMap!._id}?from=list&slug=${listSlug}`)
              : undefined
          }
          connectedMapName={list?.connectedMap?.name}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onSaveToMyLists={isSharedMode ? handleSaveToList : undefined}
          isSaved={isSaved}
          isSaving={isSaving}
          onBackToTrip={fromTrip ? () => router.push(`/trips/${fromTrip}`) : undefined}
        />

        {/* Add Item Dialog - controlled by ActionBar */}
        {!isSharedMode && (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            {/* Updated DialogContent */}
            <DialogContent className="dialog p-4 max-w-lg md:p-5 rounded-2xl h-[80vh] no-scrollbar flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-2xl text-accent font-normal">{t.gear.addGear}</DialogTitle>
              </DialogHeader>
              {/* Search Bar */}
              <label className="flex flex-col pt-2 gap-y-2 text-lg">
                <input
                  type="text"
                  value={dialogSearchQuery}
                  onChange={(e) => setDialogSearchQuery(e.target.value)}
                  className="w-full max-w-full p-4 mb-1"
                  placeholder={t.misc.searchGearOrCategory}
                />
              </label>

              {/* Container for the list of items */}
              <div className="flex-grow overflow-y-auto max-h-[60vh] no-scrollbar">
                {items.length === 0 ? (
                  <p>Loading gear...</p>
                ) : filteredItemsForDialog.length === 0 ? (
                  <p>No matches</p>
                ) : (
                  <ul className="flex flex-col">
                    {filteredItemsForDialog.map((item) => (
                      <li
                        key={item._id}
                        className={`product-search flex items-center gap-4 py-2 cursor-pointer ${
                          tempSelectedItems.some((selected) => selected._id === item._id)
                            ? 'active'
                            : ''
                        }`}
                        onClick={() => handleTempItemToggle(item)}
                      >
                        <div className="flex flex-grow items-center gap-x-4">
                          <div className="h-12 w-12">
                            {item?.image ? (
                              <Image
                                className="rounded-md h-full w-full object-cover"
                                src={urlFor(item.image).url()}
                                alt={`Bilde av ${item?.name || 'item'}`}
                                width={96}
                                height={96}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-md bg-dimmed flex items-center justify-center">
                                <Icon name="add" width={16} height={16} />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-y-1">
                            <h2 className="text-md text-accent">{item?.name}</h2>
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
                                  <Icon name="calories" width={16} height={16} />
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
                  className="button-primary-accent flex-1 mt-4"
                >
                  {tempSelectedItems.length === 0
                    ? t.actions.add
                    : tempSelectedItems.length === 1
                      ? `${t.actions.add} 1 item`
                      : `${t.actions.add} ${tempSelectedItems.length} items`}
                </button>
                <DialogClose asChild></DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Category Filter + OnBody button */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={(categoryId) => handleCategoryChange(categoryId)}
          showOnBodyFilter={true}
          showOnBodyOnly={showOnBodyOnly}
          onBodyFilterChange={handleOnBodyChange}
          allButtonLabel={t.lists.overview}
        />
        {/* Hero Stats - show when viewing "All" */}
        {selectedCategory === null && !showOnBodyOnly && (
          <OverviewStats
            mode="list"
            layout="hero"
            backpackWeight={grandTotal.weight}
            onBodyWeight={grandTotal.weightOnBody}
            calories={grandTotal.calories}
            packedCount={grandTotal.checkedCount}
            totalCount={grandTotal.count}
          />
        )}
        {/* Detailed breakdown and compact stats */}
        {selectedItems.length > 0 && (
          <>
            {selectedCategory === null && !showOnBodyOnly ? (
              // "All" view - show detailed breakdown
              <OverviewStats
                mode="list"
                layout="detailed"
                showCategoryBreakdown={true}
                categoryTotals={categoryTotals}
              />
            ) : (
              // Category-specific or "On body" view - show compact stats
              <OverviewStats
                mode="list"
                layout="compact"
                packedCount={selectedCategoryTotals?.checkedCount}
                totalCount={selectedCategoryTotals?.count}
                backpackWeight={
                  showOnBodyOnly
                    ? categoryTotals.find((total) => total.id === 'on-body')?.weightOnBody || 0
                    : selectedCategoryWeight
                }
                calories={selectedCategoryTotals?.calories}
              />
            )}
          </>
        )}
        {/* Item List */}
        {(selectedCategory || showOnBodyOnly) && (
          <ul className={styles.itemList}>
            {filteredItemsForList.map((listItem) => (
              <PackingListItem
                key={listItem._key}
                mode={isSharedMode ? 'readonly' : 'editable'}
                listItem={listItem}
                quantityValue={
                  tempQuantityInputs[listItem._key] !== undefined
                    ? tempQuantityInputs[listItem._key]
                    : pendingQuantities[listItem._key] !== undefined
                      ? pendingQuantities[listItem._key].toString()
                      : undefined
                }
                onQuantityInputChange={(key, value) => {
                  setTempQuantityInputs((prev) => ({
                    ...prev,
                    [key]: value,
                  }));
                }}
                onQuantityBlur={(key, value) => {
                  const newValue = parseFloat(value);
                  if (!isNaN(newValue) && newValue >= 0.1) {
                    handleQuantityChange(key, newValue);
                  } else {
                    const currentQuantity =
                      pendingQuantities[key] !== undefined
                        ? pendingQuantities[key]
                        : listItem.quantity || 1;
                    setTempQuantityInputs((prev) => ({
                      ...prev,
                      [key]: currentQuantity.toString(),
                    }));
                  }
                }}
                onCheckChange={handleCheckboxChange}
                onBodyChange={handleItemOnBodyChange}
                onDelete={(key) => {
                  const item = filteredItemsForList.find((li) => li._key === key);
                  if (item?.item) {
                    handleRemoveFromList(item.item);
                  }
                }}
                onAddToGear={isSharedMode ? handleOpenAddToGear : undefined}
                imageUrlBuilder={(asset) => urlFor(asset).url()}
              />
            ))}
          </ul>
        )}

        {/* Add to gear dialog (shared mode) */}
        <Dialog open={!!addToGearItem} onOpenChange={(open) => !open && setAddToGearItem(null)}>
          <DialogContent className="dialog p-10 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-accent font-normal pb-4">
                {t.lists.addToGear}
              </DialogTitle>
            </DialogHeader>
            {addToGearItem && (
              <div className="flex flex-col gap-y-4">
                <p className="text-lg">{addToGearItem.name}</p>
                <CategoryCombobox
                  categories={addToGearCategories}
                  selectedCategory={addToGearCategory}
                  onSelect={setAddToGearCategory}
                  label={t.labels.category}
                  required
                />
              </div>
            )}
            <DialogFooter className="flex mt-4 gap-y-4 gap-x-2">
              <DialogClose asChild>
                <button type="button" className="button-secondary">
                  {t.actions.cancel}
                </button>
              </DialogClose>
              <Button
                variant="primary"
                onClick={handleConfirmAddToGear}
                disabled={!addToGearCategory || isAddingToGear}
              >
                {isAddingToGear ? t.actions.adding : t.actions.add}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </ProtectedRoute>
  );
}
