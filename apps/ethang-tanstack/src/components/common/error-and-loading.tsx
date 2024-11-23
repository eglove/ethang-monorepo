import type { PropsWithChildren } from "react";

import { Spinner } from "@nextui-org/spinner";

type ErrorAndLoadingProperties = PropsWithChildren<{
  error: Error | null;
  isError: boolean;
  isLoading: boolean;
}>;

export const ErrorAndLoading = ({
  children,
  error,
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

  return children;
};
