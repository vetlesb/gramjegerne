import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
}

export function RouteIcon({width = 24, height = 24, ...props}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6.5 2C7.52488 2 8.4041 2.61743 8.79004 3.5H15.75C18.3734 3.5 20.5 5.62665 20.5 8.25C20.5 10.8734 18.3734 13 15.75 13H7.75C6.23122 13 5 14.2312 5 15.75C5 17.2688 6.23122 18.5 7.75 18.5H15.21C15.5959 17.6174 16.4751 17 17.5 17C18.8807 17 20 18.1193 20 19.5C20 20.8807 18.8807 22 17.5 22C16.4751 22 15.5959 21.3826 15.21 20.5H7.75C5.12665 20.5 3 18.3734 3 15.75C3 13.1266 5.12665 11 7.75 11H15.75C17.2688 11 18.5 9.76878 18.5 8.25C18.5 6.73122 17.2688 5.5 15.75 5.5H8.79004C8.4041 6.38257 7.52488 7 6.5 7C5.11929 7 4 5.88071 4 4.5C4 3.11929 5.11929 2 6.5 2Z"
        fill="currentColor"
      />
    </svg>
  );
}
