import {NextResponse} from 'next/server';
import {client} from '@/sanity/client';
import {getUserSession} from '@/lib/auth-helpers';

// Helper function for slugify
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[æå]/g, 'a')
    .replace(/[ø]/g, 'o')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

interface SanityCategory {
  _id: string;
  title: string;
  slug?: {
    current: string;
  };
}

// Define the document structure without the Sanity metadata
interface CategoryInput {
  _type: 'category';
  title: string;
  slug: {
    _type: 'slug';
    current: string;
  };
  user: {
    _type: 'reference';
    _ref: string;
  };
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession();
    if (!session?.user?.id) {
      return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }

    const {categories} = await request.json();
    const userId = session.user.id.startsWith('google_')
      ? session.user.id
      : `google_${session.user.id}`;

    console.log('Processing categories for user:', userId);
    console.log('Categories to process:', categories);

    const existingCategories = await client.fetch<SanityCategory[]>(
      `*[_type == "category" && user._ref == $userId]{
        _id,
        title
      }`,
      {userId},
    );

    console.log('Existing categories:', existingCategories);

    const categoryMap: Record<string, string> = {};

    for (const categoryTitle of categories) {
      if (!categoryTitle?.trim()) continue;

      const category = existingCategories.find(
        (c) => c.title.toLowerCase() === categoryTitle.toLowerCase(),
      );

      if (!category) {
        console.log('Creating new category:', categoryTitle);
        const newCategoryData: CategoryInput = {
          _type: 'category',
          title: categoryTitle,
          slug: {
            _type: 'slug',
            current: slugify(categoryTitle),
          },
          user: {
            _type: 'reference',
            _ref: userId,
          },
        };

        try {
          const newCategory = await client.create(newCategoryData);
          categoryMap[categoryTitle] = newCategory._id;
          console.log('Created category:', newCategory);
        } catch (createError) {
          console.error('Error creating category:', createError);
          throw createError;
        }
      } else {
        categoryMap[categoryTitle] = category._id;
      }
    }

    return NextResponse.json({categoryMap});
  } catch (error) {
    console.error('Category validation error:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to process categories',
        error: error,
      },
      {status: 500},
    );
  }
}
