import { createClient } from "next-sanity";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2023-10-15",
  useCdn: process.env.NODE_ENV === "production", // Use CDN for production
  token: process.env.NEXT_PUBLIC_SANITY_TOKEN,
});
