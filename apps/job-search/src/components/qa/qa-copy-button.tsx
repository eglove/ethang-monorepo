import { useCopyClipboard } from "@ethang/hooks/src/use-copy-clipboard.ts";
import { Button } from "@heroui/react";
import { CheckIcon, ClipboardCopyIcon } from "lucide-react";

type QaCopyButtonProperties = Readonly<{
  text: string;
}>;

export const QaCopyButton = ({ text }: QaCopyButtonProperties) => {
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
