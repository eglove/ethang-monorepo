import { AccordionStyled } from "./accordion-styled";

export default {
  title: "styled/accordion",
};

export const Default = () => {
  return (
    <AccordionStyled
      items={[
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
      ]}
      headingLevel="h1"
    />
  );
};
