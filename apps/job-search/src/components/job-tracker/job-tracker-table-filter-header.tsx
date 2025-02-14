import {
  applicationFormStore,
  setCompanyFilter,
  toggleIsShowingInterviewing,
  toggleIsShowingNoStatus,
  toggleIsShowingRejected,
} from "@/components/job-tracker/table-state.ts";
import { Button, Checkbox, Input } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { XIcon } from "lucide-react";

export const JobTrackerTableFilterHeader = () => {
  const store = useStore(applicationFormStore);

  return (
    <div className="flex justify-between my-4">
      <div className="flex gap-4 items-center">
        <Checkbox
          isSelected={store.isShowingNoStatus}
          onValueChange={toggleIsShowingNoStatus}
        >
          Show No Status
        </Checkbox>
        <Checkbox
          isSelected={store.isShowingInterviewing}
          onValueChange={toggleIsShowingInterviewing}
        >
          Show Interviewing
        </Checkbox>
        <Checkbox
          isSelected={store.isShowingRejected}
          onValueChange={toggleIsShowingRejected}
        >
          Show Rejected
        </Checkbox>
        <div className="flex gap-1">
          <Input
            endContent={
              <Button
                isIconOnly
                onPress={() => {
                  setCompanyFilter("");
                }}
                size="sm"
                variant="light"
              >
                <XIcon />
              </Button>
            }
            onValueChange={(value) => {
              setCompanyFilter(value);
            }}
            placeholder="Filter by Company"
            value={store.companyFilter}
          />
        </div>
      </div>
      <Button as={Link} color="primary" to="/upsert-application">
        Add Application
      </Button>
    </div>
  );
};
