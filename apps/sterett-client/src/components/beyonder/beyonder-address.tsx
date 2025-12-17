import { MapIcon } from "@heroicons/react/24/outline";

export const BeyonderAddress = () => {
  return (
    <div className="flex items-center gap-2">
      <MapIcon width={32} height={32} />
      <div>
        <div>18174 Marina Rd.</div>
        <div>Warsaw, MO 65355</div>
      </div>
    </div>
  );
};
