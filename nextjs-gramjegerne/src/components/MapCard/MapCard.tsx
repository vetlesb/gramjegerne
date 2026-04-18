'use client';

import {useRouter} from 'next/navigation';
import Image from 'next/image';
import {useState, useEffect, useRef} from 'react';
import {IconButton} from '@/components/Button';
import {Tag} from '@/components/Tag';
import {Icon} from '@/components/Icon';
import type {ImageAsset} from '@/types';
import styles from './MapCard.module.scss';

interface MapRoute {
  _key?: string;
  waypoints?: Array<{lat: number; lng: number}>;
  elevationGain?: number;
}

export interface MapCardProps {
  mode: 'owned' | 'shared';
  viewMode?: 'list' | 'grid';

  mapId: string;
  name: string;
  image?: ImageAsset;
  routes?: MapRoute[];
  campingSpotsCount?: number;
  routesCount?: number;

  // Shared mode specific
  ownerName?: string;

  // Navigation: if true, uses /maps?share=... else /maps/${mapId}
  shareId?: string;
  isSharedMap?: boolean;

  // If set, appends &fromTrip=${fromTrip} to the URL so the map page
  // can show a "back to trip" button.
  fromTrip?: string;

  // Actions
  onRemove?: () => void;
  isMainMap?: boolean;
  onToggleMainMap?: () => void;

  imageUrlBuilder?: (asset: ImageAsset) => string;
}

// Haversine distance calculation
function calculateRouteDistance(waypoints: Array<{lat: number; lng: number}>): number {
  if (waypoints.length < 2) return 0;
  let totalDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const R = 6371; // km
    const dLat = ((curr.lat - prev.lat) * Math.PI) / 180;
    const dLng = ((curr.lng - prev.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((prev.lat * Math.PI) / 180) *
        Math.cos((curr.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c;
  }
  return totalDistance;
}

export function MapCard({
  mode,
  viewMode = 'list',
  mapId,
  name,
  image,
  routes,
  campingSpotsCount,
  routesCount,
  ownerName,
  shareId,
  isSharedMap,
  fromTrip,
  onRemove,
  isMainMap,
  onToggleMainMap,
  imageUrlBuilder,
}: MapCardProps) {
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
    const params = new URLSearchParams();
    if (isSharedMap && shareId) {
      params.set('share', shareId);
    } else {
      params.set('trip', mapId);
    }
    if (fromTrip) params.set('fromTrip', fromTrip);
    router.push(`/maps?${params.toString()}`);
  };

  // Calculate totals
  const totalDistance = (routes || []).reduce(
    (total, route) => total + (route.waypoints ? calculateRouteDistance(route.waypoints) : 0),
    0,
  );
  const totalElevation = (routes || []).reduce(
    (total, route) => total + (route.elevationGain && route.elevationGain > 0 ? route.elevationGain : 0),
    0,
  );

  return (
    <li className={viewMode === 'list' ? styles.cardList : styles.card}>
      <div
        className={viewMode === 'list' ? styles.listLayout : styles.gridLayout}
        onClick={viewMode === 'list' ? handleClick : undefined}
      >
        {/* Image */}
        <div className={styles.imageContainer}>
          {viewMode === 'grid' && onRemove && (
            <div className={styles.overlayActions}>
              <IconButton
                iconName="delete"
                variant="trans"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                aria-label="Remove map"
                title="Remove map"
              />
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
          <h2 className={styles.title}>{name}{isMainMap && <span className={styles.mainMapLabel}> — Main map</span>}</h2>

          <div className={styles.metadata}>
            {mode === 'shared' && ownerName && <Tag iconName="user">{ownerName}</Tag>}
            {totalDistance > 0 && <Tag iconName="route">{totalDistance.toFixed(1)} km</Tag>}
            {totalElevation > 0 && <Tag iconName="viewpoint">{Math.round(totalElevation)} m</Tag>}
            {campingSpotsCount != null && campingSpotsCount > 0 && (
              <Tag iconName="location">{campingSpotsCount} spots</Tag>
            )}
            {routesCount != null && routesCount > 0 && (
              <Tag iconName="route">{routesCount} routes</Tag>
            )}
          </div>
        </div>

        {/* Actions - only in list view */}
        {viewMode === 'list' && (onRemove || onToggleMainMap) && (
          <div className={styles.actions}>
            <div className={styles.desktopActions}>
              {onToggleMainMap && (
                <IconButton
                  iconName="navigation"
                  variant={isMainMap ? 'primary' : 'ghost'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMainMap();
                  }}
                  aria-label={isMainMap ? 'Remove as main map' : 'Set as main map'}
                  title={isMainMap ? 'Remove as main map' : 'Set as main map'}
                />
              )}
              {onRemove && (
                <IconButton
                  iconName="delete"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  aria-label="Remove map"
                  title="Remove map"
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
                  {onToggleMainMap && (
                    <button
                      className={styles.menuItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMoreMenuOpen(false);
                        onToggleMainMap();
                      }}
                    >
                      <Icon name="navigation" />
                      {isMainMap ? 'Remove main map' : 'Set as main map'}
                    </button>
                  )}
                  {onRemove && (
                    <button
                      className={styles.menuItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMoreMenuOpen(false);
                        onRemove();
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
