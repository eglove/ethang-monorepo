import { Button } from "@/components/ui/button.tsx";

export default {
  title: "ui/button",
};

export const Variants = () => {
  return (
    <div className="grid w-96 gap-4">
      <Button>
        Default
      </Button>
      <Button variant="destructive">
        Destructive
      </Button>
      <Button variant="ghost">
        Ghost
      </Button>
      <Button variant="link">
        Link
      </Button>
      <Button variant="outline">
        Outline
      </Button>
      <Button variant="secondary">
        Secondary
      </Button>
    </div>
  );
};

export const Sizes = () => {
  return (
    <div className="grid w-96 gap-4">
      <Button>
        Default
      </Button>
      <Button size="icon">
        Icon
      </Button>
      <Button size="lg">
        Large
      </Button>
      <Button size="sm">
        Small
      </Button>
    </div>
  );
};
