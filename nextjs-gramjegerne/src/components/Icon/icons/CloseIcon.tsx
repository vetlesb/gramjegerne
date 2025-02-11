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
        d="M5.14844 18.2969C4.9375 18.0938 4.94531 17.7578 5.14844 17.5547L10.3281 12.375L5.14844 7.19531C4.94531 6.99219 4.94531 6.65625 5.14844 6.44531C5.35156 6.23438 5.69531 6.24219 5.89844 6.44531L11.0781 11.625L16.25 6.44531C16.4531 6.24219 16.7891 6.24219 17 6.44531C17.2109 6.64844 17.2031 6.99219 17 7.19531L11.8203 12.375L17 17.5547C17.2031 17.7578 17.2031 18.0938 17 18.2969C16.7969 18.5078 16.4531 18.5078 16.25 18.2969L11.0781 13.125L5.89844 18.2969C5.69531 18.5078 5.35938 18.5078 5.14844 18.2969Z"
        className="icon-fill"
      />
    </svg>
  );
}
