'use client';

import {ButtonHTMLAttributes} from 'react';
import {Icon} from '@/components/Icon';
import type {IconName} from '@/components/Icon';
import clsx from 'clsx';
import styles from './IconButton.module.scss';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconName: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'trans';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string; // Required for accessibility
}

export function IconButton({
  iconName,
  variant = 'ghost',
  size = 'md',
  className,
  ...props
}: IconButtonProps) {
  // Determine icon size based on button size
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;

  return (
    <button
      className={clsx(
        styles.iconButton,
        styles[`iconButton--${variant}`],
        styles[`iconButton--${size}`],
        className,
      )}
      {...props}
    >
      <Icon name={iconName} width={iconSize} height={iconSize} />
    </button>
  );
}
