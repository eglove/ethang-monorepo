import type { PropsWithChildren } from "react";

import { TimeDisplay } from "./time-display.js";

type UpdateItemProperties = Readonly<
  PropsWithChildren<{
    date?: string;
  }>
>;

export const UpdateItem = ({ children, date }: UpdateItemProperties) => {
  if (date !== undefined) {
    return (
      <li>
        <TimeDisplay date={date} /> -{children}
      </li>
    );
  }

  return <li>{children}</li>;
};
