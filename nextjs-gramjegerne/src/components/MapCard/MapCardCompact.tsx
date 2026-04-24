'use client';

import {Tag} from '@/components/Tag';
import {Icon} from '@/components/Icon';
import Image from 'next/image';
import clsx from 'clsx';
import styles from './MapCardCompact.module.scss';

interface CompactRoute {
  waypoints?: Array<{lat: number; lng: number}>;
  elevationGain?: number;
}

export interface CompactMap {
  _id: string;
  name: string;
  image?: {asset: {_ref: string}};
  routesCount: number;
  campingSpotsCount: number;
  routes?: CompactRoute[];
}

interface MapCardCompactProps {
  map: CompactMap;
  isSelected: boolean;
  onClick: () => void;
  imageUrlBuilder: (asset: {_ref: string}) => string;
  connectedLabel?: string;
}

export function MapCardCompact({
  map,
  isSelected,
  onClick,
  imageUrlBuilder,
  connectedLabel,
}: MapCardCompactProps) {
  const imageUrl = map.image?.asset ? imageUrlBuilder(map.image.asset) : null;

  const totalDistance = (map.routes ?? []).reduce((sum, route) => {
    const wp = route.waypoints;
    if (!wp || wp.length < 2) return sum;
    let d = 0;
    for (let i = 1; i < wp.length; i++) {
      const prev = wp[i - 1];
      const curr = wp[i];
      const dLat = ((curr.lat - prev.lat) * Math.PI) / 180;
      const dLng = ((curr.lng - prev.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((prev.lat * Math.PI) / 180) *
          Math.cos((curr.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      d += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return sum + d;
  }, 0);

  const totalElevation = (map.routes ?? []).reduce(
    (sum, route) => sum + (route.elevationGain && route.elevationGain > 0 ? route.elevationGain : 0),
    0,
  );

  return (
    <li
      className={clsx(styles.card, isSelected && styles['card--selected'])}
      onClick={onClick}
    >
      {imageUrl ? (
        <Image
          className={styles.image}
          src={imageUrl}
          alt={map.name}
          width={96}
          height={96}
        />
      ) : (
        <div className={styles.imagePlaceholder}>
          <Icon name="route" width={16} height={16} />
        </div>
      )}
      <div className={styles.content}>
        <h2 className={styles.title}>{map.name}</h2>
        <div className={styles.metadata}>
          {map.routesCount > 0 && (
            <Tag size="sm" iconName="route">
              {map.routesCount}
            </Tag>
          )}
          {map.campingSpotsCount > 0 && (
            <Tag size="sm" iconName="locationpin">
              {map.campingSpotsCount}
            </Tag>
          )}
          {totalDistance > 0 && (
            <Tag size="sm">
              {totalDistance.toFixed(1)} km
            </Tag>
          )}
          {totalElevation > 0 && (
            <Tag size="sm">
              ↗ {Math.round(totalElevation)} m
            </Tag>
          )}
        </div>
        {connectedLabel && (
          <span className={styles.connectedLabel}>{connectedLabel}</span>
        )}
      </div>
    </li>
  );
}
