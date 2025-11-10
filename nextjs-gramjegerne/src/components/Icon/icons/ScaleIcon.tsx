import React from 'react';

export function ScaleIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M8 6H11V2H13V6H16V2H18V6H22V8H18V11H22V13H18V16H22V18H18V22H16V18H13V22H11V18H8V22H6V18H2V16H6V13H2V11H6V8H2V6H6V2H8V6ZM8 16H11V13H8V16ZM13 16H16V13H13V16ZM8 11H11V8H8V11ZM13 11H16V8H13V11Z"
        fill="currentColor"
      />
    </svg>
  );
}
