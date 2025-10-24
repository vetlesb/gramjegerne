import React from 'react';

export function NavigationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props} // Spread props to allow customization
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 22L12 17.9062L4 22L12 2L20 22ZM7.83887 17.7881L11.0889 16.126H12.9111L16.1602 17.7881L12 7.38672L7.83887 17.7881Z"
        fill="currentColor"
      />
    </svg>
  );
}
