import React from 'react';

export function DeleteIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M10 3H9V4H7H5H3V6H5V20L7 22H17L19 20V6H21V4H19H17H15V3H14H10ZM9 6H7V19.1716L7.82843 20H16.1716L17 19.1716V6H15H13H11H9ZM13 17V9H15V17H13ZM9 9V17H11V9H9Z"
        fill="currentColor"
      />
    </svg>
  );
}
