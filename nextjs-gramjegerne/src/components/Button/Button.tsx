'use client';

import {ButtonHTMLAttributes, ReactNode} from 'react';
import {Icon} from '@/components/Icon';
import type {IconName} from '@/components/Icon';
import clsx from 'clsx';
import styles from './Button.module.scss';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'trans';
  size?: 'md' | 'lg';
  iconName?: IconName;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'lg',
  iconName,
  iconPosition = 'left',
  iconOnly = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const hasIcon = !!iconName;
  const hasLabel = !!children && !iconOnly;

  return (
    <button
      className={clsx(
        styles.button,
        styles[`button--${variant}`],
        styles[`button--${size}`],
        {
          [styles['button--icon-only']]: iconOnly,
          [styles['button--with-icon']]: hasIcon && hasLabel,
        },
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {hasIcon && iconPosition === 'left' && (
        <Icon name={iconName} width={16} height={16} className={styles.icon} />
      )}
      {hasLabel && <span>{children}</span>}
      {hasIcon && iconPosition === 'right' && (
        <Icon name={iconName} width={16} height={16} className={styles.icon} />
      )}
    </button>
  );
}
