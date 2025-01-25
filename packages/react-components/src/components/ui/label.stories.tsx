import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";

export default {
  title: "ui/label",
};

export const Default = () => {
  return (
    <div>
      <div className="grid gap-1 space-x-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
      </div>
    </div>
  );
};
