# Shared Components Documentation

## Overview

We've created a set of reusable components with SCSS modules to share code between the Gear page, Packing List page, and Shared List pages. This eliminates duplication and ensures consistency.

## 📁 Project Structure

```
src/
├── styles/
│   ├── abstracts/
│   │   ├── _variables.scss    # CSS vars + SCSS vars
│   │   └── _mixins.scss        # Reusable mixins
│   └── globals.scss            # Global styles entry point
│
├── components/
│   ├── ActionBar/
│   │   ├── ActionBar.tsx
│   │   ├── ActionBar.module.scss
│   │   └── index.ts
│   ├── CategoryFilter/
│   │   ├── CategoryFilter.tsx
│   │   ├── CategoryFilter.module.scss
│   │   └── index.ts
│   ├── ItemCard/
│   │   ├── ItemCard.tsx
│   │   ├── ItemCard.module.scss
│   │   └── index.ts
│   └── OverviewStats/
│       ├── OverviewStats.tsx
│       ├── OverviewStats.module.scss
│       └── index.ts
```

---

## 🎨 SCSS Architecture

### Variables (`_variables.scss`)

- **CSS Variables**: Runtime theming (3 themes: green, light-green, yellow)
- **SCSS Variables**: Build-time constants (spacing, typography, transitions)

```scss
// Usage in component SCSS
@import '@/styles/abstracts/variables';

.myComponent {
  padding: $spacing-md;              // SCSS variable
  color: var(--fg-primary);          // CSS variable (themeable)
  transition: $transition-fast;       // SCSS variable
}
```

### Mixins (`_mixins.scss`)

Provides reusable styles:

```scss
@import '@/styles/abstracts/mixins';

.card {
  @include card;                  // Background, border-radius, padding
  @include hover-lift;            // Lift on hover
  @include focus-ring;            // Accessible focus outline
}

.scrollArea {
  @include hide-scrollbar;        // Cross-browser scrollbar hiding
}

@include mobile {                 // Responsive breakpoint
  // Mobile styles
}
```

---

## 🧩 Components

### 1. ActionBar

**Purpose**: Top action buttons (Add, Share, Excel, etc.)

**Usage**:

```tsx
import { ActionBar } from '@/components/ActionBar';

// Gear mode
<ActionBar
  mode="gear"
  onAddGear={() => setShowAddDialog(true)}
  onManageCategories={() => setShowCategoriesDialog(true)}
  onExcel={() => setShowExcelDialog(true)}
  viewMode={viewMode}
  onViewModeChange={setViewMode}
/>

// List mode
<ActionBar
  mode="list"
  onAddToList={() => setShowAddDialog(true)}
  onShare={() => handleShare()}
  onDuplicate={() => handleDuplicate()}
/>

// Shared list mode (read-only)
<ActionBar
  mode="shared-list"
  onSaveToMyLists={handleSave}
  isSaved={isSaved}
  isSaving={isSaving}
/>
```

**Props**:

| Prop | Type | Mode | Description |
|------|------|------|-------------|
| `mode` | `'gear' \| 'list' \| 'shared-list'` | All | Determines which buttons to show |
| `onAddGear` | `() => void` | gear | Open add gear dialog |
| `onManageCategories` | `() => void` | gear | Open categories dialog |
| `onExcel` | `() => void` | gear | Open Excel import/export dialog |
| `viewMode` | `'list' \| 'grid'` | gear | Current view mode |
| `onViewModeChange` | `(mode) => void` | gear | Toggle view mode |
| `onAddToList` | `() => void` | list | Add gear to list |
| `onShare` | `() => void` | list | Share list |
| `onDuplicate` | `() => void` | list | Duplicate list |
| `onSaveToMyLists` | `() => void` | shared-list | Save shared list |
| `isSaved` | `boolean` | shared-list | Is list already saved |
| `isSaving` | `boolean` | shared-list | Is save in progress |

---

### 2. CategoryFilter

**Purpose**: Horizontal scrollable category filter buttons

**Usage**:

```tsx
import { CategoryFilter } from '@/components/CategoryFilter';

// Gear page
<CategoryFilter
  categories={categories}
  selectedCategory={selectedCategory}
  onCategorySelect={setSelectedCategory}
  showAllButton={true}
  allButtonLabel="All"
  showCounts={true}
  getCategoryCount={(id) => items.filter(i => i.category._id === id).length}
/>

// Packing list page
<CategoryFilter
  categories={categories}
  selectedCategory={selectedCategory}
  onCategorySelect={setSelectedCategory}
  showAllButton={true}
  allButtonLabel="Overview"
  showOnBodyFilter={true}
  showOnBodyOnly={showOnBodyOnly}
  onBodyFilterChange={setShowOnBodyOnly}
/>
```

**Props**:

| Prop | Type | Description |
|------|------|-------------|
| `categories` | `Category[]` | Array of categories |
| `selectedCategory` | `string \| null` | Currently selected category ID |
| `onCategorySelect` | `(id: string \| null) => void` | Handle category selection |
| `showAllButton` | `boolean` | Show "All"/"Overview" button |
| `allButtonLabel` | `string` | Label for all button |
| `showOnBodyFilter` | `boolean` | Show "On body" filter (packing lists only) |
| `showOnBodyOnly` | `boolean` | Is "On body" filter active |
| `onBodyFilterChange` | `(show: boolean) => void` | Toggle "On body" filter |
| `showCounts` | `boolean` | Show item counts per category |
| `getCategoryCount` | `(id: string) => number` | Function to get count |

---

### 3. ItemCard

**Purpose**: Display items with different controls based on context

**Usage**:

```tsx
import { ItemCard } from '@/components/ItemCard';
import { urlFor } from '@/sanity/images';

// Gear mode
<ItemCard
  mode="gear"
  item={item}
  onEdit={(item) => setEditingItem(item)}
  onDelete={(id) => handleDelete(id)}
  imageUrlBuilder={(asset) => urlFor(asset)}
/>

// List mode (editable)
<ItemCard
  mode="list"
  item={listItem.item}
  listItem={listItem}
  onQuantityChange={(key, quantity) => handleQuantityChange(key, quantity)}
  onCheckChange={(key, checked) => handleCheck(key, checked)}
  onBodyChange={(key, onBody) => handleOnBodyToggle(key, onBody)}
  onRemoveFromList={(key) => handleRemove(key)}
  imageUrlBuilder={(asset) => urlFor(asset)}
/>

// Shared list mode (read-only)
<ItemCard
  mode="list-readonly"
  item={listItem.item}
  listItem={listItem}
  imageUrlBuilder={(asset) => urlFor(asset)}
/>
```

**Props**:

| Prop | Type | Mode | Description |
|------|------|------|-------------|
| `mode` | `'gear' \| 'list' \| 'list-readonly'` | All | Display mode |
| `item` | `Item` | All | Item data |
| `onEdit` | `(item: Item) => void` | gear | Edit handler |
| `onDelete` | `(id: string) => void` | gear | Delete handler |
| `listItem` | `ListItem` | list, list-readonly | List item with quantity/checked/onBody |
| `onQuantityChange` | `(key, qty) => void` | list | Quantity change handler |
| `onCheckChange` | `(key, checked) => void` | list | Checkbox handler |
| `onBodyChange` | `(key, onBody) => void` | list | On body toggle handler |
| `onRemoveFromList` | `(key) => void` | list | Remove from list handler |
| `imageUrlBuilder` | `(asset) => string` | All | Function to build image URL |

---

### 4. OverviewStats

**Purpose**: Display statistics/totals

**Usage**:

```tsx
import { OverviewStats } from '@/components/OverviewStats';

// Gear page - compact layout
<OverviewStats
  mode="gear"
  layout="compact"
  totalItems={items.length}
  totalWeight={totalWeight}
  totalPrice={totalPrice}
/>

// Packing list - hero layout (overview mode)
<OverviewStats
  mode="list"
  layout="hero"
  backpackWeight={grandTotal.weight}
  onBodyWeight={grandTotal.weightOnBody}
  calories={grandTotal.calories}
  packedCount={grandTotal.checkedCount}
  totalCount={grandTotal.count}
/>

// Packing list - detailed layout (category breakdown)
<OverviewStats
  mode="list"
  layout="detailed"
  showCategoryBreakdown={true}
  categoryTotals={categoryTotals}
/>
```

**Props**:

| Prop | Type | Description |
|------|------|-------------|
| `mode` | `'gear' \| 'list'` | Display mode |
| `layout` | `'compact' \| 'hero' \| 'detailed'` | Layout style |
| `totalItems` | `number` | Total item count (gear mode) |
| `totalWeight` | `number` | Total weight in grams (gear mode) |
| `totalPrice` | `number` | Total price (gear mode) |
| `backpackWeight` | `number` | Backpack weight in grams (list mode) |
| `onBodyWeight` | `number` | On body weight in grams (list mode) |
| `calories` | `number` | Total calories (list mode) |
| `packedCount` | `number` | Number of packed items (list mode) |
| `totalCount` | `number` | Total items in list (list mode) |
| `showCategoryBreakdown` | `boolean` | Show detailed category table |
| `categoryTotals` | `CategoryTotal[]` | Category totals data |

---

## 🚀 Migration Strategy

### Phase 1: Setup ✅ DONE
- [x] Install SCSS
- [x] Create SCSS directory structure
- [x] Extract CSS variables to `_variables.scss`
- [x] Create mixins in `_mixins.scss`
- [x] Create component folders

### Phase 2: Create Components ✅ DONE
- [x] ActionBar component
- [x] CategoryFilter component
- [x] ItemCard component
- [x] OverviewStats component

### Phase 3: Integrate Components (NEXT)
1. Update `app/page.tsx` (Gear page)
2. Update `app/lists/[slug]/page.tsx` (Packing list)
3. Test all modes thoroughly
4. Update `app/layout.tsx` to import `globals.scss` instead of `globals.css`

### Phase 4: Cleanup (LATER)
1. Remove old inline styles from pages
2. Gradually remove Tailwind utility classes
3. Eventually remove Tailwind config

---

## 💡 Best Practices

### Component SCSS

1. **Use SCSS modules** - Scoped, no naming conflicts
2. **Import abstracts at top** - Get access to variables and mixins
3. **Use BEM-inspired naming** - Clear hierarchy
4. **Leverage mixins** - DRY principle

```scss
@import '@/styles/abstracts/variables';
@import '@/styles/abstracts/mixins';

.card {
  @include card;
  
  &__header {
    @include flex-between;
  }
  
  &--active {
    background-color: var(--bg-accent);
  }
}
```

### Component TypeScript

1. **Export from index.ts** - Clean imports
2. **Type all props** - TypeScript safety
3. **Use mode prop** - Single component, multiple behaviors
4. **Optional props** - Use `?` for mode-specific props

---

## 🎯 Benefits

✅ **DRY** - No code duplication  
✅ **Consistent** - Same UI everywhere  
✅ **Maintainable** - Update once, affects all pages  
✅ **Themeable** - CSS variables enable runtime theming  
✅ **Type-safe** - TypeScript + CSS Modules  
✅ **Performant** - Next.js optimizes CSS automatically  
✅ **Accessible** - Focus rings, semantic HTML  

---

## 📝 Next Steps

1. **Update layout.tsx**:
   ```tsx
   import '@/styles/globals.scss'; // Instead of globals.css
   ```

2. **Replace old components** in pages with new shared ones

3. **Test all modes**:
   - Gear page (add, edit, delete, categories)
   - Packing list (add, check, quantity, on body)
   - Shared list (read-only mode)

4. **Remove old CSS** gradually as you migrate

---

## 🐛 Troubleshooting

**Issue**: SCSS not compiling  
**Solution**: Ensure `sass` is installed: `pnpm add sass`

**Issue**: CSS modules not typed  
**Solution**: Check `src/types/css-modules.d.ts` exists

**Issue**: Can't import from `@/styles`  
**Solution**: Check `tsconfig.json` has path alias configured

**Issue**: Styles not applying  
**Solution**: Import `globals.scss` in `app/layout.tsx`

---

Made with ❤️ for Gramjegerne
