'use client';

import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {client} from '@/sanity/client';

import {ImportForm} from '@/components/ImportForm';
import {LoadingSpinner} from '@/components/ui/LoadingSpinner';
import {urlFor} from '@/sanity/images';
import {Query} from '@/sanity/queries';
import type {Category, Item} from '@/types';
import {useSession} from 'next-auth/react';
import Image from 'next/image';
import {useEffect, useMemo, useState, Suspense, useRef} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {useDelayedLoader} from '@/hooks/useDelayedLoader';
import {EditItemForm} from '../components/EditItemForm';
import NewItemForm from '../components/NewItemForm';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {CategoryList} from '../components/CategoryList';
import {AddCategoryForm} from '../components/AddCategoryForm';

// New shared components
import {ActionBar} from '@/components/ActionBar';
import {CategoryFilter} from '@/components/CategoryFilter';
import {ItemCard} from '@/components/ItemCard';
import {OverviewStats} from '@/components/OverviewStats';

// Convert category name to URL-safe slug
function categoryToSlug(categoryName: string): string {
  return categoryName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

function IndexPageContent() {
  const {data: session} = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    // Initialize from URL or localStorage fallback
    const urlCategory = searchParams.get('category');
    if (urlCategory) {
      // Find category by slug from URL
      const foundCategory = categories.find((cat) => categoryToSlug(cat.title) === urlCategory);
      return foundCategory?._id || null;
    }

    // Fallback to localStorage if no URL param
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gearLastCategory') || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const showLoader = useDelayedLoader(loading, 300);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemUsageInfo, setItemUsageInfo] = useState<{
    itemName: string;
    lists: Array<{_id: string; name: string}>;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<Item | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<Item | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('gearViewMode') as 'list' | 'grid') || 'list';
    }
    return 'list';
  });
  const [sortBy, setSortBy] = useState<'name' | 'weight-low' | 'weight-high' | 'calories'>('name');
  const isUpdatingURL = useRef(false);

  // Handle view mode change
  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('gearViewMode', mode);
  };

  // Sync URL state with component state (only when URL changes externally)
  useEffect(() => {
    // Skip if we're making our own URL update
    if (isUpdatingURL.current) {
      isUpdatingURL.current = false;
      return;
    }

    const urlCategory = searchParams.get('category');

    if (urlCategory) {
      // Find category by slug from URL
      const foundCategory = categories.find((cat) => categoryToSlug(cat.title) === urlCategory);
      const categoryId = foundCategory?._id || null;

      if (categoryId !== selectedCategory) {
        setSelectedCategory(categoryId);
        // Update localStorage fallback with ID
        if (categoryId) {
          localStorage.setItem('gearLastCategory', categoryId);
        }
      }
    } else if (selectedCategory !== null) {
      // URL has no category, clear selection
      setSelectedCategory(null);
      localStorage.removeItem('gearLastCategory');
    }
  }, [searchParams, categories, selectedCategory]);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.id) return;

      try {
        const [fetchedItems, fetchedCategories] = await Promise.all([
          client.fetch<Item[]>(Query.ITEMS, {
            userId: session.user.id,
          }),
          client.fetch<Category[]>(Query.CATEGORIES, {
            userId: session.user.id,
          }),
        ]);

        setItems(fetchedItems);
        // Sort categories alphabetically
        setCategories(
          fetchedCategories.sort((a: Category, b: Category) =>
            a.title.localeCompare(b.title, 'nb'),
          ),
        );
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session?.user?.id]);

  const sortedItems: Item[] = useMemo(() => {
    return [...items].sort((a: Item, b: Item) => {
      if (sortBy === 'weight-low') {
        // Sort by weight, lowest first
        const weightA = a.weight?.weight || 0;
        const weightB = b.weight?.weight || 0;
        if (weightA !== weightB) return weightA - weightB;
        // Secondary sort: A-Z if weights are equal
        return a.name.localeCompare(b.name, 'nb');
      }
      
      if (sortBy === 'weight-high') {
        // Sort by weight, highest first
        const weightA = a.weight?.weight || 0;
        const weightB = b.weight?.weight || 0;
        if (weightA !== weightB) return weightB - weightA;
        // Secondary sort: A-Z if weights are equal
        return a.name.localeCompare(b.name, 'nb');
      }
      
      if (sortBy === 'calories') {
        // Sort by calories, highest first
        const caloriesA = a.calories || 0;
        const caloriesB = b.calories || 0;
        if (caloriesA !== caloriesB) return caloriesB - caloriesA;
        // Secondary sort: A-Z if calories are equal (especially 0)
        return a.name.localeCompare(b.name, 'nb');
      }
      
      // Default: sort by name A-Z
      return a.name.localeCompare(b.name, 'nb');
    });
  }, [items, sortBy]);

  const filteredItems: Item[] = useMemo(() => {
    if (!selectedCategory) return sortedItems;
    return sortedItems.filter((item: Item) => item.category?._id === selectedCategory);
  }, [sortedItems, selectedCategory]);

  // Add this new useMemo to filter categories that have items
  const categoriesWithItems = useMemo(() => {
    return categories.filter((category) =>
      items.some((item) => item.category?._id === category._id),
    );
  }, [categories, items]);

  function handleCategorySelect(category: Category | null) {
    if (category) {
      setSelectedCategory(category._id);

      // Mark that we're updating the URL ourselves
      isUpdatingURL.current = true;

      // Update URL with category slug (URL-safe)
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('category', categoryToSlug(category.title));
      router.push(`?${newSearchParams.toString()}`);

      // Save to localStorage as fallback
      localStorage.setItem('gearLastCategory', category._id);
    } else {
      setSelectedCategory(null);

      // Mark that we're updating the URL ourselves
      isUpdatingURL.current = true;

      // Remove category from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('category');
      router.push(newSearchParams.toString() ? `?${newSearchParams.toString()}` : '/');

      // Remove from localStorage
      localStorage.removeItem('gearLastCategory');
    }
  }

  async function refreshItemsWithoutLoading() {
    if (!session?.user?.id) return;

    try {
      const fetchedItems: Item[] = await client.fetch(Query.ITEMS, {
        userId: session.user.id,
      });
      setItems(fetchedItems);
    } catch (error) {
      console.error('Error refreshing items:', error);
      setErrorMessage('Failed to refresh items.');
    }
  }

  async function hasReferences(categoryId: string): Promise<boolean> {
    const itemsWithCategory = await client.fetch<Item[]>(
      `*[_type == "item" && category._ref == $categoryId]`,
      {categoryId},
    );
    return itemsWithCategory.length > 0;
  }

  async function confirmDeleteCategory() {
    if (!categoryToDelete) return;

    try {
      const referencesExist = await hasReferences(categoryToDelete);
      if (referencesExist) {
        setErrorMessage('Kan ikke slette kategori. Den har referanser i utstyr.');
        alert('Kan ikke slette kategori. Den har referanser i utstyr.');
        return;
      }

      const response = await fetch('/api/deleteCategory', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({categoryId: categoryToDelete}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }

      setCategories((prevCategories) =>
        prevCategories.filter((category) => category._id !== categoryToDelete),
      );
      setCategoryToDelete(null);
    } catch (error: unknown) {
      console.error('Error deleting category:', error);
      setErrorMessage('Failed to delete category.');
      alert('Failed to delete category.');
    }
  }

  async function handleDeleteClick(itemId: string) {
    setErrorMessage(null);
    try {
      // Fetch which lists contain this item
      const response = await fetch(`/api/checkItemUsage?itemId=${itemId}`);
      if (!response.ok) {
        throw new Error('Failed to check item usage');
      }

      const data = await response.json();
      setItemUsageInfo(data);
      setItemToDelete(itemId);
    } catch (error: unknown) {
      console.error('Error checking item usage:', error);
      setErrorMessage('Failed to check item usage');
    }
  }

  async function confirmDeleteItem() {
    if (!itemToDelete) return;
    setIsLoadingDelete(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/deleteItem?itemId=${itemToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kunne ikke slette utstyr');
      }

      setItems((prevItems) => prevItems.filter((item) => item._id !== itemToDelete));
      setItemToDelete(null);
      setItemUsageInfo(null);
    } catch (error: unknown) {
      console.error('Error deleting item:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Kunne ikke slette utstyr');
    } finally {
      setIsLoadingDelete(false);
    }
  }

  async function handleImportSuccess() {
    // Refresh data immediately after successful import
    await refreshData();
  }

  function handleOpenImportDialog() {
    setIsImportDialogOpen(true);
  }

  async function refreshData() {
    if (!session?.user?.id) {
      console.log('No user session found');
      return;
    }

    try {
      console.log('Fetching data for user:', session.user.id);
      const [fetchedItems, fetchedCategories] = await Promise.all([
        client.fetch(Query.ITEMS, {
          userId: session.user.id,
        }),
        client.fetch(Query.CATEGORIES, {
          userId: session.user.id,
        }),
      ]);

      console.log('Fetched categories:', fetchedCategories);

      setItems(fetchedItems);
      setCategories(
        fetchedCategories.sort((a: Category, b: Category) => a.title.localeCompare(b.title, 'nb')),
      );
    } catch (error) {
      console.error('Error refreshing data:', error);
      setErrorMessage('Failed to refresh data');
    }
  }

  const handleUpdateCategory = async (categoryId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      setCategories((prev) =>
        prev
          .map((cat) => (cat._id === categoryId ? {...cat, title: newTitle} : cat))
          .sort((a: Category, b: Category) => a.title.localeCompare(b.title, 'nb')),
      );
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  // First, let's move the sortCategories function to the top of the component to ensure it's available everywhere
  const sortCategories = (categories: Category[]) => {
    return [...categories].sort((a: Category, b: Category) => a.title.localeCompare(b.title, 'nb'));
  };

  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen">
        {showLoader ? (
          <div className="flex items-center justify-center min-h-[80vh]">
            <LoadingSpinner className="w-8 h-8 text-accent" />
          </div>
        ) : loading ? (
          // Still loading but not showing spinner yet - show empty container to maintain layout
          <div className="min-h-[80vh]" />
        ) : (
          <>
            {/* Action Bar with dialogs */}
            <ActionBar
              mode="gear"
              onAddGear={() => setIsAddDialogOpen(true)}
              onManageCategories={() => setIsDialogOpen(true)}
              onExcel={handleOpenImportDialog}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* New Item Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogContent className="dialog p-4 md:p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-normal text-accent pb-8">
                    Add gear
                  </DialogTitle>
                </DialogHeader>
                <NewItemForm
                  onSuccess={async () => {
                    await refreshData();
                    return new Promise<void>((resolve) => {
                      setTimeout(() => {
                        setIsAddDialogOpen(false);
                        resolve();
                      }, 500);
                    });
                  }}
                />
                <DialogFooter>
                  <DialogClose data-dialog-close className="hidden" />
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add Category Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="dialog p-4 md:p-10 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-accent font-normal pb-8">
                    Add category
                  </DialogTitle>
                </DialogHeader>

                <AddCategoryForm
                  onSuccess={(newCategory) => {
                    setCategories((prev) => sortCategories([...prev, newCategory]));
                  }}
                />

                <p className="mt-6">Categories</p>
                <CategoryList
                  categories={categories}
                  onUpdate={handleUpdateCategory}
                  onDelete={setCategoryToDelete}
                />
              </DialogContent>
            </Dialog>

            {/* Categories Filter */}
            {items.length > 0 && (
              <CategoryFilter
                categories={categoriesWithItems}
                selectedCategory={selectedCategory}
                onCategorySelect={(categoryId) => {
                  if (categoryId === null) {
                    handleCategorySelect(null);
                  } else {
                    const category = categoriesWithItems.find((cat) => cat._id === categoryId);
                    if (category) {
                      handleCategorySelect(category);
                    }
                  }
                }}
                showAllButton={true}
                allButtonLabel="All"
              />
            )}

            {/* Overview Stats */}
            {items.length > 0 && (
              <OverviewStats
                mode="gear"
                layout="compact"
                totalItems={filteredItems.length}
                totalWeight={filteredItems.reduce(
                  (acc, item) => acc + (item.weight?.weight || 0),
                  0,
                )}
                totalPrice={filteredItems.reduce((acc, item) => acc + (item.price || 0), 0)}
              />
            )}
            {/* Add this condition before the items list */}
            {filteredItems.length === 0 ? (
              <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
                {selectedCategory
                  ? 'No gear in this category yet. Add some new!'
                  : 'You have not added any gear yet. The advantage is that it weighs 0 grams!'}
              </div>
            ) : (
              <ul
                className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-y-2'
                    : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4'
                }
              >
                {filteredItems.map((item: Item) =>
                  viewMode === 'list' ? (
                    // List view - use ItemCard component
                    <ItemCard
                      key={item._id}
                      mode="gear"
                      item={item}
                      onEdit={(item) => setIsEditDialogOpen(item)}
                      onDelete={(id) => handleDeleteClick(id)}
                      onImageClick={() => setExpandedItem(item)}
                      imageUrlBuilder={(asset) => urlFor(asset)}
                    />
                  ) : (
                    <ItemCard
                      key={item._id}
                      mode="grid"
                      item={item}
                      onEdit={(item) => setIsEditDialogOpen(item)}
                      onDelete={(id) => handleDeleteClick(id)}
                      onImageClick={() => setExpandedItem(item)}
                      imageUrlBuilder={(asset) => urlFor(asset)}
                    />
                  ),
                )}
              </ul>
            )}
            {/* Import Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogContent
                className="dialog p-4 md:p-8 rounded-2xl"
                onInteractOutside={(e) => e.preventDefault()}
              >
                <DialogHeader>
                  <DialogTitle className="text-2xl text-accent font-normal">Excel</DialogTitle>
                </DialogHeader>
                <DialogDescription className="flex flex-col description text-md pb-8">
                  Import or export your gear as .xlsx
                </DialogDescription>
                <ImportForm onSuccess={handleImportSuccess} />
                <DialogFooter className="pt-4"></DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Delete Category Dialog */}
            <Dialog open={!!categoryToDelete}>
              <DialogContent className="dialog gap-y-8">
                <DialogHeader>
                  <DialogTitle>Are you sure you want to delete this category?</DialogTitle>
                </DialogHeader>
                <DialogFooter>
                  <button onClick={confirmDeleteCategory} className="button-primary-accent">
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => setCategoryToDelete(null)}
                  >
                    Cancel
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Edit Item Dialog */}
            <Dialog open={!!isEditDialogOpen} onOpenChange={() => setIsEditDialogOpen(null)}>
              <DialogContent className="dialog p-4 md:p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                  <DialogTitle className="text-xl font-normal text-accent">Edit gear</DialogTitle>
                </DialogHeader>
                {isEditDialogOpen && (
                  <EditItemForm
                    item={isEditDialogOpen}
                    onSuccess={async () => {
                      await refreshItemsWithoutLoading();
                      setIsEditDialogOpen(null);
                    }}
                  />
                )}
                <DialogFooter />
              </DialogContent>
            </Dialog>
            {/* Delete confirmation dialog - moved outside the mobile menu */}
            <Dialog open={!!itemToDelete}>
              <DialogContent className="dialog gap-y-8">
                <DialogHeader>
                  <DialogTitle className="text-xl font-normal text-accent">
                    {itemUsageInfo && itemUsageInfo.lists.length > 0 ? (
                      <>
                        {itemUsageInfo.itemName} is in these lists, do you still want to delete it?
                        <ul className="mt-4 space-y-2 text-base font-normal">
                          {itemUsageInfo.lists.map((list) => (
                            <li
                              key={list._id}
                              className="text-primary text-lg p-2 bg-dimmed-hover rounded-md"
                            >
                              {list.name}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <>Are you sure you want to delete &quot;{itemUsageInfo?.itemName}&quot;?</>
                    )}
                  </DialogTitle>
                </DialogHeader>

                {errorMessage && <div className="text-red-500">{errorMessage}</div>}

                <DialogFooter className="gap-y-4 gap-x-1">
                  <button
                    className="button-primary-accent"
                    onClick={confirmDeleteItem}
                    disabled={isLoadingDelete}
                  >
                    {isLoadingDelete ? 'Sletter...' : 'Slett'}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => {
                      setItemToDelete(null);
                      setItemUsageInfo(null);
                      setErrorMessage('');
                    }}
                  >
                    Avbryt
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Gear Details Modal */}
            <Dialog open={!!expandedItem} onOpenChange={() => setExpandedItem(null)}>
              <DialogContent className="dialog p-0 gap-0 max-w-[500px] max-h-[90vh] overflow-y-auto no-scrollbar overflow-hidden">
                {expandedItem && (
                  <>
                    {expandedItem.image?.asset && (
                      <div className="relative w-full aspect-square bg-black/20">
                        <Image
                          src={urlFor(expandedItem.image.asset)}
                          alt={expandedItem.name}
                          fill
                          sizes="400px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-y-6 lg:p-8 p-4">
                      <div className="flex flex-col gap-y-3">
                        <DialogHeader className="text-left">
                          <DialogTitle className="lg:text-4xl text-xl font-normal text-accent text-left">
                            {expandedItem.name}
                          </DialogTitle>
                        </DialogHeader>
                        {expandedItem.description && (
                          <p className="whitespace-pre-wrap">{expandedItem.description}</p>
                        )}
                      </div>
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {expandedItem.category?.title && (
                          <div className="flex flex-col">
                            <dt className="text-sm opacity-70">Category</dt>
                            <dd>{expandedItem.category.title}</dd>
                          </div>
                        )}
                        {expandedItem.size && (
                          <div className="flex flex-col">
                            <dt className="text-sm opacity-70">Size</dt>
                            <dd>{expandedItem.size}</dd>
                          </div>
                        )}
                        {expandedItem.weight && expandedItem.weight.weight > 0 && (
                          <div className="flex flex-col">
                            <dt className="text-sm opacity-70">Weight</dt>
                            <dd>
                              {expandedItem.weight.weight} {expandedItem.weight.unit}
                            </dd>
                          </div>
                        )}
                        {expandedItem.calories !== undefined && expandedItem.calories > 0 && (
                          <div className="flex flex-col">
                            <dt className="text-sm opacity-70">Calories</dt>
                            <dd>{expandedItem.calories} kcal</dd>
                          </div>
                        )}
                        {expandedItem.price !== undefined && expandedItem.price > 0 && (
                          <div className="flex flex-col">
                            <dt className="text-sm opacity-70">Price</dt>
                            <dd>
                              {new Intl.NumberFormat('nb-NO', {
                                style: 'currency',
                                currency: 'NOK',
                              }).format(expandedItem.price)}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}

export default function IndexPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IndexPageContent />
    </Suspense>
  );
}
