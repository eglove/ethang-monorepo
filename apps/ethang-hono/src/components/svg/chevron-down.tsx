type ChevronDownSvgProperties = {
  className?: string;
  height?: string;
  width?: string;
};

export const ChevronDownSvg = async (properties: ChevronDownSvgProperties) => {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={properties.className}
      width={properties.width ?? "24"}
      height={properties.height ?? "24"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke-width="2"
        d="M19 9l-7 7-7-7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};
