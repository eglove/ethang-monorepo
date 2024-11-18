import { convexQuery } from "@convex-dev/react-query";
import { Badge } from "@nextui-org/badge";
import { Button } from "@nextui-org/button";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@nextui-org/dropdown";
import { useQuery } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { BellIcon, UsersRoundIcon } from "lucide-react";

import { api } from "../../../convex/_generated/api";

export const Notifications = () => {
  // @ts-expect-error beta
  const { data } = useQuery(convexQuery(api.request.count, {}));

  const hasRequests = !isNil(data) && 0 < data;

  return (
    <Dropdown>
      <Badge
        color="secondary"
        content={data}
      >
        <DropdownTrigger>
          <Button
            isIconOnly
            className="border-none"
            size="sm"
            variant="ghost"
          >
            <BellIcon />
          </Button>
        </DropdownTrigger>
      </Badge>
      <DropdownMenu>
        {hasRequests
          ? (
            <DropdownItem
              href="/friends"
              textValue={`${data} friend requests(s)`}
            >
              <div className="flex items-center gap-2">
                <UsersRoundIcon className="size-4" />
                {data}
                {" "}
                friend request(s)
              </div>
            </DropdownItem>
          )
          : (
            <DropdownItem>
              No notifications
            </DropdownItem>
          )}
      </DropdownMenu>
    </Dropdown>
  );
};
