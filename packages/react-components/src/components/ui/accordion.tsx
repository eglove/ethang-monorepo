import type {
  ComponentProps,
} from "react";

import { cn } from "@/lib/utils";
import { Content, Header, Item, Root, Trigger } from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

const Accordion = Root;

const AccordionItem = ({
  className, ...properties
}: Readonly<ComponentProps<typeof Item>>) => {
  return (
    <Item
      className={cn("border-b", className)}
      {...properties}
    />
  );
};
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = ({
  children, className, ...properties
}: Readonly<ComponentProps<typeof Trigger>>) => {
  return (
    <Header className="flex">
      <Trigger
        className={
          cn(
            "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
            className,
          )
        }
        {...properties}
      >
        {children}
        <ChevronDown className="size-4 shrink-0 text-neutral-500 transition-transform duration-200 dark:text-neutral-400" />
      </Trigger>
    </Header>
  );
};
AccordionTrigger.displayName = Trigger.displayName;

const AccordionContent = ({
  children, className, ...properties
}: Readonly<ComponentProps<typeof Content>>) => {
  return (
    <Content
      className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...properties}
    >
      <div className={cn("pb-4 pt-0", className)}>
        {children}
      </div>
    </Content>
  );
};
AccordionContent.displayName = Content.displayName;

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
