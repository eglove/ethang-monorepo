import type { AvatarProps } from "@nextui-org/avatar";

import { User } from "@nextui-org/user";
import shuffle from "lodash/shuffle";

import type { GetTrusteesReturn } from "../sanity/queries/get-trustees.ts";

import { sanityImage } from "../clients/sanity/sanity-client.ts";
import { Link } from "./link.tsx";

type TrusteeProperties = {
  readonly index: number;
  readonly trustee: GetTrusteesReturn[0];
};

const IMAGE_SIZE = 128;

export const Trustee = ({ index, trustee }: TrusteeProperties) => {
  const colorValues: AvatarProps["color"][] = shuffle([
    "warning",
    "secondary",
    "danger",
    "primary",
    "success",
  ]);

  const imageUrl = sanityImage
    .image(trustee.image.asset.url)
    .height(IMAGE_SIZE)
    .width(IMAGE_SIZE)
    .format("webp")
    .url();

  return (
    <div
      className="mb-4 w-full gap-4 border-b-2 pb-4"
      key={trustee._id}
    >
      <User
        avatarProps={{
          className: "w-32 h-32",
          color: colorValues[index] ?? "default",
          isBordered: true,
          size: "lg",
          src: imageUrl,
        }}
        description={
          <>
            <p>
              <Link
                className="text-black underline"
                href={`tel:${trustee.phoneNumber}`}
              >
                {trustee.phoneNumber}
              </Link>
            </p>
            <p className="text-small text-foreground-800">
              {trustee.duties}
            </p>
          </>
        }
        className="gap-4"
        name={trustee.name}
      />
    </div>
  );
};
