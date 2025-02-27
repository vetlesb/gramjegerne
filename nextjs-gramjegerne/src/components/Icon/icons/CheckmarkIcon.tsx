import React from 'react';

export function CheckmarkIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M10.2991 16.7324L18.8984 6.20184L20.4476 7.46685L11.1998 18.7915L10.5514 19.5856L9.77371 18.9176L4.00412 13.9621L5.30724 12.4449L10.2991 16.7324Z"
        fill="currentColor"
      />
    </svg>
  );
}
