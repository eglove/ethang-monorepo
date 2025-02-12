import type { ComponentPropsWithoutRef, Ref } from "react";

import { cn } from "@/lib/utils";
import { Root as CheckboxPrimitive, Indicator } from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

type CheckboxProperties = Readonly<
  {
    ref?: Ref<HTMLButtonElement>;
  } & ComponentPropsWithoutRef<typeof CheckboxPrimitive>
>;

const Checkbox = ({ className, ref, ...properties }: CheckboxProperties) => (
  <CheckboxPrimitive
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className,
    )}
    ref={ref}
    {...properties}
  >
    <Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" />
    </Indicator>
  </CheckboxPrimitive>
);
Checkbox.displayName = CheckboxPrimitive.displayName;

export { Checkbox };
