'use client';

import {ProtectedRoute} from '@/components/auth/ProtectedRoute';
import {client} from '@/sanity/client';

import {Icon} from '@/components/Icon';
import {ImportForm} from '@/components/ImportForm';
import {LoadingSpinner} from '@/components/ui/LoadingSpinner';
import {GearStats} from '@/components/GearStats';
import {urlFor} from '@/sanity/images';
import {Query} from '@/sanity/queries';
import type {Category, Item} from '@/types';
import {useSession} from 'next-auth/react';
import Image from 'next/image';
import {useEffect, useMemo, useState} from 'react';
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
  DialogTrigger,
} from '../components/ui/dialog';
import {CategoryList} from '../components/CategoryList';
import {AddCategoryForm} from '../components/AddCategoryForm';

export default function IndexPage() {
  const {data: session} = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<Item | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<{src: string; alt: string} | null>(null);

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

  const sortedItems: Item[] = useMemo(
    () => [...items].sort((a: Item, b: Item) => a.name.localeCompare(b.name, 'nb')),
    [items],
  );

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
    } else {
      setSelectedCategory(null);
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

  async function confirmDeleteItem() {
    if (!itemToDelete) return;
    setIsLoadingDelete(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-8 h-8 text-accent" />
      </div>
    );
  }
  return (
    <ProtectedRoute>
      <main className="container mx-auto min-h-screen p-16">
        <div className="flex flex-row gap-y-4 gap-x-2 pb-8 overflow-y-auto no-scrollbar p-1">
          {/* New Item Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="button-create text-md flex flex-shrink-0 flex-row items-center gap-x-1">
                Add
              </button>
            </DialogTrigger>
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
                    // Close the dialog after a short delay to ensure the success message is seen
                    setTimeout(() => {
                      const closeButton = document.querySelector('[data-dialog-close]');
                      (closeButton as HTMLButtonElement)?.click();
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
            <DialogTrigger asChild>
              <button className="button-create text-md flex flex-row items-center gap-x-1">
                Categories
              </button>
            </DialogTrigger>
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

          {/* Import Dialog Button */}
          <button
            className="button-create text-md gap-x-1 flex flex-row items-center"
            onClick={handleOpenImportDialog}
          >
            Excel
          </button>
        </div>
        {/* Categories Menu */}
        <div className="flex gap-x-2 no-scrollbar mb-4 p-2 overflow-x-auto pt-1">
          {items.length > 0 && (
            <button
              onClick={() => handleCategorySelect(null)}
              className={`menu-category text-md ${selectedCategory === null ? 'menu-active' : ''}`}
            >
              All
            </button>
          )}
          {categoriesWithItems.map((category: Category) => (
            <button
              key={category._id}
              onClick={() => handleCategorySelect(category)}
              className={`menu-category text-md ${
                selectedCategory === category._id ? 'menu-active' : ''
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>

        {/* Gear Stats */}
        {items.length > 0 && <GearStats items={filteredItems} />}
        {/* Add this condition before the items list */}
        {filteredItems.length === 0 ? (
          <div className="text-center text-accent text-3xl min-h-[50vh] flex items-center justify-center">
            {selectedCategory
              ? 'No gear in this category yet. Add some new!'
              : 'You have not added any gear yet. The advantage is that it weighs 0 grams!'}
          </div>
        ) : (
          <ul className="flex flex-col">
            {filteredItems.map((item: Item) => (
              <li key={item._id} className="product flex items-center gap-4 py-2 rounded-md">
                <div className="flex flex-grow items-center gap-x-4">
                  <div className="aspect-square h-16 w-16">
                    {item.image?.asset ? (
                      <Image
                        src={urlFor(item.image.asset)}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-md h-full w-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() =>
                          item.image?.asset &&
                          setExpandedImage({
                            src: urlFor(item.image.asset),
                            alt: item.name,
                          })
                        }
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

                  <div className="flex flex-col flex-grow">
                    <h2 className="text-lg md:text-xl text-accent mb-1">{item.name}</h2>
                    <div className="flex flex-wrap gap-x-1">
                      {item.size && (
                        <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                          <Icon name="size" width={16} height={16} />
                          {item.size}
                        </p>
                      )}
                      {item.weight && item.weight.weight > 0 && (
                        <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                          <Icon name="weight" width={16} height={16} />
                          {item.weight.weight} {item.weight.unit}
                        </p>
                      )}
                      {typeof item.calories !== 'undefined' && item.calories > 0 && (
                        <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                          <Icon name="calories" width={16} height={16} />
                          {item.calories} kcal
                        </p>
                      )}
                      {typeof item.price !== 'undefined' && item.price > 0 && (
                        <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                          {new Intl.NumberFormat('nb-NO', {
                            style: 'currency',
                            currency: 'NOK',
                          }).format(item.price)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-x-2 ml-auto">
                    {/* Desktop buttons */}
                    <div className="hidden md:flex gap-x-2">
                      <button
                        className="button-ghost flex gap-x-2 h-fit align-middle"
                        onClick={() => setIsEditDialogOpen(item)}
                      >
                        <Icon name="edit" width={24} height={24} fill="#EAFFE2" />
                      </button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="button-ghost flex gap-x-2 h-fit align-middle"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item._id);
                            }}
                          >
                            <Icon name="delete" width={24} height={24} fill="#EAFFE2" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="dialog gap-y-8">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-normal text-accent">
                              Are you sure you want to delete &quot;{item.name}
                              &quot;?
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
                            <DialogClose asChild>
                              <button
                                type="button"
                                className="button-secondary"
                                onClick={() => {
                                  setItemToDelete(null);
                                  setErrorMessage('');
                                }}
                              >
                                Avbryt
                              </button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden relative">
                      <button
                        className="button-ghost flex gap-x-2 h-fit align-middle"
                        onClick={() => setActiveMenuId(activeMenuId === item._id ? null : item._id)}
                      >
                        <Icon name="ellipsis" width={24} height={24} fill="#EAFFE2" />
                      </button>

                      {activeMenuId === item._id && (
                        <div className="absolute right-0 top-full mt-1 bg-primary rounded-md shadow-lg z-50">
                          <button
                            className="flex items-center gap-x-2 w-full px-4 py-2 hover:bg-white/5"
                            onClick={() => {
                              setIsEditDialogOpen(item);
                              setActiveMenuId(null);
                            }}
                          >
                            <Icon name="edit" width={20} height={20} fill="#EAFFE2" />
                            <span>Edit</span>
                          </button>
                          <button
                            className="flex items-center gap-x-2 w-full px-4 py-2 hover:bg-white/5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item._id);
                              setActiveMenuId(null);
                            }}
                          >
                            <Icon name="delete" width={20} height={20} fill="currentColor" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
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
        <Dialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
          <DialogContent className="dialog gap-y-8">
            <DialogHeader>
              <DialogTitle>Are you sure you want to delete this category?</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <button onClick={confirmDeleteCategory} className="button-primary-accent">
                Yes, delete
              </button>
              <DialogClose asChild>
                <button type="button" className="button-secondary">
                  Cancel
                </button>
              </DialogClose>
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
        <Dialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
          <DialogContent className="dialog gap-y-8">
            <DialogHeader>
              <DialogTitle className="text-xl font-normal text-accent">
                Are you sure you want to delete &quot;
                {items.find((item) => item._id === itemToDelete)?.name}
                &quot;?
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
              <DialogClose asChild>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    setItemToDelete(null);
                    setErrorMessage('');
                  }}
                >
                  Avbryt
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Expansion Modal */}
        <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
          <DialogContent className="dialog p-4 max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-normal text-accent">
                {expandedImage?.alt}
              </DialogTitle>
            </DialogHeader>
            {expandedImage && (
              <div className="flex justify-center">
                <Image
                  src={expandedImage.src}
                  alt={expandedImage.alt}
                  width={800}
                  height={800}
                  className="max-w-full max-h-[70vh] object-contain rounded-md"
                />
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <button type="button" className="button-secondary">
                  Close
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </ProtectedRoute>
  );
}
