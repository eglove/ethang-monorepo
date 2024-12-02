import { Command } from "cmdk-solid";
import { createSignal, Show } from "solid-js";

export const CommandPrimitive = () => {
  const [isLoading] = createSignal(false);

  return (
    <Command.Dialog
      open={true}
    >
      <Command.Input
        placeholder="Search..."
      />
      <Command.List>
        <Show when={isLoading()}>
          <Command.Loading>
            Hand on...
          </Command.Loading>
        </Show>
        <Command.Empty>
          No results found.
        </Command.Empty>
        <Command.Group heading="Fruits">
          <Command.Item>
            Apple
          </Command.Item>
          <Command.Item>
            Orange
          </Command.Item>
          <Command.Separator />
          <Command.Item>
            Pear
          </Command.Item>
          <Command.Item>
            Blueberry
          </Command.Item>
        </Command.Group>
        <Command.Item>
          Fish
        </Command.Item>
      </Command.List>
    </Command.Dialog>
  );
};
