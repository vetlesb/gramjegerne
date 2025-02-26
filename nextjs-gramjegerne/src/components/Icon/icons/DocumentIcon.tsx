import React from 'react';

export function DocumentIcon(props: React.SVGProps<SVGSVGElement>) {
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
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M18 11V20H6V4H11V10V11H12H18ZM18 9V8.82843L13.1716 4H13V9H18ZM20 8L14 2H6H4V4V20V22H6H18H20V20V8Z"
        fill="currentColor"
      />
    </svg>
  );
}
