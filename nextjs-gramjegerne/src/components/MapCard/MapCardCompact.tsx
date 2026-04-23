'use client';

import {Tag} from '@/components/Tag';
import {Icon} from '@/components/Icon';
import Image from 'next/image';
import clsx from 'clsx';
import styles from './MapCardCompact.module.scss';

export interface CompactMap {
  _id: string;
  name: string;
  image?: {asset: {_ref: string}};
  routesCount: number;
  campingSpotsCount: number;
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
            <Tag size="sm" iconName="tent">
              {map.campingSpotsCount}
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
