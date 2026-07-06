import { rss } from "@ethang/intl/en/rss.ts";
import { Button, Dialog, Flex } from "@radix-ui/themes";

type UnsubscribeDialogProperties = {
  feedTitle: string;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const UnsubscribeDialog = (properties: UnsubscribeDialogProperties) => {
  const { feedTitle, isOpen, isPending, onClose, onConfirm } = properties;
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>{rss.UNSUBSCRIBE_CONFIRM_TITLE}</Dialog.Title>
        <Dialog.Description mb="4" size="2">
          {feedTitle}
        </Dialog.Description>
        <Flex mt="4" gap="3" justify="end">
          <Dialog.Close disabled={isPending}>
            <Button
              color="gray"
              type="button"
              variant="soft"
              disabled={isPending}
            >
              Cancel
            </Button>
          </Dialog.Close>
          <Button
            color="red"
            type="button"
            onClick={onConfirm}
            disabled={isPending}
          >
            {rss.UNSUBSCRIBE}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
