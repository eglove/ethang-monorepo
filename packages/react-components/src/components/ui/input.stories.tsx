import { Input } from "@/components/ui/input.tsx";

export default {
  title: "ui/input",
};

export const Default = () => {
  return (
    <Input
      placeholder="Email"
      type="email"
    />
  );
};
