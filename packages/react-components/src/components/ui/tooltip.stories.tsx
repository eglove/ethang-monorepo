import { Button } from "@/components/ui/button.tsx";
import {
  Tooltip, TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";

export default {
  title: "ui/tooltip",
};

export const Default = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">
            Hover
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Add to library
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
