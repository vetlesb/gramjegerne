import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
}

export function FishingIcon({width = 24, height = 24, ...props}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.88477 6.00977C12.3125 6.17206 15.0403 8.35368 17.4443 10.5547L21.6572 6.34277V17.6572L17.4443 13.4443C15.0402 15.6455 12.3127 17.8279 8.88477 17.9902L8.47656 18C4.89986 18 2 15.3137 2 12C2 8.68629 4.89986 6 8.47656 6L8.88477 6.00977ZM8.47656 8C5.85785 8 4 9.93195 4 12C4 14.068 5.85785 16 8.47656 16C10.1373 15.9999 11.6607 15.3759 13.1855 14.3428C14.1784 13.67 15.101 12.8738 16.0273 12.0273L16 12L16.0273 11.9717C15.1012 11.1254 14.1782 10.3298 13.1855 9.65723C11.6607 8.62406 10.1373 8.00009 8.47656 8Z"
        fill="currentColor"
      />
    </svg>
  );
}
