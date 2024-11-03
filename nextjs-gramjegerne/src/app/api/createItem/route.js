import { createClient } from '@sanity/client';

// Initialize the Sanity client
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_TOKEN,
  useCdn: false,
  apiVersion: '2023-01-01',
});

// Handle POST request
export async function POST(req) {
  // Get form data from the request
  const formData = await req.formData();
  
  // Construct newItem object from form data
  const newItem = {
    _type: 'item',
    name: formData.get('name'), // Assuming 'name' is one of your form fields
    slug: {
      _type: 'slug',
      current: formData.get('slug') || formData.get('name')?.toLowerCase().replace(/\s+/g, '-').slice(0, 200), // Auto-generate slug if not provided
    },
    image: formData.get('image'), // Handle image if it's part of your form
    categories: formData.getAll('categories'), // Assuming this is an array of category IDs
    size: formData.get('size'), // Get the size from the form
    weight: {
      weight: formData.get('weight')?.weight, // Assuming weight is an object with a weight property
      unit: formData.get('weight')?.unit, // Assuming weight includes a unit
    },
    quantity: Number(formData.get('quantity')), // Convert quantity to a number
    calories: Number(formData.get('calories')), // Convert calories to a number
  };

  try {
    // Create the item in Sanity
    const createdItem = await client.create(newItem);
    return new Response(JSON.stringify(createdItem), { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return new Response(JSON.stringify({ message: 'Failed to create item' }), { status: 500 });
  }
}
