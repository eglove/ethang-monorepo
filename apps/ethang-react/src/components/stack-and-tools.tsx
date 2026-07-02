import { Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";

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

const Column = ({
  items,
  title
}: {
  readonly items: readonly string[];
  readonly title: string;
}) => {
  return (
    <div data-column="">
      <Flex gap="1" direction="column">
        <Text size="2" as="span" color="gray" weight="bold">
          {title}
        </Text>
        <Text as="p" size="3">
          {items.join(", ")}
        </Text>
      </Flex>
    </div>
  );
};

export const StackAndTools = () => {
  return (
    <Card data-testid="stack-and-tools">
      <Flex gap="3" direction="column">
        <Heading as="h2" size="6" weight="bold">
          Stack & tools
        </Heading>
        <Grid gap="4" columns={{ initial: "1", sm: "3" }}>
          <Column items={languages} title="Languages & frameworks" />
          <Column items={stack} title="Stack & infrastructure" />
          <Column items={practices} title="Practices" />
        </Grid>
      </Flex>
    </Card>
  );
};
