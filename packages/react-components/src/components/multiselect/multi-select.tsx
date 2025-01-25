import { MultiSelectCheck } from "@/components/multiselect/multi-select-check.tsx";
import { MultiSelectOptions } from "@/components/multiselect/multi-select-options.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { cn } from "@/lib/utils.ts";
import filter from "lodash/filter";
import find from "lodash/find";
import flatMap from "lodash/flatMap.js";
import get from "lodash/get";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map.js";
import slice from "lodash/slice";
import { ChevronDown, XCircle, XIcon } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

type MultiSelectProperties = {
  accessorKey?: string | string[];
  labelKey?: string | string[];
  maxCount?: number;
  options: Record<string, Record<string, string>[]> | Record<string, string>[];
  placeholder?: string;
};

export const MultiSelect = ({
  accessorKey = "id",
  labelKey = "value",
  maxCount = 3,
  options,
  placeholder = "Select Option",
}: Readonly<MultiSelectProperties>) => {
  const flatOptions = flatMap(options);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const toggleOption = (value: string) => {
    const newSelectedValues = includes(selectedValues, value)
      ? filter(selectedValues, (_value) => {
          return _value !== value;
        })
      : [...selectedValues, value];

    setSelectedValues(newSelectedValues);
  };

  const handleTogglePopover = () => {
    setIsPopoverOpen((previous) => {
      return !previous;
    });
  };

  const handleClear = () => {
    setSelectedValues([]);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ("Enter" === event.key) {
      setIsPopoverOpen(true);
      // eslint-disable-next-line sonar/elseif-without-else
    } else if ("Backspace" === event.key && !event.currentTarget.value) {
      const newSelectedValues = [...selectedValues];
      newSelectedValues.pop();
      setSelectedValues(newSelectedValues);
    }
  };

  const toggleAll = () => {
    if (selectedValues.length === get(flatOptions, ["length"])) {
      handleClear();
    } else {
      const allValues = map(flatOptions, (option) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return get(option, accessorKey) as string;
      });
      setSelectedValues(allValues);
    }
  };

  return (
    <Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto",
          )}
          onClick={handleTogglePopover}
        >
          {!isEmpty(selectedValues) && (
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-wrap items-center gap-1">
                {map(slice(selectedValues, 0, maxCount), (value) => {
                  const option = find(flatOptions, (o) => {
                    return get(o, accessorKey) === value;
                  });

                  return (
                    <Badge key={value}>
                      {get(option, labelKey)}
                      {/* eslint-disable-next-line a11y/prefer-tag-over-role */}
                      <XCircle
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleOption(value);
                        }}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if ("Enter" === event.key || " " === event.key) {
                            toggleOption(value);
                          }
                        }}
                        className="ml-2 size-4 cursor-pointer"
                        role="button"
                        tabIndex={0}
                      />
                    </Badge>
                  );
                })}
                {selectedValues.length > maxCount && (
                  <Badge className="border-foreground/1 bg-transparent text-black hover:bg-transparent dark:text-white">
                    {`+ ${selectedValues.length - maxCount} more`}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                {/* eslint-disable-next-line a11y/prefer-tag-over-role */}
                <XIcon
                  onClick={(event) => {
                    event.stopPropagation();
                    handleClear();
                  }}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                    if ("Enter" === event.key || " " === event.key) {
                      handleClear();
                    }
                  }}
                  className="mx-2 h-4 cursor-pointer text-black dark:text-white"
                  role="button"
                  tabIndex={0}
                />
                <Separator
                  className="flex h-full min-h-6"
                  orientation="vertical"
                />
                <ChevronDown className="mx-2 h-4 cursor-pointer text-black dark:text-white" />
              </div>
            </div>
          )}
          {isEmpty(selectedValues) && (
            <div className="mx-auto flex w-full items-center justify-between">
              <span className="mx-3 text-sm text-black dark:text-white">
                {placeholder}
              </span>
              <ChevronDown className="mx-2 h-4 cursor-pointer text-black dark:text-white" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onEscapeKeyDown={() => {
          setIsPopoverOpen(false);
        }}
        align="start"
        className="w-auto p-0"
      >
        <Command>
          <CommandInput
            onKeyDown={handleInputKeyDown}
            placeholder="Search..."
          />
          <CommandList>
            <CommandEmpty>NO results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                className="cursor-pointer"
                key="all"
                onSelect={toggleAll}
              >
                <MultiSelectCheck
                  isSelected={
                    selectedValues.length === get(flatOptions, ["length"])
                  }
                />
                <span>(Select All)</span>
              </CommandItem>
              {isArray(options) && (
                <MultiSelectOptions
                  accessorKey={accessorKey}
                  labelKey={labelKey}
                  options={options}
                  selectedValues={selectedValues}
                  toggleOption={toggleOption}
                />
              )}
            </CommandGroup>
            {!isArray(options) &&
              map(options, (group, key) => {
                return (
                  <CommandGroup heading={key}>
                    <MultiSelectOptions
                      accessorKey={accessorKey}
                      labelKey={labelKey}
                      options={group}
                      selectedValues={selectedValues}
                      toggleOption={toggleOption}
                    />
                  </CommandGroup>
                );
              })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
