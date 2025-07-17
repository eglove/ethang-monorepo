import { useMutation } from "@apollo/client";
import { useStore } from "@ethang/store/use-store";
import { addToast, Button, Input, NumberInput } from "@heroui/react";
import { useRouter } from "@tanstack/react-router";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";

import { createEpisode } from "../../graphql/mutations.ts";
import { createEpisodeStore } from "./create-episode-store.ts";

export const CreateEpisodeForm = () => {
  const router = useRouter();
  const [mutate, { error, loading: isMutating }] = useMutation(createEpisode);

  if (!isNil(error)) {
    addToast({
      color: "danger",
      description: "Failed to create episode",
      title: error.name,
    });
  }

  const { formState } = useStore(createEpisodeStore, (state) => {
    return {
      formState: state.formState,
    };
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formattedDate = DateTime.fromFormat(
      formState.publishDate,
      "yyyy-MM-dd",
    )
      .toJSDate()
      .toISOString();

    mutate({
      variables: {
        input: {
          number: formState.number,
          publishDate: formattedDate,
          title: formState.title,
          url: formState.url,
        },
      },
    })
      .then(async () => {
        await router.navigate({ to: "/" });
      })
      .catch(globalThis.console.error);
  };

  return (
    <form className="max-w-sm m-4 grid gap-4" onSubmit={handleSubmit}>
      <NumberInput
        isRequired
        onValueChange={(value) => {
          createEpisodeStore.onChange("number", value);
        }}
        label="Number"
        value={formState.number}
      />
      <Input
        isRequired
        onValueChange={(value) => {
          createEpisodeStore.onChange("title", value);
        }}
        label="Title"
        value={formState.title}
      />
      <Input
        isRequired
        onValueChange={(value) => {
          createEpisodeStore.onChange("url", value);
        }}
        label="URL"
        type="url"
        value={formState.url}
      />
      <Input
        isRequired
        onValueChange={(value) => {
          createEpisodeStore.onChange("publishDate", value);
        }}
        label="Published"
        type="date"
        value={formState.publishDate}
      />
      <Button color="primary" isLoading={isMutating} type="submit">
        Add Episode
      </Button>
    </form>
  );
};
