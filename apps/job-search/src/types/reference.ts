import type { HTMLAttributes, RefObject } from "react";

export type ReferenceProperties<T> = Readonly<
  {
    ref?: RefObject<null | T>;
  } & HTMLAttributes<T>
>;
