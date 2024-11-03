import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.NEXT_PUBLIC_SANITY_TOKEN,
  useCdn: true, // or false depending on your needs
  apiVersion: '2023-01-01',
});

export async function GET() {
  try {
    const categories = await client.fetch(`*[_type == "category"]{_id, title}`);
    return new Response(JSON.stringify(categories), { status: 200 });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch categories' }), { status: 500 });
  }
}
