// src/types/index.ts

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
  price?: number;
  categories?: Category[]; // Populated categories
}
export interface ListDocument {
  _id: string;
  slug: {current: string};
  name: string;

  days: number;
  weight: number;
  participants: number;
  items: Array<{
    _key: string;
    quantity?: number;
    item: {
      _id: string;
      name: string;
      weight?: {
        weight: number;
        unit: string;
      };
      calories?: number;
    } | null;
  }>;
}
