import React from 'react';

export function CaloriesIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M15.9227 18.6334C15.9734 18.367 16 18.0915 16 17.8095C16 15.6795 14.7509 13.9625 13.3778 12.4531C13.0417 12.0836 12.6982 11.7266 12.3637 11.379L12.3636 11.3789C12.2409 11.2514 12.1195 11.1251 12 11C11.8806 11.1251 11.7591 11.2514 11.6364 11.3789L11.6364 11.3789C11.3019 11.7265 10.9583 12.0836 10.6222 12.4531C9.24913 13.9625 8 15.6795 8 17.8095C8 18.0915 8.0266 18.367 8.07729 18.6334C6.79269 17.588 6 16.0465 6 14.381C6 12.4048 6.84298 10.577 8.25492 8.73834C9.33089 7.3372 10.6382 6.04979 12 4.75526C13.3618 6.04979 14.6691 7.3372 15.7451 8.73834C17.157 10.577 18 12.4048 18 14.381C18 16.0465 17.2073 17.588 15.9227 18.6334ZM12 22C16.4183 22 20 18.5888 20 14.381C20 9.56023 16.1289 5.90284 12.7273 2.68896L12.7267 2.68844C12.4815 2.45675 12.2387 2.22736 12 2C11.7611 2.22753 11.5181 2.45709 11.2727 2.68896C7.87106 5.90284 4 9.56023 4 14.381C4 18.5888 7.58172 22 12 22ZM10 17.8095C10 19.108 10.9821 20 12 20C13.0179 20 14 19.108 14 17.8095C14 16.9403 13.6671 16.0996 13.0257 15.181C12.7206 14.7438 12.3754 14.3283 12 13.9111C11.6246 14.3283 11.2794 14.7438 10.9742 15.181C10.3329 16.0996 10 16.9403 10 17.8095Z"
        fill="currentColor"
      />
    </svg>
  );
}
