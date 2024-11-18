import { convexQuery } from "@convex-dev/react-query";
import { useSelector } from "@legendapp/state/react";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import { twMerge } from "tailwind-merge";

import { api } from "../../convex/_generated/api";
import { ConversationHeader } from "../components/conversations/conversation-header.tsx";
import { ConversationInput } from "../components/conversations/conversation-input.tsx";
import { ConversationList, currentConversation } from "../components/conversations/conversation-list.tsx";
import { ConversationMessages } from "../components/conversations/conversation-messages.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";

const Conversations = () => {
  const conversationId = useSelector(() => {
    return currentConversation.get();
  });

  // @ts-expect-error beta
  const conversation = useQuery({
    ...convexQuery(api.conversation.get, {
      // @ts-expect-error handled by enabled
      id: conversationId,
    }),
    enabled: !isEmpty(conversationId),
  });

  return (
    <MainLayout>
      <div className="grid-cols-auto-1fr m-2 grid gap-2">
        <div className={twMerge("h-96 flex flex-col", isEmpty(conversationId) && "border-2")}>
          <ConversationList />
        </div>
        <div className="h-96 border-2">
          {!isNil(conversation.data) && (
            <div className="grid-rows-auto-1fr-auto grid h-full">
              <ConversationHeader
                email={conversation.data.otherMember.email}
                imageUrl={conversation.data.otherMember.imageUrl}
              />
              <ConversationMessages />
              <ConversationInput />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/conversations")({
  component: Conversations,
});
