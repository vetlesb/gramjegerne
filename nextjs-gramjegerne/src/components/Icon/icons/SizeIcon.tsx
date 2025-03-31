import React from 'react';

export function SizeIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M20.7782 4.2218V3.2218H19.7782H14.5355V5.2218L17.364 5.2218L12 10.5858L6.63602 5.22181L9.46444 5.22181L9.46444 3.22181L4.2218 3.22181L3.2218 3.22181V4.22181V9.46445L5.2218 9.46445L5.2218 6.63602L10.5858 12L5.22181 17.364L5.22181 14.5355H3.22181L3.22181 19.7782L3.22181 20.7782H4.22181H9.46445V18.7782L6.63602 18.7782L12 13.4142L17.3639 18.7782H14.5355V20.7782H19.7782H20.7782V19.7782V14.5355H18.7782L18.7782 17.364L13.4142 12L18.7782 6.63602L18.7782 9.46444L20.7782 9.46444V4.2218Z"
        fill="currentColor"
      />
    </svg>
  );
}
