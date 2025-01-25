import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";

export default {
  title: "ui/dialog",
};

export const Default = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-96">
        <DialogHeader>
          <DialogTitle>Hello!</DialogTitle>
          <DialogDescription>Some description here.</DialogDescription>
        </DialogHeader>
        <div>Body content</div>
        <DialogFooter>
          <Button>Click</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
