import type { PropsWithChildren } from "react";

import isNil from "lodash/isNil.js";

import { TimeDisplay } from "./time-display.js";

type UpdateItemProperties = Readonly<
  PropsWithChildren<{
    date?: string;
  }>
>;

export const UpdateItem = ({ children, date }: UpdateItemProperties) => {
  if (!isNil(date)) {
    return (
      <li>
        <TimeDisplay date={date} /> -{children}
      </li>
    );
  }

  return <li>{children}</li>;
};
