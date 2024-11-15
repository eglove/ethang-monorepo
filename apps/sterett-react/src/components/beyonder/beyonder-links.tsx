import { EnvelopeIcon, LinkIcon, PhoneIcon } from "@heroicons/react/24/outline";

import { Link } from "../link";

export const BeyonderLinks = () => {
  return (
    <div className="mx-4 flex flex-col flex-wrap gap-4 sm:flex-row">
      <div className="flex items-center gap-2">
        <LinkIcon
          height={20}
          width={20}
        />
        <Link
          className="underline"
          href="https://beyondercamp.com/sterett-creek-warsaw-mo/"
          target="_blank"
        >
          BeyonderCamp.com
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <EnvelopeIcon
          height={20}
          width={20}
        />
        <Link
          className="underline"
          href="mailto:chris@beyondercamp.com"
        >
          chris@beyondercamp.com
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <PhoneIcon
          height={20}
          width={20}
        />
        <Link
          className="underline"
          href="tel:8804382280"
        >
          880.438.2280
        </Link>
      </div>
    </div>
  );
};
