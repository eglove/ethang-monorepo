import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import { home } from "../constants/home.ts";

type Project = {
  readonly detail: string;
  readonly name: string;
  readonly unstick: null | string;
};

const clientProjects: readonly Project[] = [
  {
    detail: home.CLIENT_PROJECTS.TELECOM.DETAIL,
    name: home.CLIENT_PROJECTS.TELECOM.NAME,
    unstick: null
  },
  {
    detail: home.CLIENT_PROJECTS.NEXT_JS_MIGRATION.DETAIL,
    name: home.CLIENT_PROJECTS.NEXT_JS_MIGRATION.NAME,
    unstick: home.CLIENT_PROJECTS.NEXT_JS_MIGRATION.UNSTICK
  },
  {
    detail: home.CLIENT_PROJECTS.AUTOMATED_TESTING.DETAIL,
    name: home.CLIENT_PROJECTS.AUTOMATED_TESTING.NAME,
    unstick: home.CLIENT_PROJECTS.AUTOMATED_TESTING.UNSTICK
  },
  {
    detail: home.CLIENT_PROJECTS.FARMING_DASHBOARD.DETAIL,
    name: home.CLIENT_PROJECTS.FARMING_DASHBOARD.NAME,
    unstick: null
  },
  {
    detail: home.CLIENT_PROJECTS.FEDERAL_EMISSIONS.DETAIL,
    name: home.CLIENT_PROJECTS.FEDERAL_EMISSIONS.NAME,
    unstick: home.CLIENT_PROJECTS.FEDERAL_EMISSIONS.UNSTICK
  },
  {
    detail: home.CLIENT_PROJECTS.LOW_CODE_GRAPHQL.DETAIL,
    name: home.CLIENT_PROJECTS.LOW_CODE_GRAPHQL.NAME,
    unstick: null
  },
  {
    detail: home.CLIENT_PROJECTS.COLLABORATION_APP.DETAIL,
    name: home.CLIENT_PROJECTS.COLLABORATION_APP.NAME,
    unstick: null
  },
  {
    detail: home.CLIENT_PROJECTS.SHIPPING_QUOTES.DETAIL,
    name: home.CLIENT_PROJECTS.SHIPPING_QUOTES.NAME,
    unstick: null
  },
  {
    detail: home.CLIENT_PROJECTS.IE11_DASHBOARD.DETAIL,
    name: home.CLIENT_PROJECTS.IE11_DASHBOARD.NAME,
    unstick: null
  },
  {
    detail: home.CLIENT_PROJECTS.NONPROFIT_SEO.DETAIL,
    name: home.CLIENT_PROJECTS.NONPROFIT_SEO.NAME,
    unstick: null
  },
  {
    detail: home.CLIENT_PROJECTS.REACT_NATIVE_ERP.DETAIL,
    name: home.CLIENT_PROJECTS.REACT_NATIVE_ERP.NAME,
    unstick: null
  },
  {
    detail: home.CLIENT_PROJECTS.CRYPTO_DASHBOARD.DETAIL,
    name: home.CLIENT_PROJECTS.CRYPTO_DASHBOARD.NAME,
    unstick: null
  },
  {
    detail: home.CLIENT_PROJECTS.VILLAGE_TRUSTEE.DETAIL,
    name: home.CLIENT_PROJECTS.VILLAGE_TRUSTEE.NAME,
    unstick: null
  }
];

const monorepoProjects: readonly Project[] = [
  {
    detail: home.MONOREPO_PROJECTS.HOME_PAGE.DETAIL,
    name: home.MONOREPO_PROJECTS.HOME_PAGE.NAME,
    unstick: null
  },
  {
    detail: home.MONOREPO_PROJECTS.AUTH_SERVICE.DETAIL,
    name: home.MONOREPO_PROJECTS.AUTH_SERVICE.NAME,
    unstick: null
  },
  {
    detail: home.MONOREPO_PROJECTS.COURSE_TRACKING.DETAIL,
    name: home.MONOREPO_PROJECTS.COURSE_TRACKING.NAME,
    unstick: null
  },
  {
    detail: home.MONOREPO_PROJECTS.RSS_PIPELINE.DETAIL,
    name: home.MONOREPO_PROJECTS.RSS_PIPELINE.NAME,
    unstick: null
  },
  {
    detail: home.MONOREPO_PROJECTS.AGENTS_BUILD.DETAIL,
    name: home.MONOREPO_PROJECTS.AGENTS_BUILD.NAME,
    unstick: null
  }
];

const Project = ({ detail, name, unstick }: Project) => {
  return (
    <div data-project="">
      <Flex gap="1" direction="column">
        <Text as="p" size="3" data-name="" weight="bold">
          {name}
        </Text>
        <Text as="p" size="3">
          {detail}
        </Text>
        {isNil(unstick) ? null : (
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
          {home.WHAT_IVE_SHIPPED_HEADING}
        </Heading>
        {map(clientProjects, (project) => {
          return <Project key={project.name} {...project} />;
        })}
        {map(monorepoProjects, (project) => {
          return <Project key={project.name} {...project} />;
        })}
      </Flex>
    </Card>
  );
};
