import React from "react";

export function WeightIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M4.10156 18.0625L5.85938 11.1016C6.14062 10 6.89844 9.38281 7.97656 9.38281H11.1016V8.52344C10.1562 8.30469 9.42969 7.44531 9.42969 6.4375C9.42969 5.26562 10.4141 4.28125 11.5859 4.28125C12.7578 4.28125 13.7422 5.25781 13.7422 6.4375C13.7422 7.44531 13.0156 8.30469 12.0703 8.52344V9.38281H15.1953C16.2734 9.38281 17.0312 10 17.3125 11.1016L19.0703 18.0625C19.4531 19.5859 18.8281 20.4375 17.3438 20.4375H5.82812C4.34375 20.4375 3.71875 19.5859 4.10156 18.0625ZM11.5859 7.72656C12.2969 7.72656 12.8906 7.14062 12.8906 6.4375C12.8906 5.72656 12.2969 5.13281 11.5859 5.13281C10.875 5.13281 10.2891 5.73438 10.2891 6.4375C10.2891 7.14844 10.875 7.72656 11.5859 7.72656ZM5.04688 18.1094C4.8125 19.0078 5.125 19.4766 5.92188 19.4766H17.25C18.0469 19.4766 18.3594 19.0078 18.125 18.1094L16.3984 11.4062C16.2188 10.6953 15.7969 10.3516 15.125 10.3516H8.04688C7.375 10.3516 6.95312 10.6953 6.77344 11.4062L5.04688 18.1094Z"
        className="icon-fill" />
    </svg>
  );
}
