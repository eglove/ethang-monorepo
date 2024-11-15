import type { PropsWithChildren } from "react";

import { TimeDisplay } from "./time-display.js";

type UpdateItemProperties = {
  readonly date?: string | undefined;
} & Readonly<PropsWithChildren>;

export const UpdateItem = ({ children, date }: UpdateItemProperties) => {
  if (date !== undefined) {
    return (
      <li>
        <TimeDisplay date={date} />
        {" "}
        -
        {children}
      </li>
    );
  }

  return (
    <li>
      {children}
    </li>
  );
};
