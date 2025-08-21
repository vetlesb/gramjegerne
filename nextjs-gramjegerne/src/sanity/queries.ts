export const Query = {
  /** Here be the query for categories. */
  CATEGORIES: /* groq */ `*[_type == "category" && user._ref == $userId]{
	  _id, 
	  title, 
	  slug {
		current
	  }
	}`,
  /** Here be the query for items. */
  ITEMS: /* groq */ `*[_type == "item" && user._ref == $userId]{
	  _id,
	  name,
	  slug,
	  image{
		asset->{
		  _ref,
		  url
		}
	  },
	  "category": category->{_id, title},
	  size,
	  weight,
	  quantity,
	  calories,
	  price
	}`,
} as const;
