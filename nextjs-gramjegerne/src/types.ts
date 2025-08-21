// src/types.ts

import {SanityImageSource} from '@sanity/image-url/lib/types/types';
import {SanityDocument} from 'next-sanity';

export interface ListDocument extends SanityDocument {
  slug: {current: string};
  name: string;
  image?: SanityImageSource;
  days?: number;
  weight?: number;
  participants?: number;
}

export interface Item {
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
  weight?: {weight: number; unit: string};
  quantity?: number;
  calories?: number;
  price?: number;
}

export interface ImageAsset {
  _ref: string;
  url?: string;
}

export interface Category {
  _id: string;
  title: string;
  slug: {current: string};
}

export interface User {
  _id: string;
  name: string;
  email: string;
  googleId: string;
  image?: string;
  sharedLists?: SharedListReference[];
}

export interface SharedListReference {
  _key: string;
  list: {
    _id: string;
    name: string;
    slug: {current: string};
    image?: ImageAsset;
    user: {
      _id: string;
      name: string;
      email: string;
    };
  };
  addedAt: string;
}
