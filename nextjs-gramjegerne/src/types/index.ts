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
  category?: {
    _id: string;
    title: string;
  };
  size?: string;
  weight?: {weight: number; unit: string};
  quantity?: number;
  calories?: number;
  price?: number;
  categories?: Category[]; // Populated categories
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
    image?: {
      asset: ImageAsset;
    };
    user: {
      _id: string;
      name: string;
      email: string;
    };
  };
  addedAt: string;
}

export interface ListDocument {
  _id: string;
  slug: {current: string};
  name: string;
  image?: {
    asset: ImageAsset;
  };
  days: number;
  weight: number;
  participants: number;
  completed: boolean;
  user: {
    _ref: string;
  };
  _createdAt: string;
  _updatedAt: string;
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

// New trip-related types following your existing pattern
export type SpotCategory = 'camp' | 'fishing' | 'viewpoint';

export interface CampingSpot {
  _key: string;
  name: string;
  description?: string;
  category: SpotCategory;
  coordinates: {
    lat: number;
    lng: number;
  };
  image?: {
    asset: ImageAsset;
  };
}

export interface Route {
  _key: string;
  name: string;
  description?: string;
  waypoints: Array<{
    lat: number;
    lng: number;
  }>;
  color: string;
}

export interface TripDocument {
  _id: string;
  slug: {current: string};
  name: string;
  description?: string;
  image?: {
    asset: ImageAsset;
  };
  startDate?: string;
  endDate?: string;
  campingSpots: CampingSpot[];
  routes: Route[];
  user: {
    _ref: string;
  };
  _createdAt: string;
  _updatedAt: string;
}

// Simplified trip interface for listing page (with counts instead of full arrays)
export interface TripListItem {
  _id: string;
  name: string;
  description?: string;
  image?: {
    asset: ImageAsset;
  };
  startDate?: string;
  endDate?: string;
  campingSpotsCount: number;
  routesCount: number;
  routes: Array<{
    waypoints: Array<{lat: number; lng: number}>;
  }>;
  campingSpots: Array<{
    category: SpotCategory;
  }>;
  _createdAt: string;
  _updatedAt: string;
}
