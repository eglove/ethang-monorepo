import { Avatar } from "@nextui-org/avatar";
import { Button } from "@nextui-org/button";
import { SquareArrowLeftIcon } from "lucide-react";

import { currentConversation } from "./conversation-list.tsx";

type ConversationHeaderProperties = {
  email: string | undefined;
  imageUrl: string | undefined;
};

export const ConversationHeader = (
  { email, imageUrl }: Readonly<ConversationHeaderProperties>,
) => {
  return (
    <div className="flex items-center justify-between border-b-2 px-4">
      <Button
        isIconOnly
        onPress={() => {
          currentConversation.set(undefined);
        }}
        className="border-0"
        variant="ghost"
      >
        <SquareArrowLeftIcon size="36" />
      </Button>
      <div className="flex items-center gap-2 px-4 py-2">
        <Avatar
          size="sm"
          src={imageUrl ?? ""}
        />
        <div>
          {email}
        </div>
      </div>
    </div>
  );
};
