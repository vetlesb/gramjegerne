import React from "react";

export function EllipsisIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M6.77344 13.7344C6.01562 13.7344 5.39844 13.1172 5.39844 12.3594C5.39844 11.5938 6.01562 10.9844 6.77344 10.9844C7.53906 10.9844 8.15625 11.5938 8.15625 12.3594C8.15625 13.1172 7.53906 13.7344 6.77344 13.7344ZM12.3438 13.7344C11.5781 13.7344 10.9609 13.1172 10.9609 12.3594C10.9609 11.5938 11.5781 10.9844 12.3438 10.9844C13.1016 10.9844 13.7188 11.5938 13.7188 12.3594C13.7188 13.1172 13.1016 13.7344 12.3438 13.7344ZM17.9062 13.7344C17.1406 13.7344 16.5312 13.1172 16.5312 12.3594C16.5312 11.5938 17.1406 10.9844 17.9062 10.9844C18.6641 10.9844 19.2812 11.5938 19.2812 12.3594C19.2812 13.1172 18.6641 13.7344 17.9062 13.7344Z"
        className="icon-fill" />
    </svg>
  );
}
