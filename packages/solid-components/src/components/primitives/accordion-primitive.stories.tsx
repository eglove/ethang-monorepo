import { AccordionPrimitive } from "./accordion-primitive";

export default {
  title: "primitives/accordion-item",
};

export const Default = () => {
  return (
    <AccordionPrimitive
      items={
        [
          {
            content: "Content 1",
            heading: "Heading 1",
          },
          {
            content: "Content 2",
            heading: "Heading 2",
          },
          {
            content: "Content 3",
            heading: "Heading 3",
          },
        ]
      }
      headingLevel="h1"
    />
  );
};
