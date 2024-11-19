import React from "react";

export const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props} // Spread props to allow customization
  >
    <path
      d="M8.27344 20.6953C6.76562 20.6953 5.99219 19.9141 5.99219 18.3906V6.34375C5.99219 4.82031 6.77344 4.04688 8.27344 4.04688H12.0234C12.7812 4.04688 13.1875 4.16406 13.6875 4.67188L18.2812 9.3125C18.7969 9.84375 18.9062 10.2188 18.9062 11.0625V18.3906C18.9062 19.9141 18.1406 20.6953 16.625 20.6953H8.27344ZM8.32031 19.7266H16.5781C17.4766 19.7266 17.9453 19.25 17.9453 18.3672V11.0234H13.2969C12.4297 11.0234 11.9766 10.6016 11.9766 9.71094V5.00781H8.32812C7.42188 5.00781 6.96094 5.50781 6.96094 6.36719V18.3672C6.96094 19.25 7.42188 19.7266 8.32031 19.7266ZM13.3984 10.1094H17.75L12.8906 5.20312V9.60938C12.8906 9.96875 13.0391 10.1094 13.3984 10.1094Z"
      fill="#EAFFE2"
    />
  </svg>
);