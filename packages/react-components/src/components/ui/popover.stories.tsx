import { Button } from "@/components/ui/button.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";

export default {
  title: "ui/popover",
};

export const Default = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          Open
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        Popover content
      </PopoverContent>
    </Popover>
  );
};
