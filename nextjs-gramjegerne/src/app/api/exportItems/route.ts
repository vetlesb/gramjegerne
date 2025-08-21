import {NextResponse} from 'next/server';
import {client} from '@/lib/sanity';
import {getUserSession} from '@/lib/auth-helpers';
import * as XLSX from 'xlsx'; // Import the XLSX library

interface ImportItem {
  name: string;
  size?: string;
  weight?: {
    weight: number;
    unit: string;
  };
  calories?: string | number;
  price?: string | number;
  category?: {
    _ref: string;
    title: string; // Assuming you have a title field for the category
  };
  image?: {
    asset: {
      _ref: string; // Reference to the image asset
      url?: string; // URL should be optional here
    };
  };
}

export async function GET() {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({message: 'Unauthorized'}), {
        status: 401,
      });
    }

    // Fetch items for the user, including category titles and image assets
    const items = await client.fetch(
      `*[_type == "item" && user._ref == $userId]{
        name,
        size,
        weight,
        calories,
        price,
        category-> { _id, title }, // Fetch category title
        image { asset->{ _id, url } } // Fetch image asset URL
      }`,
      {userId: session.user.id},
    );

    // Prepare data for XLSX export
    const exportData = items.map((item: ImportItem) => ({
      name: item.name,
      size: item.size || '',
      weight: item.weight?.weight || '',
      unit: item.weight?.unit || 'g',
      calories: item.calories || '',
      price: item.price || '',
      category: item.category?.title || '', // Use category title instead of ID
      image_url: item.image?.asset?.url || '', // Get the image URL from the asset reference
    }));

    // Create a new workbook and add the data
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');

    // Generate buffer and create response
    const buffer = XLSX.write(workbook, {bookType: 'xlsx', type: 'buffer'});
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    return new Response(blob, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=exported_items.xlsx', // Ensure the filename ends with .xlsx
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({error: 'Failed to export items'}, {status: 500});
  }
}
