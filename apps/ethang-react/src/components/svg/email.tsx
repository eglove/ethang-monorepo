import type { SVGProps } from "react";

export const EmailSvg = (properties: Readonly<SVGProps<SVGSVGElement>>) => {
  return (
    <svg
      fill="none"
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      width={properties.width ?? 24}
      height={properties.height ?? 24}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeWidth="2"
        stroke="currentColor"
        strokeLinecap="round"
        d="m3.5 5.5 7.893 6.036a1 1 0 0 0 1.214 0L20.5 5.5M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
      />
    </svg>
  );
};
