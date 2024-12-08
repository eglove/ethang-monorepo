/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import type { ComponentProps } from "react";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProperties = ComponentProps<typeof Sonner>;

const Toaster = ({ ...properties }: Readonly<ToasterProperties>) => {
  const { theme } = useTheme();

  return (
    <Sonner
      toastOptions={
        {
          classNames: {
            actionButton:
                        "group-[.toast]:bg-neutral-900 group-[.toast]:text-neutral-50 dark:group-[.toast]:bg-neutral-50 dark:group-[.toast]:text-neutral-900",
            cancelButton:
                        "group-[.toast]:bg-neutral-100 group-[.toast]:text-neutral-500 dark:group-[.toast]:bg-neutral-800 dark:group-[.toast]:text-neutral-400",
            description: "group-[.toast]:text-neutral-500 dark:group-[.toast]:text-neutral-400",
            toast:
                        "group toast group-[.toaster]:bg-white group-[.toaster]:text-neutral-950 group-[.toaster]:border-neutral-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-neutral-950 dark:group-[.toaster]:text-neutral-50 dark:group-[.toaster]:border-neutral-800",
          },
        }
      }
      className="toaster group"
      theme={theme as ToasterProperties["theme"] ?? "system"}
      {...properties}
    />
  );
};

export { Toaster };
