import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID, // Your Sanity project ID
  dataset: process.env.SANITY_DATASET, // Your Sanity dataset
  useCdn: true, // Set to true for faster responses
  apiVersion: '2024-11-03', // Use the latest version
});

export async function GET() {
  try {
    const query = '*[_type == "category"]{_id, title}'; // Fetch categories
    const categories = await sanityClient.fetch(query); // Execute query
    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }); // Return categories
  } catch (error) {
    console.error('Error fetching categories:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch categories' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
