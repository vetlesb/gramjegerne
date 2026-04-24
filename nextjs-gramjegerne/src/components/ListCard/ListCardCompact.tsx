'use client';

import {Tag} from '@/components/Tag';
import {Icon} from '@/components/Icon';
import Image from 'next/image';
import clsx from 'clsx';
import styles from './ListCardCompact.module.scss';

interface ListCardCompactItem {
  quantity?: number;
  weight?: number;
  onBody?: boolean;
  calories?: number;
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

  let backpackWeight = 0;
  let onBodyWeight = 0;
  let totalCalories = 0;
  list.items?.forEach((i) => {
    const qty = i.quantity ?? 1;
    const w = (i.weight ?? 0) * qty;
    if (i.onBody) {
      onBodyWeight += w;
    } else {
      backpackWeight += w;
    }
    totalCalories += (i.calories ?? 0) * qty;
  });

  const formatWeight = (g: number) =>
    g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${Math.round(g)} g`;

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
          {backpackWeight > 0 && (
            <Tag size="sm" iconName="backpack">
              {formatWeight(backpackWeight)}
            </Tag>
          )}
          {onBodyWeight > 0 && (
            <Tag size="sm" iconName="clothing">
              {formatWeight(onBodyWeight)}
            </Tag>
          )}
          {totalCalories > 0 && (
            <Tag size="sm" iconName="calories">
              {totalCalories} kcal
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
