type ArrowUpSvgProperties = {
  className?: string;
  height?: string;
  width?: string;
};

export const ArrowUpSvg = async (properties: ArrowUpSvgProperties) => {
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
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M5 10l7-7 7 7M12 3v18"
      />
    </svg>
  );
};
