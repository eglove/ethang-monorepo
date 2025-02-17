import type { SharedSelection } from "@heroui/system";
import type { Key } from "@react-types/shared";

import {
  applicationFormStore,
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
import { FilterIcon, XIcon } from "lucide-react";
import { useState } from "react";

export const JobTrackerTableFilterHeader = () => {
  const store = useApplicationFormStore();
  const [selectedFilterKeys, setSelectedFilterKeys] = useState(() => {
    const set = new Set<Key>();
    const state = applicationFormStore.get();

    if (state.isShowingInterviewing) {
      set.add("interviewing");
    }

    if (state.isShowingRejected) {
      set.add("rejected");
    }

    if (state.isShowingNoStatus) {
      set.add("noStatus");
    }

    return set;
  });

  const handleSelectionChange = (value: SharedSelection) => {
    const set = new Set(value);

    applicationFormStore.set((state) => {
      state.isShowingInterviewing = set.has("interviewing");
      state.isShowingRejected = set.has("rejected");
      state.isShowingNoStatus = set.has("noStatus");
    });

    setSelectedFilterKeys(set);
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
