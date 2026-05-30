import { Avatar, Box, Button, Card, Flex, Link, Text } from "@radix-ui/themes";
import { MailIcon } from "lucide-react";

import frontendMastersIcon from "../assets/frontend-masters-icon.png";
import pluralsightIcon from "../assets/pluralsight-icon.png";
import profileImage from "../assets/profile.jpeg";
import { Image } from "./image.tsx";
import { GitHubSvg } from "./svg/github.tsx";
import { LinkedInSvg } from "./svg/linked-in.tsx";

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
            <Link
              aria-label="LinkedIn"
              href="https://www.linkedin.com/in/ethan-glover/"
            >
              <LinkedInSvg className="size-8" />
            </Link>
            <Link aria-label="GitHub" href="https://github.com/eglove">
              <GitHubSvg className="size-8" />
            </Link>
            <Link aria-label="Email" href="mailto:hello@ethang.email">
              <MailIcon className="size-8" />
            </Link>
            <Link href="https://frontendmasters.com/u/ethang/">
              <Image
                className="size-8"
                alt="Frontend Masters"
                src={frontendMastersIcon}
              />
            </Link>
            <Link href="https://app.pluralsight.com/profile/ethan-glover-e9">
              <Image
                alt="Pluralsight"
                className="size-8"
                src={pluralsightIcon}
              />
            </Link>
            <Button asChild>
              <Link
                target="_blank"
                className="border-foreground border-2 px-4 py-2"
                href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7316126013938143232"
              >
                Subscribe to my Newsletter
              </Link>
            </Button>
            <Button asChild variant="surface">
              <Link
                target="_blank"
                href="https://cal.com/ethan-glover/meet"
                className="border-foreground border-2 px-4 py-2"
              >
                Schedule a Meeting
              </Link>
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
};
