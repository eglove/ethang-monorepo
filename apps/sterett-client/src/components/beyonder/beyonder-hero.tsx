import { Image } from "@heroui/react";
import toUpper from "lodash/toUpper";

export const BeyonderHero = () => {
  return (
    <div className="mx-4 mt-4 grid place-items-center">
      <Image
        width={32}
        height={32}
        alt="Beyonder Camp"
        src="/images/beyonder.png"
      />
      <h2 className="text-lg font-bold sm:text-xl">Beyonder</h2>
      <h3 className="text-2xl font-bold sm:text-3xl">
        {toUpper("Christopher Hawn")}
      </h3>
      <h4 className="text-xl sm:text-2xl">General Manager</h4>
      <h4 className="text-lg sm:text-xl">BEYONDER Marine at Sterett Creek</h4>
    </div>
  );
};
