import { useStore } from "@ethang/store/use-store";
import { addToast, Button, Checkbox, Input } from "@heroui/react";
import { useSubmit } from "@hyper-fetch/react";
import isNil from "lodash/isNil.js";

import {
  addAppearanceToEpisode,
  createAppearance,
  getAllAppearances,
  getAllEpisodes,
  hyperFetchClient,
} from "../../clients/hyper-fetch.ts";
import { createAppearanceStore } from "./create-appearance-store.ts";
import { createEpisodeStore } from "./create-episode-store.ts";

type CreateAppearanceFormProperties = {
  episodeNumber?: number;
};

export const CreateAppearanceForm = ({
  episodeNumber,
}: Readonly<CreateAppearanceFormProperties>) => {
  const { error, submit, submitting } = useSubmit(
    isNil(episodeNumber) ? createAppearance : addAppearanceToEpisode,
  );

  const { formState } = useStore(createAppearanceStore, (state) => {
    return {
      formState: state.formState,
    };
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const promise = isNil(episodeNumber)
      ? submit({ payload: formState })
      : submit({
          payload: { appearance: formState, number: episodeNumber },
        });

    promise
      .then(() => {
        hyperFetchClient.cache.invalidate(getAllAppearances.cacheKey);
        hyperFetchClient.cache.invalidate(getAllEpisodes.cacheKey);
        createEpisodeStore.toggleAppearanceModal(false);
      })
      .catch(globalThis.console.error);
  };

  if (!isNil(error)) {
    addToast({
      color: "danger",
      description: "Failed to create appearance",
      title: error.name,
    });
  }

  return (
    <form className="max-w-sm m-4 grid gap-4" onSubmit={handleSubmit}>
      <Input
        isRequired
        onValueChange={(value) => {
          createAppearanceStore.onChange("name", value);
        }}
        label="Name"
        value={formState.name}
      />
      <div className="flex gap-4 flex-wrap">
        <Checkbox
          onValueChange={(value) => {
            createAppearanceStore.onChange("isGuest", value);
          }}
          isSelected={formState.isGuest}
        >
          Guest
        </Checkbox>
        <Checkbox
          onValueChange={(value) => {
            createAppearanceStore.onChange("isRegular", value);
          }}
          isSelected={formState.isRegular}
        >
          Regular
        </Checkbox>
        <Checkbox
          onValueChange={(value) => {
            createAppearanceStore.onChange("isBucketPull", value);
          }}
          isSelected={formState.isBucketPull}
        >
          Bucket Pull
        </Checkbox>
        <Checkbox
          onValueChange={(value) => {
            createAppearanceStore.onChange("isGoldenTicketWinner", value);
          }}
          isSelected={formState.isGoldenTicketWinner}
        >
          Golden Ticket Winner
        </Checkbox>
        <Checkbox
          onValueChange={(value) => {
            createAppearanceStore.onChange("isHallOfFame", value);
          }}
          isSelected={formState.isHallOfFame}
        >
          Hall of Fame
        </Checkbox>
      </div>
      <Button color="primary" isLoading={submitting} type="submit">
        Add
      </Button>
    </form>
  );
};
