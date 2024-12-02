import {
  AccordionPrimitive,
  type AccordionPrimitiveProperties,
} from "../primitives/accordion-primitive";

export const AccordionStyled = (properties: AccordionPrimitiveProperties) => {
  return (
    <AccordionPrimitive
      {...properties}
      classNames={{
        contentInner: "pb-4 pt-0",
        contentOuter: "overflow-hidden text-sm",
        heading: "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left",
        innerContainer: "border-b",
      }}
    />
  );
};
