// app/api/deleteCategory/route.ts
import {NextResponse} from 'next/server';
import {client} from '@/lib/sanity';
import {getUserSession} from '@/lib/auth-helpers';

export async function DELETE(request: Request) {
  try {
    // Categories are shared, but we still verify authentication
    await getUserSession();
    const {categoryId} = await request.json();

    if (!categoryId) {
      return NextResponse.json({error: 'Category ID is required'}, {status: 400});
    }

    // Check if category is in use
    const itemsUsingCategory = await client.fetch(
      `*[_type == "item" && references($categoryId)][0...1]`,
      {categoryId},
    );

    if (itemsUsingCategory.length > 0) {
      return NextResponse.json({error: 'Category is in use and cannot be deleted'}, {status: 409});
    }

    await client.delete(categoryId);
    return NextResponse.json({
      message: 'Category deleted successfully',
      categoryId,
    });
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }
    console.error('Error deleting category:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete category',
      },
      {status: 500},
    );
  }
}
