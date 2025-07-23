import { useCopyClipboard } from "@ethang/hooks/use-copy-clipboard.js";
import { Button } from "@heroui/react";
import { CheckIcon, ClipboardCopyIcon } from "lucide-react";

type QaCopyButtonProperties = {
  text: string;
};

export const QaCopyButton = ({ text }: Readonly<QaCopyButtonProperties>) => {
  const { copyToClipboard, isCopied } = useCopyClipboard();

  return (
    <Button
      endContent={
        <span>
          {isCopied && <CheckIcon className="size-5 text-success" />}
          {!isCopied && <ClipboardCopyIcon className="size-5" />}
        </span>
      }
      onPress={() => {
        copyToClipboard(text);
      }}
      isDisabled={isCopied}
      title="Copy to Clipboard"
    >
      Copy to Clipboard
    </Button>
  );
};
