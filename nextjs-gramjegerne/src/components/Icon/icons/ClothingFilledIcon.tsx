import React from 'react';

export function ClothingFilledIcon({className, ...props}: React.SVGProps<SVGSVGElement>) {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.35112 4.06368L7.83822 3.87134L7.4 4.2L3.4 7.2L3 7.5V8V12V13.3874L4.31623 12.9487L6 12.3874V19V20H7H17H18V19V12.3874L19.6838 12.9487L21 13.3874V12V8V7.5L20.6 7.2L16.6 4.2L16.1618 3.87134L15.6489 4.06368L14.4579 4.51031C12.8732 5.10457 11.1268 5.10457 9.54214 4.51031L8.35112 4.06368Z"
        fill="currentColor"
      />
    </svg>
  );
}
