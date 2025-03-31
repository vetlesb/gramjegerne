import React from 'react';

export function BackpackIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M21 12V20L17.1429 22H6.85714L3 20V12V10V6V4H5H5.00006H7V2H9V4H15V2H17V4H18.9999H19H21V6V10V12ZM5 18.7842V12H8V15H10V12H14V15H16V12H19V18.7842L16.6552 20H7.34483L5 18.7842ZM19 6V10H5V6H19Z"
        fill="currentColor"
      />
    </svg>
  );
}
