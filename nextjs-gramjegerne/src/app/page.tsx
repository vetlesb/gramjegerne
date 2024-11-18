"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import EditItemForm from "../components/EditItemForm";
import ImportForm from "@/components/ImportForm";
import NewItemForm from "../components/NewItemForm";
import Icon from "@/components/Icon";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "../components/ui/dialog";
import { useSession } from "next-auth/react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Category {
  _id: string;
  title: string;
  slug: { current: string };
}

interface ImageAsset {
  _ref: string;
  url?: string;
}

interface Item {
  _id: string;
  name: string;
  slug: string;
  image?: {
    asset: ImageAsset;
  };
  category?: {
    _id: string;
    title: string;
  };
  size?: string;
  weight?: { weight: number; unit: string };
  quantity?: number;
  calories?: number;
}

const builder = imageUrlBuilder(client);

function urlFor(source: ImageAsset) {
  return source.url || builder.image(source._ref).url();
}

const CATEGORIES_QUERY = `*[_type == "category" && user._ref == $userId]{
  _id, 
  title, 
  slug {
    current
  }
}`;

const ITEMS_QUERY = `*[_type == "item" && user._ref == $userId]{
  _id,
  name,
  slug,
  image{
    asset->{
      _ref,
      url
    }
  },
  "category": category->{_id, title},
  size,
  weight,
  quantity,
  calories
}`;
export default function IndexPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<Item | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      try {
        const [fetchedItems, fetchedCategories] = await Promise.all([
          client.fetch<Item[]>(ITEMS_QUERY, {
            userId: session.user.id,
          }),
          client.fetch<Category[]>(CATEGORIES_QUERY, {
            userId: session.user.id,
          }),
        ]);

        console.log(
          "Fetched items with categories:",
          fetchedItems.map((item: Item) => ({
            name: item.name,
            categoryId: item.category?._id,
            categoryTitle: item.category?.title,
          })),
        );

        console.log("All categories:", fetchedCategories);

        const sortedCategories = [...fetchedCategories].sort(
          (a: Category, b: Category) => a.title.localeCompare(b.title, "nb"),
        );

        setAllCategories(sortedCategories);

        const categoriesWithEntries = sortedCategories.filter(
          (category: Category) => {
            const hasItems = fetchedItems.some(
              (item: Item) => item.category?._id === category._id,
            );
            console.log(
              `Category ${category.title}: ${hasItems ? "has items" : "no items"}`,
            );
            return hasItems;
          },
        );

        setCategories(categoriesWithEntries);
        setItems(fetchedItems);
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMessage("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.id]);

  const sortedItems: Item[] = useMemo(
    () =>
      [...items].sort((a: Item, b: Item) => a.name.localeCompare(b.name, "nb")),
    [items],
  );

  const filteredItems: Item[] = useMemo(() => {
    if (!selectedCategory) return sortedItems;
    return sortedItems.filter(
      (item: Item) => item.category?._id === selectedCategory,
    );
  }, [sortedItems, selectedCategory]);

  const handleCategorySelect = (category: Category | null) => {
    if (category) {
      setSelectedCategory(category._id);
    } else {
      setSelectedCategory(null);
    }
  };

  const refreshItems = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const fetchedItems: Item[] = await client.fetch(ITEMS_QUERY, {
        userId: session.user.id,
      });
      setItems(fetchedItems);
    } catch (error) {
      console.error("Error refreshing items:", error);
      setErrorMessage("Failed to refresh items.");
    } finally {
      setLoading(false);
    }
  };
  const handleAddCategory = async () => {
    if (!newCategoryName || isLoadingDelete) return;
    setIsLoadingDelete(true);
    setErrorMessage(null);

    try {
      console.log("Current user session ID:", session?.user?.id);

      const response = await fetch("/api/addCategory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCategoryName,
          userId: session?.user?.id,
        }),
      });

      const data = await response.json();
      console.log("Add category response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to add category");
      }

      await refreshData();
      setNewCategoryName("");
    } catch (error) {
      console.error("Detailed error adding category:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to add category",
      );
      alert(
        `Failed to add category: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoadingDelete(false);
    }
  };

  const hasReferences = async (categoryId: string): Promise<boolean> => {
    const itemsWithCategory = await client.fetch<Item[]>(
      `*[_type == "item" && category._ref == $categoryId]`,
      { categoryId },
    );
    return itemsWithCategory.length > 0;
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const referencesExist = await hasReferences(categoryToDelete);
      if (referencesExist) {
        setErrorMessage(
          "Kan ikke slette kategori. Den har referanser i utstyr.",
        );
        alert("Kan ikke slette kategori. Den har referanser i utstyr.");
        return;
      }

      const response = await fetch("/api/deleteCategory", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categoryId: categoryToDelete }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }

      setAllCategories((prevCategories) =>
        prevCategories.filter((category) => category._id !== categoryToDelete),
      );
      setCategories((prevCategories) =>
        prevCategories.filter((category) => category._id !== categoryToDelete),
      );
      setCategoryToDelete(null);
    } catch (error: unknown) {
      console.error("Error deleting category:", error);
      setErrorMessage("Failed to delete category.");
      alert("Failed to delete category.");
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsLoadingDelete(true);
    try {
      const response = await fetch(`/api/deleteItem?itemId=${itemToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Kunne ikke slette utstyr");
      }

      setItems((prevItems) =>
        prevItems.filter((item) => item._id !== itemToDelete),
      );
      setItemToDelete(null);
    } catch (error: unknown) {
      console.error("Error deleting item:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Kunne ikke slette utstyr",
      );
    } finally {
      setIsLoadingDelete(false);
    }
  };

  const handleImportSuccess = async () => {
    // Refresh data immediately after successful import
    await refreshData();
  };

  const handleDialogClose = async () => {
    await refreshData(); // Use refreshData instead of just refreshItems
    setIsImportDialogOpen(false);
  };

  const handleOpenImportDialog = () => {
    setIsImportDialogOpen(true);
  };

  const refreshData = async () => {
    if (!session?.user?.id) {
      console.log("No user session found");
      return;
    }

    try {
      console.log("Fetching data for user:", session.user.id);
      const [fetchedItems, fetchedCategories] = await Promise.all([
        client.fetch(ITEMS_QUERY, {
          userId: session.user.id,
        }),
        client.fetch(CATEGORIES_QUERY, {
          userId: session.user.id,
        }),
      ]);

      console.log("Fetched categories:", fetchedCategories);

      const sortedCategories = [...fetchedCategories].sort((a, b) =>
        a.title.localeCompare(b.title, "nb"),
      );

      setAllCategories(sortedCategories);

      const categoriesWithEntries = sortedCategories.filter((category) =>
        fetchedItems.some((item: Item) => item.category?._id === category._id),
      );

      setCategories(categoriesWithEntries);
      setItems(fetchedItems);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setErrorMessage("Failed to refresh data");
    }
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
        <div className="flex flex-wrap gap-y-4 gap-x-2 pb-8">
          {/* New Item Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="button-create text-lg flex flex-row items-center gap-x-1 text-md">
                <Icon name="add" width={24} height={24} />
                Legg til
              </button>
            </DialogTrigger>
            <DialogContent className="dialog p-4 md:p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
              <DialogHeader>
                <DialogTitle className="text-xl font-normal text-accent">
                  Nytt utstyr
                </DialogTitle>
              </DialogHeader>
              <NewItemForm
                onSuccess={async () => {
                  await refreshData();
                  return new Promise<void>((resolve) => {
                    // Close the dialog after a short delay to ensure the success message is seen
                    setTimeout(() => {
                      const closeButton = document.querySelector(
                        "[data-dialog-close]",
                      );
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
              <button className="button-create text-lg flex flex-row items-center gap-x-1 text-md">
                <Icon name="category" width={24} height={24} />
                Kategorier
              </button>
            </DialogTrigger>
            <DialogContent className="dialog p-4 md:p-10 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl text-accent font-normal">
                  Legg til kategori
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddCategory();
                }}
                className="flex flex-col gap-y-4"
              >
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="p-4 border rounded"
                  required
                  placeholder="Kategori navn"
                />
                <button
                  type="submit"
                  className="button-primary-accent"
                  disabled={isLoadingDelete}
                >
                  {isLoadingDelete ? "Legger til..." : "Legg til"}
                </button>
              </form>

              <p className="mt-6">Kategorier</p>
              <ul className="category-list p-2 no-scrollbar flex flex-col gap-y-2 max-h-[50vh] overflow-y-auto">
                {allCategories.map((category) => (
                  <li
                    key={category._id}
                    className="category p-2 flex justify-between items-center"
                  >
                    <span>{category.title}</span>
                    <button
                      className="button-link text-red-500 hover:text-red-700"
                      onClick={() => setCategoryToDelete(category._id)}
                    >
                      Slett
                    </button>
                  </li>
                ))}
              </ul>
            </DialogContent>
          </Dialog>

          {/* Import Dialog Button */}
          <button
            className="button-create text-lg flex flex-row items-center gap-x-1 text-md"
            onClick={handleOpenImportDialog}
          >
            <Icon name="document" width={24} height={24} />
            Importer
          </button>
        </div>

        {/* Categories Menu */}
        <div className="flex gap-x-2 no-scrollbar mb-4 p-2 overflow-x-auto">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`menu-category text-md ${
              selectedCategory === null ? "menu-active" : ""
            }`}
          >
            Alle
          </button>
          {categories.map((category: Category) => (
            <button
              key={category._id}
              onClick={() => handleCategorySelect(category)}
              className={`menu-category text-md ${
                selectedCategory === category._id ? "menu-active" : ""
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <ul className="flex flex-col">
          {filteredItems.map((item: Item) => (
            <li
              key={item._id}
              className="product flex items-center gap-4 py-2 rounded-md"
            >
              <div className="flex flex-grow items-center gap-x-4">
                <div className="aspect-square h-16 w-16">
                  {item.image?.asset ? (
                    <Image
                      src={urlFor(item.image.asset)}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="rounded-md h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center placeholder_image">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-grow">
                  <h2 className="text-lg md:text-xl text-accent mb-1">
                    {item.name}
                  </h2>
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
                    {typeof item.calories !== "undefined" &&
                      item.calories > 0 && (
                        <p className="tag w-fit items-center gap-x-1 flex flex-wrap">
                          <Icon name="calories" width={16} height={16} />
                          {item.calories} kcal
                        </p>
                      )}
                  </div>
                </div>

                <div className="flex gap-x-2 ml-auto">
                  <button
                    className="button-ghost flex gap-x-2 h-fit align-middle"
                    onClick={() => setIsEditDialogOpen(item)}
                  >
                    <Icon name="edit" width={24} height={24} fill="#EAFFE2" />
                  </button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        className="button-ghost flex gap-x-2 h-fit ml-auto align-middle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item._id);
                        }}
                      >
                        <Icon
                          name="delete"
                          width={24}
                          height={24}
                          fill="#EAFFE2"
                        />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="dialog gap-y-8">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-normal text-accent">
                          Er du sikker på at du vil slette &quot;{item.name}
                          &quot;?
                        </DialogTitle>
                      </DialogHeader>

                      {errorMessage && (
                        <div className="text-red-500">{errorMessage}</div>
                      )}

                      <DialogFooter className="gap-y-4 gap-x-1">
                        <button
                          className="button-primary-accent"
                          onClick={confirmDeleteItem}
                          disabled={isLoadingDelete}
                        >
                          {isLoadingDelete ? "Sletter..." : "Slett"}
                        </button>
                        <DialogClose asChild>
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => {
                              setItemToDelete(null);
                              setErrorMessage("");
                            }}
                          >
                            Avbryt
                          </button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Import Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent
            className="dialog p-4 md:p-10 rounded-2xl"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-xl text-accent font-normal">
                Importer fra Excel
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="pb-4 text-lg">
              Last opp en Excel-fil for å importere utstyr.
              <Link
                className="underline"
                href="https://www.dropbox.com/scl/fi/ashfqy2f6c8s8wf4iwqpc/items_import_01.xlsx?rlkey=qwhflwgumnwxe094ki0jq4i3i&st=ogjoqt8n&dl=0"
              >
                Se eksempelfil
              </Link>
            </DialogDescription>
            <ImportForm onSuccess={handleImportSuccess} />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleDialogClose}
                >
                  Lukk
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Category Dialog */}
        <Dialog
          open={!!categoryToDelete}
          onOpenChange={() => setCategoryToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Er du sikker på at du vil slette denne kategorien?
              </DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <button
                onClick={confirmDeleteCategory}
                className="button-primary-accent"
              >
                Ja, Slett
              </button>
              <DialogClose asChild>
                <button type="button" className="button-secondary">
                  Avbryt
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog
          open={!!isEditDialogOpen}
          onOpenChange={() => setIsEditDialogOpen(null)}
        >
          <DialogContent className="dialog p-4 md:p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-xl font-normal text-accent">
                Rediger utstyr
              </DialogTitle>
            </DialogHeader>
            {isEditDialogOpen && (
              <EditItemForm
                item={isEditDialogOpen}
                onSuccess={async () => {
                  await refreshItems();
                  setIsEditDialogOpen(null);
                }}
              />
            )}
            <DialogFooter />
          </DialogContent>
        </Dialog>
      </main>
    </ProtectedRoute>
  );
}
