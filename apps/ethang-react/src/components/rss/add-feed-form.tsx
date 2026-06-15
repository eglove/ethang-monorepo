import { useMutation } from "@apollo/client/react";
import { Box, Button, Card, Flex, TextField } from "@radix-ui/themes";
import isNil from "lodash/isNil";
import noop from "lodash/noop";
import trim from "lodash/trim";
import { type SyntheticEvent, useState } from "react";

import {
  ADD_SUBSCRIPTION,
  GET_FEEDS,
  GET_SUBSCRIPTIONS_WITH_ARTICLES
} from "./queries.ts";

export const AddFeedForm = () => {
  const [addSubscription, { loading: addLoading }] =
    useMutation(ADD_SUBSCRIPTION);

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

    await addSubscription({
      refetchQueries: [
        { query: GET_SUBSCRIPTIONS_WITH_ARTICLES },
        { query: GET_FEEDS }
      ],
      variables: { xmlAddress: cleanUrl }
    });
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
              disabled={addLoading}
              placeholder="Feed XML URL"
              onChange={(event) => {
                setXmlUrl(event.target.value);
              }}
              className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-white transition-colors focus:border-blue-500"
            />
          </Box>
          <Button
            type="submit"
            disabled={addLoading}
            className="cursor-pointer bg-blue-600 font-semibold hover:bg-blue-500"
          >
            Add Feed
          </Button>
        </Flex>
      </form>
    </Card>
  );
};
