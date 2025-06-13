import type { PropsWithChildren } from "react";

export const TypographyBlockquote = ({
  children,
}: Readonly<PropsWithChildren>) => {
  return (
    <blockquote className="mt-6 border-l-2 pl-6 italic">{children}</blockquote>
  );
};
