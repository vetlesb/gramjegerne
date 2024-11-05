import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "wlgnd2w5",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.NEXT_PUBLIC_SANITY_TOKEN,
});
