import React from 'react';

export function LeafIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M21 3H10.5858L4 9.58579V15.4142L5.58579 17L2.29289 20.2929L3.70711 21.7071L7.00001 18.4142L8.58579 20H14.4142L21 13.4142V3ZM8.41422 17L9.41421 18H13.5858L19 12.5858V5H11.4142L6 10.4142V14.5858L7.00001 15.5858L13.2929 9.29291L14.7071 10.7071L8.41422 17Z"
        fill="currentColor"
      />
    </svg>
  );
}
