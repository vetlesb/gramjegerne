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
        d="M12 2C15.866 2 19 5.41126 19 9.61914L18.9883 10.0996C18.757 15.0265 15.0094 18.7245 12 22C8.99062 18.7245 5.243 15.0265 5.01172 10.0996L5 9.61914C5 5.41126 8.13401 2 12 2ZM12 4C9.39475 4 7 6.3529 7 9.61914C7.00002 11.6723 7.76642 13.5356 8.99512 15.3643C9.86438 16.6579 10.9066 17.8522 12 19.0479C13.0934 17.8522 14.1356 16.6579 15.0049 15.3643C16.2336 13.5356 17 11.6723 17 9.61914C17 6.3529 14.6052 4 12 4ZM12 6C13.6569 6 15 7.34315 15 9C15 10.6569 13.6569 12 12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6Z"
        fill="currentColor"
      />
    </svg>
  );
}
