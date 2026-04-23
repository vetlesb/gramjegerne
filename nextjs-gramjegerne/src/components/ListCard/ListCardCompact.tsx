'use client';

import {Tag} from '@/components/Tag';
import {Icon} from '@/components/Icon';
import Image from 'next/image';
import clsx from 'clsx';
import styles from './ListCardCompact.module.scss';

interface ListCardCompactItem {
  quantity?: number;
  weight?: number;
}

export interface CompactList {
  _id: string;
  name: string;
  image?: {asset: {_ref: string}};
  items?: ListCardCompactItem[];
}

interface ListCardCompactProps {
  list: CompactList;
  isSelected: boolean;
  onClick: () => void;
  imageUrlBuilder: (asset: {_ref: string}) => string;
  connectedLabel?: string;
}

export function ListCardCompact({
  list,
  isSelected,
  onClick,
  imageUrlBuilder,
  connectedLabel,
}: ListCardCompactProps) {
  const imageUrl = list.image?.asset ? imageUrlBuilder(list.image.asset) : null;
  const itemCount = list.items?.length ?? 0;
  const totalWeight = list.items?.reduce((sum, i) => sum + (i.weight ?? 0) * (i.quantity ?? 1), 0) ?? 0;

  return (
    <li
      className={clsx(styles.card, isSelected && styles['card--selected'])}
      onClick={onClick}
    >
      {imageUrl ? (
        <Image
          className={styles.image}
          src={imageUrl}
          alt={list.name}
          width={96}
          height={96}
        />
      ) : (
        <div className={styles.imagePlaceholder}>
          <Icon name="list" width={16} height={16} />
        </div>
      )}
      <div className={styles.content}>
        <h2 className={styles.title}>{list.name}</h2>
        <div className={styles.metadata}>
          {itemCount > 0 && (
            <Tag size="sm" iconName="backpack">
              {itemCount}
            </Tag>
          )}
          {totalWeight > 0 && (
            <Tag size="sm" iconName="weight">
              {totalWeight >= 1000
                ? `${(totalWeight / 1000).toFixed(1)} kg`
                : `${Math.round(totalWeight)} g`}
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
