import type { SharedSelection } from "@heroui/system";
import type { Key } from "@react-types/shared";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
} from "@heroui/react";
import includes from "lodash/includes";
import { FilterIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { AddEditApplication } from "@/components/add-edit-application/add-edit-application.tsx";
import {
  type ApplicationTableFilter,
  applicationTableStore,
  setSearch,
  useApplicationTableStore,
} from "@/components/job-tracker/table-state.ts";

export const JobTrackerTableFilterHeader = () => {
  const store = useApplicationTableStore();
  const [selectedFilterKeys, setSelectedFilterKeys] = useState(() => {
    const set = new Set<Key>();
    const state = applicationTableStore.get();

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
    applicationTableStore.set((state) => {
      const valueSet = new Set(value);

      setSelectedFilterKeys(valueSet);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      state.tableFilters = [...valueSet] as ApplicationTableFilter;
    });
  };

  return (
    <div className="my-4 flex flex-wrap justify-between gap-2">
      <div className="flex flex-wrap items-center gap-4">
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
        <Dropdown>
          <DropdownTrigger>
            <Button
              startContent={<FilterIcon className="size-3" />}
              variant="bordered"
            >
              Status
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Filters"
            closeOnSelect={false}
            onSelectionChange={handleSelectionChange}
            selectedKeys={selectedFilterKeys}
            selectionMode="multiple"
          >
            <DropdownItem key="noStatus">No Status</DropdownItem>
            <DropdownItem key="interviewing">Interviewing</DropdownItem>
            <DropdownItem key="rejected">Rejected</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      <AddEditApplication>Add Application</AddEditApplication>
    </div>
  );
};
