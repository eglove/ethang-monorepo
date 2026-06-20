import { forms } from "@ethang/intl/en/forms.ts";
import {
  EnvelopeClosedIcon,
  GitHubLogoIcon,
  LinkedInLogoIcon
} from "@radix-ui/react-icons";
import { Avatar, Box, Button, Card, Flex, Text } from "@radix-ui/themes";

import frontendMastersIcon from "../assets/frontend-masters-icon.png";
import pluralsightIcon from "../assets/pluralsight-icon.png";
import profileImage from "../assets/profile.jpeg";
import { HybridLink } from "./hybrid-link.tsx";
import { Image } from "./image.tsx";

export const ProfileCard = () => {
  return (
    <Card>
      <Flex gap="4" align="center">
        <Avatar size="7" fallback="EG" radius="full" src={profileImage} />
        <Box>
          <Text size="6" weight="bold">
            Ethan Glover
          </Text>
          <Flex gap="4" align="center" className="my-1">
            <HybridLink
              aria-label="LinkedIn"
              href="https://www.linkedin.com/in/ethan-glover/"
            >
              <LinkedInLogoIcon className="size-8" />
            </HybridLink>
            <HybridLink aria-label="GitHub" href="https://github.com/eglove">
              <GitHubLogoIcon className="size-8" />
            </HybridLink>
            <HybridLink aria-label="Email" href="mailto:hello@ethang.email">
              <EnvelopeClosedIcon className="size-8" />
            </HybridLink>
            <HybridLink href="https://frontendmasters.com/u/ethang/">
              <Image
                className="size-8"
                alt="Frontend Masters"
                src={frontendMastersIcon}
              />
            </HybridLink>
            <HybridLink href="https://app.pluralsight.com/profile/ethan-glover-e9">
              <Image
                alt="Pluralsight"
                className="size-8"
                src={pluralsightIcon}
              />
            </HybridLink>
            <Button asChild>
              <HybridLink
                target="_blank"
                className="border-foreground border-2 px-4 py-2"
                href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7316126013938143232"
              >
                {forms.SUBSCRIBE_NEWSLETTER}
              </HybridLink>
            </Button>
            <Button asChild variant="surface">
              <HybridLink
                target="_blank"
                href="https://cal.com/ethan-glover/meet"
                className="border-foreground border-2 px-4 py-2"
              >
                {forms.SCHEDULE_MEETING}
              </HybridLink>
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
};
