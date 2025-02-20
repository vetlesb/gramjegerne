import React from 'react';

export function LeafIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M3.85156 8.47656C3.85156 8.05469 3.89844 6.73438 4.08594 5.99219C4.26562 5.23438 5.02344 5.26562 5.42188 5.72656C6.28906 6.71094 7.35156 7.11719 8.625 7.11719C10.0703 7.11719 11.3594 6.75781 12.6172 6.75781C16.2422 6.75781 18.8594 9.07031 18.8594 12.2891C18.8594 13.2109 18.6562 14.0547 18.2969 14.7969C19.0938 15.8281 20.1484 17.4766 20.1484 18.4844C20.1484 19.1328 19.7188 19.6484 19.1562 19.6484C18.8906 19.6484 18.6406 19.5156 18.5312 19.1484C18.1328 17.8906 17.9062 16.9141 17.4297 16.0703C16.3203 17.2812 14.6172 18 12.5859 18C7.28906 18 3.85156 14.2344 3.85156 8.47656ZM8.35938 10.2812C8.26562 10 8.57031 9.82812 8.76562 10.0938C9.64062 11.2188 10.875 11.625 12.5938 11.9609C14.875 12.3672 16.5 13.0078 17.625 14.0547C17.8281 13.5156 17.9453 12.9219 17.9453 12.2891C17.9453 9.59375 15.7344 7.67188 12.6172 7.67188C12.0859 7.67188 11.5234 7.74219 10.9062 7.82812C10.2188 7.92188 9.45312 8.03125 8.625 8.03125C7.40625 8.03125 6.00781 7.60156 5.07031 6.69531C4.96875 6.59375 4.89844 6.60156 4.875 6.74219C4.79688 7.21875 4.76562 7.82812 4.76562 8.47656C4.76562 13.7266 7.80469 17.0859 12.5859 17.0859C14.4375 17.0859 15.9531 16.4141 16.8906 15.2891C15.8125 13.9453 14.6094 13.3984 12.2891 12.8359C10.1328 12.2969 8.82031 11.6641 8.35938 10.2812Z"
        fill="currentColor"
      />
    </svg>
  );
}
