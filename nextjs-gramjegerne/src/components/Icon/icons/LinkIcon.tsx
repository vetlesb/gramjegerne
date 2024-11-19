import React from "react";

export const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props} // Spread props to allow customization
  >
    <path
      d="M12.2266 15.4375C11.0781 15.3438 10.3594 14.9766 9.77344 14.3984C7.95312 12.5703 7.97656 10.0078 9.77344 8.21875L12.4375 5.54688C14.2266 3.75 16.7891 3.72656 18.6172 5.55469C20.4375 7.375 20.4141 9.9375 18.625 11.7344L16.1641 14.1875C16.25 13.7656 16.2109 13.3047 16.0469 12.9375L17.8828 11.1094C19.2891 9.69531 19.3047 7.6875 17.8906 6.27344C16.4922 4.86719 14.4766 4.88281 13.0625 6.29688L10.5156 8.83594C9.10156 10.2422 9.09375 12.2656 10.5 13.6797C11.1016 14.2812 11.875 14.6094 13.0469 14.6094L12.2266 15.4375ZM11.5469 9.15625C12.6953 9.25 13.4141 9.61719 14 10.1953C15.8203 12.0234 15.7969 14.5781 14 16.375L11.3359 19.0469C9.54688 20.8359 6.98438 20.8672 5.15625 19.0391C3.33594 17.2109 3.35938 14.6562 5.14844 12.8594L7.60938 10.4062C7.52344 10.8281 7.5625 11.2891 7.72656 11.6484L5.89062 13.4844C4.48438 14.8906 4.46875 16.9062 5.88281 18.3203C7.28125 19.7266 9.29688 19.7109 10.7109 18.2969L13.2578 15.7578C14.6719 14.3438 14.6797 12.3203 13.2734 10.9141C12.6719 10.3125 11.8984 9.98438 10.7266 9.97656L11.5469 9.15625Z"
      fill="#EAFFE2"
    />
  </svg>
);