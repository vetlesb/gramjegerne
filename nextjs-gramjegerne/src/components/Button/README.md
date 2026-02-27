# Button Components

A comprehensive button system for the Gramjegerne app with three component types: `Button`, `FilterButton`, and `IconButton`.

## 🎯 Components Overview

### 1. Button (General Purpose)
The main button component for actions throughout the app.

```tsx
import { Button } from '@/components/Button';

// Basic usage
<Button>Click me</Button>

// With icon (left)
<Button iconName="add">Add gear</Button>

// With icon (right)
<Button iconName="chevrondown" iconPosition="right">
  Options
</Button>

// Icon only
<Button iconName="edit" iconOnly aria-label="Edit item" />

// Variants
<Button variant="primary">Primary (Accent)</Button>
<Button variant="secondary">Secondary (Default)</Button>
<Button variant="ghost">Ghost (Transparent)</Button>
<Button variant="trans">Trans (Blurred)</Button>

// Sizes
<Button size="md">Medium (0.5rem padding)</Button>
<Button size="lg">Large (1rem padding - default)</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'ghost' | 'trans'` (default: `'secondary'`)
- `size`: `'md' | 'lg'` (default: `'lg'`)
- `iconName`: Optional icon from Icon component
- `iconPosition`: `'left' | 'right'` (default: `'left'`)
- `iconOnly`: Boolean to show only the icon
- All standard button HTML attributes

---

### 2. FilterButton (Category/Filter Pills)
Specialized button for category filters and pill-shaped selections.

```tsx
import { FilterButton } from '@/components/Button';

// Basic filter
<FilterButton>All</FilterButton>

// Active state
<FilterButton active>Electronics</FilterButton>

// With count
<FilterButton count={12}>Clothing</FilterButton>

// With icon and count
<FilterButton iconName="backpack" count={8} active>
  Gear
</FilterButton>
```

**Props:**
- `active`: Boolean for active/selected state
- `count`: Optional number to display
- `iconName`: Optional icon from Icon component
- All standard button HTML attributes

**Usage in CategoryFilter:**
```tsx
<FilterButton 
  active={selectedCategory === 'electronics'}
  count={itemCount}
  onClick={() => handleSelect('electronics')}
>
  Electronics
</FilterButton>
```

---

### 3. IconButton (Icon-Only Actions)
Compact icon-only buttons for inline actions.

```tsx
import { IconButton } from '@/components/Button';

// Basic usage (requires aria-label for accessibility)
<IconButton 
  iconName="edit" 
  aria-label="Edit item"
  onClick={handleEdit}
/>

// Variants
<IconButton iconName="delete" variant="ghost" aria-label="Delete" />
<IconButton iconName="add" variant="primary" aria-label="Add" />

// Sizes
<IconButton iconName="close" size="md" aria-label="Close" />
<IconButton iconName="menu" size="lg" aria-label="Menu" />
```

**Props:**
- `iconName`: Required icon name
- `variant`: `'primary' | 'secondary' | 'ghost' | 'trans'` (default: `'ghost'`)
- `size`: `'md' | 'lg'` (default: `'md'`)
- `aria-label`: **Required** for accessibility
- All standard button HTML attributes

---

## 🎨 Styling

All buttons use:
- SCSS Modules for scoped styling
- CSS custom properties for theming
- SCSS tokens from `_tokens.scss`
- Focus ring from `_mixins.scss`
- Automatic disabled state styling

### Variants Explained

| Variant | Background | Use Case |
|---------|-----------|----------|
| `primary` | Accent color (green/yellow) | Primary actions, CTAs |
| `secondary` | Dimmed background | Default actions, ActionBar |
| `ghost` | Transparent | Inline actions, icon buttons |
| `trans` | Semi-transparent + blur | Overlay buttons, floating actions |

---

## 📝 Examples from Codebase

### ActionBar Buttons
```tsx
// Before
<button className={styles.button} onClick={onAddGear}>
  Add
</button>

// After
<Button onClick={onAddGear}>Add</Button>
```

### ItemCard Actions
```tsx
// Before (ghost button)
<button className="button-ghost" onClick={handleEdit}>
  <Icon name="edit" />
</button>

// After
<IconButton 
  iconName="edit" 
  variant="ghost"
  aria-label="Edit item"
  onClick={handleEdit}
/>
```

### Category Filters
```tsx
// Before
<button 
  className={`menu-category ${active ? 'menu-active' : ''}`}
  onClick={handleSelect}
>
  Electronics {count && <span>({count})</span>}
</button>

// After
<FilterButton 
  active={active}
  count={count}
  onClick={handleSelect}
>
  Electronics
</FilterButton>
```

### Modal Actions
```tsx
// Before
<button className="button-primary-accent" onClick={handleConfirm}>
  Confirm
</button>
<button className="button-secondary" onClick={handleCancel}>
  Cancel
</button>

// After
<Button variant="primary" onClick={handleConfirm}>
  Confirm
</Button>
<Button onClick={handleCancel}>
  Cancel
</Button>
```

---

## ♿ Accessibility

- All buttons have proper focus states (focus ring)
- `IconButton` requires `aria-label` prop
- Disabled buttons automatically get `opacity: 0.5` and `cursor: not-allowed`
- Keyboard navigation fully supported

---

## 🚀 Migration Strategy

1. **Start with new features** - Use button components in new code
2. **ActionBar** - Already uses custom styles, good candidate
3. **ItemCard** - Replace ghost buttons with IconButton
4. **CategoryFilter** - Replace menu-category buttons with FilterButton
5. **Modals/Dialogs** - Replace button utility classes
6. **Gradual replacement** - No need to update everything at once
