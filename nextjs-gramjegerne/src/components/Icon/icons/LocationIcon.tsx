import React from 'react';

export function LocationIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M13 4.06348C16.6169 4.51459 19.4822 7.37888 19.9355 10.9951H22.0049V12.9951H19.9365C19.4872 16.6159 16.6201 19.484 13 19.9355V22H11V19.9355C7.37989 19.484 4.51285 16.6159 4.06348 12.9951H2.00488V10.9951H4.06445C4.51776 7.37888 7.38308 4.51459 11 4.06348V2H13V4.06348ZM12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6ZM12 9C13.6569 9 15 10.3431 15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9Z"
        fill="currentColor"
      />
    </svg>
  );
}
