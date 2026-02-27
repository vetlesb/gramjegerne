'use client';

import {ButtonHTMLAttributes, ReactNode} from 'react';
import {Icon} from '@/components/Icon';
import type {IconName} from '@/components/Icon';
import clsx from 'clsx';
import styles from './FilterButton.module.scss';

export interface FilterButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
  iconName?: IconName;
  children: ReactNode;
}

export function FilterButton({
  active = false,
  count,
  iconName,
  children,
  className,
  ...props
}: FilterButtonProps) {
  return (
    <button
      className={clsx(
        styles.filterButton,
        {
          [styles['filterButton--active']]: active,
        },
        className,
      )}
      {...props}
    >
      {iconName && <Icon name={iconName} width={16} height={16} className={styles.icon} />}
      <span className={styles.label}>{children}</span>
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
}
