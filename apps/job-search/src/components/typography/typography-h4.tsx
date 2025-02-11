import type { PropsWithChildren } from "react";

export const TypographyH4 = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
      {children}
    </h4>
  );
};
