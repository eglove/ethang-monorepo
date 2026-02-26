type LinkedInSvgProperties = {
  height?: string;
  width?: string;
};

export const LinkedInSvg = async (properties: LinkedInSvgProperties) => {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      width={properties.width ?? 24}
      height={properties.height ?? 24}
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6 text-gray-800 dark:text-white"
    >
      <path
        clip-rule="evenodd"
        fill-rule="evenodd"
        d="M12.51 8.796v1.697a3.738 3.738 0 0 1 3.288-1.684c3.455 0 4.202 2.16 4.202 4.97V19.5h-3.2v-5.072c0-1.21-.244-2.766-2.128-2.766-1.827 0-2.139 1.317-2.139 2.676V19.5h-3.19V8.796h3.168ZM7.2 6.106a1.61 1.61 0 0 1-.988 1.483 1.595 1.595 0 0 1-1.743-.348A1.607 1.607 0 0 1 5.6 4.5a1.601 1.601 0 0 1 1.6 1.606Z"
      />
      <path d="M7.2 8.809H4V19.5h3.2V8.809Z" />
    </svg>
  );
};
