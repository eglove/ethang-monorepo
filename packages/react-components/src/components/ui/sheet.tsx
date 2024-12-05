"use client";

import { cn } from "@/lib/utils";
import { Close, Content, Description, Overlay, Portal, Root, Title, Trigger } from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
} from "react";

const Sheet = Root;

const SheetTrigger = Trigger;

const SheetClose = Close;

const SheetPortal = Portal;

const SheetOverlay = forwardRef<
  Readonly<ComponentRef<typeof Overlay>>,
  Readonly<ComponentPropsWithoutRef<typeof Overlay>>
>(({ className, ...properties }, reference) => {
  return (
    <Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...properties}
      ref={reference}
    />
  );
});
SheetOverlay.displayName = Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-white p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out dark:bg-neutral-950",
  {
    defaultVariants: {
      side: "right",
    },
    variants: {
      side: {
        bottom:
                    "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
                    "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
      },
    },
  },
);

// eslint-disable-next-line sonar/no-useless-intersection
type SheetContentProperties = {}
  & ComponentPropsWithoutRef<typeof Content>
  & VariantProps<typeof sheetVariants>;

const SheetContent = forwardRef<
  Readonly<ComponentRef<typeof Content>>,
  Readonly<SheetContentProperties>
>(({ children, className, side = "right", ...properties }, reference) => {
  return (
    <SheetPortal>
      <SheetOverlay />
      <Content
        className={cn(sheetVariants({ side }), className)}
        ref={reference}
        {...properties}
      >
        <Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-neutral-100 dark:ring-offset-neutral-950 dark:focus:ring-neutral-300 dark:data-[state=open]:bg-neutral-800">
          <X className="size-4" />
          <span className="sr-only">
            Close
          </span>
        </Close>
        {children}
      </Content>
    </SheetPortal>
  );
});
SheetContent.displayName = Content.displayName;

const SheetHeader = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLDivElement>>) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className,
      )}
      {...properties}
    />
  );
};
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLDivElement>>) => {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className,
      )}
      {...properties}
    />
  );
};
SheetFooter.displayName = "SheetFooter";

const SheetTitle = forwardRef<
  Readonly<ComponentRef<typeof Title>>,
  Readonly<ComponentPropsWithoutRef<typeof Title>>
>(({ className, ...properties }, reference) => {
  return (
    <Title
      className={cn("text-lg font-semibold text-neutral-950 dark:text-neutral-50", className)}
      ref={reference}
      {...properties}
    />
  );
});
SheetTitle.displayName = Title.displayName;

const SheetDescription = forwardRef<
  Readonly<ComponentRef<typeof Description>>,
  Readonly<ComponentPropsWithoutRef<typeof Description>>
>(({ className, ...properties }, reference) => {
  return (
    <Description
      className={cn("text-sm text-neutral-500 dark:text-neutral-400", className)}
      ref={reference}
      {...properties}
    />
  );
});
SheetDescription.displayName = Description.displayName;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
