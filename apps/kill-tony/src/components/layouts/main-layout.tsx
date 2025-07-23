import type { PropsWithChildren } from "react";

import { Image, Link } from "@heroui/react";

import killTonyImage from "../../assets/killtony.jpg";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <div className="m-4 grid gap-4">
      <Link className="mx-auto my-4 flex items-center gap-4" href="/">
        <Image className="size-20" src={killTonyImage} />
        <h1 className="text-5xl font-bold">KillTony</h1>
      </Link>
      {children}
    </div>
  );
};
