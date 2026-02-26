type EmailSvgProperties = {
  height?: string;
  width?: string;
};

export const EmailSvg = async (properties: EmailSvgProperties) => {
  return (
    <svg
      fill="none"
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={properties.width ?? 24}
      height={properties.height ?? 24}
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6 text-gray-800 dark:text-white"
    >
      <path
        stroke-width="2"
        stroke="currentColor"
        stroke-linecap="round"
        d="m3.5 5.5 7.893 6.036a1 1 0 0 0 1.214 0L20.5 5.5M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
      />
    </svg>
  );
};
