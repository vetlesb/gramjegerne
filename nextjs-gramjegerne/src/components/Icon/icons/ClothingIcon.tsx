import React from 'react';

export function ClothingIcon({className, ...props}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props} // Spread props to allow customization
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.83822 3.87134L9.54214 4.51031C11.1268 5.10457 12.8732 5.10457 14.4579 4.51031L16.1618 3.87134L21 7.5V13.3874L18 12.3874V20H6V12.3874L3 13.3874V7.5L7.83822 3.87134ZM8.16178 6.12867L5 8.5V10.6126L8 9.61258V18H16V9.61258L19 10.6126V8.50001L15.8382 6.12867L15.1601 6.38296C13.1226 7.14701 10.8774 7.14701 8.83989 6.38296L8.16178 6.12867Z"
        fill="currentColor"
      />
    </svg>
  );
}
