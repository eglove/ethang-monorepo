import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import map from "lodash/map.js";

const projects = [
  {
    detail:
      "Built and maintained responsive web applications and RESTful web services for telecom members to manage user access to internet, telephone, and TV/streaming services. Java microservices with Spring Boot.",
    name: "Telecom provisioning platform",
    unstick: null
  },
  {
    detail:
      "Upgraded a vanilla React + Sitecore app to Next.js. The migration had been stalled for two months on hosting; shipped in a few weeks, then redesigned the user dashboard.",
    name: "Next.js migration off a legacy CMS",
    unstick:
      "Unstuck a Next.js migration that had been stalled for two months on hosting."
  },
  {
    detail:
      "Introduced end-to-end and component tests. React state bugs that hid from manual review surfaced in the first week.",
    name: "Automated testing for a legacy .NET + React codebase",
    unstick: "Surfaced React state bugs that had resisted manual review."
  },
  {
    detail:
      "Built features for a highly dynamic international farming dashboard. Used Redux time-travel debugging to understand existing state, then extend it.",
    name: "Farming dashboard with Redux time-travel",
    unstick: null
  },
  {
    detail:
      "One of three developers on the rewrite. Test coverage climbed until QA asked us to slow down; used the runway for better repros.",
    name: "Rebuild of a federal emissions monitoring system",
    unstick:
      "Shipped faster than QA could keep up; used the runway for more reproducible bug reports."
  },
  {
    detail:
      "Worked on a low-code platform that generated GraphQL APIs through a React UI.",
    name: "Low-code GraphQL platform",
    unstick: null
  },
  {
    detail:
      "Built a team collaboration app from scratch: P2P video, chat, phone, calendar, file sharing, websocket notifications. Solo, idea to working product.",
    name: "Team collaboration app: video, chat, calendar, files",
    unstick: null
  },
  {
    detail:
      "Delivered a quotes-and-booking app integrating FedEx, UPS, and other carriers.",
    name: "Multi-carrier shipping quotes and booking",
    unstick: null
  },
  {
    detail:
      "Redesigned a customer dashboard in vanilla JS. Kept compatibility with Internet Explorer 11.",
    name: "Customer dashboard redesign (IE11)",
    unstick: null
  },
  {
    detail:
      "SEO and performance consulting for a non-profit working to end dog homelessness, plus two national radio stations.",
    name: "Non-profit and radio SEO consulting",
    unstick: null
  },
  {
    detail:
      "Built a React Native ERP for a small local business. Greenfield app, then iterated with the owner.",
    name: "React Native ERP for a local small business",
    unstick: null
  },
  {
    detail:
      "Consulted on a real-time crypto pricing dashboard. Performance budgeted and met.",
    name: "Real-time crypto pricing dashboard",
    unstick: null
  },
  {
    detail:
      "Built and maintained a CMS-driven React site for a village trustee board.",
    name: "CMS-driven village trustee site",
    unstick: null
  },
  {
    detail:
      "TanStack Router, Radix Themes, Vitest. The page you are reading. Component-shaped tests, accessibility, calm typography.",
    name: "This home page (ethang-react)",
    unstick: null
  },
  {
    detail:
      "Cloudflare Workers, Hono, Drizzle ORM, D1. Authentication service used across the monorepo.",
    name: "Authentication service (auth)",
    unstick: null
  },
  {
    detail:
      "Cloudflare Workers RPC and Drizzle. Course tracking with structured lessons and progress.",
    name: "Course tracking (ethang-courses)",
    unstick: null
  },
  {
    detail:
      "Ingest feeds, dedupe, normalize, publish. Runs on the same worker stack as the rest of the monorepo.",
    name: "RSS pipeline (ethang-rss)",
    unstick: null
  },
  {
    detail:
      "TypeScript-defined skills, rules, and commands compiled into a checked-in .agents/ directory with sizing and drift checks. The compiler behind the skills used in this monorepo.",
    name: "Agent skills compiler (agents-build)",
    unstick: null
  }
] as const;

const Project = ({
  detail,
  name,
  unstick
}: {
  readonly detail: string;
  readonly name: string;
  readonly unstick: null | string;
}) => {
  return (
    <div data-project="">
      <Flex gap="1" direction="column">
        <Text as="p" size="3" data-name="" weight="bold">
          {name}
        </Text>
        <Text as="p" size="3">
          {detail}
        </Text>
        {null === unstick ? null : (
          <Text as="p" size="2" color="gray" data-unstick="">
            → {unstick}
          </Text>
        )}
      </Flex>
    </div>
  );
};

export const WhatIveShipped = () => {
  return (
    <Card data-testid="what-ive-shipped">
      <Flex gap="4" direction="column">
        <Heading as="h2" size="6" weight="bold">
          What I&rsquo;ve shipped
        </Heading>
        {map(projects, (project) => {
          return <Project key={project.name} {...project} />;
        })}
      </Flex>
    </Card>
  );
};
