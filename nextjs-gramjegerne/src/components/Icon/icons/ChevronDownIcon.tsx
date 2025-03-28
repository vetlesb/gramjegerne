import React from 'react';

export function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M11.5 16.2891C11.3359 16.2891 11.2031 16.2188 11.0781 16.1016L5.15625 9.86719C5.05469 9.75781 4.99219 9.63281 4.99219 9.47656C4.99219 9.17188 5.22656 8.9375 5.53125 8.9375C5.67969 8.9375 5.82031 8.99219 5.91406 9.09375L11.5078 14.9688L17.0859 9.09375C17.1875 8.99219 17.3359 8.9375 17.4766 8.9375C17.7812 8.9375 18.0156 9.17188 18.0156 9.47656C18.0156 9.63281 17.9531 9.75781 17.8516 9.85938L11.9297 16.0938C11.8125 16.2188 11.6641 16.2891 11.5 16.2891Z"
        fill="currentColor"
      />
    </svg>
  );
}
