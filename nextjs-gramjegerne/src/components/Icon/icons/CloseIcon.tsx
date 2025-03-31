import React from 'react';

export function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M10.5858 12L4.29289 18.2929L5.70711 19.7071L12 13.4142L18.2929 19.7071L19.7071 18.2929L13.4142 12L19.7071 5.70712L18.2929 4.29291L12 10.5858L5.70711 4.29291L4.29289 5.70712L10.5858 12Z"
        fill="currentColor"
      />
    </svg>
  );
}
