'use client';
import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {Icon} from '@/components/Icon';
import {ShareButton} from '@/components/ShareButton';
import {client} from '@/sanity/client';
import {nanoid} from 'nanoid';
import {useSession} from 'next-auth/react';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import {
  formatNumber,
  formatWeight,
  ITEMS_QUERY,
  LIST_QUERY,
  prepareItems,
  sortListItems,
  urlFor,
  type Category,
  type CategoryTotal,
  type Item,
  type List,
  type ListItem,
} from './utils';

export default function ListPage() {
  const {data: session} = useSession();

  // Move getUserId into useCallback
  const getUserId = useCallback(() => {
    if (!session?.user?.id) return null;
    return session.user.id.startsWith('google_') ? session.user.id : `google_${session.user.id}`;
  }, [session?.user?.id]);

  // State variables and Hooks
  const [items, setItems] = useState<Item[]>([]);
  const [list, setList] = useState<List | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<ListItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery] = useState('');
  const [tempSelectedItems, setTempSelectedItems] = useState<Item[]>([]);
  const pathname = usePathname();
  const listSlug = pathname?.split('/')[2];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add state for optimistic updates
  const [pendingQuantities, setPendingQuantities] = useState<{
    [key: string]: number;
  }>({});

  // Add a new state for dialog search
  const [dialogSearchQuery, setDialogSearchQuery] = useState('');

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

  // Add initial data fetch useEffect
  useEffect(() => {
    async function fetchData() {
      const userId = getUserId();
      const decodedSlug = decodeURIComponent(listSlug || '');
      console.log('Fetching list with:', {
        encodedSlug: listSlug,
        decodedSlug,
        userId,
      });

      if (!listSlug || !userId) return;

      try {
        const [fetchedList] = await Promise.all([client.fetch(LIST_QUERY(listSlug), {userId})]);

        console.log('Fetched list:', fetchedList); // Add this debug log

        if (fetchedList) {
          setList(fetchedList);
          setSelectedItems(fetchedList.items);
        } else {
          console.log('No list found with slug:', decodedSlug); // Add this debug log
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      }
    }

    fetchData();
  }, [listSlug, getUserId]);

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

    try {
      const updatedItems = selectedItems.filter(
        (listItem) => listItem.item?._id !== itemToRemove._id,
      );

      // Update through API route
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

      setSelectedItems(updatedItems);
    } catch (error) {
      console.error('Failed to remove item:', error);
      alert('Failed to remove item. Please try again.');
    }
  }

  // Update the filteredItemsForList useMemo
  const filteredItemsForList = useMemo(() => {
    let items = selectedItems;

    if (selectedCategory) {
      items = items.filter((item) => item.item?.category?._id === selectedCategory);
    }

    if (searchQuery) {
      items = items.filter((item) =>
        item.item?.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return sortListItems(items);
  }, [selectedItems, selectedCategory, searchQuery]);

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
      setTempSelectedItems(
        selectedItems.map((item) => item.item).filter((item): item is Item => item !== null),
      );
      setDialogSearchQuery(''); // Clear dialog search query when dialog opens
    }
  }

  // Update the categoryTotals calculation
  const {categoryTotals, grandTotal} = useMemo(() => {
    if (!selectedItems?.length) {
      const emptyTotal = {
        id: 'total',
        count: 0,
        weight: 0,
        calories: 0,
        title: 'Totalt',
      };
      return {
        categoryTotals: [],
        grandTotal: emptyTotal,
        totalWithoutOverrides: emptyTotal,
      };
    }

    // Create maps for both regular and override totals
    const categoryMap = new Map<string, CategoryTotal>();

    // Calculate totals
    selectedItems.forEach((item) => {
      if (!item.item) return;
      const quantity = item.quantity || 1;
      const effectiveCategory = item.item.category;
      if (!effectiveCategory) return;

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
      a.title.localeCompare(b.title, 'nb'),
    );

    // Calculate grand total
    const grandTotal = categoryTotals.reduce(
      (acc, cat) => ({
        id: 'total',
        title: 'Totalt',
        count: acc.count + cat.count,
        weight: acc.weight + cat.weight,
        calories: acc.calories + cat.calories,
      }),
      {id: 'total', title: 'Totalt', count: 0, weight: 0, calories: 0},
    );

    return {
      categoryTotals,
      grandTotal,
    };
  }, [selectedItems]);

  // Update the handleSaveChanges function
  async function handleSaveChanges() {
    try {
      setIsLoading(true);
      const userId = getUserId();

      if (!list || !listSlug || !userId) {
        throw new Error('Missing required data');
      }

      // Keep existing items with their current quantities AND category overrides
      const existingItems = prepareItems(selectedItems);

      // Add only truly new items
      const newItems = tempSelectedItems
        .filter((newItem) => !selectedItems.some((existing) => existing.item?._id === newItem._id))
        .map((item) => ({
          _key: nanoid(),
          _type: 'listItem',
          item: {
            _type: 'reference',
            _ref: item._id,
          },
          quantity: 1,
        }));

      console.log('Saving items with overrides:', existingItems);

      // Update in Sanity
      const response = await fetch('/api/updateList', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          listId: list._id,
          items: [...existingItems, ...newItems],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update list');
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
      console.error('Error saving changes:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQuantityChange(itemKey: string, newQuantity: number) {
    if (!list || !session?.user?.id || newQuantity < 1) return;

    // Update pending quantities immediately for optimistic UI
    setPendingQuantities((prev) => ({
      ...prev,
      [itemKey]: newQuantity,
    }));

    // Update selectedItems to reflect the new quantity.
    setSelectedItems((prev) => {
      const updatedItems = prev.map((item) => {
        if (item._key !== itemKey) return item;

        return {
          ...item,
          quantity: newQuantity,
        };
      });

      console.log('Updated selectedItems:', updatedItems); // Log updated items
      return updatedItems;
    });

    try {
      // Prepare items for server update.
      const itemsForUpdate = prepareItems(selectedItems);

      console.log('Items for update:', itemsForUpdate); // Log items being sent to the API

      const response = await fetch('/api/updateList', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          listId: list._id,
          items: itemsForUpdate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      // Clear pending after successful update
      setPendingQuantities((prev) => {
        const newPending = {...prev};
        delete newPending[itemKey];
        return newPending;
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Revert both optimistic updates on error
      setPendingQuantities((prev) => {
        const newPending = {...prev};
        delete newPending[itemKey];
        return newPending;
      });
      setSelectedItems((prev) =>
        prev.map((item) =>
          item._key === itemKey ? {...item, quantity: item.quantity || 1} : item,
        ),
      );
    }
  }

  // Update the useEffect for dialog items
  useEffect(() => {
    async function fetchItems() {
      if (isDialogOpen && session?.user?.id) {
        // Add session check
        try {
          console.log('Fetching items...');
          const fetchedItems = await client.fetch(ITEMS_QUERY, {
            userId: session.user.id, // Add userId parameter
          });
          console.log('Fetched items:', fetchedItems);
          setItems(fetchedItems);
        } catch (error) {
          console.error('Error fetching items:', error);
        }
      }
    }

    fetchItems();
  }, [isDialogOpen, session?.user?.id]); // Add session?.user?.id to dependencies

  async function handleOnBodyChange(itemKey: string, checked: boolean) {
    if (!list) return;

    const updatedItems = selectedItems.map((item) => {
      if (item._key !== itemKey) return item;
      return {
        ...item,
        onBody: checked,
      };
    });

    // Optimistically update the UI.
    setSelectedItems(updatedItems);

    try {
      await fetch('/api/updateList', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          listId: list._id,
          items: prepareItems(updatedItems),
        }),
      });
    } catch {
      // Revert the checkbox state on error.
      setSelectedItems((prev) =>
        prev.map((item) => (item._key === itemKey ? {...item, onBody: !checked} : item)),
      );
    }
  }

  async function handleCheckboxChange(itemKey: string, checked: boolean) {
    if (!list) return;

    const updatedItems = selectedItems.map((item) => {
      if (item._key !== itemKey) return item;
      return {
        ...item,
        checked: checked,
      };
    });

    // Optimistically update the UI.
    setSelectedItems(updatedItems);

    try {
      await fetch('/api/updateList', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          listId: list._id,
          items: prepareItems(updatedItems),
        }),
      });
    } catch {
      // Revert the checkbox state on error.
      setSelectedItems((prev) =>
        prev.map((item) => (item._key === itemKey ? {...item, checked: !checked} : item)),
      );
    }
  }

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
            <Icon name="user" width={16} height={16} />
            {list.participants}
          </p>
          <p className="tag-list w-fit items-center gap-x-1 flex flex-wrap">
            <Icon name="calendar" width={16} height={16} />
            {list.days}
          </p>
        </div>
        <div className="flex gap-y-4 gap-x-2">
          {/* Button to open the Add Item Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <button className="button-create text-lg flex flex-row items-center gap-x-1 text-md">
                <Icon name="add" width={24} height={24} />
                Legg til
              </button>
            </DialogTrigger>
            {/* Updated DialogContent */}
            <DialogContent className="dialog p-4 max-w-lg md:p-10 rounded-2xl h-[80vh] no-scrollbar flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-2xl text-accent font-normal">
                  Legg til utstyr
                </DialogTitle>
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
                          tempSelectedItems.some((selected) => selected._id === item._id)
                            ? 'active'
                            : ''
                        }`}
                        onClick={() => handleTempItemToggle(item)}
                      >
                        <div className="flex flex-grow items-center gap-x-4">
                          <div className="h-16 w-16">
                            {item?.image ? (
                              <Image
                                className="rounded-md h-full w-full object-cover"
                                src={urlFor(item.image).url()}
                                alt={`Bilde av ${item?.name || 'item'}`}
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

        <div className="flex gap-x-2 no-scrollbar my-8 p-2">
          {categories.length > 0 && (
            <>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`menu-category text-md ${
                  selectedCategory === null ? 'menu-active' : ''
                }`}
              >
                Oversikt
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => setSelectedCategory(category._id)}
                  className={`menu-category text-md ${
                    selectedCategory === category._id ? 'menu-active' : ''
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
          <ul className="totals flex flex-col w-full gap-y-4">
            <li>
              {selectedCategory === null ? (
                // "Alle" view with category totals
                <div className="flex flex-col gap-y-2">
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
                            {total.calories > 0 ? `${formatNumber(total.calories)} kcal` : ''}
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
                            : ''}
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
                      categoryTotals.find((cat) => cat.id === selectedCategory)?.count || 0,
                    )}{' '}
                    stk
                  </p>
                  <p className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
                    {formatWeight(
                      categoryTotals.find((cat) => cat.id === selectedCategory)?.weight || 0,
                    )}
                  </p>
                  <p className="text-md sm:text-xl text-accent font-medium font-sans tabular-nums">
                    {(categoryTotals.find((cat) => cat.id === selectedCategory)?.calories || 0) > 0
                      ? `${formatNumber(categoryTotals.find((cat) => cat.id === selectedCategory)?.calories || 0)} kcal`
                      : ''}
                  </p>
                </div>
              )}
            </li>
          </ul>
        ) : (
          <div className="text-center text-accent text-2xl min-h-[50vh] flex items-center justify-center">
            Fordelen med en tom liste er at den veier 0 gram. Ulempen er at du har 0 kalorier å gå
            på
          </div>
        )}

        {/* Display selected items */}

        <ul className="flex flex-col divide-y divide-white/5">
          {filteredItemsForList.map((listItem) => {
            console.log('Rendering item:', listItem);
            return (
              <li key={listItem._key} className="product py-4">
                <div className="flex flex-wrap gap-y-6 md:gap-y-0 items-center gap-x-4">
                  <div className="aspect-square h-16 w-16">
                    {listItem.item?.image ? (
                      <Image
                        className="rounded-md h-full w-full object-cover"
                        src={urlFor(listItem.item.image).url()}
                        alt={`Bilde av ${listItem.item?.name || 'item'}`}
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
                    <h2 className="text-xl text-accent">{listItem.item?.name || 'Unnamed Item'}</h2>
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
                  <div className="flex ml-auto"></div>

                  <div className="flex items-center w-full md:w-auto gap-x-2 ml-auto">
                    <div className="flex w-full">
                      <div className="flex items-center gap-x-1 bg-dimmed-hover rounded p-1">
                        <button
                          onClick={() =>
                            handleQuantityChange(listItem._key, (listItem.quantity || 1) - 1)
                          }
                          disabled={(listItem.quantity || 1) <= 1}
                          className="p-1 px-4 hover:bg-dimmed rounded disabled:opacity-50"
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
                            handleQuantityChange(listItem._key, (listItem.quantity || 1) + 1)
                          }
                          className="p-1 px-4 hover:bg-dimmed rounded disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Add check button */}
                    <input
                      type="checkbox"
                      title="På kropp"
                      checked={listItem.onBody ?? false}
                      onChange={(e) => handleOnBodyChange(listItem._key, e.target.checked)}
                    />

                    {/* Add check button */}
                    <input
                      type="checkbox"
                      title="Pakket"
                      checked={listItem.checked ?? false}
                      onChange={(e) => handleCheckboxChange(listItem._key, e.target.checked)}
                    />

                    {/* Existing delete button */}
                    <button
                      onClick={() => listItem.item && handleRemoveFromList(listItem.item)}
                      className="button-ghost flex gap-x-2 h-fit align-middle"
                    >
                      <Icon name="delete" width={24} height={24} fill="#EAFFE2" />
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
