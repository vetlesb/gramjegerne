import {client} from '@/sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type {SanityImageSource} from '@sanity/image-url/lib/types/types';

export const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export const ITEMS_QUERY = /* groq */ `*[_type == "item" && user._ref == $userId] {
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

export function LIST_QUERY(slug: string) {
  /* groq */
  const parsedSlug = decodeURIComponent(slug);
  return /* groq */ `*[_type == "list" && slug.current == "${parsedSlug}" && user._ref == $userId][0] {
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
	  checked,
    onBody,
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
}

export type CategoryTotal = {
  id: string;
  count: number;
  weight: number; // excluding onBody
  weightOnBody: number;
  calories: number;
  title: string;
};

export function formatWeight(weightInGrams: number): string {
  const weightInKg = weightInGrams / 1000;
  // Always use 3 decimals for precision
  return `${weightInKg.toFixed(3)} kg`;
}

/** Add this sorting function at component level */
export function sortListItems(items: ListItem[]): ListItem[] {
  return [...items].sort((a, b) => {
    const nameA = a.item?.name || '';
    const nameB = b.item?.name || '';
    return nameA.localeCompare(nameB, 'nb');
  });
}

export interface Category {
  _id: string;
  title: string;
}

export interface Item {
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

export interface ListItem {
  _key: string;
  _type: string;
  quantity?: number;
  item: Item | null;
  checked?: boolean;
  onBody?: boolean;
}

export interface List {
  _id: string;
  name: string;
  participants: number;
  days: number;
  items: ListItem[];
}

/**
 * Formats a number by adding spaces as thousand separators.
 *
 * @param num - The number to format.
 * @returns A string representation of the number with spaces as thousand separators.
 */

export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * `ListItems` retrieved from Sanity is not the expected format of a PATCH request.
 * Parse references into correct format.
 */
export function prepareItems(items: ListItem[]) {
  return items.map((item) => ({
    ...item,
    item: item.item && {_ref: item.item._id, _type: 'reference'},
  }));
}
