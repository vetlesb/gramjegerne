import sanityClient from '@sanity/client';

const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_TOKEN, // Optional for authenticated requests
  useCdn: false,
  apiVersion: '2023-01-01',
});

export async function POST(req) {
  const formData = await req.formData(); // Use formData for handling file uploads

  // Extract data from formData
  const newItem = {
    _type: 'item',
    name: formData.get('name'),
    slug: JSON.parse(formData.get('slug')),
    size: formData.get('size'),
    weight: JSON.parse(formData.get('weight')),
    quantity: parseInt(formData.get('quantity'), 10),
    calories: parseInt(formData.get('calories'), 10),
    image: formData.get('image'), // This needs to be uploaded separately
  };

  // Handle the image upload separately
  const imageFile = formData.get('image');
  if (imageFile) {
    const uploadResponse = await client.assets.upload('image', imageFile);
    newItem.image = {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: uploadResponse._id,
      },
    };
  }

  try {
    const createdItem = await client.create(newItem);
    return new Response(JSON.stringify(createdItem), { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return new Response(JSON.stringify({ message: 'Failed to create item' }), { status: 500 });
  }
}
