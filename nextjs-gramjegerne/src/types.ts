// src/types.ts

import { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { SanityDocument } from "next-sanity";

export interface ListDocument extends SanityDocument {
  slug: { current: string };
  name: string;
  image?: SanityImageSource;
  days?: number;
  weight?: number;
  participants?: number;
}
