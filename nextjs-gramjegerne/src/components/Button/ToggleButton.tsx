'use client';

import {ButtonHTMLAttributes, ReactNode} from 'react';
import {Icon} from '@/components/Icon';
import type {IconName} from '@/components/Icon';
import clsx from 'clsx';
import styles from './ToggleButton.module.scss';

export interface ToggleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  iconName?: IconName;
  children: ReactNode;
}

export function ToggleButton({
  active = false,
  iconName,
  children,
  className,
  ...props
}: ToggleButtonProps) {
  return (
    <button
      className={clsx(
        styles.toggleButton,
        {[styles['toggleButton--active']]: active},
        className,
      )}
      {...props}
    >
      {iconName && <Icon name={iconName} width={24} height={24} className={styles.icon} />}
      <span>{children}</span>
    </button>
  );
}
