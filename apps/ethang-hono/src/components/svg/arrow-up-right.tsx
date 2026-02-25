type ArrowUpRightSvgProperties = {
  height?: string;
  width?: string;
};

export const ArrowUpRightSvg = async (
  properties: ArrowUpRightSvgProperties,
) => {
  return (
    <svg
      fill="none"
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={properties.width ?? "24"}
      height={properties.height ?? "24"}
      xmlns="http://www.w3.org/2000/svg"
      class="w-6 h-6 text-gray-800 dark:text-white"
    >
      <path
        stroke-width="2"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M18 14v4.833A1.166 1.166 0 0 1 16.833 20H5.167A1.167 1.167 0 0 1 4 18.833V7.167A1.166 1.166 0 0 1 5.167 6h4.618m4.447-2H20v5.768m-7.889 2.121 7.778-7.778"
      />
    </svg>
  );
};
