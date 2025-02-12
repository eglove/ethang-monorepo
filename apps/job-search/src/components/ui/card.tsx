import type { ReferenceProperties } from "@/types/reference.ts";

import { cn } from "@/lib/utils";

const Card = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className,
    )}
    ref={ref}
    {...properties}
  />
);
Card.displayName = "Card";

const CardHeader = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    ref={ref}
    {...properties}
  />
);
CardHeader.displayName = "CardHeader";

const CardTitle = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLDivElement>) => (
  <div
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className,
    )}
    ref={ref}
    {...properties}
  />
);
CardTitle.displayName = "CardTitle";

const CardDescription = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLDivElement>) => (
  <div
    className={cn("text-sm text-muted-foreground", className)}
    ref={ref}
    {...properties}
  />
);
CardDescription.displayName = "CardDescription";

const CardContent = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} ref={ref} {...properties} />
);
CardContent.displayName = "CardContent";

const CardFooter = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLDivElement>) => (
  <div
    className={cn("flex items-center p-6 pt-0", className)}
    ref={ref}
    {...properties}
  />
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
