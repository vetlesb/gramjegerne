'use client';

import {useRouter} from 'next/navigation';
import Image from 'next/image';
import {useState, useEffect, useRef} from 'react';
import {IconButton} from '@/components/Button';
import {Tag} from '@/components/Tag';
import {Icon} from '@/components/Icon';
import type {ImageAsset} from '@/types';
import styles from './ListCard.module.scss';

interface ListItem {
  _key: string;
  quantity?: number;
  item: {
    _id: string;
    name: string;
    weight?: {
      weight: number;
      unit: string;
    };
    calories?: number;
  } | null;
}

export interface ListCardProps {
  mode: 'owned' | 'shared';
  viewMode?: 'list' | 'grid';

  // List data
  listId: string;
  name: string;
  slug: string;
  image?: ImageAsset;
  completed?: boolean;
  participants?: number;
  days?: number;
  items?: ListItem[];

  // Shared mode specific
  ownerName?: string;

  // Actions (owned mode)
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;

  // Actions (shared mode)
  onRemove?: () => void;

  // Image URL helper
  imageUrlBuilder?: (asset: ImageAsset) => string;
}

export function ListCard({
  mode,
  viewMode = 'grid',
  name,
  slug,
  image,
  completed,
  participants,
  days,
  items,
  ownerName,
  onEdit,
  onDuplicate,
  onDelete,
  onRemove,
  imageUrlBuilder,
}: ListCardProps) {
  const router = useRouter();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const imageUrl = image && imageUrlBuilder ? imageUrlBuilder(image) : null;

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

  const handleClick = () => {
    const url = mode === 'shared' ? `/lists/${slug}?shared=true` : `/lists/${slug}`;
    router.push(url);
  };

  // Calculate totals
  const {totalWeight, totalCalories} = (() => {
    let weight = 0;
    let calories = 0;

    items?.forEach((item) => {
      if (!item.item) return;
      const quantity = item.quantity || 1;

      if (item.item.weight?.weight) {
        weight += item.item.weight.weight * quantity;
      }

      if (item.item.calories) {
        calories += item.item.calories * quantity;
      }
    });

    return {totalWeight: weight, totalCalories: calories};
  })();

  // Format functions
  const formatWeight = (weightInGrams: number): string => {
    const weightInKg = weightInGrams / 1000;
    return `${weightInKg.toFixed(3)} kg`;
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  return (
    <li className={viewMode === 'list' ? styles.cardList : styles.card}>
      <div
        className={viewMode === 'list' ? styles.listLayout : styles.gridLayout}
        onClick={viewMode === 'list' ? handleClick : undefined}
      >
        {/* Image */}
        <div className={styles.imageContainer}>
          {/* Status tag - only in grid view */}
          {viewMode === 'grid' && mode === 'owned' && (
            <div className={styles.statusTag}>
              <Tag>{completed ? 'Completed' : 'Planned'}</Tag>
            </div>
          )}

          {/* Overlay actions - only in grid view */}
          {viewMode === 'grid' && (
            <div className={styles.overlayActions}>
              {mode === 'owned' ? (
                <>
                  <IconButton
                    iconName="edit"
                    variant="trans"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                    aria-label="Edit list"
                    title="Edit list"
                  />
                  <IconButton
                    iconName="duplicate"
                    variant="trans"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.();
                    }}
                    aria-label="Duplicate list"
                    title="Duplicate list"
                  />
                  <IconButton
                    iconName="delete"
                    variant="trans"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                    aria-label="Delete list"
                    title="Delete list"
                  />
                </>
              ) : (
                <IconButton
                  iconName="delete"
                  variant="trans"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove?.();
                  }}
                  aria-label="Remove from shared lists"
                  title="Remove from shared lists"
                />
              )}
            </div>
          )}

          {imageUrl ? (
            <Image 
              src={imageUrl} 
              alt={name} 
              width={800} 
              height={450} 
              className={styles.image}
              onClick={viewMode === 'grid' ? handleClick : undefined}
            />
          ) : (
            <div 
              className={styles.imagePlaceholder}
              onClick={viewMode === 'grid' ? handleClick : undefined}
            />
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h2 className={styles.title}>{name}</h2>

          <div className={styles.metadata}>
            {/* Status tag for list view */}
            {viewMode === 'list' && mode === 'owned' && (
              <Tag>{completed ? 'Completed' : 'Planned'}</Tag>
            )}

            {mode === 'shared' && ownerName && <Tag iconName="user">{ownerName}</Tag>}
            {mode === 'owned' && participants && <Tag iconName="user">{participants}</Tag>}
            {days && <Tag iconName="calendar">{days}</Tag>}
            {totalWeight > 0 && <Tag iconName="weight">{formatWeight(totalWeight)}</Tag>}
            {totalCalories > 0 && <Tag iconName="calories">{formatNumber(totalCalories)} kcal</Tag>}
          </div>
        </div>

        {/* Actions - only in list view, outside image */}
        {viewMode === 'list' && (
          <div className={styles.actions}>
            {/* Desktop: Show all buttons */}
            <div className={styles.desktopActions}>
              {mode === 'owned' ? (
                <>
                  <IconButton
                    iconName="edit"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                    aria-label="Edit list"
                    title="Edit list"
                  />
                  <IconButton
                    iconName="duplicate"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.();
                    }}
                    aria-label="Duplicate list"
                    title="Duplicate list"
                  />
                  <IconButton
                    iconName="delete"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                    aria-label="Delete list"
                    title="Delete list"
                  />
                </>
              ) : (
                <IconButton
                  iconName="delete"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove?.();
                  }}
                  aria-label="Remove from shared lists"
                  title="Remove from shared lists"
                />
              )}
            </div>

            {/* Mobile/Tablet: Show "More" dropdown */}
            <div className={styles.mobileActions} ref={moreMenuRef}>
              <IconButton
                iconName="ellipsis"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMoreMenuOpen(!isMoreMenuOpen);
                }}
                aria-label="More actions"
                title="More actions"
              />

              {isMoreMenuOpen && (
                <div className={styles.moreMenuDropdown}>
                  {mode === 'owned' ? (
                    <>
                      <button
                        className={styles.menuItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMoreMenuOpen(false);
                          onEdit?.();
                        }}
                      >
                        <Icon name="edit" />
                        Edit
                      </button>
                      <button
                        className={styles.menuItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMoreMenuOpen(false);
                          onDuplicate?.();
                        }}
                      >
                        <Icon name="duplicate" />
                        Duplicate
                      </button>
                      <button
                        className={styles.menuItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMoreMenuOpen(false);
                          onDelete?.();
                        }}
                      >
                        <Icon name="delete" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.menuItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMoreMenuOpen(false);
                        onRemove?.();
                      }}
                    >
                      <Icon name="delete" />
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
