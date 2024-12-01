import { Skeleton } from "@/components/ui/skeleton.tsx";

export default {
  title: "ui/skeleton",
};

export const Default = () => {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-4 w-80" />
      </div>
    </div>
  );
};
