import { Image } from "../../image.tsx";
import { Button } from "../button/button.tsx";
import { EmailSvg } from "../svg/email.tsx";
import { GitHubSvg } from "../svg/github.tsx";
import { LinkedInSvg } from "../svg/linked-in.tsx";
import { Link } from "../typography/link.tsx";

export const ProfileCard = async () => {
  return (
    <div class="flex flex-col items-center rounded-lg border border-slate-600 bg-slate-800 p-6 shadow-[0_6px_24px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)] md:flex-row">
      <img
        width={200}
        height={200}
        alt="Ethan Glover profile"
        src="/images/profile.jpeg"
        class="mb-4 size-24 rounded-full object-cover"
      />
      <div class="grid p-4">
        <h1 class="mb-2 font-heading text-2xl font-bold tracking-tight text-slate-100">
          Ethan Glover
        </h1>
        <div class="my-4 flex flex-wrap items-center gap-4">
          <Link
            aria-label="LinkedIn"
            href="https://www.linkedin.com/in/ethan-glover/"
          >
            <LinkedInSvg />
          </Link>
          <Link aria-label="GitHub" href="https://github.com/eglove">
            <GitHubSvg />
          </Link>
          <Link aria-label="Email" href="mailto:hello@ethang.email">
            <EmailSvg />
          </Link>
          <Link href="https://frontendmasters.com/u/ethang/">
            <Image
              width={32}
              height={32}
              containerWidth={28}
              alt="Frontend Masters"
              src="/images/frontend-masters-icon.png"
            />
          </Link>
          <Link href="https://app.pluralsight.com/profile/ethan-glover-e9">
            <Image
              width={48}
              height={48}
              alt="Pluralsight"
              containerWidth={24}
              src="/images/pluralsight-icon.png"
            />
          </Link>
          <Button
            as="a"
            size="xs"
            type="button"
            href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7316126013938143232"
          >
            Subscribe to my Newsletter
          </Button>
          <Button
            as="a"
            size="xs"
            type="button"
            variant="secondary"
            href="https://cal.com/ethan-glover/meet"
          >
            Schedule a Meeting
          </Button>
        </div>
      </div>
    </div>
  );
};
