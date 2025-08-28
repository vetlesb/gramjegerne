import React from 'react';

interface IconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const FishingIcon: React.FC<IconProps> = ({width = 24, height = 24, className = ''}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Placeholder circle - you'll replace this with fishing icon */}
      <circle cx="12" cy="12" r="10" fill="currentColor" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
};
