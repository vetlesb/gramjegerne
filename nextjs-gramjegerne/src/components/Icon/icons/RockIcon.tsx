import React from 'react';

export function RockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.5 3L20.5 10L22 20H2L5 13L9.5 6L14.5 3ZM13.5 5.5L10.5 7.5L6.5 13.5L4.5 18H19.5L18.5 11L13.5 5.5ZM13 9L16 13H10L8 16H6.5L9 12L11 8.5L13 9Z"
        fill="currentColor"
      />
    </svg>
  );
}
