import type { PropsWithChildren } from "react";

import { twMerge } from "tailwind-merge";

type ContainerProperties = {
  readonly styleNames?: string;
} & Readonly<PropsWithChildren>;

export const containerClass =
  "max-w-7xl mx-auto my-4 grid place-items-center gap-4 rounded-lg bg-gray-50 p-4 shadow-sm shadow-sky-50";

export const Container = ({ children, styleNames }: ContainerProperties) => {
  return (
    <div className={twMerge(containerClass, styleNames)}>
      {children}
    </div>
  );
};
