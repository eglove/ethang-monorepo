import { gql } from "@ethang/graphql-types/__generated__";
import { rss } from "@ethang/intl/en/rss.ts";
import { Box, Button, Card, Flex, TextField } from "@radix-ui/themes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import isNil from "lodash/isNil";
import noop from "lodash/noop";
import trim from "lodash/trim";
import { type SyntheticEvent, useState } from "react";

import { graphqlRequest } from "../../clients/graphql-client.ts";
import { subscriptionsOptions } from "./queries.ts";

export const AddFeedForm = () => {
  const queryClient = useQueryClient();

  const { isPending: isAddFeedPending, mutateAsync: addSubscription } =
    useMutation({
      mutationFn: async (variables: { xmlAddress: string }) => {
        return graphqlRequest(
          gql(`mutation AddSubscription($xmlAddress: String!) {
            addSubscription(xmlAddress: $xmlAddress) {
                id
            }
        }`),
          variables
        );
      },
      onSuccess: () => {
        queryClient
          .invalidateQueries({ queryKey: subscriptionsOptions().queryKey })
          .catch(noop);
      }
    });

  const [xmlUrl, setXmlUrl] = useState("");

  const handleAddFeed = async (event: SyntheticEvent) => {
    event.preventDefault();
    const cleanUrl = trim(xmlUrl);
    if ("" === cleanUrl) {
      return;
    }

    if (isNil(URL.parse(cleanUrl))) {
      return;
    }

    await addSubscription({ xmlAddress: cleanUrl });
    setXmlUrl("");
  };

  return (
    <Card className="border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
      <form
        onSubmit={(event) => {
          handleAddFeed(event).catch(noop);
        }}
      >
        <Flex gap="3" align="center">
          <Box className="flex-1">
            <TextField.Root
              required
              type="url"
              value={xmlUrl}
              disabled={isAddFeedPending}
              placeholder={rss.FEED_XML_URL}
              onChange={(event) => {
                setXmlUrl(event.target.value);
              }}
              className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-white transition-colors focus:border-blue-500"
            />
          </Box>
          <Button
            type="submit"
            disabled={isAddFeedPending}
            className="cursor-pointer bg-blue-600 font-semibold hover:bg-blue-500"
          >
            {rss.ADD_FEED}
          </Button>
        </Flex>
      </form>
    </Card>
  );
};
