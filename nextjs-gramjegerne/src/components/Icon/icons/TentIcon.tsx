import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
}

export function TentIcon({width = 24, height = 24, ...props}: IconProps) {
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
        d="M14.8359 2.5L12.8818 5.88379L21.3203 20.5L19.5879 21.5L11.7266 7.88379L3.86621 21.5L2.13379 20.5L10.5723 5.88281L8.61914 2.5L10.3506 1.5L11.7266 3.88379L13.1035 1.5L14.8359 2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
