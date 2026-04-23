'use client';

import {useState, useRef, useEffect} from 'react';
import {IconButton} from '@/components/Button';
import {Tag} from '@/components/Tag';
import {Icon} from '@/components/Icon';
import Image from 'next/image';
import type {ImageAsset} from '@/types';
import {useLanguage} from '@/i18n/LanguageProvider';
import styles from './PackingListItem.module.scss';

interface ListItem {
  _key: string;
  item: {
    _id: string;
    name: string;
    size?: string;
    weight?: {
      weight: number;
      unit: string;
    };
    calories?: number;
    image?: {
      asset: ImageAsset;
    };
  } | null;
  quantity?: number;
  checked?: boolean;
  onBody?: boolean;
}

export interface PackingListItemProps {
  mode: 'editable' | 'readonly';
  listItem: ListItem;

  // For quantity input - parent controls temp state
  quantityValue?: string;
  onQuantityInputChange?: (key: string, value: string) => void;
  onQuantityBlur?: (key: string, value: string) => void;

  // Editable mode callbacks
  onCheckChange?: (key: string, checked: boolean) => void;
  onBodyChange?: (key: string, onBody: boolean) => void;
  onDelete?: (key: string) => void;

  // Readonly mode callbacks
  onAddToGear?: (item: NonNullable<ListItem['item']>) => void;

  // Image URL helper
  imageUrlBuilder?: (asset: ImageAsset) => string;
}

export function PackingListItem({
  mode,
  listItem,
  quantityValue,
  onQuantityInputChange,
  onQuantityBlur,
  onCheckChange,
  onBodyChange,
  onDelete,
  onAddToGear,
  imageUrlBuilder,
}: PackingListItemProps) {
  const {t} = useLanguage();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isReadonly = mode === 'readonly';
  const imageUrl =
    listItem.item?.image && imageUrlBuilder ? imageUrlBuilder(listItem.item.image.asset) : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  // Handle card click to toggle checkbox
  const handleCardClick = () => {
    if (!isReadonly && onCheckChange) {
      onCheckChange(listItem._key, !(listItem.checked ?? false));
    }
  };

  return (
    <li
      className={`${styles.card} ${listItem.checked ? styles['card--checked'] : ''}`}
      onClick={!isReadonly ? handleCardClick : undefined}
      style={{cursor: !isReadonly ? 'pointer' : 'default'}}
    >
      <div className={styles.listLayout}>
        {/* Image */}
        <div className={styles.imageContainer}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listItem.item?.name || 'Item'}
              width={64}
              height={64}
              className={styles.image}
            />
          ) : (
            <div className={styles.imagePlaceholder} />
          )}

          {/* Checkmark overlay when packed */}
          {listItem.checked && (
            <div className={styles.checkmarkOverlay}>
              <Icon name="checkmark" width={16} height={16} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h2 className={styles.title}>{listItem.item?.name || 'Unnamed Item'}</h2>
          <div className={styles.metadata}>
            {/* Quantity - Editable input in editable mode, tag in readonly mode */}
            {!isReadonly ? (
              <div className={styles.quantityTag}>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={
                    quantityValue !== undefined
                      ? quantityValue
                      : (listItem.quantity?.toString() ?? '1')
                  }
                  onChange={(e) => {
                    e.stopPropagation();
                    onQuantityInputChange?.(listItem._key, e.target.value);
                  }}
                  onBlur={(e) => {
                    e.stopPropagation();
                    onQuantityBlur?.(listItem._key, e.target.value);
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={styles.quantityInput}
                  aria-label="Quantity"
                />
                <span className={styles.quantityLabel}>x</span>
              </div>
            ) : (
              <Tag responsive>
                {listItem.quantity || 1}x
              </Tag>
            )}
            {listItem.item?.size && (
              <Tag iconName="size" responsive>
                {listItem.item.size}
              </Tag>
            )}
            {listItem.item?.weight && listItem.item.weight.weight > 0 && (
              <Tag iconName="weight" responsive>
                {listItem.item.weight.weight * (listItem.quantity || 1)} {listItem.item.weight.unit}
              </Tag>
            )}
            {listItem.item?.calories && listItem.item.calories > 0 && (
              <Tag iconName="calories" responsive>
                {listItem.item.calories * (listItem.quantity || 1)} kcal
              </Tag>
            )}
          </div>
        </div>

        {/* Add to gear - Only in readonly mode */}
        {isReadonly && onAddToGear && listItem.item && (
          <div className={styles.actions}>
            <IconButton
              iconName="add"
              variant="ghost"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                onAddToGear(listItem.item!);
              }}
              aria-label={t.lists.addToGear}
              title={t.lists.addToGear}
            />
          </div>
        )}

        {/* Actions - Only in editable mode */}
        {!isReadonly && (
          <div className={styles.actions}>
            {/* Desktop actions */}
            <div className={styles.desktopActions}>
              {/* OnBody toggle */}
              <IconButton
                iconName={listItem.onBody ? 'clothingfilled' : 'clothing'}
                variant="ghost"
                size="md"
                onClick={(e) => {
                  e.stopPropagation();
                  onBodyChange?.(listItem._key, !listItem.onBody);
                }}
                aria-label={listItem.onBody ? t.lists.removeOnBody : t.lists.setOnBody}
                title={listItem.onBody ? t.lists.removeOnBody : t.lists.setOnBody}
              />

              {/* Delete button */}
              <IconButton
                iconName="delete"
                variant="ghost"
                size="md"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(listItem._key);
                }}
                aria-label={t.actions.delete}
                title={t.actions.delete}
              />
            </div>

            {/* Mobile menu */}
            <div className={styles.mobileActions} ref={moreMenuRef}>
              <IconButton
                iconName="ellipsis"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMoreMenuOpen(!isMoreMenuOpen);
                }}
                aria-label={t.actions.edit}
                title={t.actions.edit}
              />

              {isMoreMenuOpen && (
                <div className={styles.moreMenuDropdown}>
                  <button
                    className={styles.menuItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMoreMenuOpen(false);
                      onBodyChange?.(listItem._key, !listItem.onBody);
                    }}
                  >
                    <Icon name="clothing" />
                    {listItem.onBody ? t.lists.removeOnBody : t.lists.onBody}
                  </button>
                  <button
                    className={styles.menuItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMoreMenuOpen(false);
                      onDelete?.(listItem._key);
                    }}
                  >
                    <Icon name="delete" />
                    {t.actions.delete}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
