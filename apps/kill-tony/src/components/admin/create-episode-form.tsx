import { useStore } from "@ethang/store/use-store";
import {
  addToast,
  Button,
  Input,
  Modal,
  ModalContent,
  NumberInput,
  Select,
  SelectItem,
} from "@heroui/react";
import { useFetch, useSubmit } from "@hyper-fetch/react";
import filter from "lodash/filter.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { DateTime } from "luxon";
import { useState } from "react";

import { createEpisode, getAllAppearances } from "../../clients/hyper-fetch.ts";
import { CreateAppearanceForm } from "./create-appearance-form.tsx";
import { createEpisodeStore } from "./create-episode-store.ts";

export const CreateEpisodeForm = () => {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const { error, submit, submitting } = useSubmit(createEpisode);

  if (!isNil(error)) {
    addToast({
      color: "danger",
      description: "Failed to create episode",
      title: error.name,
    });
  }

  const { formState, isAppearanceModalOpen } = useStore(
    createEpisodeStore,
    (state) => {
      return {
        formState: state.formState,
        isAppearanceModalOpen: state.isAppearanceModalOpen,
      };
    },
  );

  const [selectedAppearances, setSelectedAppearances] = useState(() => {
    return new Set(
      map(formState.appearances, (appearance) => {
        return appearance.name;
      }),
    );
  });

  const { data, loading } = useFetch(getAllAppearances);

  const options =
    isNil(data) || isEmpty(data)
      ? [{ id: "_0", name: "Add" }]
      : [{ id: "_0", name: "Add" }, ...data];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formattedDate = DateTime.fromFormat(
      formState.publishDate,
      "yyyy-MM-dd",
    )
      .toJSDate()
      .toISOString();

    submit({
      payload: {
        ...formState,
        publishDate: formattedDate,
      },
    }).catch(globalThis.console.error);
  };

  return (
    <>
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
        <Select
          onSelectionChange={(keys) => {
            const values = new Set(keys);
            values.delete("_0");
            // @ts-expect-error assume string Set
            setSelectedAppearances(values);

            const found = filter(data, (appearance) => {
              return values.has(appearance.id);
            });

            createEpisodeStore.onChange("appearances", found);
          }}
          disabled={loading}
          isOpen={isSelectOpen}
          label="Appearances"
          onOpenChange={setIsSelectOpen}
          selectedKeys={selectedAppearances}
          selectionMode="multiple"
        >
          {map(options, (appearance) => {
            if ("_0" === appearance.id) {
              return (
                <SelectItem
                  hideSelectedIcon
                  classNames={{ base: "p-0" }}
                  key={appearance.id}
                  textValue="Add New"
                >
                  <Button
                    onPress={() => {
                      setIsSelectOpen(false);
                      createEpisodeStore.toggleAppearanceModal(true);
                    }}
                    className="size-full min-h-8"
                    color="primary"
                  >
                    Add New
                  </Button>
                </SelectItem>
              );
            }

            return (
              <SelectItem key={appearance.id} textValue={appearance.name}>
                {appearance.name}
              </SelectItem>
            );
          })}
        </Select>
        <Button color="primary" isLoading={submitting} type="submit">
          Add Episode
        </Button>
      </form>
      <Modal
        onOpenChange={(value) => {
          createEpisodeStore.toggleAppearanceModal(value);
        }}
        isOpen={isAppearanceModalOpen}
        title="Add Appearance"
      >
        <ModalContent>
          <CreateAppearanceForm />
        </ModalContent>
      </Modal>
    </>
  );
};
