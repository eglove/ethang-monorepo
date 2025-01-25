import { Badge } from "@/components/ui/badge.tsx";

export default {
  title: "ui/badge",
};

export const Variants = () => {
  return (
    <div className="grid w-96 gap-4">
      <Badge>Default</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="secondary">Secondary</Badge>
    </div>
  );
};
