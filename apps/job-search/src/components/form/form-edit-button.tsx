import { Button } from "@heroui/react";
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
          isIconOnly
          aria-label="Cancel"
          color="primary"
          onPress={handleCancel}
          size="sm"
          title="Cancel"
        >
          <XIcon className="size-4" />
        </Button>
        <Button
          isIconOnly
          aria-label="Confirm Delete"
          color="danger"
          onPress={handleDeleteInternal}
          size="sm"
          title="Confirm Delete"
        >
          <CheckIcon className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {children}
      <Button
        isIconOnly
        aria-label="Delete"
        color="danger"
        onPress={handleConfirm}
        size="sm"
        title="Delete"
      >
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  );
};
