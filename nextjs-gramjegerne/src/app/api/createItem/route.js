import { createClient } from '@sanity/client';

// Initialize the Sanity client
const client = createClient({
  projectId: wlgnd2w5,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_TOKEN,
  useCdn: false,
  apiVersion: '2023-01-01',
});

export async function POST(req) {
  const formData = await req.formData();
  
  // Construct newItem object from form data
  const newItem = {
    _type: 'item',
    name: formData.get('name'),
    slug: {
      _type: 'slug',
      current: formData.get('slug') || formData.get('name')?.toLowerCase().replace(/\s+/g, '-').slice(0, 200),
    },
    image: formData.get('image'),
    categories: formData.getAll('categories'),
    size: formData.get('size'),
    weight: {
      weight: formData.get('weight')?.weight,
      unit: formData.get('weight')?.unit,
    },
    quantity: Number(formData.get('quantity')),
    calories: Number(formData.get('calories')),
  };

  try {
    const createdItem = await client.create(newItem);
    return new Response(JSON.stringify(createdItem), { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return new Response(JSON.stringify({ message: 'Failed to create item' }), { status: 500 });
  }
}
