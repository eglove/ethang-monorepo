import { useMutation } from "@apollo/client";
import { useStore } from "@ethang/store/use-store";
import { addToast, Button, Checkbox, Input } from "@heroui/react";
import isNil from "lodash/isNil.js";

import { apolloClient } from "../../clients/apollo.ts";
import { addAppearanceToEpisode } from "../../graphql/mutations.ts";
import { getAppearances, getEpisode } from "../../graphql/queries.ts";
import { addAppearanceStore } from "./add-appearance-store.ts";

type AddAppearanceFormProperties = {
  episodeNumber?: number;
  onClose: () => void;
};

export const AddAppearanceForm = ({
  episodeNumber,
  onClose,
}: Readonly<AddAppearanceFormProperties>) => {
  const [mutate, { error, loading }] = useMutation(addAppearanceToEpisode);

  const { formState } = useStore(addAppearanceStore, (state) => {
    return {
      formState: state.formState,
    };
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const promise = mutate({
      variables: {
        input: {
          isBucketPull: formState.isBucketPull,
          isGoldenTicketCashIn: formState.isGoldenTicketCashIn,
          isGuest: formState.isGuest,
          isRegular: formState.isRegular,
          name: formState.name,
          number: episodeNumber,
        },
      },
    });

    promise
      .then(async () => {
        await apolloClient.refetchQueries({
          include: [getEpisode, getAppearances],
        });
        onClose();
        addAppearanceStore.clearForm();
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
    <>
      <p className="px-4 py-2">Episode: {episodeNumber}</p>
      <form className="max-w-sm m-4 grid gap-4" onSubmit={handleSubmit}>
        <Input
          isRequired
          onValueChange={(value) => {
            addAppearanceStore.onChange("name", value);
          }}
          label="Name"
          value={formState.name}
        />
        <div className="flex gap-4 flex-wrap">
          <Checkbox
            onValueChange={(value) => {
              addAppearanceStore.onChange("isGuest", value);
            }}
            isSelected={formState.isGuest}
          >
            Guest
          </Checkbox>
          <Checkbox
            onValueChange={(value) => {
              addAppearanceStore.onChange("isRegular", value);
            }}
            isSelected={formState.isRegular}
          >
            Regular
          </Checkbox>
          <Checkbox
            onValueChange={(value) => {
              addAppearanceStore.onChange("isBucketPull", value);
            }}
            isSelected={formState.isBucketPull}
          >
            Bucket Pull
          </Checkbox>
          <Checkbox
            onValueChange={(value) => {
              addAppearanceStore.onChange("isGoldenTicketCashIn", value);
            }}
            isSelected={formState.isGoldenTicketCashIn}
          >
            Golden Ticket Cash In
          </Checkbox>
          <Checkbox
            onValueChange={(value) => {
              addAppearanceStore.onChange("isHallOfFame", value);
            }}
            isSelected={formState.isHallOfFame}
          >
            Hall of Fame
          </Checkbox>
        </div>
        <Button color="primary" isLoading={loading} type="submit">
          Add
        </Button>
      </form>
    </>
  );
};
