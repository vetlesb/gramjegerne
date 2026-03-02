# Component Migration & Creation Plan

A comprehensive checklist for building a component-based architecture with SCSS modules.

**Last Updated:** 2026-02-06  
**Status:** 🚧 In Progress

---

## 📊 Progress Overview

- **Completed:** 10/44 components
- **In Progress:** 0/44 components
- **Not Started:** 34/44 components

### 🎯 External Dependencies Status
- **To Remove:** 5 packages (@radix-ui x3, cmdk, sonner)
- **Removed:** 0 packages
- **Replacement Components Needed:** 7-8

---

## ✅ Phase 1: Core Layout & Navigation Components (Completed: 4/4)

### Navigation & Layout
- [x] **ActionBar** - Action buttons row with view mode toggle
  - ✅ Created with SCSS module
  - ✅ Enhanced with Map button support for connected trips
  - 📍 Used in: Gear page, Lists page, Packing list page
  
- [x] **CategoryFilter** - Category filter pills
  - ✅ Created with SCSS module
  - 📍 Used in: Gear page, Lists page, Packing list page
  
- [x] **OverviewStats** - Statistics display cards
  - ✅ Created with SCSS module (compact, hero, detailed layouts)
  - ✅ Enhanced detailed layout with packed count badges using Tag component
  - 📍 Used in: Gear page, Packing list page
  
- [x] **ItemCard** - Item display cards
  - ✅ Created with SCSS module (gear, list, list-readonly, grid modes)
  - ✅ Image click functionality added
  - ✅ Integrated Tag and IconButton components
  - 📍 Used in: Gear page (list and grid views)

---

## ✅ Phase 2: Button System (Completed: 4/4)

- [x] **Button** - General purpose button
  - ✅ Variants: primary, secondary, ghost, trans
  - ✅ Sizes: md, lg
  - ✅ Icon support with positioning
  - 📍 Used in: Forms, dialogs, action bars

- [x] **FilterButton** - Pill-shaped filter buttons
  - ✅ Active state, count display, icon support
  - 📍 Will replace: menu-category, menu-active classes
  - 🔄 Next: Integrate into CategoryFilter

- [x] **IconButton** - Icon-only action buttons
  - ✅ Variants: primary, secondary, ghost, trans
  - ✅ Sizes: md, lg
  - ✅ Required aria-label for accessibility
  - 📍 Will replace: Edit/delete buttons in ItemCard

- [x] **Tag** - Metadata tags/badges
  - ✅ Icon support
  - ✅ Size: md
  - ✅ Variant: primary
  - 📍 Will replace: .tag class in ItemCard, grid view
  - 🔄 Next: Integrate into ItemCard

---

## 🔨 Phase 3: Form Components (Not Started: 0/6)

### Input Components
- [ ] **Input** - Text input with variants
  - Variants: text, number, search, file
  - States: default, error, disabled
  - Optional: label, helper text, error message
  - 📍 Used in: NewItemForm, EditItemForm, AddCategoryForm, dialogs
  - 🎯 Priority: 🔴 High

- [ ] **Select** - Dropdown select
  - Custom styling to replace default select
  - Optional: label, helper text
  - 📍 Used in: NewItemForm (weight unit), EditItemForm
  - 🎯 Priority: 🔴 High

- [ ] **Combobox** - Searchable select/autocomplete
  - **REPLACE:** cmdk usage in NewItemForm
  - Search/filter items, keyboard navigation
  - Create new option on the fly
  - Single/multi-select variants
  - 📍 Used in: NewItemForm (category selection), EditItemForm
  - 🎯 Priority: 🔴 High (blocks form migration)

- [ ] **Checkbox** - Custom checkbox
  - Replace default checkbox styling
  - States: checked, unchecked, disabled, indeterminate
  - 📍 Used in: Packing list (item checked state)
  - 🎯 Priority: Medium

- [ ] **Label** - Form label component
  - Optional: required indicator
  - Associated with inputs
  - 📍 Used in: All forms
  - 🎯 Priority: Medium

- [ ] **FormField** - Wrapper for input + label + error
  - Combines Input, Label, and error message
  - Consistent spacing and layout
  - 📍 Used in: All forms
  - 🎯 Priority: Medium

---

## 🎨 Phase 4: Display Components (Completed: 2/7)

### Content Display
- [ ] **Card** - Generic card container
  - Replace: .product, .product-map, .map-card classes
  - Variants: default, interactive (hover effects)
  - 📍 Used in: List items, gear items (grid view), map spots
  - 🎯 Priority: Medium

- [x] **ListCard** - Packing list card component
  - ✅ Created with SCSS module
  - ✅ Modes: owned, shared
  - ✅ View modes: list, grid
  - ✅ Features: responsive dropdown for actions on narrow screens
  - ✅ Shows: name, image, days, status, weight, calories, participants
  - 📍 Used in: /lists page
  - 🎯 Priority: High

- [x] **PackingListItem** - Packing list item component
  - ✅ Created with SCSS module
  - ✅ Modes: editable, readonly
  - ✅ Features: checkbox, quantity input, onBody toggle, delete button
  - ✅ Responsive dropdown for actions on mobile
  - ✅ Reuses styles and patterns from ItemCard
  - 📍 Used in: /lists/[slug] page (packing list detail)
  - 🎯 Priority: High

- [ ] **Badge** - Small notification/count badge
  - Different from Tag (smaller, positioned)
  - Shows counts on icons/buttons
  - 📍 Used in: Notifications, counts
  - 🎯 Priority: Low

- [ ] **EmptyState** - No data placeholder
  - Illustrations/icons + message
  - Optional action button
  - 📍 Used in: Empty lists, no gear, no search results
  - 🎯 Priority: Low

- [ ] **Spinner** - Loading indicator
  - Replace: LoadingSpinner component with SCSS module
  - Sizes: sm, md, lg
  - 📍 Used in: Loading states throughout app
  - 🎯 Priority: Medium

- [ ] **Avatar** - User/image circle
  - For user profiles, item thumbnails
  - Fallback to initials or icon
  - 📍 Used in: Navbar (future), shared lists
  - 🎯 Priority: Low

- [ ] **Divider** - Visual separator
  - Horizontal/vertical lines
  - With optional text
  - 📍 Used in: Section separators
  - 🎯 Priority: Low

---

## 🧭 Phase 5: Navigation Components (Not Started: 0/3)

- [ ] **Navbar** - Main navigation bar
  - Add SCSS module to existing Navbar.tsx
  - Replace: .nav, .nav-logo, .menu-item classes
  - Responsive mobile menu
  - 📍 Used in: layout.tsx
  - 🎯 Priority: High

- [ ] **Tabs** - Tab navigation
  - Replace: .tab, .tab-active, .tab-disabled classes
  - Variants: underline, pills
  - 📍 Used in: Settings pages (future)
  - 🎯 Priority: Low

- [ ] **Breadcrumbs** - Navigation breadcrumbs
  - Show current page hierarchy
  - 📍 Used in: List detail pages (future)
  - 🎯 Priority: Low

---

## 💬 Phase 6: Replace Radix UI Components (Not Started: 0/8)

**Goal:** Remove all external UI dependencies (@radix-ui, cmdk)

### Core Modal/Dialog System
- [ ] **Modal** - Full custom modal component
  - **REPLACE:** @radix-ui/react-dialog (ui/dialog.tsx)
  - Features: backdrop, close button, sizes (sm, md, lg, xl, full)
  - Animations: fade in/out, scale
  - Focus trap, ESC to close, click outside to close
  - Portal rendering
  - 📍 Used in: All dialogs - NewItemForm, EditItemForm, CategoryList, etc.
  - 🎯 Priority: 🔴 **CRITICAL** (blocking other work)

- [ ] **ModalHeader** - Modal header component
  - Title, optional close button
  - Part of Modal system

- [ ] **ModalFooter** - Modal footer component
  - Action buttons area
  - Part of Modal system

### Dropdown & Menu System
- [ ] **Dropdown** - Dropdown menu component
  - **REPLACE:** @radix-ui/react-dropdown-menu (ui/dropdown-menu.tsx)
  - Position: auto (flip), top, bottom, left, right
  - Trigger: button, icon, custom
  - Items: regular, with icon, divider, header
  - Keyboard navigation (arrow keys, enter, ESC)
  - 📍 Used in: ItemCard mobile menu, navigation menus
  - 🎯 Priority: 🔴 High

- [ ] **Menu** - Context menu variant
  - Right-click menus
  - Similar API to Dropdown

### Command Palette / Search / Combobox
- [ ] **Combobox** - Searchable dropdown/autocomplete
  - **REPLACE:** cmdk package (used in NewItemForm.tsx for category selection)
  - Features: search/filter, keyboard navigation, create new option
  - States: open/closed, loading, empty
  - Variants: single select, multi-select
  - 📍 Used in: NewItemForm (category selection), EditItemForm
  - 🎯 Priority: 🔴 High (needed for forms)

- [ ] **CommandPalette** - Global command/search interface
  - **ALSO USES:** cmdk package (if used elsewhere)
  - Keyboard shortcut to open (Cmd+K / Ctrl+K)
  - Fuzzy search
  - Keyboard navigation
  - Groups/sections
  - 📍 Used in: Global search (if implemented)
  - 🎯 Priority: 🟡 Medium (or Low if not used)

### Dock Component
- [ ] **Dock** - Floating action dock
  - MacOS-style dock OR mobile bottom nav
  - Floating action buttons
  - Expand/collapse animations
  - Configurable position
  - 📍 Used in: Mobile navigation (future), quick actions
  - 🎯 Priority: 🟡 Medium

### Supporting Components
- [ ] **Toast** - Toast notification system
  - **CONSIDER REPLACING:** sonner package (currently working well)
  - Success, error, info, warning variants
  - Position: top-right, bottom-center, etc.
  - Auto-dismiss, actions, icons
  - 📍 Used in: Success/error feedback throughout app
  - 🎯 Priority: 🟢 Low (Sonner works well, maybe keep it)

- [ ] **Tooltip** - Hover tooltips
  - For icon buttons, help text
  - Position: auto (flip), top, bottom, left, right
  - Delay, arrow
  - Accessible (aria-describedby)
  - 📍 Used in: Icon buttons, truncated text
  - 🎯 Priority: 🟡 Medium

---

## 🏗️ Phase 7: Layout Utilities (Not Started: 0/3)

- [ ] **Container** - Max-width wrapper
  - Replace: .container class
  - Responsive padding
  - 📍 Used in: All pages
  - 🎯 Priority: Medium

- [ ] **Stack** - Vertical layout with spacing
  - Replace: Tailwind flex flex-col gap patterns
  - Props: spacing, align
  - 📍 Used in: Forms, content layouts
  - 🎯 Priority: Low

- [ ] **Flex** - Horizontal layout with spacing
  - Replace: Tailwind flex flex-row gap patterns
  - Props: spacing, align, justify, wrap
  - 📍 Used in: Button groups, inline elements
  - 🎯 Priority: Low

---

## 📝 Phase 8: Form Dialog Components (Not Started: 0/6)

These are existing dialog components that need SCSS modules:

- [ ] **AddCategoryDialog** - dialogs/AddCategoryDialog.tsx
  - Already exists, add SCSS module
  - Replace inline className utilities
  - 🎯 Priority: Medium

- [ ] **AddListDialog** - addListDialog.tsx
  - Already exists, add SCSS module
  - Integrate Input, Select, Button components
  - 🎯 Priority: High

- [ ] **NewItemForm** - NewItemForm.tsx
  - Refactor to use new form components
  - Add SCSS module
  - 🎯 Priority: High

- [ ] **EditItemForm** - EditItemForm.tsx
  - Refactor to use new form components
  - Add SCSS module
  - 🎯 Priority: High

- [ ] **ImportForm** - ImportForm.tsx
  - Refactor to use new components
  - Add SCSS module
  - 🎯 Priority: Medium

- [ ] **CategoryList** - CategoryList.tsx
  - Refactor to use Button components
  - Add SCSS module
  - 🎯 Priority: Medium

---

## 🎯 Phase 9: Page-Specific Components (Not Started: 0/3)

- [ ] **ThemeSelector** - ThemeSelector.tsx
  - Add SCSS module
  - Use FilterButton for theme options
  - **IMPORTANT:** Ensure theme colors use SCSS variables, not hardcoded
  - Review theme color system in `_variables.scss`
  - Ensure preview colors match actual theme
  - 📍 Used in: Settings menu (layout.tsx)
  - 🎯 Priority: Medium
  - ⚠️ **Note:** This component is tied to the theming system

- [ ] **ShareButton** - ShareButton.tsx
  - Add SCSS module
  - Use Button component
  - 📍 Used in: List pages
  - 🎯 Priority: Low

- [ ] **DeleteButton** - deleteListButton.tsx, deleteTripButton.tsx
  - Consolidate into one component
  - Add SCSS module, use IconButton
  - 📍 Used in: List/trip cards
  - 🎯 Priority: Low

---

## 🔄 Phase 10: Integration & Migration (Not Started)

### Page Migrations

#### Gear Page (`/app/page.tsx`)
- [x] ✅ ActionBar integrated
- [x] ✅ CategoryFilter integrated
- [x] ✅ OverviewStats integrated
- [x] ✅ ItemCard integrated (list view)
- [x] ✅ **Button component integrated in ActionBar**
- [x] ✅ **FilterButton component integrated in CategoryFilter**
- [x] ✅ **Tag component integrated in ItemCard**
- [x] ✅ **IconButton component integrated in ItemCard**
- [x] ✅ **ItemCard integrated for grid view**
- [ ] 🔄 Refactor dialogs (NewItemForm, EditItemForm)
- [ ] 🔄 Migrate button utility classes to Button components

#### Lists Page (`/app/lists/page.tsx`)
- [x] ✅ ActionBar integrated (lists-overview mode)
- [x] ✅ CategoryFilter integrated
- [x] ✅ ListCard component created and integrated
- [x] ✅ View mode toggle (list/grid) with localStorage persistence
- [x] ✅ Client-side sorting (planned lists always first)
- [x] ✅ Responsive dropdown for list card actions on narrow screens
- [ ] 🔄 Migrate AddListDialog
- [ ] 🔄 Replace remaining utility classes

#### Packing List Page (`/app/lists/[slug]/page.tsx`)
- [x] ✅ Created PackingListItem component (replaces custom item rendering)
- [x] ✅ Integrated ActionBar (list mode with Map button for connected trips)
- [x] ✅ Integrated CategoryFilter + OnBody FilterButton
- [x] ✅ Integrated OverviewStats (hero layout for grand totals)
- [x] ✅ Integrated OverviewStats (detailed layout with category breakdown + packed count badges)
- [x] ✅ Integrated PackingListItem for editable and readonly modes
- [x] ✅ Integrated Tag components in items
- [x] ✅ Integrated FilterButton for OnBody toggle
- [x] ✅ Integrated IconButton components in PackingListItem
- [x] ✅ Created page.module.scss for layout styles
- [x] ✅ Replaced utility classes with SCSS modules
- [x] ✅ Maintained all functionality (checkbox, quantity input, onBody toggle, delete)
- [x] ✅ Maintained temporary state management for quantity input
- [x] ✅ Maintained shared mode (readonly) support

#### Shared List Page (`/app/share/[slug]/SharePageClient.tsx`)
- [ ] 🔄 Integrate ItemCard (readonly mode)
- [ ] 🔄 Integrate OverviewStats
- [ ] 🔄 Integrate Button for "Save to my lists"
- [ ] 🔄 Replace utility classes

#### Layout (`/app/layout.tsx`)
- [ ] 🔄 Migrate Navbar to SCSS module
- [ ] 🔄 Integrate ThemeSelector
- [ ] 🔄 Replace menu-item classes with Button

#### Sign In Page (`/app/auth/signin/page.tsx`)
- [ ] 🔄 Migrate Button for sign-in
- [ ] 🔄 Replace utility classes

---

## 📋 Utility Class Deprecation Checklist

Track removal of global utility classes as we migrate:

### Button Classes (Replace with Button components)
- [ ] `.button-primary` → `<Button variant="primary">`
- [ ] `.button-primary-accent` → `<Button variant="primary">`
- [ ] `.button-secondary` → `<Button>`
- [ ] `.button-ghost` → `<Button variant="ghost">` or `<IconButton variant="ghost">`
- [ ] `.button-trans` → `<Button variant="trans">`
- [ ] `.button-create` → `<Button>`
- [ ] `.button-back` → `<Button>`
- [ ] `.button-toggle` → `<IconButton>`

### Menu/Filter Classes (Replace with FilterButton)
- [ ] `.menu-category` → `<FilterButton>`
- [ ] `.menu-active` → `<FilterButton active>`
- [ ] `.menu-item` → `<FilterButton>` or `<Button>`
- [ ] `.menu-theme` → `<FilterButton>`

### Tag Classes (Replace with Tag component)
- [ ] `.tag` → `<Tag>`
- [ ] `.tag-icon` → Icon within Tag
- [ ] `.tag-list` → `<Tag variant="list">` (future)
- [ ] `.tag-packed` → `<Tag variant="packed">` (future)
- [ ] `.tag-total` → `<Tag variant="accent">` (future)

### Card Classes (Replace with Card component - future)
- [ ] `.product` → `<Card>`
- [ ] `.product-map` → `<Card variant="interactive">`
- [ ] `.map-card` → `<Card>`
- [ ] `.product-category` → `<Card>`
- [ ] `.cnt` → `<Card>`

### Form Classes (Replace with Input/Select components - future)
- [ ] `input` global styles → `<Input>`
- [ ] `select` global styles → `<Select>`
- [ ] `.form` → `<FormField>`

### Dialog Classes (Replace with Dialog SCSS module)
- [ ] `.dialog` → Dialog SCSS module
- [ ] `.bg-black/80` → Dialog overlay SCSS

---

## 🎯 Priority Guide

**🔴 CRITICAL Priority (Do IMMEDIATELY)**
- **Modal component** - BLOCKS all dialog work, must replace Radix UI first
- **Dropdown component** - Replace Radix UI dropdown

**🔴 High Priority (Do First)**
- Form components (Input, Select, **Combobox**) - needed for all forms
- Combobox to replace cmdk in NewItemForm
- Button migration in existing components
- ListCard for /lists page
- Navbar SCSS module

**🟡 Medium Priority (Do Second)**
- Card component for grid views
- FormField wrapper
- Checkbox component
- Container component
- Theme selector migration

**🟢 Low Priority (Do Later)**
- Badge, Avatar, Tooltip, Popover
- Tabs, Breadcrumbs
- Layout utilities (Stack, Flex, Divider)
- Empty state component

---

## 📝 Notes & Decisions

### SCSS Architecture
- ✅ Using `@use` and `@forward` (modern SCSS, no deprecation warnings)
- ✅ `_tokens.scss` - Pure SCSS variables (safe for CSS modules)
- ✅ `_variables.scss` - CSS custom properties for theming (only in globals.scss)
- ✅ `_mixins.scss` - Reusable SCSS mixins (forwards tokens)
- ✅ Component `.module.scss` - Import only mixins (which includes tokens)

### Theming System
- ✅ Three themes: green (default), light-green, yellow
- ✅ CSS custom properties in `_variables.scss` (`:root[data-theme='...']`)
- ✅ Colors use CSS variables: `var(--bg-primary)`, `var(--fg-accent)`, etc.
- ⚠️ **IMPORTANT:** Never hardcode theme colors in components
- ⚠️ **ThemeSelector:** Must use SCSS variables for theme preview colors
- ✅ Theme switching: JavaScript updates `data-theme` attribute on `:root`

### Component Patterns
- Use `clsx` for conditional className (already installed)
- Export component + props interface
- Use TypeScript for all components
- Required `aria-label` for icon-only buttons
- Support all standard HTML attributes via spread

### Migration Strategy
1. Create all base components first (Phases 1-4)
2. Migrate one page at a time, starting with Gear page
3. Replace utility classes as we go
4. Keep Tailwind for layout utilities temporarily
5. Eventually remove Tailwind completely

### Testing Strategy
- Test each component in isolation before integration
- **Verify all themes work (green, light-green, yellow)** - Critical!
- Check responsive behavior (mobile, tablet, desktop)
- Ensure accessibility (keyboard nav, screen readers)
- Verify no broken functionality after migration
- **ThemeSelector:** Test that preview colors match actual theme colors

---

## 🚀 Next Actions

### 🔥 IMMEDIATE (Replace External Dependencies)
1. **Create Modal component system** (CRITICAL)
   - Modal, ModalHeader, ModalFooter components
   - Replace @radix-ui/react-dialog
   - Add SCSS module with animations
   - Test with existing dialogs

2. **Create Dropdown component** (High)
   - Dropdown menu with positioning
   - Replace @radix-ui/react-dropdown-menu
   - Keyboard navigation
   - Used in ItemCard mobile menu

### 📋 SHORT TERM (This Week)
3. **Create form components** (High Priority)
   - Input component with variants
   - Select component
   - **Combobox component** (replace cmdk in NewItemForm)
   - FormField wrapper

4. **Finish button/tag integration**
   - Integrate Button in ActionBar
   - Integrate FilterButton in CategoryFilter  
   - Integrate Tag and IconButton in ItemCard

### 🎯 MEDIUM TERM (Next Week)
5. **CommandPalette and Dock**
   - Replace cmdk package
   - Create Dock component

6. **Migrate major pages**
   - Complete Gear page migration
   - Migrate Lists page with ListCard
   - Start Packing List page migration

### ✨ LONG TERM (Later)
7. **Cleanup and polish**
   - Remove Radix UI dependencies from package.json
   - Remove old utility classes from globals.scss
   - Create component documentation
   - Performance optimization
   - Accessibility audit

---

## 📦 External Dependencies to Remove

Track removal of external UI packages:

- [ ] `@radix-ui/react-dialog` → Replace with Modal component
- [ ] `@radix-ui/react-dropdown-menu` → Replace with Dropdown component
- [ ] `@radix-ui/react-icons` → Already using custom Icon component, can remove
- [ ] `cmdk` → Replace with CommandPalette component
- [ ] `sonner` → Keep for now (works well) or replace with Toast component later

**Target:** Reduce from 5 UI dependencies to 0-1 (maybe keep Sonner)
