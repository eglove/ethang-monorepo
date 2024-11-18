import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { Avatar } from "@nextui-org/avatar";
import { Button } from "@nextui-org/button";
import { Spinner } from "@nextui-org/spinner";
import { useMutation, useQuery } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map";
import { CheckIcon, XIcon } from "lucide-react";

import { api } from "../../../convex/_generated/api";

export const FriendRequests = () => {
  // @ts-expect-error beta
  const invites = useQuery(convexQuery(api.request.get, {}));
  const accept = useMutation({
    mutationFn: useConvexMutation(api.request.accept),
  });
  const reject = useMutation({
    mutationFn: useConvexMutation(api.request.reject),
  });

  return (
    <div className="m-4">
      <h1 className="my-4 text-center text-2xl font-bold">
        Friend Requests
      </h1>
      {(invites.isPending as boolean) && (
        <div className="grid place-items-center">
          <Spinner />
        </div>
      )}
      {isEmpty(invites.data) && (
        <p className="text-center">
          No Friend Requests
        </p>
      )}
      {map(invites.data, (invite) => {
        return (
          <div
            className="border-primary flex flex-wrap justify-between gap-4 border-2 p-4"
            key={invite.request._id}
          >
            <div className="flex items-center gap-4">
              <Avatar src={invite.sender.imageUrl} />
              <div>
                {invite.sender.email}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                onPress={() => {
                  accept.mutate({ id: invite.request._id });
                }}
                aria-label="Accept"
                color="primary"
                isLoading={accept.isPending}
              >
                <CheckIcon />
              </Button>
              <Button
                isIconOnly
                onPress={() => {
                  reject.mutate({ id: invite.request._id });
                }}
                aria-label="Reject"
                color="danger"
                isLoading={reject.isPending}
              >
                <XIcon />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
