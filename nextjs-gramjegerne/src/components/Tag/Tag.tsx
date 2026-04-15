'use client';

import {HTMLAttributes, ReactNode} from 'react';
import {Icon} from '@/components/Icon';
import type {IconName} from '@/components/Icon';
import clsx from 'clsx';
import styles from './Tag.module.scss';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'dimmed';
  size?: 'md' | 'sm';
  responsive?: boolean;
  iconName?: IconName;
  children: ReactNode;
}

export function Tag({
  variant = 'primary',
  size = 'md',
  responsive = true,
  iconName,
  children,
  className,
  ...props
}: TagProps) {
  return (
    <span
      className={clsx(
        styles.tag,
        styles[`tag--${variant}`],
        styles[`tag--${size}`],
        responsive && styles['tag--responsive'],
        className,
      )}
      {...props}
    >
      {iconName && <Icon name={iconName} width={16} height={16} className={styles.icon} />}
      <span className={styles.label}>{children}</span>
    </span>
  );
}
