import * as dotenv from "dotenv";
import { resolve } from "path";
import { createClient } from "@sanity/client";

// Load environment variables from scripts/.env
dotenv.config({ path: resolve(__dirname, ".env") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2024-01-01",
});

interface SanityUser {
  _id: string;
  _type: string;
  name?: string;
  email: string;
}

async function cleanupDuplicateUsers() {
  try {
    const users = await client.fetch<SanityUser[]>(
      `*[_type == "user" && email == $email]`,
      {
        email: "your.email@example.com", // Replace with your email
      },
    );

    console.log("Found users:", users);

    const googleUser = users.find(
      (user: SanityUser) =>
        user._id.includes("google") || user._id.includes("oauth"),
    );

    if (!googleUser) {
      console.log("No Google user found!");
      return;
    }

    console.log("Keeping user:", googleUser);

    for (const user of users) {
      if (user._id !== googleUser._id) {
        console.log(`Deleting user with ID: ${user._id}`);
        await client.delete(user._id);
      }
    }

    console.log("Cleanup completed successfully!");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

cleanupDuplicateUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
