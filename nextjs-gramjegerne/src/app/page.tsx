"use client";
// src/app/page.tsx
import imageUrlBuilder from "@sanity/image-url";
import { client } from "@/sanity/client";
import { useState, useEffect } from "react";
import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { useRouter, usePathname } from "next/navigation";
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
} from "../components/ui/dialog"; // Adjust this import path if necessary

// Define Category and Item types
interface Category {
  _id: string;
  title: string;
  slug: { current: string };
}
interface Item {
  _id: string;
  name: string;
  categories?: { _id: string; title: string }[]; // Populated categories
  image?: SanityImageSource;
  size?: string;
  weight?: { weight: number; unit: string };
  quantity?: number;
  calories?: number;
}

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// Define your queries
const CATEGORIES_QUERY = `*[_type == "category"]{_id, title, slug}`;
const ITEMS_QUERY = `*[_type == "item"]{
  _id, name, slug, image, 
  "categories": categories[]-> {_id, title}, 
  size, weight, quantity, calories
}`;

export default function IndexPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [itemToDelete, setItemToDelete] = useState<string | null>(null); // Track item for deletion
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null); // Track category for deletion
  const [allCategories, setAllCategories] = useState<Category[]>([]); // Fetch all categories

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedItems: Item[] = await client.fetch(ITEMS_QUERY);
        const fetchedCategories: Category[] =
          await client.fetch(CATEGORIES_QUERY);

        // Filter categories to only those with items
        const categoriesWithEntries = fetchedCategories.filter((category) =>
          fetchedItems.some((item) =>
            item.categories?.some((cat) => cat._id === category._id),
          ),
        );

        setItems(fetchedItems);
        setAllCategories(fetchedCategories); // Set all categories for the dialog
        setCategories(categoriesWithEntries); // Set filtered categories for the main page
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update selectedCategory based on URL path
  useEffect(() => {
    const slugInPath = pathname?.slice(1); // Get the category slug from URL
    const matchingCategory = categories.find(
      (category) => category.slug.current === slugInPath,
    );

    if (matchingCategory) {
      setSelectedCategory(matchingCategory._id);
    } else {
      setSelectedCategory(null);
    }
  }, [pathname, categories]);

  const filteredItems = selectedCategory
    ? items.filter((item) =>
        item.categories?.some((category) => category._id === selectedCategory),
      )
    : items;

  const sortedItems = filteredItems.sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const handleCategorySelect = (category: Category | null) => {
    if (category) {
      setSelectedCategory(category._id);
      router.push(`/?category=${category.slug.current}`);
    } else {
      setSelectedCategory(null);
      router.push("/");
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      const response = await fetch("/api/deleteItem", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId: itemToDelete }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete item");
      }
      setItems((prevItems) =>
        prevItems.filter((item) => item._id !== itemToDelete),
      );
      setItemToDelete(null); // Reset dialog state
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };
  const handleAddCategory = async () => {
    if (!newCategoryName || isLoading) return;

    setIsLoading(true);

    const categoryExists = allCategories.some(
      (category) =>
        category.title.toLowerCase() === newCategoryName.toLowerCase(),
    );

    if (categoryExists) {
      console.error("Category already exists:", newCategoryName);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/addCategory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newCategoryName }),
      });

      if (!response.ok) throw new Error("Failed to add category");

      const newCategory = await response.json();
      setAllCategories((prevCategories) => [...prevCategories, newCategory]); // Add to all categories
      setCategories((prevCategories) => [...prevCategories, newCategory]); // Optionally add to displayed categories
      setNewCategoryName("");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasReferences = async (categoryId: string): Promise<boolean> => {
    const itemsWithCategory = await client.fetch(
      `*[_type == "item" && references("${categoryId}")]`,
    );
    return itemsWithCategory.length > 0;
  };

  // Function to confirm deletion of a category
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const referencesExist = await hasReferences(categoryToDelete);
      if (referencesExist) {
        alert("Cannot delete category. It has references in items.");
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
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="container mx-auto min-h-screen p-16">
      <div className="flex gap-x-2 no-scrollbar mb-4 p-2">
        {/* Button to reset the filter */}
        <button
          onClick={() => handleCategorySelect(null)}
          className={`menu-category text-md ${
            selectedCategory === null ? "menu-active" : "menu-category"
          }`}
        >
          Alle
        </button>
        {/* Render category filter buttons */}
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => handleCategorySelect(category)}
            className={`menu-category text-md ${
              selectedCategory === category._id
                ? "menu-active"
                : "menu-category"
            }`}
          >
            {category.title}
          </button>
        ))}
        {/* Add Category Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="menu-category flex flex-row items-center gap-x-1 text-md">
              <svg
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.3281 1.82034L14.4219 0.914088L14.9375 0.406276C15.1719 0.171901 15.5 0.140651 15.7188 0.367213L15.8516 0.492213C16.0859 0.734401 16.0859 1.0469 15.8359 1.30471L15.3281 1.82034ZM6.17969 10.2266C6.0625 10.2735 5.92969 10.1328 5.98438 10.0235L6.625 8.72659L13.8984 1.44534L14.7969 2.34378L7.52344 9.62503L6.17969 10.2266ZM3.125 15.3985C1.60156 15.3985 0.820312 14.625 0.820312 13.1172V4.13284C0.820312 2.61721 1.60156 1.84378 3.125 1.84378H12.2109L11.25 2.81253H3.14062C2.26562 2.81253 1.78906 3.28128 1.78906 4.17971V13.0625C1.78906 13.9688 2.26562 14.4297 3.14062 14.4297H12.2031C12.9297 14.4297 13.4062 13.9688 13.4062 13.0625V5.01565L14.375 4.05471V13.1172C14.375 14.625 13.5938 15.3985 12.2266 15.3985H3.125Z"
                  fill="#EAFFE2"
                />
              </svg>
              Rediger
            </button>
          </DialogTrigger>
          <DialogContent className="dialog p-8 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-normal">
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
              />
              <button
                type="submit"
                className="button-primary-accent"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add Category"}
              </button>
            </form>
            <p>Kategorier</p>
            <ul className="category-list p-2 no-scrollbar flex flex-col gap-y-2 max-h-[30vh] overflow-y-auto">
              {allCategories.map((category) => (
                <li
                  key={category._id}
                  className="category p-2 flex justify-between items-center"
                >
                  <span>{category.title}</span>
                  <button
                    className="button-link"
                    onClick={() => setCategoryToDelete(category._id)}
                  >
                    Slett
                  </button>
                </li>
              ))}
            </ul>

            <DialogFooter>
              <DialogClose asChild>
                <button type="button" className="button-secondary">
                  Close
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog for Deleting Category */}
        <Dialog
          open={!!categoryToDelete}
          onOpenChange={() => setCategoryToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Are you sure you want to delete this category?
              </DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <button
                onClick={confirmDeleteCategory}
                className="button-primary-accent"
              >
                Yes, Delete
              </button>
              <DialogClose asChild>
                <button type="button" className="button-secondary">
                  Cancel
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <ul className="flex flex-col">
        {sortedItems.map((item) => (
          <li className="product flex items-center gap-4 py-2" key={item._id}>
            <div className="flex flex-grow items-center gap-x-4">
              <div className="h-24 w-24">
                {item.image ? (
                  <img
                    className="rounded-md h-full w-full object-cover"
                    src={urlFor(item.image).url()}
                  />
                ) : (
                  <div className="h24 w-24 flex items-center placeholder_image">
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
                <h2 className="text-xl truncate">{item.name}</h2>
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

              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="button-ghost flex gap-x-2 h-fit ml-auto align-middle"
                    onClick={() => setItemToDelete(item._id)} // Open dialog
                  >
                    <Icon name="delete" width={24} height={24} fill="#EAFFE2" />
                  </button>
                </DialogTrigger>
                <DialogContent className="dialog gap-y-8">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-normal">
                      Er du sikker på at du vil slette &quot;{item.name}&quot;?
                    </DialogTitle>
                  </DialogHeader>

                  <DialogFooter className="gap-y-4 gap-x-1">
                    <button
                      className="button-primary-accent"
                      onClick={confirmDeleteItem}
                    >
                      Slett
                    </button>
                    <DialogClose asChild>
                      <button
                        className="button-secondary"
                        onClick={() => setItemToDelete(null)}
                      >
                        Avbryt
                      </button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </li>
        ))}
      </ul>

      <Dialog>
        <DialogTrigger asChild>
          <button className="button-primary btn-center">Legg til</button>
        </DialogTrigger>
        <DialogContent className="dialog p-10 rounded-2xl max-h-[90vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl font-normal">
              Add New Item
            </DialogTitle>
          </DialogHeader>
          <NewItemForm />
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
  );
}
