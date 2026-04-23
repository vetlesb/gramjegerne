'use client';

import {Tag} from '@/components/Tag';
import {Icon} from '@/components/Icon';
import Image from 'next/image';
import clsx from 'clsx';
import styles from './ItemCardCompact.module.scss';

interface CompactItem {
  _id: string;
  name: string;
  image?: {asset: {_ref: string}};
  size?: string;
  weight?: {weight: number; unit: string};
  calories?: number;
}

interface ItemCardCompactProps {
  item: CompactItem;
  isSelected: boolean;
  onClick: () => void;
  imageUrlBuilder: (asset: {_ref: string}) => string;
}

export function ItemCardCompact({item, isSelected, onClick, imageUrlBuilder}: ItemCardCompactProps) {
  const imageUrl = item.image?.asset ? imageUrlBuilder(item.image.asset) : null;

  return (
    <li
      className={clsx(styles.card, isSelected && styles['card--selected'])}
      onClick={onClick}
    >
      {imageUrl ? (
        <Image
          className={styles.image}
          src={imageUrl}
          alt={item.name}
          width={96}
          height={96}
        />
      ) : (
        <div className={styles.imagePlaceholder}>
          <Icon name="add" width={16} height={16} />
        </div>
      )}
      <div className={styles.content}>
        <h2 className={styles.title}>{item.name}</h2>
        <div className={styles.metadata}>
          {item.size && (
            <Tag size="sm" iconName="size">
              {item.size}
            </Tag>
          )}
          {item.weight && (
            <Tag size="sm" iconName="weight">
              {item.weight.weight} {item.weight.unit}
            </Tag>
          )}
          {item.calories != null && item.calories > 0 && (
            <Tag size="sm" iconName="calories">
              {item.calories} kcal
            </Tag>
          )}
        </div>
      </div>
    </li>
  );
}
