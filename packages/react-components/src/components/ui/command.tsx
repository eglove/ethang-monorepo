/* eslint-disable react/dom/no-unknown-property */
"use client";

import type { DialogProps } from "@radix-ui/react-dialog";
import type {
  ComponentProps,
  HTMLAttributes,
} from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

const Command = ({
  className, ...properties
}: Readonly<ComponentProps<typeof CommandPrimitive>>) => {
  return (
    <CommandPrimitive
      className={
        cn(
          "flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50",
          className,
        )
      }
      {...properties}
    />
  );
};
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...properties }: Readonly<DialogProps>) => {
  return (
    <Dialog {...properties}>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-neutral-500 dark:[&_[cmdk-group-heading]]:text-neutral-400 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:size-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = ({
  className, ...properties
}: Readonly<ComponentProps<typeof CommandPrimitive.Input>>) => {
  return (
    <div
      className="flex items-center border-b px-3"
      cmdk-input-wrapper=""
    >
      <Search className="mr-2 size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        className={
          cn(
            "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-neutral-400",
            className,
          )
        }
        {...properties}
      />
    </div>
  );
};

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = ({
  className, ...properties
}: Readonly<ComponentProps<typeof CommandPrimitive.List>>) => {
  return (
    <CommandPrimitive.List
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...properties}
    />
  );
};

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = (
  properties: Readonly<ComponentProps<typeof CommandPrimitive.Empty>>,
) => {
  return (
    <CommandPrimitive.Empty
      className="py-6 text-center text-sm"
      {...properties}
    />
  );
};

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = ({
  className, ...properties
}: Readonly<ComponentProps<typeof CommandPrimitive.Group>>) => {
  return (
    <CommandPrimitive.Group
      className={
        cn(
          "overflow-hidden p-1 text-neutral-950 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-neutral-500 dark:text-neutral-50 dark:[&_[cmdk-group-heading]]:text-neutral-400",
          className,
        )
      }
      {...properties}
    />
  );
};

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = ({
  className, ...properties
}: Readonly<ComponentProps<typeof CommandPrimitive.Separator>>) => {
  return (
    <CommandPrimitive.Separator
      className={cn("-mx-1 h-px bg-neutral-200 dark:bg-neutral-800", className)}
      {...properties}
    />
  );
};
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = ({
  className, ...properties
}: Readonly<ComponentProps<typeof CommandPrimitive.Item>>) => {
  return (
    <CommandPrimitive.Item
      className={
        cn(
          "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-neutral-100 data-[selected=true]:text-neutral-900 data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:data-[selected=true]:bg-neutral-800 dark:data-[selected=true]:text-neutral-50",
          className,
        )
      }
      {...properties}
    />
  );
};

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLSpanElement>>) => {
  return (
    <span
      className={
        cn(
          "ml-auto text-xs tracking-widest text-neutral-500 dark:text-neutral-400",
          className,
        )
      }
      {...properties}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
