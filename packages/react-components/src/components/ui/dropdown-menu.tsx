import type {
  ComponentProps,
  HTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";
import {
  CheckboxItem,
  Content,
  Group,
  Item,
  ItemIndicator,
  Label,
  Portal,
  RadioGroup,
  RadioItem,
  Root,
  Separator,
  Sub,
  SubContent,
  SubTrigger,
  Trigger,
} from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

const DropdownMenu = Root;

const DropdownMenuTrigger = Trigger;

const DropdownMenuGroup = Group;

const DropdownMenuPortal = Portal;

const DropdownMenuSub = Sub;

const DropdownMenuRadioGroup = RadioGroup;

const DropdownMenuSubTrigger = ({
  children,
  className,
  inset,
  ...properties
}: Readonly<{
  inset?: boolean;
} & ComponentProps<typeof SubTrigger>>) => {
  return (
    <SubTrigger
      className={
        cn(
          "flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-neutral-100 data-[state=open]:bg-neutral-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus:bg-neutral-800 dark:data-[state=open]:bg-neutral-800",
          true === inset && "pl-8",
          className,
        )
      }
      {...properties}
    >
      {children}
      <ChevronRight className="ml-auto" />
    </SubTrigger>
  );
};
DropdownMenuSubTrigger.displayName = SubTrigger.displayName;

const DropdownMenuSubContent = ({
  className,
  ...properties
}: Readonly<ComponentProps<typeof SubContent>>) => {
  return (
    <SubContent
      className={
        cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border border-neutral-200 bg-white p-1 text-neutral-950 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50",
          className,
        )
      }
      {...properties}
    />
  );
};
DropdownMenuSubContent.displayName = SubContent.displayName;

const DropdownMenuContent = ({
  className,
  sideOffset = 4,
  ...properties
}: Readonly<ComponentProps<typeof Content>>) => {
  return (
    <Portal>
      <Content
        className={
          cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border border-neutral-200 bg-white p-1 text-neutral-950 shadow-md dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className,
          )
        }
        sideOffset={sideOffset}
        {...properties}
      />
    </Portal>
  );
};
DropdownMenuContent.displayName = Content.displayName;

const DropdownMenuItem = ({ className, inset, ...properties }: Readonly<{
  inset?: boolean;
} & ComponentProps<typeof Item>>) => {
  return (
    <Item
      className={
        cn(
          "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-neutral-100 focus:text-neutral-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0 dark:focus:bg-neutral-800 dark:focus:text-neutral-50",
          true === inset && "pl-8",
          className,
        )
      }
      {...properties}
    />
  );
};
DropdownMenuItem.displayName = Item.displayName;

const DropdownMenuCheckboxItem = ({
  checked,
  children,
  className,
  ...properties
}: Readonly<ComponentProps<typeof CheckboxItem>>) => {
  return (
    <CheckboxItem
      className={
        cn(
          "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-neutral-100 focus:text-neutral-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-neutral-800 dark:focus:text-neutral-50",
          className,
        )
      }
      checked={checked ?? false}
      {...properties}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <ItemIndicator>
          <Check className="size-4" />
        </ItemIndicator>
      </span>
      {children}
    </CheckboxItem>
  );
};
DropdownMenuCheckboxItem.displayName =
    CheckboxItem.displayName;

const DropdownMenuRadioItem = ({
  children,
  className,
  ...properties
}: Readonly<ComponentProps<typeof RadioItem>>) => {
  return (
    <RadioItem
      className={
        cn(
          "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-neutral-100 focus:text-neutral-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-neutral-800 dark:focus:text-neutral-50",
          className,
        )
      }
      {...properties}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <ItemIndicator>
          <Circle className="size-2 fill-current" />
        </ItemIndicator>
      </span>
      {children}
    </RadioItem>
  );
};
DropdownMenuRadioItem.displayName = RadioItem.displayName;

const DropdownMenuLabel = ({ className, inset, ...properties }: Readonly<{
  inset?: boolean;
} & ComponentProps<typeof Label>>) => {
  return (
    <Label
      className={
        cn(
          "px-2 py-1.5 text-sm font-semibold",
          true === inset && "pl-8",
          className,
        )
      }
      {...properties}
    />
  );
};
DropdownMenuLabel.displayName = Label.displayName;

const DropdownMenuSeparator = ({
  className,
  ...properties
}: Readonly<ComponentProps<typeof Separator>>) => {
  return (
    <Separator
      className={cn("-mx-1 my-1 h-px bg-neutral-100 dark:bg-neutral-800", className)}
      {...properties}
    />
  );
};
DropdownMenuSeparator.displayName = Separator.displayName;

// eslint-disable-next-line react/prefer-read-only-props
const DropdownMenuShortcut = ({
  className,
  ...properties
}: HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...properties}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
