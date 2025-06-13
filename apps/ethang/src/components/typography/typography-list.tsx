import type { PropsWithChildren } from "react";

export const TypographyList = ({ children }: Readonly<PropsWithChildren>) => {
  return <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>;
};

export const TypographyOrderedList = ({
  children,
}: Readonly<PropsWithChildren>) => {
  return <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>;
};
