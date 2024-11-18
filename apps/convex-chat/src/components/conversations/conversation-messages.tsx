import { convexQuery } from "@convex-dev/react-query";
import { Avatar } from "@nextui-org/avatar";
import { ScrollShadow } from "@nextui-org/scroll-shadow";
import { useQuery } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map.js";
import { twMerge } from "tailwind-merge";

import { api } from "../../../convex/_generated/api";
import { currentConversation } from "./conversation-list.tsx";

export const ConversationMessages = () => {
  // @ts-expect-error beta
  const messages = useQuery({
    ...convexQuery(
      // @ts-expect-error handled by enabled flag
      api.message.get, { id: currentConversation.get() },
    ),
    enabled: !isEmpty(currentConversation.get()),
  });

  return (
    <ScrollShadow
      hideScrollBar
      className="flex flex-col overflow-y-scroll p-1"
    >
      {map(messages.data, (message) => {
        return (
          <div
            className={twMerge(
              "text-foreground-100 bg-foreground my-1 w-max rounded-lg p-1",
              message.isCurrentUser
                ? "self-end"
                : "self-start",
            )}
            key={message.message._id}
          >
            <div className={twMerge("flex items-center gap-2", message.isCurrentUser && "flex-row-reverse")}>
              <Avatar
                size="sm"
                src={message.senderImage}
              />
              <div className="grid gap-1">
                <div>
                  {message.message.content}
                </div>
                <div className={twMerge("text-xs text-gray-600", message.isCurrentUser
                  ? "text-right"
                  : "text-left")}
                >
                  {new Date(message.message._creationTime)
                    .toLocaleString(undefined, {
                      hour: "numeric",
                      hourCycle: "h24",
                      minute: "numeric",
                    })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </ScrollShadow>
  );
};
