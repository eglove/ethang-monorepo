import type { PropsWithChildren, ReactNode } from "react";

import { TypographyMuted } from "@/components/typography/typography-muted.tsx";
import { TypographyP } from "@/components/typography/typography-p.tsx";
import { LoaderCircle } from "lucide-react";

type ErrorAndLoadingProperties = PropsWithChildren<{
  emptyPlaceholder?: ReactNode;
  error: Error | null;
  isEmpty?: () => boolean;
  isError: boolean;
  isLoading: boolean;
}>;

export const ContentHandler = ({
  children,
  emptyPlaceholder,
  error,
  isEmpty,
  isError,
  isLoading,
}: Readonly<ErrorAndLoadingProperties>) => {
  if (isLoading) {
    return <LoaderCircle className="mx-auto my-4 w-full animate-spin" />;
  }

  if (isError) {
    return (
      <TypographyP className="text-center">
        {error?.message ?? "Unknown Error"}
      </TypographyP>
    );
  }

  if (true === isEmpty?.()) {
    return (
      <TypographyMuted className="text-center">
        {emptyPlaceholder}
      </TypographyMuted>
    );
  }

  return children;
};
