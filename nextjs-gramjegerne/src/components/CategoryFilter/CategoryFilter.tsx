'use client';

import {FilterButton} from '@/components/Button';
import {useLanguage} from '@/i18n/LanguageProvider';
import styles from './CategoryFilter.module.scss';

interface Category {
  _id: string;
  title: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  
  // Optional configuration
  showAllButton?: boolean;
  allButtonLabel?: string;
  
  // Packing list specific
  showOnBodyFilter?: boolean;
  showOnBodyOnly?: boolean;
  onBodyFilterChange?: (show: boolean) => void;
  
  // Show counts per category
  showCounts?: boolean;
  getCategoryCount?: (categoryId: string) => number;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect,
  showAllButton = true,
  allButtonLabel,
  showOnBodyFilter = false,
  showOnBodyOnly = false,
  onBodyFilterChange,
  showCounts = false,
  getCategoryCount,
}: CategoryFilterProps) {
  const {t} = useLanguage();
  return (
    <div className={styles.categoryFilter}>
      {/* All/Overview button */}
      {showAllButton && (
        <FilterButton
          active={selectedCategory === null && !showOnBodyOnly}
          onClick={() => onCategorySelect(null)}
        >
          {allButtonLabel || t.misc.all}
        </FilterButton>
      )}
      
      {/* Category buttons */}
      {categories.map((category) => (
        <FilterButton
          key={category._id}
          active={selectedCategory === category._id}
          count={showCounts && getCategoryCount ? getCategoryCount(category._id) : undefined}
          onClick={() => onCategorySelect(category._id)}
        >
          {category.title}
        </FilterButton>
      ))}
      
      {/* On Body filter (packing list only) */}
      {showOnBodyFilter && onBodyFilterChange && (
        <FilterButton
          active={showOnBodyOnly}
          onClick={() => onBodyFilterChange(!showOnBodyOnly)}
        >
          {t.lists.onBody}
        </FilterButton>
      )}
    </div>
  );
}
