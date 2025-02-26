import React from 'react';

export function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M2 6H22V8L2 8V6ZM2 11L22 11V13L2 13V11ZM22 16L2 16V18L22 18V16Z"
        fill="currentColor"
      />
    </svg>
  );
}
