import React from 'react';

export function CategoryIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M5 5H9V9H5V5ZM3 3H5H9H11V5V9V11H9H5H3V9V5V3ZM5 15H9V19H5V15ZM3 13H5H9H11V15V19V21H9H5H3V19V15V13ZM19 5H15V9H19V5ZM15 3H13V5V9V11H15H19H21V9V5V3H19H15ZM15 15H19V19H15V15ZM13 13H15H19H21V15V19V21H19H15H13V19V15V13Z"
        fill="currentColor"
      />
    </svg>
  );
}
