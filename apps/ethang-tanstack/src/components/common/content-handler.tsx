import type { PropsWithChildren, ReactNode } from "react";

import { Spinner } from "@nextui-org/spinner";

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
    return <Spinner className="mx-auto my-4 w-full" />;
  }

  if (isError) {
    return (
      <p className="text-center">
        {error?.message ?? "Unknown Error"}
      </p>
    );
  }

  if (true === isEmpty?.()) {
    return (<div className="text-center">
      {emptyPlaceholder}
    </div>);
  }

  return children;
};
