import { Card, Grid, Heading, Text, VStack } from "@astryxdesign/core";

const languages = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "React Native",
  "Solid",
  "Node.js",
  "C#/.NET",
  "Python",
  "SQL"
] as const;

const stack = [
  "TanStack Router",
  "TanStack Query",
  "Radix Themes",
  "Tailwind",
  "Sanity (CMS)",
  "Cloudflare Workers",
  "Hono",
  "Drizzle ORM",
  "D1 (SQLite)",
  "React Query",
  "Redux",
  "GraphQL",
  "REST",
  "WebSockets",
  "Spring Boot",
  "Microservices"
] as const;

const practices = [
  "TDD (vitest, Playwright)",
  "DDD",
  "Monorepo",
  "Effect-TS",
  "Lodash",
  "Dependency injection",
  "Composable design",
  "Accessibility",
  "SEO",
  "Performance budgeting",
  "Container-driven development",
  "Legacy migrations"
] as const;

const listFormatter = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction"
});

const Column = ({
  items,
  title
}: {
  readonly items: readonly string[];
  readonly title: string;
}) => {
  return (
    <div data-column="">
      <VStack gap={1}>
        <Text as="span" weight="bold">
          {title}
        </Text>
        <Text as="p">{listFormatter.format(items)}</Text>
      </VStack>
    </div>
  );
};

export const StackAndTools = () => {
  return (
    <Card data-testid="stack-and-tools">
      <VStack gap={3}>
        <Heading level={2}>Stack & tools</Heading>
        <Grid gap={4} columns={{ minWidth: 280 }}>
          <Column items={languages} title="Languages & frameworks" />
          <Column items={stack} title="Stack & infrastructure" />
          <Column items={practices} title="Practices" />
        </Grid>
      </VStack>
    </Card>
  );
};
