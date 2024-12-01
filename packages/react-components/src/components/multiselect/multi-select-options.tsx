import {
  MultiSelectCheck,
} from "@/components/multiselect/multi-select-check.tsx";
import { CommandItem } from "@/components/ui/command.tsx";
import get from "lodash/get";
import includes from "lodash/includes";
import map from "lodash/map";

type MultiSelectOptionsProperties = {
  accessorKey?: string | string[];
  labelKey?: string | string[];
  options: Record<string, string>[];
  selectedValues: string[];
  toggleOption: (value: string) => void;
};

export const MultiSelectOptions = ({
  accessorKey = "id",
  labelKey = "value",
  options,
  selectedValues,
  toggleOption,
}: Readonly<MultiSelectOptionsProperties>) => {
  return (
    <>
      {map(options, (option) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const optionKey = get(option, accessorKey) as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const label = get(option, labelKey) as string;
        const isSelected = includes(selectedValues, optionKey);

        return (
          <CommandItem
            onSelect={() => {
              toggleOption(optionKey);
            }}
            className="cursor-pointer"
            key={optionKey}
          >
            <MultiSelectCheck isSelected={isSelected} />
            <span>
              {label}
            </span>
          </CommandItem>
        );
      })}
    </>
  );
};
