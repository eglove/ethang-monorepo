import type { PropsWithChildren } from "react";

import { Image, Link } from "@heroui/react";

import killTonyImage from "../../assets/killtony.jpg";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <div className="grid gap-4 m-4">
      <Link className="flex gap-4 items-center mx-auto my-4" href="/">
        <Image className="size-20" src={killTonyImage} />
        <h1 className="font-bold text-5xl">KillTony</h1>
      </Link>
      {children}
    </div>
  );
};
