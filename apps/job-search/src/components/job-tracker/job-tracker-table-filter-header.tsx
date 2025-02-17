import type { SharedSelection } from "@heroui/system";
import type { Key } from "@react-types/shared";

import {
  applicationFormStore,
  type ApplicationTableFilter,
  setSearch,
  useApplicationFormStore,
} from "@/components/job-tracker/table-state.ts";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
} from "@heroui/react";
import { Link } from "@tanstack/react-router";
import includes from "lodash/includes";
import { FilterIcon, XIcon } from "lucide-react";
import { useState } from "react";

export const JobTrackerTableFilterHeader = () => {
  const store = useApplicationFormStore();
  const [selectedFilterKeys, setSelectedFilterKeys] = useState(() => {
    const set = new Set<Key>();
    const state = applicationFormStore.get();

    if (includes(state.tableFilters, "interviewing")) {
      set.add("interviewing");
    }

    if (includes(state.tableFilters, "rejected")) {
      set.add("rejected");
    }

    if (includes(state.tableFilters, "noStatus")) {
      set.add("noStatus");
    }

    return set;
  });

  const handleSelectionChange = (value: SharedSelection) => {
    applicationFormStore.set((state) => {
      const valueSet = new Set(value);

      setSelectedFilterKeys(valueSet);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      state.tableFilters = [...valueSet] as ApplicationTableFilter;
    });
  };

  return (
    <div className="flex flex-wrap justify-between my-4 gap-2">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-1">
          <Input
            endContent={
              <Button
                isIconOnly
                onPress={() => {
                  setSearch("");
                }}
                size="sm"
                variant="light"
              >
                <XIcon />
              </Button>
            }
            onValueChange={(value) => {
              setSearch(value);
            }}
            placeholder="Search"
            value={store.search}
          />
        </div>
        <Dropdown className="dark text-foreground">
          <DropdownTrigger>
            <Button
              startContent={<FilterIcon className="size-3" />}
              variant="bordered"
            >
              Filters
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Filters"
            closeOnSelect={false}
            onSelectionChange={handleSelectionChange}
            selectedKeys={selectedFilterKeys}
            selectionMode="multiple"
          >
            <DropdownItem key="noStatus">Show No Status</DropdownItem>
            <DropdownItem key="interviewing">Show Interviewing</DropdownItem>
            <DropdownItem key="rejected">Show Rejected</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      <Button as={Link} color="primary" to="/upsert-application">
        Add Application
      </Button>
    </div>
  );
};
