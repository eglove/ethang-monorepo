import { Avatar, Button, Card, CardBody, Link } from "@heroui/react";
import { MailIcon } from "lucide-react";

import profileImage from "../assets/profile.jpeg";
import { GithubIcon } from "./svg/github-icon.tsx";
import { LinkedinIcon } from "./svg/linkedin-icon.tsx";
import { TypographyH2 } from "./typography/typography-h2.tsx";

export const TopCard = () => {
  return (
    <Card>
      <CardBody>
        <div className="grid grid-cols-[auto_1fr] gap-4">
          <Avatar alt="profile image" className="size-24" src={profileImage} />
          <div className="grid">
            <TypographyH2>Ethan Glover</TypographyH2>
            <div className="my-4 flex flex-wrap items-center gap-4">
              <Link
                isExternal
                className="text-foreground"
                href="https://www.linkedin.com/in/ethan-glover/"
              >
                <LinkedinIcon />
              </Link>
              <Link
                isExternal
                className="text-foreground"
                href="https://github.com/eglove"
              >
                <GithubIcon />
              </Link>
              <Link
                isExternal
                className="text-foreground"
                href="mailto:hello@ethang.email"
              >
                <MailIcon />
              </Link>
              <Button
                isExternal
                as={Link}
                color="primary"
                href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7316126013938143232"
                size="sm"
              >
                Subscribe to my Newsletter
              </Button>
              <Button
                isExternal
                as={Link}
                href="https://cal.com/ethan-glover/meet"
                size="sm"
              >
                Schedule a Meeting
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
