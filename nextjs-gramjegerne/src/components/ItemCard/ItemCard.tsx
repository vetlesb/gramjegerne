'use client';

import {useState} from 'react';
import {IconButton} from '@/components/Button';
import {Tag} from '@/components/Tag';
import {Icon} from '@/components/Icon';
import {useLanguage} from '@/i18n/LanguageProvider';
import Image from 'next/image';
import type {Item, ImageAsset} from '@/types';
import styles from './ItemCard.module.scss';

interface ListItem {
  _key: string;
  item: Item | null;
  quantity?: number;
  checked?: boolean;
  onBody?: boolean;
}

export interface ItemCardProps {
  mode: 'gear' | 'grid' | 'list' | 'list-readonly';
  item: Item;
  
  // Gear/Grid mode props
  onEdit?: (item: Item) => void;
  onDelete?: (itemId: string) => void;
  onImageClick?: (src: string, alt: string) => void;
  
  // List mode props
  listItem?: ListItem;
  onQuantityChange?: (key: string, quantity: number) => void;
  onCheckChange?: (key: string, checked: boolean) => void;
  onBodyChange?: (key: string, onBody: boolean) => void;
  onRemoveFromList?: (key: string) => void;
  
  // Image URL helper
  imageUrlBuilder?: (asset: ImageAsset) => string;
}

export function ItemCard({
  mode,
  item,
  onEdit,
  onDelete,
  onImageClick,
  listItem,
  onQuantityChange,
  onCheckChange,
  onBodyChange,
  onRemoveFromList,
  imageUrlBuilder,
}: ItemCardProps) {
  const {formatPrice} = useLanguage();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [quantityInput, setQuantityInput] = useState<string>(
    listItem?.quantity?.toString() || '1'
  );

  const imageUrl = item.image?.asset
    ? imageUrlBuilder
      ? imageUrlBuilder(item.image.asset)
      : item.image.asset.url
    : null;

  const handleQuantityBlur = () => {
    if (!listItem || !onQuantityChange) return;
    const newQuantity = parseFloat(quantityInput);
    if (!isNaN(newQuantity) && newQuantity >= 0.1) {
      onQuantityChange(listItem._key, newQuantity);
    } else {
      // Reset to current value if invalid
      setQuantityInput(listItem.quantity?.toString() || '1');
    }
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQuantityBlur();
      e.currentTarget.blur();
    }
  };

  // ============================================
  // Gear Mode
  // ============================================
  if (mode === 'gear') {
    return (
      <li className={styles.card}>
        <div className={styles.gearLayout}>
          {/* Image */}
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.name}
              width={64}
              height={64}
              className={styles.image}
              onClick={() => {
                if (onImageClick) {
                  onImageClick(imageUrl, item.name);
                }
              }}
              style={{cursor: onImageClick ? 'pointer' : 'default'}}
            />
          ) : (
            <div className={styles.imagePlaceholder} />
          )}

          {/* Content */}
          <div className={styles.content}>
            <h2
              className={styles.title}
              onClick={() => {
                if (onImageClick) {
                  onImageClick(imageUrl || '', item.name);
                }
              }}
              style={{cursor: onImageClick ? 'pointer' : 'default'}}
            >
              {item.name}
            </h2>
            <div className={styles.metadata}>
              {item.size && (
                <Tag iconName="size">{item.size}</Tag>
              )}
              {item.weight && item.weight.weight > 0 && (
                <Tag iconName="weight">
                  {item.weight.weight} {item.weight.unit}
                </Tag>
              )}
              {typeof item.calories !== 'undefined' && item.calories > 0 && (
                <Tag iconName="calories">{item.calories} kcal</Tag>
              )}
              {typeof item.price !== 'undefined' && item.price > 0 && (
                <Tag>
                  {formatPrice(item.price)}
                </Tag>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            {/* Desktop buttons */}
            <div className={styles.desktopActions}>
              <IconButton
                iconName="edit"
                variant="ghost"
                onClick={() => onEdit?.(item)}
                aria-label="Edit item"
                title="Edit item"
              />
              <IconButton
                iconName="delete"
                variant="ghost"
                onClick={() => onDelete?.(item._id)}
                aria-label="Delete item"
                title="Delete item"
              />
            </div>

            {/* Mobile menu */}
            <div className={styles.mobileMenu}>
              <IconButton
                iconName="ellipsis"
                variant="ghost"
                onClick={() => setActiveMenuId(activeMenuId === item._id ? null : item._id)}
                aria-label="More options"
                title="More options"
              />

              {activeMenuId === item._id && (
                <div className={styles.mobileMenuDropdown}>
                  <button
                    className={styles.mobileMenuItem}
                    onClick={() => {
                      onEdit?.(item);
                      setActiveMenuId(null);
                    }}
                  >
                    <Icon name="edit" width={20} height={20} className={styles.icon} />
                    <span>Edit</span>
                  </button>
                  <button
                    className={styles.mobileMenuItem}
                    onClick={() => {
                      onDelete?.(item._id);
                      setActiveMenuId(null);
                    }}
                  >
                    <Icon name="delete" width={20} height={20} className={styles.icon} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </li>
    );
  }

  // ============================================
  // Grid Mode
  // ============================================
  if (mode === 'grid') {
    return (
      <li className={styles.cardGrid}>
        <div className={styles.gridLayout}>
          {/* Image with overlay actions */}
          <div className={styles.imageContainer}>
            <div className={styles.overlayActions}>
              <IconButton
                iconName="edit"
                variant="trans"
                onClick={() => onEdit?.(item)}
                aria-label="Edit item"
                title="Edit item"
              />
              <IconButton
                iconName="delete"
                variant="trans"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(item._id);
                }}
                aria-label="Delete item"
                title="Delete item"
              />
            </div>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={item.name}
                width={800}
                height={800}
                className={styles.gridImage}
                onClick={() => {
                  if (onImageClick) {
                    onImageClick(imageUrl, item.name);
                  }
                }}
                style={{cursor: onImageClick ? 'pointer' : 'default'}}
              />
            ) : (
              <div className={styles.gridImagePlaceholder} />
            )}
          </div>

          {/* Content */}
          <div className={styles.gridContent}>
            <h2
              className={styles.title}
              onClick={() => {
                if (onImageClick) {
                  onImageClick(imageUrl || '', item.name);
                }
              }}
              style={{cursor: onImageClick ? 'pointer' : 'default'}}
            >
              {item.name}
            </h2>
            <div className={styles.metadata}>
              {item.size && (
                <Tag iconName="size">{item.size}</Tag>
              )}
              {item.weight && item.weight.weight > 0 && (
                <Tag iconName="weight">
                  {item.weight.weight} {item.weight.unit}
                </Tag>
              )}
              {typeof item.calories !== 'undefined' && item.calories > 0 && (
                <Tag iconName="calories">{item.calories} kcal</Tag>
              )}
              {typeof item.price !== 'undefined' && item.price > 0 && (
                <Tag>
                  {formatPrice(item.price)}
                </Tag>
              )}
            </div>
          </div>
        </div>
      </li>
    );
  }

  // ============================================
  // List Mode (Editable or Read-only)
  // ============================================
  if ((mode === 'list' || mode === 'list-readonly') && listItem) {
    const isReadonly = mode === 'list-readonly';

    return (
      <li className={`${styles.card} ${listItem.checked ? styles['card--checked'] : ''}`}>
        <div className={styles.listLayout}>
          {/* Image */}
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.name}
              width={64}
              height={64}
              className={styles.image}
              onClick={() => {
                if (onImageClick) {
                  onImageClick(imageUrl, item.name);
                }
              }}
              style={{cursor: onImageClick ? 'pointer' : 'default'}}
            />
          ) : (
            <div className={styles.imagePlaceholder} />
          )}

          {/* Content */}
          <div className={styles.content}>
            <h2 className={styles.title}>{item.name}</h2>
            <div className={styles.metadata}>
              {item.size && (
                <Tag iconName="size">{item.size}</Tag>
              )}
              {item.weight && item.weight.weight > 0 && (
                <Tag iconName="weight">
                  {item.weight.weight} {item.weight.unit}
                </Tag>
              )}
              {typeof item.calories !== 'undefined' && item.calories > 0 && (
                <Tag iconName="calories">{item.calories} kcal</Tag>
              )}
            </div>
          </div>

          {/* List Controls */}
          <div className={styles.listControls}>
            {/* Quantity input */}
            {!isReadonly && onQuantityChange && (
              <input
                type="number"
                className={styles.quantityInput}
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                onBlur={handleQuantityBlur}
                onKeyDown={handleQuantityKeyDown}
                min="0.1"
                step="0.1"
              />
            )}
            {isReadonly && (
              <Tag>{listItem.quantity || 1}x</Tag>
            )}

            {/* Checkbox */}
            {!isReadonly && onCheckChange && (
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={listItem.checked || false}
                onChange={(e) => onCheckChange(listItem._key, e.target.checked)}
              />
            )}
            {isReadonly && listItem.checked && (
              <Icon name="checkmark" width={20} height={20} className={styles.icon} />
            )}

            {/* On Body toggle */}
            {!isReadonly && onBodyChange && (
              <button
                className={`${styles.onBodyButton} ${
                  listItem.onBody ? styles['onBodyButton--active'] : ''
                }`}
                onClick={() => onBodyChange(listItem._key, !listItem.onBody)}
              >
                On body
              </button>
            )}
            {isReadonly && listItem.onBody && (
              <Tag>On body</Tag>
            )}

            {/* Remove button */}
            {!isReadonly && onRemoveFromList && (
              <IconButton
                iconName="close"
                variant="ghost"
                onClick={() => onRemoveFromList(listItem._key)}
                aria-label="Remove from list"
                title="Remove from list"
              />
            )}
          </div>
        </div>
      </li>
    );
  }

  return null;
}
