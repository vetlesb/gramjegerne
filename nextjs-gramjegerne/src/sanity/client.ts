import { createClient } from "next-sanity";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: false, // Fetches fresh data; set to true for cached responses
  apiVersion: "2023-01-01",
  token: process.env.SANITY_API_TOKEN, // Ensure this token has necessary permissions
});
