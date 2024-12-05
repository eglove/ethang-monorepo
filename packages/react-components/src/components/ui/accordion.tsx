import { cn } from "@/lib/utils";
import { Content, Header, Item, Root, Trigger } from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";

const Accordion = Root;

const AccordionItem = forwardRef<
  ComponentRef<typeof Item>,
  Readonly<ComponentPropsWithoutRef<typeof Item>>
>(({ className, ...properties }, reference) => {
  return (
    <Item
      className={cn("border-b", className)}
      ref={reference}
      {...properties}
    />
  );
});
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = forwardRef<
  ComponentRef<typeof Trigger>,
  Readonly<ComponentPropsWithoutRef<typeof Trigger>>
>(({ children, className, ...properties }, reference) => {
  return (
    <Header className="flex">
      <Trigger
        className={cn(
          "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        ref={reference}
        {...properties}
      >
        {children}
        <ChevronDown className="size-4 shrink-0 text-neutral-500 transition-transform duration-200 dark:text-neutral-400" />
      </Trigger>
    </Header>
  );
});
AccordionTrigger.displayName = Trigger.displayName;

const AccordionContent = forwardRef<
  ComponentRef<typeof Content>,
  Readonly<ComponentPropsWithoutRef<typeof Content>>
>(({ children, className, ...properties }, reference) => {
  return (
    <Content
      className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      ref={reference}
      {...properties}
    >
      <div className={cn("pb-4 pt-0", className)}>
        {children}
      </div>
    </Content>
  );
});
AccordionContent.displayName = Content.displayName;

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
