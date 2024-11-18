import { convexQuery } from "@convex-dev/react-query";
import { observable } from "@legendapp/state";
import { Avatar } from "@nextui-org/avatar";
import { Button } from "@nextui-org/button";
import { useQuery } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import map from "lodash/map";

import type { Id } from "../../../convex/_generated/dataModel";

import { api } from "../../../convex/_generated/api";

export const currentConversation = observable<Id<"conversations">>();

export const ConversationList = () => {
  // @ts-expect-error beta
  const conversations = useQuery(convexQuery(api.conversations.get, {}));

  if (!isEmpty(currentConversation.get())) {
    return null;
  }

  return (
    <>
      {map(conversations.data, (conversation) => {
        if (
          conversation.conversation.isGroup ||
          isNil(conversation.otherMember)
        ) {
          return null;
        }

        return (
          <Button
            onPress={() => {
              currentConversation.set(conversation.conversation._id);
            }}
            className="justify-start rounded-none border-b-2"
            key={conversation.conversation._id}
            size="lg"
          >
            <Avatar
              size="sm"
              src={conversation.otherMember.imageUrl}
            />
            <div>
              {conversation.otherMember.email}
            </div>
          </Button>
        );
      })}
    </>
  );
};
