import React from 'react';

export function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M7 4V2H9V4H15V2H17V4H18.9999H19H21V6V9V11V19V21H19H5H3V19V11V9V6V4H5H5.00006H7ZM19 6V9H5V6H19ZM19 11H5V19H19V11Z"
        fill="currentColor"
      />
    </svg>
  );
}
