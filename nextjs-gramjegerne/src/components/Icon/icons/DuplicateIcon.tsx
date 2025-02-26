import React from 'react';

export function DuplicateIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M8 5H19V16H21V4V3H20H8V5ZM6 9H15V19H6V9ZM4 7H6H15H17V9V19V21H15H6H4V19V9V7Z"
        fill="currentColor"
      />
    </svg>
  );
}
