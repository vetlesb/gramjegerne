'use client';

import {Icon} from '@/components/Icon';
import {Tag} from '@/components/Tag';
import {useLanguage} from '@/i18n/LanguageProvider';
import styles from './OverviewStats.module.scss';

interface CategoryTotal {
  id: string;
  title: string;
  count: number;
  weight: number;
  weightOnBody: number;
  calories: number;
  checkedCount: number;
}

interface OverviewStatsProps {
  mode: 'gear' | 'list';
  layout?: 'compact' | 'hero' | 'detailed';
  
  // Gear mode data
  totalItems?: number;
  totalWeight?: number;
  totalPrice?: number;
  
  // List mode data
  backpackWeight?: number;
  onBodyWeight?: number;
  calories?: number;
  packedCount?: number;
  totalCount?: number;
  
  // Category breakdown
  showCategoryBreakdown?: boolean;
  categoryTotals?: CategoryTotal[];
}

export function OverviewStats({
  mode,
  layout = 'compact',
  totalItems,
  totalWeight,
  totalPrice,
  backpackWeight,
  onBodyWeight,
  calories,
  packedCount,
  totalCount,
  showCategoryBreakdown = false,
  categoryTotals = [],
}: OverviewStatsProps) {
  const {t} = useLanguage();
  const formatWeight = (weightInGrams: number): string => {
    const weightInKg = weightInGrams / 1000;
    return `${weightInKg.toFixed(3)} kg`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
    }).format(price);
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // ============================================
  // Compact Layout (Category-specific stats)
  // ============================================
  if (layout === 'compact') {
    if (mode === 'gear') {
      return (
        <div className={`${styles.overviewStats} ${styles.compact}`}>
          {totalItems !== undefined && (
            <div className={styles.stat}>
              <span>{totalItems} {t.misc.items}</span>
            </div>
          )}
          {totalWeight !== undefined && totalWeight > 0 && (
            <div className={styles.stat}>
              <span>{formatWeight(totalWeight)}</span>
            </div>
          )}
          {totalPrice !== undefined && totalPrice > 0 && (
            <div className={styles.stat}>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          )}
        </div>
      );
    }
    
    if (mode === 'list') {
      return (
        <div className={`${styles.overviewStats} ${styles.compact}`}>
          {packedCount !== undefined && totalCount !== undefined && (
            <div className={styles.stat}>
              <span>{formatNumber(packedCount)} / {formatNumber(totalCount)}</span>
            </div>
          )}
          {backpackWeight !== undefined && (
            <div className={styles.stat}>
              <span>{formatWeight(backpackWeight)}</span>
            </div>
          )}
          {calories !== undefined && calories > 0 && (
            <div className={styles.stat}>
              <span>{formatNumber(calories)} kcal</span>
            </div>
          )}
        </div>
      );
    }
  }

  // ============================================
  // Hero Layout (Packing list overview)
  // ============================================
  if (mode === 'list' && layout === 'hero') {
    return (
      <div className={styles.hero}>
        {/* Backpack weight */}
        <div className={styles.heroCard}>
          <p className={styles.heroLabel}>
            <span className={styles.heroIcon}>
              <Icon name="backpack" width={18} height={18} />
            </span>
            {t.lists.backpack}
          </p>
          <p className={styles.heroValue}>
            {backpackWeight !== undefined ? formatWeight(backpackWeight) : '0.000 kg'}
          </p>
        </div>

        {/* On body weight */}
        <div className={styles.heroCard}>
          <p className={styles.heroLabel}>
            <span className={styles.heroIcon}>
              <Icon name="clothing" width={18} height={18} />
            </span>
            {t.lists.onBody}
          </p>
          <p className={styles.heroValue}>
            {onBodyWeight !== undefined ? formatWeight(onBodyWeight) : '0.000 kg'}
          </p>
        </div>

        {/* Calories */}
        <div className={styles.heroCard}>
          <p className={styles.heroLabel}>
            <span className={styles.heroIcon}>
              <Icon name="calories" width={18} height={18} />
            </span>
            {t.labels.calories}
          </p>
          <p className={styles.heroValue}>
            {calories !== undefined ? `${formatNumber(calories)} kcal` : '0 kcal'}
          </p>
        </div>

        {/* Packed count */}
        <div className={styles.heroCard}>
          <p className={styles.heroLabel}>
            <span className={styles.heroIcon}>
              <Icon name="checkmark" width={18} height={18} />
            </span>
            {t.lists.packed}
          </p>
          <p className={styles.heroValue}>
            {formatNumber(packedCount || 0)} / {formatNumber(totalCount || 0)}
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // Detailed Layout (Category breakdown)
  // ============================================
  if (layout === 'detailed' && showCategoryBreakdown) {
    const regularCategories = categoryTotals.filter((cat) => cat.id !== 'on-body');
    const onBodyCategory = categoryTotals.find((cat) => cat.id === 'on-body');
    
    const grandTotal = regularCategories.reduce(
      (acc, cat) => ({
        weight: acc.weight + cat.weight,
        calories: acc.calories + cat.calories,
      }),
      { weight: 0, calories: 0 }
    );

    return (
      <div className={`${styles.overviewStats} ${styles.detailed}`}>
        <div className={styles.detailedContent}>
          <div className={styles.table}>
            {/* Table header */}
            <div className={styles.tableHeader}>
              <span>{t.labels.category}</span>
              <span>{t.labels.weight}</span>
              <span>{t.labels.calories}</span>
            </div>

            {/* Regular categories */}
            {regularCategories.map((total) => (
              <div key={total.id} className={styles.tableRow}>
                <span className={styles.categoryName}>
                  {total.title}{' '}
                  <Tag size="sm">
                    {formatNumber(total.checkedCount || 0)}/{formatNumber(total.count || 0)}
                  </Tag>
                </span>
                <span>{formatWeight(total.weight + total.weightOnBody)}</span>
                <span>{total.calories > 0 ? `${formatNumber(total.calories)} kcal` : ''}</span>
              </div>
            ))}

            {/* On body section */}
            {onBodyCategory && (
              <div className={styles.tableRow}>
                <span className={styles.categoryName}>{t.lists.onBody}</span>
                <span>{formatWeight(onBodyCategory.weightOnBody)}</span>
                <span>
                  {onBodyCategory.calories > 0 ? `${formatNumber(onBodyCategory.calories)} kcal` : ''}
                </span>
              </div>
            )}

            {/* Grand total */}
            <div className={`${styles.tableRow} ${styles['tableRow--total']}`}>
              <span className={styles.categoryName}>{t.lists.backpack}</span>
              <span>{formatWeight(grandTotal.weight)}</span>
              <span>
                {grandTotal.calories > 0 ? `${formatNumber(grandTotal.calories)} kcal` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
