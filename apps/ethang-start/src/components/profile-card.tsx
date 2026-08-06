import { Avatar, Card, Link } from "@astryxdesign/core";
import {
  EnvelopeClosedIcon,
  GitHubLogoIcon,
  LinkedInLogoIcon
} from "@radix-ui/react-icons";

import frontendMastersIcon from "../assets/frontend-masters-icon.png";
import pluralsightIcon from "../assets/pluralsight-icon.png";
import profileImage from "../assets/profile.jpeg";

export const ProfileCard = () => {
  return (
    <Card padding={4} width="100%">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar size="xl" src={profileImage} name="Ethan Glover" />
        <div>
          <span className="m-1 text-xl font-bold">Ethan Glover</span>
          <div className="my-1 flex flex-wrap items-center gap-4">
            <Link
              target="_blank"
              aria-label="LinkedIn"
              href="https://www.linkedin.com/in/ethan-glover/"
            >
              <LinkedInLogoIcon className="size-8" />
            </Link>
            <Link
              target="_blank"
              aria-label="GitHub"
              href="https://github.com/eglove"
            >
              <GitHubLogoIcon className="size-8" />
            </Link>
            <Link
              target="_blank"
              aria-label="Email"
              href="mailto:hello@ethang.email"
            >
              <EnvelopeClosedIcon className="size-8" />
            </Link>
            <Link target="_blank" href="https://frontendmasters.com/u/ethang/">
              <img
                className="size-8"
                alt="Frontend Masters"
                src={frontendMastersIcon}
              />
            </Link>
            <Link
              target="_blank"
              href="https://app.pluralsight.com/profile/ethan-glover-e9"
            >
              <img alt="Pluralsight" className="size-8" src={pluralsightIcon} />
            </Link>
            <Link
              target="_blank"
              href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7316126013938143232"
            >
              Subscribe to my Newsletter
            </Link>
            <Link
              target="_blank"
              href="https://calendar.proton.me/u/2/bookings#10S2zo5jm_rTCXVDnyi55vEBS9HN8Cam4w3HxHr5Omg="
            >
              Schedule a Meeting
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};
