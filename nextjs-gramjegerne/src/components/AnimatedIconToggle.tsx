'use client';

import {useState} from 'react';
import {Icon} from '@/components/Icon';

// Get the icon names from your Icon component
type IconName = Parameters<typeof Icon>[0]['name'];

interface AnimatedIconToggleProps {
  // Icon configuration
  startIcon: IconName;
  endIcon: IconName;

  // Size configuration
  baseSize?: number;
  growSize?: number;

  // Animation timing (in milliseconds)
  animationDuration?: number;
  growDuration?: number;
  shrinkDelay?: number;

  // Styling
  containerSize?: number;
  className?: string;
  style?: React.CSSProperties;

  // Behavior
  onClick?: (isToggled: boolean) => void;
  disabled?: boolean;
  initialState?: boolean;
}

export function AnimatedIconToggle({
  startIcon,
  endIcon,
  baseSize = 24,
  growSize = 28,
  animationDuration = 600,
  growDuration = 150,
  shrinkDelay = 300,
  containerSize = 28,
  className = '',
  style,
  onClick,
  disabled = false,
  initialState = false,
}: AnimatedIconToggleProps) {
  const [isToggled, setIsToggled] = useState(initialState);
  const [isAnimating, setIsAnimating] = useState(false);
  const [iconSize, setIconSize] = useState(baseSize);

  const handleClick = () => {
    if (isAnimating || disabled) return;

    setIsAnimating(true);

    // Phase 1: Grow
    setIconSize(growSize);

    setTimeout(() => {
      // Phase 2: Change icon (halfway through)
      const newToggleState = !isToggled;
      setIsToggled(newToggleState);
      onClick?.(newToggleState);
    }, growDuration);

    setTimeout(() => {
      // Phase 3: Shrink back
      setIconSize(baseSize);
    }, shrinkDelay);

    setTimeout(() => {
      // Animation complete
      setIsAnimating(false);
    }, animationDuration);
  };

  return (
    <div
      onClick={handleClick}
      className={`animated-icon-toggle ${disabled ? 'disabled' : ''} ${className}`}
      style={{
        width: containerSize,
        height: containerSize,
        ...style,
      }}
    >
      <Icon
        name={isToggled ? endIcon : startIcon}
        width={iconSize}
        height={iconSize}
        className="animated-icon-toggle__icon"
      />
    </div>
  );
}
