import { cn } from "@/lib/utils";
import { Close, Content, Description, Overlay, Portal, Root, Title, Trigger } from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
  type HTMLAttributes,
} from "react";

const Dialog = Root;

const DialogTrigger = Trigger;

const DialogPortal = Portal;

const DialogClose = Close;

const DialogOverlay = forwardRef<
  ElementRef<typeof Overlay>,
  Readonly<ComponentPropsWithoutRef<typeof Overlay>>
>(({ className, ...properties }, reference) => {
  return (
    <Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      ref={reference}
      {...properties}
    />
  );
});
DialogOverlay.displayName = Overlay.displayName;

const DialogContent = forwardRef<
  ElementRef<typeof Content>,
  Readonly<ComponentPropsWithoutRef<typeof Content>>
>(({ children, className, ...properties }, reference) => {
  return (
    <DialogPortal>
      <DialogOverlay />
      <Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-neutral-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:border-neutral-800 dark:bg-neutral-950",
          className,
        )}
        ref={reference}
        {...properties}
      >
        {children}
        <Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-500 dark:ring-offset-neutral-950 dark:focus:ring-neutral-300 dark:data-[state=open]:bg-neutral-800 dark:data-[state=open]:text-neutral-400">
          <X className="size-4" />
          <span className="sr-only">
            Close
          </span>
        </Close>
      </Content>
    </DialogPortal>
  );
});
DialogContent.displayName = Content.displayName;

const DialogHeader = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLDivElement>>) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className,
      )}
      {...properties}
    />
  );
};
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
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
DialogFooter.displayName = "DialogFooter";

const DialogTitle = forwardRef<
  ElementRef<typeof Title>,
  Readonly<ComponentPropsWithoutRef<typeof Title>>
>(({ className, ...properties }, reference) => {
  return (
    <Title
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className,
      )}
      ref={reference}
      {...properties}
    />
  );
});
DialogTitle.displayName = Title.displayName;

const DialogDescription = forwardRef<
  ElementRef<typeof Description>,
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
DialogDescription.displayName = Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
