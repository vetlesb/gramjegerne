import React from 'react';

export function WeightIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M14 6C14 7.10457 13.1046 8 12 8C10.8954 8 10 7.10457 10 6C10 4.89543 10.8954 4 12 4C13.1046 4 14 4.89543 14 6ZM14.6458 9C15.4762 8.26706 16 7.19469 16 6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6C8 7.19469 8.52375 8.26706 9.35418 9H6L4.30769 20L4 22H6.02353H17.9765H20L19.6923 20L18 9H14.6458ZM6.33122 20L7.71584 11H16.2842L17.6688 20H6.33122Z"
        fill="currentColor"
      />
    </svg>
  );
}
