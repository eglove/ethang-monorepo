import { Card, Heading, Text, VStack } from "@astryxdesign/core";
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
      <VStack gap={3}>
        <Heading level={2}>How I work</Heading>
        {map(principles, (principle) => {
          return (
            <div data-principle="" key={principle.title}>
              <Text as="p" weight="bold">
                {principle.title}
              </Text>{" "}
              <Text as="p">{principle.body}</Text>
            </div>
          );
        })}
      </VStack>
    </Card>
  );
};
