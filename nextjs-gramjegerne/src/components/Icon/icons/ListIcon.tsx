import React from 'react';

export function ListIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M5 18H3V16H5V18ZM21 18H7V16H21V18ZM5 13H3V11H5V13ZM21 13H7V11H21V13ZM5 8H3V6H5V8ZM21 8H7V6H21V8Z"
        fill="currentColor"
      />
    </svg>
  );
}
