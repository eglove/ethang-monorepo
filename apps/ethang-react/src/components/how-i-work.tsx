// eslint-disable-next-line unicorn/name-replacements
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import map from "lodash/map.js";

const principles = [
  {
    body: "I write the failing test before the implementation. Red, green, refactor — every PR, every feature, every bug fix.",
    title: "Hypothesis-first."
  },
  {
    body: "Estimates and tradeoffs grounded in the SWEBOK software engineering body of knowledge.",
    title: "Grounded in SWEBOK."
  },
  {
    body: "I often promote Domain-Driven Design as the bridge between development and business understanding. The model is the conversation.",
    title: "Domain-Driven Design as the bridge."
  }
] as const;

export const HowIWork = () => {
  return (
    <Card data-testid="how-i-work">
      <Flex gap="3" direction="column">
        <Heading as="h2" size="6" weight="bold">
          How I work
        </Heading>
        {map(principles, (principle) => {
          return (
            <div data-principle="" key={principle.title}>
              <Text as="p" size="3" weight="bold">
                {principle.title}
              </Text>
              <Text as="p" size="3">
                {principle.body}
              </Text>
            </div>
          );
        })}
      </Flex>
    </Card>
  );
};
