// src/types/index.ts

export interface Category {
  _id: string;
  title: string;
  slug: { current: string };
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
  weight?: { weight: number; unit: string };
  quantity?: number;
  calories?: number;
  categories?: Category[]; // Populated categories
}
