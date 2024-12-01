import { cn } from "@/lib/utils.ts";
import { CheckIcon } from "lucide-react";

type MultiSelectCheckProperties = {
  isSelected: boolean;
};

export const MultiSelectCheck = ({
  isSelected,
}: Readonly<MultiSelectCheckProperties>) => {
  return (
    <div
      className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected
        ? "bg-primary text-black dark:text-white"
        : "opacity-50 [&_svg]:invisible")}
    >
      <CheckIcon className="size-4" />
    </div>
  );
};
