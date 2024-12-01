import { cn } from "@/lib/utils";
import { Action, Close, Description, Provider, Root, Title, Viewport } from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
  type ReactElement,
} from "react";

const ToastProvider = Provider;

const ToastViewport = forwardRef<
  ElementRef<typeof Viewport>,
  Readonly<ComponentPropsWithoutRef<typeof Viewport>>
>(({ className, ...properties }, reference) => {
  return (
    <Viewport
      className={cn(
        "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
        className,
      )}
      ref={reference}
      {...properties}
    />
  );
});
ToastViewport.displayName = Viewport.displayName;

// eslint-disable-next-line tailwind/no-arbitrary-value
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border border-neutral-200 p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full dark:border-neutral-800 data-[state=open]:sm:slide-in-from-bottom-full",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "border bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50",
        destructive:
          "destructive group border-red-500 bg-red-500 text-neutral-50 dark:border-red-900 dark:bg-red-900 dark:text-neutral-50",
      },
    },
  },
);

const Toast = forwardRef<
  ElementRef<typeof Root>,
  Readonly<ComponentPropsWithoutRef<typeof Root> &
  VariantProps<typeof toastVariants>>
>(({ className, variant, ...properties }, reference) => {
  return (
    <Root
      className={cn(toastVariants({ variant }), className)}
      ref={reference}
      {...properties}
    />
  );
});
Toast.displayName = Root.displayName;

const ToastAction = forwardRef<
  ElementRef<typeof Action>,
  Readonly<ComponentPropsWithoutRef<typeof Action>>
>(({ className, ...properties }, reference) => {
  return (
    <Action
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-transparent px-3 text-sm font-medium transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-neutral-100/40 group-[.destructive]:hover:border-red-500/30 group-[.destructive]:hover:bg-red-500 group-[.destructive]:hover:text-neutral-50 group-[.destructive]:focus:ring-red-500 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:focus:ring-neutral-300 dark:group-[.destructive]:border-neutral-800/40 dark:group-[.destructive]:hover:border-red-900/30 dark:group-[.destructive]:hover:bg-red-900 dark:group-[.destructive]:hover:text-neutral-50 dark:group-[.destructive]:focus:ring-red-900",
        className,
      )}
      ref={reference}
      {...properties}
    />
  );
});
ToastAction.displayName = Action.displayName;

const ToastClose = forwardRef<
  ElementRef<typeof Close>,
  Readonly<ComponentPropsWithoutRef<typeof Close>>
>(({ className, ...properties }, reference) => {
  return (
    <Close
      className={cn(
        "absolute right-1 top-1 rounded-md p-1 text-neutral-950/50 opacity-0 transition-opacity hover:text-neutral-950 focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 dark:text-neutral-50/50 dark:hover:text-neutral-50",
        className,
      )}
      ref={reference}
      toast-close=""
      {...properties}
    >
      <X className="size-4" />
    </Close>
  );
});
ToastClose.displayName = Close.displayName;

const ToastTitle = forwardRef<
  ElementRef<typeof Title>,
  Readonly<ComponentPropsWithoutRef<typeof Title>>
>(({ className, ...properties }, reference) => {
  return (
    <Title
      className={cn("text-sm font-semibold [&+div]:text-xs", className)}
      ref={reference}
      {...properties}
    />
  );
});
ToastTitle.displayName = Title.displayName;

const ToastDescription = forwardRef<
  ElementRef<typeof Description>,
  Readonly<ComponentPropsWithoutRef<typeof Description>>
>(({ className, ...properties }, reference) => {
  return (
    <Description
      className={cn("text-sm opacity-90", className)}
      ref={reference}
      {...properties}
    />
  );
});
ToastDescription.displayName = Description.displayName;

type ToastActionElement = ReactElement<typeof ToastAction>;

type ToastProperties = ComponentPropsWithoutRef<typeof Toast>;

export {
  Toast,
  ToastAction,
  type ToastActionElement,
  ToastClose,
  ToastDescription,
  type ToastProperties as ToastProps,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};
