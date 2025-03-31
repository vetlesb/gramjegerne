import React from 'react';

export function EditIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M18.7929 3.79291L20.2929 2.29291L21.7071 3.70712L20.2071 5.20712L18.7929 3.79291ZM3 5.00001H4H15V7.00001H5V19H17V9.00001H19V20V21H18H4H3V20V6.00001V5.00001ZM18.2929 4.29291L8.79289 13.7929L10.2071 15.2071L19.7071 5.70712L18.2929 4.29291Z"
        fill="currentColor"
      />
    </svg>
  );
}
