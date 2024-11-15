import { MapIcon } from "@heroicons/react/24/outline";

export const BeyonderAddress = () => {
  return (
    <div className="flex items-center gap-2">
      <MapIcon
        height={32}
        width={32}
      />
      <div>
        <div>
          18174 Marina Rd.
        </div>
        <div>
          Warsaw, MO 65355
        </div>
      </div>
    </div>
  );
};
