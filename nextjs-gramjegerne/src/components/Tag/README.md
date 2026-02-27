# Tag Component

A component for displaying metadata badges/tags with optional icons.

## 📋 Usage

```tsx
import { Tag } from '@/components/Tag';

// Basic tag
<Tag>Small</Tag>

// With icon
<Tag iconName="size">Medium</Tag>

// Metadata tags (from ItemCard)
<Tag iconName="weight">{item.weight.weight} {item.weight.unit}</Tag>
<Tag iconName="calories">{item.calories} kcal</Tag>
<Tag iconName="size">{item.size}</Tag>

// Price (no icon)
<Tag>{formatCurrency(item.price)}</Tag>

// Quantity
<Tag>{quantity}x</Tag>

// On body status
<Tag>On body</Tag>
```

## 🎨 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary'` | `'primary'` | Visual style (more variants can be added) |
| `size` | `'md'` | `'md'` | Size variant |
| `iconName` | `IconName` | `undefined` | Optional icon from Icon component |
| `children` | `ReactNode` | required | Tag content/label |

Plus all standard HTML span attributes (`className`, `onClick`, etc.)

## 📝 Examples from Codebase

### ItemCard Metadata
```tsx
// Before
<span className={styles.tag}>
  <Icon name="size" width={16} height={16} className={styles.icon} />
  {item.size}
</span>

// After
<Tag iconName="size">{item.size}</Tag>
```

### Weight Display
```tsx
// Before
<span className={styles.tag}>
  <Icon name="weight" width={16} height={16} className={styles.icon} />
  {item.weight.weight} {item.weight.unit}
</span>

// After
<Tag iconName="weight">
  {item.weight.weight} {item.weight.unit}
</Tag>
```

### Price (No Icon)
```tsx
// Before
<span className={styles.tag}>
  {formatCurrency(item.price)}
</span>

// After
<Tag>{formatCurrency(item.price)}</Tag>
```

## 🎨 Styling

- Uses SCSS Modules for scoped styling
- Background: `var(--bg-primary)`
- Padding: `4px 8px` (0.25rem 0.5rem)
- Border radius: `4px`
- Font size: `16px` (1rem)
- Icon size: `16x16px`
- Flexbox for icon + text alignment

## 🔮 Future Variants

Potential variants to add later:
- `secondary` - Dimmed background
- `accent` - Accent color background
- `packed` - For packed items with pill shape
- `status` - Semi-transparent with blur

## 📦 Current Use Cases

- Item metadata (size, weight, calories, price)
- Quantity display
- Status indicators (on body, packed)
- Category labels
