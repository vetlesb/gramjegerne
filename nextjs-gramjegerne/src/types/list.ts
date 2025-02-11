// src/types/list.ts

export interface Category {
  _id: string;
  title: string;
  slug: {current: string};
}

export interface ImageAsset {
  _ref: string;
  url?: string;
}

export interface Item {
  _id: string;
  name: string;
  slug: string;
  image?: {
    asset: ImageAsset;
  };
  size?: string;
  weight?: {weight: number; unit: string};
  quantity?: number;
  calories?: number;
  categories?: Category[]; // Populated categories
  category?: Category; // Single category reference
}

export interface ListItem {
  _key: string;
  _type: string;
  quantity?: number;
  item: Item | null;
  categoryOverride?: Category;
}

export interface List {
  _id: string;
  name: string;
  slug?: {current: string};
  days?: number;
  weight?: number;
  participants?: number;
  image?: {
    asset: ImageAsset;
  };
  items: ListItem[];
}
