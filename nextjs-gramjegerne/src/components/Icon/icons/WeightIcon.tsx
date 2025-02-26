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
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6ZM13 7.82929C14.1652 7.41746 15 6.30622 15 5C15 3.34315 13.6569 2 12 2C10.3431 2 9 3.34315 9 5C9 6.30622 9.83481 7.41746 11 7.82929V9H7L4.46154 20L4 22H6.05256H17.9474H20L19.5385 20L17 9H13V7.82929ZM8.59103 11L6.5141 20H17.4859L15.409 11H8.59103Z"
        fill="currentColor"
      />
    </svg>
  );
}
