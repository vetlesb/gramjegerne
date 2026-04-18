import React from 'react';

export function SnowflakeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11 1V5.07L7.71 1.78L6.29 3.2L11 7.91V11H7.91L3.2 6.29L1.78 7.71L5.07 11H1V13H5.07L1.78 16.29L3.2 17.71L7.91 13H11V16.09L6.29 20.8L7.71 22.22L11 18.93V23H13V18.93L16.29 22.22L17.71 20.8L13 16.09V13H16.09L20.8 17.71L22.22 16.29L18.93 13H23V11H18.93L22.22 7.71L20.8 6.29L16.09 11H13V7.91L17.71 3.2L16.29 1.78L13 5.07V1H11Z"
        fill="currentColor"
      />
    </svg>
  );
}
