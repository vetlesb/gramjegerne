'use client';

import {useRouter} from 'next/navigation';
import Image from 'next/image';
import {useState, useEffect, useRef} from 'react';
import {IconButton} from '@/components/Button';
import {Tag} from '@/components/Tag';
import {Icon} from '@/components/Icon';
import type {ImageAsset} from '@/types';
import styles from './TripCard.module.scss';

export interface TripCardProps {
  mode: 'owned' | 'shared';
  viewMode?: 'list' | 'grid';

  // Trip data
  tripId: string;
  name: string;
  slug: string;
  image?: ImageAsset;
  startDate?: string;
  endDate?: string;
  category?: {_id: string; title: string};
  participantCount?: number;
  connectedListsCount?: number;
  connectedMapsCount?: number;

  // Shared mode specific
  ownerName?: string;

  // Actions (owned mode)
  onEdit?: () => void;
  onDelete?: () => void;

  // Shared trip navigation
  isSharedTrip?: boolean;

  // Actions (shared mode)
  onRemove?: () => void;

  // Image URL helper
  imageUrlBuilder?: (asset: ImageAsset) => string;
}

export function TripCard({
  mode,
  viewMode = 'grid',
  name,
  slug,
  image,
  startDate,
  endDate,
  category,
  participantCount,
  connectedListsCount,
  connectedMapsCount,
  ownerName,
  isSharedTrip,
  onEdit,
  onDelete,
  onRemove,
  imageUrlBuilder,
}: TripCardProps) {
  const router = useRouter();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const imageUrl = image && imageUrlBuilder ? imageUrlBuilder(image) : null;

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
    const url = isSharedTrip ? `/trips/${slug}?shared=true` : `/trips/${slug}`;
    router.push(url);
  };

  // Format date range
  const formatDateRange = (): string | null => {
    if (!startDate && !endDate) return null;
    const opts: Intl.DateTimeFormatOptions = {day: 'numeric', month: 'short', year: 'numeric'};
    const start = startDate ? new Date(startDate).toLocaleDateString('nb-NO', opts) : '';
    const end = endDate ? new Date(endDate).toLocaleDateString('nb-NO', opts) : '';
    if (start && end) return `${start} - ${end}`;
    return start || end;
  };

  const dateRange = formatDateRange();

  return (
    <li className={viewMode === 'list' ? styles.cardList : styles.card}>
      <div
        className={viewMode === 'list' ? styles.listLayout : styles.gridLayout}
        onClick={viewMode === 'list' ? handleClick : undefined}
      >
        {/* Image */}
        <div className={styles.imageContainer}>
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
                    aria-label="Edit trip"
                    title="Edit trip"
                  />
                  <IconButton
                    iconName="delete"
                    variant="trans"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                    aria-label="Delete trip"
                    title="Delete trip"
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
                  aria-label="Remove from shared trips"
                  title="Remove from shared trips"
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
            {category && <Tag>{category.title}</Tag>}
            {mode === 'shared' && ownerName && <Tag iconName="user">{ownerName}</Tag>}
            {dateRange && <Tag iconName="calendar">{dateRange}</Tag>}
            {participantCount != null && participantCount > 0 && (
              <Tag iconName="user">{participantCount}</Tag>
            )}
            {connectedListsCount != null && connectedListsCount > 0 && (
              <Tag iconName="list">{connectedListsCount} lists</Tag>
            )}
            {connectedMapsCount != null && connectedMapsCount > 0 && (
              <Tag iconName="location">{connectedMapsCount} maps</Tag>
            )}
          </div>
        </div>

        {/* Actions - only in list view */}
        {viewMode === 'list' && (
          <div className={styles.actions}>
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
                    aria-label="Edit trip"
                    title="Edit trip"
                  />
                  <IconButton
                    iconName="delete"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                    aria-label="Delete trip"
                    title="Delete trip"
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
                  aria-label="Remove from shared trips"
                  title="Remove from shared trips"
                />
              )}
            </div>

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
