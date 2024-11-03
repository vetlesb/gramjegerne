import { createClient } from '@sanity/client';

// Initialize the Sanity client
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_TOKEN,
  useCdn: false,
  apiVersion: '2023-01-01',
});

export async function POST(req) {
  const formData = await req.formData();

  // Handle image upload separately
  let imageAsset;
  const imageFile = formData.get('image');
  if (imageFile) {
    const imageResponse = await client.assets.upload('image', imageFile, {
      filename: imageFile.name,
    });
    imageAsset = imageResponse._id; // Use the uploaded image ID
  }

  // Construct newItem object from form data
  const newItem = {
    _type: 'item',
    name: formData.get('name'),
    slug: {
      _type: 'slug',
      current: formData.get('slug') || formData.get('name').toLowerCase().replace(/\s+/g, '-').slice(0, 200),
    },
    image: imageAsset ? { _type: 'image', asset: { _ref: imageAsset } } : null,
    categories: formData.getAll('categories').map(categoryId => ({
      _type: 'reference',
      _ref: categoryId,
    })),
    size: formData.get('size'),
    weight: {
      weight: Number(formData.get('weight.weight')),
      unit: formData.get('weight.unit'),
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
