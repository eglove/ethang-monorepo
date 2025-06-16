import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

export const useRenderBorder = (dependencies: unknown[]) => {
  const [hasBorder, setHasBorder] = useState(false);

  useEffect(() => {
    setHasBorder(true);

    const timeout = setTimeout(() => {
      setHasBorder(false);
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, dependencies);

  return twMerge(
    "border-2 border-transparent",
    hasBorder && "border-yellow-200",
  );
};
