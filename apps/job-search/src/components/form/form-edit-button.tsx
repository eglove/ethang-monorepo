import { Button } from "@/components/ui/button.tsx";
import { CheckIcon, Trash2Icon, XIcon } from "lucide-react";
import { type PropsWithChildren, useState } from "react";

type DeleteButtonProperties = Readonly<
  PropsWithChildren<{
    handleDelete: () => void;
  }>
>;

export const FormEditButton = ({
  children,
  handleDelete,
}: DeleteButtonProperties) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    setIsConfirming(true);
  };

  const handleCancel = () => {
    setIsConfirming(false);
  };

  const handleDeleteInternal = () => {
    handleDelete();
    setIsConfirming(false);
  };

  if (isConfirming) {
    return (
      <div className="flex gap-2">
        <Button
          aria-label="Cancel"
          onClick={handleCancel}
          size="icon"
          title="Cancel"
          variant="secondary"
        >
          <XIcon />
        </Button>
        <Button
          aria-label="Confirm Delete"
          onClick={handleDeleteInternal}
          size="icon"
          title="Confirm Delete"
          variant="destructive"
        >
          <CheckIcon />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {children}
      <Button
        aria-label="Delete"
        onClick={handleConfirm}
        size="icon"
        title="Delete"
        variant="destructive"
      >
        <Trash2Icon />
      </Button>
    </div>
  );
};
